import axios from "axios";

export const getDirectores = async () => {
  try {
    const response = await axios.post(
      "/Users/getDirectores",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const { data } = response.data;

    return data.data.map(({ nombre_director, documento_director }) => ({
      label: nombre_director,
      value: documento_director,
    }));
  } catch (error) {
    return error;
  }
};
