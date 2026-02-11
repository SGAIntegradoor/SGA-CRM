import axios from "axios";

/**
 * Llama al WS y devuelve el arreglo ya listo para pintar en la tabla.
 * Los campos ahora vienen directamente de la API con los nombres correctos.
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
    
    console.log("retrievePolizasToQuery response:", lista);
    
    // DEBUG: Mostrar campos específicos del primer registro
    if (lista && lista.length > 0) {
      const first = lista[0];
      console.log("DEBUG - Campos del primer registro:", {
        nombre_ramo: first.nombre_ramo,
        nombre_aseguradora: first.nombre_aseguradora,
        nombre_unidad_negocio: first.nombre_unidad_negocio,
        nombre_financiera: first.nombre_financiera,
        nombre_asesor_sga: first.nombre_asesor_sga,
        tipo_certificado_desc: first.tipo_certificado_desc,
        forma_pago_desc: first.forma_pago_desc,
        estado_cartera: first.estado_cartera,
        observaciones_anexo: first.observaciones_anexo,
        ramo_poliza: first.ramo_poliza,
        unidad_negocio_poliza: first.unidad_negocio_poliza,
        aseguradora_poliza: first.aseguradora_poliza,
      });
    }

    // Si no hay resultados
    if (!lista || lista.length === 0) {
      return { statusCode: -1, data: [] };
    }

    // Los campos ya vienen con los nombres correctos de la API
    // Solo agregamos el campo "accion" para la tabla
    const adaptadas = lista.map((poliza) => ({
      ...poliza,
      accion: "", // Campo para el botón de acción en la tabla
    }));

    return adaptadas;
  } catch (error) {
    console.error("getPolizasToQuery error:", error);
    // Devuelve objeto con statusCode -1 para que la tabla muestre mensaje
    return { statusCode: -1, data: [] };
  }
};
