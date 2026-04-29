import axios from "axios";

export const getSettlements = async (fechagendesde, fechagenhasta, no_liquidacion, unidad_negocio, asesor_freelance, asesor_10, asesor_ganador, usuario_interno, estadoliquidacion) => {
  try {
    const response = await axios.post(
      `/Settlements/getSettlements`,
      {
        fechaInicio: fechagendesde,
        fechaFin: fechagenhasta,
        no_liquidacion,
        unidad_negocio,
        asesor_freelance,
        asesor_10,
        asesor_ganador,
        usuario: usuario_interno,
        estadoLiquidacion: estadoliquidacion,
      }
    );
    return response.data;
  } catch (error) {
    return { status: "Error", message: error.message };
  }
};