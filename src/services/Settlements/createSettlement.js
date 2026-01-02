import axios from "axios";

export const createSettlement = async (data) => {
  try {
    const response = await axios.post(
      "/Settlements/createSettlement",
      data, 
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
