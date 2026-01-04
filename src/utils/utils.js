import axios from "axios";

export const capitalizeWords = (value = "") => {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ") // evita múltiples espacios
    .replace(/\b\w/g, (char) => char.toUpperCase());
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
