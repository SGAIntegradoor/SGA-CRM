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
import { useContext, useEffect, useState } from "react";
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
import { getCoordinadores } from "../../../services/Users/getCoordinadores";
import { getDirectores } from "../../../services/Users/getDirectores";
import { getAsistentes } from "../../../services/Users/getAsistentes";
import { getUnidadesNegocio } from "../../../services/Polizas/getUnidadNegocio";
import { getOtrosConceptos } from "../../../services/Polizas/getOtrosConceptos";
import { getTiposPoliza } from "../../../services/Polizas/getTiposPoliza";
import { useNavigate } from "react-router-dom";
import { createPoliza } from "../../../services/Polizas/createPoliza";
import { getAsesoresSGA } from "../../../services/Users/getAsesoresSGA";
import { getBeneficiarios } from "../../../services/Polizas/getBeneficiarios";
import { getFinancieras } from "../../../services/Polizas/getFinancieras";
import { getQuotesFinancieras } from "../../../services/Polizas/getQuotesFinancieras";
import { getFasecoldaBrands, getFasecoldaClass } from "../../../utils/utils";

export const Polizas = ({ setLoading, loading }) => {
  const navigate = useNavigate();
  const [bodyPoliza, setBodyPoliza] = useState({});
  const [insurers, setInsurers] = useState([]);
  const [ramo, setRamo] = useState([]);
  const [formasPago, setFormasPago] = useState([]);

  const [calledFrom, setCalledFrom] = useState("");

  const [valorTotal, setValorTotal] = useState("");

  const [quotesFinancieras, setQuotesFinancieras] = useState([]);

  const [numeroPagos, setNumeroPagos] = useState(1);
  const [registrarPagos, setRegistrarPagos] = useState(false);

  const [cliente, setCliente] = useState([]);

  const [idClienteIntegradoor, setIdClienteIntegradoor] = useState(null);

  const [documentoTemp, setDocumentoTemp] = useState(null);

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
        fechaFinVigencia: fechaVigencia?.toISOString()?.split("T")[0],
      }));
    }
    setCabezotePoliza((prev) => ({ ...prev, [name]: value }));
  };

  // Estados de cabezote de poliza FIN

  // Estados de vehiculo

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

  const [marcas, setMarcas] = useState([]);

  const [clases, setClases] = useState([]);

  useEffect(() => {
    const fetchMarcasAndClases = async () => {
      setLoading(true);
      const marcas = await getFasecoldaBrands();
      setMarcas(marcas);
      const clases = await getFasecoldaClass();
      setClases(clases);
      setLoading(false);
    };
    if (INPUT_PLACA_ALLOW.includes(Number(cabezotePoliza.ramo))) {
      fetchMarcasAndClases();
    }
  }, [cabezotePoliza.ramo]);

  const formatCOP = (n) =>
    Number(n || 0).toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const handleSelectVehiculoChange = (name, selectedOption) => {
    const value = selectedOption ? selectedOption.value : "";
    setVehiculo((prev) => ({
      ...prev,
      [name]: value,
    }));

    setBodyPoliza((prev) => ({
      ...prev,
      vehiculo: {
        ...prev.vehiculo,
        [name]: value,
      },
    }));
  };

  const handleVehiculoChange = (e) => {
    const { name, value } = e.target;

    console.log(e);

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
    } else {
      setVehiculo((prev) => ({
        ...prev,
        [name]: value,
      }));
      setBodyPoliza((prev) => ({
        ...prev,
        vehiculo: {
          ...prev.vehiculo,
          [name]: value,
        },
      }));
    }
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

    setVehiculo({
      busqueda: vehiculo.busqueda,
      placa: "",
      fasecolda: "",
      valorFasecolda: "",
      marca: "",
      modelo: "",
      linea: "",
      clase: "",
    });

    try {
      const response = await getVehiculo(vehiculo.busqueda);
      if (response.status === "Ok") {
        setVehiculo({
          ...vehiculo,
          placa: response.data.placa,
          fasecolda: response.data.fasecolda,
          // valorFasecolda: response.data.valorFasecolda,
          marca: response.data.marca,
          modelo: response.data.modelo,
          linea: response.data.linea,
          clase: response.data.clase,
        });
      }
      console.log(vehiculo);
      setBodyPoliza((prev) => ({
        ...prev,
        vehiculo: {
          placa: response.data.placa,
          fasecolda: response.data.fasecolda,
          // valorFasecolda: response.data.valorFasecolda,
          marca: response.data.marca,
          modelo: response.data.modelo,
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

  // Estados de vehiculo FIN

  // Estados Gestion Comercial INICIO

  const [analistas, setAnalistas] = useState([]);
  const [freelances, setFreelances] = useState([]);
  const [unidadNegocio, setUnidadNegocio] = useState([]);
  const [tecnicosEmisores, setTecnicosEmisores] = useState([]);
  const [asesoresSGA, setAsesoresSGA] = useState([]);
  const [asistentes, setAsistentes] = useState([]);
  const [coordinadores, setCoordinadores] = useState([]);
  const [directoresComerciales, setDirectoresComerciales] = useState([]);

  const [gestionComercial, setGestionComercial] = useState({
    tecnicoemisor: "",
    coordinadortecnico: "",
    analista: "",
    asesorcomercialinterno: "",
    asesorfreelance: "",
    asesorganador: "",
    asesor10: "",
    directorcomercial: "",
    asistente: "",
    unidadnegocio: "",
    observaciones: "",
  });

  useEffect(() => {
    if (gestionComercial.unidadnegocio == "1") {
      setGestionComercial((prev) => ({
        ...prev,
        directorcomercial: "1007028818",
        asistente: "1107070475",
        coordinadortecnico: "66830224",
      }));
    } else {
      setGestionComercial((prev) => ({
        ...prev,
        directorcomercial: "",
        asistente: "",
        coordinadortecnico: "",
      }));
    }
  }, [gestionComercial.unidadnegocio]);

  // --- Helpers para limpiar dependencias de Gestión Comercial --- //
  const GC_FIELDS_DEPENDIENTES = [
    "analista",
    "coordinadortecnico",
    "asesorcomercialinterno",
    "asesorfreelance",
    "asesorganador",
    "asesor10",
    "directorcomercial",
    "asistente",
  ];

  // Campos que NUNCA se limpian automáticamente al cambiar unidad
  const GC_FIELDS_KEEP = new Set([
    "tecnicoemisor",
    "unidadnegocio",
    "observaciones",
  ]);

  // Limpia dependientes y deja solo lo permitido por unidad
  const resetGestionComercialByUnidad = (unidad) => {
    setGestionComercial((prev) => {
      const next = { ...prev, unidadnegocio: unidad };
      GC_FIELDS_DEPENDIENTES.forEach((k) => (next[k] = ""));
      return next;
    });
  };

  // (Opcional) Evitar asignaciones “ilegales” cuando un campo no aplica para la unidad actual
  const NOT_ALLOWED_BY_UNIT = {
    1: [
      "asesorcomercialinterno",
      "asesor10",
      "asesorganador",
      // "coordinadortecnico",
    ],
    2: [
      "asesorfreelance",
      // "coordinadortecnico",
      "analista",
      "asistente",
      "directorcomercial",
      "asesor10",
      "asesorganador",
    ],
    3: [
      "asesorfreelance",
      // "coordinadortecnico",
      "analista",
      "asistente",
      "directorcomercial",
      "asesorganador",
    ],
    4: [
      "asesorfreelance",
      // "coordinadortecnico",
      "analista",
      "asistente",
      "directorcomercial",
      "asesor10",
    ],
    "": [], // estado inicial
  };

  const handleGestionComercialChange = (e) => {
    const { name, value } = e.target;

    // Si cambia la unidad: limpiar dependientes de inmediato
    if (name === "unidadnegocio") {
      resetGestionComercialByUnidad(value);
      return;
    }

    // (Opcional) Bloquear sets a campos no permitidos por la unidad actual
    const currentUnit = gestionComercial.unidadnegocio || "";
    if (NOT_ALLOWED_BY_UNIT[currentUnit]?.includes(name)) {
      // Campo no aplica para la unidad actual -> ignorar cambio
      return;
    }

    // Set normal para cualquier otro campo
    setGestionComercial((prev) => ({ ...prev, [name]: value }));
  };
  const handleGetAnalistaByFreelance = async (e) => {
    const { value } = e.target;
    try {
      const response = await getAnalistaByFreelance(value);
      if (response.status === "Ok") {
        setGestionComercial((prev) => ({
          ...prev,
          analista: response.data[0]?.id_analista ?? "",
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
    ivaPorcentaje: "19",
    ivaManual: false,
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
  // const calculateValorTotal = () => {
  //   if (cabezotePoliza.ramo === "6") {
  //     const primaneta = parseValorMoneda(valoresPoliza.primaneta_aviajes);
  //     const TRM_aviajes = parseValorMoneda(valoresPoliza.TRM_aviajes);

  //     const valor_total = primaneta * TRM_aviajes;
  //     setValoresPoliza((prev) => ({
  //       ...prev,
  //       valor_asistencia_aviajes: valor_total.toLocaleString("es-CO", {
  //         style: "currency",
  //         currency: "COP",
  //         minimumFractionDigits: 0,
  //         maximumFractionDigits: 0,
  //       }),
  //     }));
  //     return;
  //   }
  //   const primaneta = parseValorMoneda(valoresPoliza.primaneta);
  //   const asistenciasotros = parseValorMoneda(valoresPoliza.asistenciasotros);
  //   const gastosexpedicion = parseValorMoneda(valoresPoliza.gastosexpedicion);
  //   // const iva = parseValorMoneda(valoresPoliza.iva);
  //   let ivaCalculado = 0;
  //   const iva = parseFloat(valoresPoliza.iva) || 0;
  //   if (valoresPoliza.iva !== "" || valoresPoliza.iva !== 0) {
  //     ivaCalculado = (primaneta + asistenciasotros + gastosexpedicion) * 0.19;
  //     setValoresPoliza((prev) => ({
  //       ...prev,
  //       iva: ivaCalculado.toLocaleString("es-CO", {
  //         style: "currency",
  //         currency: "COP",
  //         minimumFractionDigits: 0,
  //         maximumFractionDigits: 0,
  //       }),
  //     }));
  //   }
  //   const total =
  //     primaneta + asistenciasotros + gastosexpedicion + ivaCalculado;
  //   setValoresPoliza((prev) => ({
  //     ...prev,
  //     valortotal: total.toLocaleString("es-CO", {
  //       style: "currency",
  //       currency: "COP",
  //       minimumFractionDigits: 0,
  //       maximumFractionDigits: 0,
  //     }),
  //   }));
  // };

  const calculateValorTotal = () => {
    // if (cabezotePoliza.ramo === "6") {
    //   // ... (sin cambios para viajes)
    //   return;
    // }
    const primaneta = parseValorMoneda(valoresPoliza.primaneta);
    const asistenciasotros = parseValorMoneda(valoresPoliza.asistenciasotros);
    const gastosexpedicion = parseValorMoneda(valoresPoliza.gastosexpedicion);
    const base = primaneta + asistenciasotros + gastosexpedicion;

    const ivaPct =
      Math.max(0, parseFloat(valoresPoliza.ivaPorcentaje) || 0) / 100;
    let ivaMonto = 0;
    if (valoresPoliza.ivaManual && valoresPoliza.iva !== "") {
      // El usuario editó el IVA: se respeta
      ivaMonto = parseValorMoneda(valoresPoliza.iva);
    } else {
      // IVA por porcentaje (default o si se vacía el campo IVA)
      ivaMonto = base * ivaPct;
      setValoresPoliza((prev) => ({
        ...prev,
        iva: ivaMonto.toLocaleString("es-CO", {
          style: "currency",
          currency: "COP",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }),
      }));
    }
    //  const total = base + ivaCalculado;
    const total = base + (ivaMonto || 0);

    setValoresPoliza((prev) => ({
      ...prev,
      valortotal: total.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    }));
  };

  const handleChangesFinanciera = async () => {
    try {
      setLoading(true);
      const response = await getFinancieras();
      console.log(response);
      setFinancieras(response);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching financieras:", error);
    }
  };

  // Estados Valores de Póliza FIN

  // Estados de Pagos Poliza INICIO

  const [otrosConceptos, setOtrosConceptos] = useState([]);
  const [otrosConceptosValor, setOtrosConceptosValor] = useState({
    razon_concepto: "",
    valor: "",
  });

  const [valoresRecibidos, setValoresRecibidos] = useState([
    {
      fecha: "",
      formaPago: "",
      valor: "",
      certificado: cabezotePoliza.noCertificado,
    },
  ]);

  const handleAgregarPago = () => {
    setValoresRecibidos((prev) => [
      ...prev,
      {
        fecha: "",
        formaPago: "",
        valor: "",
        certificado: cabezotePoliza.noCertificado,
      },
    ]);
    setNumeroPagos((prev) => prev + 1);
  };

  const handleEliminarPago = (index) => {
    setValoresRecibidos((prev) => prev.filter((_, i) => i !== index));
    setNumeroPagos((n) => Math.max(n - 1, 1));
  };
  // Estados de Pagos Poliza FIN

  const {
    selectedClientId,
    setSelectedClientId,
    isModalOpenCliente,
    setIsModalOpenCliente,
  } = useContext(NavContext);
  const userData = JSON.parse(localStorage.getItem("userData"));

  useEffect(() => {
    // Initialize the loading state
    // and set the current date for fechaRegistro

    setLoading(true);

    setCabezotePoliza((prev) => ({
      ...prev,
      fechaRegistro: new Date().toISOString().split("T")[0],
    }));

    handlerLoadInsurers()
      .then(() => {
        // setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading insurers:", error);
        setLoading(false);
      });

    handlerLoadRamo()
      .then(() => {
        // setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading ramo:", error);
        setLoading(false);
      });

    handlerLoadFormasPago()
      .then(() => {
        // setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading formas de pago:", error);
        setLoading(false);
      });

    handlerLoadAnalistas()
      .then(() => {
        // setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading analistas:", error);
        setLoading(false);
      });

    handlerLoadFreelances()
      .then(() => {
        // setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading freelances:", error);
        setLoading(false);
      });

    handlerLoadTecnicosEmisores()
      .then(() => {
        // setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading tecnicos emisores:", error);
        setLoading(false);
      });

    handlerLoadCoordinadores()
      .then(() => {
        // setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading coordinadores:", error);
        setLoading(false);
      });

    handlerLoadDirectoresComerciales()
      .then(() => {
        // setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading directores comerciales:", error);
        setLoading(false);
      });

    handlerLoadAsistentes()
      .then(() => {
        // setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading asistentes:", error);
        setLoading(false);
      });

    handlerLoadUnidadNegocio()
      .then(() => {
        // setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading unidad de negocio:", error);
        setLoading(false);
      });

    handlerLoadOtrosConceptos()
      .then(() => {
        // setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading otros conceptos:", error);
        setLoading(false);
      });

    handlerLoadOtrosConceptos()
      .then(() => {
        // setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading otros conceptos:", error);
        setLoading(false);
      });

    handlerLoadOtrosConceptos()
      .then(() => {
        // setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading otros conceptos:", error);
        setLoading(false);
      });

    handlerLoadBeneficiarios()
      .then(() => {
        // setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading beneficiarios:", error);
        setLoading(false);
      });

    handlerLoadTiposPoliza()
      .then(() => {
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading tipos de póliza:", error);
        setLoading(false);
      });
  }, [setLoading]);

  useEffect(() => {
    calculateValorTotal();
  }, [
    valoresPoliza.iva,
    valoresPoliza.ivaPorcentaje,
    valoresPoliza.ivaManual,
    valoresPoliza.asistenciasotros,
    valoresPoliza.gastosexpedicion,
    valoresPoliza.primaneta,
    valoresPoliza.primaneta_aviajes,
    valoresPoliza.TRM_aviajes,
  ]);

  useEffect(() => {
    calculateTotalSaldo();
  }, [numeroPagos, valoresRecibidos, valorTotal]);

  const handlerLoadBeneficiarios = async () => {
    // Function to load beneficiaries data
    // This is a placeholder for the actual implementation
    const beneficiarios = await getBeneficiarios();
    setBeneficiarios(beneficiarios);
  };

  const handlerLoadFreelances = async () => {
    // Function to load freelancers data
    // This is a placeholder for the actual implementation
    const freelances = await getFreelances();
    setFreelances(freelances);
  };

  const handlerLoadTecnicosEmisores = async () => {
    // Function to load issuing technicians data
    // This is a placeholder for the actual implementation
    const tecnicos = await getTecnicos();
    setTecnicosEmisores(tecnicos);
  };

  const handlerLoadCoordinadores = async () => {
    // Function to load coordinators data
    // This is a placeholder for the actual implementation
    const coordinadores = await getCoordinadores();
    setCoordinadores(coordinadores);
  };

  const handlerLoadInsurers = async () => {
    // Function to load insurers data
    // This is a placeholder for the actual implementation
    const aseguradoras = await obtenerAseguradoras();
    setInsurers(aseguradoras);
  };

  const handlerLoadAnalistas = async () => {
    // Function to load analysts data
    // This is a placeholder for the actual implementation
    const analistas = await getAnalistas();
    setAnalistas(analistas);
  };

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

  const handlerLoadDirectoresComerciales = async () => {
    // Function to load commercial directors data
    // This is a placeholder for the actual implementation
    const directores = await getDirectores();
    setDirectoresComerciales(directores);
  };

  const handlerLoadAsistentes = async () => {
    // Function to load assistants data
    // This is a placeholder for the actual implementation
    const asistentes = await getAsistentes();
    setAsistentes(asistentes);
  };

  const handlerLoadAsesoresSGA = async (unidadNegocio) => {
    // Function to load business units data
    // This is a placeholder for the actual implementation
    const asesorescomercialesint = await getAsesoresSGA(unidadNegocio);
    setAsesoresSGA(asesorescomercialesint);
  };

  useEffect(() => {
    const unidad = gestionComercial.unidadnegocio;
    if (["2", "3", "4"].includes(unidad)) {
      handlerLoadAsesoresSGA(unidad);
    } else {
      // Si no aplica asesores internos, limpiar opciones para evitar residuos de selects
      setAsesoresSGA([]);
    }
  }, [gestionComercial.unidadnegocio]);

  const handlerLoadTiposPoliza = async () => {
    // Function to load other concepts data
    // This is a placeholder for the actual implementation
    const tipos = await getTiposPoliza();
    setTiposPoliza(tipos);
  };

  const handlerLoadOtrosConceptos = async () => {
    // Function to load other concepts data
    // This is a placeholder for the actual implementation
    const otrosConceptos = await getOtrosConceptos();
    setOtrosConceptos(otrosConceptos);
  };

  const handleRegistrarPago = () => {
    // Logic to handle registering payment
    // This is a placeholder for the actual implementation
    setRegistrarPagos(!registrarPagos);
  };

  const parseValorMoneda = (valor) => {
    if (!valor) return 0;
    return parseFloat(valor.replace(/[$\s.]/g, ""));
  };

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
    const totalRecibido = valoresRecibidos.reduce(
      (acc, pago) => acc + (parseValorMoneda(pago.valor) || 0),
      0
    );
    const totalPoliza = parseValorMoneda(
      // (cabezotePoliza.ramo === "6"
      //   ? valoresPoliza.valor_asistencia_aviajes
      valoresPoliza.valortotal || 0
      // :) || 0
    );
    const saldo = totalPoliza - totalRecibido;
    return saldo.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const searchProspecto = async (numeroIdentificacion, calledFrom) => {
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

    setCalledFrom(calledFrom);
    console.log(calledFrom);

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
        if (calledFrom === "Tomador") {
          setDatosUsuarios((prev) => ({
            ...prev,
            Tomador: {
              ...prev.Tomador,
              tipoIdentificacion: response.data.tipoDocumento,
              numeroIdentificacion: response.data.documento,
              nombre: `${response.data.nombres} ${response.data.apellidos}`,
            },
          }));
        } else if (calledFrom === "Asegurado") {
          setDatosUsuarios((prev) => ({
            ...prev,
            Asegurado: {
              ...prev.Asegurado,
              tipoIdentificacion: response.data.tipoDocumento,
              numeroIdentificacion: response.data.documento,
              nombre: `${response.data.nombres} ${response.data.apellidos}`,
            },
          }));
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

  const INPUT_PLACA_ALLOW = [1, 7, 8, 11, 14, 15, 22, 24, 25, 26, 27, 30, 31];

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
    }));
  }, [
    datosUsuarios,
    cabezotePoliza,
    vehiculo,
    gestionComercial,
    valoresPoliza,
    valoresRecibidos,
    otrosConceptosValor,
  ]);

  // Handler para buscar póliza

  const [searchTerm, setSearchTerm] = useState({
    term: "",
    option: "1",
  });

  const handlerSearchPoliza = (id) => {
    if (searchTerm.option === "1") {
      if (id == "") {
        Swal.fire({
          icon: "warning",
          title: "Campo vacío",
          text: "Por favor ingrese el id de remision.",
        });
        return;
      }
      navigate(`/polizas/edicion?no_remision=${id}`);
    } else {
      Swal.fire({
        icon: "warning",
        title: "Campo vacío",
        text: "Por favor ingrese un término de búsqueda.",
      });
    }
  };

  const sumarDias = (fecha, dias) => {
    if (fecha == null || fecha == "") return null;
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    return nuevaFecha.toISOString().split("T")[0]; // Formato YYYY-MM-DD
  };

  const handlerSavePoliza = async () => {
    // Lógica para guardar la póliza
    const polizaData = {
      cabezotePoliza,
      vehiculo,
      gestionComercial,
      valoresPoliza,
      //valoresRecibidos,
      datosUsuarios,
      otrosConceptosValor,
      userData: { id_usuario: userData.id_usuario },
    };

    console.log(polizaData);
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
            text: `Por favor complete el campo: ${role} ${field}.`,
          });
          return;
        }
      }
    }

    // Valida los campos de la gestion comercial en condicion de la unidad de negocio seleccionada en el estado gestion comercial
    if (gestionComercial.unidadnegocio !== "") {
      let fieldsToCheck = {
        1: {
          tecnicoemisor: "Técnico Emisor",
          coordinadortecnico: "Coordinador Técnico",
          analista: "Analista",
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
      console.log(fieldsToCheck);
      for (const field of Object.keys(
        fieldsToCheck[gestionComercial.unidadnegocio]
      )) {
        // Necesito el valor de la propiedad del objeto que valida para colocarla en el mensaje
        if (!gestionComercial[field]) {
          console.log(field);
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
      // console.log("Entre aqui, forma de pago con algo y ramo difernte al 6");
      let fieldsToCheck = {
        1: {
          primaneta: "Prima Neta",
          asistenciasotros: "Asistencia & Otros",
          gastosexpedicion: "Gastos de Expedición",
          valortotal: "Valor Total",
          financiada: "Financiera",
          //nocuotas: "No. Cuotas",
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
            text: `Por favor complete el campo: ${validFields[field]}.`,
          });
          return;
        }
      }
      // } else if (valoresPoliza.formapago == "" && cabezotePoliza.ramo == "6") {
      //   console.log("Entre aqui, forma de pago vacia y ramo es 6");
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
    } else {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: `Por favor complete todos los campos obligatorios de los valores de la poliza.`,
      });
      return;
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

    const poliza = await createPoliza(polizaData);

    if (poliza.code === 439) {
      Swal.fire({
        icon: "warning",
        title: "Conflicto de datos",
        text: "Ya existe un numero de poliza para esa aseguradora, por favor verifique los datos. Operación cancelada.",
      });
    } else {
      Swal.fire({
        icon: "success",
        title: "Póliza creada",
        text: `Remision ID # ${poliza.id_remision} con número de poliza ${poliza.numeropoliza} creada exitosamente.`,
        showConfirmButton: true,
        confirmButtonText: "Ok",
        // cancelButtonText: "Cerrar",
      }).then((isConfirmed) => {
        window.location.reload();
      });
    }
  };

  const onCloseModalOneroso = () => {
    setModalOneroso(false);
    setNuevoBeneficiario({
      tipoIdentificacion: "2",
      numeroIdentificacion: "",
      razon_social: "",
      correo1: "",
      correo2: "",
      observaciones: "",
    });
  };

  return (
    <div className="flex flex-col">
      <ModalOneroso
        show={modalOneroso}
        onClose={onCloseModalOneroso}
        valores={datosUsuarios.Beneficiario}
        setBeneficiarios={setBeneficiarios}
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
        setDatosUsuarios={setDatosUsuarios}
        calledFrom={calledFrom}
      />
      <Loader isLoading={loading} />

      <section className="flex flex-row p-4 pl-6 gap-6">
        <div className="flex flex-row gap-2">
          <input
            type="text"
            className="p-2 bg-gray-200 rounded-md placeholder-black placeholder:text-center"
            placeholder="Buscar registro por:"
            value={searchTerm.term || ""}
            onChange={(e) =>
              setSearchTerm({ ...searchTerm, term: e.target.value })
            }
          />
          <button onClick={() => handlerSearchPoliza(searchTerm.term)}>
            <SearchOutlined style={{ fontSize: 27 }} />
          </button>
        </div>
        <select
          className="p-2 w-36 border-2 rounded-md"
          value={searchTerm.option}
          onChange={(e) =>
            setSearchTerm({ ...searchTerm, option: e.target.value })
          }
        >
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

      {/* Seccion 2 Datos tomador/asegurado/beneficiario */}

      <section className="w-full flex flex-row flex-wrap justify-between">
        <CardUser
          titulo="Tomador"
          placeholderNombre="Nombre del Tomador"
          searchProspecto={() =>
            searchProspecto(
              datosUsuarios.Tomador.numeroIdentificacion,
              "Tomador"
            )
          }
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
        />
        <CardUser
          titulo="Asegurado"
          placeholderNombre="Nombre del Asegurado"
          searchProspecto={() =>
            searchProspecto(
              datosUsuarios.Asegurado.numeroIdentificacion,
              "Asegurado"
            )
          }
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
          setNuevoBeneficiario={setNuevoBeneficiario}
        />
      </section>
      {/* <button onClick={seeBodySF}>Ver cuerpo de la póliza</button> */}
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
                  value={cabezotePoliza.noPoliza}
                  className="text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-2 w-[200px]"
                  onChange={handleCabezotePolizaChange}
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="noCertificado">Certificado</label>
                <input
                  id="noCertificado"
                  type="text"
                  value={cabezotePoliza.noCertificado}
                  className="text-md border-[1px] w-[65px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-2"
                  onChange={handleCabezotePolizaChange}
                />
              </div>
              <div className="flex flex-col flex-1 w-[100px]">
                <label htmlFor="aseguradora">Aseguradora</label>
                <Select
                  name="aseguradora"
                  options={insurers}
                  value={insurers.find(
                    (opt) => opt.value === cabezotePoliza.aseguradora
                  )}
                  onChange={(selectedOption, meta) => {
                    // cuando haces clear, selectedOption === null
                    const value = selectedOption ? selectedOption.value : "";
                    handleCabezotePolizaChange({
                      target: { name: meta.name, value },
                    });
                  }}
                  styles={customStyles}
                  placeholder=""
                  isClearable
                />
              </div>
              <div className="flex flex-col flex-1">
                <label htmlFor="ramo">Ramo</label>

                <Select
                  name="ramo"
                  options={ramo}
                  value={ramo.find((opt) => opt.value === cabezotePoliza.ramo)}
                  onChange={(selectedOption, meta) => {
                    const value = selectedOption ? selectedOption.value : "";
                    handleCabezotePolizaChange({
                      target: { name: meta.name, value },
                    });
                  }}
                  styles={customStyles}
                  placeholder=""
                  isClearable
                />
              </div>
              <div className="flex flex-col flex-1">
                <label htmlFor="tipoCertificado">Tipo</label>
                <Select
                  name="tipoCertificado"
                  id="tipoCertificado"
                  options={tiposPoliza}
                  value={tiposPoliza.find(
                    (opt) => opt.value === tiposPoliza.value
                  )}
                  onChange={(selectedOption, meta) => {
                    const value = selectedOption ? selectedOption.value : "";
                    handleCabezotePolizaChange({
                      target: { name: meta.name, value },
                    });
                  }}
                  styles={customStyles}
                  placeholder=""
                  isOptionDisabled={(option) =>
                    cabezotePoliza.noCertificado == 0 &&
                    (option.value === "3" || option.value === "4")
                  } // <- deshabilita "Modificación"
                  isClearable
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
                value={cabezotePoliza.fechaExpedicion}
                onChange={handleCabezotePolizaChange}
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
                value={cabezotePoliza.fechaInicioVigencia}
                onChange={handleCabezotePolizaChange}
              />
            </div>
            <div className="flex flex-col w-auto flex-1">
              <label htmlFor="fechaFinVigencia">Fecha fin de Vigencia</label>
              <input
                type="date"
                value={cabezotePoliza.fechaFinVigencia}
                id="fechaFinVigencia"
                name="fechaFinVigencia"
                className="w-full text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-2"
                onChange={handleCabezotePolizaChange}
              />
            </div>
            <div className="flex flex-col w-auto flex-1">
              <label htmlFor="fechaRegistro">Fecha de Registro</label>
              <input
                type="date"
                value={cabezotePoliza.fechaRegistro}
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
                checked={cabezotePoliza.renovable === "Si"}
                className=" text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none  rounded-md p-2"
                onChange={handleCabezotePolizaChange}
              />
              <label htmlFor="renovableSi">Si</label>
              <input
                type="radio"
                id="renovableNo"
                name="renovable"
                value="No"
                className=" text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none  rounded-md p-2"
                onChange={handleCabezotePolizaChange}
              />
              <label htmlFor="renovableNo">No</label>
            </div>
          </div>
        </GeneralBox>
      </section>

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
                  value={vehiculo.placa}
                  onInput={handleVehiculoChange}
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
                  value={vehiculo.fasecolda}
                  onInput={handleVehiculoChange}
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
                  value={vehiculo.modelo}
                  onInput={handleVehiculoChange}
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
                />
              </div>

              <div className="flex flex-col flex-1 min-w-[150px]">
                <label htmlFor="clase">Clase</label>

                <Select
                  className="w-full"
                  classNamePrefix="react-select"
                  name="clase"
                  id="clase"
                  options={clases}
                  styles={customStyles}
                  placeholder=""
                  value={
                    clases.find((opt) => opt.value === vehiculo.clase) || null
                  }
                  onChange={(option) =>
                    handleSelectVehiculoChange("clase", option)
                  }
                  isClearable
                />
              </div>

              <div className="flex flex-col flex-1 min-w-[150px]">
                <label htmlFor="clase">Marca</label>

                <Select
                  className="w-full"
                  classNamePrefix="react-select"
                  name="marca"
                  id="marca"
                  options={marcas}
                  styles={customStyles}
                  placeholder=""
                  value={
                    marcas.find((opt) => opt.value === vehiculo.marca) || null
                  }
                  onChange={(option) =>
                    handleSelectVehiculoChange("marca", option)
                  }
                  isClearable
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
                  value={vehiculo.linea}
                  onInput={handleVehiculoChange}
                />
              </div>
            </div>
          </div>
        </GeneralBox>
      </section>

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
                    (opt) => opt.value === gestionComercial.tecnicoemisor
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
                        opt.value === (gestionComercial.unidadnegocio ?? "")
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
                        (f) => f.value === gestionComercial.asesorfreelance
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
                                gestionComercial.asesorcomercialinterno
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
                          (a) => a.value === gestionComercial.analista
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
                          (a) => a.value === gestionComercial.asistente
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
                          (a) => a.value === gestionComercial.directorcomercial
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
                      options={[
                        // { value: "", label: "" },
                        { value: "133213123", label: "Carlos Perez" },
                        { value: "23213213", label: "Henry Arias" },
                      ]}
                      value={[
                        // { value: "", label: "" },
                        { value: "133213123", label: "Carlos Perez" },
                        { value: "23213213", label: "Henry Arias" },
                      ].find((a) => a.value === gestionComercial.asesor10)}
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
                          opt.value === gestionComercial.coordinadortecnico
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
                      options={[
                        { value: "12222111", label: "Armando Segura" },
                        { value: "22211122", label: "Patricia Poliza" },
                      ]}
                      value={[
                        { value: "12222111", label: "Armando Segura" },
                        { value: "22211122", label: "Patricia Poliza" },
                      ].find((a) => a.value === gestionComercial.asesorganador)}
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
                          opt.value === gestionComercial.coordinadortecnico
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
                      (opt) => opt.value === gestionComercial.coordinadortecnico
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

        {/* {cabezotePoliza.ramo !== "6" ? (
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
                        value={financieras.find(
                          (opt) => opt.value === valoresPoliza.financiada
                        )}
                        onChange={(selectedOption, meta) => {
                          handlerChargeQuotesFinanciera(
                            selectedOption.value || ""
                          );
                          const value = selectedOption
                            ? selectedOption.value
                            : "";
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
                          (opt) => opt.value === valoresPoliza.nocuotas
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
        ) : (
          <GeneralBox titulo="Valores de Póliza">
            <div className="flex flex-col gap-6 w-full">
              <div className="flex flex-row gap-4 pt-[20px] pb-[20px] flex-wrap w-auto">
                <div className="flex flex-col w-[158px]">
                  <div className="relative">
                    <input
                      type="text"
                      id="primaneta_aviajes"
                      name="primaneta_aviajes"
                      style={{ backgroundColor: "#FCFCFC" }}
                      className="peer w-[158px] border-b-[1.5px] border-gray-300 text-gray-900 placeholder-transparent focus:outline-none focus:border-lime-600 mt-2"
                      placeholder="Prima Neta"
                      value={valoresPoliza.primaneta_aviajes}
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
                      htmlFor="primaneta_aviajes"
                      className="absolute left-0 -top-4 text-gray-500 text-[15px] transition-all peer-placeholder-shown:top-[5px] peer-placeholder-shown:text-[14px] peer-placeholder-shown:text-gray-400 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-gray-600"
                    >
                      * Valor asistencia (US):
                    </label>
                  </div>
                </div>
                <div className="flex flex-col w-[158px]">
                  <div className="relative w-[158px]">
                    <input
                      type="text"
                      id="TRM_aviajes"
                      name="TRM_aviajes"
                      style={{ backgroundColor: "#FCFCFC" }}
                      className="peer w-[158px] border-b-[1.5px] border-gray-300 text-gray-900 placeholder-transparent focus:outline-none focus:border-lime-600 mt-2"
                      placeholder="TRM"
                      value={valoresPoliza.TRM_aviajes}
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
                      htmlFor="TRM_aviajes"
                      style={{ backgroundColor: "#FCFCFC" }}
                      className="absolute w-[158px] left-0 -top-4 text-gray-500 text-[15px] transition-all peer-placeholder-shown:top-[5px] peer-placeholder-shown:text-[14px] peer-placeholder-shown:text-gray-400 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-gray-600"
                    >
                      TRM:
                    </label>
                  </div>
                </div>

                <div className="flex flex-col w-[158px]">
                  <div className="relative w-[158px]">
                    <input
                      type="text"
                      name="valor_asistencia_aviajes"
                      id="valor_asistencia_aviajes"
                      style={{ backgroundColor: "#FCFCFC" }}
                      className="peer w-[158px] border-b-[1.5px] border-gray-300 text-gray-900 placeholder-transparent focus:outline-none focus:border-lime-600 mt-2"
                      placeholder="Valor Asistencia (COP):"
                      value={valoresPoliza.valor_asistencia_aviajes}
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
                      htmlFor="valor_asistencia_aviajes"
                      className="w-[158px] absolute left-0 -top-4 text-gray-500 text-[15px] transition-all peer-placeholder-shown:top-[5px] peer-placeholder-shown:text-[14px] peer-placeholder-shown:text-gray-400 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-gray-600"
                    >
                      *Valor asistencia (COP):
                    </label>
                  </div>
                </div>
                <div className="flex flex-col w-[158px]">
                  <div className="relative w-[158px]">
                    <label htmlFor="formapago">Forma de pago:</label>
                    <Select
                      name="formapago"
                      id="formapago"
                      options={[{ value: "2", label: "Contado" }]}
                      value={[{ value: "2", label: "Contado" }].find(
                        (opt) => opt.value === valoresPoliza.formapago
                      )}
                      onChange={async (selectedOption, meta) => {
                        const value = selectedOption
                          ? selectedOption.value
                          : "";
                        if (selectedOption?.value === "1") {
                          await handleChangesFinanciera();
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
                </div>
              </div>
            </div>
          </GeneralBox>
        )} */}

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
              {valoresPoliza.formapago == "1"
                ? cabezotePoliza.ramo != 6 && (
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
                          ].find(
                            (opt) => opt.value === valoresPoliza.formapago
                          )}
                          onChange={async (selectedOption, meta) => {
                            const value = selectedOption
                              ? selectedOption.value
                              : "";
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
                      <div className="flex flex-col w-1/3">
                        <label htmlFor="financiada">Financiada por:</label>
                        <Select
                          name="financiada"
                          id="financiada"
                          options={financieras}
                          value={financieras.find(
                            (opt) => opt.value === valoresPoliza.financiada
                          )}
                          onChange={(selectedOption, meta) => {
                            handlerChargeQuotesFinanciera(
                              selectedOption.value || ""
                            );
                            const value = selectedOption
                              ? selectedOption.value
                              : "";
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
                            (opt) => opt.value === valoresPoliza.nocuotas
                          )}
                          onChange={(selectedOption, meta) => {
                            handleValorTotalChange({
                              target: {
                                name: meta.name,
                                value: selectedOption
                                  ? selectedOption.value
                                  : "",
                              },
                            });
                          }}
                          styles={customStyles}
                          placeholder="Seleccione..."
                          isClearable
                        />
                      </div>
                    </>
                  )
                : ""}
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

      <section className="">
        {/* <GeneralBox
          titulo={"Registro de pago"}
          width={"w-full"}
          stateHeader={true}
          statePago={registrarPagos}
          setStatePago={handleRegistrarPago}
          textButton={["Agregar Pago", "Guardar Pago"]}
        >
          {valoresRecibidos.map((pago, index) => (
            <RegistroPago
              key={index}
              formasPago={formasPago}
              pago={pago}
              index={index}
              setValoresRecibidos={setValoresRecibidos}
              onEliminarPago={handleEliminarPago}
              registrarPagos={registrarPagos}
              otrosConceptos={otrosConceptos}
              setOtrosConceptos={setOtrosConceptos}
              otrosConceptosValor={otrosConceptosValor}
              setOtrosConceptosValor={setOtrosConceptosValor}
              certificado={cabezotePoliza.noCertificado}
            />
          ))}

          <button
            className="text-lime-9000 font-bold pl-0 hover:cursor-pointer text-left w-[180px] mt-4"
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
            />
            <label
              htmlFor="observacionesPago"
              className="w-1/2 absolute left-0 -top-4 text-gray-500 text-[15px] transition-all peer-placeholder-shown:top-[5px] peer-placeholder-shown:text-[14px] peer-placeholder-shown:text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-gray-600"
            >
              Observaciones pagos:
            </label>
          </div>
        </GeneralBox> */}
        <section className="flex flex-row gap-5 justify-end mt-10 mb-10 mr-[22px]">
          <BtnGeneral
            id={"btnVerMovimientos"}
            className={
              "bg-gray-400 text-white px-10 h-[35px] m-[2px] rounded hover:bg-lime-600 transition duration-300 ease-in-out"
            }
          >
            <span>Ver movimientos</span>
          </BtnGeneral>
          <BtnGeneral
            id={"btnCrearMovimiento"}
            className={
              "bg-gray-400 text-white px-10 h-[35px] m-[2px] rounded hover:bg-lime-600 transition duration-300 ease-in-out"
            }
          >
            <span>Crear movimiento</span>
          </BtnGeneral>
          <BtnGeneral
            id={"btnGuardarPoliza"}
            className={
              "bg-lime-9000 text-white px-10 h-[35px] m-[2px] rounded hover:bg-lime-600 transition duration-300 ease-in-out"
            }
            funct={handlerSavePoliza}
          >
            <span>Guardar</span>
          </BtnGeneral>
        </section>
      </section>
    </div>
  );
};
