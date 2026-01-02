import axios from "axios";

/**
 * Mapea filas del WS al formato que necesita la tabla.
 * - Para criteria_busqueda === "1" (Póliza): usa columnas estándar.
 * - Para criteria_busqueda === "2" (Certificado): además agrega `anexo_poliza`.
 */
const tipos_certificado = {
  1: "Nueva",
  2: "Renovación",
  3: "Modificación",
  4: "Cancelación",
};
const estados_por_liquidar = {
  0: "Por liquidar",
  1: "Liquidada",
  2: "Cancelada",
}; // Sólo para visualización
const ramos = {
  2: "Hogar",
  4: "Salud",
  5: "Vida",
  6: "Asistencia en viajes",
  7: "Motos",
  8: "Pesados",
  9: "Vida deudor",
  10: "Arrendamiento",
  1:  "Autos Livianos",
  12: "AP Estudiantil",
  13: "AP",
  14: "Autos Pasajeros",
  15: "Autos Colectivo",
  16: "Bicicleta",
  17: "Credito",
  18: "Cumplimiento",
  19: "Equipo Maquinaria",
  20: "Exequias",
  21: "Hogar Deudor",
  22: "Manejo",
  23: "PYME",
  24: "RCE Autos Livianos",
  25: "RCE Motos",
  26: "RCE Pesados",
  27: "RCE Pasajeros",
  28: "RCC Colectivos",
  29: "RCE Colectivos",
  30: "RC Cumplimiento",
  31: "RC Hidrocarburos",
  32: "RC Medica Profesional",
  33: "Asistente E/V",
};
const formas_pago = { 1: "Contado", 2: "Financiada" };
const aseguradoras = {
  1: "Allianz",
  2: "AXA Colpatria",
  3: "Bolivar",
  4: "Equidad",
  5: "Estado",
  6: "HDI Seguros",
  7: "Mapfre",
  8: "Mundial",
  9: "Previsora",
  10: "Qualitas",
  11: "SBS Seguros",
  12: "Solidaria",
  13: "Zurich",
  14: "AssistCard",
  15: "Universal",
  16: "Assist1",
  17: "Los Olivos",
  18: "Sura",
  19: "Cesce",
  20: "Colmena",
  21: "Coomeva",
  22: "Palig",
};
const unidadNegocio = {
  1: "Freelance",
  2: "Directo",
  3: "Asesor 10",
  4: "Asesor Ganador",
};

const mapPolizasToTable = (rows = [], criterio = "1") => {
  return rows.map((it) => ({
    accion: "",

    // Fechas / identificación
    fecha_exp_poliza: it?.fecha_exp_poliza ?? it?.fecha_expedicion ?? "",
    no_poliza: it?.no_poliza ?? "",
    id_remision: it?.id_remision ?? "",

    // Si es criterio "2" la tabla espera columna 'anexo_poliza'
    ...(String(criterio) === "2"
      ? { anexo_poliza: it?.no_certificado ?? it?.id_anexo_poliza ?? "" }
      : {}),

    // Datos de póliza
    ramo: ramos[it?.ramo_poliza ?? it?.ramo ?? ""] ?? "",
    aseguradora:
      aseguradoras[it?.aseguradora_poliza ?? it?.aseguradora ?? ""] ?? "",
    tomador: it?.nombre_completo_tomador ?? it?.tomador ?? "",
    no_documento: it?.numero_documento_tomador ?? it?.no_documento ?? "",
    asegurado: it?.nombre_completo_asegurado ?? it?.asegurado ?? "",
    beneficiario:
      it?.nombre_completo_beneficiario == null ||
      it?.nombre_completo_beneficiario === ""
        ? "N/A"
        : it?.nombre_completo_beneficiario,
    nombre_asesor_freelance: it?.nombre_asesor_freelance,
    asesor_freelance: it?.asesor_freelance,

    // Vehículo
    placa: it?.placa_veh_poliza ?? it?.placa ?? "",

    // Valores
    asistencia_otros:
      it?.asistencias_otros_poliza ?? it?.asistencia_otros ?? "",
    prima_neta: it?.prima_neta_poliza ?? it?.prima_neta ?? "",
    gastos_expedicion:
      it?.gastos_expedicion_poliza ?? it?.gastos_expedicion ?? "",
    iva: it?.iva_poliza ?? it?.iva ?? "",
    valor_total: it?.valor_total_poliza ?? it?.valor_total ?? "",

    // Vigencias
    inicio_vigencia: it?.fecha_inicio_vig_poliza ?? it?.inicio_vigencia ?? "",
    fin_vigencia: it?.fecha_fin_vig_poliza ?? it?.fin_vigencia ?? "",

    // Otros
    unidad_negocio:
      unidadNegocio[it?.unidad_negocio_poliza ?? it?.unidad_negocio ?? ""] ??
      "",
    estado:
      it?.estado ?? (String(it?.cancelada) === "1" ? "No vigente" : "Vigente"),

    // Claves para dataKey en la tabla
    id_poliza: it?.id_poliza ?? "",
    id_anexo_poliza: it?.id_anexo_poliza ?? "",
  }));
};
/**
 * Llama al WS y devuelve el arreglo ya mapeado para pintar en la tabla.
 * @param {Object} dataFilters - Filtros de búsqueda (incluye criteria_busqueda).
 * @param {String} from - Contexto (por compatibilidad; aquí no se usa para filtrar).
 * @returns {Array} - Filas listas para `TableConsultas`.
 */

export const getPolizasToQuery = async (dataFilters, from = "search") => {
  try {
    const { data: res } = await axios.post(
      "/Policy/retrievePolizasToQuery",
      { dataFilters },
      { headers: { "Content-Type": "application/json" } }
    );

    // La API puede devolver { data: [...] } o directamente [...]
    const lista = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : [];
    console.log(lista)

    // Mapeo 1:1 a las columnas esperadas por la tabla
    const criterio = String(dataFilters?.criteria_busqueda || "1");
    const adaptadas = mapPolizasToTable(lista, criterio);

    return adaptadas;
  } catch (error) {
    console.error("getPolizasToQuery error:", error);
    // Devuelve array vacío para que la tabla muestre "sin registros" sin romper
    return [];
  }
};
