import axios from "axios";

export const createSettlementExterno = async (data) => {
  try {
    const response = await axios.post(
      "/SettlementsExterno/createSettlementExterno",
      data,
      { headers: { "Content-Type": "application/json" } }
    );
    const payload = response?.data ?? {};
    return payload?.data ?? payload;
  } catch (error) {
    return {
      status: "Error",
      message: error?.response?.data?.message || error.message,
    };
  }
};
