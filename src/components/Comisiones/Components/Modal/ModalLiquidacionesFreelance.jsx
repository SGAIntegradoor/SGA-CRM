import { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import Swal from "sweetalert2";
import BtnGeneral from "../../../BtnGeneral/BtnGeneral";
import { createSettlementExterno } from "../../../../services/Settlements/createSettlementExterno";
import { updateSettlementExterno } from "../../../../services/Settlements/updateSettlementExterno";

const SMMLV_2026 = 1750905;
const THRESHOLD_PRIMA = SMMLV_2026 * 8;
const DEFAULT_TAX_RATE = 12;

const nfCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const formatCOP = (value) => nfCOP.format(Number(value || 0));

const toSafeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

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

const hasBusinessValue = (value) => {
  const text = normalizeText(value);
  return (
    text !== "" &&
    text !== "n/a" &&
    text !== "na" &&
    text !== "null" &&
    text !== "undefined"
  );
};

const resolveUnitFromPolizas = (rows = []) => {
  const source = Array.isArray(rows)
    ? rows.find(
        (row) =>
          hasBusinessValue(row?.asesor_10) ||
          hasBusinessValue(row?.asesor_ganador) ||
          hasBusinessValue(row?.asesor_freelance),
      )
    : null;

  if (!source) {
    return { unitRole: null, unitLabel: "N/A", advisorName: "" };
  }

  if (hasBusinessValue(source.asesor_10)) {
    return {
      unitRole: "asesor10",
      unitLabel: "Asesor 10",
      advisorName: String(source.asesor_10).trim(),
    };
  }

  if (hasBusinessValue(source.asesor_ganador)) {
    return {
      unitRole: "asesorGanador",
      unitLabel: "Asesor Ganador",
      advisorName: String(source.asesor_ganador).trim(),
    };
  }

  return {
    unitRole: "freelance",
    unitLabel: "Freelance",
    advisorName: String(source.asesor_freelance || "").trim(),
  };
};

const isCancellation = (row) =>
  normalizeText(row.tipo_expedicion) === "cancelacion";
const isNewBusiness = (row) => normalizeText(row.tipo_expedicion) === "nueva";

/**
 * Extrae % comision GA y aplica_sobre del array porc_com,
 * emparejando por aseguradora_id del poliza.
 */
const resolveGACommission = (row) => {
  const porcCom = Array.isArray(row.porc_com) ? row.porc_com : [];
  if (porcCom.length === 0) return { gaCommissionPct: 0, aplica_sobre: 1 };

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

/**
 * Calcula la base para la comision segun aplica_sobre:
 * 1 = prima sin IVA
 * 2 = prima sin IVA + asistencias
 * 3 = prima sin IVA + gastos expedicion
 */
const getBaseForCommission = (row, aplica_sobre) => {
  const prima = toNumberCOP(
    row.prima_neta_raw ?? row.prima_neta ?? row.prima_sin_iva_asistencia ?? 0,
  );
  const asistencias = toNumberCOP(row.asistencias_raw ?? row.asistencia ?? 0);
  const gastos = toNumberCOP(
    row.gastos_expedicion_raw ?? row.gastos_expedicion ?? 0,
  );

  switch (aplica_sobre) {
    case 2:
      return Math.round(prima + asistencias);
    case 3:
      return Math.round(prima + gastos);
    default:
      return Math.round(prima);
  }
};

/**
 * Porcentaje de participacion del actor (% freelance):
 * - freelance: se usa participationPct global (70/75)
 * - asesorGanador: 8% nueva, 6% renovacion
 * - asesor10: 10% nueva
 */
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

/**
 * Tasa de impuesto aseguradora segun tipo de asesor:
 * - freelance / ganador: 12%
 * - asesor10: 0%
 */
const getTaxRate = (unitRole) =>
  unitRole === "asesor10" ? 0 : DEFAULT_TAX_RATE;

const buildFreelanceRow = (row, index, unitRole, participationPctDefault) => {
  const { gaCommissionPct, aplica_sobre } = resolveGACommission(row);
  const primaSinIva = Math.round(
    toNumberCOP(
      row.prima_neta_raw ?? row.prima_neta ?? row.prima_sin_iva_asistencia ?? 0,
    ),
  );
  const base = getBaseForCommission(row, aplica_sobre);

  const comisionGA = Math.round((base * gaCommissionPct) / 100);
  const taxRate = getTaxRate(unitRole);
  const impuestos = isCancellation(row)
    ? 0
    : Math.round((comisionGA * taxRate) / 100);
  const comisionNeta = comisionGA - impuestos;
  const participationPct = getActorParticipationPct(
    unitRole,
    row,
    participationPctDefault,
  );
  const totalComision = Math.round((comisionNeta * participationPct) / 100);

  return {
    ...row,
    modal_row_id: `${row.id_anexo_poliza ?? row.id_poliza ?? index}-${index}`,
    prima_sin_iva_num: primaSinIva,
    base_calculo: base,
    aplica_sobre,
    ga_commission_pct: gaCommissionPct,
    ga_commission_value: comisionGA,
    tax_rate: taxRate,
    impuestos_value: impuestos,
    comision_neta_value: comisionNeta,
    participation_pct: participationPct,
    total_comision_value: totalComision,
  };
};

/** Recalcula toda la cadena cuando cambia el % de participacion freelance */
const recalcFreelanceRow = (row, nextPct) => {
  const participationPct = Number(nextPct) || 0;
  return {
    ...row,
    participation_pct: participationPct,
    total_comision_value: Math.round(
      (row.comision_neta_value * participationPct) / 100,
    ),
  };
};

/** Recalcula toda la cadena cuando cambia el % comision GA */
const recalcGARow = (row, newGAPct) => {
  const gaPct = Number(newGAPct) || 0;
  const base = row.base_calculo || row.prima_sin_iva_num;
  const comisionGA = Math.round((base * gaPct) / 100);
  const impuestos = isCancellation(row)
    ? 0
    : Math.round((comisionGA * (row.tax_rate ?? DEFAULT_TAX_RATE)) / 100);
  const comisionNeta = comisionGA - impuestos;
  const totalComision = Math.round(
    (comisionNeta * (row.participation_pct || 0)) / 100,
  );

  return {
    ...row,
    ga_commission_pct: gaPct,
    ga_commission_value: comisionGA,
    impuestos_value: impuestos,
    comision_neta_value: comisionNeta,
    total_comision_value: totalComision,
  };
};

const sortRows = (rows = []) =>
  [...rows].sort((left, right) => {
    const dateLeft = String(left.fecha_expedicion ?? "");
    const dateRight = String(right.fecha_expedicion ?? "");
    const byDate = dateLeft.localeCompare(dateRight);
    if (byDate !== 0) return byDate;

    return String(left.poliza ?? "").localeCompare(
      String(right.poliza ?? ""),
      undefined,
      {
        numeric: true,
        sensitivity: "base",
      },
    );
  });

const toInputDate = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month}-${day}`;
  }

  const latamMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (latamMatch) {
    const [, day, month, year] = latamMatch;
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const formatPeriodMonthYear = (dateStr) => {
  if (!dateStr) return "N/A";
  const [year, month, day] = String(dateStr).split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  if (Number.isNaN(date.getTime())) return "N/A";

  const monthName = date.toLocaleDateString("es-CO", { month: "long" });
  return `${monthName} del ${date.getFullYear()}`;
};

const ModalLiquidacionesFreelance = ({
  retenciones,
  show,
  onClose,
  smmlv,
  selectedPolizas,
  setIsLoading,
  handleReloadPolizas,
  handlerCleanModal,
  mode = "create",
  settlementId = null,
  settlementData = null,
  onRemovePoliza = () => {},
  onSuccess = () => {},
  context = {},
}) => {
  const hadSelectedPolizasRef = useRef(selectedPolizas.length > 0);
  const rowsInitializedRef = useRef(false);
  const [rows, setRows] = useState([]);
  const [globalParticipationPct, setGlobalParticipationPct] = useState(70);

  const detectedUnit = useMemo(
    () => resolveUnitFromPolizas(selectedPolizas),
    [selectedPolizas],
  );

  const effectiveUnitRole =
    detectedUnit.unitRole || context.unitRole || "freelance";
  const effectiveUnitLabel =
    detectedUnit.unitLabel !== "N/A"
      ? detectedUnit.unitLabel
      : context.unitLabel || "Unidad no definida";
  const effectiveAdvisorName =
    detectedUnit.advisorName || context.advisorName || "Asesor";

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, show]);

  useEffect(() => {
    if (selectedPolizas.length > 0) {
      hadSelectedPolizasRef.current = true;
      return;
    }

    if (hadSelectedPolizasRef.current) {
      onClose?.();
      return;
    }

    if (show !== false) {
      Swal.fire("Error", "No hay pólizas seleccionadas", "error").then(() => {
        onClose?.();
      });
    }
  }, [selectedPolizas, onClose, show]);

  useEffect(() => {
    const activeSelected = selectedPolizas.filter(
      (row) => !isCancellation(row),
    );
    const totalPrimas = activeSelected.reduce(
      (acc, row) =>
        acc +
        Math.round(
          toNumberCOP(row.prima_neta ?? row.prima_sin_iva_asistencia ?? 0),
        ),
      0,
    );
    const negociosNuevos = activeSelected.filter(isNewBusiness).length;
    const defaultPct =
      totalPrimas >= THRESHOLD_PRIMA && negociosNuevos >= 2 ? 75 : 70;

    setGlobalParticipationPct(defaultPct);
    setRows(
      sortRows(selectedPolizas).map((row, index) =>
        buildFreelanceRow(row, index, effectiveUnitRole, defaultPct),
      ),
    );
    rowsInitializedRef.current = true;
  }, [selectedPolizas, effectiveUnitRole]);

  useEffect(() => {
    if (!rowsInitializedRef.current) {
      return;
    }

    if (
      rows.length === 0 &&
      selectedPolizas.length === 0 &&
      hadSelectedPolizasRef.current
    ) {
      onClose?.();
    }
  }, [rows, selectedPolizas, onClose]);

  const activeRows = useMemo(
    () => rows.filter((row) => !isCancellation(row)),
    [rows],
  );
  const cancelledRows = useMemo(
    () => rows.filter((row) => isCancellation(row)),
    [rows],
  );

  const summary = useMemo(() => {
    const totalPrimas = activeRows.reduce(
      (acc, row) => acc + toSafeNumber(row.prima_sin_iva_num),
      0,
    );
    const negociosNuevos = activeRows.filter(isNewBusiness).length;
    const negociosCancelados = cancelledRows.length;
    const totalComisionGA = rows.reduce(
      (acc, row) => acc + toSafeNumber(row.ga_commission_value),
      0,
    );
    const totalImpuestos = rows.reduce(
      (acc, row) => acc + toSafeNumber(row.impuestos_value),
      0,
    );
    const totalComisionNeta = rows.reduce(
      (acc, row) => acc + toSafeNumber(row.comision_neta_value),
      0,
    );
    const totalComisionFreelance = rows.reduce(
      (acc, row) => acc + toSafeNumber(row.total_comision_value),
      0,
    );

    // Total antes de impuestos = total comision freelance (cancelaciones ya restan)
    const totalAntesImpuestos = toSafeNumber(totalComisionFreelance);

    // IVA 19% solo si responsable de IVA
    const responsableIva =
      rows[0]?.usu_freelance?.responsable_iva ?? settlementData?.responsable_iva;
    const iva19 = String(responsableIva) === "1" ? totalAntesImpuestos * 0.19 : 0;

    // Retenciones
    const retencionesList = Array.isArray(retenciones) ? retenciones : [];
    const retencionId =
      rows[0]?.usu_freelance?.u_retencion ?? settlementData?.usu_retencion;
    const ret = retencionesList.find(
      (r) => String(r?.id) === String(retencionId),
    );
    const retencionesPorcentaje = toSafeNumber(ret?.porc_ret);
    const retencionesValue = (retencionesPorcentaje * totalAntesImpuestos) / 100;

    const totalAPagar = totalAntesImpuestos + iva19 - retencionesValue;

    return {
      totalPrimas,
      negociosNuevos,
      negociosCancelados,
      totalComisionGA,
      totalImpuestos,
      totalComisionNeta,
      totalComisionFreelance,
      totalAntesImpuestos,
      iva19,
      retencionesValue,
      retencionesPorcentaje,
      totalAPagar,
    };
  }, [activeRows, cancelledRows, rows, retenciones, settlementData]);

  const actorLabel = effectiveAdvisorName;
  const unidadLabel = effectiveUnitLabel;

  const periodLabel = useMemo(() => {
    const dates = activeRows
      .map((row) => toInputDate(row?.fecha_expedicion))
      .filter(Boolean)
      .sort();

    if (!dates.length) {
      return "N/A";
    }

    return formatPeriodMonthYear(dates[0]);
  }, [activeRows]);

  const handleGlobalParticipationChange = (value) => {
    const nextPct = Number(value);
    const safePct = Number.isFinite(nextPct) ? nextPct : 0;
    setGlobalParticipationPct(safePct);
    setRows((prev) => prev.map((row) => recalcFreelanceRow(row, safePct)));
  };

  const handleRowParticipationChange = (modalRowId, value) => {
    const nextPct = Number(value);
    const safePct = Number.isFinite(nextPct) ? nextPct : 0;

    setRows((prev) =>
      prev.map((row) =>
        row.modal_row_id === modalRowId
          ? recalcFreelanceRow(row, safePct)
          : row,
      ),
    );
  };

  const handleRowGAChange = (modalRowId, value) => {
    const nextPct = Number(value);
    const safePct = Number.isFinite(nextPct) ? nextPct : 0;

    setRows((prev) =>
      prev.map((row) =>
        row.modal_row_id === modalRowId ? recalcGARow(row, safePct) : row,
      ),
    );
  };

  const handleRemoveRow = async (row) => {
    const removed = await onRemovePoliza?.(row);
    if (removed === false) return;

    setRows((prev) =>
      prev.filter((item) => item.modal_row_id !== row.modal_row_id),
    );
  };

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");

  const handleSaveSettlement = async (estado = "Por pagar") => {
    setIsLoading?.(true);
    try {
      const detalles = rows.map((row) => ({
        ...row,
        usuario_sga: actorLabel,
        usuario_sga_documento: context.advisorDocument || "N/A",
        porcentaje_comision_pct: Number(row.participation_pct) || 0,
        porcentaje_comision: (Number(row.participation_pct) || 0) / 100,
        porcentaje_comision_decimal: (
          (Number(row.participation_pct) || 0) / 100
        ).toFixed(5),
        prima_sin_iva_asistencia: row.prima_sin_iva_num,
        total_comision: row.total_comision_value,
        valor_comision: row.total_comision_value,
        // Nuevos campos de calculo GA
        ga_comision_pct: row.ga_commission_pct,
        aplica_sobre: row.aplica_sobre,
        base_calculo: row.base_calculo,
        comision_ga: row.ga_commission_value,
        tasa_impuesto: row.tax_rate,
        impuesto_aseguradora: row.impuestos_value,
        comision_neta: row.comision_neta_value,
      }));

      const liquidacion = {
        id_liquidacion: settlementId,
        usuario_sga: actorLabel,
        identificacion_usuario_sga: context.advisorDocument || "N/A",
        usuario: context.advisorDocument || "N/A",
        tipo_usuario: effectiveUnitRole,
        observaciones:
          settlementData?.observaciones ||
          `Liquidacion freelance ${unidadLabel} generada desde frontend`,
        nombre_emisor_liq:
          `${userData?.nombre ?? ""} ${userData?.apellido ?? ""}`.trim(),
        cc_emisor_liq: userData?.documento,
        estado,
        valor_liquidacion_total: rows.reduce(
          (acc, row) => acc + row.total_comision_value,
          0,
        ),
        detalles,
      };

      const response =
        mode === "update"
          ? await updateSettlementExterno(liquidacion)
          : await createSettlementExterno(liquidacion);

      const idLiquidacion =
        response?.id_liquidacion ??
        response?.data?.id_liquidacion ??
        response?.liquidacion?.id_liquidacion ??
        null;

      if (idLiquidacion) return idLiquidacion;
      return null;
    } finally {
      setIsLoading?.(false);
    }
  };

  const renderTable = (
    tableRows,
    { showTotals = true, emptyLabel = "Sin registros" } = {},
  ) => {
    if (!tableRows.length) {
      return (
        <div className="border border-gray-300 rounded-lg px-4 py-6 text-sm text-gray-500 text-center">
          {emptyLabel}
        </div>
      );
    }

    const totPrima = tableRows.reduce((acc, r) => acc + r.prima_sin_iva_num, 0);
    const totGA = tableRows.reduce((acc, r) => acc + r.ga_commission_value, 0);
    const totImp = tableRows.reduce((acc, r) => acc + r.impuestos_value, 0);
    const totNeta = tableRows.reduce(
      (acc, r) => acc + r.comision_neta_value,
      0,
    );
    const totFreelance = tableRows.reduce(
      (acc, r) => acc + r.total_comision_value,
      0,
    );

    return (
      <div className="overflow-x-auto border border-gray-300 rounded-lg">
        <table className="min-w-full border-collapse text-[12px]">
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
                Prima sin IVA
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
            {tableRows.map((row) => (
              <tr key={row.modal_row_id} className="bg-white">
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
                  {row.asegurado || row.nombre_tomador || "N/A"}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-center">
                  {row.placa || "N/A"}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-right">
                  {formatCOP(row.prima_sin_iva_num)}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  <div className="inline-flex items-center rounded border border-gray-300 bg-white px-1 py-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-14 text-center outline-none"
                      value={row.ga_commission_pct}
                      onChange={(e) =>
                        handleRowGAChange(row.modal_row_id, e.target.value)
                      }
                    />
                    <span className="text-gray-500">%</span>
                  </div>
                </td>
                <td className="border border-gray-300 px-2 py-2 text-right">
                  {formatCOP(row.ga_commission_value)}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-right">
                  {formatCOP(row.impuestos_value)}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-right">
                  {formatCOP(row.comision_neta_value)}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  <div className="inline-flex items-center rounded border border-gray-300 bg-white px-1 py-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-14 text-center outline-none"
                      value={row.participation_pct}
                      onChange={(e) =>
                        handleRowParticipationChange(
                          row.modal_row_id,
                          e.target.value,
                        )
                      }
                    />
                    <span className="text-gray-500">%</span>
                  </div>
                </td>
                <td className="border border-gray-300 px-2 py-2 text-right font-medium">
                  {formatCOP(row.total_comision_value)}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-center">
                  <button
                    type="button"
                    className="rounded bg-red-600 px-2 py-1 text-[11px] text-white hover:bg-red-700"
                    onClick={() => handleRemoveRow(row)}
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
            {showTotals && (
              <tr className="bg-gray-50 font-semibold">
                <td
                  colSpan={6}
                  className="border border-gray-300 px-2 py-2 text-right"
                >
                  Totales
                </td>
                <td className="border border-gray-300 px-2 py-2 text-right">
                  {formatCOP(totPrima)}
                </td>
                <td className="border border-gray-300 px-2 py-2" />
                <td className="border border-gray-300 px-2 py-2 text-right">
                  {formatCOP(totGA)}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-right">
                  {formatCOP(totImp)}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-right">
                  {formatCOP(totNeta)}
                </td>
                <td className="border border-gray-300 px-2 py-2" />
                <td className="border border-gray-300 px-2 py-2 text-right">
                  {formatCOP(totFreelance)}
                </td>
                <td className="border border-gray-300 px-2 py-2" />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const backdropStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflowY: "auto",
    padding: "20px",
    zIndex: 2147483000,
  };

  const panelStyle = {
    position: "relative",
    maxWidth: "1480px",
    width: "100%",
    maxHeight: "calc(100vh - 40px)",
    overflowY: "auto",
    borderRadius: "12px",
    background: "#fff",
    boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
  };

  const equivalencies = {};

  const content = (
    <div style={backdropStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(event) => event.stopPropagation()}>
        <div className="w-full bg-white px-5 pb-6 pt-4">
          <div className="mb-4 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
            >
              X
            </button>
          </div>

          <div className="mb-6 rounded-xl bg-white px-4 py-4">
            <h2 className="text-center text-base font-semibold uppercase tracking-wide text-gray-800">
              Liquidacion participacion asesores
            </h2>

            {/* Informacion general de la liquidacion */}
            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">
                  Fecha de liquidacion
                </span>
                <input
                  type="text"
                  className="h-[36px] rounded border border-gray-300 bg-gray-100 px-3 text-sm"
                  value={new Date().toLocaleDateString("es-CO")}
                  disabled
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">
                  Nombre del freelance
                </span>
                <input
                  type="text"
                  className="h-[36px] rounded border border-gray-300 bg-gray-100 px-3 text-sm"
                  value={actorLabel}
                  disabled
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Tipo de freelance</span>
                <input
                  type="text"
                  className="h-[36px] rounded border border-gray-300 bg-gray-100 px-3 text-sm"
                  value={unidadLabel}
                  disabled
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">
                  Periodo de liquidacion
                </span>
                <input
                  type="text"
                  className="h-[36px] rounded border border-gray-300 bg-gray-100 px-3 text-sm"
                  value={periodLabel}
                  disabled
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Consecutivo</span>
                <input
                  type="text"
                  className="h-[36px] rounded border border-gray-300 bg-gray-100 px-3 text-sm"
                  value={settlementId || "Auto"}
                  disabled
                />
              </div>
            </div>

            {/* Parametros globales */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">SMMLV vigente</span>
                <input
                  type="text"
                  className="h-[36px] rounded border border-gray-300 bg-gray-100 px-3 text-sm"
                  value={formatCOP(smmlv)}
                  disabled
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">
                  Tope para 75% (8 x SMMLV)
                </span>
                <input
                  type="text"
                  className="h-[36px] rounded border border-gray-300 bg-gray-100 px-3 text-sm"
                  value={formatCOP(smmlv * 8)}
                  disabled
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500"># negocios nuevos</span>
                <input
                  type="text"
                  className="h-[36px] rounded border border-gray-300 bg-gray-100 px-3 text-sm"
                  value={summary.negociosNuevos}
                  disabled
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">
                  % participacion freelance
                </span>
                <div className="inline-flex h-[36px] items-center rounded border border-gray-300 bg-white px-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full text-sm outline-none"
                    value={globalParticipationPct}
                    onChange={(event) =>
                      handleGlobalParticipationChange(event.target.value)
                    }
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <section>
              {renderTable(activeRows, {
                emptyLabel: "No hay negocios vigentes seleccionados",
              })}
            </section>

            <section className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Cancelaciones
                </h3>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">
                    # negocios cancelados
                  </span>
                  <input
                    type="text"
                    className="h-[36px] w-24 rounded border border-gray-300 bg-white px-3 text-sm"
                    value={summary.negociosCancelados}
                    disabled
                  />
                </div>
              </div>
              {renderTable(cancelledRows, {
                emptyLabel: "No hay cancelaciones seleccionadas",
              })}
            </section>
          </div>

          <div className="mt-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 xl:max-w-[560px]">
              <p className="font-semibold">Regla aplicada</p>
              <p className="mt-1">
                Si el total de primas sin IVA del periodo es mayor o igual a{" "}
                {formatCOP(THRESHOLD_PRIMA)} y hay al menos 2 negocios nuevos,
                el porcentaje sugerido es 75%. En cualquier otro caso, el
                porcentaje sugerido es 70%.
              </p>
            </div>

            <div className="ml-auto grid min-w-[320px] grid-cols-[1fr_auto] gap-x-4 gap-y-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm">
              <span className="font-medium text-gray-600">
                Total prima sin IVA
              </span>
              <span className="text-right font-semibold text-gray-900">
                {formatCOP(summary.totalPrimas)}
              </span>
              <span className="font-medium text-gray-600">
                Total comision GA
              </span>
              <span className="text-right font-semibold text-gray-900">
                {formatCOP(summary.totalComisionGA)}
              </span>
              <span className="font-medium text-gray-600">
                Total impuestos aseguradora
              </span>
              <span className="text-right font-semibold text-gray-900">
                {formatCOP(summary.totalImpuestos)}
              </span>
              <span className="font-medium text-gray-600">
                Total comision neta
              </span>
              <span className="text-right font-semibold text-gray-900">
                {formatCOP(summary.totalComisionNeta)}
              </span>

              <hr className="col-span-2 border-gray-300" />

              <span className="font-medium text-gray-600">
                Total comision freelance
              </span>
              <span className="text-right font-semibold text-gray-900">
                {formatCOP(summary.totalComisionFreelance)}
              </span>
              <span className="font-medium text-gray-600">IVA (19%)</span>
              <span className="text-right font-semibold text-gray-900">
                {formatCOP(
                  summary?.iva19 == 0 || summary?.iva19 == null
                    ? settlementData?.responsable_iva === "1"
                      ? summary?.totalComisionFreelance * 0.19
                      : 0
                    : summary?.iva19,
                )}
              </span>
              <span className="font-medium text-gray-600">
                Retenciones (
                {summary.retencionesPorcentaje}
                %)
              </span>
              <span className="text-right font-semibold text-gray-900">
                {formatCOP(summary.retencionesValue)}
              </span>

              <hr className="col-span-2 border-gray-300" />

              <span className="font-semibold text-gray-800">Total a pagar</span>
              <span className="text-right text-base font-bold text-gray-900">
                {formatCOP(summary.totalAPagar)}
              </span>
            </div>
          </div>

          <section className="mt-8 flex flex-wrap justify-end gap-3">
            <BtnGeneral
              funct={onClose}
              className="rounded bg-gray-300 px-10 py-[7.5px] text-black transition duration-300 ease-in-out hover:bg-gray-400"
            >
              Cancelar
            </BtnGeneral>
            <BtnGeneral
              funct={async () => {
                const win = window.open("", "_blank");
                try {
                  const id = await handleSaveSettlement();
                  if (id && win) {
                    const url = new URL(
                      `crm1/comisiones/liquidacion/impresion?id_liquidacion=${encodeURIComponent(id)}`,
                      window.location.origin,
                    ).href;

                    handlerCleanModal?.();
                    await handleReloadPolizas?.();
                    await onSuccess?.(id);
                    onClose();
                    win.opener = null;
                    win.location.href = url;
                  } else {
                    win?.close();
                    Swal.fire(
                      "Error",
                      mode === "update"
                        ? "No se pudo actualizar la liquidacion. Intente nuevamente."
                        : "No se pudo generar la liquidacion. Intente nuevamente.",
                      "error",
                    );
                  }
                } catch (error) {
                  win?.close();
                  console.error(error);
                }
              }}
              className="rounded bg-lime-9000 px-10 py-[7.5px] text-white transition duration-300 ease-in-out hover:bg-lime-600"
            >
              {mode === "update"
                ? "Actualizar liquidacion"
                : "Generar liquidacion"}
            </BtnGeneral>
            <BtnGeneral
              funct={async () => {
                try {
                  const id = await handleSaveSettlement("Borrador");
                  if (id) {
                    handlerCleanModal?.();
                    await handleReloadPolizas?.();
                    await onSuccess?.(id);
                    onClose();
                  } else {
                    Swal.fire(
                      "Error",
                      mode === "update"
                        ? "No se pudo actualizar el borrador. Intente nuevamente."
                        : "No se pudo generar el borrador. Intente nuevamente.",
                      "error",
                    );
                  }
                } catch (error) {
                  console.error(error);
                }
              }}
              className="rounded bg-black px-10 py-[7.5px] text-white transition duration-300 ease-in-out hover:bg-gray-800"
            >
              {mode === "update" ? "Guardar borrador" : "Guardar borrador"}
            </BtnGeneral>
          </section>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default ModalLiquidacionesFreelance;
