import axios from "axios";

export const updatePoliza = async (data) => {
  try {

    const response = await axios.post(
      "/Policy/updatePoliza",
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
