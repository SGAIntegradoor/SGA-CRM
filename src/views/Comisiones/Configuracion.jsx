import { useState, useEffect, useContext } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import Select from "react-select";
import Swal from "sweetalert2";
import { EditNoteOutlined } from "@mui/icons-material";
import Loader from "../../components/LoaderFullScreen/Loader";
import { obtenerAseguradoras, obtenerRamo } from "../../utils/aseguradoras";
import { getUnidadesNegocio } from "../../services/Polizas/getUnidadNegocio";
import { TablaConfigCom } from "./Table/Tabla";
import { TablaSMMLV } from "./Table/TablaSMMLV";
import { saveParamComission } from "../../services/Comisiones/saveParamComission";
import { getAllParams } from "../../services/Comisiones/getAllParams";
import { getAllSMMLV } from "../../services/Comisiones/getAllSMMLV";
import { updateParam } from "../../services/Comisiones/uploadParam";
import { obtainYears } from "../../services/Comisiones/obtainYears";
import { saveSMMLV } from "../../services/Comisiones/saveSMMLV";
import { updateSMMLV } from "../../services/Comisiones/updateSMMLV";

export const ConfigComisiones = ({ setLoading, loading }) => {
  const initialFieldErrors = {
    unidad_negocio: false,
    ramo: false,
    aseguradora: false,
    tipo_expedicion: false,
    aplica_sobre: false,
    valor_comision: false,
    observaciones: false,
    anio_smmlv: false,
    fch_ini_vig: false,
    fch_fin_vig: false,
    valor_smmlv: false,
    estado_smmlv: false,
  };

  const initialSMMLVState = {
    id_config_smmlv: "",
    anio_smmlv: "",
    fch_ini_vig: "",
    fch_fin_vig: "",
    valor_smmlv: "",
    estado: "",
  };

  const [paramsComisiones, setParamsComisiones] = useState({
    unidad_negocio: "",
    ramo: [],
    aseguradora: [],
    tipo_expedicion: [],
    aplica_sobre: "",
    valor_comision: "",
    observaciones: "",
  });

  const [aseguradoras, setAseguradoras] = useState([]);
  const [ramos, setRamos] = useState([]);
  const [unidadesNegocio, setUnidadesNegocio] = useState([]);
  const [fieldErrors, setFieldErrors] = useState(initialFieldErrors);

  const [params, setParams] = useState([]);
  const [editSourceRow, setEditSourceRow] = useState(null);
  const [editParamsComisiones, setEditParamsComisiones] = useState({
    unidad_negocio: "",
    ramo: [],
    aseguradora: [],
    tipo_expedicion: [],
    aplica_sobre: "",
    valor_comision: "",
    observaciones: "",
  });
  const [sMMLV, setSMMLV] = useState(initialSMMLVState);
  const [smmlvRecords, setSmmlvRecords] = useState([]);
  const [editSMMLVSourceRow, setEditSMMLVSourceRow] = useState(null);
  const [years, setYears] = useState([]);

  const userData = JSON.parse(localStorage.getItem("userData"));
  const [modalEdit, setModalEdit] = useState(false);
  const [reloadScreen, setReloadScreen] = useState(false);

  const tipoExpedicionOptions = [
    { value: "10", label: "Todos" },
    { value: "1", label: "Nueva" },
    { value: "2", label: "Renovación" },
    { value: "3", label: "Modificación" },
    { value: "4", label: "Cancelación" },
  ];

  const aplicaSobreOptions = [
    { value: "1", label: "Prima sin iva" },
    { value: "2", label: "Prima sin iva + asistencias" },
    { value: "3", label: "Prima sin iva + gastos expedición" },
  ];

  const estadoSMMLVOptions = [
    { value: "1", label: "Activo" },
    { value: "0", label: "No activo" },
  ];

  const currentUserName =
    userData?.nombre_completo ||
    [userData?.nombres, userData?.apellidos].filter(Boolean).join(" ") ||
    userData?.nombre ||
    userData?.usuario ||
    "";

  const parseStoredArray = (rawValue) => {
    if (Array.isArray(rawValue)) return rawValue.map((v) => String(v));
    if (rawValue === null || rawValue === undefined || rawValue === "")
      return [];

    try {
      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed)) {
        return parsed.flatMap((item) =>
          String(item)
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
        );
      }

      return [String(parsed)];
    } catch {
      return String(rawValue)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    }
  };

  const mapValuesToOptions = (values = [], options = []) =>
    values
      .map(
        (value) =>
          options.find((opt) => String(opt.value) === String(value)) || {
            value: String(value),
            label: String(value),
          },
      )
      .filter(Boolean);

  const buildEditFormFromRow = (row) => {
    if (!row) return null;

    return {
      unidad_negocio: String(row.unidad_negocio ?? ""),
      ramo: mapValuesToOptions(parseStoredArray(row.ramo), ramos),
      aseguradora: mapValuesToOptions(
        parseStoredArray(row.aseguradora),
        aseguradoras,
      ),
      tipo_expedicion: mapValuesToOptions(
        parseStoredArray(row.tipo_expedicion),
        tipoExpedicionOptions,
      ),
      aplica_sobre: String(row.aplica_sobre ?? ""),
      valor_comision:
        row.valor_comision === null || row.valor_comision === undefined
          ? ""
          : String(row.valor_comision),
      observaciones: row.observaciones || "",
    };
  };

  const normalizeDateForInput = (value) => {
    if (!value) return "";

    const rawValue = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) return rawValue;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawValue)) {
      const [day, month, year] = rawValue.split("/");
      return `${year}-${month}-${day}`;
    }

    const parsed = new Date(rawValue);
    if (Number.isNaN(parsed.getTime())) return "";

    const year = parsed.getFullYear();
    const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
    const day = `${parsed.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatCurrencyInput = (value) => {
    const digits = String(value ?? "").replace(/\D/g, "");
    if (!digits) return "";

    return `$ ${Number(digits).toLocaleString("es-CO")}`;
  };

  const parseCurrencyInput = (value) => {
    const digits = String(value ?? "").replace(/\D/g, "");
    return digits ? Number(digits) : 0;
  };

  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, "0");
    const day = `${now.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getSMMLVRowId = (row) =>
    row?.id_config_smmlv ??
    row?.id_smmlv ??
    row?.id ??
    null;

  const normalizeSMMLVRows = (response) => {
    const rawData = response?.result ?? response?.data ?? response ?? [];
    const rows = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.data)
        ? rawData.data
        : [];

    return rows.map((row) => ({
      ...row,
      id_config_smmlv: getSMMLVRowId(row),
      anio_smmlv: String(row.id_anio_smmlv ?? row.anio_smmlv ?? row.anio ?? ""),
      fch_ini_vig: normalizeDateForInput(
        row.fch_ini_vig ?? row.fecha_inicio_vigencia ?? row.vigencia_desde,
      ),
      fch_fin_vig: normalizeDateForInput(
        row.fch_fin_vig ?? row.fecha_fin_vigencia ?? row.vigencia_hasta,
      ),
      valor_smmlv: String(row.valor_smmlv ?? row.valor ?? ""),
      estado: String(row.estado ?? row.estado_smmlv ?? ""),
      fecha_creacion: normalizeDateForInput(
        row.fecha_creacion ?? row.fch_creacion ?? getCurrentDate(),
      ),
      usuario_creador:
        row.usuario_creador ??
        row.nombre_usuario_creador ??
        row.nombre_usuario ??
        row.usuario ??
        row.id_usu_creador ??
        currentUserName,
    }));
  };

  const buildSMMLVFormFromRow = (row) => {
    if (!row) return initialSMMLVState;
    console.log(row)
    console.log({
      anio_smmlv: String(row.id_anio_smmlv ?? row.anio_smmlv ?? row.anio ?? ""),
      fch_ini_vig: normalizeDateForInput(
        row.fch_ini_vig ?? row.fecha_inicio_vigencia ?? row.vigencia_desde ?? row.vig_desde,
      ),
      fch_fin_vig: normalizeDateForInput(
        row.fch_fin_vig ?? row.fecha_fin_vigencia ?? row.vigencia_hasta ?? row.vig_hasta,
      ),
      valor_smmlv: formatCurrencyInput(row.valor_smmlv ?? row.valor ?? ""),
      estado: String(row.estado ?? row.estado_smmlv ?? ""),
    })
    return {
      id_config_smmlv : row.id_config_smmlv ?? null,
      anio_smmlv: String(row.id_anio_smmlv ?? row.anio_smmlv ?? row.anio ?? ""),
      fch_ini_vig: normalizeDateForInput(
        row.vig_desde ?? row.fch_ini_vig ?? row.fecha_inicio_vigencia ?? row.vigencia_desde ,
      ),
      fch_fin_vig: normalizeDateForInput(
        row.vig_hasta ?? row.fch_fin_vig ?? row.fecha_fin_vigencia ?? row.vigencia_hasta,
      ),
      valor_smmlv: formatCurrencyInput(row.valor_smmlv ?? row.valor ?? ""),
      estado: String(row.estado ?? row.estado_smmlv ?? ""),
    };
  };

  const resetSMMLVForm = () => {
    setSMMLV(initialSMMLVState);
    setEditSMMLVSourceRow(null);
  };

  const handleGetAseguradoras = async () => {
    const aseguradoras = await obtenerAseguradoras();
    const hasTodas = aseguradoras.some((item) => String(item.value) === "100");
    setAseguradoras(
      hasTodas
        ? aseguradoras
        : [{ label: "Todas", value: "100" }, ...aseguradoras],
    );
  };

  const handleYearSMMLV = async () => {
    const years = await obtainYears();
    setYears(years);
  };

  const handleGetRamos = async () => {
    const ramos = await obtenerRamo();
    setRamos(ramos);
  };

  const handleGetUnidadesNegocio = async () => {
    const unidadesnegocio = await getUnidadesNegocio();
    setUnidadesNegocio(unidadesnegocio);
  };

  const handleGetAllParams = async () => {
    const params = await getAllParams();
    setParams(params);
  };

  const handleGetAllSMMLV = async () => {
    const response = await getAllSMMLV();
    setSmmlvRecords(normalizeSMMLVRows(response));
  };

  const handleEditParam = async (id) => {
    const row = (params || []).find(
      (item) => String(item.id_param_comision ?? item.id_param) === String(id),
    );

    if (!row) {
      Swal.fire({
        icon: "error",
        title: "No encontrado",
        text: "No se encontró el registro para editar",
      });
      return;
    }

    setEditSourceRow(row);
    const prefilled = buildEditFormFromRow(row);
    if (prefilled) setEditParamsComisiones(prefilled);
    setModalEdit(true);
  };
  const chargeData = async () => {
    setLoading(true);
    await Promise.all([
      handleGetAseguradoras(),
      handleGetRamos(),
      handleGetUnidadesNegocio(),
      handleYearSMMLV(),
    ]);
    await Promise.all([handleGetAllParams(), handleGetAllSMMLV()
        ]);
    setLoading(false);
  };

  const stylesSingleLine = {
    control: (base) => ({
      ...base,
      minHeight: 35,
    }),
    valueContainer: (base) => ({
      ...base,
      flexWrap: "nowrap", // ⬅️ no permitir salto de línea
      overflowX: "auto", // ⬅️ scroll horizontal
      scrollbarWidth: "none", // Firefox
      msOverflowStyle: "none", // IE/Edge
      WebkitOverflowScrolling: "touch",
    }),
    indicatorsContainer: (base) => ({
      ...base,
      display: "flex",
      flexShrink: 0, // que no se comprima la zona de iconos
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
    }),
    multiValue: (base) => ({
      ...base,
      marginRight: 0,
      whiteSpace: "nowrap", // evita que un chip se parta
    }),
  };

  useEffect(() => {
    chargeData();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!modalEdit || !editSourceRow) return;
    const prefilled = buildEditFormFromRow(editSourceRow);
    if (prefilled) setEditParamsComisiones(prefilled);
    setLoading(false);
  }, [modalEdit, editSourceRow, ramos, aseguradoras]);

  const headers = [
    { field: "id_param", header: "ID" },
    { field: "unidad_negocio", header: "Unidad de Negocio" },
    { field: "tipo_expedicion", header: "Tipo expedición" },
    { field: "ramo", header: "Ramo(s)" },
    { field: "aseguradora", header: "Compañia(s)" },
    { field: "aplica_sobre", header: "Aplica sobre" },
    { field: "valor_comision", header: "Valor comisión" },
    { field: "observaciones", header: "Observaciones" },
  ];

  // ajustat width del select a 100px

  const customStyles = {
    control: (base) => ({
      ...base,
      minHeight: 30,
      height: 37.33,
      width: "100%",
      color: "text-gray-400",
      fontSize: 14,
    }),
    dropdownIndicator: (base) => ({
      ...base,
      paddingTop: 4,
      paddingRight: 0,
      color: "text-gray-400",
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
      color: "text-gray-400",
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
      color: "text-gray-400",
    }),
    valueContainer: (base) => ({
      ...base,
      paddingRight: 4, // evita que la “x” empuje el texto
      width: "50%",
      color: "text-gray-400",
    }),
  };

  const getSingleSelectStyles = (hasError) => ({
    ...customStyles,
    control: (base, state) => ({
      ...customStyles.control(base),
      border: hasError ? "1px solid #ef4444 !important" : base.border,
      "&:hover": {
        border: hasError ? "1px solid #ef4444" : base.border,
      },
    }),
  });

  const getMultiSelectStyles = (hasError) => ({
    ...stylesSingleLine,
    control: (base, state) => ({
      ...stylesSingleLine.control(base),
      border: hasError ? "1px solid #ef4444" : base.border,
      "&:hover": {
        border: hasError ? "1px solid #ef4444" : base.border,
      },
    }),
  });

  const withModalPortalStyles = (baseStyles) => ({
    ...baseStyles,
    menuPortal: (base) => ({
      ...base,
      zIndex: 2000,
    }),
    menu: (base) => ({
      ...(baseStyles.menu ? baseStyles.menu(base) : base),
      zIndex: 2000,
    }),
  });

  const modalSelectProps = {
    menuPortalTarget: typeof document !== "undefined" ? document.body : null,
    menuPosition: "fixed",
  };

  const clearFieldError = (field) => {
    setFieldErrors((prev) =>
      prev[field]
        ? {
            ...prev,
            [field]: false,
          }
        : prev,
    );
  };

  const normalizeAndSortMultiValues = (selectedOptions = []) => {
    const normalized = selectedOptions
      .flatMap((item) =>
        String(item?.value ?? "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      )
      .map((value) => String(value));

    const uniqueValues = [...new Set(normalized)];

    return uniqueValues.sort((a, b) => {
      const aNum = Number(a);
      const bNum = Number(b);
      const aIsNum = Number.isFinite(aNum);
      const bIsNum = Number.isFinite(bNum);

      if (aIsNum && bIsNum) return aNum - bNum;
      return a.localeCompare(b);
    });
  };

  const handleEditSMMLV = (row) => {
    setEditSMMLVSourceRow(row);
    setSMMLV(buildSMMLVFormFromRow(row));
    setFieldErrors(initialFieldErrors);
  };

  const handleGuardarSMMLV = async () => {
    if (loading) return;

    const errores = [];
    const currentFieldErrors = { ...initialFieldErrors };
    const valorNumerico = parseCurrencyInput(sMMLV.valor_smmlv);

    if (!sMMLV.anio_smmlv) {
      errores.push("Año SMMLV es requerido");
      currentFieldErrors.anio_smmlv = true;
    }

    if (!sMMLV.fch_ini_vig) {
      errores.push("La fecha inicio de vigencia es requerida");
      currentFieldErrors.fch_ini_vig = true;
    }

    if (!sMMLV.fch_fin_vig) {
      errores.push("La fecha fin de vigencia es requerida");
      currentFieldErrors.fch_fin_vig = true;
    }

    if (
      sMMLV.fch_ini_vig &&
      sMMLV.fch_fin_vig &&
      sMMLV.fch_ini_vig > sMMLV.fch_fin_vig
    ) {
      errores.push(
        "La fecha fin de vigencia debe ser mayor o igual a la fecha inicial",
      );
      currentFieldErrors.fch_ini_vig = true;
      currentFieldErrors.fch_fin_vig = true;
    }

    if (!valorNumerico) {
      errores.push("El valor SMMLV es requerido");
      currentFieldErrors.valor_smmlv = true;
    }

    if (!sMMLV.estado) {
      errores.push("El estado es requerido");
      currentFieldErrors.estado_smmlv = true;
    }

    if (errores.length > 0) {
      setFieldErrors(currentFieldErrors);
      const erroresHtml = `<ul style="text-align:left; margin:0; padding-left:1.25rem;">${errores
        .map((error) => `<li>${error}</li>`)
        .join("")}</ul>`;

      await Swal.fire({
        icon: "warning",
        title: "Campos requeridos",
        html: erroresHtml,
        confirmButtonText: "Entendido",
      });
      return;
    }

    try {
      setLoading(true);

      const selectedYear = years.find(
        (option) => String(option.value) === String(sMMLV.anio_smmlv),
      );

      const payload = {
        id_config_smmlv: getSMMLVRowId(editSMMLVSourceRow),
        id_anio_smmlv: String(sMMLV.anio_smmlv),
        anio_smmlv: String(selectedYear?.label ?? sMMLV.anio_smmlv),
        fch_ini_vig: sMMLV.fch_ini_vig,
        fch_fin_vig: sMMLV.fch_fin_vig,
        valor_smmlv: valorNumerico,
        estado: String(sMMLV.estado),
        fecha_creacion: editSMMLVSourceRow?.fecha_creacion ?? getCurrentDate(),
        id_usuario: String(userData?.id_usuario ?? ""),
        id_usuario_creador: String(
          editSMMLVSourceRow?.id_usuario_creador ?? userData?.id_usuario ?? "",
        ),
      };

      const response = editSMMLVSourceRow
        ? await updateSMMLV(payload)
        : await saveSMMLV(payload);

      const normalizedResponse = await response?.result ?? response;
      const status =
        normalizedResponse?.status ??
        response?.status ??
        response?.data?.status ??
        null;

      if (String(status).toLowerCase() !== "ok") {
        throw new Error(
          normalizedResponse?.message ||
            response?.message ||
            "No se pudo guardar la configuración de SMMLV",
        );
      }

      await handleGetAllSMMLV();
      resetSMMLVForm();
      setFieldErrors(initialFieldErrors);
      setLoading(false);
      Swal.fire({
        icon: "success",
        title: editSMMLVSourceRow
          ? "Actualización exitosa"
          : "Guardado exitoso",
        text: editSMMLVSourceRow
          ? "La configuración de SMMLV fue actualizada correctamente"
          : "La configuración de SMMLV fue guardada correctamente",
        confirmButtonText: "Aceptar",
      });
    } catch (error) {
      console.error("Error al guardar SMMLV:", error);
      await Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text:
          error?.message ||
          "Ocurrió un error inesperado al guardar la configuración de SMMLV",
        confirmButtonText: "Cerrar",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarCambiosEditados = async () => {
    if (loading) return;

    if (!editSourceRow) {
      await Swal.fire({
        icon: "error",
        title: "No encontrado",
        text: "No se encontró el registro para actualizar",
      });
      return;
    }

    const errores = [];

    if (!editParamsComisiones.unidad_negocio)
      errores.push("Unidad de negocio es requerida");
    if (!editParamsComisiones.ramo || editParamsComisiones.ramo.length === 0)
      errores.push("Selecciona al menos un Ramo");
    if (
      !editParamsComisiones.aseguradora ||
      editParamsComisiones.aseguradora.length === 0
    )
      errores.push("Selecciona al menos una Aseguradora");
    if (
      !editParamsComisiones.tipo_expedicion ||
      editParamsComisiones.tipo_expedicion.length === 0
    )
      errores.push("Selecciona al menos un Tipo de expedición");
    if (!editParamsComisiones.aplica_sobre)
      errores.push("Aplica sobre es requerida");
    if (!editParamsComisiones.valor_comision) {
      errores.push("Valor comisión es requerida");
    } else if (
      isNaN(editParamsComisiones.valor_comision) ||
      parseFloat(editParamsComisiones.valor_comision) < 0
    ) {
      errores.push("Valor comisión debe ser un número válido");
    }

    if (errores.length > 0) {
      const erroresHtml = `<ul style="text-align:left; margin:0; padding-left:1.25rem;">${errores
        .map((error) => `<li>${error}</li>`)
        .join("")}</ul>`;

      await Swal.fire({
        icon: "warning",
        title: "Campos requeridos",
        html: erroresHtml,
        confirmButtonText: "Entendido",
      });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        id_param:
          editSourceRow.id_param_comision ?? editSourceRow.id_param ?? "",
        unidad_negocio: String(editParamsComisiones.unidad_negocio ?? ""),
        ramo: normalizeAndSortMultiValues(editParamsComisiones.ramo),
        aseguradora: normalizeAndSortMultiValues(
          editParamsComisiones.aseguradora,
        ),
        tipo_expedicion: normalizeAndSortMultiValues(
          editParamsComisiones.tipo_expedicion,
        ),
        aplica_sobre: String(editParamsComisiones.aplica_sobre ?? ""),
        valor_comision: parseFloat(editParamsComisiones.valor_comision),
        observaciones: String(editParamsComisiones.observaciones ?? "").trim(),
        id_usuario: String(userData?.id_usuario ?? ""),
        id_usuario_creador: String(
          editSourceRow.id_usuario_creador ?? userData?.id_usuario ?? "",
        ),
      };

      const response = await updateParam(payload);
      const normalizedResponse = response?.result ?? response;
      const status =
        normalizedResponse?.status ??
        response?.status ??
        response?.data?.status ??
        null;
      const isOk =
        String(status).toLowerCase() === "ok" ||
        normalizedResponse === true ||
        response === true;

      if (!isOk) {
        throw new Error(
          normalizedResponse?.message ||
            response?.message ||
            "No se pudo actualizar",
        );
      }

      setEditSourceRow(null);
      await handleGetAllParams();
      setModalEdit(false);
      setLoading(false);
      Swal.fire({
        icon: "success",
        title: "Actualización exitosa",
        text: "Los cambios se guardaron correctamente",
        confirmButtonText: "Aceptar",
      });
    } catch (error) {
      console.error("Error al actualizar:", error);
      await Swal.fire({
        icon: "error",
        title: "Error al actualizar",
        text: error?.message || "Ocurrió un error inesperado",
        confirmButtonText: "Cerrar",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarComisiones = async () => {
    if (loading) return;

    // Validación completa del formulario
    const errores = [];
    const currentFieldErrors = { ...initialFieldErrors };

    // Validar unidad_negocio
    if (!paramsComisiones.unidad_negocio) {
      errores.push("Unidad de negocio es requerida");
      currentFieldErrors.unidad_negocio = true;
    }

    // Validar ramo (multi-select)
    if (!paramsComisiones.ramo || paramsComisiones.ramo.length === 0) {
      errores.push("Selecciona al menos un Ramo");
      currentFieldErrors.ramo = true;
    }

    // Validar aseguradora (multi-select)
    if (
      !paramsComisiones.aseguradora ||
      paramsComisiones.aseguradora.length === 0
    ) {
      errores.push("Selecciona al menos una Aseguradora");
      currentFieldErrors.aseguradora = true;
    }

    // Validar tipo_expedicion (multi-select)
    if (
      !paramsComisiones.tipo_expedicion ||
      paramsComisiones.tipo_expedicion.length === 0
    ) {
      errores.push("Selecciona al menos un Tipo de expedición");
      currentFieldErrors.tipo_expedicion = true;
    }

    // Validar aplica_sobre
    if (!paramsComisiones.aplica_sobre) {
      errores.push("Aplica sobre es requerida");
      currentFieldErrors.aplica_sobre = true;
    }

    // Validar valor_comision
    if (!paramsComisiones.valor_comision) {
      errores.push("Valor comisión es requerida");
      currentFieldErrors.valor_comision = true;
    } else if (
      isNaN(paramsComisiones.valor_comision) ||
      parseFloat(paramsComisiones.valor_comision) < 0
    ) {
      errores.push("Valor comisión debe ser un número válido");
      currentFieldErrors.valor_comision = true;
    }

    // Validar observaciones (opcional, pero si está vacío se muestra advertencia)
    // if (!paramsComisiones.observaciones.trim()) {
    //   errores.push("Observaciones es requerida");
    // }

    // Si hay errores, mostrarlos y retornar
    if (errores.length > 0) {
      setFieldErrors(currentFieldErrors);
      const erroresHtml = `<ul style="text-align:left; margin:0; padding-left:1.25rem;">${errores
        .map((error) => `<li>${error}</li>`)
        .join("")}</ul>`;

      await Swal.fire({
        icon: "warning",
        title: "Campos requeridos",
        html: erroresHtml,
        confirmButtonText: "Entendido",
      });
      return;
    }

    try {
      setLoading(true);

      // Extraer y ordenar valores de los multi-selects
      const ramoIds = normalizeAndSortMultiValues(paramsComisiones.ramo);
      const aseguradoraIds = normalizeAndSortMultiValues(
        paramsComisiones.aseguradora,
      );
      const tipoExpedicionIds = normalizeAndSortMultiValues(
        paramsComisiones.tipo_expedicion,
      );

      // Construir payload
      const payload = {
        unidad_negocio: paramsComisiones.unidad_negocio,
        ramo: ramoIds,
        aseguradora: aseguradoraIds,
        tipo_expedicion: tipoExpedicionIds,
        aplica_sobre: paramsComisiones.aplica_sobre,
        valor_comision: parseFloat(paramsComisiones.valor_comision),
        observaciones: paramsComisiones.observaciones.trim(),
        id_usuario: userData?.id_usuario || "",
      };
      const response = await saveParamComission(payload);

      if (response.status !== "Ok") {
        setLoading(false);
        throw new Error(response.message || "Error al guardar los parámetros");
      }
      await handleGetAllParams();
      const result = response.data;

      // Apagamos loader antes del modal para evitar que bloquee la confirmación
      setLoading(false);

      // Mostrar éxito y limpiar formulario
      await Swal.fire({
        icon: "success",
        title: "Guardado exitoso",
        text: "Parámetros guardados exitosamente",
        confirmButtonText: "Aceptar",
      });
      // Resetear formulario
      setParamsComisiones({
        unidad_negocio: "",
        ramo: [],
        aseguradora: [],
        tipo_expedicion: [],
        aplica_sobre: "",
        valor_comision: "",
        observaciones: "",
      });
      setFieldErrors(initialFieldErrors);

      // Recargar tabla si es necesario
      setReloadScreen(!reloadScreen);
    } catch (error) {
      console.error("Error al guardar:", error);
      setLoading(false);
      await Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text: error.message || "Ocurrió un error inesperado",
        confirmButtonText: "Cerrar",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* <HeaderPage title={"Clientes"} /> */}
      <Loader isLoading={loading} />

      <Box padding={3}>
        <section className="shadow-lg rounded-3xl xl:w-full lg:w-full">
          <div className="flex flex-row gap-3 items-center bg-gray-200 p-3 rounded-t-3xl border-gray-400 border">
            <EditNoteOutlined sx={{ fontSize: 30 }} />
            <p className="text-lg">Parametrización para liquidar comisiones</p>
          </div>
          <div className="flex flex-col gap-5 p-8 rounded-b-3xl border-l border-r border-b border-gray-400">
            {/* Fila 1: 4 columnas iguales */}
            <div className="grid grid-cols-4 gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[13px]">
                  Unidad de negocio
                </label>
                <Select
                  name="unidad_negocio"
                  id="unidad_negocio"
                  className="text-sm text-gray-500"
                  options={unidadesNegocio}
                  isClearable
                  value={
                    unidadesNegocio.find(
                      (opt) => opt.value === paramsComisiones.unidad_negocio,
                    ) || null
                  }
                  onChange={(selectedOption) => (
                    clearFieldError("unidad_negocio"),
                    setParamsComisiones((prev) => ({
                      ...prev,
                      unidad_negocio: selectedOption?.value ?? "",
                    }))
                  )}
                  placeholder=""
                  styles={getSingleSelectStyles(fieldErrors.unidad_negocio)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[13px]">Ramo(s)</label>
                <Select
                  name="ramo"
                  options={ramos}
                  isClearable
                  isMulti
                  value={paramsComisiones.ramo}
                  onChange={(selectedOptions) => (
                    clearFieldError("ramo"),
                    setParamsComisiones((prev) => ({
                      ...prev,
                      ramo: selectedOptions || [],
                    }))
                  )}
                  placeholder=""
                  styles={getMultiSelectStyles(fieldErrors.ramo)}
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[13px]">
                  Aseguradora(s)
                </label>
                <Select
                  name="aseguradora"
                  options={aseguradoras}
                  isClearable
                  isMulti
                  value={paramsComisiones.aseguradora}
                  onChange={(selectedOptions) => {
                    clearFieldError("aseguradora");
                    const selected = selectedOptions || [];
                    const hasTodas = selected.some(
                      (opt) => opt.value === "100",
                    );
                    setParamsComisiones((prev) => ({
                      ...prev,
                      aseguradora: hasTodas
                        ? [aseguradoras.find((o) => o.value === "100")].filter(
                            Boolean,
                          )
                        : selected,
                    }));
                  }}
                  isOptionDisabled={(option) => {
                    const hasTodas = paramsComisiones.aseguradora.some(
                      (opt) => opt.value === "100",
                    );
                    const hasOtras = paramsComisiones.aseguradora.some(
                      (opt) => opt.value !== "100",
                    );
                    if (hasTodas && option.value !== "100") return true;
                    if (hasOtras && option.value === "100") return true;
                    return false;
                  }}
                  placeholder=""
                  styles={getMultiSelectStyles(fieldErrors.aseguradora)}
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[13px]">
                  Tipo expedición
                </label>
                <Select
                  name="tipoExpedicion"
                  options={tipoExpedicionOptions}
                  isClearable
                  isMulti
                  value={paramsComisiones.tipo_expedicion}
                  onChange={(selectedOptions) => {
                    clearFieldError("tipo_expedicion");
                    const selected = selectedOptions || [];
                    const hasTodos = selected.some((opt) => opt.value === "10");
                    setParamsComisiones((prev) => ({
                      ...prev,
                      tipo_expedicion: hasTodos
                        ? [
                            tipoExpedicionOptions.find((o) => o.value === "10"),
                          ].filter(Boolean)
                        : selected,
                    }));
                  }}
                  isOptionDisabled={(option) => {
                    const hasTodos = paramsComisiones.tipo_expedicion.some(
                      (opt) => opt.value === "10",
                    );
                    const hasOtros = paramsComisiones.tipo_expedicion.some(
                      (opt) => opt.value !== "10",
                    );
                    if (hasTodos && option.value !== "10") return true;
                    if (hasOtros && option.value === "10") return true;
                    return false;
                  }}
                  placeholder=""
                  styles={getMultiSelectStyles(fieldErrors.tipo_expedicion)}
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </div>
            </div>

            {/* Fila 2: cols 1 + 1 + 2 (observaciones doble ancho) */}
            <div className="grid grid-cols-4 gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[13px]">
                  Aplica sobre
                </label>
                <Select
                  name="aplicaSobre"
                  className="text-sm text-gray-500"
                  options={aplicaSobreOptions}
                  isClearable
                  value={
                    aplicaSobreOptions.find(
                      (opt) => opt.value === paramsComisiones.aplica_sobre,
                    ) || null
                  }
                  onChange={(selectedOption) => (
                    clearFieldError("aplica_sobre"),
                    setParamsComisiones((prev) => ({
                      ...prev,
                      aplica_sobre: selectedOption?.value ?? "",
                    }))
                  )}
                  placeholder=""
                  styles={getSingleSelectStyles(fieldErrors.aplica_sobre)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="valorComision"
                  className="text-gray-500 text-[13px]"
                >
                  Valor comisión
                </label>
                <input
                  type="text"
                  id="valorComision"
                  className={`h-[35px] w-full border text-gray-900 focus:outline-none rounded-md px-2 text-sm ${fieldErrors.valor_comision ? "border-red-500" : "border-gray-300"}`}
                  value={paramsComisiones.valor_comision}
                  onChange={(e) => {
                    clearFieldError("valor_comision");
                    setParamsComisiones((prev) => ({
                      ...prev,
                      valor_comision: e.target.value,
                    }));
                  }}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <label
                  htmlFor="observaciones"
                  className="text-gray-500 text-[13px]"
                >
                  Observaciones
                </label>
                <input
                  type="text"
                  id="observaciones"
                  className={`h-[35px] w-full border text-gray-900 focus:outline-none rounded-md px-2 text-sm ${fieldErrors.observaciones ? "border-red-500" : "border-gray-300"}`}
                  value={paramsComisiones.observaciones}
                  onChange={(e) => {
                    clearFieldError("observaciones");
                    setParamsComisiones((prev) => ({
                      ...prev,
                      observaciones: e.target.value,
                    }));
                  }}
                />
              </div>
            </div>

            {/* Fila 3: Botón Guardar alineado a la izquierda */}
            <div className="flex flex-row">
              <button
                type="button"
                className="bg-lime-500 rounded-md text-white p-1 text-md font-bold w-[175px] h-[40px] hover:bg-lime-600 transition duration-300 ease-in-out flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleGuardarComisiones}
                disabled={loading}
              >
                <p className="text-sm">
                  {loading ? "Guardando..." : "Guardar"}
                </p>
              </button>
            </div>
          </div>
        </section>

        <section className="shadow-lg rounded-3xl xl:w-full lg:w-full mt-7">
          <TablaConfigCom
            headers={headers}
            data={params || []}
            from={""}
            numRow={10}
            handleEdit={handleEditParam}
            tipoExpedicionOptions={tipoExpedicionOptions}
            aplicaSobreOptions={aplicaSobreOptions}
            unidadesNegocio={unidadesNegocio}
            ramos={ramos}
            aseguradoras={aseguradoras}
          />
        </section>

        <Dialog
          open={modalEdit}
          onClose={() => setModalEdit(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "20px",
              border: "1px solid #d1d5db",
              overflow: "visible",
            },
          }}
        >
          <DialogTitle
            sx={{
              backgroundColor: "#e5e7eb",
              borderBottom: "1px solid #d1d5db",
              py: 1.5,
            }}
          >
            <div className="flex items-center gap-2">
              <EditNoteOutlined sx={{ fontSize: 24 }} />
              <span className="text-[18px] font-semibold text-gray-800">
                Editar parámetro de comisión
              </span>
            </div>
          </DialogTitle>
          <DialogContent
            sx={{
              px: 3,
              py: 3,
              backgroundColor: "#ffffff",
              overflow: "visible",
            }}
          >
            <div className="grid grid-cols-4 gap-4 mt-1">
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[13px]">
                  Unidad de negocio
                </label>
                <Select
                  name="edit_unidad_negocio"
                  options={unidadesNegocio}
                  isClearable
                  value={
                    unidadesNegocio.find(
                      (opt) =>
                        String(opt.value) ===
                        String(editParamsComisiones.unidad_negocio),
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    setEditParamsComisiones((prev) => ({
                      ...prev,
                      unidad_negocio: selectedOption?.value ?? "",
                    }))
                  }
                  styles={withModalPortalStyles(customStyles)}
                  {...modalSelectProps}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[13px]">Ramo(s)</label>
                <Select
                  name="edit_ramo"
                  options={ramos}
                  isClearable
                  isMulti
                  value={editParamsComisiones.ramo}
                  onChange={(selectedOptions) =>
                    setEditParamsComisiones((prev) => ({
                      ...prev,
                      ramo: selectedOptions || [],
                    }))
                  }
                  styles={withModalPortalStyles(stylesSingleLine)}
                  {...modalSelectProps}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[13px]">
                  Aseguradora(s)
                </label>
                <Select
                  name="edit_aseguradora"
                  options={aseguradoras}
                  isClearable
                  isMulti
                  value={editParamsComisiones.aseguradora}
                  onChange={(selectedOptions) => {
                    const selected = selectedOptions || [];
                    const hasTodas = selected.some(
                      (opt) => opt.value === "100",
                    );
                    setEditParamsComisiones((prev) => ({
                      ...prev,
                      aseguradora: hasTodas
                        ? [
                            aseguradoras.find((o) => String(o.value) === "100"),
                          ].filter(Boolean)
                        : selected,
                    }));
                  }}
                  isOptionDisabled={(option) => {
                    const hasTodas = editParamsComisiones.aseguradora.some(
                      (opt) => String(opt.value) === "100",
                    );
                    const hasOtras = editParamsComisiones.aseguradora.some(
                      (opt) => String(opt.value) !== "100",
                    );
                    if (hasTodas && String(option.value) !== "100") return true;
                    if (hasOtras && String(option.value) === "100") return true;
                    return false;
                  }}
                  styles={withModalPortalStyles(stylesSingleLine)}
                  {...modalSelectProps}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[13px]">
                  Tipo expedición
                </label>
                <Select
                  name="edit_tipo_expedicion"
                  options={tipoExpedicionOptions}
                  isClearable
                  isMulti
                  value={editParamsComisiones.tipo_expedicion}
                  onChange={(selectedOptions) => {
                    const selected = selectedOptions || [];
                    const hasTodos = selected.some(
                      (opt) => String(opt.value) === "10",
                    );
                    setEditParamsComisiones((prev) => ({
                      ...prev,
                      tipo_expedicion: hasTodos
                        ? [
                            tipoExpedicionOptions.find(
                              (o) => String(o.value) === "10",
                            ),
                          ].filter(Boolean)
                        : selected,
                    }));
                  }}
                  isOptionDisabled={(option) => {
                    const hasTodos = editParamsComisiones.tipo_expedicion.some(
                      (opt) => String(opt.value) === "10",
                    );
                    const hasOtros = editParamsComisiones.tipo_expedicion.some(
                      (opt) => String(opt.value) !== "10",
                    );
                    if (hasTodos && String(option.value) !== "10") return true;
                    if (hasOtros && String(option.value) === "10") return true;
                    return false;
                  }}
                  styles={withModalPortalStyles(stylesSingleLine)}
                  {...modalSelectProps}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[13px]">
                  Aplica sobre
                </label>
                <Select
                  name="edit_aplica_sobre"
                  options={aplicaSobreOptions}
                  isClearable
                  value={
                    aplicaSobreOptions.find(
                      (opt) =>
                        String(opt.value) ===
                        String(editParamsComisiones.aplica_sobre),
                    ) || null
                  }
                  onChange={(selectedOption) =>
                    setEditParamsComisiones((prev) => ({
                      ...prev,
                      aplica_sobre: selectedOption?.value ?? "",
                    }))
                  }
                  styles={withModalPortalStyles(customStyles)}
                  {...modalSelectProps}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="edit_valorComision"
                  className="text-gray-500 text-[13px]"
                >
                  Valor comisión
                </label>
                <input
                  type="text"
                  id="edit_valorComision"
                  className="h-[37px] w-full border border-gray-300 text-gray-900 focus:outline-none rounded-md px-2 text-sm"
                  value={editParamsComisiones.valor_comision}
                  onChange={(e) =>
                    setEditParamsComisiones((prev) => ({
                      ...prev,
                      valor_comision: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="col-span-2 flex flex-col gap-1">
                <label
                  htmlFor="edit_observaciones"
                  className="text-gray-500 text-[13px]"
                >
                  Observaciones
                </label>
                <input
                  type="text"
                  id="edit_observaciones"
                  className="h-[37px] w-full border border-gray-300 text-gray-900 focus:outline-none rounded-md px-2 text-sm"
                  value={editParamsComisiones.observaciones}
                  onChange={(e) =>
                    setEditParamsComisiones((prev) => ({
                      ...prev,
                      observaciones: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </DialogContent>
          <DialogActions
            sx={{
              px: 3,
              py: 2,
              borderTop: "1px solid #e5e7eb",
              backgroundColor: "#f9fafb",
            }}
          >
            <Button
              onClick={() => setModalEdit(false)}
              variant="outlined"
              disabled={loading}
              sx={{
                borderColor: "#9ca3af",
                color: "#374151",
                textTransform: "none",
                borderRadius: "8px",
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              disabled={loading}
              sx={{
                backgroundColor: "#88d600",
                color: "#ffffff",
                textTransform: "none",
                borderRadius: "8px",
                "&:hover": {
                  backgroundColor: "#74b800",
                },
              }}
              onClick={() => {
                handleGuardarCambiosEditados();
              }}
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      <Box padding={3}>
        <section className="shadow-lg rounded-3xl xl:w-full lg:w-full">
          <div className="flex flex-row gap-3 items-center bg-gray-200 p-3 rounded-t-3xl border-gray-400 border">
            <EditNoteOutlined sx={{ fontSize: 30 }} />
            <p className="text-lg">Configuración de salario mínimo</p>
          </div>
          <div className="flex flex-col gap-5 p-8 rounded-b-3xl border-l border-r border-b border-gray-400">
            {/* Fila 1: 4 columnas iguales */}
            <div className="grid grid-cols-4 gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[13px]">Año SMMLV:</label>
                <Select
                  name="anio_smmlv"
                  id="anio_smmlv"
                  className="text-sm text-gray-500"
                  options={years}
                  isClearable
                  value={
                    years.find(
                      (opt) => String(opt.value) === String(sMMLV.anio_smmlv),
                    ) || null
                  }
                  onChange={(selectedOption) => (
                    clearFieldError("anio_smmlv"),
                    setSMMLV((prev) => ({
                      ...prev,
                      anio_smmlv: selectedOption?.value ?? "",
                    }))
                  )}
                  placeholder=""
                  styles={getSingleSelectStyles(fieldErrors.anio_smmlv)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[13px]">
                  Fecha inicio vigencia SMMLV:
                </label>
                <input
                  type="date"
                  className={`text-md border-[1px] w-full text-gray-900 focus:outline-none h-[37.33px] rounded-md p-2 ${fieldErrors.fch_ini_vig ? "border-red-500" : "border-gray-300"}`}
                  name="fch_ini_vig"
                  value={sMMLV.fch_ini_vig}
                  onChange={(e) => (
                    clearFieldError("fch_ini_vig"),
                    setSMMLV((prev) => ({
                      ...prev,
                      fch_ini_vig: e.target.value,
                    }))
                  )}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[13px]">
                  Fecha fin vigencia SMMLV:
                </label>
                <input
                  type="date"
                  name="fch_fin_vig"
                  value={sMMLV.fch_fin_vig}
                  className={`text-md border-[1px] w-full text-gray-900 focus:outline-none h-[37.33px] rounded-md p-2 ${fieldErrors.fch_fin_vig ? "border-red-500" : "border-gray-300"}`}
                  onChange={(e) => (
                    clearFieldError("fch_fin_vig"),
                    setSMMLV((prev) => ({
                      ...prev,
                      fch_fin_vig: e.target.value,
                    }))
                  )}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="valorComision"
                  className="text-gray-500 text-[13px]"
                >
                  Valor SMMLV:
                </label>
                <input
                  type="text"
                  id="valorSMMLV"
                  className={`text-md border-[1px] w-full text-gray-900 focus:outline-none h-[37.33px] rounded-md p-2 ${fieldErrors.valor_smmlv ? "border-red-500" : "border-gray-300"}`}
                  value={sMMLV.valor_smmlv}
                  onChange={(e) => {
                    clearFieldError("valor_smmlv");
                    setSMMLV((prev) => ({
                      ...prev,
                      valor_smmlv: formatCurrencyInput(e.target.value),
                    }));
                  }}
                  placeholder="$ 1.600.000"
                />
              </div>
            </div>

            {/* Fila 2: cols 1 + 1 + 2 (observaciones doble ancho) */}
            <div className="grid grid-cols-4 gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[13px]">Estado:</label>
                <Select
                  name="estado_smmlv"
                  id="estado_smmlv"
                  className="text-sm text-gray-500"
                  options={estadoSMMLVOptions}
                  value={
                    estadoSMMLVOptions.find(
                      (opt) => String(opt.value) === String(sMMLV.estado),
                    ) || null
                  }
                  onChange={(selectedOption) => (
                    clearFieldError("estado_smmlv"),
                    setSMMLV((prev) => ({
                      ...prev,
                      estado: selectedOption?.value ?? "",
                    }))
                  )}
                  placeholder=""
                  styles={getSingleSelectStyles(fieldErrors.estado_smmlv)}
                />
              </div>
            </div>

            {/* Fila 3: Botón Guardar alineado a la izquierda */}
            <div className="flex flex-row gap-3">
              <button
                type="button"
                className="bg-lime-500 rounded-md text-white p-1 text-md font-bold w-[175px] h-[40px] hover:bg-lime-600 transition duration-300 ease-in-out flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleGuardarSMMLV}
                disabled={loading}
              >
                <p className="text-sm">
                  {loading
                    ? "Guardando..."
                    : editSMMLVSourceRow
                      ? "Actualizar"
                      : "Guardar"}
                </p>
              </button>

              {editSMMLVSourceRow ? (
                <button
                  type="button"
                  className="bg-white border border-gray-300 rounded-md text-gray-700 p-1 text-md font-bold w-[175px] h-[40px] hover:bg-gray-50 transition duration-300 ease-in-out flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={resetSMMLVForm}
                  disabled={loading}
                >
                  <p className="text-sm">Cancelar edición</p>
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="shadow-lg rounded-3xl xl:w-full lg:w-full mt-7">
          <TablaSMMLV
            data={smmlvRecords}
            years={years}
            handleEdit={handleEditSMMLV}
            numRow={6}
          />
        </section>
      </Box>
    </div>
  );
};
