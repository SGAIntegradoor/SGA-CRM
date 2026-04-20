import { getConciliacionPolizasByQuery } from "./getConciliacionPolizasByQuery";

const normalizeText = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const pickFirstValue = (sources = []) => {
  for (const value of sources) {
    if (value !== null && value !== undefined && `${value}`.trim() !== "") {
      return value;
    }
  }

  return "N/A";
};

const toQueryFilters = (filters) => ({
  criteria_busqueda: "2",
  no_poliza: filters.poliza?.trim() || "",
  aseguradora: filters.aseguradora || "",
  ramo: filters.ramo || "",
  financiada_por: filters.financieras || "",
  nombre_asegurado: filters.nombreAsegurado?.trim() || "",
  tipo_expedicion: filters.tipoexpedicion || "",
  estado_conciliacion: filters.estadoconciliacion || "",
  tipo_fecha_busqueda:
    filters.fechainiciovigdesde && filters.fechafinvighasta ? "1" : "",
  desde: filters.fechainiciovigdesde || "",
  hasta: filters.fechafinvighasta || "",
});

const normalizeQueryRows = (queryResponse) => {
  if (Array.isArray(queryResponse)) {
    return queryResponse;
  }

  if (Array.isArray(queryResponse?.data)) {
    return queryResponse.data;
  }

  return [];
};

const normalizeArrayField = (value) => (Array.isArray(value) ? value : []);

const buildQueryMap = (rows = []) => {
  const byAnexo = new Map();
  const byComposite = new Map();

  rows.forEach((row) => {
    if (row?.id_anexo_poliza) {
      byAnexo.set(String(row.id_anexo_poliza), row);
    }

    const compositeKey = `${row?.id_poliza ?? ""}-${row?.no_certificado ?? ""}`;
    byComposite.set(compositeKey, row);
  });

  return { byAnexo, byComposite };
};

const getEstadoConciliacionLabel = (row) => {
  const source = pickFirstValue([
    row.estado_conciliacion,
    row.estado_conciliacion_desc,
    row.estadoconciliacion,
  ]);

  if (source === "N/A") {
    return "Pendiente";
  }

  const normalized = normalizeText(source);
  const states = {
    1: "Pendiente",
    2: "Conciliada",
    3: "Pago parcial",
    pendiente: "Pendiente",
    conciliada: "Conciliada",
    conciliado: "Conciliada",
    "pago parcial": "Pago parcial",
    pago_parcial: "Pago parcial",
  };

  return states[normalized] || source;
};

const formatPercent = (value) => {
  if (value === null || value === undefined || `${value}`.trim() === "") {
    return "N/A";
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return value;
  }

  return `${numeric}%`;
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || `${value}`.trim() === "") {
    return "N/A";
  }

  if (typeof value === "string" && value.trim() === "N/A") {
    return "N/A";
  }

  const normalizedValue = Number(
    String(value)
      .replace(/\$/g, "")
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(/,/g, "."),
  );

  if (!Number.isFinite(normalizedValue)) {
    return value;
  }

  return normalizedValue.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const matchesTextFilter = (row, filters) => {
  if (!filters.nombreAsegurado?.trim()) {
    return true;
  }

  const term = normalizeText(filters.nombreAsegurado);
  return [
    row.asegurado,
    row.tomador,
    row.asesor_freelance,
    row.asesor_ganador,
    row.asesor_10,
  ].some((value) => normalizeText(value).includes(term));
};

const matchesTipoExpedicion = (row, filters) => {
  if (!filters.tipoexpedicion) {
    return true;
  }

  const byId = {
    1: "nueva",
    2: "renovacion",
    3: "modificacion",
    4: "cancelacion",
  };

  return normalizeText(row.tipo) === byId[String(filters.tipoexpedicion)];
};

const matchesEstadoConciliacion = (row, filters) => {
  if (!filters.estadoconciliacion) {
    return true;
  }

  const byId = {
    1: "pendiente",
    2: "conciliada",
    3: "pago parcial",
  };

  return (
    normalizeText(row.estado_conciliacion) ===
    byId[String(filters.estadoconciliacion)]
  );
};

export const getConciliacionPolizas = async (filters) => {
  const queryResponse = await getConciliacionPolizasByQuery(
    toQueryFilters(filters),
  );
  const queryRows = normalizeQueryRows(queryResponse);
  const baseRows = queryRows;
  const queryMap = buildQueryMap(queryRows);

  const mergedRows = baseRows.map((row) => {
    const queryRow =
      queryMap.byAnexo.get(String(row.id_anexo_poliza)) ||
      queryMap.byComposite.get(`${row.id_poliza ?? ""}-${row.anexo ?? ""}`) ||
      {};

    const estadoConciliacion = getEstadoConciliacionLabel(queryRow);
    const isCancellation = normalizeText(row.tipo_expedicion) === "cancelacion";

    return {
      id: row.id_anexo_poliza,
      id_poliza: row.id_poliza,
      id_anexo_poliza: row.id_anexo_poliza,
      id_remision: pickFirstValue([row.id_remision, queryRow.id_remision]),
      fecha_expedicion: pickFirstValue([
        row.fecha_expedicion,
        queryRow.fecha_exp_poliza,
      ]),
      total_pagos: formatCurrency(pickFirstValue([row.total_pagos, queryRow.total_pagos]))  ,
      ramo: pickFirstValue([row.ramo, queryRow.nombre_ramo]),
      poliza: pickFirstValue([row.poliza, queryRow.no_poliza]),
      certificado: pickFirstValue([row.anexo, queryRow.no_certificado]),
      tomador: pickFirstValue([
        row.nombre_tomador,
        queryRow.nombre_completo_tomador,
      ]),
      documento_tomador: pickFirstValue([
        row.documento_tomador,
        queryRow.numero_documento_tomador,
      ]),
      placa: pickFirstValue([row.placa, queryRow.placa_veh_poliza]),
      asistencia: formatCurrency(pickFirstValue([
        row.asistencia,
        queryRow.asistencias_otros_poliza,
      ])),
      prima_sin_iva: formatCurrency(
        pickFirstValue([row.prima_neta, queryRow.prima_neta_poliza]),
      ),
      gastos: formatCurrency(
        pickFirstValue([row.gastos_expedicion, queryRow.gastos_expedicion_poliza]),
      ),
      iva: formatCurrency(pickFirstValue([row.iva, queryRow.iva_poliza])),
      valor_total: formatCurrency(
        pickFirstValue([row.valor_total, queryRow.valor_total_poliza]),
      ),
      inicio_vig: pickFirstValue([
        row.fecha_inicio_vigencia,
        queryRow.fecha_inicio_vig_poliza,
      ]),
      compania: pickFirstValue([row.aseguradora, queryRow.nombre_aseguradora]),
      tipo: pickFirstValue([
        row.tipo_expedicion,
        queryRow.tipo_certificado_desc,
      ]),
      tipo_certificado: pickFirstValue([
        row.tipo_certificado,
        queryRow.tipo_certificado,
      ]),
      fecha_cancelacion: pickFirstValue([
        row.fecha_cancelacion,
        queryRow.fecha_cancelacion_poliza,
      ]),
      asesor_freelance: pickFirstValue([
        row.asesor_freelance,
        queryRow.nombre_asesor_freelance,
      ]),
      asesor_ganador: pickFirstValue([
        queryRow.nombre_asesor_ganador,
        row.asesor_ganador,
      ]),
      asesor_10: pickFirstValue([queryRow.nombre_asesor_10, row.asesor_10]),
      unidad_negocio: pickFirstValue([
        row.unidad_negocio,
        queryRow.nombre_unidad_negocio,
      ]),
      forma_pago: pickFirstValue([row.forma_de_pago, queryRow.forma_pago_desc]),
      financiera: pickFirstValue([row.financiera, queryRow.nombre_financiera]),
      cuotas: pickFirstValue([row.cuotas, queryRow.no_cuotas]),
      estado_cartera: pickFirstValue([
        row.estado_cartera,
        queryRow.estado_cartera,
      ]),
      estado_conciliacion: estadoConciliacion,
      numero_factura: pickFirstValue([
        queryRow.numero_factura,
        queryRow.no_factura,
        queryRow.factura,
      ]),
      porcentaje_comision: pickFirstValue([
        formatPercent(row.porcentaje_comision_pct),
        formatPercent(queryRow.porcentaje_comision_pct),
        formatPercent(queryRow.porcentaje_comision),
      ]),
      prima_planilla: formatCurrency(
        pickFirstValue([queryRow.prima_planilla, row.prima_sin_iva_asistencia]),
      ),
      fecha_conciliacion: pickFirstValue([
        queryRow.fecha_conciliacion,
        queryRow.fecha_conciliado,
      ]),
      saldo: formatCurrency(pickFirstValue([queryRow.saldo, queryRow.saldo_conciliacion])),
      comision_recibida: formatCurrency(
        pickFirstValue([
          queryRow.comision_recibida,
          queryRow.valor_comision_recibida,
          row.valor_comision,
        ]),
      ),
      valor_cancelacion: formatCurrency(
        pickFirstValue([
          queryRow.valor_cancelacion,
          isCancellation ? row.valor_total : null,
        ]),
      ),
      porcentaje_cancelacion: pickFirstValue([
        formatPercent(queryRow.porcentaje_cancelacion),
        isCancellation ? formatPercent(row.porcentaje_comision_pct) : null,
      ]),
      pago_financieras: formatCurrency(
        pickFirstValue([
          queryRow.pago_financieras,
          queryRow.valor_pago_financiera,
        ]),
      ),
      asegurado: pickFirstValue([
        row.asegurado,
        queryRow.nombre_completo_asegurado,
      ]),
      conciliaciones: normalizeArrayField(queryRow.conciliaciones),
      historial_conciliaciones: normalizeArrayField(
        queryRow.historial_conciliaciones,
      ),
      razon_cancelacion: pickFirstValue([
        queryRow.razon_cancelacion,
        row.razon_cancelacion,
      ]),
      comentarios_conciliacion: normalizeArrayField(
        queryRow.comentarios_conciliacion,
      ),
      accion: "Conciliar",
    };
  });

  return mergedRows.filter(
    (row) =>
      matchesTextFilter(row, filters) &&
      matchesTipoExpedicion(row, filters) &&
      matchesEstadoConciliacion(row, filters),
  );
};
