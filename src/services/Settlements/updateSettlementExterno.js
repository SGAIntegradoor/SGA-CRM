import axios from "axios";

export const updateSettlementExterno = async (data) => {
  try {
    const response = await axios.post(
      "/SettlementsExterno/updateSettlementExterno",
      data,
      { headers: { "Content-Type": "application/json" } }
    );
    const payload = response?.data ?? {};
    return payload?.data ?? payload;
  } catch (error) {
    return { status: "Error", message: error.message };
  }
};
