import axios from "axios";

export const retrieveClientId = async (intermediario, granted, doc_client) => {
  try {
    const response = await axios.post(
      "/Clients/GetClient",

      {
        inter: intermediario,
        granted: granted,
        doc_client: doc_client,
      }
    );

    return response.data;
  } catch (error) {
    return error.response.data;
  }
};
