import axios from "axios";

export const getMovimiento = async (id_poliza, id_movimiento) => {
  try {
    const response = await axios.post(
      "/Policy/getMovimiento",
      {
        data: {
          id_poliza,
          id_movimiento,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    return error;
  }
};
