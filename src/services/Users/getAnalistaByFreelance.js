import axios from "axios";

export const getAnalistaByFreelance = async (idFreelance) => {
  try {
    const response = await axios.post(
      "/Users/getAnalistaByFreelance",
      {
        id_freelance: idFreelance
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const { data } = response.data;

    return data
  } catch (error) {
    return error;
  }
};
