import { Box } from "@mui/material";
import Select from "react-select";
import React, { useEffect, useState, useRef } from "react";
import BtnGeneral from "../../components/BtnGeneral/BtnGeneral";
import Swal from "sweetalert2";
import Loader from "../../components/LoaderFullScreen/Loader";
import { getUserLiquidaciones } from "../../services/Users/getUsersLiquidaciones";
import { getPolizas } from "../../services/Polizas/getPolizas";
import { FiChevronDown, FiChevronUp } from "react-icons/fi"; // <<< NUEVO
import { TableConsultas } from "../../components/AdminNegocios/TableConsultas";
import { getPolizasToQuery } from "../../services/Polizas/Query/getPolizasToQuery";
import { useHref, useNavigate } from "react-router-dom";
import { obtenerAseguradoras, obtenerRamo } from "../../utils/aseguradoras";
import { getFinancieras } from "../../services/Polizas/getFinancieras";
import { getUnidadesNegocio } from "../../services/Polizas/getUnidadNegocio";
import { getFormasPago } from "../../utils/getPolizas";

// estado base para limpiar
const initialFiltros = {
  criteria_busqueda: "", // "1" póliza | "2" certificado
  consulta_de_fecha: {
    tipo_fecha_busqueda: "", // 1 expedición | 2 inicio | 3 fin
    desde: "",
    hasta: "",
  },
  unidad_negocio: "",
  nombre_asesor: "",
  analista_asesor: "",
  aseguradora: "",
  ramo: "",
  forma_pago: "",
  financiada_por: "",
  placa: "",
  no_poliza: "",
  aseg_tom_ben: {
    tipo_cliente: "", // 1 Asegurado | 2 Tomador | 3 Beneficiario
    documento: "",
  },
};

export const AdminNegocios = ({ loading, setLoading, isCollapsed }) => {
  const [fichasPoliza, setFichasPoliza] = useState([]);
  const [filtros, setFiltros] = useState(initialFiltros);
  const [selectedLiquidaciones, setSelectedLiquidaciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [insurers, setInsurers] = useState([]);
  const [ramo, setRamo] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [financieras, setFinancieras] = useState([]);
  const [unidadNegocio, setUnidadNegocio] = useState([]);
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");

  useEffect(() => {
    setLoading(true);
    handlerLoadUnidadNegocio()
      .then(() => {
        // setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading unidad de negocio:", error);
        // setLoading(false);
      });
    handlerLoadInsurers()
      .then(() => {
        // setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading insurers:", error);
        // setLoading(false);
      });

    handlerLoadRamo()
      .then(() => {
        // setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading ramo:", error);
        // setLoading(false);
      });

    handlerLoadFormasPago()
      .then(() => {
        // setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading formas de pago:", error);
        // setLoading(false);
      });

    handlerFinancieras()
      .then(() => {
        // setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading formas de pago:", error);
        // setLoading(false);
      });

    handlerLoadUsuarios()
      .then(() => {
      })
      .catch((error) => {
        console.error("Error loading usuarios:", error);
        // setLoading(false);
      });
      setLoading(false);
  }, [loading]);

  const handlerLoadRamo = async () => {
    // Function to load ramo data
    // This is a placeholder for the actual implementation
    const ramoData = await obtenerRamo();
    setRamo(ramoData);
  };

  const handlerLoadFormasPago = async () => {
    // Function to load payment methods data
    // This is a placeholder for the actual implementation
    const formasPago = await getFormasPago();
    setFormasPago(formasPago);
  };

  const handlerLoadUnidadNegocio = async () => {
    // Function to load business units data
    // This is a placeholder for the actual implementation
    const unidades = await getUnidadesNegocio();
    setUnidadNegocio(unidades);
  };

  const handlerLoadInsurers = async () => {
    // Function to load insurers data
    // This is a placeholder for the actual implementation
    const aseguradoras = await obtenerAseguradoras();
    setInsurers(aseguradoras);
  };

  const handlerFinancieras = async () => {
    // Function to load insurers data
    // This is a placeholder for the actual implementation
    const financieras = await getFinancieras();
    setFinancieras(financieras);
  };

  // <<< NUEVO: controla el despliegue de la sección de resultados
  const [tablaAbierta, setTablaAbierta] = useState(true);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(true);

  const resultadosRef = useRef(null);

  // === estilos de react-select (altura uniforme) ===
  const CONTROL_H = 36;
  const customNewStyles = {
    container: (base) => ({ ...base, width: "100%" }),
    indicatorSeparator: () => ({ display: "none" }),
    control: (base) => ({
      ...base,
      minHeight: CONTROL_H,
      height: CONTROL_H,
      fontSize: "14px",
      marginTop: 0,
      paddingTop: 0,
    }),
    valueContainer: (base) => ({
      ...base,
      height: CONTROL_H,
      paddingTop: 0,
      paddingBottom: 0,
    }),
    indicatorsContainer: (base) => ({ ...base, height: CONTROL_H }),
    input: (base) => ({ ...base, margin: 0, padding: 0 }),
    menu: (base) => ({ ...base, zIndex: 40 }), // (se queda igual)
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  const selectPortalProps = {
    menuPortalTarget: typeof document !== "undefined" ? document.body : null,
    menuPosition: "fixed",
  };

  // === headers de tabla según selección (póliza/certificado) ===
  const headersOptFichaPoliza = [
    { field: "accion", header: "Acción" },
    { field: "fecha_exp_poliza", header: "Fecha Expedición" },
    { field: "no_poliza", header: "# Póliza" },
    { field: "id_remision", header: "ID Remisión" },
    { field: "ramo", header: "Ramo" },
    { field: "aseguradora", header: "Aseguradora" },
    { field: "tomador", header: "Tomador" },
    { field: "no_documento", header: "No. documento" },
    { field: "asegurado", header: "Asegurado" },
    { field: "beneficiario", header: "Beneficiario" },
    { field: "nombre_asesor_freelance", header: "Nombre Freelance" },
    { field: "asesor_freelance", header: "Documento Freelance" },
    { field: "placa", header: "Placa" },
    { field: "asistencia_otros", header: "Asistencia/Otros" },
    { field: "prima_neta", header: "Prima Neta" },
    { field: "gastos_expedicion", header: "Gastos" },
    { field: "iva", header: "IVA" },
    { field: "valor_total", header: "Valor Total" },
    { field: "inicio_vigencia", header: "Inicio Vigencia" },
    { field: "fin_vigencia", header: "Fin Vigencia" },
    { field: "unidad_negocio", header: "Unidad de negocio" },
    { field: "estado", header: "Estado" },
  ];

  const headersOptFichaCertificado = [
    { field: "accion", header: "Acción" },
    { field: "fecha_exp_poliza", header: "Fecha Expedición" },
    { field: "no_poliza", header: "# Póliza" },
    { field: "id_remision", header: "ID Remisión" },
    { field: "anexo_poliza", header: "Certificado" },
    { field: "ramo", header: "Ramo" },
    { field: "aseguradora", header: "Aseguradora" },
    { field: "tomador", header: "Tomador" },
    { field: "no_documento", header: "No. documento" },
    { field: "asegurado", header: "Asegurado" },
    { field: "beneficiario", header: "Beneficiario" },
    { field: "nombre_asesor_freelance", header: "Nombre Freelance" },
    { field: "asesor_freelance", header: "Documento Freelance" },
    { field: "placa", header: "Placa" },
    { field: "asistencia_otros", header: "Asistencia/Otros" },
    { field: "prima_neta", header: "Prima Neta" },
    { field: "gastos_expedicion", header: "Gastos" },
    { field: "iva", header: "IVA" },
    { field: "valor_total", header: "Valor Total" },
    { field: "inicio_vigencia", header: "Inicio Vigencia" },
    { field: "fin_vigencia", header: "Fin Vigencia" },
    { field: "unidad_negocio", header: "Unidad de negocio" },
  ];

  const formatPeso = (value) => {
    if (value === null || typeof value === "undefined" || value === "")
      return "N/A";
    // aseguramos que sea número
    const num = Number(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const headers =
    filtros.criteria_busqueda === "2"
      ? headersOptFichaCertificado
      : headersOptFichaPoliza;

  // === carga de usuarios filtrados por cargos incluidos ===
  const INCLUDED_CARGOS = [
    "Director Comercial",
    "Analista Comercial",
    "Asistente Comercial",
    "Asesor Comercial Interno",
    "Analista Tecnico",
    "Coordinador Tecnico Emision",
  ];
  const norm = (s) =>
    (s ?? "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  const includedSet = new Set(INCLUDED_CARGOS.map(norm));

  const handlerLoadUsuarios = async () => {
    // setLoading?.(true);
    try {
      const userLiq = await getUserLiquidaciones();
      const filtered = userLiq
        .filter((u) => includedSet.has(norm(u.cargo)))
        .map((u) => ({ value: u.value, label: u.label, cargo: u.cargo }));
      setUsuarios(filtered.sort((a, b) => a.label.localeCompare(b.label)));
    } catch (e) {
      console.error(e);
    } 
  };

  // === handler consulta (mantengo tu estructura) ===
  const handlerFichasPoliza = async () => {
    if (
      !filtros.criteria_busqueda &&
      !filtros.unidad_negocio &&
      !filtros.nombre_asesor &&
      (!filtros.consulta_de_fecha.tipo_fecha_busqueda ||
        !filtros.consulta_de_fecha.desde ||
        !filtros.consulta_de_fecha.hasta) &&
      !filtros.analista_asesor &&
      !filtros.aseguradora &&
      !filtros.ramo &&
      !filtros.forma_pago &&
      !filtros.financiada_por &&
      !filtros.placa &&
      !filtros.no_poliza &&
      (!filtros.aseg_tom_ben.documento || !filtros.aseg_tom_ben.tipo_cliente)
    ) {
      Swal.fire({
        icon: "warning",
        title: "Filtros incompletos",
        text: "Por favor, complete todos los filtros antes de buscar.",
      });
      return;
    }

    const {
      criteria_busqueda,
      consulta_de_fecha: { tipo_fecha_busqueda, desde, hasta },
      unidad_negocio,
      nombre_asesor,
      analista_asesor,
      aseguradora,
      ramo,
      forma_pago,
      financiada_por,
      placa,
      no_poliza,
      aseg_tom_ben: { tipo_cliente, documento },
    } = filtros;

    const from = "search"; // <<< fijo a "search" para este caso

    if (typeof getPolizas !== "function") {
      console.warn("getPolizas no está importado todavía.");
      Swal.fire({
        icon: "info",
        title: "Pendiente",
        text: "El servicio de consulta aún no está conectado (getPolizas).",
      });
      return;
    }

    const fichasPolizaData = await getPolizasToQuery(
      {
        criteria_busqueda,
        tipo_fecha_busqueda,
        desde,
        hasta,
        nombre_asesor,
        analista_asesor,
        aseguradora,
        ramo,
        forma_pago,
        financiada_por,
        placa,
        no_poliza,
        tipo_cliente,
        documento,
        unidad_negocio,
      },
      from
    );

    if (fichasPolizaData?.statusCode !== -1) {
      setFichasPoliza(fichasPolizaData || []);
      // setFiltrosAbiertos(false); // <<< NUEVO: cierra los filtros al mostrar resultados
    } else {
      setFichasPoliza([]);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se encontraron liquidaciones.",
      });
    }
  };

  // limpiar filtros y resultados
  const handleClearFilters = () => {
    setFiltros({ ...initialFiltros });
    setFichasPoliza([]);
    setSelectedLiquidaciones([]);
  };

  // === helpers UI ===
  const optionFromValue = (opts, value) =>
    opts.find((o) => o.value === value) || null;

  // (dummy) opciones de ejemplo
  const opcionesUnidad = unidadNegocio
  const opcionesAseguradora = insurers;
  const opcionesRamo = ramo;
  const opcionesFormaPago = [
    { value: "2", label: "Contado" },
    { value: "1", label: "Financiada" },
  ];
  const opcionesFinanciador = financieras;
  const opcionesTipoCliente = [
    { value: "1", label: "Asegurado" },
    { value: "2", label: "Tomador" },
    { value: "3", label: "Beneficiario" },
  ];
  const opcionesTipoFecha = [
    { value: "1", label: "Fecha Expedición" },
    { value: "2", label: "Inicio Vigencia" },
    { value: "3", label: "Fin Vigencia" },
  ];

  const handlerQuery = async () => {
    setLoading?.(true);
    await handlerFichasPoliza();
    setLoading?.(false);
    // setTablaAbierta(true); // <<< NUEVO: abre la tabla de resultados
    // setFiltrosAbiertos(true); // <<< NUEVO: cierra los filtros
  };

  useEffect(() => {
    if (
      Array.isArray(fichasPoliza) &&
      fichasPoliza.length > 0 &&
      resultadosRef.current
    ) {
      resultadosRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [fichasPoliza]);

  // arriba del archivo (o en un config)
  const BASENAME = "/crm"; // igual al de <BrowserRouter basename="/crm">

  const buildUrl = (path) => {
    const clean = path.startsWith("/") ? path : `/${path}`;
    return `${window.location.origin}${BASENAME}${clean}`;
  };

  const handlerNavigateToDetail = (poliza) => {
    const idPoliza = poliza?.id_poliza;
    const idAnexo = poliza?.anexo_poliza ? poliza?.id_anexo_poliza : null;

    if (!idPoliza) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se encontró la póliza.",
      });
      return;
    }

    const params = new URLSearchParams({ id_poliza: idPoliza });
    if (idAnexo) params.set("id_anexo", idAnexo);

    // OJO: barra inicial
    const detailPath = `/polizas/consulta/detalle?${params.toString()}`;

    // Abre en nueva pestaña respetando /crm
    window.open(buildUrl(detailPath), "_blank", "noopener,noreferrer");

    // Si quieres además navegar en la pestaña actual:
    // const nav = useNavigate();  // <-- esto sí va ARRIBA en el componente
    // nav(detailPath);
  };

  // === RENDER ===
  return (
    <div>
      <Loader isLoading={loading} />
      <Box padding={3}>
        <section className="shadow-lg rounded-3xl xl:w-full lg:w/full">
          <div className="flex flex-row gap-3 items-center bg-gray-200 p-3 rounded-t-3xl justify-between border-gray-400 border">
            <p className="text-lg pl-3">Administración de negocios</p>
            <button
              type="button"
              onClick={() => setFiltrosAbiertos((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-gray-300 hover:bg-gray-300 text-gray-700"
              aria-expanded={filtrosAbiertos}
              aria-controls="panelFiltros"
              title={filtrosAbiertos ? "Ocultar filtros" : "Mostrar filtros"}
            >
              {filtrosAbiertos ? (
                <FiChevronUp size={18} />
              ) : (
                <FiChevronDown size={18} />
              )}
            </button>
          </div>

          <div
            id="panelFiltros"
            className={`transition-all duration-300 ${
              filtrosAbiertos
                ? "max-h-[5000px] opacity-100"
                : "max-h-0 opacity-0"
            } overflow-hidden`}
          >
            <div className="flex flex-row items-center justify-between pl-14 pr-14 pt-5 pb-8 rounded-b-3xl border-l border-r border-b border-gray-400 h-auto">
              <div className="flex flex-row gap-3 items-center w-full">
                <div className="flex flex-col flex-1 gap-6 w-full">
                  <div className="flex flex-col gap-3 w-full">
                    {/* F I L A  1 */}
                    <div className="flex flex-row gap-10 mt-4 items-end">
                      {/* ¿Qué quieres buscar? (1 col) */}
                      <div className="flex flex-col basis-1/4 min-w-0">
                        <label
                          htmlFor="ficha_radio"
                          className="text-gray-500 text-[15px] mb-2"
                        >
                          ¿Qué quieres buscar?:
                        </label>
                        <div className="flex flex-row gap-6">
                          <label
                            htmlFor="fichasPoliza"
                            className="inline-flex items-center gap-2 h-9"
                          >
                            <input
                              type="radio"
                              id="fichasPoliza"
                              name="ficha_radio"
                              className="h-4 w-4"
                              checked={filtros.criteria_busqueda === "1"}
                              onChange={() => {
                                setFichasPoliza([]);
                                setFiltros((prev) => ({
                                  ...prev,
                                  criteria_busqueda: "1",
                                }));
                              }}
                            />
                            <span className="text-[13px]">Ficha Póliza</span>
                          </label>

                          <label
                            htmlFor="fichaCertificado"
                            className="inline-flex items-center gap-2 h-9"
                          >
                            <input
                              type="radio"
                              id="fichaCertificado"
                              name="ficha_radio"
                              className="h-4 w-4"
                              checked={filtros.criteria_busqueda === "2"}
                              onChange={() => {
                                setFichasPoliza([]);
                                setFiltros((prev) => ({
                                  ...prev,
                                  criteria_busqueda: "2",
                                }));
                              }}
                            />
                            <span className="text-[13px]">
                              Ficha Certificado
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Consulta de fecha */}
                      <div className="flex flex-col basis-1/4 min-w-0">
                        <label className="text-gray-500 text-[15px] mb-2">
                          Consulta de fecha:
                        </label>
                        <Select
                          {...selectPortalProps}
                          styles={customNewStyles}
                          options={opcionesTipoFecha}
                          value={optionFromValue(
                            opcionesTipoFecha,
                            filtros.consulta_de_fecha.tipo_fecha_busqueda
                          )}
                          onChange={(opt) =>
                            setFiltros((prev) => ({
                              ...prev,
                              consulta_de_fecha: {
                                ...prev.consulta_de_fecha,
                                tipo_fecha_busqueda: opt?.value || "",
                              },
                            }))
                          }
                          isClearable={false}
                          placeholder=""
                        />
                      </div>

                      {/* Desde */}
                      <div className="flex flex-col basis-1/4 min-w-0">
                        <label
                          htmlFor="desde"
                          className="text-gray-500 text-[15px] mb-2"
                        >
                          Desde:
                        </label>
                        <input
                          type="date"
                          id="desde"
                          name="desde"
                          className="h-9 w-full border border-gray-300 text-gray-900 focus:outline-none rounded-md px-2"
                          value={filtros.consulta_de_fecha.desde}
                          max={filtros.consulta_de_fecha.hasta || undefined}
                          onChange={(e) =>
                            setFiltros((prev) => ({
                              ...prev,
                              consulta_de_fecha: {
                                ...prev.consulta_de_fecha,
                                desde: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>

                      {/* Hasta */}
                      <div className="flex flex-col basis-1/4 min-w-0">
                        <label
                          htmlFor="hasta"
                          className="text-gray-500 text-[15px] mb-2"
                        >
                          Hasta:
                        </label>
                        <input
                          type="date"
                          id="hasta"
                          name="hasta"
                          className="h-9 w-full border border-gray-300 text-gray-900 focus:outline-none rounded-md px-2"
                          value={filtros.consulta_de_fecha.hasta}
                          min={filtros.consulta_de_fecha.desde || undefined}
                          onChange={(e) =>
                            setFiltros((prev) => ({
                              ...prev,
                              consulta_de_fecha: {
                                ...prev.consulta_de_fecha,
                                hasta: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>

                    {/* F I L A  2 */}
                    <div className="flex flex-row gap-12 mt-4 items-end">
                      {/* Unidad de negocio */}
                      <div className="flex flex-col basis-1/4 min-w-0">
                        <label className="text-gray-500 text-[15px] mb-2">
                          Unidad de negocio:
                        </label>
                        <Select
                          {...selectPortalProps}
                          styles={customNewStyles}
                          options={unidadNegocio}
                          value={optionFromValue(
                            unidadNegocio,
                            filtros.unidad_negocio
                          )}
                          onChange={(opt) =>
                            setFiltros((prev) => ({
                              ...prev,
                              unidad_negocio: opt?.value || "",
                            }))
                          }
                          isClearable
                          placeholder=""
                        />
                      </div>

                      {/* Nombre asesor (usuarios) */}
                      <div className="flex flex-col basis-1/4 min-w-0">
                        <label className="text-gray-500 text-[15px] mb-2">
                          Nombre asesor:
                        </label>
                        <Select
                          {...selectPortalProps}
                          styles={customNewStyles}
                          options={usuarios}
                          value={optionFromValue(
                            usuarios,
                            filtros.nombre_asesor
                          )}
                          onChange={(opt) =>
                            setFiltros((prev) => ({
                              ...prev,
                              nombre_asesor: opt?.value || "",
                            }))
                          }
                          isClearable
                          placeholder=""
                        />
                      </div>

                      {/* Analista / Asesor SGA */}
                      <div className="flex flex-col basis-1/4 min-w-0">
                        <label className="text-gray-500 text-[15px] mb-2">
                          Analista / Asesor SGA:
                        </label>
                        <Select
                          {...selectPortalProps}
                          styles={customNewStyles}
                          options={usuarios}
                          value={optionFromValue(
                            usuarios,
                            filtros.analista_asesor
                          )}
                          onChange={(opt) =>
                            setFiltros((prev) => ({
                              ...prev,
                              analista_asesor: opt?.value || "",
                            }))
                          }
                          isClearable
                          placeholder=""
                        />
                      </div>

                      {/* Aseguradora */}
                      <div className="flex flex-col basis-1/4 min-w-0">
                        <label
                          htmlFor="aseguradora"
                          className="text-gray-500 text-[15px] mb-2"
                        >
                          Aseguradora:
                        </label>
                        <Select
                          {...selectPortalProps}
                          styles={customNewStyles}
                          options={opcionesAseguradora}
                          value={optionFromValue(
                            opcionesAseguradora,
                            filtros.aseguradora
                          )}
                          onChange={(opt) =>
                            setFiltros((prev) => ({
                              ...prev,
                              aseguradora: opt?.value || "",
                            }))
                          }
                          isClearable
                          placeholder=""
                        />
                      </div>
                    </div>

                    {/* F I L A  3 */}
                    <div className="flex flex-row gap-12 mt-4 items-end">
                      {/* Ramo */}
                      <div className="flex flex-col basis-1/4 min-w-0">
                        <label className="text-gray-500 text-[15px] mb-2">
                          Ramo:
                        </label>
                        <Select
                          {...selectPortalProps}
                          styles={customNewStyles}
                          options={opcionesRamo}
                          value={optionFromValue(opcionesRamo, filtros.ramo)}
                          onChange={(opt) =>
                            setFiltros((prev) => ({
                              ...prev,
                              ramo: opt?.value || "",
                            }))
                          }
                          isClearable
                          placeholder=""
                        />
                      </div>

                      {/* Forma de pago */}
                      <div className="flex flex-col basis-1/4 min-w-0">
                        <label className="text-gray-500 text-[15px] mb-2">
                          Forma de pago:
                        </label>
                        <Select
                          {...selectPortalProps}
                          styles={customNewStyles}
                          options={opcionesFormaPago}
                          value={optionFromValue(
                            opcionesFormaPago,
                            filtros.forma_pago
                          )}
                          onChange={(opt) =>
                            setFiltros((prev) => ({
                              ...prev,
                              forma_pago: opt?.value || "",
                            }))
                          }
                          isClearable
                          placeholder=""
                        />
                      </div>

                      {/* Financiada por */}
                      <div className="flex flex-col basis-1/4 min-w-0">
                        <label className="text-gray-500 text-[15px] mb-2">
                          Financiada por:
                        </label>
                        <Select
                          {...selectPortalProps}
                          styles={customNewStyles}
                          options={opcionesFinanciador}
                          value={optionFromValue(
                            opcionesFinanciador,
                            filtros.financiada_por
                          )}
                          onChange={(opt) =>
                            setFiltros((prev) => ({
                              ...prev,
                              financiada_por: opt?.value || "",
                            }))
                          }
                          isClearable
                          placeholder=""
                        />
                      </div>

                      {/* Placa */}
                      <div className="flex flex-col basis-1/4 min-w-0">
                        <label
                          htmlFor="placa"
                          className="text-gray-500 text-[15px] mb-2"
                        >
                          Placa:
                        </label>
                        <input
                          type="text"
                          id="placa"
                          className="h-9 w-full border border-gray-300 text-gray-900 focus:outline-none rounded-md px-2"
                          value={filtros.placa}
                          onChange={(e) =>
                            setFiltros((prev) => ({
                              ...prev,
                              placa: e.target.value,
                            }))
                          }
                          placeholder=""
                        />
                      </div>
                    </div>

                    {/* F I L A  4 */}
                    <div className="flex flex-row gap-12 mt-4 items-end">
                      {/* # Póliza */}
                      <div className="flex flex-col basis-1/4 min-w-0">
                        <label
                          htmlFor="no_poliza"
                          className="text-gray-500 text-[15px] mb-2"
                        >
                          # Póliza:
                        </label>
                        <input
                          type="text"
                          id="no_poliza"
                          className="h-9 w-full border border-gray-300 text-gray-900 focus:outline-none rounded-md px-2"
                          value={filtros.no_poliza}
                          onChange={(e) =>
                            setFiltros((prev) => ({
                              ...prev,
                              no_poliza: e.target.value,
                            }))
                          }
                          placeholder=""
                        />
                      </div>

                      {/* Tipo cliente */}
                      <div className="flex flex-col basis-1/4 min-w-0">
                        <label className="text-gray-500 text-[15px] mb-2">
                          Tipo cliente:
                        </label>
                        <Select
                          {...selectPortalProps}
                          styles={customNewStyles}
                          options={opcionesTipoCliente}
                          value={optionFromValue(
                            opcionesTipoCliente,
                            filtros.aseg_tom_ben.tipo_cliente
                          )}
                          onChange={(opt) =>
                            setFiltros((prev) => ({
                              ...prev,
                              aseg_tom_ben: {
                                ...prev.aseg_tom_ben,
                                tipo_cliente: opt?.value || "",
                              },
                            }))
                          }
                          isClearable
                          placeholder=""
                        />
                      </div>

                      {/* Documento */}
                      <div className="flex flex-col basis-1/4 min-w-0">
                        <label
                          htmlFor="doc_cliente"
                          className="text-gray-500 text-[15px] mb-2"
                        >
                          Documento:
                        </label>
                        <input
                          type="text"
                          id="doc_cliente"
                          className="h-9 w-full border border-gray-300 text-gray-900 focus:outline-none rounded-md px-2"
                          value={filtros.aseg_tom_ben.documento}
                          onChange={(e) =>
                            setFiltros((prev) => ({
                              ...prev,
                              aseg_tom_ben: {
                                ...prev.aseg_tom_ben,
                                documento: e.target.value,
                              },
                            }))
                          }
                          placeholder=""
                        />
                      </div>

                      {/* ACCIONES (última celda) */}
                      <div className="flex flex-col basis-1/4 min-w-0">
                        {/* etiqueta invisible para alinear alturas */}
                        <label className="text-gray-500 text-[15px] mb-2 invisible">
                          Acciones
                        </label>
                        <div className="flex flex-row gap-3">
                          <BtnGeneral
                            id="btnConsultarLiquidacion"
                            className="h-9 flex-1 bg-lime-9000 text-white rounded hover:bg-lime-600 transition duration-300 ease-in-out"
                            funct={handlerQuery}
                          >
                            <span>Consultar</span>
                          </BtnGeneral>
                          <BtnGeneral
                            id="btnLimpiarFiltros"
                            className="h-9 flex-1 bg-black text-white rounded hover:opacity-90 transition duration-300 ease-in-out"
                            funct={handleClearFilters}
                          >
                            <span>Limpiar</span>
                          </BtnGeneral>
                        </div>
                      </div>
                    </div>

                    {/* (Sin fila extra de botones; ya están en la última celda) */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div ref={resultadosRef}>
          {/* Resultado con header + botón plegable */}
          {Array.isArray(fichasPoliza) && fichasPoliza.length > 0 && (
            <section className="mt-10 border rounded-xl overflow-hidden">
              {/* Header de la sección con botón al final */}
              <div className="flex items-center justify-between bg-gray-100 px-5 py-3 border-b">
                <h3 className="font-medium">
                  Resultados ({fichasPoliza.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setTablaAbierta((v) => !v)}
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
                  aria-expanded={tablaAbierta}
                  aria-controls="tablaResultados"
                  title={tablaAbierta ? "Ocultar" : "Mostrar"}
                >
                  <span className="text-sm hidden sm:inline">
                    {tablaAbierta ? "Ocultar" : "Mostrar"}
                  </span>
                  {tablaAbierta ? (
                    <FiChevronUp size={18} />
                  ) : (
                    <FiChevronDown size={18} />
                  )}
                </button>
              </div>

              {/* Contenido plegable */}
              <div
                id="tablaResultados"
                className={`transition-all duration-300 ${
                  tablaAbierta
                    ? "max-h-[4000px] opacity-100"
                    : "max-h-0 opacity-0"
                } overflow-hidden`}
              >
                <div className="p-5" ref={resultadosRef}>
                  <TableConsultas
                    data={fichasPoliza}
                    headers={headers}
                    from=""
                    typeSearch={filtros.criteria_busqueda}
                    onRowAction={handlerNavigateToDetail}
                  />
                </div>
              </div>
            </section>
          )}
        </div>
      </Box>
    </div>
  );
};
