import axios from "axios";

export const getAsesoresSGA = async (unidadNegocio = null) => {
  try {
    const response = await axios.post(
      "/Users/getAllAsesoresSGA",
      {
        unidadNegocio,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const { data } = response.data.data;
    return data.map((asesorsga) => ({
      value: asesorsga.usu_documento,
      label: asesorsga.usu_nombre + " " + asesorsga.usu_apellido,
    }));
    
  } catch (error) {
    return error;
  }
};
