import axios from "axios";

export const saveSMMLV = async (payload) => {
  const { data } = await axios.post(
    "/Commissions/saveSMMLV",
    payload,
    { headers: { "Content-Type": "application/json" } },
  );

  return data;
};
