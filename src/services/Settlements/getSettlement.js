import axios from "axios";

export const getSettlement = async (id_liquidacion) => {
  try {
    const response = await axios.post(
      `/Settlements/getSettlement`,
      { id_liquidacion }  // 👈 aquí sí viaja como { "id_liquidacion": 7 }
    );
    const payload = response?.data ?? {};
    return payload?.data ?? payload;
  } catch (error) {
    return { status: "Error", message: error.message };
  }
};