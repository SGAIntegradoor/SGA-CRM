import axios from "axios";

export const GetClientByFilters = async (filters) => {
  try {
    const response = await axios.post(
      "/Clients/GetClientByFilters",
      {
       filters ,
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
