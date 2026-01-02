import axios from "axios";

export const getUserLiquidaciones = async () => {
  try {
    const response = await axios.post(
      "/Users/getUserLiquidaciones",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const { data } = response.data.data;
    return data.map((usuario) => ({
      value: usuario.usu_documento,
      label: usuario.usu_nombre+" "+usuario.usu_apellido,
      cargo: usuario.usu_cargo
    }));
    
  } catch (error) {
    return error;
  }
};