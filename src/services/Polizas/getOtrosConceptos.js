import axios from "axios";

export const getOtrosConceptos = async () => {
  try {
    const response = await axios.post(
      "/Policy/getOtrosConceptos",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.data.map((concepto) => ({
      value: concepto.id_otros_conceptos,
      label: concepto.razones_otros_conceptos,
    }));
  } catch (error) {
    return error;
  }
};
