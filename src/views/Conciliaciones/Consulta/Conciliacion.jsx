import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import Select from "react-select";
import Swal from "sweetalert2";
import { obtenerAseguradoras, obtenerRamo } from "../../../utils/aseguradoras";
import { getTiposPoliza } from "../../../services/Polizas/getTiposPoliza";
import Loader from "../../../components/LoaderFullScreen/Loader";
import BtnGeneral from "../../../components/BtnGeneral/BtnGeneral";
import { getFinancieras } from "../../../services/Polizas/getFinancieras";
import { TablaConciliacion } from "../../../components/Conciliaciones/TablaConciliacion";
import { getConciliacionPolizas } from "../../../services/Conciliaciones/getConciliacionPolizas";
import { saveConciliacion } from "../../../services/Conciliaciones/saveConciliacion";
import { saveComentarioConciliacion } from "../../../services/Conciliaciones/saveComentarioConciliacion";
import { updateComentarioConciliacion } from "../../../services/Conciliaciones/updateComentarioConciliacion";
import { updateConciliacion } from "../../../services/Conciliaciones/updateConciliacion";
import { RegistroConciliacion } from "../Registro/RegistroConciliacion";
import { CancelacionConciliacion } from "../Registro/CancelacionesConciliacion";

export const Conciliacion = ({ setLoading, loading }) => {
  const initialState = {
    poliza: "",
    aseguradora: "",
    ramo: "",
    nombreAsegurado: "",
    tipoexpedicion: "",
    fechainiciovigdesde: "",
    fechafinvighasta: "",
    estadoconciliacion: "",
    financieras: "",
  };

  const [polizas, setPolizas] = useState([]);
  const [formStates, setFormStates] = useState(initialState);
  const [financieras, setFinancieras] = useState([]);
  const [aseguradoras, setAseguradoras] = useState([]);
  const [ramos, setRamos] = useState([]);
  const [tiposExpedicion, setTiposExpedicion] = useState([]);
  const [selectedPoliza, setSelectedPoliza] = useState(null);
  const [selectedPolizaCancelacion, setSelectedPolizaCancelacion] = useState(null);
  const [userData, setUserData] = useState(null);

  const isCancellationPolicy = (row) => {
    const tipoCertificado = String(row?.tipo_certificado ?? "").trim();
    const tipoExpedicion = String(row?.tipo ?? row?.tipo_expedicion ?? "")
      .trim()
      .toLowerCase();

    return tipoCertificado === "4" || tipoExpedicion === "cancelacion";
  };

  const handlerLoadFinancieras = async () => {
    try {
      const data = await getFinancieras();
      setFinancieras(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error en la carga de financieras", e);
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

  const handlerLoadTiposExpedicion = async () => {
    try {
      const data = await getTiposPoliza();
      setTiposExpedicion(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error en la carga de tipos de expedicion", e);
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

  const handlerLoadPolizasUser = async () => {
    setLoading(true);
    try {
      const data = await getConciliacionPolizas(formStates);
      const rows = Array.isArray(data) ? data : [];

      if (rows.length === 0) {
        setPolizas([]);
        Swal.fire(
          "Error",
          "No se encontraron polizas para el usuario",
          "error",
        );
        return;
      }

      setPolizas(rows);
    } catch (e) {
      console.error("Error en la consulta de polizas", e);
      Swal.fire("Error", "No fue posible consultar las polizas", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUserData = () => {
    const storedData = localStorage.getItem("userData");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setUserData(parsedData);
      } catch (e) {
        console.error("Error al parsear los datos del usuario", e);
      }
    } else {
      console.warn("No se encontraron datos del usuario en localStorage");
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          handlerLoaderAseguradoras(),
          handlerLoadFinancieras(),
          handlerLoadRamo(),
          handlerLoadTiposExpedicion(),
          handleUserData(),
        ]);
      } catch (error) {
        console.error("Error en la carga inicial", error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  const headers = [
    { field: "id_remision", header: "ID Remisión" },
    { field: "fecha_expedicion", header: "Fecha Exp" },
    { field: "ramo", header: "Ramo" },
    { field: "poliza", header: "# Póliza" },
    { field: "certificado", header: "Certif" },
    { field: "tomador", header: "Tomador" },
    { field: "documento_tomador", header: "Doc Tomador" },
    { field: "placa", header: "Placa" },
    { field: "asistencia", header: "Asistencia" },
    { field: "prima_sin_iva", header: "Prima sin IVA" },
    { field: "gastos", header: "Gastos" },
    { field: "iva", header: "IVA" },
    { field: "valor_total", header: "Valor Total" },
    { field: "inicio_vig", header: "Inicio Vig" },
    { field: "compania", header: "Compañía" },
    { field: "tipo", header: "Tipo" },
    { field: "asesor_freelance", header: "Asesor Freelance" },
    { field: "asesor_ganador", header: "Asesor Ganador" },
    { field: "asesor_10", header: "Asesor 10" },
    { field: "unidad_negocio", header: "Unidad de negocio" },
    { field: "forma_pago", header: "Forma de pago" },
    { field: "financiera", header: "Financiera" },
    { field: "cuotas", header: "Cuotas" },
    { field: "estado_cartera", header: "Estado Cartera" },
    { field: "estado_conciliacion", header: "Estado Conciliación" },
    { field: "numero_factura", header: "# Factura" },
    { field: "porcentaje_comision", header: "% comisión" },
    { field: "prima_planilla", header: "Prima planilla" },
    { field: "fecha_conciliacion", header: "Fecha conciliación" },
    { field: "saldo", header: "Saldo" },
    { field: "comision_recibida", header: "Comisión recibida" },
    { field: "valor_cancelacion", header: "Valor Cancelación" },
    { field: "porcentaje_cancelacion", header: "% cancelación" },
    { field: "pago_financieras", header: "Pago financieras" },
    { field: "accion", header: "Acción" },
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
      padding: 0, // menos padding
      marginRight: 4, // opcional: separa de borde derecho
      cursor: "pointer",
      svg: { width: 12, height: 12 }, // achica el ícono
    }),
    indicatorsContainer: (base) => ({
      ...base,
      paddingRight: 4, // reduce el espacio del contenedor de íconos
      gap: 2, // compacta íconos (clear + dropdown)
    }),
    valueContainer: (base) => ({
      ...base,
      paddingRight: 4, // evita que la “x” empuje el texto
    }),
  };

  const estadoConciliacionOptions = [
    { value: "1", label: "Pendiente" },
    { value: "2", label: "Conciliada" },
  ];

  const cleanTableAndFilters = () => {
    setFormStates(initialState);
    setPolizas([]);
    setSelectedPoliza(null);
    setSelectedPolizaCancelacion(null);
  };

  const handleOpenRegistro = (row) => {
    if (!row) {
      setSelectedPoliza(null);
      setSelectedPolizaCancelacion(null);
      return;
    }

    if (isCancellationPolicy(row)) {
      setSelectedPoliza(null);
      setSelectedPolizaCancelacion(row);
      return;
    }

    setSelectedPolizaCancelacion(null);
    setSelectedPoliza(row);
  };

  const handleCloseRegistro = () => {
    setSelectedPoliza(null);
    setSelectedPolizaCancelacion(null);
  };

  const activeSelectedPoliza = selectedPolizaCancelacion || selectedPoliza;

  const getCurrentUserId = () => {
    const value = Number(userData?.id_usuario ?? 0);
    return Number.isFinite(value) && value > 0 ? value : null;
  };

  const computeNegativeCancelacionFields = (merged) => {
    if (!isCancellationPolicy(merged)) {
      return {};
    }
    const concs = Array.isArray(merged.conciliaciones) ? merged.conciliaciones : [];
    const last = concs.length > 0 ? concs[concs.length - 1] : null;
    if (!last) {
      return {};
    }
    const rawPrima = Math.abs(
      Number(String(last.prima_planilla ?? "").replace(/[^\d.]/g, "")),
    );
    const rawPct = Math.abs(Number(last.porcentaje_comision ?? 0));
    return {
      valor_cancelacion:
        Number.isFinite(rawPrima) && rawPrima > 0
          ? (-rawPrima).toLocaleString("es-CO", {
              style: "currency",
              currency: "COP",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })
          : merged.valor_cancelacion,
      porcentaje_cancelacion:
        Number.isFinite(rawPct) && rawPct > 0
          ? `-${rawPct}%`
          : merged.porcentaje_cancelacion,
    };
  };

  const applyPolizaUpdate = (updatedPoliza) => {
    if (!updatedPoliza?.id_anexo_poliza) {
      return;
    }

    setPolizas((prev) =>
      prev.map((item) => {
        if (String(item.id_anexo_poliza) !== String(updatedPoliza.id_anexo_poliza)) {
          return item;
        }
        const merged = { ...item, ...updatedPoliza };
        return { ...merged, ...computeNegativeCancelacionFields(merged) };
      }),
    );

    setSelectedPoliza((prev) => {
      if (!prev) {
        return prev;
      }

      if (String(prev.id_anexo_poliza) !== String(updatedPoliza.id_anexo_poliza)) {
        return prev;
      }

      const merged = { ...prev, ...updatedPoliza };
      return { ...merged, ...computeNegativeCancelacionFields(merged) };
    });

    setSelectedPolizaCancelacion((prev) => {
      if (!prev) {
        return prev;
      }

      if (String(prev.id_anexo_poliza) !== String(updatedPoliza.id_anexo_poliza)) {
        return prev;
      }

      const merged = { ...prev, ...updatedPoliza };
      return { ...merged, ...computeNegativeCancelacionFields(merged) };
    });
  };

  const handleSubmitRegistro = async (payload) => {
    if (!activeSelectedPoliza?.id_poliza || !activeSelectedPoliza?.id_anexo_poliza) {
      Swal.fire("Error", "No se encontro la poliza para registrar la conciliacion", "error");
      return false;
    }

    const response = await saveConciliacion({
      ...payload,
      id_poliza: activeSelectedPoliza.id_poliza,
      id_anexo_poliza: activeSelectedPoliza.id_anexo_poliza,
      id_usuario: getCurrentUserId(),
    });

    if (response?.status !== "Ok") {
      Swal.fire(
        "Error",
        response?.message || "No fue posible registrar la conciliacion",
        "error",
      );
      return false;
    }

    if (response?.data?.poliza) {
      applyPolizaUpdate(response.data.poliza);
    }

    return response?.data?.conciliacion || true;
  };

  const handleSaveComentario = async (payload) => {
    if (!activeSelectedPoliza?.id_poliza || !activeSelectedPoliza?.id_anexo_poliza) {
      return false;
    }

    const response = await saveComentarioConciliacion({
      ...payload,
      id_poliza: activeSelectedPoliza.id_poliza,
      id_anexo_poliza: activeSelectedPoliza.id_anexo_poliza,
      id_usuario: getCurrentUserId(),
    });

    if (response?.status !== "Ok") {
      Swal.fire(
        "Error",
        response?.message || "No fue posible guardar el comentario",
        "error",
      );
      return false;
    }

    return response?.data || true;
  };

  const handleUpdateComentario = async (payload) => {
    const response = await updateComentarioConciliacion({
      ...payload,
      id_usuario: getCurrentUserId(),
    });

    if (response?.status !== "Ok") {
      Swal.fire(
        "Error",
        response?.message || "No fue posible actualizar el comentario",
        "error",
      );
      return false;
    }

    return response?.data || true;
  };

  const handleUpdateConciliacion = async (payload) => {
    const response = await updateConciliacion({
      ...payload,
      id_usuario: getCurrentUserId(),
    });

    if (response?.status !== "Ok") {
      Swal.fire(
        "Error",
        response?.message || "No fue posible actualizar la conciliacion",
        "error",
      );
      return false;
    }

    if (response?.data?.poliza) {
      applyPolizaUpdate(response.data.poliza);
    }

    return response?.data?.conciliacion || true;
  };

  return (
    <div className="w-full">
      <Loader isLoading={loading} />
      <RegistroConciliacion
        open={Boolean(selectedPoliza)}
        onClose={handleCloseRegistro}
        onSubmit={handleSubmitRegistro}
        onSaveComentario={handleSaveComentario}
        onUpdateComentario={handleUpdateComentario}
        onUpdateConciliacion={handleUpdateConciliacion}
        poliza={selectedPoliza}
        userData={userData}
        setLoading={setLoading}
      />
      <CancelacionConciliacion
        open={Boolean(selectedPolizaCancelacion)}
        onClose={handleCloseRegistro}
        onSubmit={handleSubmitRegistro}
        onSaveComentario={handleSaveComentario}
        onUpdateComentario={handleUpdateComentario}
        onUpdateConciliacion={handleUpdateConciliacion}
        poliza={selectedPolizaCancelacion}
        userData={userData}
        setLoading={setLoading}
      />
      <Box padding={3}>
        <section className="shadow-sm rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 mb-6">
          <h1 className="text-lg font-semibold text-gray-900">
            Conciliación aseguradoras
          </h1>
        </section>
        <section className="shadow-lg rounded-3xl xl:w-full lg:w-full relative z-[50]">
          <div className="flex flex-row gap-3 items-center bg-gray-100 p-3 rounded-t-3xl border-gray-200 border">
            <p className="text-lg pl-3 font-semibold">Consulta Avanzada</p>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-b-3xl border-l border-r border-b border-gray-200 bg-white px-8 py-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col w-full">
              <label
                htmlFor="poliza"
                className="text-sm font-medium text-gray-800"
              >
                # póliza
              </label>
              <input
                type="text"
                name="poliza"
                className="h-[35px] w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 focus:outline-none"
                value={formStates.poliza}
                onChange={(e) =>
                  setFormStates((prev) => ({
                    ...prev,
                    [e.target.name]: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex flex-col w-full">
              <label
                htmlFor="aseguradora"
                className="text-sm font-medium text-gray-800"
              >
                Compañía
              </label>
              <Select
                name="aseguradora"
                className="text-sm"
                options={aseguradoras}
                value={
                  aseguradoras.find(
                    (opt) => opt.value === formStates.aseguradora,
                  ) || null
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

            <div className="flex flex-col w-full">
              <label
                htmlFor="ramo"
                className="text-sm font-medium text-gray-800"
              >
                Ramo
              </label>
              <Select
                name="ramo"
                className="text-sm"
                options={ramos}
                value={
                  ramos.find((opt) => opt.value === formStates.ramo) || null
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

            <div className="flex flex-col w-full">
              <label
                htmlFor="nombreAsegurado"
                className="text-sm font-medium text-gray-800"
              >
                Nombre asegurado
              </label>
              <input
                type="text"
                name="nombreAsegurado"
                className="h-[35px] w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 focus:outline-none"
                value={formStates.nombreAsegurado}
                onChange={(e) =>
                  setFormStates((prev) => ({
                    ...prev,
                    [e.target.name]: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex flex-col w-full">
              <label
                htmlFor="tipoexpedicion"
                className="text-sm font-medium text-gray-800"
              >
                Tipo de expedición
              </label>
              <Select
                name="tipoexpedicion"
                className="text-sm"
                options={tiposExpedicion}
                value={
                  tiposExpedicion.find(
                    (opt) => opt.value === formStates.tipoexpedicion,
                  ) || null
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

            <div className="flex flex-col w-full">
              <label
                htmlFor="fechainiciovigdesde"
                className="text-sm font-medium text-gray-800"
              >
                Fecha inicio de vigencia desde
              </label>
              <input
                type="date"
                name="fechainiciovigdesde"
                className="h-[35px] w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 focus:outline-none"
                value={formStates.fechainiciovigdesde}
                onChange={(e) =>
                  setFormStates((prev) => ({
                    ...prev,
                    [e.target.name]: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex flex-col w-full">
              <label
                htmlFor="fechafinvighasta"
                className="text-sm font-medium text-gray-800"
              >
                Fecha inicio de vigencia hasta
              </label>
              <input
                type="date"
                name="fechafinvighasta"
                className="h-[35px] w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 focus:outline-none"
                value={formStates.fechafinvighasta}
                onChange={(e) =>
                  setFormStates((prev) => ({
                    ...prev,
                    [e.target.name]: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex flex-col w-full">
              <label
                htmlFor="estadoliquidacion"
                className="text-sm font-medium text-gray-800"
              >
                Estado conciliación
              </label>
              <Select
                name="estadoconciliacion"
                className="text-sm"
                options={estadoConciliacionOptions}
                value={
                  estadoConciliacionOptions.find(
                    (opt) => opt.value === formStates.estadoconciliacion,
                  ) || null
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

            <div className="flex flex-col w-full">
              <label
                htmlFor="financieras"
                className="text-sm font-medium text-gray-800"
              >
                Financiera
              </label>
              <Select
                name="financieras"
                className="text-sm"
                options={financieras}
                value={
                  financieras.find(
                    (opt) => opt.value === formStates.financieras,
                  ) || null
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

            <div className="flex items-end w-full">
              <BtnGeneral
                id={"btnConsultarConciliacion"}
                className={
                  "bg-lime-9000 text-white w-full h-[35px] rounded-md hover:bg-lime-600 transition duration-300 ease-in-out"
                }
                funct={() => handlerLoadPolizasUser()}
              >
                <span>Consultar</span>
              </BtnGeneral>
            </div>

            <div className="flex items-end w-full">
              <BtnGeneral
                id={"btnLimpiarConciliacion"}
                className={
                  "bg-black text-white w-full h-[35px] rounded-md hover:bg-gray-700 transition duration-300 ease-in-out"
                }
                funct={() => cleanTableAndFilters()}
              >
                <span>Limpiar</span>
              </BtnGeneral>
            </div>

            <div className="hidden lg:block" />
            <div className="hidden lg:block" />
          </div>
        </section>

        {polizas.length > 0 && (
          <section className="mt-3 rounded border border-gray-200 bg-white">
            <TablaConciliacion
              data={polizas ?? []}
              headers={headers}
              onRowAction={handleOpenRegistro}
            />
          </section>
        )}
      </Box>
    </div>
  );
};
