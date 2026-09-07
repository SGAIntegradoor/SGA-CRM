import { getPolizasToQuery } from "./getPolizasToQuery";

/**
 * Filtros del buscador del módulo de corrección.
 * criteria_busqueda = "2" -> trae todos los certificados/anexos de la póliza,
 * no sólo el certificado 0.
 */
export const construirFiltrosCorreccion = ({
  criterio,
  termino,
  tipoCliente = "2",
}) => {
  const filtros = { criteria_busqueda: "2" };
  const valor = String(termino ?? "").trim();

  if (criterio === "id_remision") filtros.id_remision = valor;
  if (criterio === "no_poliza") filtros.no_poliza = valor;
  if (criterio === "placa") filtros.placa = valor.toUpperCase();
  if (criterio === "documento") {
    filtros.tipo_cliente = tipoCliente;
    filtros.documento = valor;
  }

  return filtros;
};

/**
 * Ejecuta la búsqueda y devuelve siempre un arreglo (vacío si no hubo match).
 */
export const buscarPolizasCorreccion = async (opciones) => {
  const respuesta = await getPolizasToQuery(
    construirFiltrosCorreccion(opciones),
    "correccion"
  );
  return Array.isArray(respuesta) ? respuesta : [];
};
