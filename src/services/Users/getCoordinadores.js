import axios from "axios";

export const getCoordinadores = async () => {
  try {
    const response = await axios.post(
      "/Users/getCoordinadoresTecnicos",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const { data } = response.data;

    return data.data.map(({ nombre_coordinador, documento_coordinador }) => ({
      label: nombre_coordinador,
      value: documento_coordinador,
    }));
  } catch (error) {
    return error;
  }
};
