import axios from "axios";

export const getAllSMMLV = async () => {
  const { data } = await axios.post(
    "/Commissions/getAllSMMLV",
    {},
    { headers: { "Content-Type": "application/json" } },
  );

  return data;
};
