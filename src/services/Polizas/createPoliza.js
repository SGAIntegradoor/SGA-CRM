import axios from "axios";

export const createPoliza = async (data) => {
  try {

    const response = await axios.post(
      "/Policy/createPoliza",
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
