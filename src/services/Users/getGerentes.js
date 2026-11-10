import axios from "axios";

export const getGerentes = async () => {
  try {
    const response = await axios.post(
      "/Users/getGerentes",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const { data } = response.data.data;
    return data.map((gerente) => ({
      value: gerente.usu_documento,
      label: gerente.usu_nombre + " " + gerente.usu_apellido,
    }));
  } catch (error) {
    console.error("Error loading gerentes:", error);
    return [];
  }
};
