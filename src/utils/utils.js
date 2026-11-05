import axios from "axios";

export const capitalizeWords = (value = "") => {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ") // evita múltiples espacios
    // \b no reconoce tildes ni ñ: "muñoz" salía "MuñOz"
    .replace(
      /(^|[\s.'’-])(\p{L})/gu,
      (_, separador, letra) => separador + letra.toUpperCase()
    );
};

// getClientById busca con LIKE %doc%: solo vale la coincidencia exacta
// (o el NIT guardado con su dígito de verificación)
export const coincideDocumento = (cliente, doc) => {
  const a = String(cliente?.documento ?? "").trim();
  const b = String(doc ?? "").trim();
  if (!a || !b) return false;
  if (a === b) return true;
  return (
    String(cliente?.tipoDocumento) === "2" &&
    a.length === b.length + 1 &&
    a.startsWith(b)
  );
};

// El login ya no trae Editaruncliente: el permiso real es modificar_clientes
export const puedeEditarClientes = () => {
  try {
    const permisos = JSON.parse(localStorage.getItem("permisos"));
    return Number(permisos?.modificar_clientes) === 1;
  } catch {
    return false;
  }
};

// El controlador siempre responde status Ok; el fallo real viene en data.statusCode:
// -2 sin permiso o error de BD, -1 algún dato no se guardó (o el cliente no existe)
export const clienteActualizado = (response) =>
  response?.status === "Ok" && !(response?.data?.statusCode < 0);

// Sin más datos, la primera palabra (dos si son 4 o más) son los nombres
export const partirNombre = (nombreCompleto = "") => {
  const partes = String(nombreCompleto ?? "").trim().split(/\s+/).filter(Boolean);
  const corte = partes.length >= 4 ? 2 : 1;
  return {
    nombres: partes.slice(0, corte).join(" "),
    apellidos: partes.slice(corte).join(" "),
  };
};

export const getFasecoldaBrands = async (codigo = null) => {
  try {
    const respuesta = await axios.post(`/Utils/getBrands`);
    const { data } = respuesta.data;
    return data.map((brand) => ({
      value: brand.marca,
      label: brand.marca,
    }));
  } catch (error) {
    console.error("Error al obtener marcas: ", error);
    return [];
  }
};

export const getFasecoldaClass = async (codigo = null) => {
  try {
    const respuesta = await axios.post(`/Utils/getClass`);
    const { data } = respuesta.data;
    return data.map((classes) => ({
      value: classes.clase,
      label: classes.clase,
    }));
  } catch (error) {
    console.error("Error al obtener clases: ", error);
    return [];
  }
};
