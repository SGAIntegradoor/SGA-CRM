import axios from "axios";

export const getAllParams = async () => {
  const { data } = await axios.post(
    "/Commissions/getAllParams",
    { headers: { "Content-Type": "application/json" } }
  );
  return data.result; // espera {status: 'Ok', ...}
};