import axios from "axios";

export const getAnexosPoliza = async (id_poliza) => {
  try {
    const response = await axios.post(
      "/Policy/getAnexosPoliza",
      {
        id_poliza: id_poliza,
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
