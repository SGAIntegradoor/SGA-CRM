import axios from "axios";

export const updateSMMLV = async (payload) => {
  const { data } = await axios.post(
    "/Commissions/updateSMMLV",
    payload,
    { headers: { "Content-Type": "application/json" } },
  );

  return data;
};
