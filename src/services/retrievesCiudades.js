import axios from "axios";

export const retrieveCiudades = async (ciudadDepartamento) => {
  try {
    const response = await axios.post(
      "/Utils/getCiudades",
      {
        ciudadDepartamento: ciudadDepartamento
      }
    );

    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

