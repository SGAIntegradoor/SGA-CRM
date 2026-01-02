import axios from "axios";

export const getQuotesFinancieras = async (id) => {
  try {
    const response = await axios.post(
      "/Policy/getQuotesFinancieras",
      {
        id: id,
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
