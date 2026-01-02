import axios from "axios";

export const getTecnicos = async () => {
  try {
    const response = await axios.post(
      "/Users/getTecnicos",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const { data } = response.data;

    return data.data.map(({ nombre_tecnico, documento_tecnico }) => ({
      label: nombre_tecnico,
      value: documento_tecnico,
    }));
  } catch (error) {
    return error;
  }
};
