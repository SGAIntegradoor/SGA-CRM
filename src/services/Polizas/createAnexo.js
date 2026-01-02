import axios from "axios";

export const createAnexo = async (data) => {
  try {

    const response = await axios.post(
      "/Policy/createAnexo",
      {
        data: data
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