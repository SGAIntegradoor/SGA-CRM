import axios from "axios";

export const getAnalistas = async () => {
  try {
    const response = await axios.post(
      "/Users/getAllAnalistas",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const { data } = response.data.data;
    return data.map((analista) => ({
      value: analista.id_analista,
      label: analista.nombre_analista,
    }));
    
  } catch (error) {
    return error;
  }
};
