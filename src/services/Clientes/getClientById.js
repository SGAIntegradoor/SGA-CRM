import axios from "axios";

export const getClientById = async (granted, document) => {
  try {
    const response = await axios.post(
      "/Clients/GetClientById",
      {
        granted,
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
