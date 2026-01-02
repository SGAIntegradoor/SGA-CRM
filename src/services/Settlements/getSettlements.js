import axios from "axios";

export const getSettlements = async (fechaInicio, fechaFin, no_liquidacion, usuario, estadoLiquidacion) => {
  try {
    const response = await axios.post(
      `/Settlements/getSettlements`,
      { fechaInicio, fechaFin, no_liquidacion, usuario, estadoLiquidacion }
    );
    return response.data;
  } catch (error) {
    return { status: "Error", message: error.message };
  }
};