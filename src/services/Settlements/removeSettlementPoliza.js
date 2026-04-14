import axios from "axios";

export const removeSettlementPoliza = async (id_liquidacion, id_anexo_poliza) => {
  try {
    const response = await axios.post("/Settlements/removeSettlementPoliza", {
      id_liquidacion,
      id_anexo_poliza,
    });
    const payload = response?.data ?? {};
    return payload?.data ?? payload;
  } catch (error) {
    return { status: "Error", message: error.message };
  }
};
