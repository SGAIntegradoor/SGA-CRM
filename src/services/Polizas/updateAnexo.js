import axios from "axios";

export const updateAnexo = async (data) => {
  try {

    const response = await axios.post(
      "/Policy/updateAnexoPoliza",
      {
        data: data,
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
