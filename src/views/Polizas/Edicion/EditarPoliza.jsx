import { SearchOutlined } from "@mui/icons-material";
import { PiMagnifyingGlass } from "react-icons/pi";

import { IoCalendarOutline } from "react-icons/io5";
import { RiPagesLine } from "react-icons/ri";
import { MdOutlineAutorenew } from "react-icons/md";
import { IoWarningOutline } from "react-icons/io5";

import Loader from "../../../components/LoaderFullScreen/Loader";
import BtnGeneral from "../../../components/BtnGeneral/BtnGeneral";
import { CardUser } from "../components/CardUser";
import { GeneralBox } from "../../../components/GeneralBox/GeneralBox";
import { useContext, useEffect, useMemo, useState } from "react";
import { obtenerAseguradoras, obtenerRamo } from "../../../utils/aseguradoras";
import { getFormasPago } from "../../../utils/getPolizas";
import { RegistroPago } from "../components/RegistroPago";
import Swal from "sweetalert2";
import { NavContext } from "../../../context/NavContext";
import ModalCliente from "../../../components/ModalCliente/ModalCliente";
import { getClientById } from "../../../services/Clientes/getClientById";
import { getVehiculo } from "../../../services/Polizas/getVehiculo";
import { getAnalistas } from "../../../services/Users/getAnalistas";
import { getFreelances } from "../../../services/Users/getFreelance";
import Select from "react-select";
import { getAnalistaByFreelance } from "../../../services/Users/getAnalistaByFreelance";
import { ModalOneroso } from "../../../components/ModalBOneroso/ModalOneroso";
import { getTecnicos } from "../../../services/Users/getTecnicoEmisores";
import { getDirectores } from "../../../services/Users/getDirectores";
import { getAsistentes } from "../../../services/Users/getAsistentes";
import { getUnidadesNegocio } from "../../../services/Polizas/getUnidadNegocio";
import { getOtrosConceptos } from "../../../services/Polizas/getOtrosConceptos";
import { getTiposPoliza } from "../../../services/Polizas/getTiposPoliza";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { retrivePoliza } from "../../../services/Polizas/retrivePoliza";
import { TopRight } from "../../../components/Notifications/TopRight";
import { createPagoAnexo } from "../../../services/Polizas/createPago";
import { updatePoliza } from "../../../services/Polizas/updatePoliza";
import { MovimientoModal } from "../Movimientos/MovimientoModal";
import { VerMovimientosModal } from "../Movimientos/VerMovimientosModal";
import { retrivePolizaById } from "../../../services/Polizas/retrivePolizaById";
import { getLiquidacionesToQuery } from "../../../services/Polizas/Query/getLiquidacionesToQuery";
import SkeletonLine from "../../../components/SkeletonLine/SkeletonLine";
import { getCoordinadores } from "../../../services/Users/getCoordinadores";
import { getFinancieras } from "../../../services/Polizas/getFinancieras";
import { getAsesores10 } from "../../../services/Users/getAsesores10";
import { getAsesoresGanadores } from "../../../services/Users/getAsesoresGanadores";
import { getAsesoresSGA } from "../../../services/Users/getAsesoresSGA";
import { getQuotesFinancieras } from "../../../services/Polizas/getQuotesFinancieras";

/* Helpers */
const noop = () => {};
const uid = () => Math.random().toString(36).slice(2, 9);
// Qué campos aceptan negativos (agrega/quita según necesites)
const NEGATIVE_ALLOWED = new Set([
  "iva",
  "asistenciasotros",
  "gastosexpedicion",
  "valortotal",
  "primaneta", // <- si también quieres permitir negativo aquí, descomenta
]);
const formatCOP = (n) =>
  Number(n || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatMoneyInput = (raw, name) => {
  const allowNeg = NEGATIVE_ALLOWED.has(name);
  const trimmed = String(raw).trim();

  // permite escribir solo '-' temporalmente
  if (allowNeg && trimmed === "-") return "-";

  const isNeg = allowNeg && trimmed.startsWith("-");
  const digits = trimmed.replace(/[^\d]/g, "");
  if (digits === "") return ""; // vacío

  const n = parseInt(digits, 10);
  const signed = isNeg ? -n : n;
  return formatCOP(signed);
};

// parse que conserva el signo
const parseCOP = (v) => {
  if (v === null || v === undefined || v === "") return 0;
  const s = String(v).replace(/[^\d-]/g, ""); // deja solo dígitos y un posible '-'
  if (s === "" || s === "-") return 0;
  return parseInt(s, 10) || 0;
};

export const EditarPoliza = ({ setLoading, loading }) => {
  const path = useLocation().pathname;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("no_remision") ?? null;
  const id_poliza = searchParams.get("id_poliza") ?? null;
  const id_anexo = searchParams.get("id_anexo") ?? null;
  const [dataPoliza, setDataPoliza] = useState({});
  const [pagosLiquidaciones, setPagosLiquidaciones] = useState([]);

  const [idPoliza, setIdPoliza] = useState(null);
  const [bodyPoliza, setBodyPoliza] = useState({});

  const [insurers, setInsurers] = useState([]);
  const [ramo, setRamo] = useState([]);
  const [coordinadores, setCoordinadores] = useState([]);

  const [formasPago, setFormasPago] = useState([]);

  const [valorTotal, setValorTotal] = useState("");

  const [quotesFinancieras, setQuotesFinancieras] = useState([]);

  const [registrarPagos, setRegistrarPagos] = useState(true);

  const [cliente, setCliente] = useState([]);

  const [idClienteIntegradoor, setIdClienteIntegradoor] = useState(null);

  const [documentoTemp, setDocumentoTemp] = useState(null);

  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [modalVerMovimientos, setModalVerMovimientos] = useState(false);

  const [buttonSwitch, setButtonSwitch] = useState({
    Asegurado: false,
    Beneficiario: false,
  });

  const [procedenciaCliente, setProcedenciaCliente] = useState({
    procedenciaCliente: "",
    system: "",
    idCliente: "",
  });

  // Estados Tomador, Asegurado, Beneficiario INICIO
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [datosUsuarios, setDatosUsuarios] = useState({
    Tomador: {
      tipoIdentificacion: "",
      numeroIdentificacion: "",
      nombre: "",
    },
    Asegurado: {
      tipoIdentificacion: "",
      numeroIdentificacion: "",
      nombre: "",
    },
    Beneficiario: {
      tipoIdentificacion: "",
      numeroIdentificacion: "",
      nombre: "",
    },
  });

  const handleDatosChange = (tipo, campo, valor) => {
    setDatosUsuarios((prev) => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        [campo]: valor,
      },
    }));
  };

  const handleMoneyPoliza = (e) => {
    const { name, value } = e.target;
    setValoresPoliza((prev) => ({
      ...prev,
      [name]: formatMoneyInput(value, name),
    }));
  };

  const [modalOneroso, setModalOneroso] = useState(false);

  const [nuevoBeneficiario, setNuevoBeneficiario] = useState({
    tipoIdentificacion: "1",
    numeroIdentificacion: "",
    razon_social: "",
    correo1: "",
    correo2: "",
    observaciones: "",
  });

  // Estados Tomador, Asegurado, Beneficiario FIN

  // Estados de cabezote de poliza INICIO

  const [cabezotePoliza, setCabezotePoliza] = useState({
    noPoliza: "",
    noCertificado: "0",
    aseguradora: "",
    ramo: "",
    tipoCertificado: "",
    fechaInicioVigencia: "",
    fechaFinVigencia: "",
    fechaExpedicion: "",
    fechaRegistro: "",
    renovable: "Si",
  });

  const [tiposPoliza, setTiposPoliza] = useState([]);

  const handleCabezotePolizaChange = (e) => {
    const { name, value } = e.target;
    if (name === "fechaInicioVigencia") {
      let fechaVigencia = new Date(value);
      fechaVigencia.setFullYear(fechaVigencia.getFullYear() + 1);
      setCabezotePoliza((prev) => ({
        ...prev,
        fechaFinVigencia: fechaVigencia.toISOString().split("T")[0],
      }));
    }
    setCabezotePoliza((prev) => ({ ...prev, [name]: value }));
  };

  // Estados de vehiculo

  const INPUT_PLACA_ALLOW = [1, 7, 8, 14, 15, 24, 25, 26, 27, 31];

  const [vehiculo, setVehiculo] = useState({
    busqueda: "",
    placa: "",
    fasecolda: "",
    valorFasecolda: "",
    marca: "",
    modelo: "",
    linea: "",
    clase: "",
  });

  const handleVehiculoChange = (e) => {
    const { name, value } = e.target;

    // Campo especial: valorFasecolda (máscara de moneda)
    if (name === "valorFasecolda") {
      // Quito todo lo que no sean dígitos
      const digits = value.replace(/\D/g, "");
      const numericValue = digits === "" ? "" : parseInt(digits, 10);

      // En el estado del vehículo guardo el número (o vacío)
      setVehiculo((prev) => ({
        ...prev,
        valorFasecolda: numericValue,
      }));

      // En el body que va al backend guardo solo número
      setBodyPoliza((prev) => ({
        ...prev,
        vehiculo: {
          ...prev.vehiculo,
          ...vehiculo,
          valorFasecolda: numericValue === "" ? 0 : numericValue,
        },
      }));

      return;
    }

    // Resto de campos del vehículo igual que antes
    setVehiculo((prev) => ({ ...prev, [name]: value }));
    setBodyPoliza((prev) => ({
      ...prev,
      vehiculo: {
        ...prev.vehiculo,
        ...vehiculo,
        [name]: value,
      },
    }));
  };

  const handlerGetVehiculo = async () => {
    if (vehiculo.busqueda === "") {
      Swal.fire({
        icon: "warning",
        title: "Campo vacío",
        text: "Por favor ingrese una placa para buscar el vehículo.",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await getVehiculo(vehiculo.busqueda);
      if (response.status === "Ok") {
        setVehiculo({
          ...vehiculo,
          placa: response.data.placa,
          marca: response.data.marca,
          modelo: response.data.modelo,
          valorFasecolda: response.data.valorFasecolda,
          fasecolda: response.data.fasecolda,
          linea: response.data.linea,
          clase: response.data.clase,
        });
      }
      setBodyPoliza((prev) => ({
        ...prev,
        vehiculo: {
          placa: response.data.placa,
          marca: response.data.marca,
          modelo: response.data.modelo,
          valorFasecolda: response.data.valorFasecolda,
          fasecolda: response.data.fasecolda,
          linea: response.data.linea,
          clase: response.data.clase,
        },
      }));
    } catch (error) {
      console.error("Error fetching vehicle data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Estados Gestion Comercial INICIO

  const [analistas, setAnalistas] = useState([]);
  const [freelances, setFreelances] = useState([]);
  const [unidadNegocio, setUnidadNegocio] = useState([]);
  const [tecnicosEmisores, setTecnicosEmisores] = useState([]);
  const [asesoresSGA, setAsesoresSGA] = useState([]);
  const [asistentes, setAsistentes] = useState([]);
  // const [coordinadores, setCoordinadores] = useState([]);
  const [directoresComerciales, setDirectoresComerciales] = useState([]);
  const [asesoresGanadores, setAsesoresGanadores] = useState([]);
  const [asesores10, setAsesores10] = useState([]);

  const [gestionComercial, setGestionComercial] = useState({
    tecnicoemisor: "",
    analista: "",
    asesorcomercialinterno: "",
    asesorfreelance: "",
    asesorganador: "",
    asesor10: "",
    directorcomercial: "",
    coordinadortecnico: "",
    asistente: "",
    unidadnegocio: "",
    observaciones: "",
  });

  const handleGestionComercialChange = (e) => {
    const { name, value } = e.target;

    if (name == "unidadnegocio" && value == "4") {
      setGestionComercial((prev) => ({
        ...prev,
        unidadnegocio: value,
        asesorfreelance: "",
        asesorcomercialinterno: "",
        asesor10: "",
        asesorganador: "",
        coordinadortecnico: "",
        directorcomercial: "",
        asistente: "",
        analista: "",
      }));
      return;
    }

    if (name == "unidadnegocio" && value == "3") {
      setGestionComercial((prev) => ({
        ...prev,
        unidadnegocio: value,
        asesorfreelance: "",
        asesorcomercialinterno: "",
        asesor10: "",
        asesorganador: "",
        coordinadortecnico: "",
        directorcomercial: "",
        asistente: "",
        analista: "",
      }));
      return;
    }

    if (name == "unidadnegocio" && value == "2") {
      setGestionComercial((prev) => ({
        ...prev,
        unidadnegocio: value,
        asesorfreelance: "",
        asesorcomercialinterno: "",
        asesor10: "",
        asesorganador: "",
        coordinadortecnico: "",
        directorcomercial: "",
        asistente: "",
        analista: "",
      }));
      return;
    }

    if (name == "unidadnegocio" && value == "1") {
      setGestionComercial((prev) => ({
        ...prev,
        unidadnegocio: value,
        asesorfreelance: "",
        asesorcomercialinterno: "",
        asesor10: "",
        asesorganador: "",
        coordinadortecnico: "",
        directorcomercial: "",
        asistente: "",
        analista: "",
      }));
      return;
    }

    setGestionComercial((prev) => ({ ...prev, [name]: value }));
  };

  const handleGetAnalistaByFreelance = async (e) => {
    const { value } = e.target;
    try {
      const response = await getAnalistaByFreelance(value);
      if (response.status === "Ok") {
        setGestionComercial((prev) => ({
          ...prev,
          analista: response.data[0].id_analista,
        }));
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.message,
        });
      }
    } catch (error) {
      console.error("Error fetching analista:", error);
    }
  };
  // Estados Gestion Comercial FIN

  // Estados Valores de Póliza INICIO

  const [financieras, setFinancieras] = useState([]);

  const [valoresPoliza, setValoresPoliza] = useState({
    primaneta: "",
    asistenciasotros: "",
    gastosexpedicion: "",
    iva: "",
    valortotal: "",
    formapago: "",
    financiada: "",
    nocuotas: "",
    fechalimite: "",
    TRM_aviajes: "",
    primaneta_aviajes: "",
    valor_asistencia_aviajes: "",
  });

  const handleValorTotalChange = (e) => {
    const { value } = e.target;
    setValoresPoliza((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const calculateValorTotal = () => {
    const primaneta = parseCOP(valoresPoliza.primaneta);
    const asistenciasotros = parseCOP(valoresPoliza.asistenciasotros);
    const gastosexpedicion = parseCOP(valoresPoliza.gastosexpedicion);
    const ivaCalculado = parseCOP(valoresPoliza.iva);

    const total = parseCOP(valoresPoliza.valortotal);
    setValoresPoliza((prev) => ({
      ...prev,
      valortotal: formatCOP(total),
    }));
  };

  const handleChangesFinanciera = async () => {
    try {
      setLoading(true);
      const response = await getFinancieras();
      setFinancieras(response);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching financieras:", error);
    }
  };

  // Estados Valores de Póliza FIN

  // Estados de Pagos Poliza INICIO

  const [readyToSave, setReadyToSave] = useState(false);
  const [otrosConceptos, setOtrosConceptos] = useState([]);
  const [otrosConceptosValor, setOtrosConceptosValor] = useState({
    razon_concepto: "",
    valor: "",
  });

  const [observaciones, setObservaciones] = useState("");

  // Pagos existentes (DB)
  const [valoresRecibidos, setValoresRecibidos] = useState([]);

  // Pagos nuevos (temporales)
  const [valoresRecibidosTemp, setValoresRecibidosTemp] = useState([
    {
      uid: uid(), // clave estable para React
      fecha: "",
      formaPago: "",
      valor: "",
      certificado: cabezotePoliza.noCertificado,
      observaciones: "",
    },
  ]);

  const handleAgregarPago = () => {
    setValoresRecibidosTemp((prev) => [
      ...prev,
      {
        uid: uid(), // clave estable para React
        fecha: "",
        formaPago: "",
        valor: "",
        certificado: cabezotePoliza.noCertificado,
        observaciones: "",
      },
    ]);
  };

  const handleEliminarPago = (tempIndex) => {
    setValoresRecibidosTemp((prev) => prev.filter((_, i) => i !== tempIndex));
  };

  // Estados de Pagos Poliza FIN

  const {
    selectedClientId,
    setSelectedClientId,
    isModalOpenCliente,
    clearMovimiento,
    setIsModalOpenCliente,
  } = useContext(NavContext);
  const userData = JSON.parse(localStorage.getItem("userData"));

  useEffect(() => {
    setLoading(true);

    setCabezotePoliza((prev) => ({
      ...prev,
      fechaRegistro: new Date().toISOString().split("T")[0],
    }));

    const promises = [
      handlerLoadInsurers(),
      handlerLoadRamo(),
      handlerLoadFormasPago(),
      handlerLoadAnalistas(),
      handlerLoadFreelances(),
      handlerLoadTecnicosEmisores(),
      handlerLoadDirectoresComerciales(),
      handlerLoadAsistentes(),
      handlerLoadUnidadNegocio(),
      handlerLoadOtrosConceptos(),
      handlerLoadTiposPoliza(),
      handlerLoadCoordinadores(),
    ];

    if (id || id_anexo || id_poliza) {
      promises.push(handlerLoadPoliza());
    } else {
      navigate("/crm/inicio");
      return; // corto aquí para que no siga
    }

    Promise.allSettled(promises)
      .then((results) => {
        results.forEach((r, i) => {
          if (r.status === "rejected") {
            console.error(`Error en carga ${i}:`, r.reason);
          }
        });
        setLoading(false); // ✅ se apaga cuando TODAS terminaron
      })
      .catch((error) => {
        console.error("Error inesperado:", error);
        setLoading(false);
      });
  }, [id, id_anexo, id_poliza, navigate, setLoading]);

  useEffect(() => {
    calculateValorTotal();
  }, [
    valoresPoliza.iva,
    valoresPoliza.asistenciasotros,
    valoresPoliza.gastosexpedicion,
    valoresPoliza.primaneta,
    valoresPoliza.primaneta_aviajes,
    valoresPoliza.TRM_aviajes,
  ]);

  const handlerLoadInsurers = async () => {
    const aseguradoras = await obtenerAseguradoras();
    setInsurers(aseguradoras);
  };

  const handlerLoadAnalistas = async () => {
    const analistas = await getAnalistas();
    setAnalistas(analistas);
  };

  const handlerLoadFreelances = async () => {
    const freelances = await getFreelances();
    setFreelances(freelances);
  };

  const handlerLoadCoordinadores = async () => {
    const coordinadores = await getCoordinadores();
    setCoordinadores(coordinadores);
  };

  const handlerLoadRamo = async () => {
    const ramoData = await obtenerRamo();
    setRamo(ramoData);
  };

  const handlerLoadFormasPago = async () => {
    const formasPago = await getFormasPago();
    setFormasPago(formasPago);
  };

  const handlerLoadTecnicosEmisores = async () => {
    const tecnicos = await getTecnicos();
    setTecnicosEmisores(tecnicos);
  };

  const handlerLoadDirectoresComerciales = async () => {
    const directores = await getDirectores();
    setDirectoresComerciales(directores);
  };

  const handlerLoadAsistentes = async () => {
    const asistentes = await getAsistentes();
    setAsistentes(asistentes);
  };

  const handlerLoadUnidadNegocio = async () => {
    const unidades = await getUnidadesNegocio();
    setUnidadNegocio(unidades);
  };

  const handlerLoadTiposPoliza = async () => {
    const tipos = await getTiposPoliza();
    setTiposPoliza(tipos);
  };

  const handlerLoadOtrosConceptos = async () => {
    const otrosConceptos = await getOtrosConceptos();
    setOtrosConceptos(otrosConceptos);
  };

  const [stateHeader, setStateHeader] = useState(false);

  const handleRegistrarPago = async (readyToSaveFlag, event) => {
    const accion = event?.target?.textContent?.trim() || "";

    if (accion === "Guardar Pago") {
      if (valoresRecibidosTemp.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "No hay pagos registrados",
          text: "Por favor registre al menos un pago antes de continuar.",
        });
        setStateHeader(false);
        return;
      }

      // Validación de cada pago nuevo
      for (let i = 0; i < valoresRecibidosTemp.length; i++) {
        const p = valoresRecibidosTemp[i];
        if (!p.fecha || !p.formaPago || !p.valor) {
          TopRight(i);
          setStateHeader(false);
          return;
        }
      }

      const bodyPagos = {
        id_poliza: idPoliza,
        pagos: valoresRecibidosTemp.map(({ uid: _u, ...rest }) => rest), // no enviar uid
        observaciones: observaciones,
      };

      const sendPago = await createPagoAnexo(bodyPagos);
      if (sendPago.codeStatus === 201) {
        Swal.fire({
          icon: "success",
          text: "¡Pago registrado con éxito!",
          confirmButtonColor: "#88D600",
          didOpen: () => {
            const popup = document.querySelector(".swal2-popup");
            if (popup) {
              popup.style.borderRadius = "12px";
              popup.style.width = "500px";
              popup.style.height = "300px";
            }
          },
        }).then(() => {
          // Limpia los temporales tras guardar
          setValoresRecibidosTemp([]);
          setRegistrarPagos(false);
          window.location.reload();
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: sendPago.message,
          width: "300px",
          padding: "1.5em",
          customClass: {
            popup: "rounded-xl",
          },
        });
      }
      return;
    }

    // Si es "Agregar Pago" solo abre el modo edición de pagos
    if (accion === "Agregar Pago") {
      setStateHeader(false);
      setRegistrarPagos(true);
      return;
    }

    // Toggle genérico
    setRegistrarPagos((s) => !s);
  };

  // Habilitar botón de header cuando hay datos completos y consistentes
  useEffect(() => {
    // Si no hay pagos nuevos, el header no debe habilitar "Guardar Pago"
    if (valoresRecibidosTemp.length === 0) {
      setStateHeader(false);
      return;
    }
    // Validar cada pago nuevo
    for (let p of valoresRecibidosTemp) {
      if (!p.fecha || !p.formaPago || !p.valor) {
        setStateHeader(false);
        return;
      }
    }
    // Validar otros conceptos (si se está usando)
    if (
      (otrosConceptosValor.razon_concepto !== "" &&
        !otrosConceptosValor.valor) ||
      (otrosConceptosValor.razon_concepto === "" && !!otrosConceptosValor.valor)
    ) {
      setStateHeader(false);
      return;
    }
    setStateHeader(true);
  }, [valoresRecibidosTemp, otrosConceptosValor]);

  const ALL_OPTIONS = {
    cuotas: Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1),
      label: String(i + 1),
    })),
    especiales: {
      S: { value: "S", label: "Semestral" },
      T: { value: "T", label: "Trimestral" },
    },
    dias: {
      0: { value: "0", label: "Contado" },
      30: { value: "30", label: "30 días" },
      60: { value: "60", label: "60 días" },
    },
  };

  const handlerChargeQuotesFinanciera = async (id) => {
    const response = await getQuotesFinancieras(id);

    if (response?.status !== "Ok") return;

    const cuotasBackend = response.data.cuotas;

    let options = [];

    if(cuotasBackend == null) {
      setQuotesFinancieras([]);
      return;
    }

    if (cuotasBackend.includes("1") && cuotasBackend.includes("12")) {
      options = [...ALL_OPTIONS.cuotas];

      if (cuotasBackend.includes("S")) {
        options.push(ALL_OPTIONS.especiales.S);
      }
      if (cuotasBackend.includes("T")) {
        options.push(ALL_OPTIONS.especiales.T);
      }
    } else if (cuotasBackend.some((c) => ["0", "30", "60"].includes(c))) {
      options = cuotasBackend.map((c) => ALL_OPTIONS.dias[c]).filter(Boolean);
    } else {
      setQuotesFinancieras([]);
    }

    setQuotesFinancieras(options);
  };

  const calculateTotalSaldo = () => {
    const totalRecibido = [...valoresRecibidosTemp, ...valoresRecibidos].reduce(
      (acc, pago) => acc + (parseCOP(pago.valor) || 0),
      0,
    );
    const totalPoliza = parseCOP(
      // (cabezotePoliza.ramo === "6"
      // ? valoresPoliza.valor_asistencia_aviajes
      // :
      valoresPoliza.valortotal,
      // )
      // || 0
    );
    // Si total poliza es negativo debe manejar la operacion para se resten y no se sumen al final
    if (totalPoliza < 0) {
      const saldo = totalRecibido + totalPoliza;
      return formatCOP(saldo);
    } else {
      const saldo = totalPoliza - totalRecibido;
      return formatCOP(saldo);
    }
  };

  const searchProspecto = async (numeroIdentificacion) => {
    if (
      numeroIdentificacion == "" ||
      numeroIdentificacion == null ||
      numeroIdentificacion.length < 6
    ) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor complete todos los campos requeridos.",
      });
      return;
    }

    setLoading(true);
    setSelectedClientId(null);
    setIsModalOpenCliente(true);
    setIdClienteIntegradoor(numeroIdentificacion);

    await getClientById("x", numeroIdentificacion).then((response) => {
      if (response.status === "Ok") {
        if (response.data === "Cliente Nuevo") {
          setIdClienteIntegradoor("Cliente Nuevo");
          setDocumentoTemp(datosUsuarios.Tomador.numeroIdentificacion);
          setLoading(false);
          return;
        }
        setSelectedClientId(response.data.id_cliente);
        setCliente(response.data);
        setLoading(false);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.message,
        });
      }
    });
  };

  const convertToPesos = (valueInDollars) => formatCOP(valueInDollars);

  const handlerLoadPoliza = async () => {
    if (id == null && (id_poliza || id_anexo)) {
      try {
        const response = await retrivePolizaById(id_poliza, id_anexo);
        setDataPoliza(response.data);

        // ✅ usar valores recién traídos (sin esperar a que setState asiente)
        const noCert = response?.data?.cabezotePoliza?.noCertificado || "0";
        const unidadNeg = response?.data?.gestionComercial?.unidadnegocio || "";

        await handlerLoadPagoLiquidaciones({
          noCert, // override de no_anexo
          unidadnegocio: unidadNeg, // override de unidad de negocio
        });

        if (response.status === "Ok" && response.codeStatus !== 404) {
          const data = response.data;
          setCabezotePoliza({
            id_poliza: data.id_poliza,
            noPoliza: data.cabezotePoliza.noPoliza,
            noCertificado: data.cabezotePoliza.noCertificado,
            aseguradora: data.cabezotePoliza.aseguradora,
            ramo: data.cabezotePoliza.ramo,
            tipoCertificado: data.cabezotePoliza.tipoCertificado,
            fechaInicioVigencia: data.cabezotePoliza.fechaInicioVigencia,
            fechaFinVigencia: data.cabezotePoliza.fechaFinVigencia,
            fechaExpedicion: data.cabezotePoliza.fechaExpedicion,
            fechaRegistro: data.cabezotePoliza.fechaRegistro,
            renovable: data.cabezotePoliza.renovable,
          });
          setVehiculo({
            placa: data.vehiculo.placa || "",
            marca: data.vehiculo.marca || "",
            modelo: data.vehiculo.modelo || "",
            valorFasecolda: data.vehiculo.valorFasecolda || "",
            fasecolda: data.vehiculo.fasecolda || "",
            linea: data.vehiculo.linea || "",
            clase: data.vehiculo.clase || "",
          });
          setGestionComercial({
            tecnicoemisor: data.gestionComercial.tecnicoemisor || "",
            analista: data.gestionComercial.analista || "",
            asesorfreelance: data.gestionComercial.asesorfreelance || "",
            asesorcomercialinterno:
              data.gestionComercial.asesorcomercialinterno || "",
            asesor10: data.gestionComercial.asesor10 || "",
            asesorganador: data.gestionComercial.asesorganador || "",
            directorcomercial: data.gestionComercial.directorcomercial || "",
            asistente: data.gestionComercial.asistente || "",
            unidadnegocio: data.gestionComercial.unidadnegocio || "",
            coordinadortecnico: data.gestionComercial.coordinadortecnico || "",
            observaciones:
              data.gestionComercial.observaciones_gstn_comercial || "",
          });
          setValoresPoliza({
            iva: convertToPesos(data.valoresPoliza.iva) || "",
            asistenciasotros: convertToPesos(
              data.valoresPoliza.asistenciasotros,
            ) || "",
            gastosexpedicion: convertToPesos(
              data.valoresPoliza.gastosexpedicion,
            ) || "",
            primaneta: convertToPesos(data.valoresPoliza.primaneta) || "",
            primaneta_aviajes: convertToPesos(
              data.valoresPoliza.primaneta_aviajes,
            ) || "",
            TRM_aviajes: convertToPesos(data.valoresPoliza.TRM_aviajes) || "",
            valor_asistencia_aviajes: convertToPesos(
              data.valoresPoliza.valor_asistencia_aviajes,
            ) || "",
            valortotal: convertToPesos(data.valoresPoliza.valortotal) || "",
            formapago: data.valoresPoliza.formapago || "",
            financiada: data.valoresPoliza.financiada || "",
            nocuotas: data.valoresPoliza.nocuotas || "",
            fechalimite: data.valoresPoliza.fechalimite || "",
          });

          if (data.valoresRecibidos) {
            setValoresRecibidos(() =>
              data.valoresRecibidos.map((item) => ({
                ...item,
                valor: convertToPesos(item.valor),
              })),
            );
          }

          setDatosUsuarios({
            Tomador: {
              tipoIdentificacion:
                data.datosUsuarios.Tomador.tipoIdentificacion || "",
              numeroIdentificacion:
                data.datosUsuarios.Tomador.numeroIdentificacion || "",
              nombre: data.datosUsuarios.Tomador.nombre || "",
            },
            Asegurado: {
              tipoIdentificacion:
                data.datosUsuarios.Asegurado.tipoIdentificacion || "",
              numeroIdentificacion:
                data.datosUsuarios.Asegurado.numeroIdentificacion || "",
              nombre: data.datosUsuarios.Asegurado.nombre || "",
            },
            Beneficiario: {
              tipoIdentificacion:
                data.datosUsuarios.Beneficiario.tipoIdentificacion || "",
              numeroIdentificacion:
                data.datosUsuarios.Beneficiario.numeroIdentificacion || "",
              nombre: data.datosUsuarios.Beneficiario.nombre || "",
            },
          });
          setOtrosConceptosValor({
            razon_concepto: data.otrosConceptosValor.razon_concepto || "",
            valor: data.otrosConceptosValor.valor || "",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se encontro ninguna poliza con ese numero de remision, valide la información nuevamente",
          }).then(() => {
            window.location.href = "/crm/polizas/registro";
          });
        }
      } catch (error) {
        console.error("Error loading policy:", error);
      }
    } else {
      try {
        const response = await retrivePoliza(id);
        if (response.status === "Ok" && response.codeStatus !== 404) {
          const data = response.data;
          await handleChangesFinanciera();
          await handlerChargeQuotesFinanciera(data.valoresPoliza.financiada
          );
          setIdPoliza(data.id_poliza);
          setCabezotePoliza({
            id_poliza: data.id_poliza,
            noPoliza: data.cabezotePoliza.noPoliza,
            noCertificado: data.cabezotePoliza.noCertificado,
            aseguradora: data.cabezotePoliza.aseguradora,
            ramo: data.cabezotePoliza.ramo,
            tipoCertificado: data.cabezotePoliza.tipoCertificado,
            fechaInicioVigencia: data.cabezotePoliza.fechaInicioVigencia,
            fechaFinVigencia: data.cabezotePoliza.fechaFinVigencia,
            fechaExpedicion: data.cabezotePoliza.fechaExpedicion,
            fechaRegistro: data.cabezotePoliza.fechaRegistro,
            renovable: data.cabezotePoliza.renovable,
          });
          setVehiculo({
            placa: data.vehiculo.placa || "",
            marca: data.vehiculo.marca || "",
            modelo: data.vehiculo.modelo || "",
            fasecolda: data.vehiculo.fasecolda || "",
            valorFasecolda: data.vehiculo.valorFasecolda || "",
            linea: data.vehiculo.linea || "",
            clase: data.vehiculo.clase || "",
          });
          setGestionComercial({
            tecnicoemisor: data.gestionComercial.tecnicoemisor || "",
            analista: data.gestionComercial.analista || "",
            asesorfreelance: data.gestionComercial.asesorfreelance || "",
            asesorcomercialinterno:
              data.gestionComercial.asesorcomercialinterno || "",
            asesor10: data.gestionComercial.asesor10 || "",
            asesorganador: data.gestionComercial.asesorganador || "",
            directorcomercial: data.gestionComercial.directorcomercial || "",
            coordinadortecnico: data.gestionComercial.coordinadortecnico || "",
            asistente: data.gestionComercial.asistente || "",
            unidadnegocio: data.gestionComercial.unidadnegocio || "",
            observaciones:
              data.gestionComercial.observaciones || "",
          });
          setValoresPoliza({
            iva: convertToPesos(data.valoresPoliza.iva || 0),
            asistenciasotros: convertToPesos(
              data.valoresPoliza.asistenciasotros || 0,
            ),
            gastosexpedicion: convertToPesos(
              data.valoresPoliza.gastosexpedicion || 0,
            ),
            primaneta: convertToPesos(data.valoresPoliza.primaneta || 0),
            primaneta_aviajes: convertToPesos(
              data.valoresPoliza.primaneta_aviajes || 0,
            ),
            TRM_aviajes: convertToPesos(data.valoresPoliza.TRM_aviajes || 0),
            valor_asistencia_aviajes: convertToPesos(
              data.valoresPoliza.valor_asistencia_aviajes || 0,
            ),
            valortotal: convertToPesos(data.valoresPoliza.valortotal || 0),
            formapago: data.valoresPoliza.formapago || "",
            financiada: data.valoresPoliza.financiada || "",
            nocuotas: data.valoresPoliza.nocuotas || "",
            fechalimite: data.valoresPoliza.fechalimite || "",
          });

          if (data.valoresRecibidos) {
            setValoresRecibidos(() =>
              data.valoresRecibidos.map((item) => ({
                ...item,
                valor: convertToPesos(item.valor),
              })),
            );
          }

          setDatosUsuarios({
            Tomador: {
              tipoIdentificacion:
                data.datosUsuarios.Tomador.tipoIdentificacion || "",
              numeroIdentificacion:
                data.datosUsuarios.Tomador.numeroIdentificacion || "",
              nombre: data.datosUsuarios.Tomador.nombre || "",
            },
            Asegurado: {
              tipoIdentificacion:
                data.datosUsuarios.Asegurado.tipoIdentificacion || "",
              numeroIdentificacion:
                data.datosUsuarios.Asegurado.numeroIdentificacion || "",
              nombre: data.datosUsuarios.Asegurado.nombre || "",
            },
            Beneficiario: {
              tipoIdentificacion:
                data.datosUsuarios.Beneficiario.tipoIdentificacion || "",
              numeroIdentificacion:
                data.datosUsuarios.Beneficiario.numeroIdentificacion || "",
              nombre: data.datosUsuarios.Beneficiario.nombre || "",
            },
          });
          setOtrosConceptosValor({
            razon_concepto: data.otrosConceptosValor.razon_concepto || "",
            valor: data.otrosConceptosValor.valor || "",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se encontro ninguna poliza con ese numero de remision, valide la información nuevamente",
          }).then(() => {
            window.location.href = "/crm/polizas/registro";
          });
        }
      } catch (error) {
        console.error("Error loading policy:", error);
      }
    }
  };

  // ⚠️ Acepta overrides para evitar depender de setState asíncrono
  const handlerLoadPagoLiquidaciones = async (opts = {}) => {
    const certFromState =
      dataPoliza?.cabezotePoliza?.noCertificado ||
      cabezotePoliza?.noCertificado ||
      "0";

    const noCert = opts?.noCert || opts?.no_anexo || certFromState;
    const unidadNeg =
      opts?.unidadnegocio ?? dataPoliza?.gestionComercial?.unidadnegocio ?? "";

    let body = {
      id_poliza: id_poliza,
      id_anexo: id_poliza && id_anexo ? id_anexo : "",
      no_anexo: id_poliza && id_anexo ? noCert || "0" : "0",
    };

    try {
      let dataP;
      const response = await getLiquidacionesToQuery(body);
      if (response.status === "Ok" && response.codeStatus !== 404) {
        // ✅ por defecto trae todo
        dataP = response.data || {};
        console.log(dataP);
        // Si es unidad 1, oculta ciertos roles
        if (unidadNeg === "1") {
          delete dataP["Asesor 10"];
          delete dataP["Asesor Ganador"];
          delete dataP["Asesor Comercial"];
        }

        if (dataP && typeof dataP === "object") {
          setPagosLiquidaciones(dataP);
        }
      }
    } catch (error) {
      console.error("Error loading pagos liquidaciones:", error);
    }
  };

  const ORDER = [
    "Asesor Freelance",
    "Analista Comercial",
    "Director Comercial",
    "Asistente Comercial",
    "Analista Tecnica", // ojo con tilde: tu objeto dice "Tecnica"
    "Coordinador Tecnico",
    "Asesor Comercial Interno",
  ];

  // Helper seguro
  const getCell = (obj, key, field, fmt) => {
    const v = obj?.[key]?.[field];
    if (v === null || v === undefined || v === "") return "N/A";
    return fmt ? fmt(v) : v;
  };
  const money = (n) => `$ ${n}`;

  // Custom Styles Select React-Select
  const customStyles = {
    control: (base) => ({
      ...base,
      minHeight: 30,
      height: 30,
    }),
    dropdownIndicator: (base) => ({
      ...base,
      paddingTop: 4,
      paddingRight: 0,
      color: "black",
      svg: {
        width: "18px",
        height: "16px",
      },
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    menu: (base) => ({
      ...base,
      maxHeight: "300px",
      overflowY: "auto",
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

  useEffect(() => {
    setBodyPoliza((prev) => ({
      ...prev,
      cabezotePoliza,
      vehiculo,
      gestionComercial,
      valoresPoliza,
      valoresRecibidos,
      datosUsuarios: {
        Tomador: datosUsuarios.Tomador,
        Asegurado: datosUsuarios.Asegurado,
        Beneficiario: datosUsuarios.Beneficiario,
      },
      otrosConceptosValor,
      id_usuario: userData.id_usuario,
    }));
  }, [
    datosUsuarios,
    cabezotePoliza,
    vehiculo,
    gestionComercial,
    valoresPoliza,
    valoresRecibidos,
    otrosConceptosValor,
    tiposPoliza,
  ]);

  const numeroPagos = useMemo(
    () => valoresRecibidos.length + valoresRecibidosTemp.length,
    [valoresRecibidos, valoresRecibidosTemp],
  );

  useEffect(() => {
    calculateTotalSaldo();
  }, [numeroPagos, valoresRecibidos, valorTotal, valoresRecibidosTemp]);

  const handlerUpdatePoliza = async () => {
    // Lógica para guardar la póliza
    const polizaData = {
      cabezotePoliza,
      vehiculo,
      gestionComercial,
      valoresPoliza,
      // valoresRecibidos,
      datosUsuarios,
      otrosConceptosValor,
      userData: { id_usuario: userData.id_usuario },
    };

    // Valida que todos los campos del cabezotePoliza que vengan llenos
    for (const field of Object.keys(cabezotePoliza)) {
      if (!cabezotePoliza[field]) {
        Swal.fire({
          icon: "warning",
          title: "Campos incompletos",
          text: `Por favor complete el campo: ${field}.`,
        });
        return;
      }
    }
    // Valida los campos del tomador y del asegurado, el beneficiario es opcional
    for (const role of ["Tomador", "Asegurado"]) {
      for (const field of Object.keys(datosUsuarios[role])) {
        if (!datosUsuarios[role][field]) {
          Swal.fire({
            icon: "warning",
            title: "Campos incompletos",
            text: `Por favor complete el campo: ${role}.${field}.`,
          });
          return;
        }
      }
    }

    // Valida los campos de la gestion comercial en condicion de la unidad de negocio seleccionada
    if (gestionComercial.unidadnegocio !== "") {
      let fieldsToCheck = {
        1: {
          tecnicoemisor: "Técnico Emisor",
          analista: "Analista",
          coordinadortecnico: "Coordinador Técnico",
          asesorfreelance: "Asesor Freelance",
          directorcomercial: "Director Comercial",
          asistente: "Asistente",
        },
        2: {
          tecnicoemisor: "Técnico Emisor",
          coordinadortecnico: "Coordinador Técnico",
          asesorcomercialinterno: "Asesor Comercial Interno",
        },
        3: {
          tecnicoemisor: "Técnico Emisor",
          coordinadortecnico: "Coordinador Técnico",
          asesorcomercialinterno: "Asesor Comercial Interno",
          asesor10: "Asesor 10",
        },
        4: {
          tecnicoemisor: "Técnico Emisor",
          coordinadortecnico: "Coordinador Técnico",
          asesorcomercialinterno: "Asesor Comercial Interno",
          asesorganador: "Asesor Ganador",
        },
      };
      for (const field of Object.keys(
        fieldsToCheck[gestionComercial.unidadnegocio],
      )) {
        if (!gestionComercial[field]) {
          Swal.fire({
            icon: "warning",
            title: "Campos incompletos",
            text: `Por favor complete el campo: ${
              fieldsToCheck[gestionComercial.unidadnegocio][field]
            }.`,
          });
          return;
        }
      }
    } else {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: `debe diligenciar el campo de unidad de negocio correctamente`,
      });
      return;
    }

    // Validar los valores ingresados a la poliza
    if (valoresPoliza.formapago != "" || cabezotePoliza.ramo == "6") {
      let fieldsToCheck = {
        1: {
          primaneta: "Prima Neta",
          asistenciasotros: "Asistencia & Otros",
          gastosexpedicion: "Gastos de Expedición",
          valortotal: "Valor Total",
          financiada: "Financiera",
          // nocuotas: "No. Cuotas",
          // fechalimite: "Fecha Límite",
        },
        2: {
          primaneta: "Prima Neta",
          asistenciasotros: "Asistencia & Otros",
          gastosexpedicion: "Gastos de Expedición",
          valortotal: "Valor Total",
          // fechalimite: "Fecha Límite",
        },
        6: {
          primaneta: "Prima Neta",
          asistenciasotros: "Asistencia & Otros",
          gastosexpedicion: "Gastos de Expedición",
          valortotal: "Valor Total",
          // fechalimite: "Fecha Límite",
        },
      };
      let validFields =
        cabezotePoliza.ramo == "6"
          ? fieldsToCheck[6]
          : fieldsToCheck[valoresPoliza.formapago];
      for (const field of Object.keys(validFields)) {
        if (!valoresPoliza[field]) {
          Swal.fire({
            icon: "warning",
            title: "Campos incompletos",
            text: `Por favor complete el campo: ${
              fieldsToCheck[valoresPoliza.formapago][field]
            }.`,
          });
          return;
        }
      }
    }
    // else if (
    //   valoresPoliza.formapago == "0" &&
    //   valoresPoliza.nocuotas == "0" &&
    //   valoresPoliza.financiada == "0" &&
    //   cabezotePoliza.ramo == "6"
    // ) {
    //   let fieldsToCheck2 = {
    //     6: {
    //       primaneta_aviajes: "Valor Total Asistencia en USD",
    //       TRM_aviajes: "TRM Dolar",
    //       valor_asistencia_aviajes: "Valor Total Asistencia en COP",
    //     },
    //   };
    //   for (const field of Object.keys(fieldsToCheck2[6])) {
    //     if (
    //       valoresPoliza[field].trim() == "$ 0" ||
    //       valoresPoliza[field] == ""
    //     ) {
    //       Swal.fire({
    //         icon: "warning",
    //         title: "Campos incompletos",
    //         text: `Por favor complete el campo: ${fieldsToCheck2[6][field]}.`,
    //       });
    //       return;
    //     }
    //   }
    // }
    else {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: `Por favor complete todos los campos obligatorios de los valores de la poliza.`,
      });
    }

    if (INPUT_PLACA_ALLOW.includes(parseInt(cabezotePoliza.ramo))) {
      for (const field of Object.keys(vehiculo)) {
        if (!vehiculo[field] && field !== "busqueda") {
          console.log(field);
          Swal.fire({
            icon: "warning",
            title: "Campos incompletos",
            text: `Por favor complete el campo: ${field}.`,
          });
          return;
        }
      }
    }
    const updatedPoliza = await updatePoliza(polizaData);

    if (updatedPoliza.code === 439) {
      Swal.fire({
        icon: "warning",
        title: "Conflicto de datos",
        text: "No se actualizo la poliza, valide la información e intente nuevamente.",
      });
    } else {
      Swal.fire({
        icon: "success",
        title: "Póliza Actualizada",
        text: `Remision ID # ${updatedPoliza.id_remision} con número de póliza ${updatedPoliza.id_poliza} actualizada exitosamente.`,
      });
    }
  };

  // Spinner minimalista inline (sin dependencias)
  const InlineSpinner = ({ size = 18 }) => (
    <span
      className="inline-block align-middle animate-spin rounded-full border-2 border-current border-t-transparent"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Cargando"
    />
  );

  const loc =
    path.split("/")[2] !== "edicion" && path.split("/")[2] !== "consulta";

  const handlerLoadAsesoresGanadores = async () => {
    // Function to load business units data
    // This is a placeholder for the actual implementation
    const asesGanadores = await getAsesoresGanadores();
    setAsesoresGanadores(asesGanadores);
  };

  const handlerLoadAsesores10 = async () => {
    // Function to load business units data
    // This is a placeholder for the actual implementation
    const ases10 = await getAsesores10();
    setAsesores10(ases10);
  };

  const handlerLoadAsesoresSGA = async (unidadNegocio) => {
    // Function to load business units data
    // This is a placeholder for the actual implementation
    const asesorescomercialesint = await getAsesoresSGA(unidadNegocio);
    setAsesoresSGA(asesorescomercialesint);
  };

  useEffect(() => {
    const unidad = gestionComercial.unidadnegocio;
    if (["3"].includes(unidad)) {
      handlerLoadAsesoresSGA(unidad);
      handlerLoadAsesores10();
    } else if (["2"].includes(unidad)) {
      handlerLoadAsesoresSGA(unidad);
    } else if (["4"].includes(unidad)) {
      handlerLoadAsesoresSGA(unidad);
      handlerLoadAsesoresGanadores();
    } else {
      // Si no aplica asesores internos, limpiar opciones para evitar residuos de selects
      setAsesoresSGA([]);
    }
  }, [gestionComercial.unidadnegocio]);

  const sumarDias = (fecha, dias) => {
    if (fecha == null || fecha == "") return null;
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    return nuevaFecha.toISOString().split("T")[0]; // Formato YYYY-MM-DD
  };

  return (
    <div className="flex flex-col">
      {modalMovimiento && (
        <MovimientoModal
          titulo={"Crear movimiento"}
          show={modalMovimiento}
          functClose={() => setModalMovimiento(false)}
          onClose={() => setModalMovimiento(false)}
          loadedPoliza={bodyPoliza}
          setIsLoading={setLoading}
          loading={loading}
        />
      )}
      {modalVerMovimientos && (
        <VerMovimientosModal
          titulo={"Ver movimientos"}
          show={modalVerMovimientos}
          onClose={() => setModalVerMovimientos(false)}
          id_poliza={idPoliza}
          setModalMovimiento={setModalMovimiento}
          showModalMovimiento={modalMovimiento}
        />
      )}

      <ModalOneroso
        show={modalOneroso}
        onClose={() => setModalOneroso(false)}
        valores={datosUsuarios.Beneficiario}
        onChange={(campo, valor) =>
          handleDatosChange("Beneficiario", campo, valor)
        }
        setIsLoading={setLoading}
        isLoading={loading}
        nuevoBeneficiario={nuevoBeneficiario}
        setNuevoBeneficiario={setNuevoBeneficiario}
      />
      <ModalCliente
        show={isModalOpenCliente}
        onClose={() => setIsModalOpenCliente(false)}
        userData={userData}
        setIsLoading={setLoading}
        from={"polizas"}
        idClienteIntegradoor={idClienteIntegradoor}
        setIdClienteIntegradoor={setIdClienteIntegradoor}
        documentoTemp={documentoTemp}
        setDocumentoTemp={setDocumentoTemp}
        procedenciaCliente={procedenciaCliente}
        setProcedenciaCliente={setProcedenciaCliente}
      />
      <Loader isLoading={loading} />

      {path.split("/")[2] !== "edicion" && path.split("/")[2] !== "consulta" ? (
        <section className="flex flex-row p-4 pl-6 gap-6">
          <div className="flex flex-row gap-2">
            <input
              type="text"
              className="p-2 bg-gray-200 rounded-md placeholder-black placeholder:text-center"
              placeholder="Buscar registro por:"
            />
            <button>
              <SearchOutlined style={{ fontSize: 27 }} />
            </button>
          </div>
          <select className="p-2 w-36 border-2 rounded-md">
            <option value="1">Remisión</option>
            <option value="2">Placa</option>
            <option value="3">No. Identificación</option>
            <option value="4">Póliza</option>
          </select>

          <BtnGeneral
            className={
              "bg-lime-9000 text-white px-10 h-[35px] m-[2px] rounded hover:bg-lime-600 transition duration-300 ease-in-out"
            }
          >
            <span>Admin. Polizas</span>
          </BtnGeneral>

          <BtnGeneral
            className={
              "bg-lime-9000 text-white px-10 h-[35px] m-[2px] rounded hover:bg-lime-600 transition duration-300 ease-in-out"
            }
          >
            <span>Busqueda Avanzada</span>
          </BtnGeneral>
        </section>
      ) : path.split("/")[2] == "consulta" ? (
        <section className="px-6 pt-4">
          <div className="flex items-center justify-between bg-slate-200 rounded-md p-3">
            <div />
            <div className="flex flex-col items-start text-left min-w-[220px]">
              <p className="text-[23px] w-full">
                {loading ? (
                  <SkeletonLine className="h-6 w-64" />
                ) : id_anexo && id_poliza ? (
                  `Ficha Certificado: #: ${
                    cabezotePoliza?.noCertificado ?? "—"
                  }`
                ) : !id_anexo && id_poliza ? (
                  `Ficha Póliza: #: ${
                    dataPoliza?.cabezotePoliza?.noPoliza ?? "—"
                  }`
                ) : null}
              </p>

              <p className="text-[21px] w-full">
                {loading ? (
                  <SkeletonLine className="h-5 w-40" />
                ) : !id_anexo && id_poliza ? (
                  `ID: # ${dataPoliza?.id_poliza ?? "—"}`
                ) : null}
              </p>

              <p className="text-[21px] w-full">
                {loading ? (
                  <SkeletonLine className="h-5 w-56" />
                ) : id_anexo && id_poliza ? (
                  `Póliza: # ${cabezotePoliza?.noPoliza ?? "—"}`
                ) : null}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="flex flex-row p-4 pl-6 gap-6">
          <p className="text-3xl pl-3">Remision: #{id}</p>
        </section>
      )}

      {/* Seccion 2 Datos tomador/asegurado/beneficiario */}

      <section className="w-full flex flex-row flex-wrap justify-center">
        <CardUser
          titulo="Tomador"
          placeholderNombre="Nombre del Tomador"
          searchProspecto={searchProspecto}
          cliente={cliente}
          buttonSwitch={buttonSwitch}
          setButtonSwitch={setButtonSwitch}
          valores={datosUsuarios.Tomador}
          onChange={(campo, valor) =>
            handleDatosChange("Tomador", campo, valor)
          }
          beneficiarios={beneficiarios}
          setBeneficiarios={setBeneficiarios}
          modalOneroso={modalOneroso}
          setModalOneroso={setModalOneroso}
          isDisabled={id_poliza || id_anexo}
        />
        <CardUser
          titulo="Asegurado"
          placeholderNombre="Nombre del Asegurado"
          buttonSwitch={buttonSwitch}
          setButtonSwitch={setButtonSwitch}
          valores={datosUsuarios.Asegurado}
          onChange={(campo, valor) =>
            handleDatosChange("Asegurado", campo, valor)
          }
          beneficiarios={beneficiarios}
          setBeneficiarios={setBeneficiarios}
          modalOneroso={modalOneroso}
          setModalOneroso={setModalOneroso}
          isDisabled={id_poliza || id_anexo}
        />
        <CardUser
          titulo="Beneficiario"
          placeholderNombre="Nombre del Beneficiario"
          buttonSwitch={buttonSwitch}
          setButtonSwitch={setButtonSwitch}
          valores={datosUsuarios.Beneficiario}
          onChange={(campo, valor) =>
            handleDatosChange("Beneficiario", campo, valor)
          }
          beneficiarios={beneficiarios}
          setBeneficiarios={setBeneficiarios}
          modalOneroso={modalOneroso}
          setModalOneroso={setModalOneroso}
          isDisabled={id_poliza || id_anexo}
          setNuevoBeneficiario={setNuevoBeneficiario}
        />
      </section>

      {/* Seccion 3 Cabezote de Póliza */}

      <section className="">
        <GeneralBox titulo={"Cabezote Póliza"} width={"w-full"}>
          <div className="flex flex-row gap-3 items-center align-middle">
            <RiPagesLine className="text-gray-500 mt-[20px]" size={37} />
            <div className="w-full flex flex-row gap-3 items-center">
              <div className="flex flex-col">
                <label htmlFor="noPoliza">Póliza</label>
                <input
                  id="noPoliza"
                  type="text"
                  name="noPoliza"
                  value={cabezotePoliza.noPoliza || ""}
                  className="w-[220px] text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-2"
                  onChange={handleCabezotePolizaChange}
                  disabled={id_poliza || id_anexo}
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="noCertificado">Certificado</label>
                <input
                  disabled
                  id="noCertificado"
                  type="text"
                  value={cabezotePoliza.noCertificado || ""}
                  className="text-md border-[1px] w-[65px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-2"
                  onChange={handleCabezotePolizaChange}
                />
              </div>
              <div className="flex flex-col w-auto flex-1">
                <label htmlFor="aseguradora">Aseguradora</label>
                <Select
                  name="aseguradora"
                  options={insurers}
                  value={
                    insurers.find(
                      (opt) => opt.value === cabezotePoliza.aseguradora,
                    ) || ""
                  }
                  onChange={(selectedOption, meta) => {
                    handleCabezotePolizaChange({
                      target: { name: meta.name, value: selectedOption.value },
                    });
                  }}
                  styles={customStyles}
                  placeholder=""
                  isDisabled={id_poliza || id_anexo}
                />
              </div>
              <div className="flex flex-col w-auto flex-1">
                <label htmlFor="ramo">Ramo</label>

                <Select
                  name="ramo"
                  options={ramo}
                  value={
                    ramo.find((opt) => opt.value === cabezotePoliza.ramo) || ""
                  }
                  onChange={(selectedOption, meta) => {
                    handleCabezotePolizaChange({
                      target: { name: meta.name, value: selectedOption.value },
                    });
                  }}
                  styles={customStyles}
                  placeholder=""
                  isDisabled={id_poliza || id_anexo}
                />
              </div>
              <div className="flex flex-col w-auto flex-1">
                <label htmlFor="tipoCertificado">Tipo</label>
                <Select
                  isDisabled
                  name="tipoCertificado"
                  id="tipoCertificado"
                  options={tiposPoliza}
                  value={
                    tiposPoliza.find(
                      (opt) => opt.value === cabezotePoliza.tipoCertificado,
                    ) || ""
                  }
                  onChange={(selectedOption, meta) => {
                    handleCabezotePolizaChange({
                      target: { name: meta.name, value: selectedOption.value },
                    });
                  }}
                  styles={customStyles}
                  placeholder=""
                />
              </div>
            </div>
          </div>

          <div className="flex flex-row gap-3 items-center align-middle">
            <IoCalendarOutline className="text-gray-500 mt-[20px]" size={35} />
            <div className="flex flex-col w-auto flex-1">
              <label htmlFor="fechaExpedicion">Fecha de expedición</label>
              <input
                type="date"
                id="fechaExpedicion"
                name="fechaExpedicion"
                className="w-full text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-2"
                value={cabezotePoliza.fechaExpedicion || ""}
                onChange={handleCabezotePolizaChange}
                disabled={id_poliza || id_anexo}
              />
            </div>
            <div className="flex flex-col w-auto flex-1">
              <label htmlFor="fechaInicioVigencia">
                Fecha inicio de Vigencia
              </label>
              <input
                type="date"
                id="fechaInicioVigencia"
                name="fechaInicioVigencia"
                className="w-full text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-2"
                value={cabezotePoliza.fechaInicioVigencia || ""}
                onChange={handleCabezotePolizaChange}
                disabled={id_poliza || id_anexo}
              />
            </div>
            <div className="flex flex-col w-auto flex-1">
              <label htmlFor="fechaFinVigencia">Fecha fin de Vigencia</label>
              <input
                type="date"
                value={cabezotePoliza.fechaFinVigencia || ""}
                id="fechaFinVigencia"
                name="fechaFinVigencia"
                className="w-full text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-2"
                onChange={handleCabezotePolizaChange}
                disabled={id_poliza || id_anexo}
              />
            </div>
            <div className="flex flex-col w-auto flex-1">
              <label htmlFor="fechaRegistro">Fecha de Registro</label>
              <input
                type="date"
                value={cabezotePoliza.fechaRegistro || ""}
                id="fechaRegistro"
                className="w-full text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-2"
                disabled
              />
            </div>
          </div>

          <div className="flex flex-row gap-3 items-center align-middle mt-3">
            <MdOutlineAutorenew className="text-gray-500 mt-[1px]" size={35} />
            <div className="flex flex-row w-auto flex-1 gap-3 items-center">
              <label htmlFor="fecharegistro">Renovable: </label>
              <input
                type="radio"
                id="renovableSi"
                name="renovable"
                value="Si"
                checked={cabezotePoliza.renovable === "Si" || false}
                className=" text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none  rounded-md p-2"
                onChange={handleCabezotePolizaChange}
                disabled={id_poliza || id_anexo}
              />
              <label htmlFor="renovableSi">Si</label>
              <input
                type="radio"
                id="renovableNo"
                name="renovable"
                value="No"
                checked={cabezotePoliza.renovable === "No" || false}
                className=" text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none  rounded-md p-2"
                onChange={handleCabezotePolizaChange}
                disabled={id_poliza || id_anexo}
              />
              <label htmlFor="renovableNo">No</label>
            </div>
          </div>
        </GeneralBox>
      </section>

      {/* Seccion 4 Busqueda de datos del vehiculo */}

      {/* Seccion 4 Busqueda de datos del vehiculo */}

      <section
        className="flex flex-row gap-3 pl-8 items-center"
        style={{
          display: INPUT_PLACA_ALLOW.includes(Number(cabezotePoliza.ramo))
            ? "flex"
            : "none",
        }}
      >
        <p>
          Puedes traer los datos del vehículo desde la cotización, recuerda
          validarlos
        </p>
        <div className="flex flex-row gap-3 items-center">
          <input
            type="text"
            id="busqueda"
            name="busqueda"
            value={vehiculo.busqueda || ""}
            className="p-2 bg-gray-200 rounded-md placeholder-black placeholder:text-center"
            placeholder="PLACA"
            onChange={handleVehiculoChange}
            disabled={id_poliza || id_anexo}
          />
          <button className="ml-[-45px]" onClick={handlerGetVehiculo}>
            <PiMagnifyingGlass style={{ fontSize: 23 }} />
          </button>
        </div>
      </section>

      {/* Seccion 5 Información del riesgo */}

      <section
        className=""
        style={{
          display: INPUT_PLACA_ALLOW.includes(Number(cabezotePoliza.ramo))
            ? "block"
            : "none",
        }}
      >
        <GeneralBox titulo={"Información del Riesgo"} width={"w-full"}>
          <div className="flex flex-row gap-3 items-center align-middle">
            <IoWarningOutline className="text-gray-500 mt-[18px]" size={30} />
            <div className="w-full flex flex-row gap-3 items-center">
              <div className="flex flex-col w-[80px]">
                <label htmlFor="placa">Placa</label>
                <input
                  id="placa"
                  type="text"
                  name="placa"
                  className="text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-2"
                  // placeholder="Número Identificación"
                  value={vehiculo.placa || ""}
                  onInput={handleVehiculoChange}
                  disabled={id_poliza || id_anexo}
                />
              </div>

              <div className="flex flex-col w-[130px]">
                <label htmlFor="fasecolda">Fasecolda</label>
                <input
                  id="fasecolda"
                  type="text"
                  name="fasecolda"
                  className="text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-2"
                  // placeholder="Número Certificado"
                  value={vehiculo.fasecolda || ""}
                  onInput={handleVehiculoChange}
                  disabled={id_poliza || id_anexo}
                />
              </div>

              <div className="flex flex-col w-[130px]">
                <label htmlFor="valorFasecolda">Valor Asegurado</label>
                <input
                  id="valorFasecolda"
                  type="text"
                  name="valorFasecolda"
                  className="text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-2"
                  inputMode="numeric"
                  autoComplete="off"
                  value={
                    vehiculo.valorFasecolda === "" ||
                    vehiculo.valorFasecolda === null ||
                    vehiculo.valorFasecolda === undefined
                      ? ""
                      : formatCOP(vehiculo.valorFasecolda)
                  }
                  onChange={handleVehiculoChange}
                  disabled={id_poliza || id_anexo}
                />
              </div>

              <div className="flex flex-col w-[60px]">
                <label htmlFor="modelo">Modelo</label>
                <input
                  id="modelo"
                  type="text"
                  name="modelo"
                  className="text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-2"
                  // placeholder="Número Certificado"
                  value={vehiculo.modelo || ""}
                  onInput={handleVehiculoChange}
                  disabled={id_poliza || id_anexo}
                />
              </div>

              <div className="flex flex-col w-full">
                <label htmlFor="clase">Clase</label>
                <input
                  id="clase"
                  type="text"
                  name="clase"
                  className="text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-2"
                  // placeholder="Número Certificado"
                  value={vehiculo.clase || ""}
                  onInput={handleVehiculoChange}
                  disabled={id_poliza || id_anexo}
                />
              </div>

              <div className="flex flex-col w-full">
                <label htmlFor="marca">Marca</label>
                <input
                  id="marca"
                  type="text"
                  name="marca"
                  className="text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-2"
                  value={vehiculo.marca || ""}
                  onInput={handleVehiculoChange}
                  disabled={id_poliza || id_anexo}
                />
              </div>

              <div className="flex flex-col w-full">
                <label htmlFor="linea">Linea</label>
                <input
                  type="text"
                  id="linea"
                  name="linea"
                  style={{ backgroundColor: "#FCFCFC" }}
                  className="w-auto text-md border-[1px] border-gray-300 rounded-md text-gray-900 focus:outline-none h-[30px] p-1"
                  value={vehiculo.linea || ""}
                  onInput={handleVehiculoChange}
                  disabled={id_poliza || id_anexo}
                />
              </div>
            </div>
          </div>
        </GeneralBox>
      </section>

      {/* Seccion 6 Gestion Comercial */}
      {/* Seccion 6 Gestion Comercial */}
      <section className="grid grid-cols-1 md:grid-cols-2 w-full">
        <GeneralBox titulo="Gestión Comercial">
          <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-row gap-4">
              <div className="flex flex-col w-1/3">
                <label htmlFor="tecnicoemisor">Técnico Emisor</label>
                <Select
                  name="tecnicoemisor"
                  id="tecnicoemisor"
                  options={tecnicosEmisores}
                  placeholder=""
                  styles={customStyles}
                  value={tecnicosEmisores.find(
                    (opt) => opt.value === gestionComercial.tecnicoemisor,
                  )}
                  onChange={(selectedOption, meta) => {
                    const value = selectedOption ? selectedOption.value : "";
                    handleGestionComercialChange({
                      target: { name: meta.name, value },
                    });
                  }}
                  isClearable
                />
              </div>

              <div className="flex flex-col w-1/3">
                <label htmlFor="unidadnegocio">Unidad de negocio</label>
                <Select
                  name="unidadnegocio"
                  id="unidadnegocio"
                  options={unidadNegocio}
                  placeholder=""
                  styles={customStyles}
                  value={
                    unidadNegocio.find(
                      (opt) =>
                        opt.value === (gestionComercial.unidadnegocio ?? ""),
                    ) || null
                  }
                  onChange={(selectedOption, meta) => {
                    const value = selectedOption ? selectedOption.value : "";
                    handleGestionComercialChange({
                      target: { name: meta.name, value },
                    });
                  }}
                  isClearable
                />
              </div>
              {gestionComercial.unidadnegocio == "1" ||
              gestionComercial.unidadnegocio == "" ? (
                <>
                  <div className="flex flex-col w-1/3">
                    <label htmlFor="asesorfreelance">Asesor Freelance</label>
                    <Select
                      name="asesorfreelance"
                      id="asesorfreelance"
                      value={freelances.find(
                        (f) => f.value === gestionComercial.asesorfreelance,
                      )}
                      onChange={(selectedOption, meta) => {
                        const value = selectedOption
                          ? selectedOption.value
                          : "";
                        handleGetAnalistaByFreelance({
                          target: {
                            name: meta.name,
                            value,
                          },
                        });

                        handleGestionComercialChange({
                          target: { name: meta.name, value },
                        });
                      }}
                      options={freelances}
                      placeholder=""
                      styles={customStyles}
                      isClearable
                    />
                  </div>
                </>
              ) : (
                ""
              )}
              {gestionComercial.unidadnegocio != "1" &&
              gestionComercial.unidadnegocio != "" ? (
                <>
                  <div className="flex flex-col w-1/3">
                    <label htmlFor="asesorcomercialinterno">
                      Asesor Comercial Interno
                    </label>
                    <Select
                      name="asesorcomercialinterno"
                      options={asesoresSGA}
                      value={
                        gestionComercial.asesorcomercialinterno
                          ? asesoresSGA.find(
                              (o) =>
                                o.value ===
                                gestionComercial.asesorcomercialinterno,
                            )
                          : null
                      }
                      onChange={(opt, meta) =>
                        handleGestionComercialChange({
                          target: { name: meta.name, value: opt?.value ?? "" },
                        })
                      }
                      // isClearable
                      styles={customStyles}
                      placeholder=""
                      isClearable
                    />
                  </div>
                </>
              ) : (
                ""
              )}
            </div>

            <div className="flex flex-row w-auto gap-4">
              {gestionComercial.unidadnegocio == "" ||
              gestionComercial.unidadnegocio == "1" ? (
                <>
                  <>
                    <div className="flex flex-col w-1/3">
                      <label htmlFor="analista">Analista Comercial</label>
                      <Select
                        name="analista"
                        id="analista"
                        options={analistas}
                        placeholder=""
                        styles={customStyles}
                        value={analistas.find(
                          (a) => a.value === gestionComercial.analista,
                        )}
                        onChange={(selectedOption, meta) => {
                          const value = selectedOption
                            ? selectedOption.value
                            : "";
                          handleGestionComercialChange({
                            target: {
                              name: meta.name,
                              value,
                            },
                          });
                        }}
                        isClearable
                      />
                    </div>
                    <div className="flex flex-col w-1/3">
                      <label htmlFor="asistente">Asistente Comercial</label>
                      <Select
                        options={asistentes}
                        name="asistente"
                        id="asistente"
                        value={asistentes.find(
                          (a) => a.value === gestionComercial.asistente,
                        )}
                        onChange={(selectedOption, meta) => {
                          const value = selectedOption
                            ? selectedOption.value
                            : "";
                          handleGestionComercialChange({
                            target: {
                              name: meta.name,
                              value,
                            },
                          });
                        }}
                        placeholder=""
                        styles={customStyles}
                        isClearable
                      />
                    </div>

                    <div className="flex flex-col w-1/3">
                      <label htmlFor="directorcomercial">
                        Director Comercial
                      </label>
                      <Select
                        name="directorcomercial"
                        id="directorcomercial"
                        options={directoresComerciales}
                        value={directoresComerciales.find(
                          (a) => a.value === gestionComercial.directorcomercial,
                        )}
                        onChange={(selectedOption, meta) => {
                          const value = selectedOption
                            ? selectedOption.value
                            : "";
                          handleGestionComercialChange({
                            target: {
                              name: meta.name,
                              value,
                            },
                          });
                        }}
                        placeholder=""
                        styles={customStyles}
                        isClearable
                      />
                    </div>
                  </>
                </>
              ) : (
                ""
              )}
              {gestionComercial.unidadnegocio == "3" ? (
                <>
                  <div className="flex flex-col w-[165px]">
                    <label htmlFor="asesor10">Asesor 10</label>
                    <Select
                      name="asesor10"
                      id="asesor10"
                      options={asesores10}
                      value={asesores10.find(
                        (a) => a.value === gestionComercial.asesor10,
                      )}
                      onChange={(selectedOption, meta) => {
                        const value = selectedOption
                          ? selectedOption.value
                          : "";
                        handleGestionComercialChange({
                          target: {
                            name: meta.name,
                            value,
                          },
                        });
                      }}
                      placeholder=""
                      styles={customStyles}
                      isClearable
                    />
                  </div>

                  <div className="flex flex-col w-[165px]">
                    <label htmlFor="coordinadortecnico">
                      Coordinador Técnico
                    </label>
                    <Select
                      name="coordinadortecnico"
                      id="coordinadortecnico"
                      options={coordinadores}
                      placeholder=""
                      styles={customStyles}
                      value={coordinadores.find(
                        (opt) =>
                          opt.value === gestionComercial.coordinadortecnico,
                      )}
                      onChange={(selectedOption, meta) => {
                        const value = selectedOption
                          ? selectedOption.value
                          : "";
                        handleGestionComercialChange({
                          target: { name: meta.name, value },
                        });
                      }}
                      isClearable
                    />
                  </div>
                </>
              ) : (
                ""
              )}
              {gestionComercial.unidadnegocio == "4" ? (
                <>
                  <div className="flex flex-col w-[165px]">
                    <label htmlFor="asesorganador">Asesor Ganador</label>
                    <Select
                      name="asesorganador"
                      id="asesorganador"
                      options={asesoresGanadores}
                      value={asesoresGanadores.find(
                        (a) => a.value === gestionComercial.asesorganador,
                      )}
                      onChange={(selectedOption, meta) => {
                        const value = selectedOption
                          ? selectedOption.value
                          : "";
                        handleGestionComercialChange({
                          target: {
                            name: meta.name,
                            value,
                          },
                        });
                      }}
                      placeholder=""
                      styles={customStyles}
                      isClearable
                    />
                  </div>
                  <div className="flex flex-col w-[165px]">
                    <label htmlFor="coordinadortecnico">
                      Coordinador Técnico
                    </label>
                    <Select
                      name="coordinadortecnico"
                      id="coordinadortecnico"
                      options={coordinadores}
                      placeholder=""
                      styles={customStyles}
                      value={coordinadores.find(
                        (opt) =>
                          opt.value === gestionComercial.coordinadortecnico,
                      )}
                      onChange={(selectedOption, meta) => {
                        const value = selectedOption
                          ? selectedOption.value
                          : "";
                        handleGestionComercialChange({
                          target: { name: meta.name, value },
                        });
                      }}
                      isClearable
                    />
                  </div>
                </>
              ) : (
                ""
              )}
            </div>
          </div>
          {gestionComercial.unidadnegocio != "3" &&
          gestionComercial.unidadnegocio != "4" ? (
            <>
              <div className="flex flex-row gap-4 mt-2">
                <div className="flex flex-col w-[165px]">
                  <label htmlFor="coordinadortecnico">
                    Coordinador Tecnico
                  </label>
                  <Select
                    name="coordinadortecnico"
                    id="coordinadortecnico"
                    options={coordinadores}
                    placeholder=""
                    styles={customStyles}
                    value={coordinadores.find(
                      (opt) =>
                        opt.value === gestionComercial.coordinadortecnico,
                    )}
                    onChange={(selectedOption, meta) => {
                      const value = selectedOption ? selectedOption.value : "";
                      handleGestionComercialChange({
                        target: { name: meta.name, value },
                      });
                    }}
                    isClearable
                  />
                </div>
              </div>
            </>
          ) : (
            ""
          )}

          <div className="flex flex-col gap-1 w-full mt-[96px]">
            <textarea
              name="observaciones"
              id="observaciones"
              style={{ resize: "none", backgroundColor: "#FCFCFC" }}
              className="border-0 border-gray-300 text-gray-900 focus:outline-none h-[30px] p-1 border-b-[1px]"
              cols={1}
              placeholder="Observaciones"
              value={gestionComercial.observaciones}
              onChange={handleGestionComercialChange}
            ></textarea>
          </div>
        </GeneralBox>

        {/* Seccion 7 Valores de Póliza */}

        <GeneralBox titulo="Valores de Póliza">
          <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-row gap-4 pt-[20px] pb-[20px] flex-wrap w-auto">
              <div className="flex flex-col w-[158px]">
                <div className="relative">
                  <input
                    type="text"
                    id="primaneta"
                    name="primaneta"
                    style={{ backgroundColor: "#FCFCFC" }}
                    className="peer w-[158px] border-b-[1.5px] border-gray-300 text-gray-900 placeholder-transparent focus:outline-none focus:border-lime-600 mt-2"
                    placeholder="Prima Neta"
                    value={valoresPoliza.primaneta}
                    onChange={(e) => {
                      const { value, name } = e.target;

                      // Elimina caracteres que no sean dígitos
                      const soloNumeros = value.replace(/\D/g, "");

                      // Si el valor está vacío o no es un número válido, deja el campo vacío
                      if (soloNumeros === "") {
                        setValoresPoliza((prev) => ({
                          ...prev,
                          [name]: "",
                        }));
                        return;
                      }

                      const numero = parseInt(soloNumeros, 10);

                      setValoresPoliza((prev) => ({
                        ...prev,
                        [name]: numero.toLocaleString("es-CO", {
                          style: "currency",
                          currency: "COP",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }),
                      }));
                    }}
                  />
                  <label
                    htmlFor="primaneta"
                    className="absolute left-0 -top-4 text-gray-500 text-[15px] transition-all peer-placeholder-shown:top-[5px] peer-placeholder-shown:text-[14px] peer-placeholder-shown:text-gray-400 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-gray-600"
                  >
                    Prima Neta
                  </label>
                </div>
              </div>
              <div className="flex flex-col w-[158px]">
                <div className="relative w-[158px]">
                  <input
                    type="text"
                    id="asistenciasotros"
                    name="asistenciasotros"
                    style={{ backgroundColor: "#FCFCFC" }}
                    className="peer w-[158px] border-b-[1.5px] border-gray-300 text-gray-900 placeholder-transparent focus:outline-none focus:border-lime-600 mt-2"
                    placeholder="Asistencias/Otros"
                    value={valoresPoliza.asistenciasotros}
                    onChange={(e) => {
                      const { value, name } = e.target;

                      // Elimina caracteres que no sean dígitos
                      const soloNumeros = value.replace(/\D/g, "");

                      // Si el valor está vacío o no es un número válido, deja el campo vacío
                      if (soloNumeros === "") {
                        setValoresPoliza((prev) => ({
                          ...prev,
                          [name]: "",
                        }));
                        return;
                      }

                      const numero = parseInt(soloNumeros, 10);

                      setValoresPoliza((prev) => ({
                        ...prev,
                        [name]: numero.toLocaleString("es-CO", {
                          style: "currency",
                          currency: "COP",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }),
                      }));
                    }}
                  />
                  <label
                    htmlFor="asistenciasotros"
                    style={{ backgroundColor: "#FCFCFC" }}
                    className="absolute w-[158px] left-0 -top-4 text-gray-500 text-[15px] transition-all peer-placeholder-shown:top-[5px] peer-placeholder-shown:text-[14px] peer-placeholder-shown:text-gray-400 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-gray-600"
                  >
                    Asistencias/Otros
                  </label>
                </div>
              </div>

              <div className="flex flex-col w-[158px]">
                <div className="relative w-[158px]">
                  <input
                    type="text"
                    name="gastosexpedicion"
                    id="gastosexpedicion"
                    style={{ backgroundColor: "#FCFCFC" }}
                    className="peer w-[158px] border-b-[1.5px] border-gray-300 text-gray-900 placeholder-transparent focus:outline-none focus:border-lime-600 mt-2"
                    placeholder="Gastos Expedición"
                    value={valoresPoliza.gastosexpedicion}
                    onChange={(e) => {
                      const { value, name } = e.target;

                      // Elimina caracteres que no sean dígitos
                      const soloNumeros = value.replace(/\D/g, "");

                      // Si el valor está vacío o no es un número válido, deja el campo vacío
                      if (soloNumeros === "") {
                        setValoresPoliza((prev) => ({
                          ...prev,
                          [name]: "",
                        }));
                        return;
                      }

                      const numero = parseInt(soloNumeros, 10);

                      setValoresPoliza((prev) => ({
                        ...prev,
                        [name]: numero.toLocaleString("es-CO", {
                          style: "currency",
                          currency: "COP",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }),
                      }));
                    }}
                  />
                  <label
                    htmlFor="gastosexpedicion"
                    className="w-[158px] absolute left-0 -top-4 text-gray-500 text-[15px] transition-all peer-placeholder-shown:top-[5px] peer-placeholder-shown:text-[14px] peer-placeholder-shown:text-gray-400 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-gray-600"
                  >
                    Gastos Expedición
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-row w-auto gap-4">
              <div className="flex flex-col w-[158px]">
                <div className="relative w-[158px]">
                  <input
                    type="text"
                    id="iva"
                    name="iva"
                    style={{ backgroundColor: "#FCFCFC" }}
                    className="peer w-[158px] border-b-[1.5px] border-gray-300 text-gray-900 placeholder-transparent focus:outline-none focus:border-lime-600 mt-2"
                    placeholder="IVA"
                    value={valoresPoliza.iva}
                    onChange={(e) => {
                      const { value, name } = e.target;
                      const soloNumeros = value.replace(/\D/g, "");
                      if (soloNumeros === "") {
                        // Vacío: quita el modo manual para que vuelva a calcular por %
                        setValoresPoliza((prev) => ({
                          ...prev,
                          [name]: "",
                          ivaManual: false,
                        }));
                        return;
                      }
                      const numero = parseInt(soloNumeros, 10);
                      setValoresPoliza((prev) => ({
                        ...prev,
                        ivaManual: true, // se activa al escribir
                        [name]: numero.toLocaleString("es-CO", {
                          style: "currency",
                          currency: "COP",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }),
                      }));
                    }}
                  />
                  <label
                    htmlFor="iva"
                    className="w-[158px] absolute left-0 -top-4 text-gray-500 text-[15px] transition-all peer-placeholder-shown:top-[5px] peer-placeholder-shown:text-[14px] peer-placeholder-shown:text-gray-400 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-gray-600"
                  >
                    IVA
                  </label>
                </div>
              </div>

              <div className="flex flex-col w-[158px]">
                <div className="relative w-[158px]">
                  <input
                    type="text"
                    id="valortotal"
                    name="valortotal"
                    value={valoresPoliza.valortotal}
                    onChange={handleValorTotalChange}
                    style={{ backgroundColor: "#FCFCFC" }}
                    className="peer w-[158px] border-b-[1.5px] border-gray-300 text-gray-900 placeholder-transparent focus:outline-none focus:border-lime-600 mt-2"
                    placeholder="Valor Total"
                  />
                  <label
                    htmlFor="valortotal"
                    className="w-[158px] absolute left-0 -top-4 text-gray-500 text-[15px] transition-all peer-placeholder-shown:top-[5px] peer-placeholder-shown:text-[14px] peer-placeholder-shown:text-gray-400 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-gray-600"
                  >
                    Valor Total
                  </label>
                </div>
              </div>

              <div className="flex flex-col w-1/3"></div>
            </div>

            <div className="flex flex-row gap-4">
              <>
                <div className="flex flex-col w-1/3">
                  <label htmlFor="formapago">Forma de pago:</label>
                  <Select
                    name="formapago"
                    id="formapago"
                    options={[
                      { value: "1", label: "Financiada" },
                      { value: "2", label: "Contado" },
                    ]}
                    value={[
                      { value: "1", label: "Financiada" },
                      { value: "2", label: "Contado" },
                    ].find((opt) => opt.value === valoresPoliza.formapago)}
                    onChange={async (selectedOption, meta) => {
                      const value = selectedOption ? selectedOption.value : "";
                      if (selectedOption?.value === "1") {
                        await handleChangesFinanciera();
                      }
                      if (
                        selectedOption?.value === "2" ||
                        selectedOption?.value === ""
                      ) {
                        setValoresPoliza((prev) => ({
                          ...prev,
                          financiada: "",
                          nocuotas: "",
                        }));
                        setQuotesFinancieras([]);
                      }

                      handleValorTotalChange({
                        target: {
                          name: meta.name,
                          value,
                        },
                      });
                    }}
                    styles={customStyles}
                    placeholder=""
                    isClearable
                  />
                </div>
                {valoresPoliza.formapago == "1" ? (
                  <>
                    <div className="flex flex-col w-1/3">
                      <label htmlFor="financiada">Financiada por:</label>
                      <Select
                        name="financiada"
                        id="financiada"
                        options={financieras}
                        value={
                          Array.isArray(financieras)
                            ? financieras.find(
                                (opt) => opt.value === valoresPoliza.financiada,
                              ) || null
                            : null
                        }
                        onChange={(selectedOption, meta) => {
                          const value = selectedOption
                            ? selectedOption.value
                            : "";

                          // SOLO llamar al backend si hay valor
                          if (value) {
                            handlerChargeQuotesFinanciera(value);
                          } else {
                            setQuotesFinancieras([]); // limpiar cuotas al borrar
                            handleValorTotalChange({
                              target: { name: "nocuotas", value: "" },
                            });
                          }

                          handleValorTotalChange({
                            target: {
                              name: meta.name,
                              value,
                            },
                          });
                        }}
                        styles={customStyles}
                        placeholder=""
                        isClearable
                      />
                    </div>
                    <div className="flex flex-col w-1/3">
                      <label htmlFor="no_cuotas"># Cuotas:</label>
                      <Select
                        name="nocuotas"
                        id="nocuotas"
                        options={quotesFinancieras}
                        value={quotesFinancieras.find(
                          (opt) => opt.value === valoresPoliza.nocuotas,
                        )}
                        onChange={(selectedOption, meta) => {
                          handleValorTotalChange({
                            target: {
                              name: meta.name,
                              value: selectedOption ? selectedOption.value : "",
                            },
                          });
                        }}
                        styles={customStyles}
                        placeholder="Seleccione..."
                        isClearable
                      />
                    </div>
                  </>
                ) : (
                  ""
                )}
              </>
              {/* )} */}
            </div>
          </div>

          <div className="flex flex-col gap-1 w-1/3 mt-[25px]">
            <label htmlFor="fechalimite">Fecha limite de pago:</label>
            <input
              type="date"
              name="fechalimite"
              id="fechalimite"
              style={{ resize: "none", backgroundColor: "#FCFCFC" }}
              className="border-0 border-gray-300 text-gray-900 focus:outline-none h-[30px] p-1 border-b-[1px]"
              cols={1}
              placeholder="Fecha límite de pago:"
              value={sumarDias(cabezotePoliza.fechaInicioVigencia, 30) || ""}
              onChange={handleValorTotalChange}
            />
          </div>
        </GeneralBox>
      </section>

      {/* Sección 8 Registro de pago */}
      {!id_poliza && !id_anexo ? (
        <section className="">
          <GeneralBox
            titulo={"Registro de pago"}
            width={"w-full"}
            stateHeader={stateHeader}
            statePago={registrarPagos}
            setStatePago={handleRegistrarPago}
            textButton={["Agregar Pago", "Guardar Pago"]}
            readyToSave={readyToSave}
          >
            {/* 1) Pagos EXISTENTES (solo lectura) */}
            {valoresRecibidos.map((pago, index) => (
              <RegistroPago
                key={`existente-${index}`}
                formasPago={formasPago}
                pago={pago}
                index={index}
                /* NO editar ni borrar: setter no-op de bloqueo deedición */
                setValoresRecibidos={noop}
                onEliminarPago={noop}
                registrarPagos={false}
                otrosConceptos={otrosConceptos}
                setOtrosConceptos={setOtrosConceptos}
                otrosConceptosValor={otrosConceptosValor}
                setOtrosConceptosValor={setOtrosConceptosValor}
                certificado={cabezotePoliza.noCertificado}
              />
            ))}

            {/* 2) Pagos NUEVOS (editables y eliminables) */}
            {valoresRecibidosTemp.map((pago, tIndex) => (
              <RegistroPago
                key={pago.uid || `temp-${tIndex}`}
                formasPago={formasPago}
                pago={pago}
                index={tIndex} // índice de los temporales
                setValoresRecibidos={setValoresRecibidosTemp}
                onEliminarPago={() => handleEliminarPago(tIndex)}
                registrarPagos={registrarPagos}
                otrosConceptos={otrosConceptos}
                setOtrosConceptos={setOtrosConceptos}
                otrosConceptosValor={otrosConceptosValor}
                setOtrosConceptosValor={setOtrosConceptosValor}
                certificado={cabezotePoliza.noCertificado}
                from="editarPoliza"
              />
            ))}

            <button
              className="text-lime-9000 font-bold pl-0 hover:cursor-pointer text-left w-[220px] mt-4"
              onClick={handleAgregarPago}
              disabled={!registrarPagos}
            >
              + Agregar otra forma de pago
            </button>

            <p className="pl-0 pt-8 font-bold text-gray-500">
              Saldo: {calculateTotalSaldo()}
            </p>

            <div className="relative w-1/2 mt-5">
              <input
                type="text"
                id="observacionesPago"
                name="observacionesPago"
                style={{ backgroundColor: "#FCFCFC" }}
                className="peer w-[500px] border-b-[1.5px] border-gray-300 text-gray-900 placeholder-transparent focus:outline-none focus:border-lime-600 mt-2"
                placeholder="Observaciones"
                value={observaciones}
                disabled={id_poliza || id_anexo}
                onChange={(e) => setObservaciones(e.target.value)}
              />
              <label
                htmlFor="observacionesPago"
                className="w-1/2 absolute left-0 -top-4 text-gray-500 text-[15px] transition-all peer-placeholder-shown:top-[5px] peer-placeholder-shown:text-[14px] peer-placeholder-shown:text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-600"
              >
                Observaciones pagos:
              </label>
            </div>
          </GeneralBox>

          {id_poliza || id_anexo ? null : (
            <section className="flex flex-row gap-5 justify-end mt-10 mb-10 mr-[22px]">
              <BtnGeneral
                id={"btnVerMovimientos"}
                className={
                  "bg-gray-400 text-white px-10 h-[35px] m-[2px] rounded hover:bg-lime-600 transition duration-300 ease-in-out"
                }
                funct={() => setModalVerMovimientos(true)}
              >
                <span>Ver movimientos</span>
              </BtnGeneral>
              {userData.crear_movimiento == "x" ? (
                <BtnGeneral
                  id={"btnCrearMovimiento"}
                  className={`bg-gray-400 text-white px-10 h-[35px] m-[2px] rounded hover:bg-lime-600 transition duration-300 ease-in-out ${
                    cabezotePoliza.tipoCertificado === "4"
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  funct={() => {
                    clearMovimiento(); // ⬅️ limpia el contexto
                    setModalMovimiento(true);
                  }}
                  isDisabled={cabezotePoliza.tipoCertificado === "4"}
                >
                  <span>Crear movimiento</span>
                </BtnGeneral>
              ) : null}
              <BtnGeneral
                id={"btnGuardarPoliza"}
                className={
                  "bg-lime-9000 text-white px-10 h-[35px] m-[2px] rounded hover:bg-lime-600 transition duration-300 ease-in-out"
                }
                funct={handlerUpdatePoliza}
              >
                <span>Actualizar</span>
              </BtnGeneral>
            </section>
          )}
        </section>
      ) : null}
      {id_poliza || id_anexo ? (
        <GeneralBox
          titulo={"Información cartera, conciliación y comisiones"}
          width={"w-full"}
          stateHeader={true}
          statePago={false}
        >
          <table>
            <thead>
              <tr className="bg-gray-200">
                <th className="border-[1.5px] px-4 py-2">Estado Cartera</th>
                <th className="border-[1.5px] px-4 py-2">Saldo</th>
                <th className="border-[1.5px] px-4 py-2">
                  Conciliación Aseguradora
                </th>
                <th className="border-[1.5px] px-4 py-2">
                  Comision Asesor Freelance
                </th>
                <th className="border-[1.5px] px-4 py-2">Comision Analista</th>
                <th className="border-[1.5px] px-4 py-2">Comision Director</th>
                <th className="border-[1.5px] px-4 py-2">Comision Asistente</th>
                <th className="border-[1.5px] px-4 py-2">Comision Técnica</th>
                <th className="border-[1.5px] px-4 py-2">
                  Comision Coor. Técnico
                </th>
                <th className="border-[1.5px] px-4 py-2">
                  Comision Asesor Comercial Interno
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Fila 1: valores */}
              <tr>
                <td className="border-[1.5px] text-center">
                  {Number(calculateTotalSaldo().slice(2).replace(/\./g, "")) > 0
                    ? "Pendiente"
                    : "Al dia"}
                </td>
                <td className="border-[1.5px] px-4 py-2 text-center">
                  {calculateTotalSaldo()}
                </td>
                <td className="border-[1.5px] px-4 py-2 text-center">-</td>
                {ORDER.map((role) => (
                  <td
                    key={`${role}-valor`}
                    className="border-[1.5px] px-4 py-2 text-center"
                  >
                    {getCell(pagosLiquidaciones, role, "valor", money)}
                  </td>
                ))}
              </tr>

              {/* Fila 2: # liquidación */}
              <tr>
                <td className="bg-gray-200 px-4 py-2 text-center"></td>
                <td className="border-[1.5px] py-2 text-center w-36">
                  # Liquidación
                </td>
                <td className="border-[1.5px] py-2 text-center w-36">-</td>
                {ORDER.map((role) => (
                  <td
                    key={`${role}-liq`}
                    className="border-[1.5px] px-4 py-2 text-center"
                  >
                    {getCell(pagosLiquidaciones, role, "id_liquidacion")}
                  </td>
                ))}
              </tr>

              {/* Fila 3: fecha */}
              <tr>
                <td className="bg-gray-200 px-4 py-2 text-center"></td>
                <td className="border-[1.5px] px-4 py-2 text-center">
                  Fecha de pago
                </td>
                <td className="border-[1.5px] px-4 py-2 text-center">-</td>
                {ORDER.map((role) => (
                  <td
                    key={`${role}-fecha`}
                    className="border-[1.5px] px-4 py-2 text-center"
                  >
                    {getCell(pagosLiquidaciones, role, "fecha")}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </GeneralBox>
      ) : null}
    </div>
  );
};
