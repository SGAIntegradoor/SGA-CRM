import axios from "axios";

export const getClientByIdIntegradoor = async (document) => {
  try {
    const response = await axios.post(
      "/Clients/GetClientByIdIntegradoor",
      {
        document,
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