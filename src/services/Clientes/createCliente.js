import axios from "axios";

export const createClient = async (granted, body) => {
  try {
    const response = await axios.post(
      "/Clients/CreateClient",
      {
        data: body,
        granted: granted,
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
