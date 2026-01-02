import axios from "axios";

export const updateClient = async (id, body, granted) => {
  try {
    const response = await axios.post(
      "/Clients/UpdateClient",
      {
        id: id,
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
