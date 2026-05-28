import { useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import Select from "react-select";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import Loader from "../../components/LoaderFullScreen/Loader";
import BtnGeneral from "../../components/BtnGeneral/BtnGeneral";
import { TableComisiones } from "../../components/Comisiones/TablaComisiones";
import ModalLiquidaciones from "../../components/Comisiones/Components/Modal/ModalLiquidaciones";
import ModalLiquidacionesFreelance from "../../components/Comisiones/Components/Modal/ModalLiquidacionesFreelance";
import { getPolizas } from "../../services/Polizas/getPolizas";
import { getPolizasExternos } from "../../services/Polizas/getPolizasExternos";
import { syncRetomaSettlementPolizas } from "../../services/Settlements/syncRetomaSettlementPolizas";
import { syncRetomaSettlementPolizasExterno } from "../../services/Settlements/syncRetomaSettlementPolizasExterno";
import { getSettlement } from "../../services/Settlements/getSettlement";
import { removeSettlementPoliza } from "../../services/Settlements/removeSettlementPoliza";
import { removeSettlementPolizaExterno } from "../../services/Settlements/removeSettlementPolizaExterno";
import { getUnidadesNegocio } from "../../services/Polizas/getUnidadNegocio";
import { getAsesoresSGA } from "../../services/Users/getAsesoresSGA";
import { obtenerAseguradoras, obtenerRamo } from "../../utils/aseguradoras";
import { getTiposPoliza } from "../../services/Polizas/getTiposPoliza";
import { getAllSMMLV } from "../../services/Comisiones/getAllSMMLV";
import { getAllRet } from "../../services/Comisiones/getAllRet";

const SMMLV_2026 = 1750905;
const THRESHOLD_PRIMA = SMMLV_2026 * 8;
const DEFAULT_TAX_RATE = 12;

const nfCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const formatCOP = (value) => nfCOP.format(Number(value || 0));

const toNumberCOP = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value ?? "").trim();
  if (!text) return 0;
  return (
    Number(
      text
        .replace(/[^\d.,-]/g, "")
        .replace(/\./g, "")
        .replace(",", "."),
    ) || 0
  );
};

const normalizeText = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const toInputDate = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m}-${d}`;
  }

  const latamMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (latamMatch) {
    const [, d, m, y] = latamMatch;
    return `${y}-${m}-${d}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const getExpeditionDateRange = (rows = []) => {
  const dates = rows
    .map((row) => toInputDate(row?.fecha_expedicion))
    .filter(Boolean)
    .sort();

  if (!dates.length) {
    return { from: "", to: "" };
  }

  const toStartOfMonth = (dateStr) => {
    const [yearStr, monthStr] = String(dateStr).split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!year || !month) return dateStr;
    return `${yearStr}-${monthStr}-01`;
  };

  const toEndOfMonth = (dateStr) => {
    const [yearStr, monthStr] = String(dateStr).split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!year || !month) return dateStr;

    const endDate = new Date(year, month, 0);
    const endDay = String(endDate.getDate()).padStart(2, "0");
    return `${yearStr}-${monthStr}-${endDay}`;
  };

  return {
    from: toStartOfMonth(dates[0]),
    to: toEndOfMonth(dates[dates.length - 1]),
  };
};

const isCancellation = (row) =>
  normalizeText(row.tipo_expedicion) === "cancelacion";
const isNewBusiness = (row) => normalizeText(row.tipo_expedicion) === "nueva";

/** Extrae % comision GA y aplica_sobre del array porc_com por aseguradora_id */
const resolveGACommission = (row) => {
  const porcCom = Array.isArray(row.porc_com) ? row.porc_com : [];
  if (porcCom.length === 0) {
    // Fallback: usar ga_comision_pct guardado o 0
    return {
      gaCommissionPct: Number(
        row.ga_comision_pct ?? row.ga_commission_pct ?? 0,
      ),
      aplica_sobre: Number(row.aplica_sobre ?? 1),
    };
  }
  const asegId = Number(row.aseguradora_id);
  const match = porcCom.find((rule) => {
    if (!rule || !rule.aseguradoras) return false;
    const ids = Array.isArray(rule.aseguradoras)
      ? rule.aseguradoras
      : JSON.parse(String(rule.aseguradoras));
    return ids.map(Number).includes(asegId);
  });
  const src = match || porcCom[0];
  return {
    gaCommissionPct: Number(src?.valor_comision) || 0,
    aplica_sobre: Number(src?.aplica_sobre) || 1,
  };
};

/** Base para comision según aplica_sobre: 1=prima, 2=prima+asist, 3=prima+gastos */
const getBaseForCommission = (row, aplica_sobre) => {
  const prima = toNumberCOP(
    row.prima_neta_raw ?? row.prima_neta ?? row.prima_sin_iva_asistencia ?? 0,
  );
  const asist = toNumberCOP(row.asistencias_raw ?? row.asistencia ?? 0);
  const gastos = toNumberCOP(
    row.gastos_expedicion_raw ?? row.gastos_expedicion ?? 0,
  );
  switch (aplica_sobre) {
    case 2:
      return Math.round(prima + asist);
    case 3:
      return Math.round(prima + gastos);
    default:
      return Math.round(prima);
  }
};

/** % participacion actor: freelance=global 70/75, ganador=8/6, asesor10=10 */
const getActorParticipationPct = (unitRole, row, globalPct) => {
  if (unitRole === "asesorGanador") {
    if (isNewBusiness(row)) return 8;
    if (normalizeText(row.tipo_expedicion) === "renovacion") return 6;
    return 0;
  }
  if (unitRole === "asesor10") {
    return isNewBusiness(row) ? 10 : 0;
  }
  return globalPct;
};

/** Tasa impuesto: freelance/ganador=12%, asesor10=0% */
const getTaxRate = (unitRole) =>
  unitRole === "asesor10" ? 0 : DEFAULT_TAX_RATE;

const getDefaultParticipationPct = (rows = []) => {
  const totalPrima = rows.reduce(
    (sum, row) =>
      sum +
      toNumberCOP(
        row.prima_neta_raw ??
          row.prima_neta ??
          row.prima_sin_iva_asistencia ??
          0,
      ),
    0,
  );
  const totalNewBusiness = rows.filter((row) => isNewBusiness(row)).length;
  return totalPrima >= THRESHOLD_PRIMA && totalNewBusiness >= 2 ? 75 : 70;
};

const dateQueryOptions = [
  { value: "fecha_expedicion", label: "Fecha de expedición" },
  { value: "fecha_inicio_vigencia", label: "Inicio vigencia" },
  { value: "fecha_fin_vigencia", label: "Fin vigencia" },
  { value: "fecha_pago_liquidacion", label: "Fecha pago liquidación" },
];

const estadoConciliacionOptions = [
  { value: "pendiente", label: "Pendiente" },
  { value: "conciliado", label: "Conciliado" },
  { value: "no_conciliado", label: "No conciliado" },
];

const estadoLiquidacionFreelanceOptions = [
  { value: "0", label: "Por liquidar" },
  { value: "1", label: "Liquidada" },
  { value: "2", label: "Cancelada" },
  { value: "4", label: "Borrador" },
];

const estadoCarteraOptions = [
  { value: "Pendiente", label: "Pendiente" },
  { value: "Pagada", label: "Pagada" },
];

const unidadNegocioOptions = [
  { value: "1", label: "Freelance" },
  { value: "3", label: "Asesor 10" },
  { value: "4", label: "Asesor Ganador" },
  { value: "2", label: "Directo" },
];

export const RetomaLiquidacion = ({ setLoading, loading, variant = "sga" }) => {
  const { idLiquidacion } = useParams();
  const navigate = useNavigate();
  const isFreelanceVariant = variant === "freelance";
  const backPath = isFreelanceVariant
    ? "/comisiones/liquidacion/externos"
    : "/comisiones/liquidacion/internos";
  const pageTitle = isFreelanceVariant
    ? "Retoma de liquidación freelance"
    : "Retoma de liquidación";
  const actorLabel = isFreelanceVariant ? "Asesor Freelance" : "Usuario SGA";

  const initialState = {
    unidadnegocio: "",
    usuario: "",
    aseguradora: "",
    ramo: "",
    tiponegocio: "",
    tipoexpedicion: "",
    fechainiciovigdesde: "",
    fechafinvighasta: "",
    estadoliquidacion: "",
    asesorfreelance: "",
    asesorganador: "",
    asesor10: "",
    placa: "",
    numeroPoliza: "",
    documentoAsegurado: "",
    consultafecha: "",
    estadoconciliacion: "",
    estadoliquidacionfreelance: "",
    estadocartera: "",
  };

  const [formStates, setFormStates] = useState(initialState);
  const [polizasDisponibles, setPolizasDisponibles] = useState([]);
  const [smmlv, setSmmlv] = useState(0);
  const [retcn, setRetenciones] = useState([]);
  const [polizasIncluidas, setPolizasIncluidas] = useState([]);
  const [liquidacionHeader, setLiquidacionHeader] = useState(null);
  const [liquidacionModal, setLiquidacionModal] = useState(false);
  const [initialIncludedIds, setInitialIncludedIds] = useState([]);
  const [removedAnexosIds, setRemovedAnexosIds] = useState([]);

  const [unidadesNegocio, setUnidadesNegocio] = useState([]);
  const [aseguradoras, setAseguradoras] = useState([]);
  const [usuariosInput, setUsuariosInput] = useState([]);
  const [ramos, setRamos] = useState([]);
  const [tiposExpedicion, setTiposExpedicion] = useState([]);
  const [pctOverrides, setPctOverrides] = useState(new Map());

  const customNewStyles = {
    indicatorSeparator: () => ({
      display: "none",
    }),
    control: (base) => ({
      ...base,
      minHeight: 30,
      height: 35,
      fontSize: "14px",
      marginTop: 0,
      paddingTop: 0,
    }),
    clearIndicator: (base) => ({
      ...base,
      padding: 0,
      marginRight: 4,
      cursor: "pointer",
      svg: { width: 12, height: 12 },
    }),
    indicatorsContainer: (base) => ({
      ...base,
      paddingRight: 4,
      gap: 2,
    }),
    valueContainer: (base) => ({
      ...base,
      paddingRight: 4,
    }),
  };

  const stylesSingleLine = {
    control: (base) => ({
      ...base,
      minHeight: 35,
    }),
    valueContainer: (base) => ({
      ...base,
      flexWrap: "nowrap",
      overflowX: "auto",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
      WebkitOverflowScrolling: "touch",
    }),
    indicatorsContainer: (base) => ({
      ...base,
      display: "flex",
      flexShrink: 0,
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
    }),
    multiValue: (base) => ({
      ...base,
      marginRight: 0,
      whiteSpace: "nowrap",
    }),
  };

  const headersDisponiblesSga = [
    { field: "id_remision", header: "ID Remision" },
    { field: "fecha_expedicion", header: "Fecha Exp" },
    { field: "ramo", header: "Ramo" },
    { field: "poliza", header: "# Poliza" },
    { field: "nombre_tomador", header: "Tomador" },
    { field: "documento_tomador", header: "Doc Tomador" },
    { field: "placa", header: "Placa" },
    { field: "asistencia", header: "Asist" },
    { field: "prima_neta", header: "Prima" },
    { field: "gastos_expedicion", header: "Gastos" },
    { field: "iva", header: "IVA" },
    { field: "valor_total", header: "Valor Total" },
    { field: "fecha_inicio_vigencia", header: "Inicio Vig" },
    { field: "aseguradora", header: "Compania" },
    { field: "tipo_expedicion", header: "Tipo" },
    { field: "asesor_freelance", header: "Freelance" },
    { field: "usuario_sga", header: "Asesor SGA" },
    { field: "unidad_negocio", header: "Unidad Negocio" },
    { field: "forma_de_pago", header: "Forma Pago" },
    { field: "financiera", header: "Financiera" },
    { field: "cuotas", header: "Cuotas" },
    { field: "estado_cartera", header: "Estado Cartera" },
    { field: "observaciones", header: "Observaciones" },
    { field: "seleccionado", header: "Agregar" },
  ];

  const headersDisponiblesFreelance = [
    { field: "id_remision", header: "ID Remision" },
    { field: "fecha_expedicion", header: "Fecha Exp" },
    { field: "ramo", header: "Ramo" },
    { field: "poliza", header: "# Poliza" },
    { field: "nombre_tomador", header: "Tomador" },
    { field: "documento_tomador", header: "Doc Tomador" },
    { field: "placa", header: "Placa" },
    { field: "asistencia", header: "Asistencia" },
    { field: "prima_sin_iva_asistencia", header: "Prima sin IVA + Asistencias" },
    { field: "gastos_expedicion", header: "Gastos" },
    { field: "iva", header: "IVA" },
    { field: "valor_total", header: "Valor Total" },
    { field: "fecha_inicio_vigencia", header: "Inicio Vig" },
    { field: "aseguradora", header: "Compañia" },
    { field: "tipo_expedicion", header: "Tipo" },
    { field: "asesor_freelance", header: "Asesor Freelance" },
    { field: "asesor_ganador", header: "Asesor Ganador" },
    { field: "asesor_10", header: "Asesor 10" },
    { field: "unidad_negocio", header: "Unidad de negocio" },
    { field: "forma_de_pago", header: "Forma de pago" },
    { field: "financiera", header: "Financiera" },
    { field: "cuotas", header: "Cuotas" },
    { field: "estado_cartera", header: "Estado cartera" },
    { field: "estado_conciliacion", header: "Estado conciliación" },
    {
      field: "estado_liquidacion_freelance",
      header: "Estado liquidación freelance",
    },
    { field: "numero_liquidacion", header: "# liquidacion" },
    {
      field: "valor_comision_freelance",
      header: "Valor comision freelance",
    },
    { field: "fecha_pago_liquidacion", header: "Fecha pago liquidacion" },
    { field: "observaciones", header: "Observaciones" },
    { field: "seleccionado", header: "Agregar" },
  ];

  const headersIncluidasSga = [
    { field: "id_remision", header: "ID Remision" },
    { field: "fecha_expedicion", header: "Fecha Exp" },
    { field: "ramo", header: "Ramo" },
    { field: "poliza", header: "# Poliza" },
    { field: "nombre_tomador", header: "Tomador" },
    { field: "documento_tomador", header: "Doc Tomador" },
    { field: "placa", header: "Placa" },
    { field: "prima_neta", header: "Prima" },
    { field: "usuario_sga", header: "Asesor SGA" },
    { field: "tipo_expedicion", header: "Tipo" },
    { field: "accion", header: "Accion" },
  ];

  const headersIncluidasFreelance = [
    { field: "fecha_expedicion", header: "Fecha Exp" },
    { field: "ramo", header: "Ramo" },
    { field: "aseguradora", header: "Compañia" },
    { field: "poliza", header: "# Poliza" },
    { field: "nombre_tomador", header: "Asegurado" },
    { field: "placa", header: "Placa" },
    { field: "prima_sin_iva_num", header: "Prima sin IVA + Asistencias" },
    { field: "ga_commission_pct", header: "% Comision GA" },
    { field: "ga_commission_value", header: "Comision GA" },
    { field: "impuestos_value", header: "Impuesto aseg." },
    { field: "comision_neta_value", header: "Comision Neta GA" },
    { field: "participation_pct", header: "% freelance" },
    { field: "total_comision_value", header: "Comision freelance" },
    { field: "accion", header: "Acción" },
  ];

  const resolveAdvisorType = (liquidacionData) => {
    if (!liquidacionData) return null;
    console.log(liquidacionData)
    const rolValue = String(
      liquidacionData.usuario_data?.id_rol_user ?? liquidacionData.id_rol_user ?? "",
    );
    if (rolValue === "19" || rolValue === "1") return "freelance";
    if (rolValue === "10" || rolValue === "3") return "asesor10";
    if (rolValue === "11" || rolValue === "4") return "asesorGanador";
    return null;
  };
  const advisorType = resolveAdvisorType(liquidacionHeader);
  const advisorTypeLabel =
    advisorType === "freelance"
      ? "Asesor Freelance"
      : advisorType === "asesor10"
        ? "Asesor 10"
        : advisorType === "asesorGanador"
          ? "Asesor Ganador"
          : "N/A";

  const advisorUnitLabel =
    advisorType === "freelance"
      ? "Freelance"
      : advisorType === "asesor10"
        ? "Asesor 10"
        : advisorType === "asesorGanador"
          ? "Asesor Ganador"
          : "N/A";

  const polizasIncluidasWithCalc = useMemo(() => {
    if (!isFreelanceVariant || polizasIncluidas.length === 0)
      return polizasIncluidas;
    const role = advisorType || "freelance";
    const defaultParticipationPct =
      getDefaultParticipationPct(polizasIncluidas);
    const taxRate = getTaxRate(role);

    return polizasIncluidas.map((row) => {
      const id = row.id_anexo_poliza;
      const overrides = pctOverrides.get(id);

      const { gaCommissionPct: defaultGA, aplica_sobre } =
        resolveGACommission(row);
      const gaPct = overrides?.ga_pct ?? defaultGA;
      const primaNetaRaw = toNumberCOP(
        row.prima_neta_raw ?? row.prima_neta ?? 0,
      );
      const asistenciasRaw = toNumberCOP(
        row.asistencias_raw ?? row.asistencia ?? 0,
      );
      const rawSum = primaNetaRaw + asistenciasRaw;
      const primaSinIva = Math.round(
        rawSum > 0
          ? rawSum
          : toNumberCOP(row.prima_sin_iva_asistencia ?? 0),
      );
      const base = getBaseForCommission(row, aplica_sobre);

      const comisionGA = Math.round((base * gaPct) / 100);
      const impuestos = isCancellation(row)
        ? 0
        : Math.round((comisionGA * taxRate) / 100);
      const comisionNeta = comisionGA - impuestos;

      const defaultActorPct = getActorParticipationPct(
        role,
        row,
        defaultParticipationPct,
      );
      const actorPct = overrides?.actor_pct ?? defaultActorPct;
      const totalComision = Math.round((comisionNeta * actorPct) / 100);

      return {
        ...row,
        prima_sin_iva_num: formatCOP(primaSinIva),
        prima_sin_iva_num_raw: primaSinIva,
        base_calculo: base,
        aplica_sobre,
        ga_commission_pct: gaPct,
        ga_commission_value: formatCOP(comisionGA),
        ga_commission_value_raw: comisionGA,
        tax_rate: taxRate,
        impuestos_value: formatCOP(impuestos),
        impuestos_value_raw: impuestos,
        comision_neta_value: formatCOP(comisionNeta),
        comision_neta_value_raw: comisionNeta,
        participation_pct: actorPct,
        total_comision_value: formatCOP(totalComision),
        total_comision_value_raw: totalComision,
      };
    });
  }, [polizasIncluidas, advisorType, isFreelanceVariant, pctOverrides]);

  const handleRetomaGAChange = (id_anexo_poliza, value) => {
    setPctOverrides((prev) => {
      const next = new Map(prev);
      const existing = next.get(id_anexo_poliza) || {};
      next.set(id_anexo_poliza, { ...existing, ga_pct: Number(value) || 0 });
      return next;
    });
  };

  const handleRetomaActorPctChange = (id_anexo_poliza, value) => {
    setPctOverrides((prev) => {
      const next = new Map(prev);
      const existing = next.get(id_anexo_poliza) || {};
      next.set(id_anexo_poliza, { ...existing, actor_pct: Number(value) || 0 });
      return next;
    });
  };

  const currentIncludedIds = useMemo(
    () => new Set(polizasIncluidas.map((p) => p.id_anexo_poliza)),
    [polizasIncluidas],
  );

  const initialIncludedIdsSet = useMemo(
    () => new Set(initialIncludedIds),
    [initialIncludedIds],
  );

  const fixedUsuarioOption = useMemo(() => {
    const selected = usuariosInput.find(
      (opt) => opt.value === formStates.usuario,
    );
    if (selected) return selected;

    if (!formStates.usuario) return null;

    return {
      value: formStates.usuario,
      label: liquidacionHeader?.usuario_sga || formStates.usuario,
    };
  }, [usuariosInput, formStates.usuario, liquidacionHeader]);

  const normalizeSettlementDetails = (rows = []) =>
    rows.map((item) => ({
      ...item,
      seleccionado: true,
      nombre_tomador: item.nombre_tomador || item.asegurado || "",
      documento_tomador:
        item.documento_tomador || item.identificacion_asegurado || "",
      id_remision: item.id_remision || item.id_anexo_poliza || "",
      prima_neta: item.prima_neta || item.prima_sin_iva_asistencia || "",
      valor_total: item.valor_total || item.total_comision || "",
      estado_conciliacion: item.estado_conciliacion || "N/A",
      numero_liquidacion:
        item.numero_liquidacion || item.id_liquidacion || "N/A",
      valor_comision_freelance:
        item.valor_comision_freelance || item.valor_comision || "N/A",
      fecha_pago_liquidacion:
        item.fecha_pago_liquidacion || item.fecha_pago_liq || "N/A",
      estado_liquidacion_freelance:
        item.estado_liquidacion_freelance || item.estado_liquidacion || "N/A",
    }));

  const headersDisponibles = isFreelanceVariant
    ? headersDisponiblesFreelance
    : headersDisponiblesSga;

  const headersIncluidas = isFreelanceVariant
    ? headersIncluidasFreelance
    : headersIncluidasSga;

  const handlerLoadUnidadesNegocio = async () => {
    try {
      const rows = await getUnidadesNegocio();
      setUnidadesNegocio(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error("Error en la carga de unidades de negocio", e);
    }
  };

  const handlerLoadFilterUsuarios = async (unidad = "") => {
    try {
      const data = await getAsesoresSGA(unidad);
      setUsuariosInput(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error en la carga de usuarios", e);
    }
  };

  const handlerLoaderAseguradoras = async () => {
    try {
      const data = await obtenerAseguradoras();
      setAseguradoras(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error en la carga de aseguradoras", e);
    }
  };

  const handlerLoadRamo = async () => {
    try {
      const data = await obtenerRamo();
      setRamos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error en la carga de ramo", e);
    }
  };

  const handlerLoadTiposExpedicion = async () => {
    try {
      const data = await getTiposPoliza();
      setTiposExpedicion(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error en la carga de tipos de expedicion", e);
    }
  };

  const handlerLoadSettlement = async () => {
    const response = await getSettlement(idLiquidacion);

    if (response?.status !== "Ok") {
      Swal.fire("Error", "No se pudo cargar la liquidacion", "error");
      navigate("/comisiones/liquidacion");
      return;
    }

    console.log(response)

    setLiquidacionHeader(response.liquidacion || null);
    const details = normalizeSettlementDetails(response.detalles || []);
    const { from, to } = getExpeditionDateRange(details);
    setPolizasIncluidas(details);
    setInitialIncludedIds(details.map((detail) => detail.id_anexo_poliza));
    setRemovedAnexosIds([]);

    const usuario =
      response?.liquidacion?.identificacion_usuario_sga ||
      response?.liquidacion?.usuario_sga ||
      "";
    setFormStates((prev) => ({
      ...prev,
      usuario,
      unidadnegocio: details[0]?.unidad_negocio || "",
      fechainiciovigdesde: from,
      fechafinvighasta: to,
      consultafecha: "fecha_expedicion",
    }));

    console.log("Settlement details:", response);
  };

  const handlerLoadPolizasUser = async () => {
    if (formStates.usuario === "" || formStates.fechafinvighasta === "" || formStates.fechainiciovigdesde === "") {
      Swal.fire("Error", "Debe seleccionar un usuario y un periodo válido", "error");
      return;
    }

    setLoading(true);
    try {
      const data = isFreelanceVariant
        ? await getPolizasExternos(formStates)
        : await getPolizas(formStates);
      const rows = Array.isArray(data) ? data : [];
      if (data.codStatus == 401) {
        Swal.fire("Info", "Debe enviarse la unidad de negocio y el periodo a liquidar", "info");
      }
      else if (data.codStatus == 404) {
        Swal.fire("Info", "No se encontraron pólizas para el usuario seleccionado", "info");
      }

      setPolizasDisponibles(rows);
    } catch (e) {
      console.error("Error en la consulta de polizas", e);
      Swal.fire("Error", "No fue posible consultar las polizas", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlerGetSMMLV = async () => {
    try {
      const DTOSmmlv = await getAllSMMLV();
      console.log(DTOSmmlv)
      const actualYear = new Date().getFullYear();
      if (Array.isArray(DTOSmmlv.result)) {
        console.log(DTOSmmlv.result);
        const currentSmmlv = DTOSmmlv.result.find((item) => item.anio == actualYear);
        if (currentSmmlv) {
          setSmmlv(currentSmmlv.valor_smmlv);
        }
      }
    } catch (e) {
      console.error("Error al calcular SMMLV", e);
    } finally {
    }
  };

  const handlerGetAllRet = async () => {
    try {
      const data = await getAllRet();
      setRetenciones(data);
    } catch (error) {
      console.error("Error fetching retenciones:", error);
      Swal.fire(
        "Error",
        "No se pudieron cargar las retenciones. Intente de nuevo más tarde.",
        "error",
      );
    }
  };

  /** Enriquece una poliza cruda con los campos de calculo GA para enviar al backend sync */
  const enrichRowForSync = (row) => {
    if (!isFreelanceVariant) return row;
    const role = advisorType || "freelance";
    const { gaCommissionPct, aplica_sobre } = resolveGACommission(row);
    const base = getBaseForCommission(row, aplica_sobre);
    const comisionGA = Math.round((base * gaCommissionPct) / 100);
    const taxRate = getTaxRate(role);
    const impuestos = isCancellation(row)
      ? 0
      : Math.round((comisionGA * taxRate) / 100);
    const comisionNeta = comisionGA - impuestos;
    const defaultPct = getDefaultParticipationPct(polizasIncluidas);
    const actorPct = getActorParticipationPct(role, row, defaultPct);
    const totalComision = Math.round((comisionNeta * actorPct) / 100);
    return {
      ...row,
      porcentaje_comision_pct: actorPct,
      porcentaje_comision_decimal: (actorPct / 100).toFixed(5),
      prima_sin_iva_asistencia: Math.round(
        toNumberCOP(
          row.prima_neta_raw ??
            row.prima_neta ??
            row.prima_sin_iva_asistencia ??
            0,
        ),
      ),
      valor_comision: totalComision,
      total_comision: totalComision,
      ga_comision_pct: gaCommissionPct,
      aplica_sobre,
      base_calculo: base,
      comision_ga: comisionGA,
      tasa_impuesto: taxRate,
      impuesto_aseguradora: impuestos,
      comision_neta: comisionNeta,
    };
  };

  const handleToggleSelect = async (row, checked) => {
    const id = row.id_anexo_poliza;

    const prevDisponibles = polizasDisponibles;
    const prevIncluidas = polizasIncluidas;

    setPolizasDisponibles((prev) =>
      prev.map((p) =>
        p.id_anexo_poliza === id ? { ...p, seleccionado: checked } : p,
      ),
    );

    if (checked && !currentIncludedIds.has(id)) {
      setRemovedAnexosIds((prev) => prev.filter((item) => item !== id));
      setPolizasIncluidas((prev) => [
        ...prev,
        {
          ...row,
          seleccionado: true,
          id_remision: row.id_remision || row.id_anexo_poliza,
        },
      ]);
    } else if (!checked) {
      setPolizasIncluidas((prev) =>
        prev.filter((poliza) => poliza.id_anexo_poliza !== id),
      );
      setInitialIncludedIds((prev) => prev.filter((current) => current !== id));
      setRemovedAnexosIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }

    try {
      const enrichedRow = enrichRowForSync(row);
      const res =
        isFreelanceVariant && advisorType
          ? await syncRetomaSettlementPolizasExterno(
              idLiquidacion,
              [enrichedRow],
              checked,
              advisorType,
            )
          : await syncRetomaSettlementPolizas(idLiquidacion, [row], checked);
      if (res?.status !== "Ok") {
        throw new Error(res?.message || "Error al actualizar el borrador");
      }
    } catch (error) {
      setPolizasDisponibles(prevDisponibles);
      setPolizasIncluidas(prevIncluidas);
      Swal.fire(
        "Error",
        error?.message || "No se pudo actualizar la liquidacion en retoma",
        "error",
      );
    }
  };

  const handleTogglePageSelect = async (rowsPage = [], checked) => {
    const ids = rowsPage
      .map((row) => row.id_anexo_poliza)
      .filter((id) => id !== undefined && id !== null);

    if (!ids.length) return;

    const idsSet = new Set(ids);
    const prevDisponibles = polizasDisponibles;
    const prevIncluidas = polizasIncluidas;
    const prevRemoved = removedAnexosIds;
    const prevInitialIncluded = initialIncludedIds;

    setPolizasDisponibles((prev) =>
      prev.map((p) =>
        idsSet.has(p.id_anexo_poliza) ? { ...p, seleccionado: checked } : p,
      ),
    );

    if (checked) {
      setRemovedAnexosIds((prev) => prev.filter((id) => !idsSet.has(id)));
      setPolizasIncluidas((prev) => {
        const byId = new Map(prev.map((x) => [x.id_anexo_poliza, x]));
        rowsPage.forEach((row) => {
          if (!byId.has(row.id_anexo_poliza)) {
            byId.set(row.id_anexo_poliza, {
              ...row,
              seleccionado: true,
              id_remision: row.id_remision || row.id_anexo_poliza,
            });
          }
        });
        return Array.from(byId.values());
      });
    } else {
      setPolizasIncluidas((prev) =>
        prev.filter((poliza) => !idsSet.has(poliza.id_anexo_poliza)),
      );
      setInitialIncludedIds((prev) => prev.filter((id) => !idsSet.has(id)));
      setRemovedAnexosIds((prev) => {
        const setPrev = new Set(prev);
        ids.forEach((id) => setPrev.add(id));
        return Array.from(setPrev);
      });
    }

    try {
      const enrichedRows = rowsPage.map(enrichRowForSync);
      const res =
        isFreelanceVariant && advisorType
          ? await syncRetomaSettlementPolizasExterno(
              idLiquidacion,
              enrichedRows,
              checked,
              advisorType,
            )
          : await syncRetomaSettlementPolizas(idLiquidacion, rowsPage, checked);
      if (res?.status !== "Ok") {
        throw new Error(
          res?.message || "Error al actualizar selección por página",
        );
      }
    } catch (error) {
      setPolizasDisponibles(prevDisponibles);
      setPolizasIncluidas(prevIncluidas);
      setRemovedAnexosIds(prevRemoved);
      setInitialIncludedIds(prevInitialIncluded);
      Swal.fire(
        "Error",
        error?.message || "No se pudo actualizar la selección por página",
        "error",
      );
      throw error;
    }
  };

  const cleanTableAndFilters = () => {
    setFormStates((prev) => ({ ...initialState, usuario: prev.usuario }));
    setPolizasDisponibles([]);
  };

  const handleRemoveIncludedPoliza = async (row) => {
    const id = row?.id_anexo_poliza;
    if (!id) return;

    const confirm = await Swal.fire({
      title: "Quitar póliza de la liquidación",
      text: "Esta acción quitará la póliza de esta liquidación inmediatamente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, quitar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) {
      return false;
    }

    setLoading(true);
    try {
      const response =
        isFreelanceVariant && advisorType
          ? await removeSettlementPolizaExterno(idLiquidacion, id, advisorType)
          : await removeSettlementPoliza(idLiquidacion, id);
      if (response?.status !== "Ok") {
        throw new Error(response?.message || "No se pudo quitar la póliza");
      }

      setPolizasIncluidas((prev) =>
        prev.filter((poliza) => poliza.id_anexo_poliza !== id),
      );
      setInitialIncludedIds((prev) => prev.filter((current) => current !== id));
      setRemovedAnexosIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setPolizasDisponibles((prev) =>
        prev.map((poliza) =>
          poliza.id_anexo_poliza === id
            ? {
                ...poliza,
                seleccionado: false,
                ya_liquidada_para_usuario: 0,
              }
            : poliza,
        ),
      );

      return true;
    } catch (error) {
      Swal.fire(
        "Error",
        error?.message || "No se pudo quitar la póliza de la liquidación",
        "error",
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleReloadRetoma = async () => {
    await handlerLoadSettlement();
    if (polizasDisponibles.length > 0) {
      await handlerLoadPolizasUser();
    }
  };

  const handlerCloseModal = () => {
    setLiquidacionModal(false);
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          handlerLoadUnidadesNegocio(),
          handlerLoaderAseguradoras(),
          handlerLoadFilterUsuarios(""),
          handlerLoadRamo(),
          handlerLoadTiposExpedicion(),
          handlerLoadSettlement(),
          handlerGetSMMLV(),
          handlerGetAllRet(),
        ]);
      } finally {
        setLoading(false);
        console.log(smmlv)
        console.log(formStates)
      }
    };

    initData();
  }, [idLiquidacion]);



  return (
    <div className="flex flex-col">
      <Loader isLoading={loading} />
      {liquidacionModal && isFreelanceVariant && (
        <ModalLiquidacionesFreelance
          retenciones={retcn}
          onClose={handlerCloseModal}
          selectedPolizas={polizasIncluidas}
          setIsLoading={setLoading}
          handleReloadPolizas={handleReloadRetoma}
          handlerCleanModal={() => {}}
          smmlv={smmlv}
          mode="update"
          settlementId={idLiquidacion}
          settlementData={liquidacionHeader}
          onRemovePoliza={handleRemoveIncludedPoliza}
          onSuccess={handleReloadRetoma}
          context={{
            unitRole: advisorType || "freelance",
            unitLabel: advisorUnitLabel,
            advisorName: liquidacionHeader?.usuario_sga || "",
            advisorDocument:
              liquidacionHeader?.identificacion_usuario_sga || "",
          }}
        />
      )}
      {liquidacionModal && !isFreelanceVariant && (
        <ModalLiquidaciones
          onClose={handlerCloseModal}
          selectedPolizas={polizasIncluidas}
          setIsLoading={setLoading}
          handleReloadPolizas={handleReloadRetoma}
          handlerCleanModal={() => {}}
          mode="update"
          settlementId={idLiquidacion}
          settlementData={liquidacionHeader}
          onRemovePoliza={handleRemoveIncludedPoliza}
          onSuccess={handleReloadRetoma}
        />
      )}
      <Box padding={3}>
        <section className="shadow-lg rounded-3xl xl:w-full lg:w-full mb-7 border border-gray-300 p-5 bg-white">
          <div className="flex flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold">{pageTitle}</h2>

              <p className="text-sm text-gray-600 mt-1">
                Liquidacion: <strong>{idLiquidacion}</strong>
              </p>
              <p className="text-sm text-gray-600">
                Estado: <strong>{liquidacionHeader?.estado || "N/A"}</strong>
              </p>
              <p className="text-sm text-gray-600">
                {isFreelanceVariant ? advisorTypeLabel : actorLabel}:{" "}
                <strong>{liquidacionHeader?.usuario_sga || "N/A"}</strong>
              </p>
            </div>
            <BtnGeneral
              id="btnVolverRetoma"
              className="bg-black text-white px-6 h-[35px] m-[2px] rounded hover:bg-gray-700 transition duration-300 ease-in-out"
              funct={() => navigate(backPath)}
            >
              <span>Volver</span>
            </BtnGeneral>
          </div>
        </section>

        <section className="shadow-lg rounded-3xl xl:w-full lg:w-full mb-7">
          <div className="flex flex-row gap-3 items-center bg-gray-200 p-3 rounded-t-3xl border-gray-400 border">
            <p className="text-lg pl-3">Polizas incluidas actualmente</p>
          </div>
          <div className="rounded-b-3xl border-l border-r border-b border-gray-400 p-4">
            {isFreelanceVariant && polizasIncluidasWithCalc.length > 0 && (
              <>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-gray-700">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <span className="text-xs text-gray-500">
                        SMMLV vigente:
                      </span>{" "}
                      <strong>{formatCOP(smmlv)}</strong>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">
                        Tope 75% (8xSMMLV):
                      </span>{" "}
                      <strong>{formatCOP(smmlv * 8)}</strong>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">
                        % participacion:
                      </span>{" "}
                      <strong>
                        {polizasIncluidasWithCalc[0]?.participation_pct}%
                      </strong>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">
                        Tipo impuesto:
                      </span>{" "}
                      <strong>
                        {advisorType === "asesor10" ? "0%" : "12%"} aseguradora
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Tabla con los mismos campos que el modal freelance — % editables */}
                <div className="overflow-auto mb-4">
                  <table className="w-full border-collapse text-[12px]">
                    <thead>
                      <tr className="bg-gray-50 text-gray-700">
                        <th className="border border-gray-300 px-2 py-2 font-medium">
                          Fecha expedicion
                        </th>
                        <th className="border border-gray-300 px-2 py-2 font-medium">
                          Ramo
                        </th>
                        <th className="border border-gray-300 px-2 py-2 font-medium">
                          Compañia
                        </th>
                        <th className="border border-gray-300 px-2 py-2 font-medium">
                          Poliza
                        </th>
                        <th className="border border-gray-300 px-2 py-2 font-medium">
                          Asegurado
                        </th>
                        <th className="border border-gray-300 px-2 py-2 font-medium">
                          Placa
                        </th>
                        <th className="border border-gray-300 px-2 py-2 font-medium">
                          Prima sin IVA + Asistencias
                        </th>
                        <th className="border border-gray-300 px-2 py-2 font-medium">
                          % Comision GA
                        </th>
                        <th className="border border-gray-300 px-2 py-2 font-medium">
                          Comision GA
                        </th>
                        <th className="border border-gray-300 px-2 py-2 font-medium">
                          Impuesto aseguradora
                        </th>
                        <th className="border border-gray-300 px-2 py-2 font-medium">
                          Comision neta
                        </th>
                        <th className="border border-gray-300 px-2 py-2 font-medium">
                          % freelance
                        </th>
                        <th className="border border-gray-300 px-2 py-2 font-medium">
                          Comision freelance
                        </th>
                        <th className="border border-gray-300 px-2 py-2 font-medium">
                          Accion
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {polizasIncluidasWithCalc.map((row, idx) => (
                        <tr
                          key={row.id_anexo_poliza}
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <td className="border border-gray-300 px-2 py-2 text-center">
                            {row.fecha_expedicion || "N/A"}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center">
                            {row.ramo || "N/A"}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center">
                            {row.aseguradora || "N/A"}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center">
                            {row.poliza || "N/A"}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center">
                            {row.nombre_tomador || row.asegurado || "N/A"}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center">
                            {row.placa || "N/A"}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-right">
                            {row.prima_sin_iva_num}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <div className="inline-flex items-center rounded border border-gray-300 bg-white px-1 py-1">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="w-14 text-center outline-none text-[12px]"
                                value={row.ga_commission_pct}
                                onChange={(e) =>
                                  handleRetomaGAChange(
                                    row.id_anexo_poliza,
                                    e.target.value,
                                  )
                                }
                              />
                              <span className="text-gray-500">%</span>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-right">
                            {row.ga_commission_value}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-right">
                            {row.impuestos_value}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-right">
                            {row.comision_neta_value}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <div className="inline-flex items-center rounded border border-gray-300 bg-white px-1 py-1">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="w-14 text-center outline-none text-[12px]"
                                value={row.participation_pct}
                                onChange={(e) =>
                                  handleRetomaActorPctChange(
                                    row.id_anexo_poliza,
                                    e.target.value,
                                  )
                                }
                              />
                              <span className="text-gray-500">%</span>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-right font-medium text-green-700">
                            {row.total_comision_value}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center">
                            <button
                              type="button"
                              className="rounded bg-red-600 px-2 py-1 text-[11px] text-white hover:bg-red-700"
                              onClick={() => handleRemoveIncludedPoliza(row)}
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 font-semibold">
                        <td
                          colSpan={6}
                          className="border border-gray-300 px-2 py-2 text-right"
                        >
                          Totales
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-right">
                          {formatCOP(
                            polizasIncluidasWithCalc.reduce(
                              (acc, r) => acc + (r.prima_sin_iva_num_raw || 0),
                              0,
                            ),
                          )}
                        </td>
                        <td className="border border-gray-300 px-2 py-2" />
                        <td className="border border-gray-300 px-2 py-2 text-right">
                          {formatCOP(
                            polizasIncluidasWithCalc.reduce(
                              (acc, r) =>
                                acc + (r.ga_commission_value_raw || 0),
                              0,
                            ),
                          )}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-right">
                          {formatCOP(
                            polizasIncluidasWithCalc.reduce(
                              (acc, r) => acc + (r.impuestos_value_raw || 0),
                              0,
                            ),
                          )}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-right">
                          {formatCOP(
                            polizasIncluidasWithCalc.reduce(
                              (acc, r) =>
                                acc + (r.comision_neta_value_raw || 0),
                              0,
                            ),
                          )}
                        </td>
                        <td className="border border-gray-300 px-2 py-2" />
                        <td className="border border-gray-300 px-2 py-2 text-right text-green-700">
                          {formatCOP(
                            polizasIncluidasWithCalc.reduce(
                              (acc, r) =>
                                acc + (r.total_comision_value_raw || 0),
                              0,
                            ),
                          )}
                        </td>
                        <td className="border border-gray-300 px-2 py-2" />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {isFreelanceVariant &&
              polizasIncluidasWithCalc.length === 0 &&
              polizasIncluidas.length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No hay pólizas incluidas en esta liquidación
                </div>
              )}

            {!isFreelanceVariant && (
              <TableComisiones
                data={polizasIncluidas}
                headers={headersIncluidas}
                from="retoma-incluidas"
                onRowAction={handleRemoveIncludedPoliza}
              />
            )}
            <section className="flex flex-row justify-end mt-7">
              <BtnGeneral
                id="btnAbrirModalRetoma"
                className="bg-lime-9000 text-white px-10 py-2 rounded hover:bg-lime-600 transition duration-300 ease-in-out"
                funct={() => setLiquidacionModal(true)}
                isDisabled={polizasIncluidas.length === 0}
              >
                <span>Guardar / Actualizar Liquidacion</span>
              </BtnGeneral>
            </section>
          </div>
        </section>

        <section className="shadow-lg rounded-3xl xl:w-full lg:w-full">
          <div className="flex flex-row gap-3 items-center bg-gray-200 p-3 rounded-t-3xl border-gray-400 border">
            <p className="text-lg pl-3">
              Consulta avanzada para adicionar polizas
            </p>
          </div>

          <div className="flex flex-col gap-3 items-center justify-between pl-14 pr-14 pt-5 pb-8 rounded-b-3xl border-l border-r border-b border-gray-400 h-auto">
            {isFreelanceVariant ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 w-full">
                  <div className="flex flex-col">
                    <label htmlFor="unidadnegocio" className="text-sm">
                      Unidad de negocio:
                    </label>
                    <Select
                      name="unidadnegocio"
                      className="text-sm"
                      options={
                        unidadesNegocio.length > 0
                          ? unidadesNegocio
                          : unidadNegocioOptions
                      }
                      value={
                        (unidadesNegocio.length > 0
                          ? unidadesNegocio
                          : unidadNegocioOptions
                        ).find(
                          (opt) =>
                            String(opt.value) ===
                            String(formStates.unidadnegocio),
                        ) || ""
                      }
                      onChange={(selectedOption, meta) => {
                        const value = selectedOption?.value || "";
                        setFormStates((prev) => ({
                          ...prev,
                          [meta.name]: value,
                        }));
                        handlerLoadFilterUsuarios(value);
                      }}
                      styles={customNewStyles}
                      placeholder=""
                      isClearable
                      isDisabled
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="usuario" className="text-sm">
                      {actorLabel}:
                    </label>
                    <Select
                      name="usuario"
                      className="text-sm"
                      options={usuariosInput || ""}
                      value={fixedUsuarioOption || ""}
                      onChange={() => {}}
                      styles={customNewStyles}
                      placeholder=""
                      isClearable={false}
                      isDisabled
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="aseguradora" className="text-sm">
                      Compañia:
                    </label>
                    <Select
                      name="aseguradora"
                      className="text-sm"
                      options={aseguradoras || ""}
                      value={
                        aseguradoras.find(
                          (opt) => opt.value === formStates.aseguradora,
                        ) || ""
                      }
                      onChange={(selectedOption, meta) => {
                        const value = selectedOption?.value || "";
                        setFormStates((prev) => ({
                          ...prev,
                          [meta.name]: value,
                        }));
                      }}
                      styles={customNewStyles}
                      placeholder=""
                      isClearable
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="ramo" className="text-sm">
                      Ramo:
                    </label>
                    <Select
                      name="ramo"
                      className="text-sm"
                      options={ramos || ""}
                      value={
                        ramos.find((opt) => opt.value === formStates.ramo) || ""
                      }
                      onChange={(selectedOption, meta) => {
                        const value = selectedOption?.value || "";
                        setFormStates((prev) => ({
                          ...prev,
                          [meta.name]: value,
                        }));
                      }}
                      styles={customNewStyles}
                      placeholder=""
                      isClearable
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="tipoexpedicion" className="text-sm">
                      Tipo de expedicion:
                    </label>
                    <Select
                      name="tipoexpedicion"
                      options={tiposExpedicion}
                      isMulti
                      value={
                        tiposExpedicion.filter((opt) =>
                          formStates.tipoexpedicion?.includes(opt.value),
                        ) || ""
                      }
                      onChange={(selected) => {
                        const values = (selected ?? []).map((o) => o.value);
                        setFormStates((prev) => ({
                          ...prev,
                          tipoexpedicion: values,
                        }));
                      }}
                      styles={stylesSingleLine}
                      className="basic-multi-select"
                      classNamePrefix="select"
                      isClearable={false}
                      placeholder=""
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 w-full mt-2">
                  <div className="flex flex-col">
                    <label htmlFor="placa" className="text-sm">
                      Placa:
                    </label>
                    <input
                      type="text"
                      name="placa"
                      className="text-md border-[1px] w-full border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2"
                      value={formStates.placa}
                      onChange={(e) =>
                        setFormStates((prev) => ({
                          ...prev,
                          [e.target.name]: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="numeroPoliza" className="text-sm">
                      # Póliza:
                    </label>
                    <input
                      type="text"
                      name="numeroPoliza"
                      className="text-md border-[1px] w-full border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2"
                      value={formStates.numeroPoliza}
                      onChange={(e) =>
                        setFormStates((prev) => ({
                          ...prev,
                          [e.target.name]: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="documentoAsegurado" className="text-sm">
                      Documento asegurado:
                    </label>
                    <input
                      type="text"
                      name="documentoAsegurado"
                      className="text-md border-[1px] w-full border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2"
                      value={formStates.documentoAsegurado}
                      onChange={(e) =>
                        setFormStates((prev) => ({
                          ...prev,
                          [e.target.name]: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="consultafecha" className="text-sm">
                      Consulta de fecha:
                    </label>
                    <Select
                      name="consultafecha"
                      className="text-sm"
                      options={dateQueryOptions}
                      value={
                        dateQueryOptions.find(
                          (opt) => opt.value === formStates.consultafecha,
                        ) || ""
                      }
                      onChange={(selectedOption, meta) => {
                        const value = selectedOption?.value || "";
                        setFormStates((prev) => ({
                          ...prev,
                          [meta.name]: value,
                        }));
                      }}
                      styles={customNewStyles}
                      placeholder=""
                      isClearable
                      isDisabled
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="estadoconciliacion" className="text-sm">
                      Estado conciliación aseguradora:
                    </label>
                    <Select
                      name="estadoconciliacion"
                      className="text-sm"
                      options={estadoConciliacionOptions}
                      value={
                        estadoConciliacionOptions.find(
                          (opt) => opt.value === formStates.estadoconciliacion,
                        ) || ""
                      }
                      onChange={(selectedOption, meta) => {
                        const value = selectedOption?.value || "";
                        setFormStates((prev) => ({
                          ...prev,
                          [meta.name]: value,
                        }));
                      }}
                      styles={customNewStyles}
                      placeholder=""
                      isClearable
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 w-full mt-2 items-end">
                  <div className="flex flex-col">
                    <label htmlFor="fechainiciovigdesde" className="text-sm">
                      Desde:
                    </label>
                    <input
                      type="date"
                      name="fechainiciovigdesde"
                      className="text-md border-[1px] w-full border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2"
                      value={formStates.fechainiciovigdesde}
                      disabled
                      onChange={(e) =>
                        setFormStates((prev) => ({
                          ...prev,
                          [e.target.name]: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="fechafinvighasta" className="text-sm">
                      Hasta:
                    </label>
                    <input
                      type="date"
                      name="fechafinvighasta"
                      className="text-md border-[1px] w-full border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2"
                      value={formStates.fechafinvighasta}
                      disabled
                      onChange={(e) =>
                        setFormStates((prev) => ({
                          ...prev,
                          [e.target.name]: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col">
                    <label
                      htmlFor="estadoliquidacionfreelance"
                      className="text-sm"
                    >
                      Estado liquidación freelance:
                    </label>
                    <Select
                      name="estadoliquidacionfreelance"
                      className="text-sm"
                      options={estadoLiquidacionFreelanceOptions}
                      value={
                        estadoLiquidacionFreelanceOptions.find(
                          (opt) =>
                            opt.value === formStates.estadoliquidacionfreelance,
                        ) || ""
                      }
                      onChange={(selectedOption, meta) => {
                        const value = selectedOption?.value || "";
                        setFormStates((prev) => ({
                          ...prev,
                          [meta.name]: value,
                        }));
                      }}
                      styles={customNewStyles}
                      placeholder=""
                      isClearable
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="estadocartera" className="text-sm">
                      Estado cartera:
                    </label>
                    <Select
                      name="estadocartera"
                      className="text-sm"
                      options={estadoCarteraOptions}
                      value={
                        estadoCarteraOptions.find(
                          (opt) => opt.value === formStates.estadocartera,
                        ) || ""
                      }
                      onChange={(selectedOption, meta) => {
                        const value = selectedOption?.value || "";
                        setFormStates((prev) => ({
                          ...prev,
                          [meta.name]: value,
                        }));
                      }}
                      styles={customNewStyles}
                      placeholder=""
                      isClearable
                    />
                  </div>
                  <div className="flex   gap-3 mt-2">
                    <BtnGeneral
                      id="btnConsultarRetoma"
                      className="bg-lime-9000 text-white px-5 h-[35px] m-[2px] rounded hover:bg-lime-600 transition duration-300 ease-in-out"
                      funct={() => handlerLoadPolizasUser()}
                    >
                      <span>Consultar</span>
                    </BtnGeneral>
                    <BtnGeneral
                      id="btnLimpiarRetoma"
                      className="bg-black text-white px-5 h-[35px] m-[2px] rounded hover:bg-gray-700 transition duration-300 ease-in-out"
                      funct={() => cleanTableAndFilters()}
                    >
                      <span>Limpiar</span>
                    </BtnGeneral>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-row gap-3 items-center w-full">
                  <div className="flex flex-col w-auto flex-1">
                    <label htmlFor="unidadnegocio" className="text-sm">
                      Unidad de negocio:
                    </label>
                    <Select
                      name="unidadnegocio"
                      className="text-sm"
                      options={unidadesNegocio}
                      value={
                        unidadesNegocio.find(
                          (opt) => opt.value === formStates.unidadnegocio,
                        ) || ""
                      }
                      onChange={(selectedOption, meta) => {
                        const value = selectedOption?.value || "";
                        setFormStates((prev) => ({
                          ...prev,
                          [meta.name]: value,
                        }));
                        handlerLoadFilterUsuarios(value);
                      }}
                      styles={customNewStyles}
                      placeholder=""
                      isClearable
                      isDisabled
                    />
                  </div>
                  <div className="flex flex-col w-auto flex-1">
                    <label htmlFor="usuario" className="text-sm">
                      Usuario:
                    </label>
                    <Select
                      name="usuario"
                      className="text-sm"
                      options={usuariosInput || ""}
                      value={fixedUsuarioOption || ""}
                      onChange={() => {}}
                      styles={customNewStyles}
                      placeholder=""
                      isClearable={false}
                      isDisabled
                    />
                  </div>
                  <div className="flex flex-col w-auto flex-1">
                    <label htmlFor="aseguradora" className="text-sm">
                      Aseguradora:
                    </label>
                    <Select
                      name="aseguradora"
                      className="text-sm"
                      options={aseguradoras || ""}
                      value={
                        aseguradoras.find(
                          (opt) => opt.value === formStates.aseguradora,
                        ) || ""
                      }
                      onChange={(selectedOption, meta) => {
                        const value = selectedOption?.value || "";
                        setFormStates((prev) => ({
                          ...prev,
                          [meta.name]: value,
                        }));
                      }}
                      styles={customNewStyles}
                      placeholder=""
                      isClearable
                    />
                  </div>
                  <div className="flex flex-col w-auto flex-1">
                    <label htmlFor="ramo" className="text-sm">
                      Ramo:
                    </label>
                    <Select
                      name="ramo"
                      className="text-sm"
                      options={ramos || ""}
                      value={
                        ramos.find((opt) => opt.value === formStates.ramo) || ""
                      }
                      onChange={(selectedOption, meta) => {
                        const value = selectedOption?.value || "";
                        setFormStates((prev) => ({
                          ...prev,
                          [meta.name]: value,
                        }));
                      }}
                      styles={customNewStyles}
                      placeholder=""
                      isClearable
                    />
                  </div>
                  <div className="flex flex-col w-auto flex-1">
                    <label htmlFor="tiponegocio" className="text-sm">
                      Tipo de negocio:
                    </label>
                    <Select
                      name="tiponegocio"
                      className="text-sm"
                      options={[
                        { value: "1", label: "Unidad 1" },
                        { value: "2", label: "Unidad 2" },
                      ]}
                      value={
                        [
                          { value: "1", label: "Unidad 1" },
                          { value: "2", label: "Unidad 2" },
                        ].find((opt) => opt.value === formStates.tiponegocio) ||
                        ""
                      }
                      onChange={(selectedOption, meta) => {
                        const value = selectedOption?.value || "";
                        setFormStates((prev) => ({
                          ...prev,
                          [meta.name]: value,
                        }));
                      }}
                      styles={customNewStyles}
                      placeholder=""
                      isClearable
                    />
                  </div>
                </div>
                <div className="flex flex-row gap-3 items-center w-full mt-7">
                  <div className="flex flex-col w-1/5">
                    <label htmlFor="tipoexpedicion" className="text-sm">
                      Tipo de expedicion:
                    </label>
                    <Select
                      name="tipoexpedicion"
                      options={tiposExpedicion}
                      isMulti
                      value={
                        tiposExpedicion.filter((opt) =>
                          formStates.tipoexpedicion?.includes(opt.value),
                        ) || ""
                      }
                      onChange={(selected) => {
                        const values = (selected ?? []).map((o) => o.value);
                        setFormStates((prev) => ({
                          ...prev,
                          tipoexpedicion: values,
                        }));
                      }}
                      styles={stylesSingleLine}
                      className="basic-multi-select"
                      classNamePrefix="select"
                      isClearable={false}
                      placeholder=""
                    />
                  </div>

                  <div className="flex flex-col w-1/5">
                    <label htmlFor="fechainiciovigencia" className="text-sm">
                      Fecha inicio vigencia desde:
                    </label>
                    <input
                      type="date"
                      name="fechainiciovigdesde"
                      className="text-md border-[1px] w-full border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2"
                      value={formStates.fechainiciovigdesde}
                      //disabled
                      onChange={(e) =>
                        setFormStates((prev) => ({
                          ...prev,
                          [e.target.name]: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col w-1/5">
                    <label htmlFor="fechafinvighasta" className="text-sm">
                      Fecha fin vigencia hasta:
                    </label>
                    <input
                      type="date"
                      name="fechafinvighasta"
                      className="text-md border-[1px] w-full border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2"
                      value={formStates.fechafinvighasta}
                      //disabled
                      onChange={(e) =>
                        setFormStates((prev) => ({
                          ...prev,
                          [e.target.name]: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col w-2/5 items-end justify-end">
                    <div className="flex flex-row gap-2">
                      <BtnGeneral
                        id="btnConsultarRetoma"
                        className="bg-lime-9000 text-white px-6 h-[35px] m-[2px] rounded hover:bg-lime-600 transition duration-300 ease-in-out"
                        funct={() => handlerLoadPolizasUser()}
                      >
                        <span>Consultar</span>
                      </BtnGeneral>
                      <BtnGeneral
                        id="btnLimpiarRetoma"
                        className="bg-black text-white px-6 h-[35px] m-[2px] rounded hover:bg-gray-700 transition duration-300 ease-in-out"
                        funct={() => cleanTableAndFilters()}
                      >
                        <span>Limpiar</span>
                      </BtnGeneral>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {polizasDisponibles.length > 0 && (
          <section className="shadow-lg rounded-3xl xl:w-full lg:w-full mt-7">
            <TableComisiones
              data={polizasDisponibles.map((p) => ({
                ...p,
                seleccionado:
                  p.seleccionado || currentIncludedIds.has(p.id_anexo_poliza),
                ya_liquidada_para_usuario: removedAnexosIds.includes(
                  p.id_anexo_poliza,
                )
                  ? 0
                  : initialIncludedIdsSet.has(p.id_anexo_poliza)
                    ? 1
                    : p.ya_liquidada_para_usuario,
              }))}
              headers={headersDisponibles}
              from=""
              onToggleSelect={handleToggleSelect}
              onTogglePageSelect={handleTogglePageSelect}
              setIsLoading={setLoading}
              loading={loading}
            />
          </section>
        )}
      </Box>
    </div>
  );
};
