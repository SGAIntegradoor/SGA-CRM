import axios from "axios";

export const getTiposPoliza = async () => {
  try {
    const response = await axios.post(
      "/Policy/getTiposPoliza",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.data.map((tipo) => ({
      value: tipo.id_tipo_poliza,
      label: tipo.tipo_poliza,
    }));
  } catch (error) {
    return error;
  }
};
