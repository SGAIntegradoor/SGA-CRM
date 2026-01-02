import axios from "axios";

export const getUser = async (id_usuario) => {
  try {
    const response = await axios.post(
      "/Users/getUser",
      { id_usuario }
    );
    const { data } = response.data.data;
    return data;

  } catch (error) {
    return error;
  }
};
