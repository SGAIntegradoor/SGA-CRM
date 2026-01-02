import axios from "axios";

export const retrieveClientData = async () => {
  try {
    const response = await axios.post(
      "/Clients/GetClients",
      {
        inter: "3",
        condition: "",
        rol: "",
        user: "1190",
      }
    );
    
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};
