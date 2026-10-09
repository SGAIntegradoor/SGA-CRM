import { useContext, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { NavContext } from "../../../../context/NavContext";
import { getClientById } from "../../../../services/Clientes/getClientById";
import { getBeneficiarios } from "../../../../services/Polizas/getBeneficiarios";

/**
 * Columnas del formulario de corrección por cada persona de la póliza.
 * Tomador y Asegurado son clientes (clientes_crm); el Beneficiario es un
 * beneficiario oneroso (beneficiarios_onerosos), igual que en Registro.
 */
export const PERSONAS = {
  Tomador: {
    entidad: "cliente",
    tipo: "tipo_documento_tomador",
    numero: "numero_documento_tomador",
    nombre: "nombre_completo_tomador",
  },
  Asegurado: {
    entidad: "cliente",
    tipo: "tipo_documento_asegurado",
    numero: "numero_documento_asegurado",
    nombre: "nombre_completo_asegurado",
  },
  Beneficiario: {
    entidad: "beneficiario",
    tipo: "tipo_documento_beneficiario",
    numero: "numero_documento_beneficiario",
    nombre: "nombre_completo_beneficiario",
  },
};

const ROLES = Object.keys(PERSONAS);
const ESPERA_MS = 900;
const MIN_DIGITOS = 6;
const TIPO_NIT = "2";

const limpiarDoc = (v) => (v === null || v === undefined ? "" : String(v).trim());

const BENEFICIARIO_VACIO = {
  tipoIdentificacion: TIPO_NIT,
  numeroIdentificacion: "",
  razon_social: "",
  correo1: "",
  correo2: "",
  observaciones: "",
};

/**
 * Búsqueda de Tomador / Asegurado / Beneficiario por documento dentro de la
 * corrección. Al escribir un documento distinto al original espera un momento
 * (debounce), lo busca y, si existe, completa tipo de documento y nombre. Si no
 * existe ofrece crearlo con los mismos modales de Registro de Pólizas.
 *
 * Los creados aquí se devuelven en `personasCreadas` para que el backend deje
 * constancia en la bitácora cuando se guarde la corrección.
 */
export const useBusquedaPersonas = ({ valores, original, setValores, activo }) => {
  const { setSelectedClientId } = useContext(NavContext);

  const [buscando, setBuscando] = useState({});
  const [creados, setCreados] = useState([]); // [{ rol, entidad, tipo, documento, nombre }]

  // Modal de cliente (mismo de Registro / Clientes)
  const [modalCliente, setModalCliente] = useState(null); // { rol, documento }
  const [idClienteIntegradoor, setIdClienteIntegradoor] = useState(null);
  const [documentoTemp, setDocumentoTemp] = useState(null);
  const [procedenciaCliente, setProcedenciaCliente] = useState({
    procedenciaCliente: "",
    system: "",
    idCliente: "",
  });

  // Modal de beneficiario oneroso
  const [modalBeneficiario, setModalBeneficiario] = useState(false);
  const [nuevoBeneficiario, setNuevoBeneficiario] = useState(BENEFICIARIO_VACIO);

  const valoresRef = useRef(valores);
  valoresRef.current = valores;
  const ultimoVisto = useRef({});
  const timers = useRef({});
  const beneficiariosCache = useRef(null);

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const docActual = (rol) => limpiarDoc(valoresRef.current?.[PERSONAS[rol].numero]);

  const completar = (rol, tipo, nombre) => {
    const cfg = PERSONAS[rol];
    setValores((prev) => ({
      ...prev,
      [cfg.tipo]: tipo !== undefined && tipo !== null && tipo !== "" ? String(tipo) : prev[cfg.tipo],
      [cfg.nombre]: nombre ?? prev[cfg.nombre],
    }));
  };

  const buscarCliente = async (documento) => {
    const res = await getClientById("x", documento);
    if (res?.status !== "Ok") throw new Error(res?.message || "No se pudo consultar el cliente");
    if (!res.data || res.data === "Cliente Nuevo" || typeof res.data !== "object") return null;
    return {
      tipo: res.data.tipoDocumento,
      nombre: `${res.data.nombres ?? ""} ${res.data.apellidos ?? ""}`.trim(),
    };
  };

  const buscarBeneficiario = async (documento) => {
    if (beneficiariosCache.current === null) {
      const res = await getBeneficiarios();
      if (!Array.isArray(res?.data)) throw new Error("No se pudo consultar los beneficiarios");
      beneficiariosCache.current = res.data;
    }
    const ben = beneficiariosCache.current.find(
      (b) => limpiarDoc(b.nit_beneficiario) === documento
    );
    return ben ? { tipo: TIPO_NIT, nombre: ben.razon_social_beneficiario ?? "" } : null;
  };

  const ofrecerCrear = async (rol, documento) => {
    const esCliente = PERSONAS[rol].entidad === "cliente";
    const r = await Swal.fire({
      icon: "info",
      title: esCliente ? "Cliente no encontrado" : "Beneficiario no encontrado",
      text: esCliente
        ? `El cliente con documento ${documento} no se encuentra en la base de datos. ¿Deseas crearlo y asignarlo como ${rol}?`
        : `El beneficiario oneroso con NIT ${documento} no se encuentra en la base de datos. ¿Deseas crearlo?`,
      showCancelButton: true,
      confirmButtonText: "Sí, crearlo",
      cancelButtonText: "No",
      confirmButtonColor: "#88d600",
    });
    if (!r.isConfirmed || docActual(rol) !== documento) return;

    if (esCliente) {
      setSelectedClientId?.(null);
      setIdClienteIntegradoor("Cliente Nuevo");
      setDocumentoTemp(documento);
      setModalCliente({ rol, documento });
    } else {
      setNuevoBeneficiario({ ...BENEFICIARIO_VACIO, numeroIdentificacion: documento });
      setModalBeneficiario(true);
    }
  };

  const buscar = async (rol, documento) => {
    try {
      const encontrado =
        PERSONAS[rol].entidad === "cliente"
          ? await buscarCliente(documento)
          : await buscarBeneficiario(documento);

      // El usuario siguió escribiendo: esta respuesta ya no aplica
      if (docActual(rol) !== documento) return;

      if (encontrado) {
        completar(rol, encontrado.tipo, encontrado.nombre);
      } else {
        setBuscando((prev) => ({ ...prev, [rol]: false }));
        await ofrecerCrear(rol, documento);
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "No se pudo buscar", text: error.message });
    } finally {
      setBuscando((prev) => ({ ...prev, [rol]: false }));
    }
  };

  // Debounce por persona: cada documento tiene su propio temporizador
  const docsKey = ROLES.map((rol) => limpiarDoc(valores?.[PERSONAS[rol].numero])).join("|");
  useEffect(() => {
    if (!activo || !valores || !original) return;

    ROLES.forEach((rol) => {
      const cfg = PERSONAS[rol];
      const doc = limpiarDoc(valores[cfg.numero]);
      if (doc === ultimoVisto.current[rol]) return;
      ultimoVisto.current[rol] = doc;

      clearTimeout(timers.current[rol]);
      const esOriginal = doc === limpiarDoc(original[cfg.numero]);
      if (!doc || esOriginal || doc.length < MIN_DIGITOS) {
        setBuscando((prev) => ({ ...prev, [rol]: false }));
        return;
      }

      setBuscando((prev) => ({ ...prev, [rol]: true }));
      timers.current[rol] = setTimeout(() => buscar(rol, doc), ESPERA_MS);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docsKey, activo, original]);

  /** Persona creada desde los modales: completa el formulario y la anota. */
  const registrarCreado = (rol, tipo, documento, nombre) => {
    const cfg = PERSONAS[rol];
    const doc = limpiarDoc(documento);
    ultimoVisto.current[rol] = doc; // no volver a buscar lo que se acaba de crear
    setValores((prev) => ({
      ...prev,
      [cfg.tipo]: String(tipo ?? prev[cfg.tipo] ?? ""),
      [cfg.numero]: doc,
      [cfg.nombre]: nombre ?? "",
    }));
    setCreados((prev) => [
      ...prev.filter((c) => c.rol !== rol),
      { rol, entidad: cfg.entidad, tipo: String(tipo ?? ""), documento: doc, nombre: nombre ?? "" },
    ]);
  };

  // ModalCliente actualiza "datosUsuarios" de Registro: se adapta a este formulario
  const setDatosUsuariosDesdeModal = (updater) => {
    const rol = modalCliente?.rol;
    if (!rol) return;
    const vacio = { Tomador: {}, Asegurado: {}, Beneficiario: {} };
    const next = typeof updater === "function" ? updater(vacio) : updater;
    const d = next?.[rol];
    if (d?.numeroIdentificacion) {
      registrarCreado(rol, d.tipoIdentificacion, d.numeroIdentificacion, d.nombre);
    }
  };

  // Lo que escribe el usuario en el modal de beneficiario se refleja en el formulario
  const onChangeBeneficiarioModal = (campo, valor) => {
    const cfg = PERSONAS.Beneficiario;
    if (campo === "numeroIdentificacion") {
      ultimoVisto.current.Beneficiario = limpiarDoc(valor);
      setValores((prev) => ({ ...prev, [cfg.numero]: valor }));
    } else if (campo === "nombre") {
      setValores((prev) => ({ ...prev, [cfg.nombre]: valor }));
    }
  };

  const onBeneficiarioCreado = (ben) => {
    beneficiariosCache.current = null; // la próxima búsqueda ya lo encuentra
    registrarCreado("Beneficiario", TIPO_NIT, ben.numeroIdentificacion, ben.razon_social);
  };

  /** Solo las personas creadas que siguen asignadas en el formulario. */
  const personasCreadas = (cambios) =>
    creados.filter(
      (c) =>
        cambios.includes(PERSONAS[c.rol].numero) &&
        limpiarDoc(valores?.[PERSONAS[c.rol].numero]) === c.documento
    );

  const reiniciar = () => {
    Object.values(timers.current).forEach(clearTimeout);
    timers.current = {};
    ultimoVisto.current = {};
    setBuscando({});
    setCreados([]);
    setModalCliente(null);
    setModalBeneficiario(false);
  };

  return {
    buscando,
    creados,
    personasCreadas,
    reiniciar,
    estaBuscando: (campo) =>
      ROLES.some((rol) => PERSONAS[rol].numero === campo && buscando[rol]),
    modalCliente: {
      show: modalCliente !== null,
      onClose: () => setModalCliente(null),
      searchMethod: modalCliente?.rol,
      documentoInicial: modalCliente?.documento ?? null,
      idClienteIntegradoor,
      setIdClienteIntegradoor,
      documentoTemp,
      setDocumentoTemp,
      procedenciaCliente,
      setProcedenciaCliente,
      setDatosUsuarios: setDatosUsuariosDesdeModal,
    },
    modalBeneficiario: {
      show: modalBeneficiario,
      onClose: () => {
        setModalBeneficiario(false);
        setNuevoBeneficiario(BENEFICIARIO_VACIO);
      },
      onChange: onChangeBeneficiarioModal,
      setBeneficiarios: () => {},
      nuevoBeneficiario,
      setNuevoBeneficiario,
      onCreated: onBeneficiarioCreado,
    },
  };
};
