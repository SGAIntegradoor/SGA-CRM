import axios from "axios";

export const removeSettlementPolizaExterno = async (
  id_liquidacion,
  id_anexo_poliza,
  tipo_usuario
) => {
  try {
    const response = await axios.post(
      "/SettlementsExterno/removeSettlementPolizaExterno",
      { id_liquidacion, id_anexo_poliza, tipo_usuario }
    );
    const payload = response?.data ?? {};
    return payload?.data ?? payload;
  } catch (error) {
    return { status: "Error", message: error.message };
  }
};
