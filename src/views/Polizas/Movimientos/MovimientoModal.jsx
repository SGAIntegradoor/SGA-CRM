import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import { getRazonesModificaciones } from "../../../services/Polizas/getRazonesModificaciones";
import Swal from "sweetalert2";
import { createAnexo } from "../../../services/Polizas/createAnexo";
import { getMovimiento } from "../../../services/Polizas/getMovimiento";
import { NavContext } from "../../../context/NavContext";
import { updateAnexo } from "../../../services/Polizas/updateAnexo";

export const MovimientoModal = ({
  titulo,
  show,
  onClose,
  loadedPoliza,
  fromVerMovimientos = null,
  setIsLoading = null,
  loading = null,
}) => {

  const [lockTotal, setLockTotal] = useState(false); // true = conservar total de BD

  const [razones, setRazones] = useState([]);

  const [errors, setErrors] = useState({}); // { campo: true|false }

  const { movimientoContext, clearMovimiento } = useContext(NavContext);

  const isFromContext = Boolean(
    movimientoContext?.idPoliza && movimientoContext?.idMovimiento
  );

  const [hydrateFrom, setHydrateFrom] = useState(null); // "context" | "parent" | null

  // esta fecha debe ser gmt -5
  const [fechaNow] = useState(() =>
    new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" })
  );

  // Helper function to check if a value is valid
  const hasValue = (v) => {
    if (v === 0) return true;
    if (v === null || v === undefined) return false;
    if (typeof v === "string") return v.trim() !== "";
    return true;
  };

  const [ivaManual, setIvaManual] = useState(false);

  // ⬇️ añade esto cerca de tus useState
  const initialForm = {
    tipomovimiento: "",
    // Cancelación
    razoncancelacionmovimiento: "",
    fechaemisioncancelacion: fechaNow,
    valorprimacancelacion: "",
    fechafinvigcancelacion: fechaNow,
    // Modificación / Nuevo
    razonmovimiento: "",
    valorprimamovimiento: "",
    fechamovimiento: fechaNow,
    // Comunes
    ivamovimiento: "",
    asistenciaotrosmovimiento: "",
    gastosexpedicionmovimiento: "",
    valortotalpagar: "",
    observacionesmovimiento: "",
    nocertificado: "",
  };

  const [formModificacion, setFormModificacion] = useState(initialForm);

  useEffect(() => {
    if (!show) return;
    setErrors({});
    setRazones([]);
    setLockTotal(false); // por defecto desbloqueado; se activará si viene de BD
    setFormModificacion(initialForm);

    const source = isFromContext ? "context" : loadedPoliza ? "parent" : null;
    setHydrateFrom(source);
  }, [show, isFromContext, loadedPoliza]);

  // ====== Dinero (COP) ======
  const nfCOP = useMemo(
    () =>
      new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }),
    []
  );
  const formatCOP = (n) =>
    n === null || n === undefined || isNaN(n) ? "" : nfCOP.format(Number(n));
  const parseCOP = (v) => {
    if (v === null || v === undefined) return 0;
    const only = String(v).replace(/[^\d-]/g, "");
    if (only === "" || only === "-") return 0;
    return parseInt(only, 10);
  };

  const handleMoneyChange = (name) => (e) => {
    setLockTotal(false); // ← si toca cualquier campo, desde ahora recalculamos total

    const raw = e.target.value;

    if (formModificacion.tipomovimiento === "2") {
      if (raw.trim() === "") {
        setFormModificacion((p) => ({ ...p, [name]: "" }));
        return;
      }
      let n = parseCOP(raw);
      if (n > 0) n = -n;
      setFormModificacion((p) => ({ ...p, [name]: formatCOP(n) }));
      return;
    }

    if (name === "ivamovimiento") {
      if (raw.trim() === "") {
        setIvaManual(false);
        setFormModificacion((p) => ({ ...p, [name]: "" }));
        return;
      }
      setIvaManual(true);
    }

    if (raw.trim() === "") {
      setFormModificacion((p) => ({ ...p, [name]: "" }));
      return;
    }
    const n = parseCOP(raw);
    setFormModificacion((p) => ({ ...p, [name]: formatCOP(n) })); // ← ya no comentado
  };

  const handlerGetMovimiento = async (id_poliza, id_movimiento) => {
    if (typeof setIsLoading === "function") setIsLoading(true);
    try {
      const response = await getMovimiento(id_poliza, id_movimiento);
      if (response.status === "Ok") {
        return response.data;
      } else {
        Swal.fire("Error", response.message, "error");
        return null;
      }
    } catch (e) {
      Swal.fire("Error", "No se pudo obtener el movimiento", "error");
      return null;
    } finally {
      if (typeof setIsLoading === "function") setIsLoading(false);
    }
  };

  // ====== Constante IVA ======
  const IVA_RATE = 0.19;

  useEffect(() => {
    if (!show || hydrateFrom !== "context") return;

    let alive = true;
    (async () => {
      const idPoliza = movimientoContext?.idPoliza;
      const idMovimiento = movimientoContext?.idMovimiento;
      if (!idPoliza || !idMovimiento) return;

      const data = await handlerGetMovimiento(idPoliza, idMovimiento);
      if (!data || !alive) return;

      const primaneta = parseCOP(data.prima_neta_poliza);
      const ivaIni = parseCOP(data.iva_poliza);
      const asist = parseCOP(data.asistencias_otros_poliza);
      const gastos = parseCOP(data.gastos_expedicion_poliza);
      const ivaCalc = Math.round((primaneta + asist + gastos) * IVA_RATE); // ← línea corregida

      const tipoCertificado =
        data.tipo_certificado === "1" && data.no_certificado === "0"
          ? "0"
          : data.tipo_certificado === "3"
          ? "1"
          : data.tipo_certificado === "4"
          ? "2"
          : "";

      if (tipoCertificado === "0") {
        setFormModificacion((p) => ({
          ...p,
          tipomovimiento: "0",
          fechamovimiento: data.fecha_registro || fechaNow,
          razonmovimiento: "7",
          valorprimamovimiento: formatCOP(primaneta),
          asistenciaotrosmovimiento: formatCOP(asist),
          gastosexpedicionmovimiento: formatCOP(gastos),
          ivamovimiento: formatCOP(ivaIni || ivaCalc),
          nocertificado: data.no_certificado || "",
          valortotalpagar: formatCOP(parseCOP(data.valor_total_poliza)), // ← conserva total BD
        }));
      } else if (tipoCertificado === "1") {
        setFormModificacion((p) => ({
          ...p,
          tipomovimiento: "1",
          fechamovimiento: data.fecha_registro || fechaNow,
          razonmovimiento: data.razon_modificacion ?? "",
          valorprimamovimiento: formatCOP(primaneta),
          asistenciaotrosmovimiento: formatCOP(asist),
          gastosexpedicionmovimiento: formatCOP(gastos),
          ivamovimiento: formatCOP(ivaIni || ivaCalc),
          nocertificado: data.no_certificado || "",
          valortotalpagar: formatCOP(parseCOP(data.valor_total_poliza)),
        }));
      } else if (tipoCertificado === "2") {
        setFormModificacion((p) => ({
          ...p,
          tipomovimiento: "2",
          fechaemisioncancelacion: data.fecha_registro || fechaNow,
          fechafinvigcancelacion: data.fecha_fin_vig_poliza || "",
          razoncancelacionmovimiento: data.razon_cancelacion ?? "",
          valorprimacancelacion: formatCOP(primaneta || ""),
          asistenciaotrosmovimiento: formatCOP(asist),
          gastosexpedicionmovimiento: formatCOP(gastos),
          ivamovimiento: formatCOP(ivaIni || ivaCalc),
          nocertificado: data.no_certificado || "",
          valortotalpagar: formatCOP(parseCOP(data.valor_total_poliza)),
        }));
      }

      setLockTotal(true); // ← bloquea recálculo (conserva el total de BD)
      setIvaManual(true); // ← reanudar auto-IVA (estaba al revés)
    })();

    return () => {
      alive = false;
    };
  }, [
    show,
    hydrateFrom,
    movimientoContext?.idPoliza,
    movimientoContext?.idMovimiento,
    fechaNow,
  ]);

  //
  useEffect(() => {
    if (!show || hydrateFrom !== "parent" || !loadedPoliza) return;

    const v = loadedPoliza?.valoresPoliza || {};
    const primaneta = parseCOP(v.primaneta);
    const ivaIni = parseCOP(v.iva);
    const asist = parseCOP(v.asistenciasotros);
    const gastos = parseCOP(v.gastosexpedicion);
    const ivaCalc = Math.round((primaneta + asist + gastos) * IVA_RATE);

    if (formModificacion.tipomovimiento === "2") {
      setFormModificacion((p) => ({
        ...p,
        fechaemisioncancelacion: fechaNow,
        asistenciaotrosmovimiento: formatCOP(-asist),
        gastosexpedicionmovimiento: formatCOP(-gastos),
        ivamovimiento: formatCOP(ivaIni || ivaCalc),
      }));
    } else {
      setFormModificacion((p) => ({
        ...p,
        fechamovimiento: fechaNow,
        valorprimamovimiento: formatCOP(primaneta),
        asistenciaotrosmovimiento: formatCOP(asist),
        gastosexpedicionmovimiento: formatCOP(gastos),
        ivamovimiento: formatCOP(ivaIni || ivaCalc),
      }));
    }

    setLockTotal(false); 
    setIvaManual(false);
  }, [show, hydrateFrom, loadedPoliza, fechaNow]);

  const fetchRazones = async (tipo) => {
    if (!tipo) {
      setRazones([]);
      return;
    }
    const data = await getRazonesModificaciones(tipo);
    const options = Array.isArray(data)
      ? data.map((r) => ({
          value: String(r.id ?? r.value ?? r.codigo),
          label: String(r.nombre ?? r.label ?? r.descripcion),
        }))
      : [];
    setRazones(options);
  };

  useEffect(() => {
    // limpio razones seleccionadas al cambiar tipo
    setFormModificacion((prev) => ({
      ...prev,

    }));
    if (formModificacion.tipomovimiento)
      fetchRazones(formModificacion.tipomovimiento);
    else setRazones([]);
  }, [formModificacion.tipomovimiento]);

  // ====== Recalcular IVA auto (si NO es manual)
  useEffect(() => {
    if (!show || ivaManual) return;

    const base =
      formModificacion.tipomovimiento === "2"
        ? parseCOP(formModificacion.valorprimacancelacion)
        : parseCOP(formModificacion.valorprimamovimiento);

    const asist = parseCOP(formModificacion.asistenciaotrosmovimiento);
    const gastos = parseCOP(formModificacion.gastosexpedicionmovimiento);

    const ivaAuto = Math.round((base + asist + gastos) * IVA_RATE);
    setFormModificacion((p) => ({ ...p, ivamovimiento: formatCOP(ivaAuto) }));
  }, [
    show,
    ivaManual,
    formModificacion.tipomovimiento,
    formModificacion.valorprimacancelacion,
    formModificacion.valorprimamovimiento,
    formModificacion.asistenciaotrosmovimiento,
    formModificacion.gastosexpedicionmovimiento,
  ]);

  // ====== Recalcular TOTAL
  useEffect(() => {
    if (lockTotal) return; // ← conserva el valor que trajiste de BD

    const base =
      formModificacion.tipomovimiento === "2"
        ? parseCOP(formModificacion.valorprimacancelacion)
        : parseCOP(formModificacion.valorprimamovimiento);

    const total =
      base +
      parseCOP(formModificacion.asistenciaotrosmovimiento) +
      parseCOP(formModificacion.gastosexpedicionmovimiento) +
      parseCOP(formModificacion.ivamovimiento);

    setFormModificacion((p) => ({ ...p, valortotalpagar: formatCOP(total) }));
  }, [
    lockTotal,
    formModificacion.tipomovimiento,
    formModificacion.valorprimacancelacion,
    formModificacion.valorprimamovimiento,
    formModificacion.asistenciaotrosmovimiento,
    formModificacion.gastosexpedicionmovimiento,
    formModificacion.ivamovimiento,
  ]);

  useEffect(() => {
    document.body.style.overflow = show ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

  if (!show) return null;

  const styles = {
    backdrop: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      zIndex: 1011,
      overflowY: "auto",
    },
    modal: {
      backgroundColor: "#fff",
      borderRadius: "8px",
      minWidth: "95%",
      maxWidth: "90%",
      maxHeight: "80vh",
      boxShadow: "0 0 15px rgba(0, 0, 0, 0.3)",
      marginRight: "0px",
      marginTop: "30px",
      marginBottom: "20px",
      display: "flex",
      flexDirection: "column",
    },
    button: {
      marginTop: "1rem",
      padding: "0.5rem 1rem",
      backgroundColor: "#88D600",
      color: "#fff",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      marginBottom: "20px",
      height: "35px",
    },
    buttonClose: {
      marginTop: "1rem",
      padding: "0.5rem 1rem",
      backgroundColor: "#ccc",
      color: "#fff",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      marginBottom: "20px",
      height: "35px",
    },
  };

  const customStyles = {
    control: (base) => ({ ...base, minHeight: 35, height: 35 }),
    dropdownIndicator: (base) => ({
      ...base,
      paddingTop: 4,
      paddingRight: 0,
      color: "black",
      svg: { width: "18px", height: "16px" },
    }),
    indicatorSeparator: () => ({ display: "none" }),
    menu: (base) => ({ ...base, maxHeight: "300px", overflowY: "auto" }),
  };

  const selectRazones = [
    { value: "0", label: "Nuevo" },
    { value: "1", label: "Modificación" },
    { value: "2", label: "Cancelación" },
  ];

  const onCloseModal = () => {
    onClose();
    setFormModificacion(initialForm);
    setRazones([]);
    clearMovimiento();
    setIvaManual(false);
    setHydrateFrom(null);
  };

  // debe arrojar un Swal con el campo que no se ingreso o el que falta y poner el input en border rojo
  const fieldLabels = {
    tipomovimiento: "Tipo de movimiento",
    razoncancelacionmovimiento: "Razón de cancelación",
    fechaemisioncancelacion: "Fecha emisión de cancelación",
    fechafinvigcancelacion: "Fecha fin de vigencia",
    valorprimacancelacion: "Valor prima de cancelación",
    razonmovimiento: "Razón de modificación",
    fechamovimiento: "Fecha de movimiento",
    valorprimamovimiento: "Valor prima",
    ivamovimiento: "IVA",
    asistenciaotrosmovimiento: "Asistencia / Otros",
    gastosexpedicionmovimiento: "Gastos de expedición",
    valortotalpagar: "Valor total a pagar",
  };

  const handlerValidateFields = () => {
    const { tipomovimiento } = formModificacion;

    const fieldsCancelacion = [
      "tipomovimiento",
      "razoncancelacionmovimiento",
      "fechaemisioncancelacion",
      "fechafinvigcancelacion",
      "valorprimacancelacion",
      "ivamovimiento",
      "asistenciaotrosmovimiento",
      "gastosexpedicionmovimiento",
      "valortotalpagar",
    ];

    const fieldsMovOref = [
      "tipomovimiento",
      "razonmovimiento",
      "fechamovimiento",
      "valorprimamovimiento",
      "ivamovimiento",
      "asistenciaotrosmovimiento",
      "gastosexpedicionmovimiento",
      "valortotalpagar",
    ];

    // '2' -> cancelación; '0' y '1' -> usan estructura de modificación
    const required = tipomovimiento === "2" ? fieldsCancelacion : fieldsMovOref;

    const missing = required.filter((f) => !hasValue(formModificacion[f]));
    const nextErrors = {};
    required.forEach((f) => {
      nextErrors[f] = missing.includes(f);
    });
    setErrors(nextErrors);

    if (missing.length > 0) {
      const nice = missing.map((f) => fieldLabels[f] || f);
      Swal.fire({
        icon: "error",
        title: "Campos faltantes",
        text: `Por favor complete: ${nice.join(", ")}`,
        zIndex: 9999,
      });
      return false;
    }
    return true;
  };

  const decorateSelect = (baseStyles, hasError) => {
    const safeBase = baseStyles || {};
    return {
      ...safeBase,
      control: (provided, state) => {
        // Usa tu control si lo definiste; si no, parte del "provided"
        const baseCtrl =
          typeof safeBase.control === "function"
            ? safeBase.control(provided, state)
            : { ...provided, ...(safeBase.control || {}) };

        const errorBorder = hasError
          ? "#ef4444"
          : baseCtrl.borderColor || provided.borderColor;

        return {
          ...baseCtrl,
          borderColor: errorBorder,
          boxShadow: hasError
            ? "0 0 0 1px #ef4444"
            : state.isFocused
            ? baseCtrl.boxShadow
            : baseCtrl.boxShadow || "none",
          // Asegura el hover consistente
          "&:hover": {
            ...(baseCtrl["&:hover"] || {}),
            borderColor: hasError
              ? "#ef4444"
              : baseCtrl["&:hover"]?.borderColor || errorBorder,
          },
        };
      },
    };
  };

  const stylesTipoMov = React.useMemo(
    () => decorateSelect(customStyles, !!errors.tipomovimiento),
    [customStyles, errors.tipomovimiento]
  );

  const stylesRazonCancel = React.useMemo(
    () => decorateSelect(customStyles, !!errors.razoncancelacionmovimiento),
    [customStyles, errors.razoncancelacionmovimiento]
  );

  const stylesRazonMov = React.useMemo(
    () => decorateSelect(customStyles, !!errors.razonmovimiento),
    [customStyles, errors.razonmovimiento]
  );

  const handlerSave = async () => {
    if (!handlerValidateFields()) return;
    if (isFromContext) {
      // el body manda todo y en el Backend se distingue por el tipo de movimiento
      console.log(formModificacion.razoncancelacionmovimiento)
      const bodyGeneral = {
        data: {
          tipomovimiento: formModificacion.tipomovimiento,
          nocertificado: formModificacion.nocertificado,
          razoncancelacionmovimiento:
            formModificacion.razoncancelacionmovimiento,
          fechaemisioncancelacion: formModificacion.fechaemisioncancelacion,
          valorprimacancelacion: formModificacion.valorprimacancelacion,
          fechafinvigcancelacion: formModificacion.fechafinvigcancelacion,
          razonmovimiento: formModificacion.razonmovimiento,
          valorprimamovimiento: formModificacion.valorprimamovimiento,
          fechamovimiento: formModificacion.fechamovimiento,
          ivamovimiento: formModificacion.ivamovimiento,
          asistenciaotrosmovimiento: formModificacion.asistenciaotrosmovimiento,
          gastosexpedicionmovimiento:
            formModificacion.gastosexpedicionmovimiento,
          valortotalpagar: formModificacion.valortotalpagar,
          observacionesmovimiento: formModificacion.observacionesmovimiento,
        },
        id_poliza: movimientoContext.idPoliza,
        id_movimiento: movimientoContext.idMovimiento,
      };

      const updateAnexoPoliza = await updateAnexo(bodyGeneral);
      if (updateAnexoPoliza.status === "Ok") {
        // Anexo actualizado exitosamente
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: `El anexo se actualizó exitosamente con ID de póliza: ${updateAnexo.id_poliza}`,
        }).then(() => {
          // Aquí puedes agregar la lógica que deseas ejecutar después de que se cierre el modal
          onCloseModal();
          window.location.reload();
        });
      } else {
        // Manejo de error
        Swal.fire({
          icon: "error",
          title: "Error",
          text: updateAnexo.message || "No se pudo actualizar el anexo.",
        });
      }
    } else {
      const bodySentMovement = {
        ...loadedPoliza,
      };
      const certificado = parseInt(
        loadedPoliza.cabezotePoliza.noCertificado,
        10
      );
      let noCertificado = certificado + 1;
      if (formModificacion.tipomovimiento === "2") {
        // Cancelación
        bodySentMovement.cabezotePoliza.fechaFinVigencia =
          formModificacion.fechafinvigcancelacion;
        bodySentMovement.cabezotePoliza.noCertificado = noCertificado;
        bodySentMovement.cabezotePoliza.fechaRegistro =
          formModificacion.fechaemisioncancelacion;
        bodySentMovement.cabezotePoliza.tipoCertificado = "4";
        bodySentMovement.cabezotePoliza.razonCancelacion =
          formModificacion.razoncancelacionmovimiento;
        bodySentMovement.valoresPoliza.iva = formModificacion.ivamovimiento;
        bodySentMovement.valoresPoliza.primaneta =
          formModificacion.valorprimacancelacion;
        bodySentMovement.valoresPoliza.asistenciasotros =
          formModificacion.asistenciaotrosmovimiento;
        bodySentMovement.valoresPoliza.gastosexpedicion =
          formModificacion.gastosexpedicionmovimiento;
        bodySentMovement.valoresPoliza.valortotal =
          formModificacion.valortotalpagar;
      } else if (formModificacion.tipomovimiento === "1") {
        bodySentMovement.cabezotePoliza.noCertificado = noCertificado;
        bodySentMovement.cabezotePoliza.fechaRegistro =
          formModificacion.fechamovimiento;
        bodySentMovement.cabezotePoliza.tipoCertificado = "3";
        bodySentMovement.cabezotePoliza.razonMovimiento =
          formModificacion.razonmovimiento;
        bodySentMovement.valoresPoliza.iva = formModificacion.ivamovimiento;
        bodySentMovement.valoresPoliza.primaneta =
          formModificacion.valorprimamovimiento;
        bodySentMovement.valoresPoliza.asistenciasotros =
          formModificacion.asistenciaotrosmovimiento;
        bodySentMovement.valoresPoliza.gastosexpedicion =
          formModificacion.gastosexpedicionmovimiento;
        bodySentMovement.valoresPoliza.valortotal =
          formModificacion.valortotalpagar;
      }

      const crearAnexo = await createAnexo(bodySentMovement);
      if (crearAnexo.status == "Ok" && crearAnexo.codeStatus == 201) {
        // Anexo creado exitosamente
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: `El anexo se creó exitosamente con ID de póliza: ${crearAnexo.id_poliza}`,
        }).then(() => {
          onCloseModal();
          window.location.reload();
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: crearAnexo.message || "No se pudo crear el anexo.",
        });
      }
    }
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div className="bg-lime-9000 w-full p-3 text-white font-semibold text-[17px] rounded-tl-lg rounded-tr-lg">
          <p>{isFromContext ? "Editar Movimiento" : titulo}</p>
        </div>
        {/* Fila 1 */}
        <div className="w-full flex flex-row gap-4 bg-white rounded-bl-md rounded-br-md p-8">
          <div className="flex flex-col w-1/5">
            <label htmlFor="tipomovimiento">Tipo de movimiento</label>
            <Select
              name="tipomovimiento"
              id="tipomovimiento"
              options={selectRazones}
              value={
                selectRazones.find(
                  (opt) => opt.value === formModificacion.tipomovimiento
                ) || null
              }
              onChange={(opt) => {
                setFormModificacion((p) => ({
                  ...p,
                  tipomovimiento: opt?.value ?? "",
                }));
                setIvaManual(false);
                // opcional: limpiar error de inmediato
                setErrors((e) => ({ ...e, tipomovimiento: false }));
              }}
              styles={stylesTipoMov}
              placeholder=""
              isOptionDisabled={(option) =>
                loadedPoliza.valoresRecibidos.length > 0 &&
                loadedPoliza.valoresRecibidos.some(
                  (item) => item.valor != ""
                ) &&
                (option.value === "1" ||
                  (loadedPoliza.cabezotePoliza.noCertificado >= "0" &&
                    option.value === "0"))
              } 
            />
          </div>

          {formModificacion.tipomovimiento === "2" ? (
            <>
              <div className="flex flex-col w-1/5">
                <label htmlFor="razoncancelacionmovimiento">
                  Razón de cancelación
                </label>
                <Select
                  name="razoncancelacionmovimiento"
                  id="razoncancelacionmovimiento"
                  options={razones}
                  value={
                    razones.find(
                      (opt) =>
                        opt.value ===
                        formModificacion.razoncancelacionmovimiento
                    ) || null
                  }
                  onChange={(opt) => {
                    setFormModificacion((p) => ({
                      ...p,
                      razoncancelacionmovimiento: opt?.value ?? "",
                    }));
                    setErrors((e) => ({
                      ...e,
                      razoncancelacionmovimiento: false,
                    }));
                  }}
                  styles={stylesRazonCancel}
                  placeholder=""
                  isDisabled={!formModificacion.tipomovimiento}
                  // isClearable
                />
              </div>

              <div className="flex flex-col w-1/5">
                <label htmlFor="fechaemisioncancelacion">
                  Fecha emisión de cancelación
                </label>
                <input
                  name="fechaemisioncancelacion"
                  id="fechaemisioncancelacion"
                  type="date"
                  value={formModificacion.fechaemisioncancelacion || ""}
                  className={`text-md border-[1px] focus:outline-none h-[35px] rounded-md p-2
                    ${
                      errors.fechaemisioncancelacion
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  onChange={(e) =>
                    setFormModificacion((p) => ({
                      ...p,
                      fechaemisioncancelacion: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-col w-1/5">
                <label htmlFor="fechafinvigcancelacion">
                  Fecha fin vigencia
                </label>
                <input
                  name="fechafinvigcancelacion"
                  id="fechafinvigcancelacion"
                  type="date"
                  value={formModificacion.fechafinvigcancelacion || ""}
                  className={`text-md border-[1px] focus:outline-none h-[35px] rounded-md p-2
                    ${
                      errors.fechafinvigcancelacion
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  onChange={(e) =>
                    setFormModificacion((p) => ({
                      ...p,
                      fechafinvigcancelacion: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-col w-1/5">
                <label htmlFor="valorprimacancelacion">
                  Valor prima cancelación
                </label>
                <input
                  name="valorprimacancelacion"
                  id="valorprimacancelacion"
                  type="text"
                  value={formModificacion.valorprimacancelacion || ""}
                  className={`text-md border-[1px] focus:outline-none h-[35px] rounded-md p-2
                    ${
                      errors.valorprimacancelacion
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  onChange={handleMoneyChange("valorprimacancelacion")}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col w-1/5">
                <label htmlFor="razonmovimiento">Razón de modificación</label>
                <Select
                  name="razonmovimiento"
                  id="razonmovimiento"
                  options={razones}
                  value={
                    razones.find(
                      (opt) => opt.value === formModificacion.razonmovimiento
                    ) || null
                  }
                  onChange={(opt) => {
                    setFormModificacion((p) => ({
                      ...p,
                      razonmovimiento: opt?.value ?? "",
                    }));
                    setErrors((e) => ({
                      ...e,
                      razonmovimiento: false,
                    }));
                  }}
                  styles={stylesRazonMov}
                  placeholder=""
                  isDisabled={!formModificacion.tipomovimiento}
                />
              </div>

              <div className="flex flex-col w-1/5">
                <label htmlFor="fechamovimiento">Fecha de modificación</label>
                <input
                  type="date"
                  name="fechamovimiento"
                  id="fechamovimiento"
                  value={formModificacion.fechamovimiento || ""}
                  className={`text-md border-[1px] focus:outline-none h-[35px] rounded-md p-2
                    ${
                      errors.fechamovimiento
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  disabled
                />
              </div>

              <div className="flex flex-col w-1/5">
                <label htmlFor="valorprimamovimiento">Valor prima</label>
                <input
                  name="valorprimamovimiento"
                  id="valorprimamovimiento"
                  type="text"
                  value={formModificacion.valorprimamovimiento || -""}
                  className={`text-md border-[1px] focus:outline-none h-[35px] rounded-md p-2
                  ${
                    errors.valorprimamovimiento
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  onChange={handleMoneyChange("valorprimamovimiento")}
                />
              </div>

              <div className="flex flex-col w-1/5" />
            </>
          )}
        </div>

        {/* Fila 2 */}
        <div className="w-full flex flex-row gap-4 bg-white rounded-bl-md rounded-br-md p-8">
          <div className="flex flex-col w-1/5">
            <label htmlFor="asistenciaotrosmovimiento">
              Asistencia / Otros
            </label>
            <input
              type="text"
              name="asistenciaotrosmovimiento"
              id="asistenciaotrosmovimiento"
              value={formModificacion.asistenciaotrosmovimiento || ""}
              className={`text-md border-[1px] focus:outline-none h-[35px] rounded-md p-2
                ${
                  errors.asistenciaotrosmovimiento
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              onChange={handleMoneyChange("asistenciaotrosmovimiento")}
            />
          </div>

          <div className="flex flex-col w-1/5">
            <label htmlFor="gastosexpedicionmovimiento">
              Gastos expedición
            </label>
            <input
              name="gastosexpedicionmovimiento"
              id="gastosexpedicionmovimiento"
              type="text"
              value={formModificacion.gastosexpedicionmovimiento || ""}
              className={`text-md border-[1px] focus:outline-none h-[35px] rounded-md p-2
                ${
                  errors.gastosexpedicionmovimiento
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              onChange={handleMoneyChange("gastosexpedicionmovimiento")}
            />
          </div>

          <div className="flex flex-col w-1/5">
            <label htmlFor="ivamovimiento">IVA</label>
            <input
              type="text"
              name="ivamovimiento"
              id="ivamovimiento"
              value={formModificacion.ivamovimiento || ""}
              className={`text-md border-[1px] focus:outline-none h-[35px] rounded-md p-2
                ${errors.ivamovimiento ? "border-red-500" : "border-gray-300"}`}
              onChange={handleMoneyChange("ivamovimiento")}
              onDoubleClick={() => {
                setIvaManual(false);
              }}
            />
          </div>
          <div className="flex flex-col w-1/5">
            <label htmlFor="valortotalpagar">Valor total a pagar</label>
            <input
              type="text"
              name="valortotalpagar"
              id="valortotalpagar"
              value={formModificacion.valortotalpagar || ""}
              className={`text-md border-[1px] focus:outline-none h-[35px] rounded-md p-2
                ${
                  errors.valortotalpagar ? "border-red-500" : "border-gray-300"
                }`}
              readOnly
            />
          </div>

          <div className="flex flex-col w-1/5" />
        </div>

        {/* Fila 3 */}
        <div className="w-full flex flex-row gap-4 bg-white rounded-bl-md rounded-br-md p-8">
          <div className="flex flex-col w-5/12">
            <label htmlFor="observacionesmovimiento">Observaciones</label>
            <input
              type="text"
              name="observacionesmovimiento"
              id="observacionesmovimiento"
              value={formModificacion.observacionesmovimiento || ""}
              className="text-md border border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2"
              onChange={(e) =>
                setFormModificacion((p) => ({
                  ...p,
                  observacionesmovimiento: e.target.value,
                }))
              }
            />
          </div>

          <div className="flex flex-col w-1/5 mt-1">
            <button style={styles.buttonClose} onClick={onCloseModal}>
              Cancelar
            </button>
          </div>
          <div className="flex flex-col w-1/5 mt-1">
            <button style={styles.button} onClick={handlerSave}>
              {isFromContext ? "Actualizar" : "Guardar"}
            </button>
          </div>
          <div className="flex flex-col w-1/5" />
        </div>
      </div>
    </div>
  );
};
