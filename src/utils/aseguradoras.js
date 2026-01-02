import axios from "axios";

export const obtenerAseguradoras = async () => {
  try {
    const respuesta = await axios.post(`/Utils/getInsurers`);
    const {data} = respuesta.data;
    return data.map((aseguradora) => ({
      label: aseguradora.nombre_aseguradora,
      value: aseguradora.id_aseguradora,
      ramo: aseguradora.ramo,
    }));
  } catch (error) {
    console.error("Error al obtener aseguradoras:", error);
    return [];
  }
};

export const obtenerRamo = async () => {
  try {
    const respuesta = await axios.post(`/Utils/getRamo`);
    const {data} = respuesta.data;
    return data.map((ramo) => ({
      value: ramo.id_ramo,
      label: ramo.ramo,
    }));
  } catch (error) {
    console.error("Error al obtener aseguradoras:", error);
    return [];
  }
};
