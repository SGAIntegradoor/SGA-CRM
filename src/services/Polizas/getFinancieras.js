import axios from "axios";

export const getFinancieras = async () => {
  try {
    const response = await axios.post(
      "/Policy/getFinancieras",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

     return response.data.data.map((financiera) => ({
      value: financiera.id,
      label: financiera.nombre_financiera,
    }));
  } catch (error) {
    return error;
  }
};
