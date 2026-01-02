import axios from "axios";

export const getBeneficiarios = async () => {
  try {
    const response = await axios.post(
      "/Policy/getBeneficiarios",
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
