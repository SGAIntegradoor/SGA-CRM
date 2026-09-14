import { getPolizasToQuery } from "./getPolizasToQuery";

/** Únicos criterios admitidos por el módulo de corrección. */
export const CRITERIOS_CORRECCION = ["id_remision", "no_poliza"];

/**
 * Filtros del buscador del módulo de corrección.
 * criteria_busqueda = "2" -> trae todos los certificados/anexos de la póliza,
 * no sólo el certificado 0.
 * Cualquier criterio distinto de remisión / número de póliza se rechaza:
 * el módulo corrige una póliza puntual, no una lista por placa o documento.
 */
export const construirFiltrosCorreccion = ({ criterio, termino }) => {
  if (!CRITERIOS_CORRECCION.includes(criterio)) {
    throw new Error(
      `Criterio de búsqueda no permitido en corrección: ${criterio}`
    );
  }

  const filtros = { criteria_busqueda: "2" };
  const valor = String(termino ?? "").trim();

  if (criterio === "id_remision") filtros.id_remision = valor;
  if (criterio === "no_poliza") filtros.no_poliza = valor;

  return filtros;
};

/**
 * Ejecuta la búsqueda y devuelve siempre un arreglo (vacío si no hubo match).
 */
export const buscarPolizasCorreccion = async (opciones) => {
  let filtros;
  try {
    filtros = construirFiltrosCorreccion(opciones);
  } catch (e) {
    console.error(e);
    return [];
  }
  const respuesta = await getPolizasToQuery(filtros, "correccion");
  return Array.isArray(respuesta) ? respuesta : [];
};
