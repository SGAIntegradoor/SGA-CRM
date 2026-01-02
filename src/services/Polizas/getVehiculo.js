import axios from "axios";

export const getVehiculo = async (placa) => {
  try {
    const response = await axios.post(
      "/Utils/getVehiculo",
      {
        placa ,
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
