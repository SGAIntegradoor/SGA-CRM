import axios from "axios";

export const getRazonesModificaciones = async (tipo) => {
  try {
    const response = await axios.post(
      "/Policy/getRazonesModificaciones",
      {
        tipo_razon: tipo
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.data.map((concepto) => ({
      value: concepto.id_razones,
      label: concepto.razon,
    }));
  } catch (error) {
    return error;
  }
};
