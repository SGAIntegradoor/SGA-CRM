import axios from "axios";

export const getUnidadesNegocio = async () => {
  try {
    const response = await axios.post(
      "/Utils/getUnidadesNegocio",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const { data } = response.data;

    return data.map(({ unidad_negocio, id_unidad }) => ({
      label: unidad_negocio,
      value: id_unidad,
    }));
  } catch (error) {
    return error;
  }
};
