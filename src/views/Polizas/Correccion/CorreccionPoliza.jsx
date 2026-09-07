/* eslint-disable react/prop-types */
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useTheme,
} from "@mui/material";
import Swal from "sweetalert2";
import {
  MdLockOutline,
  MdOutlineArrowBack,
  MdSave,
  MdWarningAmber,
} from "react-icons/md";
import { HeaderPage } from "../../../components/HeaderPage/HeaderPage";
import { NavContext } from "../../../context/NavContext";
import { useAuth } from "../../../context/AuthContext";
import { tokens } from "../../../theme";
import { obtenerAseguradoras, obtenerRamo } from "../../../utils/aseguradoras";
import { getFasecoldaBrands, getFasecoldaClass } from "../../../utils/utils";
import { retrivePolizaById } from "../../../services/Polizas/retrivePolizaById";
import { correctPoliza } from "../../../services/Polizas/correctPoliza";
import { buscarPolizasCorreccion } from "../../../services/Polizas/Query/buscarPolizasCorreccion";
import { getBitacoraPoliza } from "../../../services/Polizas/getBitacoraPoliza";
import { BuscadorPoliza } from "./components/BuscadorPoliza";
import { CampoCorregible } from "./components/CampoCorregible";
import { HistorialBitacora } from "./components/HistorialBitacora";

const PERMISO_REQUERIDO = "registro_poliza";

const TIPOS_DOCUMENTO = [
  { value: "1", label: "C.C" },
  { value: "2", label: "NIT" },
  { value: "3", label: "C.E" },
  { value: "4", label: "Pasaporte" },
];

const AVISO_POLIZA = "Afecta la póliza completa y sus liquidaciones.";
const AVISO_VIGENCIA = "Recalcula vigencias ya liquidadas o conciliadas.";

const AVISO_VALOR = "Recalcula el valor total del certificado.";

const soloFecha = (v) => (v ? String(v).slice(0, 10) : "");
const norm = (v) => (v === null || v === undefined ? "" : String(v));

/** Columnas de valores del anexo: solo editables si el certificado no tiene pagos. */
const CAMPOS_VALORES = [
  "prima_neta_poliza",
  "asistencias_otros_poliza",
  "gastos_expedicion_poliza",
  "iva_poliza",
];

/** En el estado se guardan dígitos pelados; el formato COP es solo de lectura. */
const soloDigitos = (v) => norm(v).replace(/[^\d]/g, "");
const aEntero = (v) => {
  const n = parseInt(soloDigitos(v), 10);
  return Number.isNaN(n) ? 0 : n;
};
const formatoCOP = (v) =>
  aEntero(v).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

/** Aplana la respuesta de /Policy/retrievePolizaById al nombre real de columna. */
const aplanarPoliza = (data) => {
  const cab = data?.cabezotePoliza ?? {};
  const veh = data?.vehiculo ?? {};
  const val = data?.valoresPoliza ?? {};
  const tom = data?.datosUsuarios?.Tomador ?? {};
  const ase = data?.datosUsuarios?.Asegurado ?? {};
  const ben = data?.datosUsuarios?.Beneficiario ?? {};

  return {
    prima_neta_poliza: soloDigitos(val.primaneta),
    asistencias_otros_poliza: soloDigitos(val.asistenciasotros),
    gastos_expedicion_poliza: soloDigitos(val.gastosexpedicion),
    iva_poliza: soloDigitos(val.iva),

    no_poliza: norm(cab.noPoliza),
    aseguradora_poliza: norm(cab.aseguradora),
    ramo_poliza: norm(cab.ramo),
    fecha_exp_poliza: soloFecha(cab.fechaExpedicion),
    fecha_inicio_vig_poliza: soloFecha(cab.fechaInicioVigencia),
    fecha_fin_vig_poliza: soloFecha(cab.fechaFinVigencia),

    tipo_documento_tomador: norm(tom.tipoIdentificacion),
    numero_documento_tomador: norm(tom.numeroIdentificacion),
    nombre_completo_tomador: norm(tom.nombre),

    tipo_documento_asegurado: norm(ase.tipoIdentificacion),
    numero_documento_asegurado: norm(ase.numeroIdentificacion),
    nombre_completo_asegurado: norm(ase.nombre),

    tipo_documento_beneficiario: norm(ben.tipoIdentificacion),
    numero_documento_beneficiario: norm(ben.numeroIdentificacion),
    nombre_completo_beneficiario: norm(ben.nombre),

    placa_veh_poliza: norm(veh.placa),
    marca_veh_poliza: norm(veh.marca),
    linea_veh_poliza: norm(veh.linea),
    modelo_veh_poliza: norm(veh.modelo),
    clase_veh_poliza: norm(veh.clase),
    cod_fas_veh_poliza: norm(veh.fasecolda),
    val_fas_veh_poliza: norm(veh.valorFasecolda),
  };
};

export const CorreccionPoliza = ({ setLoading }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isDark = theme.palette.mode === "dark";
  const { moving } = useContext(NavContext);
  const { hasPermission, loggedData } = useAuth();

  const autorizado = hasPermission(PERMISO_REQUERIDO);
  const userData = loggedData() ?? {};

  const [seleccion, setSeleccion] = useState(null); // fila del buscador
  const [original, setOriginal] = useState(null);
  const [valores, setValores] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [aplicarTodos, setAplicarTodos] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [bitacora, setBitacora] = useState([]);

  // Contexto del certificado que se está viendo. Los valores solo se pueden
  // corregir si ESTE certificado no tiene pagos registrados.
  const [certificado, setCertificado] = useState(null);
  const [pagosAnexo, setPagosAnexo] = useState([]);
  const [valorTotalOriginal, setValorTotalOriginal] = useState(0);

  const [aseguradoras, setAseguradoras] = useState([]);
  const [ramos, setRamos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [clases, setClases] = useState([]);

  // Entrada por URL, igual que /polizas/edicion?no_remision=…
  const [searchParams, setSearchParams] = useSearchParams();
  const remisionURL =
    searchParams.get("no_remision") ?? searchParams.get("id_remision") ?? "";
  const idPolizaURL = searchParams.get("id_poliza") ?? "";
  const idAnexoURL = searchParams.get("id_anexo") ?? "";
  const yaCargoDesdeURL = useRef(false);
  const [resultadosURL, setResultadosURL] = useState(null);

  useEffect(() => {
    moving("Corrección de Póliza");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!autorizado) return;
    (async () => {
      const [asegs, rams, marc, clas] = await Promise.all([
        obtenerAseguradoras(),
        obtenerRamo(),
        getFasecoldaBrands(),
        getFasecoldaClass(),
      ]);
      setAseguradoras(asegs.map((a) => ({ value: norm(a.value), label: a.label })));
      setRamos(rams.map((r) => ({ value: norm(r.value), label: r.label })));
      setMarcas(marc);
      setClases(clas);
    })();
  }, [autorizado]);

  const cambios = useMemo(() => {
    if (!original || !valores) return [];
    return Object.keys(original).filter(
      (k) => norm(original[k]) !== norm(valores[k])
    );
  }, [original, valores]);

  // Con pagos registrados en este certificado la liquidación queda congelada:
  // tocarla descuadraría conciliaciones y comisiones ya calculadas.
  const anexoConPagos = pagosAnexo.length > 0;
  const puedeEditarValores = !anexoConPagos;

  const totalPagado = useMemo(
    () => pagosAnexo.reduce((acc, p) => acc + aEntero(p.valor), 0),
    [pagosAnexo]
  );

  // El backend recalcula el total con esta misma suma; aquí solo se previsualiza.
  const valorTotalCalculado = useMemo(() => {
    if (!valores) return 0;
    return CAMPOS_VALORES.reduce((acc, c) => acc + aEntero(valores[c]), 0);
  }, [valores]);

  const totalCambio = valorTotalCalculado !== valorTotalOriginal;

  // Suma de los componentes tal como están guardados hoy. En ~5% de los anexos
  // no coincide con valor_total_poliza (se digitó a mano al registrar). Si es el
  // caso hay que avisarlo: al guardar, el total se cuadra contra la suma.
  const sumaOriginal = useMemo(() => {
    if (!original) return 0;
    return CAMPOS_VALORES.reduce((acc, c) => acc + aEntero(original[c]), 0);
  }, [original]);

  const totalDescuadrado = !!original && sumaOriginal !== valorTotalOriginal;

  const cargarPoliza = async (fila, sincronizarURL = true) => {
    setLoading?.(true);
    const respuesta = await retrivePolizaById(
      fila.id_poliza,
      fila.id_anexo_poliza
    );

    if (respuesta?.status !== "Ok" || !respuesta?.data) {
      setLoading?.(false);
      Swal.fire({
        icon: "error",
        title: "No se pudo cargar la póliza",
        text: respuesta?.message ?? "Intenta nuevamente.",
      });
      return;
    }

    const plano = aplanarPoliza(respuesta.data);

    // pagos_polizas se liga al anexo por no_certificado_poliza, no por id_anexo.
    // Solo cuentan los pagos del certificado que se está viendo.
    const noCert = respuesta.data?.cabezotePoliza?.noCertificado ?? null;
    const recibidos = respuesta.data?.valoresRecibidos ?? [];
    const delAnexo =
      noCert === null
        ? recibidos
        : recibidos.filter((p) => Number(p.certificado) === Number(noCert));

    setSeleccion(fila);
    setCertificado(noCert);
    setPagosAnexo(delAnexo);
    setValorTotalOriginal(aEntero(respuesta.data?.valoresPoliza?.valortotal));
    setOriginal(plano);
    setValores({ ...plano });
    setMotivo("");
    setAplicarTodos(true);
    setBitacora(await getBitacoraPoliza(fila.id_poliza));

    // La URL queda compartible / recargable, como en el detalle de negocios
    if (sincronizarURL) {
      const params = { id_poliza: String(fila.id_poliza) };
      if (fila.id_anexo_poliza) params.id_anexo = String(fila.id_anexo_poliza);
      setSearchParams(params, { replace: true });
    }

    setLoading?.(false);
  };

  // Deep link: ?id_poliza=&id_anexo= carga directo el formulario
  useEffect(() => {
    if (!autorizado || yaCargoDesdeURL.current || !idPolizaURL) return;
    yaCargoDesdeURL.current = true;
    cargarPoliza(
      {
        id_poliza: idPolizaURL,
        id_anexo_poliza: idAnexoURL || null,
        no_certificado: null,
      },
      false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autorizado, idPolizaURL, idAnexoURL]);

  // Deep link: ?no_remision= — resuelve la remisión y, si es una sola, entra derecho
  useEffect(() => {
    if (!autorizado || yaCargoDesdeURL.current || idPolizaURL || !remisionURL)
      return;
    yaCargoDesdeURL.current = true;

    (async () => {
      setLoading?.(true);
      const filas = await buscarPolizasCorreccion({
        criterio: "id_remision",
        termino: remisionURL,
      });
      setLoading?.(false);

      if (filas.length === 0) {
        setResultadosURL([]);
        Swal.fire({
          icon: "error",
          title: "Remisión no encontrada",
          text: `No hay pólizas asociadas a la remisión ${remisionURL}.`,
        });
        return;
      }

      if (filas.length === 1) {
        cargarPoliza(filas[0]);
        return;
      }

      // Varios certificados en la misma remisión: que el usuario elija cuál corrige
      setResultadosURL(filas);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autorizado, remisionURL, idPolizaURL]);

  const onChange = (campo, valor) =>
    setValores((prev) => ({
      ...prev,
      [campo]: CAMPOS_VALORES.includes(campo) ? soloDigitos(valor) : valor,
    }));

  const onRevert = (campo) =>
    setValores((prev) => ({ ...prev, [campo]: original[campo] }));

  const volver = () => {
    if (cambios.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Hay cambios sin guardar",
        text: "Si vuelves al buscador se perderán las correcciones pendientes.",
        showCancelButton: true,
        confirmButtonText: "Descartar y volver",
        cancelButtonText: "Seguir editando",
        confirmButtonColor: "#d33",
      }).then((r) => {
        if (r.isConfirmed) limpiar();
      });
      return;
    }
    limpiar();
  };

  const limpiar = () => {
    setSeleccion(null);
    setCertificado(null);
    setPagosAnexo([]);
    setValorTotalOriginal(0);
    setOriginal(null);
    setValores(null);
    setMotivo("");
    setBitacora([]);
    setResultadosURL(null);
    yaCargoDesdeURL.current = true; // no volver a resolver la URL al soltar el form
    setSearchParams({}, { replace: true });
  };

  const abrirConfirmacion = () => {
    if (cambios.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin cambios",
        text: "No has modificado ningún campo.",
      });
      return;
    }
    if (motivo.trim().length < 10) {
      Swal.fire({
        icon: "warning",
        title: "Motivo obligatorio",
        text: "Describe el motivo de la corrección (mínimo 10 caracteres).",
      });
      return;
    }
    setConfirmando(true);
  };

  const guardar = async () => {
    setGuardando(true);
    setLoading?.(true);

    const campos = {};
    cambios.forEach((c) => {
      campos[c] = valores[c];
    });

    const respuesta = await correctPoliza({
      id_poliza: seleccion.id_poliza,
      id_anexo_poliza: seleccion.id_anexo_poliza,
      aplicar_todos_anexos: aplicarTodos,
      motivo: motivo.trim(),
      campos,
      userData: { id_usuario: userData?.id_usuario },
    });

    setGuardando(false);
    setLoading?.(false);
    setConfirmando(false);

    if (respuesta?.status !== "Ok") {
      Swal.fire({
        icon: "error",
        title: "No se aplicó la corrección",
        text: respuesta?.message ?? "Revisa los datos e intenta nuevamente.",
      });
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Corrección aplicada",
      text: `${respuesta?.cambios?.length ?? cambios.length} campo(s) actualizados y registrados en la bitácora.`,
      confirmButtonColor: "#88d600",
    });

    await cargarPoliza(seleccion);
  };

  /* ── Secciones del formulario ─────────────────────────────────────────── */
  const secciones = [
    {
      titulo: "Identificación de la póliza",
      descripcion: "Datos maestros. Aplican a la póliza completa.",
      campos: [
        {
          name: "no_poliza",
          label: "Número de póliza",
          warning: AVISO_POLIZA,
        },
        {
          name: "aseguradora_poliza",
          label: "Aseguradora",
          options: aseguradoras,
          warning: AVISO_POLIZA,
        },
        { name: "ramo_poliza", label: "Ramo", options: ramos },
      ],
    },
    {
      titulo: "Vigencias",
      descripcion: "Fechas de expedición y vigencia del certificado.",
      campos: [
        { name: "fecha_exp_poliza", label: "Fecha de expedición", type: "date" },
        {
          name: "fecha_inicio_vig_poliza",
          label: "Inicio de vigencia",
          type: "date",
          warning: AVISO_VIGENCIA,
        },
        {
          name: "fecha_fin_vig_poliza",
          label: "Fin de vigencia",
          type: "date",
          warning: AVISO_VIGENCIA,
        },
      ],
    },
    // Valores: solo aparece si el certificado que se está viendo no tiene pagos.
    ...(puedeEditarValores
      ? [
          {
            titulo: "Valores de la póliza",
            descripcion:
              "Liquidación de este certificado. El valor total se recalcula solo.",
            soloEsteAnexo: true,
            campos: [
              {
                name: "prima_neta_poliza",
                label: "Prima neta",
                hint: formatoCOP(valores?.prima_neta_poliza),
                warning: AVISO_VALOR,
              },
              {
                name: "asistencias_otros_poliza",
                label: "Asistencias y otros",
                hint: formatoCOP(valores?.asistencias_otros_poliza),
                warning: AVISO_VALOR,
              },
              {
                name: "gastos_expedicion_poliza",
                label: "Gastos de expedición",
                hint: formatoCOP(valores?.gastos_expedicion_poliza),
                warning: AVISO_VALOR,
              },
              {
                name: "iva_poliza",
                label: "IVA",
                hint: formatoCOP(valores?.iva_poliza),
                warning: AVISO_VALOR,
              },
            ],
          },
        ]
      : []),
    {
      titulo: "Tomador",
      campos: [
        {
          name: "tipo_documento_tomador",
          label: "Tipo de documento",
          options: TIPOS_DOCUMENTO,
        },
        { name: "numero_documento_tomador", label: "Número de documento" },
        { name: "nombre_completo_tomador", label: "Nombre completo" },
      ],
    },
    {
      titulo: "Asegurado",
      campos: [
        {
          name: "tipo_documento_asegurado",
          label: "Tipo de documento",
          options: TIPOS_DOCUMENTO,
        },
        { name: "numero_documento_asegurado", label: "Número de documento" },
        { name: "nombre_completo_asegurado", label: "Nombre completo" },
      ],
    },
    {
      titulo: "Beneficiario",
      campos: [
        {
          name: "tipo_documento_beneficiario",
          label: "Tipo de documento",
          options: TIPOS_DOCUMENTO,
        },
        { name: "numero_documento_beneficiario", label: "Número de documento" },
        { name: "nombre_completo_beneficiario", label: "Nombre completo" },
      ],
    },
    {
      titulo: "Vehículo",
      descripcion: "Aplica a todos los certificados de la póliza.",
      campos: [
        {
          name: "placa_veh_poliza",
          label: "Placa",
          uppercase: true,
          maxLength: 7,
          warning: AVISO_POLIZA,
        },
        { name: "marca_veh_poliza", label: "Marca", options: marcas },
        { name: "linea_veh_poliza", label: "Línea" },
        { name: "modelo_veh_poliza", label: "Modelo" },
        { name: "clase_veh_poliza", label: "Clase", options: clases },
        { name: "cod_fas_veh_poliza", label: "Código Fasecolda" },
        { name: "val_fas_veh_poliza", label: "Valor Fasecolda" },
      ],
    },
  ];

  const etiquetaCampo = (name) => {
    for (const s of secciones) {
      const c = s.campos.find((x) => x.name === name);
      if (c) return c.label;
    }
    return name;
  };

  const valorLegible = (name, valor) => {
    if (CAMPOS_VALORES.includes(name)) return formatoCOP(valor);
    for (const s of secciones) {
      const c = s.campos.find((x) => x.name === name);
      if (c?.options) {
        const found = c.options.find((o) => norm(o.value) === norm(valor));
        return found ? found.label : norm(valor) || "(vacío)";
      }
    }
    return norm(valor) || "(vacío)";
  };

  const cardStyle = {
    backgroundColor: isDark ? colors.primary[400] : "#ffffff",
    border: `1px solid ${colors.gray[isDark ? 600 : 800]}`,
  };

  /* ── Sin permiso ──────────────────────────────────────────────────────── */
  if (!autorizado) {
    return (
      <Box>
        <HeaderPage title="Corrección de Póliza" />
        <div className="px-6 pb-6">
          <div
            className="rounded-xl p-8 flex flex-col items-center gap-3 text-center"
            style={cardStyle}
          >
            <MdLockOutline size={38} style={{ color: colors.redAccent[500] }} />
            <h3 className="text-lg font-semibold" style={{ color: colors.gray[100] }}>
              No tienes permiso para corregir pólizas
            </h3>
            <p className="text-sm" style={{ color: colors.gray[isDark ? 400 : 500] }}>
              Este módulo requiere el permiso <strong>{PERMISO_REQUERIDO}</strong>.
              Solicítalo al administrador del CRM.
            </p>
          </div>
        </div>
      </Box>
    );
  }

  /* ── Vista ────────────────────────────────────────────────────────────── */
  return (
    <Box>
      <HeaderPage title="Corrección de Póliza" />

      <div className="w-full px-6 pb-10 flex flex-col gap-5">
        {!seleccion && (
          <>
            {/* <div
              className="rounded-xl px-5 py-4 text-sm"
              style={{
                backgroundColor: isDark ? colors.primary[500] : "#f7fbef",
                border: `1px solid ${isDark ? colors.gray[600] : "#d7ecb0"}`,
                color: colors.gray[isDark ? 300 : 700],
              }}
            >
              Módulo para corregir campos primarios que el registro de póliza no
              permite editar. Toda corrección queda registrada en la bitácora con
              el usuario, el valor anterior y el motivo.
            </div> */}
            <BuscadorPoliza
              onSeleccionar={cargarPoliza}
              setLoading={setLoading}
              criterioInicial={remisionURL ? "id_remision" : "no_poliza"}
              valorInicial={remisionURL}
              resultadosIniciales={resultadosURL}
            />
          </>
        )}

        {seleccion && valores && (
          <>
            {/* Barra de contexto */}
            <div
              className="rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-3"
              style={cardStyle}
            >
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={volver}
                  className="flex items-center gap-1 text-sm"
                  style={{ color: colors.gray[isDark ? 300 : 600] }}
                >
                  <MdOutlineArrowBack size={18} /> Buscador
                </button>
                <div className="flex flex-col">
                  <span
                    className="text-base font-semibold"
                    style={{ color: colors.gray[100] }}
                  >
                    Póliza {original.no_poliza}
                    <span
                      className="ml-2 text-xs font-normal"
                      style={{ color: colors.gray[isDark ? 400 : 500] }}
                    >
                      cert. {seleccion.no_certificado ?? 0} · id {seleccion.id_poliza}
                    </span>
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: colors.gray[isDark ? 400 : 500] }}
                  >
                    {seleccion.nombre_aseguradora ?? ""}
                    {seleccion.nombre_ramo ? ` · ${seleccion.nombre_ramo}` : ""}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className="text-xs px-3 py-1 rounded-full font-semibold"
                  style={{
                    color:
                      cambios.length > 0
                        ? colors.blueAccent[300]
                        : colors.gray[isDark ? 400 : 500],
                    border: `1px solid ${
                      cambios.length > 0
                        ? colors.blueAccent[400]
                        : colors.gray[isDark ? 600 : 800]
                    }`,
                  }}
                >
                  {cambios.length} cambio(s) pendientes
                </span>
                <button
                  type="button"
                  onClick={abrirConfirmacion}
                  disabled={cambios.length === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold"
                  style={{
                    backgroundColor: cambios.length === 0 ? colors.gray[500] : "#88d600",
                    color: "#1d1d1d",
                    opacity: cambios.length === 0 ? 0.6 : 1,
                  }}
                >
                  <MdSave size={16} /> Guardar corrección
                </button>
              </div>
            </div>

            {/* Secciones del formulario */}
            {secciones.map((s) => (
              <div key={s.titulo} className="rounded-xl p-5" style={cardStyle}>
                <div className="mb-4">
                  <h3
                    className="text-sm font-semibold uppercase tracking-wide"
                    style={{ color: colors.gray[isDark ? 300 : 600] }}
                  >
                    {s.titulo}
                  </h3>
                  {s.descripcion && (
                    <p
                      className="text-[0.75rem] mt-1"
                      style={{ color: colors.gray[isDark ? 400 : 500] }}
                    >
                      {s.descripcion}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-4">
                  {s.campos.map((c) => (
                    <CampoCorregible
                      key={c.name}
                      label={c.label}
                      name={c.name}
                      type={c.type}
                      options={c.options}
                      uppercase={c.uppercase}
                      maxLength={c.maxLength}
                      warning={c.warning}
                      hint={c.hint}
                      value={valores[c.name]}
                      original={original[c.name]}
                      onChange={onChange}
                      onRevert={onRevert}
                    />
                  ))}
                </div>

                {/* El total guardado no cuadra con sus componentes: avisar antes de tocar nada */}
                {s.soloEsteAnexo && totalDescuadrado && (
                  <div
                    className="mt-4 rounded-lg px-4 py-3 flex items-start gap-2"
                    style={{
                      backgroundColor: isDark ? "#2e2716" : "#fdf3df",
                      border: `1px solid ${colors.redAccent[isDark ? 400 : 300]}`,
                    }}
                  >
                    <MdWarningAmber
                      size={18}
                      style={{
                        color: colors.redAccent[isDark ? 300 : 500],
                        marginTop: 1,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      className="text-[0.78rem]"
                      style={{ color: colors.gray[100] }}
                    >
                      El valor total guardado ({formatoCOP(valorTotalOriginal)}) no
                      coincide con la suma de sus componentes (
                      {formatoCOP(sumaOriginal)}), una diferencia de{" "}
                      <strong>
                        {formatoCOP(Math.abs(valorTotalOriginal - sumaOriginal))}
                      </strong>{" "}
                      que ya venía de antes. Si guardas una corrección de valores, el
                      total quedará cuadrado contra la suma.
                    </span>
                  </div>
                )}

                {/* Total recalculado: espejo de lo que hace el backend al guardar */}
                {s.soloEsteAnexo && (
                  <div
                    className="mt-4 pt-4 flex flex-wrap items-center justify-between gap-3"
                    style={{
                      borderTop: `1px solid ${colors.gray[isDark ? 600 : 800]}`,
                    }}
                  >
                    <span
                      className="text-[0.75rem]"
                      style={{ color: colors.gray[isDark ? 400 : 500] }}
                    >
                      Prima + asistencias + gastos + IVA. Se guarda en{" "}
                      <strong>valor_total_poliza</strong> solo de este certificado,
                      aunque marques &quot;aplicar a todos&quot;.
                    </span>
                    <span className="flex items-center gap-3">
                      {totalCambio && (
                        <span
                          className="text-[0.75rem]"
                          style={{
                            color: colors.gray[isDark ? 400 : 500],
                            textDecoration: "line-through",
                          }}
                        >
                          {formatoCOP(valorTotalOriginal)}
                        </span>
                      )}
                      <span
                        className="text-base font-semibold"
                        style={{
                          color: totalCambio
                            ? colors.blueAccent[isDark ? 300 : 500]
                            : colors.gray[100],
                        }}
                      >
                        Valor total: {formatoCOP(valorTotalCalculado)}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Valores bloqueados: el certificado ya tiene pagos */}
            {anexoConPagos && (
              <div className="rounded-xl p-5" style={cardStyle}>
                <div className="flex items-start gap-3">
                  <MdLockOutline
                    size={22}
                    style={{ color: colors.redAccent[isDark ? 300 : 500], marginTop: 2 }}
                  />
                  <div className="flex flex-col gap-1">
                    <h3
                      className="text-sm font-semibold uppercase tracking-wide"
                      style={{ color: colors.gray[isDark ? 300 : 600] }}
                    >
                      Valores de la póliza — bloqueados
                    </h3>
                    <p
                      className="text-[0.8rem]"
                      style={{ color: colors.gray[isDark ? 400 : 500] }}
                    >
                      El certificado <strong>{certificado ?? "—"}</strong> tiene{" "}
                      <strong>{pagosAnexo.length}</strong> pago(s) registrado(s) por{" "}
                      <strong>{formatoCOP(totalPagado)}</strong>. Prima neta,
                      asistencias, gastos de expedición e IVA no se pueden corregir
                      con pagos de por medio: cambiarlos descuadraría las
                      conciliaciones y las comisiones ya calculadas. Anula los pagos
                      del certificado y vuelve a entrar.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Alcance + motivo */}
            <div className="rounded-xl p-5 flex flex-col gap-4" style={cardStyle}>
              <h3
                className="text-sm font-semibold uppercase tracking-wide"
                style={{ color: colors.gray[isDark ? 300 : 600] }}
              >
                Alcance y motivo
              </h3>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aplicarTodos}
                  onChange={(e) => setAplicarTodos(e.target.checked)}
                  className="mt-1"
                />
                <span className="flex flex-col">
                  <span className="text-sm" style={{ color: colors.gray[100] }}>
                    Aplicar a todos los certificados / anexos de la póliza
                  </span>
                  <span
                    className="text-[0.75rem]"
                    style={{ color: colors.gray[isDark ? 400 : 500] }}
                  >
                    Los valores de la póliza nunca entran aquí: siempre se aplican
                    solo a este certificado. Si lo desmarcas, los datos de tomador,
                    asegurado, beneficiario y vigencias sólo cambian en el certificado{" "}
                    {seleccion.no_certificado ?? 0}. Número de póliza, aseguradora y
                    vehículo siempre aplican a toda la póliza.
                  </span>
                </span>
              </label>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="motivo"
                  className="text-[0.72rem] uppercase tracking-wide font-semibold"
                  style={{ color: colors.gray[isDark ? 300 : 600] }}
                >
                  Motivo de la corrección (obligatorio)
                </label>
                <textarea
                  id="motivo"
                  rows={3}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej. La aseguradora expidió la póliza con el documento del tomador errado; soporte en el caso #4521."
                  style={{
                    width: "100%",
                    borderRadius: 6,
                    padding: 10,
                    fontSize: "0.9rem",
                    outline: "none",
                    resize: "vertical",
                    color: colors.gray[100],
                    backgroundColor: isDark ? colors.primary[400] : "#ffffff",
                    border: `1px solid ${
                      motivo.trim().length > 0 && motivo.trim().length < 10
                        ? colors.redAccent[500]
                        : colors.gray[isDark ? 600 : 800]
                    }`,
                  }}
                />
                <span
                  className="text-[0.7rem]"
                  style={{ color: colors.gray[isDark ? 400 : 500] }}
                >
                  {motivo.trim().length}/10 caracteres mínimos · queda en la bitácora
                  junto a tu usuario.
                </span>
              </div>
            </div>

            <HistorialBitacora registros={bitacora} />
          </>
        )}
      </div>

      {/* Confirmación con el diff */}
      <Dialog
        open={confirmando}
        onClose={() => !guardando && setConfirmando(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirmar corrección</DialogTitle>
        <DialogContent dividers>
          <p className="text-sm mb-3">
            Se actualizarán {cambios.length} campo(s) de la póliza{" "}
            <strong>{original?.no_poliza}</strong>:
          </p>
          <ul className="flex flex-col gap-2">
            {cambios.map((c) => (
              <li key={c} className="text-sm flex flex-col">
                <span className="font-semibold">{etiquetaCampo(c)}</span>
                <span>
                  <span style={{ textDecoration: "line-through", opacity: 0.7 }}>
                    {valorLegible(c, original[c])}
                  </span>
                  {" → "}
                  <strong>{valorLegible(c, valores[c])}</strong>
                </span>
              </li>
            ))}
          </ul>

          {cambios.some((c) => CAMPOS_VALORES.includes(c)) && (
            <p className="text-sm mt-3">
              <strong>Valor total (recalculado):</strong>{" "}
              <span style={{ textDecoration: "line-through", opacity: 0.7 }}>
                {formatoCOP(valorTotalOriginal)}
              </span>
              {" → "}
              <strong>{formatoCOP(valorTotalCalculado)}</strong>
              <br />
              <span className="text-[0.78rem] opacity-80">
                Los valores se aplican solo al certificado {certificado ?? 0}.
              </span>
            </p>
          )}

          <p className="text-sm mt-4">
            <strong>Alcance:</strong>{" "}
            {aplicarTodos
              ? "todos los certificados de la póliza"
              : `sólo el certificado ${seleccion?.no_certificado ?? 0}`}
          </p>
          <p className="text-sm mt-1">
            <strong>Motivo:</strong> {motivo.trim()}
          </p>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            disabled={guardando}
            className="px-4 py-2 rounded-md text-sm"
            style={{ border: `1px solid ${colors.gray[400]}` }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="px-4 py-2 rounded-md text-sm font-semibold"
            style={{ backgroundColor: "#88d600", color: "#1d1d1d" }}
          >
            {guardando ? "Aplicando…" : "Aplicar corrección"}
          </button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CorreccionPoliza;
