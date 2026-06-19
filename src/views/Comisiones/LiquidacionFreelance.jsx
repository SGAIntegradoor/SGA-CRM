import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import Select from "react-select";
import Swal from "sweetalert2";
import Loader from "../../components/LoaderFullScreen/Loader";
import BtnGeneral from "../../components/BtnGeneral/BtnGeneral";
import { TableComisiones } from "../../components/Comisiones/TablaComisiones";
import ModalLiquidacionesFreelance from "../../components/Comisiones/Components/Modal/ModalLiquidacionesFreelance";
import { TableAdminLiq } from "../../components/Comisiones/Components/Tables/TableAdminLiq";
import { getPolizas } from "../../services/Polizas/getPolizas";
import { selectPoliza } from "../../services/Comisiones/selectPoliza";
import { selectPolizaBatch } from "../../services/Comisiones/selectPolizaBatch";
import { getPreSettlements } from "../../services/Settlements/getPreSettlements";
import { getUnidadesNegocio } from "../../services/Polizas/getUnidadNegocio";
import { getAsesoresSGA } from "../../services/Users/getAsesoresSGA";
import { obtenerAseguradoras, obtenerRamo } from "../../utils/aseguradoras";
import { getTiposPoliza } from "../../services/Polizas/getTiposPoliza";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { getPolizasExternos } from "../../services/Polizas/getPolizasExternos";
import { getAllSMMLV } from "../../services/Comisiones/getAllSMMLV";
import { getAllRet } from "../../services/Comisiones/getAllRet";

const dateQueryOptions = [
  { value: "1", label: "Fecha de expedición" },
  //   { value: "2", label: "Inicio vigencia" },
  //   { value: "3", label: "Fin vigencia" },
  //   { value: "4", label: "Fecha pago liquidación" },
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
];

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

const normalizeFreelanceRows = (rows = []) =>
  rows.map((row) => ({
    ...row,
    estado_conciliacion: row.estado_conciliacion || "N/A",
    numero_liquidacion: row.numero_liquidacion || row.id_liquidacion || "N/A",
    valor_comision_freelance:
      row.valor_comision_freelance || row.valor_comision || "N/A",
    fecha_pago_liquidacion:
      row.fecha_pago_liquidacion || row.fecha_pago_liq || "N/A",
    estado_liquidacion_freelance:
      row.estado_liquidacion_freelance || row.estado_liquidacion || "N/A",
  }));

export const LiquidacionFreelance = ({ setLoading, loading }) => {
  const initialState = {
    unidadnegocio: "",
    asesorfreelance: "",
    asesorganador: "",
    asesor10: "",
    aseguradora: "",
    ramo: "",
    tipoexpedicion: [],
    placa: "",
    numeroPoliza: "",
    documentoAsegurado: "",
    consultafecha: "",
    fechainiciovigdesde: "",
    fechafinvighasta: "",
    estadoconciliacion: "",
    estadoliquidacionfreelance: "",
    estadocartera: "",
  };

  const [polizas, setPolizas] = useState([]);
  const [smmlv, setSmmlv] = useState(0);
  const [liqAdminData, setLiqAdminData] = useState([]);
  const [selectedPolizas, setSelectedPolizas] = useState([]);
  const [liquidacionModal, setLiquidacionModal] = useState(false);
  const [appersBox, setAppersBox] = useState(false);
  const [formStates, setFormStates] = useState(initialState);
  const [retcn, setRetenciones] = useState([]);

  const [unidadesNegocio, setUnidadesNegocio] = useState([]);
  const [aseguradoras, setAseguradoras] = useState([]);
  const [asesoresOptions, setAsesoresOptions] = useState([]);
  const [ramos, setRamos] = useState([]);
  const [tiposExpedicion, setTiposExpedicion] = useState([]);

  const formatYMD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getMonthBounds = (inputDate) => {
    const date = new Date(`${inputDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return { start: "", end: "" };
    }

    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return {
      start: formatYMD(start),
      end: formatYMD(end),
    };
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

  const handleStartDateChange = (rawDate) => {
    if (!rawDate) {
      setFormStates((prev) => ({
        ...prev,
        fechainiciovigdesde: "",
        fechafinvighasta: "",
      }));
      return;
    }

    const { start, end } = getMonthBounds(rawDate);
    setFormStates((prev) => ({
      ...prev,
      fechainiciovigdesde: start,
      fechafinvighasta: end,
    }));
  };

  const handlerGetSMMLV = async () => {
    try {
      const DTOSmmlv = await getAllSMMLV();
      const actualYear = new Date().getFullYear();
      if (Array.isArray(DTOSmmlv.result)) {
        const currentSmmlv = DTOSmmlv.result.find(
          (item) => item.anio == actualYear,
        );
        if (currentSmmlv && currentSmmlv) {
          setSmmlv(currentSmmlv.valor_smmlv);
        }
      }
    } catch (e) {
      console.error("Error al calcular SMMLV", e);
    } finally {
    }
  };

  const resolveUnidadRole = (unidadValue, options = []) => {
    const value = String(unidadValue ?? "").trim();
    const option = options.find(
      (opt) => String(opt?.value ?? "").trim() === value,
    );
    const label = String(option?.label ?? "").toLowerCase();

    if (value === "19" || label.includes("freelance")) return "freelance";
    if (value === "10" || label.includes("asesor 10")) return "asesor10";
    if (value === "11" || label.includes("asesor ganador"))
      return "asesorGanador";

    return null;
  };

  const unidadRole = resolveUnidadRole(
    formStates.unidadnegocio,
    unidadesNegocio,
  );
  const enableAsesorFreelance = unidadRole === "freelance";
  const enableAsesor10 = unidadRole === "asesor10";
  const enableAsesorGanador = unidadRole === "asesorGanador";
  const selectedUnidadOption = unidadesNegocio.find(
    (opt) => String(opt?.value) === String(formStates.unidadnegocio),
  );
  const selectedAdvisorValue = enableAsesorFreelance
    ? formStates.asesorfreelance
    : enableAsesor10
      ? formStates.asesor10
      : enableAsesorGanador
        ? formStates.asesorganador
        : "";
  const selectedAdvisorOption = asesoresOptions.find(
    (opt) => String(opt?.value) === String(selectedAdvisorValue),
  );

  const headersAdminLiq = [
    { field: "id_liquidacion", header: "ID Liquidacion" },
    { field: "doc_usuario", header: "Doc Usuario" },
    { field: "nombre_usuario", header: "Usuario liquidado" },
    { field: "fecha", header: "Fecha liquidacion" },
    { field: "estado", header: "Estado" },
    { field: "valor_total_comision", header: "Valor total comision" },
    // { field: "doc_liquidador", header: "Doc Liquidador" },
    { field: "nombre_emisor_liq", header: "Nombre emisor" },
    { field: "ids_anexos", header: "Anexos liquidados" },
    { field: "accion", header: "Accion" },
  ];

  const headersFreelance = [
    { field: "id_remision", header: "ID Remision" },
    { field: "fecha_expedicion", header: "Fecha Exp" },
    { field: "ramo", header: "Ramo" },
    { field: "poliza", header: "# Poliza" },
    { field: "nombre_tomador", header: "Tomador" },
    { field: "documento_tomador", header: "Doc Tomador" },
    { field: "placa", header: "Placa" },
    { field: "asistencia", header: "Asistencia" },
    { field: "prima_neta", header: "Prima sin IVA" },
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
    { field: "id_liquidacion", header: "# liquidacion" },
    {
      field: "valor_comision_freelance",
      header: "Valor comision freelance",
    },
    { field: "fecha_pago_liquidacion", header: "Fecha pago liquidacion" },
    { field: "observaciones", header: "Observaciones" },
    { field: "seleccionado", header: "Seleccionar" },
  ];

  const handlerLoadUnidadesNegocio = async () => {
    try {
      const rows = await getUnidadesNegocio(2);
      setUnidadesNegocio(Array.isArray(rows) ? rows : unidadNegocioOptions);
    } catch (e) {
      console.error("Error en la carga de unidades de negocio", e);
      setUnidadesNegocio(unidadNegocioOptions);
    }
  };

  const handlerLoadAdvisors = async (
    unidadNegocio = null,
    type = "internal",
  ) => {
    try {
      const data = await getAsesoresSGA(unidadNegocio, type || null);
      setAsesoresOptions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error en la carga de asesores", e);
      setAsesoresOptions([]);
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

  const handlerGetLiqAdmin = async () => {
    try {
      const data = await getPreSettlements();
      let preTreated = [];
      if (Array.isArray(data)) {
        preTreated = data.filter((item) => item.usuario_data?.rol == "19");
      }
      setLiqAdminData(preTreated);
    } catch (e) {
      console.error("Error en la carga de liquidaciones", e);
      setLiqAdminData([]);
    }
  };

  const handlerLoadPolizasFreelance = async () => {
    setSelectedPolizas([]);
    setPolizas([]);
    const consultafecha = String(formStates.consultafecha ?? "").trim();
    const unidadnegocio = String(formStates.unidadnegocio ?? "").trim();
    const fechaDesde = String(formStates.fechainiciovigdesde ?? "").trim();
    const fechaHasta = String(formStates.fechafinvighasta ?? "").trim();
    const selectedUnidadRole = resolveUnidadRole(
      formStates.unidadnegocio,
      unidadesNegocio,
    );
    const asesorFreelance = String(formStates.asesorfreelance ?? "").trim();
    const asesor10 = String(formStates.asesor10 ?? "").trim();
    const asesorGanador = String(formStates.asesorganador ?? "").trim();

    const faltanteUsuario =
      (selectedUnidadRole === "freelance" && asesorFreelance === "") ||
      (selectedUnidadRole === "asesor10" && asesor10 === "") ||
      (selectedUnidadRole === "asesorGanador" && asesorGanador === "");

    if (
      consultafecha === "" ||
      unidadnegocio === "" ||
      fechaDesde === "" ||
      fechaHasta === "" ||
      faltanteUsuario
    ) {
      Swal.fire(
        "Error",
        "Debe enviar como minimo tipo de consulta por fecha, unidad de negocio, usuario y periodo (desde/hasta)",
        "error",
      );
      return;
    }

    setLoading(true);
    try {
      const data = await getPolizasExternos(formStates);
      // console.log(data)
      const rows = normalizeFreelanceRows(Array.isArray(data) ? data : []);
      await handlerGetAllRet();
      if (rows.length === 0) {
        setPolizas([]);
        Swal.fire(
          "Error",
          "No se encontraron pólizas para los filtros seleccionados",
          "error",
        );
        return;
      }

      setPolizas(rows);
    } catch (e) {
      console.error("Error en la consulta de pólizas freelance", e);
      Swal.fire("Error", "No fue posible consultar las pólizas", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          handlerLoadUnidadesNegocio(),
          handlerLoaderAseguradoras(),
          //   handlerLoadAdvisors(),
          handlerLoadRamo(),
          handlerLoadTiposExpedicion(),
          handlerGetLiqAdmin(),
          // handlerGetSMMLV(),
        ]);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    if (formStates.unidadnegocio != "") {
      handlerLoadAdvisors(formStates.unidadnegocio, "external");
    }
  }, [formStates.unidadnegocio]);

  useEffect(() => {
    setPolizas([]);
    setSelectedPolizas([]);
    setFormStates((prev) => {
      const next = { ...prev };

      if (enableAsesorFreelance) {
        next.asesor10 = "";
        next.asesorganador = "";
      } else if (enableAsesor10) {
        next.asesorfreelance = "";
        next.asesorganador = "";
      } else if (enableAsesorGanador) {
        next.asesorfreelance = "";
        next.asesor10 = "";
      } else {
        next.asesorfreelance = "";
        next.asesor10 = "";
        next.asesorganador = "";
      }

      if (
        next.asesorfreelance === prev.asesorfreelance &&
        next.asesor10 === prev.asesor10 &&
        next.asesorganador === prev.asesorganador
      ) {
        return prev;
      }

      return next;
    });
  }, [enableAsesorFreelance, enableAsesor10, enableAsesorGanador]);

  useEffect(() => {
    setPolizas([]);
    setSelectedPolizas([]);
  }, [formStates.asesorfreelance, formStates.asesor10, formStates.asesorganador]);

  useEffect(() => {
    if (!Array.isArray(polizas) || polizas.length === 0) return;

    const isSelected = (v) => v === true || v === 1 || v === "1";

    const preselected = polizas
      .filter((p) => isSelected(p.seleccionado) || isSelected(p.seleccionada))
      .map((p) => ({
        id: p.id_anexo_poliza,
        ...p,
      }));

    setSelectedPolizas((prev) => {
      const byId = new Map(prev.map((x) => [x.id, x]));
      preselected.forEach((x) => byId.set(x.id, x));
      return Array.from(byId.values());
    });
  }, [polizas]);

  const handleToggleSelect = async (row, checked) => {
    const id = row.id_anexo_poliza;
    const next = typeof checked === "boolean" ? checked : !row.seleccionado;
    // console.log(row)
    setPolizas((prev) =>
      prev.map((p) =>
        p.id_anexo_poliza === id ? { ...p, seleccionado: next } : p,
      ),
    );

    setSelectedPolizas((prev) =>
      next
        ? [...prev, { id, ...row, seleccionado: true }]
        : prev.filter((p) => p.id !== id),
    );

    try {
      const res = await selectPoliza(id, next);
      if (res?.status !== "Ok") {
        throw new Error(res?.message || "Error al actualizar");
      }
    } catch (err) {
      setPolizas((prev) =>
        prev.map((p) =>
          p.id_anexo_poliza === id ? { ...p, seleccionado: !next } : p,
        ),
      );
      Swal.fire(
        "Error",
        err?.message || "No se pudo actualizar la selección",
        "error",
      );
    }
  };

  useEffect(() => {
    handlerGetSMMLV()
      .then((result) => {})
      .catch((e) => {
        console.error("Error al obtener SMMLV", e);
      });
  }, []);

  const handleTogglePageSelect = async (rowsPage = [], checked) => {
    const ids = rowsPage
      .map((row) => row.id_anexo_poliza)
      .filter((id) => id !== undefined && id !== null);

    if (!ids.length) return;

    const idsSet = new Set(ids);
    const prevPolizas = polizas;
    const prevSelected = selectedPolizas;

    setPolizas((prev) =>
      prev.map((p) =>
        idsSet.has(p.id_anexo_poliza) ? { ...p, seleccionado: checked } : p,
      ),
    );

    setSelectedPolizas((prev) => {
      if (checked) {
        const byId = new Map(prev.map((x) => [x.id, x]));
        rowsPage.forEach((row) => {
          byId.set(row.id_anexo_poliza, {
            id: row.id_anexo_poliza,
            ...row,
            seleccionado: true,
          });
        });
        return Array.from(byId.values());
      }

      return prev.filter((p) => !idsSet.has(p.id));
    });

    try {
      const res = await selectPolizaBatch(ids, checked);
      if (res?.status !== "Ok") {
        throw new Error(
          res?.message || "Error actualizando selección por página",
        );
      }
    } catch (err) {
      setPolizas(prevPolizas);
      setSelectedPolizas(prevSelected);
      Swal.fire(
        "Error",
        err?.message || "No se pudo actualizar la selección por página",
        "error",
      );
      throw err;
    }
  };

  const handlerCloseModal = () => {
    setLiquidacionModal(false);
  };

  const handlerCleanModal = () => {
    setSelectedPolizas([]);
  };

  const handleRemovePolizaFromModal = async (poliza) => {
    if (!poliza?.id_anexo_poliza) {
      return false;
    }

    try {
      setLoading(true);
      const res = await selectPoliza(poliza.id_anexo_poliza, false);
      if (res?.status !== "Ok") {
        throw new Error(res?.message || "No se pudo quitar la poliza");
      }

      setPolizas((prev) =>
        prev.map((item) =>
          item.id_anexo_poliza === poliza.id_anexo_poliza
            ? { ...item, seleccionado: false }
            : item,
        ),
      );
      setSelectedPolizas((prev) =>
        prev.filter((item) => item.id_anexo_poliza !== poliza.id_anexo_poliza),
      );
      return true;
    } catch (error) {
      Swal.fire(
        "Error",
        error?.message || "No se pudo quitar la poliza seleccionada",
        "error",
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // console.log(selectedPolizas)

  const cleanTableAndFilters = () => {
    setFormStates(initialState);
    setSelectedPolizas([]);
    setPolizas([]);
  };
  return (
    <div className="flex flex-col">
      <Loader isLoading={loading} />
      {liquidacionModal && (
        <ModalLiquidacionesFreelance
          onClose={handlerCloseModal}
          selectedPolizas={selectedPolizas}
          smmlv={smmlv}
          retenciones={retcn}
          isLoading={loading}
          setIsLoading={setLoading}
          handleReloadPolizas={handlerLoadPolizasFreelance}
          handlerCleanModal={handlerCleanModal}
          onRemovePoliza={handleRemovePolizaFromModal}
          from={1}
          context={{
            unitRole: unidadRole,
            unitLabel: selectedUnidadOption?.label || "",
            advisorName: selectedAdvisorOption?.label || "",
            advisorDocument: selectedAdvisorOption?.value || "",
          }}
        />
      )}
      <Box padding={3}>
        <section className="shadow-sm rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 mb-10">
          <h1 className="text-lg font-semibold text-gray-900">
            Liquidacion de Comisiones Externos
          </h1>
        </section>

        <section>
          <div className="shadow-sm rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 mb-4 flex flex-row justify-between">
            <span className="text-lg font-semibold">
              Administrador de liquidaciones
            </span>
            <button
              type="button"
              onClick={() => setAppersBox((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
              aria-expanded={appersBox}
              aria-controls="panelAdminLiqFreelance"
              title={appersBox ? "Ver menos" : "Ver más"}
            >
              {appersBox ? (
                <>
                  <FiChevronUp size={18} /> <span>Ver menos</span>
                </>
              ) : (
                <>
                  <FiChevronDown size={18} /> <span>Ver más</span>
                </>
              )}
            </button>
          </div>
          <div
            id="panelAdminLiqFreelance"
            className={`${appersBox ? "mb-10" : ""} transition-all duration-1000 ${
              appersBox ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
            } overflow-hidden`}
          >
            <TableAdminLiq
              data={liqAdminData}
              headers={headersAdminLiq}
              setIsLoading={setLoading}
              loading={loading}
              retomaBasePath="/comisiones/liquidacion/externos/retoma"
              actionLabel="Continuar"
            />
          </div>
        </section>

        <section className="shadow-lg rounded-3xl xl:w-full lg:w-full">
          <div className="flex flex-row gap-3 items-center bg-gray-100 p-3 rounded-t-3xl border-gray-200 border">
            <p className="text-lg pl-3 font-semibold">Consulta avanzada</p>
          </div>

          <div className="flex flex-col gap-3 items-center justify-between pl-4 pr-4 md:pl-6 md:pr-6 xl:pl-6 xl:pr-6 pt-5 pb-8 rounded-b-3xl border-l border-r border-b border-gray-200 h-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 w-full">
              <div className="flex flex-col">
                <label htmlFor="unidadnegocio" className="text-sm">
                  Unidad de negocio:
                </label>
                <Select
                  name="unidadnegocio"
                  className="text-sm"
                  options={unidadesNegocio}
                  value={
                    unidadesNegocio.find(
                      (opt) =>
                        String(opt.value) === String(formStates.unidadnegocio),
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
                <label htmlFor="asesorfreelance" className="text-sm">
                  Asesor freelance:
                </label>
                <Select
                  name="asesorfreelance"
                  className="text-sm"
                  options={asesoresOptions}
                  value={
                    asesoresOptions.find(
                      (opt) =>
                        String(opt.value) ===
                        String(formStates.asesorfreelance),
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
                  isDisabled={!enableAsesorFreelance}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="asesorganador" className="text-sm">
                  Asesor ganador:
                </label>
                <Select
                  name="asesorganador"
                  className="text-sm"
                  options={asesoresOptions}
                  value={
                    asesoresOptions.find(
                      (opt) =>
                        String(opt.value) === String(formStates.asesorganador),
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
                  isDisabled={!enableAsesorGanador}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="asesor10" className="text-sm">
                  Asesor 10:
                </label>
                <Select
                  name="asesor10"
                  className="text-sm"
                  options={asesoresOptions}
                  value={
                    asesoresOptions.find(
                      (opt) =>
                        String(opt.value) === String(formStates.asesor10),
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
                  isDisabled={!enableAsesor10}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="aseguradora" className="text-sm">
                  Compañia:
                </label>
                <Select
                  name="aseguradora"
                  className="text-sm"
                  options={aseguradoras}
                  value={
                    aseguradoras.find(
                      (opt) =>
                        String(opt.value) === String(formStates.aseguradora),
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 w-full mt-2">
              <div className="flex flex-col">
                <label htmlFor="ramo" className="text-sm">
                  Ramo:
                </label>
                <Select
                  name="ramo"
                  className="text-sm"
                  options={ramos}
                  value={
                    ramos.find(
                      (opt) => String(opt.value) === String(formStates.ramo),
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
                <label htmlFor="tipoexpedicion" className="text-sm">
                  Tipo de expedición:
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 w-full mt-2">
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
                      (opt) =>
                        String(opt.value) === String(formStates.consultafecha),
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
                <label htmlFor="fechainiciovigdesde" className="text-sm">
                  Desde:
                </label>
                <input
                  type="date"
                  name="fechainiciovigdesde"
                  className="text-md border-[1px] w-full border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2"
                  value={formStates.fechainiciovigdesde}
                  onChange={(e) => handleStartDateChange(e.target.value)}
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
                  onChange={() => {}}
                  disabled
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
                      (opt) =>
                        String(opt.value) ===
                        String(formStates.estadoconciliacion),
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
                <label htmlFor="estadoliquidacionfreelance" className="text-sm">
                  Estado liquidación freelance:
                </label>
                <Select
                  name="estadoliquidacionfreelance"
                  className="text-sm"
                  options={estadoLiquidacionFreelanceOptions}
                  value={
                    estadoLiquidacionFreelanceOptions.find(
                      (opt) =>
                        String(opt.value) ===
                        String(formStates.estadoliquidacionfreelance),
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
                <label htmlFor="estadocartera" className="text-sm">
                  Estado cartera:
                </label>
                <Select
                  name="estadocartera"
                  className="text-sm"
                  options={estadoCarteraOptions}
                  value={
                    estadoCarteraOptions.find(
                      (opt) =>
                        String(opt.value) === String(formStates.estadocartera),
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
              <div className="flex flex-col xl:col-span-2">
                <div className="flex flex-row gap-3 mt-5 xl:mt-0">
                  <BtnGeneral
                    id="btnConsultarFreelance"
                    className="bg-lime-9000 text-white px-10 h-[35px] m-[2px] rounded hover:bg-lime-600 transition duration-300 ease-in-out"
                    funct={handlerLoadPolizasFreelance}
                  >
                    <span>Consultar</span>
                  </BtnGeneral>
                  <BtnGeneral
                    id="btnLimpiarFreelance"
                    className="bg-black text-white px-10 h-[35px] m-[2px] rounded hover:bg-gray-700 transition duration-300 ease-in-out"
                    funct={cleanTableAndFilters}
                  >
                    <span>Limpiar</span>
                  </BtnGeneral>
                </div>
              </div>
              <div className="hidden xl:block" />
              <div className="hidden xl:block" />
            </div>
          </div>
        </section>

        {polizas.length > 0 && (
          <>
            <section className="shadow-lg rounded-3xl xl:w-full lg:w-full mt-7">
              <TableComisiones
                data={polizas}
                headers={headersFreelance}
                from=""
                onRowAction={() => {}}
                onToggleSelect={handleToggleSelect}
                onTogglePageSelect={handleTogglePageSelect}
                setIsLoading={setLoading}
                loading={loading}
              />
            </section>
            <section className="flex flex-row justify-end mt-7">
              <BtnGeneral
                id="btnLiquidarBorradorFreelance"
                className="bg-lime-9000 text-white px-10 py-2 rounded hover:bg-lime-600 transition duration-300 ease-in-out"
                funct={() => setLiquidacionModal(true)}
              >
                <span>Liquidar borrador</span>
              </BtnGeneral>
            </section>
          </>
        )}
      </Box>
    </div>
  );
};
