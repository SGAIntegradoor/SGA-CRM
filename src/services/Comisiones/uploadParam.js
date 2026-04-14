import axios from "axios";

export const updateParam = async (data) => {
  const response = await axios.post(
    `/Commissions/updateParam`,
    data,
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data; // espera {status: 'Ok', ...}
};