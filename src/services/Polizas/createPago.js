import axios from "axios";

export const createPagoAnexo = async (data) => {
  try {

    const response = await axios.post(
      "/Policy/createPagoPoliza",
      {
        data
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
