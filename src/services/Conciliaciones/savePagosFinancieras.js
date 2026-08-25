import axios from "axios";

export const savePagosFinancieras = async (payload) => {
  try {
    const { data } = await axios.post(
      "/Conciliations/savePagosFinancieras",
      payload,
      {
        headers: { "Content-Type": "application/json" },
      },
    );
    return data;
  } catch (error) {
    return {
      status: "Error",
      message:
        error?.response?.data?.message ||
        error.message ||
        "No fue posible guardar el pago de las financieras",
    };
  }
};
