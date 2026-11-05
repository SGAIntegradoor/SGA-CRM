import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaRegIdCard } from "react-icons/fa";
import { LiaMobileSolid, LiaEnvelope } from "react-icons/lia";
import { IoClose } from "react-icons/io5";
import Select from "react-select";
import Swal from "sweetalert2";
import { mapaDepartamentos } from "../../../../utils/getDepto";
import { obtenerCiudades } from "../../../../utils/getCities";
import {
  capitalizeWords,
  clienteActualizado,
  coincideDocumento,
  puedeEditarClientes,
  partirNombre,
} from "../../../../utils/utils";
import { getClientById } from "../../../../services/Clientes/getClientById";
import { getClientEdit } from "../../../../services/Clientes/getCliente";
import { getClientByIdIntegradoor } from "../../../../services/Clientes/getClientByIdIntegradoor";
import { createClient } from "../../../../services/Clientes/createCliente";
import { updateClient } from "../../../../services/Clientes/updateCliente";
import useValidateClient from "../../../../hooks/Clients/useValidateClient";
import { useSubmitGuard } from "../../../../hooks/useSubmitGuard";
import {
  Agregar,
  Badge,
  Bloque,
  BtnCancelar,
  BtnGuardar,
  Campo,
  Esqueleto,
  FilaAnimada,
  Principal,
  SeccionShell,
  inputCls,
  tituloSeccion,
} from "./SeccionShell";

const MAX_FILAS = 5;
const DEMORA_DOCUMENTO = 900;

const dirVacia = () => ({ direccion: "", departamento: "", ciudad: "" });

const toISODate = (s) => {
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m1 = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`;
  const m2 = s.match(/^(\d{4})[/.](\d{2})[/.](\d{2})$/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  return s;
};

// Las llaves de mapaDepartamentos son "5", "8"...; la BD puede traer "05"
const normDepto = (d) => {
  if (d === null || d === undefined || d === "") return "";
  const n = parseInt(d, 10);
  return Number.isNaN(n) ? String(d) : String(n);
};

// "principalCelular2" -> 1
const indicePrincipal = (valor, prefijo) => {
  const m = String(valor || "").match(new RegExp(`^${prefijo}(\\d)$`));
  return m ? Number(m[1]) - 1 : -1;
};

// Deja hasta la última fila con datos (mínimo una)
const recortar = (lista, esVacia) => {
  let n = lista.length;
  while (n > 1 && esVacia(lista[n - 1])) n--;
  return lista.slice(0, Math.max(n, 1));
};

// Quita filas vacías y recalcula la posición del principal
const compactar = (lista, principal, esVacia) => {
  const out = [];
  let p = -1;
  lista.forEach((v, i) => {
    if (esVacia(v)) return;
    if (i === principal) p = out.length;
    out.push(v);
  });
  return { out, p };
};

const completar = (lista) =>
  [...lista, ...Array(MAX_FILAS).fill("")].slice(0, MAX_FILAS);

const quitarEn = (lista, i) => lista.filter((_, idx) => idx !== i);

const principalTrasQuitar = (principal, i) =>
  principal === i ? -1 : principal > i ? principal - 1 : principal;

const celVacio = (v) => !String(v || "").trim();
const dirSinDatos = (d) => !d.direccion.trim() && !d.departamento && !d.ciudad;

export const FormCliente = ({
  seccion,
  cerrado,
  onClose,
  onCambiarModo,
  onCambiarAbierta,
  onSincronizar,
  onGuardado,
}) => {
  const { rol, modo, abierta, foco } = seccion;
  const { validateClientData } = useValidateClient();
  const { busy: guardando, guard } = useSubmitGuard();

  // consultando | nuevo | existente | error
  const [estado, setEstado] = useState("consultando");
  const [mensajeError, setMensajeError] = useState("");
  const [idCliente, setIdCliente] = useState(null);

  const [tipoDocumento, setTipoDocumento] = useState(
    String(seccion.tipoIdentificacion || "1")
  );
  const [documento, setDocumento] = useState(seccion.numeroIdentificacion);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [genero, setGenero] = useState("1");
  const [estadoCivil, setEstadoCivil] = useState("1");
  const [procedencia, setProcedencia] = useState("1");

  const [celulares, setCelulares] = useState([""]);
  const [principalCelular, setPrincipalCelular] = useState(-1);
  const [emails, setEmails] = useState([""]);
  const [principalEmail, setPrincipalEmail] = useState(-1);
  const [direcciones, setDirecciones] = useState([dirVacia()]);
  const [principalDir, setPrincipalDir] = useState(-1);
  const [ciudadesPorDepto, setCiudadesPorDepto] = useState({});

  // null | "cargado" | "sin-datos"
  const [prospecto, setProspecto] = useState(null);
  const [buscandoProspecto, setBuscandoProspecto] = useState(false);
  const [verificandoDoc, setVerificandoDoc] = useState(false);
  const [duplicado, setDuplicado] = useState(false);

  const esNuevo = estado === "nuevo";
  const puedeEditar = useMemo(puedeEditarClientes, []);
  const soloLectura =
    estado === "existente" && (modo === "ver" || cerrado || !puedeEditar);
  const bloqueado = soloLectura || estado === "consultando" || guardando;
  // Un cliente existente no cambia de identidad desde aquí
  const identidadBloqueada = bloqueado || estado === "existente";

  const optionsDeptos = useMemo(
    () =>
      Object.entries(mapaDepartamentos)
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    []
  );

  const cargarCiudades = async (depto) => {
    if (!depto) return;
    const opciones = await obtenerCiudades(depto);
    setCiudadesPorDepto((prev) =>
      prev[depto] ? prev : { ...prev, [depto]: opciones }
    );
  };

  const cargarCliente = (c) => {
    setTipoDocumento(String(c.tipoDocumento || "1"));
    setDocumento(String(c.documento || ""));
    setNombre(capitalizeWords(c.nombres || ""));
    setApellido(capitalizeWords(c.apellidos || ""));
    setRazonSocial(
      capitalizeWords(`${c.nombres || ""} ${c.apellidos || ""}`.trim())
    );
    setFechaNacimiento(toISODate(c.fechaNacimiento || ""));
    setGenero(c.genero ? String(c.genero) : "");
    setEstadoCivil(c.estadoCivil ? String(c.estadoCivil) : "");
    setProcedencia(c.procedencia ? String(c.procedencia) : "1");

    setCelulares(recortar((c.celulares || []).map((v) => v || ""), celVacio));
    setPrincipalCelular(
      indicePrincipal(c.principalCelularSeleccionado, "principalCelular")
    );
    setEmails(recortar((c.emails || []).map((v) => v || ""), celVacio));
    setPrincipalEmail(
      indicePrincipal(c.principalEmailSeleccionado, "principalEmail")
    );

    const filas = [0, 1, 2, 3, 4].map((i) => ({
      direccion: c.direcciones?.[i] || "",
      departamento: normDepto(c.departamentos?.[i]),
      ciudad: c.ciudades?.[i] ? String(c.ciudades[i]) : "",
    }));
    setDirecciones(recortar(filas, dirSinDatos));
    setPrincipalDir(indicePrincipal(c.departamentoSelected, "principal"));
    [...new Set(filas.map((f) => f.departamento).filter(Boolean))].forEach(
      cargarCiudades
    );
  };

  // --- CONSULTA INICIAL (mismo orden que searchProspecto + ModalCliente) ---
  useEffect(() => {
    let cancelado = false;

    const consultar = async () => {
      const res = await getClientById("x", seccion.numeroIdentificacion);
      if (cancelado) return;

      if (res?.status !== "Ok") {
        setMensajeError(res?.message || "No fue posible consultar el cliente.");
        setEstado("error");
        onCambiarAbierta(true);
        return;
      }

      if (
        res.data === "Cliente Nuevo" ||
        !coincideDocumento(res.data, seccion.numeroIdentificacion)
      ) {
        // Lo que ya está en la card pasa al formulario; el lector trae los
        // nombres y apellidos separados
        if (String(seccion.tipoIdentificacion) === "2") {
          setRazonSocial(capitalizeWords(seccion.nombre || ""));
        } else {
          const partes =
            seccion.nombres || seccion.apellidos
              ? seccion
              : partirNombre(seccion.nombre);
          setNombre(capitalizeWords(partes.nombres || ""));
          setApellido(capitalizeWords(partes.apellidos || ""));
        }
        setEstado("nuevo");
        // Un cliente nuevo siempre se muestra: si no, parece ya registrado
        onCambiarAbierta(true);
        return;
      }

      onSincronizar({
        tipoIdentificacion: String(res.data.tipoDocumento || ""),
        nombre: `${res.data.nombres || ""} ${res.data.apellidos || ""}`.trim(),
      });
      setIdCliente(res.data.id_cliente);

      const detalle = await getClientEdit(res.data.id_cliente, "x");
      if (cancelado) return;

      if (detalle?.status !== "Ok" || !detalle?.data) {
        setMensajeError(
          detalle?.message || "No fue posible cargar los datos del cliente."
        );
        setEstado("error");
        onCambiarAbierta(true);
        return;
      }
      cargarCliente(detalle.data);
      setEstado("existente");
    };

    consultar().catch((error) => {
      console.error("Error al consultar el cliente:", error);
      if (!cancelado) {
        setMensajeError("No fue posible consultar el cliente.");
        setEstado("error");
        onCambiarAbierta(true);
      }
    });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- DOCUMENTO DUPLICADO (cliente nuevo con documento cambiado) ---
  useEffect(() => {
    const doc = documento.trim();
    if (!esNuevo || !doc || doc === seccion.numeroIdentificacion) {
      setDuplicado(false);
      setVerificandoDoc(false);
      return;
    }

    let cancelado = false;
    setVerificandoDoc(true);
    const t = setTimeout(async () => {
      try {
        const res = await getClientById("x", doc);
        if (!cancelado) {
          setDuplicado(
            res?.status === "Ok" &&
              res.data !== "Cliente Nuevo" &&
              coincideDocumento(res.data, doc)
          );
        }
      } catch (error) {
        console.error("Error en getClientById:", error);
      } finally {
        if (!cancelado) setVerificandoDoc(false);
      }
    }, DEMORA_DOCUMENTO);

    return () => {
      cancelado = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documento, esNuevo]);

  // --- NIT + DV (igual que ModalCliente) ---
  let nitBase = "";
  let nitDV = "";
  if (tipoDocumento === "2" && documento) {
    if (documento.length <= 9) {
      nitBase = documento;
    } else {
      nitBase = documento.slice(0, -1);
      nitDV = documento.slice(-1);
    }
  }

  const handleNitBaseChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    let base = raw;
    let dv = nitDV;
    if (raw.length > 9) {
      base = raw.slice(0, -1);
      dv = raw.slice(-1);
    }
    setDocumento(base + dv);
  };

  const handleNitDVChange = (e) => {
    let dv = e.target.value.replace(/[^\d]/g, "");
    if (dv.length > 1) dv = dv.slice(-1);
    setDocumento(nitBase + dv);
  };

  const buscarProspecto = async () => {
    const doc = (tipoDocumento === "2" ? nitBase : documento).trim();
    if (!doc) return;
    setBuscandoProspecto(true);
    try {
      const res = await getClientByIdIntegradoor(doc);
      if (res?.status === "Ok" && res.data && res.data !== "Cliente Nuevo") {
        const p = res.data;
        setNombre(capitalizeWords(p.nombres || ""));
        setApellido(capitalizeWords(p.apellidos || ""));
        setRazonSocial(
          capitalizeWords(`${p.nombres || ""} ${p.apellidos || ""}`.trim())
        );
        setTipoDocumento(String(p.tipoDocumento || tipoDocumento));
        setDocumento(String(p.documento || documento));
        setFechaNacimiento(toISODate(p.fechaNacimiento || ""));
        setGenero(p.genero ? String(p.genero) : "1");
        setEstadoCivil(p.estadoCivil ? String(p.estadoCivil) : "1");
        setProspecto("cargado");
      } else {
        setProspecto("sin-datos");
      }
    } catch (error) {
      console.error("Error al buscar cliente en Integradoor:", error);
      setProspecto("sin-datos");
    } finally {
      setBuscandoProspecto(false);
    }
  };

  // --- FILAS DINÁMICAS ---
  const agregarFila = (lista, setLista, nueva) => {
    if (lista.length >= MAX_FILAS) return;
    setLista([...lista, nueva]);
  };

  const cambiarDireccion = (i, campo, valor) => {
    setDirecciones((prev) =>
      prev.map((d, idx) =>
        idx !== i
          ? d
          : campo === "departamento"
          ? { ...d, departamento: valor, ciudad: "" }
          : { ...d, [campo]: valor }
      )
    );
    if (campo === "departamento") cargarCiudades(valor);
    // La primera dirección escrita queda como principal
    if (campo === "direccion" && valor.trim()) {
      setPrincipalDir((p) => (p === -1 ? i : p));
    }
  };

  // --- GUARDAR (mismas validaciones del ModalCliente) ---
  const handleGuardar = guard(async () => {
    if (duplicado) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ya existe un cliente con este numero de identificación en la base de datos, Por favor valide los datos e intentelo nuevamente",
      });
      return;
    }

    let nombresToSend = nombre;
    let apellidosToSend = apellido;
    if (tipoDocumento === "2" && razonSocial.trim()) {
      const parts = razonSocial.trim().split(" ");
      nombresToSend = parts.shift() || "";
      apellidosToSend = parts.join(" ");
    }

    const cel = compactar(celulares, principalCelular, celVacio);
    const em = compactar(emails, principalEmail, celVacio);
    // El principal de direcciones exige dirección escrita (como el radio del modal)
    const dirPrincipal = direcciones[principalDir]?.direccion.trim()
      ? principalDir
      : -1;
    const dir = compactar(direcciones, dirPrincipal, dirSinDatos);

    const body = {
      nombres: nombresToSend,
      apellidos: apellidosToSend,
      tipoDocumento,
      documento,
      fechaNacimiento: toISODate(fechaNacimiento),
      genero,
      estadoCivil,
      procedencia,
      direcciones: completar(dir.out.map((d) => d.direccion)),
      departamentos: completar(dir.out.map((d) => d.departamento)),
      ciudades: completar(dir.out.map((d) => d.ciudad)),
      celulares: completar(cel.out),
      principalSeleccionado: dir.p >= 0 ? `principal${dir.p + 1}` : "",
      principalCelularSeleccionado:
        cel.p >= 0 ? `principalCelular${cel.p + 1}` : "",
      principalEmailSeleccionado: em.p >= 0 ? `principalEmail${em.p + 1}` : "",
      emails: completar(em.out),
    };

    const validation = validateClientData(body);
    if (!validation.isValid) {
      Swal.fire({ icon: "error", title: "Error", text: validation.error });
      return;
    }

    // La sección queda contraída y ya no se puede editar desde esta vista
    const cerrarTrasGuardar = () => {
      // La card trabaja el NIT sin dígito de verificación
      const documentoCard = tipoDocumento === "2" ? nitBase : documento;
      onSincronizar({
        tipoIdentificacion: tipoDocumento,
        numeroIdentificacion: documentoCard,
        nombre:
          tipoDocumento === "2" && razonSocial.trim()
            ? razonSocial.trim()
            : `${nombre} ${apellido}`.trim(),
      });
      setEstado("existente");
      onGuardado(documentoCard);
    };

    try {
      if (estado === "existente" && idCliente) {
        const response = await updateClient(idCliente, body, "x");
        if (clienteActualizado(response)) {
          await Swal.fire({
            icon: "success",
            title: "Éxito",
            text: "Cliente actualizado correctamente",
            confirmButtonText: "Cerrar",
          });
          cerrarTrasGuardar();
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: response?.data?.message || "Error al actualizar el cliente",
            confirmButtonText: "Cerrar",
          });
        }
        return;
      }

      const response = await createClient("x", body);
      if (response?.status === "Ok" && response?.data?.statusCode === 1) {
        await Swal.fire({
          icon: "success",
          title: "Éxito",
          text: response.message_cliente || "Cliente creado correctamente",
          confirmButtonText: "Cerrar",
        });
        cerrarTrasGuardar();
      } else if (response?.data?.statusCode == 1062) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Ya existe un cliente con este numero de identificación en la base de datos, Por favor valide los datos e intentelo nuevamente",
          confirmButtonText: "Cerrar",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response?.data?.message || "Error al crear el cliente",
          confirmButtonText: "Cerrar",
        });
      }
    } catch (error) {
      console.error("Error al crear o actualizar el cliente:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No fue posible guardar el cliente. Inténtalo nuevamente.",
      });
    }
  });

  // --- RENDER ---
  const badge =
    estado === "consultando" ? (
      <Badge key="consultando" tono="consultando">
        Consultando...
      </Badge>
    ) : estado === "nuevo" ? (
      <Badge key="nuevo" tono="nuevo">
        Nuevo cliente
      </Badge>
    ) : estado === "existente" ? (
      <Badge key="existente" tono="existente">
        Cliente registrado
      </Badge>
    ) : (
      <Badge key="error" tono="error">
        Sin consultar
      </Badge>
    );

  const footer =
    estado === "consultando" || estado === "error" ? (
      <BtnCancelar onClick={onClose}>Cerrar</BtnCancelar>
    ) : soloLectura ? (
      <>
        <BtnCancelar onClick={onClose}>Cerrar</BtnCancelar>
        {!cerrado && puedeEditar && (
          <BtnGuardar onClick={() => onCambiarModo("editar")}>Editar</BtnGuardar>
        )}
      </>
    ) : (
      <>
        <BtnCancelar onClick={onClose} disabled={guardando} />
        <BtnGuardar
          onClick={handleGuardar}
          disabled={guardando || verificandoDoc}
        >
          {guardando
            ? "Guardando..."
            : estado === "existente"
            ? "Actualizar"
            : "Guardar"}
        </BtnGuardar>
      </>
    );

  const textoBanner =
    prospecto === "cargado"
      ? "Datos cargados desde prospectos. Revísalos antes de guardar."
      : prospecto === "sin-datos"
      ? "No se encontraron los datos del prospecto, debes ingresarlos desde 0."
      : "Documento no existe en el Core";

  const esNit = tipoDocumento === "2";

  return (
    <SeccionShell
      titulo={tituloSeccion(rol, tipoDocumento, esNit ? nitBase : documento)}
      badge={badge}
      modo={soloLectura ? "ver" : "editar"}
      footer={footer}
      abierta={abierta}
      onCambiarAbierta={onCambiarAbierta}
      foco={foco}
    >
      {estado === "consultando" && <Esqueleto />}

      {estado === "error" && (
        <Bloque className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {mensajeError}
        </Bloque>
      )}

      {(estado === "nuevo" || estado === "existente") && (
        <>
          {cerrado && (
            <Bloque className="rounded-lg bg-lime-50 px-4 py-2.5 text-sm text-lime-700">
              Cliente guardado. Sus datos ya no se pueden editar desde el
              registro de pólizas.
            </Bloque>
          )}

          {esNuevo && (
            <Bloque className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#e8f0fb] px-4 py-2.5">
              <AnimatePresence mode="wait">
                <motion.p
                  key={textoBanner}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.2 }}
                  className={`text-sm ${
                    prospecto === "cargado" ? "text-lime-700" : "text-gray-500"
                  }`}
                >
                  {textoBanner}
                </motion.p>
              </AnimatePresence>
              <button
                type="button"
                onClick={buscarProspecto}
                disabled={buscandoProspecto || !documento.trim() || guardando}
                className="h-[34px] rounded-md bg-lime-9000 px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-lime-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {buscandoProspecto ? "Buscando..." : "Buscar en prospectos"}
              </button>
            </Bloque>
          )}

          <Bloque i={1} className="flex items-center gap-2">
            <FaRegIdCard size={20} className="text-gray-700" />
            <p className="text-[14px] font-semibold text-gray-800">
              Datos personales
            </p>
          </Bloque>

          <Bloque
            i={2}
            className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Campo label="Tipo de documento" htmlFor={`sp-tipo-${rol}`}>
              <select
                id={`sp-tipo-${rol}`}
                className={inputCls}
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                disabled={identidadBloqueada}
              >
                <option value="">Seleccione una opción</option>
                <option value="1">CC</option>
                <option value="2">NIT</option>
                <option value="3">CE</option>
                <option value="4">Pasaporte</option>
              </select>
            </Campo>

            <Campo label="Identificación" htmlFor={`sp-doc-${rol}`}>
              <div className="relative flex gap-2">
                {esNit ? (
                  <>
                    <input
                      id={`sp-doc-${rol}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="NIT"
                      className={inputCls}
                      value={nitBase}
                      onChange={handleNitBaseChange}
                      disabled={identidadBloqueada}
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      placeholder="DV"
                      className={`${inputCls} !w-12 text-center`}
                      value={nitDV}
                      onChange={handleNitDVChange}
                      disabled={identidadBloqueada}
                    />
                  </>
                ) : (
                  <input
                    id={`sp-doc-${rol}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={tipoDocumento === "1" ? 10 : 15}
                    className={inputCls}
                    value={documento}
                    onChange={(e) =>
                      setDocumento(e.target.value.replace(/[^\d]/g, ""))
                    }
                    disabled={identidadBloqueada}
                  />
                )}
                {verificandoDoc && (
                  <div className="absolute -right-6 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-gray-700 border-t-transparent" />
                )}
              </div>
              <AnimatePresence>
                {duplicado && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-red-500"
                  >
                    Ya existe un cliente con este documento
                  </motion.p>
                )}
              </AnimatePresence>
            </Campo>

            {esNit ? (
              <Campo
                label="Razón social"
                htmlFor={`sp-razon-${rol}`}
                className="lg:col-span-2"
              >
                <input
                  id={`sp-razon-${rol}`}
                  type="text"
                  className={inputCls}
                  value={razonSocial}
                  onChange={(e) =>
                    setRazonSocial(capitalizeWords(e.target.value))
                  }
                  disabled={bloqueado}
                />
              </Campo>
            ) : (
              <>
                <Campo label="Nombres" htmlFor={`sp-nombre-${rol}`}>
                  <input
                    id={`sp-nombre-${rol}`}
                    type="text"
                    className={inputCls}
                    value={nombre}
                    onChange={(e) => setNombre(capitalizeWords(e.target.value))}
                    disabled={bloqueado}
                  />
                </Campo>
                <Campo label="Apellidos" htmlFor={`sp-apellido-${rol}`}>
                  <input
                    id={`sp-apellido-${rol}`}
                    type="text"
                    className={inputCls}
                    value={apellido}
                    onChange={(e) =>
                      setApellido(capitalizeWords(e.target.value))
                    }
                    disabled={bloqueado}
                  />
                </Campo>
              </>
            )}

            <Campo
              label={esNit ? "Fecha de constitución" : "Fecha de nacimiento"}
              htmlFor={`sp-fecha-${rol}`}
            >
              <input
                id={`sp-fecha-${rol}`}
                type="date"
                max="9999-12-31"
                className={inputCls}
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                disabled={bloqueado}
              />
            </Campo>

            {!esNit && (
              <>
                <Campo label="Genero" htmlFor={`sp-genero-${rol}`}>
                  <select
                    id={`sp-genero-${rol}`}
                    className={inputCls}
                    value={genero}
                    onChange={(e) => setGenero(e.target.value)}
                    disabled={bloqueado}
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="1">Masculino</option>
                    <option value="2">Femenino</option>
                  </select>
                </Campo>
                <Campo label="Estado civil" htmlFor={`sp-civil-${rol}`}>
                  <select
                    id={`sp-civil-${rol}`}
                    className={inputCls}
                    value={estadoCivil}
                    onChange={(e) => setEstadoCivil(e.target.value)}
                    disabled={bloqueado}
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="1">Soltero (a)</option>
                    <option value="2">Casado (a)</option>
                    <option value="3">Viudo (a)</option>
                    <option value="4">Divorciado (a)</option>
                    <option value="5">Unión Libre</option>
                    <option value="6">Separado (a)</option>
                  </select>
                </Campo>
              </>
            )}
          </Bloque>

          <Bloque i={3} className="grid grid-cols-1 gap-x-10 gap-y-5 lg:grid-cols-2">
            <ListaContacto
              icono={<LiaMobileSolid size={24} />}
              titulo="Celular"
              agregarTexto="Agregar celular"
              valores={celulares}
              principal={principalCelular}
              soloLectura={bloqueado}
              tipoInput="tel"
              limpiar={(v) => v.replace(/[^\d]/g, "")}
              onCambiar={(i, v) => {
                setCelulares((prev) => prev.map((x, idx) => (idx === i ? v : x)));
                if (v.trim()) setPrincipalCelular((p) => (p === -1 ? i : p));
              }}
              onPrincipal={setPrincipalCelular}
              onAgregar={() => agregarFila(celulares, setCelulares, "")}
              onQuitar={(i) => {
                setCelulares((prev) => quitarEn(prev, i));
                setPrincipalCelular((p) => principalTrasQuitar(p, i));
              }}
            />
            <ListaContacto
              icono={<LiaEnvelope size={24} />}
              titulo="Correo electrónico"
              agregarTexto="Agregar correo"
              valores={emails}
              principal={principalEmail}
              soloLectura={bloqueado}
              tipoInput="email"
              onCambiar={(i, v) => {
                setEmails((prev) => prev.map((x, idx) => (idx === i ? v : x)));
                if (v.trim()) setPrincipalEmail((p) => (p === -1 ? i : p));
              }}
              onPrincipal={setPrincipalEmail}
              onAgregar={() => agregarFila(emails, setEmails, "")}
              onQuitar={(i) => {
                setEmails((prev) => quitarEn(prev, i));
                setPrincipalEmail((p) => principalTrasQuitar(p, i));
              }}
            />
          </Bloque>

          <Bloque i={4} className="flex flex-col gap-2">
            <div className="hidden grid-cols-[2fr_1.4fr_1.4fr_110px] gap-x-4 lg:grid">
              <p className="text-[13px] font-medium text-gray-800">Dirección</p>
              <p className="text-[13px] font-medium text-gray-800">
                Departamento
              </p>
              <p className="text-[13px] font-medium text-gray-800">Ciudad</p>
            </div>
            <AnimatePresence initial={false}>
              {direcciones.map((d, i) => (
                <FilaAnimada key={`dir-${i}`}>
                  <div className="grid grid-cols-1 items-center gap-x-4 gap-y-2 py-0.5 sm:grid-cols-2 lg:grid-cols-[2fr_1.4fr_1.4fr_110px]">
                    <input
                      type="text"
                      aria-label={`Dirección ${i + 1}`}
                      placeholder="Dirección"
                      className={inputCls}
                      value={d.direccion}
                      onChange={(e) =>
                        cambiarDireccion(i, "direccion", e.target.value)
                      }
                      disabled={bloqueado}
                    />
                    <SelectBuscable
                      etiqueta={`Departamento ${i + 1}`}
                      opciones={optionsDeptos}
                      valor={d.departamento}
                      onCambiar={(v) => cambiarDireccion(i, "departamento", v)}
                      disabled={bloqueado}
                    />
                    <SelectBuscable
                      etiqueta={`Ciudad ${i + 1}`}
                      opciones={ciudadesPorDepto[d.departamento] || []}
                      valor={d.ciudad}
                      onCambiar={(v) => cambiarDireccion(i, "ciudad", v)}
                      disabled={bloqueado || !d.departamento}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <Principal
                        activo={principalDir === i}
                        onClick={() => setPrincipalDir(i)}
                        disabled={bloqueado || !d.direccion.trim()}
                      />
                      {!bloqueado && direcciones.length > 1 && (
                        <BotonQuitar
                          onClick={() => {
                            setDirecciones((prev) => quitarEn(prev, i));
                            setPrincipalDir((p) => principalTrasQuitar(p, i));
                          }}
                        />
                      )}
                    </div>
                  </div>
                </FilaAnimada>
              ))}
            </AnimatePresence>
            {!bloqueado && direcciones.length < MAX_FILAS && (
              <Agregar
                onClick={() => agregarFila(direcciones, setDirecciones, dirVacia())}
              >
                Agregar dirección
              </Agregar>
            )}
          </Bloque>
        </>
      )}
    </SeccionShell>
  );
};

const estilosSelect = {
  control: (base, { isFocused, isDisabled }) => ({
    ...base,
    minHeight: 32,
    height: 32,
    fontSize: 14,
    backgroundColor: isDisabled ? "#f9fafb" : "#fff",
    borderColor: isFocused ? "#88d600" : "#9ca3af",
    boxShadow: isFocused ? "0 0 0 2px rgba(136, 214, 0, 0.2)" : "none",
  }),
  valueContainer: (base) => ({ ...base, padding: "0 8px" }),
  input: (base) => ({ ...base, margin: 0, padding: 0 }),
  indicatorSeparator: () => ({ display: "none" }),
  indicatorsContainer: (base) => ({ ...base, height: 30 }),
  dropdownIndicator: (base) => ({ ...base, padding: 4 }),
  clearIndicator: (base) => ({ ...base, padding: 4 }),
  menu: (base) => ({ ...base, fontSize: 14 }),
  menuPortal: (base) => ({ ...base, zIndex: 5100 }),
};

// Va al body porque la sección y las filas animadas recortan con overflow-hidden
const SelectBuscable = ({ etiqueta, opciones, valor, onCambiar, disabled }) => (
  <Select
    aria-label={etiqueta}
    styles={estilosSelect}
    options={opciones}
    value={opciones.find((o) => String(o.value) === String(valor)) || null}
    onChange={(opcion) => onCambiar(opcion ? String(opcion.value) : "")}
    isDisabled={disabled}
    isClearable
    placeholder="Seleccione"
    noOptionsMessage={() => "Sin resultados"}
    menuPortalTarget={document.body}
    menuPosition="fixed"
    closeMenuOnScroll
  />
);

const BotonQuitar = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title="Quitar"
    className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500"
  >
    <IoClose size={16} />
  </button>
);

const ListaContacto = ({
  icono,
  titulo,
  agregarTexto,
  valores,
  principal,
  soloLectura,
  tipoInput = "text",
  limpiar = (v) => v,
  onCambiar,
  onPrincipal,
  onAgregar,
  onQuitar,
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2 text-gray-800">
      {icono}
      <p className="text-[13px] font-medium">{titulo}</p>
    </div>
    <AnimatePresence initial={false}>
      {valores.map((v, i) => (
        <FilaAnimada key={`${titulo}-${i}`}>
          <div className="flex items-center gap-4 py-0.5">
            <input
              type={tipoInput}
              aria-label={`${titulo} ${i + 1}`}
              className={inputCls}
              value={v}
              onChange={(e) => onCambiar(i, limpiar(e.target.value))}
              disabled={soloLectura}
            />
            <Principal
              activo={principal === i}
              onClick={() => onPrincipal(i)}
              disabled={soloLectura || !String(v).trim()}
            />
            {!soloLectura && valores.length > 1 ? (
              <BotonQuitar onClick={() => onQuitar(i)} />
            ) : (
              <span className="w-6" />
            )}
          </div>
        </FilaAnimada>
      ))}
    </AnimatePresence>
    {!soloLectura && valores.length < MAX_FILAS && (
      <Agregar onClick={onAgregar}>{agregarTexto}</Agregar>
    )}
  </div>
);
