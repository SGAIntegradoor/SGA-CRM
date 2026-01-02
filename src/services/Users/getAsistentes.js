import axios from "axios";

export const getAsistentes = async () => {
  try {
    const response = await axios.post(
      "/Users/getAsistentes",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const { data } = response.data;

    return data.data.map(({ nombre_asistente, documento_asistente }) => ({
      label: nombre_asistente,
      value: documento_asistente,
    }));
  } catch (error) {
    return error;
  }
};
