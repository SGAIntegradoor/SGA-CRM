import axios from "axios";

export const getClientEdit = async (id, granted) => {
  try {
    const response = await axios.post(
      "/Clients/GetClientEdit",
      {
        data: { id, granted },
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
