import axios from "axios";

export const getFreelances = async () => {
  try {
    const response = await axios.post(
      "/Users/getAllFreelances",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const { data } = response.data.data;
    return data.map((freelance) => ({
      value: freelance.id_usuario,
      label: freelance.nombre_completo_freelance,
    }));;

  } catch (error) {
    return error;
  }
};
