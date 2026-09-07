import axios from "axios";

export const getFinancieras = async () => {
  try {
    const response = await axios.post(
      "/Policy/getFinancieras",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

     const financieras = Array.isArray(response?.data?.data)
      ? response.data.data
      : [];

    return financieras.map((financiera) => ({
      value: financiera.id,
      label: financiera.nombre_financiera,
    }));
  } catch (error) {
    console.error("getFinancieras:", error);
    // Siempre un arreglo: las vistas alimentan <Select options> con esto
    return [];
  }
};
