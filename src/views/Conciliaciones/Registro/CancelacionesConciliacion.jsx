import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Modal } from "@mui/material";
import BtnGeneral from "../../../components/BtnGeneral/BtnGeneral";
import { BsFloppy2Fill } from "react-icons/bs";
import { FaPen } from "react-icons/fa";
import { getRazonesModificaciones } from "../../../services/Polizas/getRazonesModificaciones";

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const pickFirstValue = (values = []) => {
  for (const value of values) {
    if (value !== null && value !== undefined && `${value}`.trim() !== "") {
      return `${value}`.trim();
    }
  }

  return "";
};

const sanitizeFacturaValue = (value = "") =>
  value
    .replace(/[^\d-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "");

const sanitizeMoneyDigits = (value = "") => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return "";
    }
    return String(Math.round(value));
  }

  const raw = String(value).trim();
  if (!raw) {
    return "";
  }

  const cleaned = raw
    .replace(/\$/g, "")
    .replace(/\s/g, "")
    .replace(/[^\d,.-]/g, "");
  const hasDot = cleaned.includes(".");
  const hasComma = cleaned.includes(",");

  let normalized = cleaned;

  if (hasDot && hasComma) {
    const lastDot = cleaned.lastIndexOf(".");
    const lastComma = cleaned.lastIndexOf(",");
    const decimalSep = lastDot > lastComma ? "." : ",";
    const thousandSep = decimalSep === "." ? "," : ".";
    normalized = cleaned.split(thousandSep).join("").replace(decimalSep, ".");
  } else if (hasDot || hasComma) {
    const sep = hasDot ? "." : ",";
    if (new RegExp(`\\${sep}\\d{1,2}$`).test(cleaned)) {
      normalized = cleaned.replace(sep, ".");
    } else {
      normalized = cleaned.split(sep).join("");
    }
  }

  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) {
    return "";
  }

  return String(Math.abs(Math.round(numeric)));
};

const sanitizePercentValue = (value = "") => {
  let sanitized = value
    .replace(/,/g, ".")
    .replace(/[^\d.-]/g, "")
    .replace(/(?!^)-/g, "");

  const [intPart = "", ...decParts] = sanitized.split(".");
  sanitized = decParts.length ? `${intPart}.${decParts.join("")}` : intPart;

  if (sanitized.startsWith(".")) {
    sanitized = `0${sanitized}`;
  }
  if (sanitized.startsWith("-.")) {
    sanitized = sanitized.replace("-.", "-0.");
  }

  return sanitized;
};

const normalizePercentValue = (value = "") => {
  const sanitized = sanitizePercentValue(value);
  if (!sanitized || !/^-?\d+(\.\d+)?$/.test(sanitized)) {
    return sanitized;
  }

  const numeric = Number(sanitized);
  if (!Number.isFinite(numeric)) {
    return sanitized;
  }

  return String(numeric);
};

const normalizeDateValue = (value = "") => {
  if (!value) {
    return getTodayDate();
  }

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  return getTodayDate();
};

const buildInitialFormState = (poliza = {}) => ({
  factura: "",
  comision: "",
  primaPlanilla: "",
  fechaConciliacion: normalizeDateValue(
    pickFirstValue([poliza?.fecha_conciliacion, getTodayDate()]),
  ),
  comisionRecibida: "",
  pagoFinancieras: sanitizeMoneyDigits(pickFirstValue([poliza?.pagos_financieras_con, ""])),
});

const buildConciliacionRow = (row = {}, index = 0) => {
  const porcentajeComision = normalizePercentValue(
    pickFirstValue([
      row?.porcentaje_comision,
      row?.pct_comision,
      row?.comision,
    ]),
  );

  const primaPlanilla = sanitizeMoneyDigits(
    pickFirstValue([
      row?.prima_planilla,
      row?.valor_total,
      row?.prima_sin_iva,
      row?.prima_sin_iva_asistencia,
    ]),
  );

  const comisionRecibidaSource = sanitizeMoneyDigits(
    pickFirstValue([
      row?.comision_recibida,
      row?.valor_comision,
      row?.total_comision,
    ]),
  );

  return {
    id:
      row?.id_conciliacion ??
      row?.id ??
      `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    cuota: Number(row?.cuota) > 0 ? Number(row?.cuota) : index + 1,
    factura: sanitizeFacturaValue(
      pickFirstValue([row?.factura, row?.numero_factura, row?.nro_factura]),
    ),
    porcentaje_comision: porcentajeComision,
    prima_planilla: primaPlanilla,
    fecha_conciliacion: normalizeDateValue(
      pickFirstValue([row?.fecha_conciliacion, row?.fecha]),
    ),
    comision_recibida:
      comisionRecibidaSource ||
      calculateComisionRecibida(primaPlanilla, porcentajeComision),
  };
};

const getConciliacionesFromPoliza = (poliza = {}) => {
  const source =
    [
      poliza?.conciliaciones,
      poliza?.historial_conciliaciones,
      poliza?.conciliaciones_poliza,
      poliza?.registro_conciliacion,
    ].find((item) => Array.isArray(item)) || [];

  return source.map((item, index) => buildConciliacionRow(item, index));
};

const formatCommentTimestamp = (value = "") => {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const getComentariosFromPoliza = (poliza = {}) => {
  const source =
    [
      poliza?.comentarios_conciliacion,
      poliza?.comentarios,
      poliza?.seguimientos,
    ].find((item) => Array.isArray(item)) || [];

  return source.map((item, index) => ({
    id_comentario:
      item?.id_comentario ?? item?.id ?? `tmp-comment-${Date.now()}-${index}`,
    id_conciliacion: item?.id_conciliacion ?? null,
    texto: pickFirstValue([item?.comentario, item?.texto]),
    timestamp: pickFirstValue([
      formatCommentTimestamp(item?.fecha_edicion),
      formatCommentTimestamp(item?.fecha_creacion),
      item?.timestamp,
    ]),
    usuario:
      pickFirstValue([item?.usuario_nombre, item?.usuario]) ||
      "Usuario desconocido",
    edit: Number(item?.editado ?? item?.edit ?? 0),
  }));
};

const calculateComisionRecibida = (
  primaPlanillaDigits = "",
  porcentaje = "",
) => {
  const prima = Number(primaPlanillaDigits || 0);
  const pct = Number(porcentaje || 0);

  if (!Number.isFinite(prima) || !Number.isFinite(pct)) {
    return "";
  }

  const calculated = Math.round((prima * pct) / 100);
  return String(calculated);
};

export const CancelacionConciliacion = ({
  open = false,
  onClose = () => {},
  onSubmit = () => {},
  onSaveComentario = () => {},
  onUpdateComentario = () => {},
  onUpdateConciliacion = () => {},
  onSavePagosFinancieras = () => {},
  poliza,
  userData,
  setLoading,
}) => {
  const [formData, setFormData] = useState(() => buildInitialFormState(poliza));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isComisionRecibidaManual, setIsComisionRecibidaManual] =
    useState(false);
  const [conciliacionesTabla, setConciliacionesTabla] = useState(() =>
    getConciliacionesFromPoliza(poliza),
  );
  const [razonesCancelacion, setRazonesCancelacion] = useState([]);
  const [editingConciliacionIndex, setEditingConciliacionIndex] =
    useState(null);
  const [editingConciliacionDraft, setEditingConciliacionDraft] =
    useState(null);
  const [editingConciliacionErrors, setEditingConciliacionErrors] = useState(
    {},
  );
  const [comentarios, setComentarios] = useState(() =>
    getComentariosFromPoliza(poliza),
  );
  const [comentario, setComentario] = useState("");
  const [editingComentarioIndex, setEditingComentarioIndex] = useState(null);
  const [editingComentarioTexto, setEditingComentarioTexto] = useState("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [pendingSaveComentarioIndex, setPendingSaveComentarioIndex] =
    useState(null);
  const [isSavingPagoFinancieras, setIsSavingPagoFinancieras] = useState(false);
  const comentarioInputRefs = useRef({});

  const handleGetRazonesCancelacion = async () => {
    try {
      setLoading(true);
      const response = await getRazonesModificaciones("2");

      const source = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      const normalizedRazones = source
        .map((item) => {
          const id = pickFirstValue([item?.id_razones, item?.value]);
          const razon = pickFirstValue([item?.razon, item?.label]);

          if (!id || !razon || id === "N/A" || razon === "N/A") {
            return null;
          }

          return {
            id_razones: String(id),
            razon: String(razon),
          };
        })
        .filter(Boolean);

      setRazonesCancelacion(normalizedRazones);
    } catch (error) {
      console.error("Error fetching razones de cancelacion:", error);
      setRazonesCancelacion([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    setFormData(buildInitialFormState(poliza));
    setErrors({});
    setTouched({});
    setIsComisionRecibidaManual(false);
    setConciliacionesTabla(getConciliacionesFromPoliza(poliza));
    setEditingConciliacionIndex(null);
    setEditingConciliacionDraft(null);
    setEditingConciliacionErrors({});
    setComentarios(getComentariosFromPoliza(poliza));
    setComentario("");
    setEditingComentarioIndex(null);
    setEditingComentarioTexto("");
    setIsSaveDialogOpen(false);
    setPendingSaveComentarioIndex(null);
    setIsSavingPagoFinancieras(false);
    handleGetRazonesCancelacion();
  }, [open, poliza, userData]);

  useEffect(() => {
    if (editingComentarioIndex === null) {
      return;
    }

    const input = comentarioInputRefs.current[editingComentarioIndex];
    if (input) {
      input.focus();
      input.select();
    }
  }, [editingComentarioIndex]);

  useEffect(() => {
    const calculated = calculateComisionRecibida(
      formData.primaPlanilla,
      formData.comision,
    );

    setFormData((prev) => {
      if (prev.comisionRecibida === calculated) {
        return prev;
      }

      return {
        ...prev,
        comisionRecibida: calculated,
      };
    });
  }, [formData.primaPlanilla, formData.comision, isComisionRecibidaManual]);

  const handleModalClose = (_, reason) => {
    if (reason === "backdropClick") {
      return;
    } else if (reason === "escapeKeyDown") {
      return;
    }

    onClose();
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || `${value}`.trim() === "") {
      return "N/A";
    }
    if (typeof value === "string" && value.trim() === "N/A") {
      return "N/A";
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return value;
    }
    return numeric.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // const pickFirstValue = (values) => {
  //   for (const value of values) {
  //     if (value !== null && value !== undefined && `${value}`.trim() !== "") {
  //       return value;
  //     }
  //   }
  //   return "N/A";
  // };

  const calcSaldo = (row) => {
    if (!row?.total_pagos || !row?.valor_total) {
      return 0;
    }

    const totalPagos = Number(
      String(row?.total_pagos)
        .replace(/\$/g, "")
        .replace(/\s/g, "")
        .replace(/\./g, "")
        .replace(/,/g, "."),
    );

    const primaSinIva = Number(
      String(row?.valor_total)
        .replace(/\$/g, "")
        .replace(/\s/g, "")
        .replace(/\./g, "")
        .replace(/,/g, "."),
    );

    if (Number.isFinite(totalPagos) && Number.isFinite(primaSinIva)) {
      return formatCurrency(primaSinIva - totalPagos);
    }
    return "N/A";
  };

  const formatMoneyInput = (digits) => {
    if (!digits) {
      return "$ ";
    }

    return `$ ${Number(digits).toLocaleString("es-CO")}`;
  };

  const formatMoneyTable = (digits) => {
    const parsed = Number(digits || 0);
    return `$ ${parsed.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatNegativeMoneyTable = (digits) => {
    const parsed = Math.abs(Number(digits || 0));
    return `$ -${parsed.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const displayPrimaPlanilla = useMemo(
    () => formatMoneyInput(formData.primaPlanilla),
    [formData.primaPlanilla],
  );

  const displayComisionRecibida = useMemo(
    () => formatMoneyInput(formData.comisionRecibida),
    [formData.comisionRecibida],
  );

  const displayPagoFinancieras = useMemo(
    () => formatMoneyInput(formData.pagoFinancieras),
    [formData.pagoFinancieras],
  );

  const validateField = (field, value) => {
    if (field === "factura") {
      if (!value) {
        return "El campo # Factura es requerido.";
      }

      if (!/^(\d+)(-\d+)*$/.test(value)) {
        return "Solo se permiten numeros y guion medio no consecutivo (ej: 1-2222-1).";
      }
    }

    if (field === "comision") {
      if (!value) {
        return "El campo % Comision es requerido.";
      }

      if (!/^-?\d+(\.\d+)?$/.test(value)) {
        return "Formato invalido. Use solo numeros, punto decimal y signo negativo al inicio.";
      }

      const numeric = Number(value);
      if (!Number.isFinite(numeric) || numeric > 100 || numeric < -100) {
        return "El porcentaje debe estar entre -100 y 100.";
      }
    }

    if (field === "primaPlanilla") {
      if (!value) {
        return "El campo Prima planilla es requerido.";
      }
    }

    if (field === "fechaConciliacion") {
      if (!value) {
        return "El campo Fecha conciliacion es requerido.";
      }

      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
      if (!match) {
        return "La fecha debe tener formato YYYY-MM-DD.";
      }

      const [, year, month, day] = match;
      const parsed = new Date(`${year}-${month}-${day}T00:00:00`);

      if (
        Number.isNaN(parsed.getTime()) ||
        `${parsed.getFullYear()}` !== year ||
        `${parsed.getMonth() + 1}`.padStart(2, "0") !== month ||
        `${parsed.getDate()}`.padStart(2, "0") !== day
      ) {
        return "La fecha ingresada no es valida.";
      }
    }

    if (field === "comisionRecibida") {
      if (!value) {
        return "El campo Comision recibida es requerido.";
      }
    }

    return "";
  };

  const validateForm = (values) => {
    const nextErrors = {};

    Object.entries(values).forEach(([field, value]) => {
      const error = validateField(field, value);
      if (error) {
        nextErrors[field] = error;
      }
    });

    return nextErrors;
  };

  const setFieldValue = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: validateField(field, value),
      }));
    }
  };

  const markTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, formData[field]),
    }));
  };

  const handleFacturaChange = (event) => {
    let value = sanitizeFacturaValue(event.target.value);

    setFieldValue("factura", value);
  };

  const handleComisionChange = (event) => {
    let value = sanitizePercentValue(event.target.value);

    setFieldValue("comision", value);
  };

  const handleMoneyChange = (field) => (event) => {
    let value = sanitizeMoneyDigits(event.target.value);

    if (field === "comisionRecibida") {
      setIsComisionRecibidaManual(true);
    }

    setFieldValue(field, value);
  };

  const hasError = (field) => touched[field] && errors[field];

  const totals = useMemo(
    () =>
      conciliacionesTabla.reduce(
        (acc, row) => {
          acc.primaPlanilla += Number(row?.prima_planilla || 0);
          acc.comisionRecibida += Number(row?.comision_recibida || 0);
          return acc;
        },
        { primaPlanilla: 0, comisionRecibida: 0 },
      ),
    [conciliacionesTabla],
  );

  const handleSubmit = async () => {
    const nextTouched = {
      factura: true,
      comision: true,
      primaPlanilla: true,
      fechaConciliacion: true,
      comisionRecibida: true,
    };

    setTouched(nextTouched);

    const nextErrors = validateForm(formData);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload = {
      factura: formData.factura,
      porcentaje_comision: formData.comision,
      prima_planilla: formData.primaPlanilla,
      fecha_conciliacion: formData.fechaConciliacion,
      comision_recibida: formData.comisionRecibida,
      pago_financiera: formData.pagoFinancieras,
    };

    try {
      const maybePromise = onSubmit(payload);
      let persistedConciliacion = null;

      if (maybePromise && typeof maybePromise.then === "function") {
        const result = await maybePromise;
        if (result === false) {
          return;
        }

        if (result && typeof result === "object") {
          persistedConciliacion = result;
        }
      }

      setConciliacionesTabla((prev) => {
        const nextRow = buildConciliacionRow(
          persistedConciliacion || payload,
          prev.length,
        );
        return [...prev, nextRow];
      });
    } catch (submitError) {
      console.error("Error registrando conciliacion:", submitError);
      return;
    }

    setFormData(buildInitialFormState(poliza));
    setErrors({});
    setTouched({});
    setIsComisionRecibidaManual(false);
  };

  const handleSavePagoFinancieras = async () => {
    if (isSavingPagoFinancieras) {
      return;
    }

    setIsSavingPagoFinancieras(true);
    try {
      const maybePromise = onSavePagosFinancieras({
        pago_financiera: formData.pagoFinancieras || "0",
      });

      if (maybePromise && typeof maybePromise.then === "function") {
        const result = await maybePromise;
        if (result === false) {
          return;
        }
      }

      onClose();
    } catch (error) {
      console.error("Error guardando el pago de las financieras:", error);
    } finally {
      setIsSavingPagoFinancieras(false);
    }
  };

  const baseHeaders = [
    { label: "Cuota", field: "poliza" },
    { label: "# Factura", field: "certificado" },
    { label: "% Comisión", field: "documento_tomador" },
    { label: "Prima planilla", field: "placa" },
    { label: "Fecha conciliación", field: "asistencia" },
    { label: "Comision recibida", field: "prima_sin_iva" },
    { label: "Editar", field: "gastos" },
    { label: "Cuotas", field: "cuotas" },
    { label: "Editar", field: "editar " },
  ];

  const getInputClassName = (field, extraClassName = "") =>
    `text-md border-[1px] w-full text-gray-900 focus:outline-none h-[35px] rounded-md p-2 ${
      hasError(field) ? "border-red-500" : "border-gray-300"
    } ${extraClassName}`;

  const handleAddSeguimiento = async () => {
    const comentarioTrimmed = comentario.trim();
    if (!comentarioTrimmed) {
      return;
    }

    let persistedComment = null;
    try {
      const maybePromise = onSaveComentario({
        comentario: comentarioTrimmed,
        id_conciliacion:
          conciliacionesTabla.length > 0
            ? conciliacionesTabla[conciliacionesTabla.length - 1]?.id
            : null,
      });

      if (maybePromise && typeof maybePromise.then === "function") {
        const result = await maybePromise;
        if (result === false) {
          return;
        }

        if (result && typeof result === "object") {
          persistedComment = result;
        }
      }
    } catch (error) {
      console.error("Error guardando comentario:", error);
      return;
    }

    const timestamp = new Date().toLocaleString("es-CO", {
      dateStyle: "short",
      timeStyle: "short",
    });

    const comentarioToAdd = {
      id_comentario:
        persistedComment?.id_comentario ??
        `tmp-comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      id_conciliacion:
        persistedComment?.id_conciliacion ??
        (conciliacionesTabla.length > 0
          ? conciliacionesTabla[conciliacionesTabla.length - 1]?.id
          : null),
      texto: persistedComment?.comentario || comentarioTrimmed,
      timestamp:
        formatCommentTimestamp(
          persistedComment?.fecha_edicion || persistedComment?.fecha_creacion,
        ) || timestamp,
      usuario:
        persistedComment?.usuario_nombre ||
        `${userData?.nombre || ""} ${userData?.apellido || ""}`.trim() ||
        "Usuario desconocido",
      edit: Number(persistedComment?.editado ?? 0),
    };

    setComentarios((prev) => [...prev, comentarioToAdd]);
    setComentario("");
  };

  const handleEditComentarioClick = (index) => {
    if (editingComentarioIndex !== index) {
      setEditingComentarioIndex(index);
      setEditingComentarioTexto(comentarios[index]?.texto || "");
      return;
    }

    setPendingSaveComentarioIndex(index);
    setIsSaveDialogOpen(true);
  };

  const startEditConciliacionRow = (index) => {
    const row = conciliacionesTabla[index];
    if (!row) {
      return;
    }

    setEditingConciliacionIndex(index);
    setEditingConciliacionDraft({
      factura: sanitizeFacturaValue(String(row.factura ?? "")),
      porcentaje_comision: normalizePercentValue(
        String(row.porcentaje_comision ?? ""),
      ),
      prima_planilla: sanitizeMoneyDigits(String(row.prima_planilla ?? "")),
      fecha_conciliacion: normalizeDateValue(
        String(row.fecha_conciliacion ?? ""),
      ),
      comision_recibida: sanitizeMoneyDigits(
        String(row.comision_recibida ?? ""),
      ),
    });
    setEditingConciliacionErrors({});
  };

  const cancelEditConciliacionRow = () => {
    setEditingConciliacionIndex(null);
    setEditingConciliacionDraft(null);
    setEditingConciliacionErrors({});
  };

  const handleEditConciliacionDraftField = (field, value) => {
    if (!editingConciliacionDraft) {
      return;
    }

    let nextValue = value;
    if (field === "factura") {
      nextValue = sanitizeFacturaValue(value);
    } else if (field === "porcentaje_comision") {
      nextValue = sanitizePercentValue(value);
    } else if (field === "prima_planilla" || field === "comision_recibida") {
      nextValue = sanitizeMoneyDigits(value);
    }

    setEditingConciliacionDraft((prev) => ({
      ...prev,
      [field]: nextValue,
    }));

    setEditingConciliacionErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const saveEditConciliacionRow = async () => {
    if (editingConciliacionIndex === null || !editingConciliacionDraft) {
      return;
    }

    const rowErrors = {
      factura: validateField("factura", editingConciliacionDraft.factura),
      porcentaje_comision: validateField(
        "comision",
        editingConciliacionDraft.porcentaje_comision,
      ),
      prima_planilla: validateField(
        "primaPlanilla",
        editingConciliacionDraft.prima_planilla,
      ),
      fecha_conciliacion: validateField(
        "fechaConciliacion",
        editingConciliacionDraft.fecha_conciliacion,
      ),
      comision_recibida: validateField(
        "comisionRecibida",
        editingConciliacionDraft.comision_recibida,
      ),
    };

    const hasAnyError = Object.values(rowErrors).some((error) => !!error);
    if (hasAnyError) {
      setEditingConciliacionErrors(rowErrors);
      return;
    }

    const currentRow = conciliacionesTabla[editingConciliacionIndex];
    let persistedConciliacion = null;

    if (currentRow?.id && !String(currentRow.id).startsWith("tmp-")) {
      try {
        const maybePromise = onUpdateConciliacion({
          id_conciliacion: currentRow.id,
          factura: editingConciliacionDraft.factura,
          porcentaje_comision: editingConciliacionDraft.porcentaje_comision,
          prima_planilla: editingConciliacionDraft.prima_planilla,
          fecha_conciliacion: editingConciliacionDraft.fecha_conciliacion,
          comision_recibida: editingConciliacionDraft.comision_recibida,
        });

        if (maybePromise && typeof maybePromise.then === "function") {
          const result = await maybePromise;
          if (result === false) {
            return;
          }

          if (result && typeof result === "object") {
            persistedConciliacion = result;
          }
        }
      } catch (error) {
        console.error("Error actualizando conciliacion:", error);
        return;
      }
    }

    setConciliacionesTabla((prev) =>
      prev.map((row, index) =>
        index === editingConciliacionIndex
          ? {
              ...row,
              factura:
                persistedConciliacion?.factura ??
                editingConciliacionDraft.factura,
              porcentaje_comision: normalizePercentValue(
                persistedConciliacion?.porcentaje_comision ??
                  editingConciliacionDraft.porcentaje_comision,
              ),
              prima_planilla:
                sanitizeMoneyDigits(
                  String(
                    persistedConciliacion?.prima_planilla ??
                      editingConciliacionDraft.prima_planilla,
                  ),
                ) || editingConciliacionDraft.prima_planilla,
              fecha_conciliacion:
                persistedConciliacion?.fecha_conciliacion ??
                editingConciliacionDraft.fecha_conciliacion,
              comision_recibida:
                sanitizeMoneyDigits(
                  String(
                    persistedConciliacion?.comision_recibida ??
                      editingConciliacionDraft.comision_recibida,
                  ),
                ) || editingConciliacionDraft.comision_recibida,
            }
          : row,
      ),
    );

    cancelEditConciliacionRow();
  };

  const closeSaveDialog = () => {
    setIsSaveDialogOpen(false);
    setPendingSaveComentarioIndex(null);
  };

  const confirmSaveComentario = async () => {
    if (pendingSaveComentarioIndex === null) {
      closeSaveDialog();
      return;
    }

    const textoActualizado = editingComentarioTexto.trim();
    if (!textoActualizado) {
      closeSaveDialog();
      return;
    }

    const comentarioActual = comentarios[pendingSaveComentarioIndex];
    let updatedComment = null;

    if (comentarioActual?.id_comentario) {
      try {
        const maybePromise = onUpdateComentario({
          id_comentario: comentarioActual.id_comentario,
          comentario: textoActualizado,
        });

        if (maybePromise && typeof maybePromise.then === "function") {
          const result = await maybePromise;
          if (result === false) {
            closeSaveDialog();
            return;
          }

          if (result && typeof result === "object") {
            updatedComment = result;
          }
        }
      } catch (error) {
        console.error("Error actualizando comentario:", error);
        closeSaveDialog();
        return;
      }
    }

    const timestamp = new Date().toLocaleString("es-CO", {
      dateStyle: "short",
      timeStyle: "short",
    });

    setComentarios((prev) =>
      prev.map((item, i) =>
        i === pendingSaveComentarioIndex
          ? {
              ...item,
              texto: updatedComment?.comentario || textoActualizado,
              timestamp:
                formatCommentTimestamp(
                  updatedComment?.fecha_edicion ||
                    updatedComment?.fecha_creacion,
                ) || timestamp,
              edit: Number(updatedComment?.editado ?? 1),
            }
          : item,
      ),
    );

    setEditingComentarioIndex(null);
    setEditingComentarioTexto("");
    closeSaveDialog();
  };

  const razonCancelacionSeleccionada = razonesCancelacion.find(
    (razon) => String(razon?.id_razones ?? "") === String(poliza?.razon_cancelacion ?? ""),
  );

  return (
    <Modal open={open} onClose={handleModalClose}>
      <Box
        className="absolute left-1/2 top-1/2 w-[95%] max-w-6xl -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white"
        sx={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <Box>
          <section className="mb-6 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 shadow-sm">
            <h1 className="text-lg font-semibold text-gray-900">
              Registro de conciliación
            </h1>
            <button
              type="button"
              className="rounded-md px-3 py-1 text-sm text-gray-700 transition hover:bg-gray-200"
              onClick={onClose}
            >
              Cerrar
            </button>
          </section>
          <section className="rounded-3xl bg-white p-6 shadow-lg">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-6 ">
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 mb-1">
                  Numero de póliza
                </p>
                <input
                  className="text-md border-[1px] w-full border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2"
                  value={poliza?.poliza || "N/A"}
                  readOnly
                />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 mb-1">
                  Asistencia
                </p>
                <input
                  className="text-md border-[1px] w-full border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2"
                  value={formatCurrency(poliza?.asistencia)}
                  readOnly
                />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 mb-1">
                  Prima sin iva
                </p>
                <input
                  className="text-md border-[1px] w-full border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2"
                  value={formatCurrency(poliza?.prima_sin_iva)}
                  readOnly
                />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 mb-1">
                  Gastos de expedición
                </p>
                <input
                  className="text-md border-[1px] w-full border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2"
                  value={formatCurrency(poliza?.gastos)}
                  readOnly
                />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 mb-1">
                  Fecha cancelación
                </p>
                <input
                  className="text-md border-[1px] w-full border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2"
                  value={poliza?.fecha_cancelacion || "Pendiente"}
                  readOnly
                />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 mb-1">
                  Razón de cancelación
                </p>
                <input
                  className="text-md border-[1px] w-full border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2"
                  value={razonCancelacionSeleccionada?.razon || "Pendiente"}
                  readOnly
                />
              </div>
              {/* <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 mb-1">
                  Saldo
                </p>
                <input
                  className="text-md border-[1px] w-full border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2"
                  value={formatCurrency(calcSaldo(poliza))}
                  readOnly
                />
              </div> */}
            </div>
            <p className="text-lg font-semibold text-gray-700 mb-4 mt-8">
              Registro conciliación
            </p>
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-6 ">
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 mb-1">
                  # Factura
                </p>
                <input
                  id="factura"
                  className={getInputClassName("factura")}
                  value={formData.factura}
                  onChange={handleFacturaChange}
                  onBlur={() => markTouched("factura")}
                  maxLength={40}
                  autoComplete="off"
                />
                {hasError("factura") ? (
                  <p className="mt-1 text-[11px] text-red-600">
                    {errors.factura}
                  </p>
                ) : null}
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 mb-1">
                  % Comision
                </p>
                <div className="relative">
                  <input
                    id="comision"
                    className={getInputClassName("comision", "pr-8")}
                    value={formData.comision}
                    onChange={handleComisionChange}
                    onBlur={() => markTouched("comision")}
                    autoComplete="off"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    %
                  </span>
                </div>
                {hasError("comision") ? (
                  <p className="mt-1 text-[11px] text-red-600">
                    {errors.comision}
                  </p>
                ) : null}
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 mb-1">
                  Prima planilla
                </p>
                <input
                  id="primaPlanilla"
                  className={getInputClassName("primaPlanilla")}
                  value={displayPrimaPlanilla}
                  onChange={handleMoneyChange("primaPlanilla")}
                  onBlur={() => markTouched("primaPlanilla")}
                  autoComplete="off"
                />
                {hasError("primaPlanilla") ? (
                  <p className="mt-1 text-[11px] text-red-600">
                    {errors.primaPlanilla}
                  </p>
                ) : null}
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 mb-1">
                  Fecha conciliación
                </p>
                <input
                  id="fechaConciliacion"
                  type="date"
                  className={getInputClassName("fechaConciliacion")}
                  value={formData.fechaConciliacion}
                  onChange={(event) =>
                    setFieldValue("fechaConciliacion", event.target.value)
                  }
                  onBlur={() => markTouched("fechaConciliacion")}
                />
                {hasError("fechaConciliacion") ? (
                  <p className="mt-1 text-[11px] text-red-600">
                    {errors.fechaConciliacion}
                  </p>
                ) : null}
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 mb-1">
                  Comisión recibida
                </p>
                <input
                  id="comisionRecibida"
                  className={getInputClassName("comisionRecibida")}
                  value={displayComisionRecibida}
                  onChange={handleMoneyChange("comisionRecibida")}
                  onBlur={() => markTouched("comisionRecibida")}
                  autoComplete="off"
                />
                {hasError("comisionRecibida") ? (
                  <p className="mt-1 text-[11px] text-red-600">
                    {errors.comisionRecibida}
                  </p>
                ) : null}
              </div>
            </div>
            <BtnGeneral
              id="btnRegistrarConciliacion"
              className="mt-6 rounded-md bg-lime-9000 h-10 px-5 py-3 text-sm font-semibold text-white transition duration-300 ease-in-out hover:bg-lime-600"
              funct={handleSubmit}
            >
              Registrar
            </BtnGeneral>

            <div className="mt-8 overflow-x-auto">
              <table className="min-w-full border border-gray-300 text-sm text-gray-700">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-center font-medium">
                      Cuota
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-medium">
                      # Factura
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-medium">
                      % Comisión
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-medium">
                      Prima planilla
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-medium">
                      Fecha conciliación
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-medium">
                      Comision recibida
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-medium">
                      Editar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {conciliacionesTabla.map((row, index) => {
                    const isEditing = editingConciliacionIndex === index;
                    const rowDraft = isEditing
                      ? editingConciliacionDraft
                      : null;

                    return (
                      <tr key={row.id}>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {row.cuota}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {isEditing ? (
                            <input
                              type="text"
                              value={rowDraft?.factura ?? ""}
                              onChange={(event) =>
                                handleEditConciliacionDraftField(
                                  "factura",
                                  event.target.value,
                                )
                              }
                              className={`h-8 w-full rounded border px-2 text-xs focus:outline-none ${
                                editingConciliacionErrors.factura
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                          ) : (
                            row.factura || "-"
                          )}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {isEditing ? (
                            <div className="relative">
                              <input
                                type="text"
                                value={rowDraft?.porcentaje_comision ?? ""}
                                onChange={(event) =>
                                  handleEditConciliacionDraftField(
                                    "porcentaje_comision",
                                    event.target.value,
                                  )
                                }
                                className={`h-8 w-full rounded border px-2 pr-6 text-xs focus:outline-none ${
                                  editingConciliacionErrors.porcentaje_comision
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
                              />
                              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">
                                %
                              </span>
                            </div>
                          ) : row.porcentaje_comision ? (
                            `${row.porcentaje_comision} %`
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {isEditing ? (
                            <input
                              type="text"
                              value={formatMoneyInput(
                                rowDraft?.prima_planilla ?? "",
                              )}
                              onChange={(event) =>
                                handleEditConciliacionDraftField(
                                  "prima_planilla",
                                  event.target.value,
                                )
                              }
                              className={`h-8 w-full rounded border px-2 text-xs focus:outline-none ${
                                editingConciliacionErrors.prima_planilla
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                          ) : (
                            formatNegativeMoneyTable(row.prima_planilla)
                          )}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {isEditing ? (
                            <input
                              type="date"
                              value={rowDraft?.fecha_conciliacion ?? ""}
                              onChange={(event) =>
                                handleEditConciliacionDraftField(
                                  "fecha_conciliacion",
                                  event.target.value,
                                )
                              }
                              className={`h-8 w-full rounded border px-2 text-xs focus:outline-none ${
                                editingConciliacionErrors.fecha_conciliacion
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                          ) : (
                            row.fecha_conciliacion
                          )}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {isEditing ? (
                            <input
                              type="text"
                              value={formatMoneyInput(
                                rowDraft?.comision_recibida ?? "",
                              )}
                              onChange={(event) =>
                                handleEditConciliacionDraftField(
                                  "comision_recibida",
                                  event.target.value,
                                )
                              }
                              className={`h-8 w-full rounded border px-2 text-xs focus:outline-none ${
                                editingConciliacionErrors.comision_recibida
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                          ) : (
                            formatNegativeMoneyTable(row.comision_recibida)
                          )}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                className="rounded bg-lime-600 px-2 py-1 text-xs font-semibold text-white hover:bg-lime-700"
                                onClick={saveEditConciliacionRow}
                              >
                                Guardar
                              </button>
                              <button
                                type="button"
                                className="rounded border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                                onClick={cancelEditConciliacionRow}
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="rounded bg-lime-500 px-3 py-1 text-xs font-semibold text-white hover:bg-lime-600"
                              onClick={() => startEditConciliacionRow(index)}
                            >
                              Editar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td
                      className="border border-gray-300 px-3 py-2 text-right"
                      colSpan={3}
                    >
                      Total
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {formatNegativeMoneyTable(totals.primaPlanilla)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      -
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {formatNegativeMoneyTable(totals.comisionRecibida)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      -
                    </td>
                  </tr>
                </tfoot>
              </table>
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 mb-1 mt-4">
                  Pagos financieras:
                </p>
                <input
                  id="pagoFinancieras"
                  className={getInputClassName("pagoFinancieras")}
                  value={displayPagoFinancieras}
                  onChange={handleMoneyChange("pagoFinancieras")}
                  onBlur={() => {
                    const minVal = sanitizeMoneyDigits(poliza?.pagos_financieras_con ?? "");
                    if (minVal && Number(minVal) > 0 && Number(formData.pagoFinancieras || 0) < Number(minVal)) {
                      setFieldValue("pagoFinancieras", minVal);
                    }
                  }}
                  autoComplete="off"
                />
              </div>
            </div>

            <section id="secComentarios" className="mt-10">
              <label htmlFor="agregarComentario">
                <b>Agregar seguimiento:</b>
              </label>
              <div className="flex flex-row gap-6 mt-2" id="divComentarios">
                <div className="flex flex-col" style={{ width: "50%" }}>
                  <input
                    type="text"
                    name="agregarComentario"
                    id="agregarComentario"
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    className={getInputClassName("agregarComentario") + " pr-8"}
                  />
                  <BtnGeneral
                    id="btnAgregarSeguimiento"
                    className="mt-6 rounded-md bg-lime-9000 h-10 px-5 py-3 text-sm font-semibold text-white transition duration-300 ease-in-out hover:bg-lime-600 w-[30%]"
                    funct={handleAddSeguimiento}
                  >
                    Agregar
                  </BtnGeneral>
                </div>
                <div className="flex flex-col w-[75%]">
                  <div
                    name="comentarioTA"
                    id="comentarioTA"
                    className="text-md border-[1px] w-full border-gray-300 text-gray-900 focus:outline-none rounded-md p-5 h-[250px] overflow-y-auto overflow-x-hidden"
                  >
                    {comentarios.length === 0 ? (
                      <p className="text-gray-500 italic">
                        No hay seguimientos registrados.
                      </p>
                    ) : (
                      comentarios.map((comentario, index) => (
                        <div
                          key={index}
                          className="mb-2 flex flex-row items-start justify-between rounded-md border border-gray-300 p-3"
                        >
                          <p className="min-w-0 flex-1 pr-3 text-gray-900">
                            <textarea
                              id={`comentario-${index}`}
                              ref={(element) => {
                                if (element) {
                                  comentarioInputRefs.current[index] = element;
                                } else {
                                  delete comentarioInputRefs.current[index];
                                }
                              }}
                              type="text"
                              value={
                                editingComentarioIndex === index
                                  ? editingComentarioTexto
                                  : comentario.texto
                              }
                              readOnly={editingComentarioIndex !== index}
                              onChange={(event) => {
                                if (editingComentarioIndex === index) {
                                  setEditingComentarioTexto(event.target.value);
                                }
                              }}
                              rows={editingComentarioIndex === index ? 2 : 2}
                              className={`w-full resize-none rounded-md bg-transparent px-2 py-1 text-sm leading-5 whitespace-pre-wrap break-words ${
                                editingComentarioIndex === index
                                  ? "border border-lime-500"
                                  : "border-none"
                              }`}
                            />
                            <br />
                            <span className="text-xs text-gray-500">
                              {comentario.usuario} - {comentario.timestamp}
                            </span>
                          </p>
                          <BtnGeneral
                            id={`btnEditarComentario-${index}`}
                            className="mt-2 flex items-center justify-center rounded-md bg-lime-9000 h-8 w-8 text-xs font-semibold text-white transition duration-300 ease-in-out hover:bg-lime-600"
                            funct={() => handleEditComentarioClick(index)}
                          >
                            {editingComentarioIndex === index ? (
                              <BsFloppy2Fill
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            ) : (
                              <FaPen
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            )}
                          </BtnGeneral>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <BtnGeneral
                      id="btnGuardarPagoFinancieras"
                      className="rounded-md bg-lime-9000 h-10 px-8 py-3 text-sm font-semibold text-white transition duration-300 ease-in-out hover:bg-lime-600"
                      funct={handleSavePagoFinancieras}
                      isDisabled={isSavingPagoFinancieras}
                    >
                      {isSavingPagoFinancieras ? "Guardando..." : "Guardar"}
                    </BtnGeneral>
                  </div>
                </div>
              </div>
            </section>

            <Modal open={isSaveDialogOpen} onClose={closeSaveDialog}>
              <Box className="absolute left-1/2 top-1/2 w-[92%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-gray-900 text-center">
                  Guardar cambios
                </h2>
                <p className="mt-4 text-center text-sm text-gray-600">
                  ¿Deseas guardar la edicion del seguimiento?
                </p>
                <div className="mt-5 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={closeSaveDialog}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmSaveComentario}
                    className="rounded-md bg-lime-9000 px-4 py-2 text-sm font-semibold text-white hover:bg-lime-600"
                  >
                    Guardar
                  </button>
                </div>
              </Box>
            </Modal>

            {/* <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
              Esta vista queda lista como punto de entrada para el flujo de registro
              de conciliación. La navegación ya envía la fila seleccionada desde la
              consulta.
            </div> */}
          </section>
        </Box>
      </Box>
    </Modal>
  );
};
