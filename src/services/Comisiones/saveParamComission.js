import axios from "axios";

export const saveParamComission = async (body) => {
  const payload = body;
  const { data } = await axios.post(
    "/Commissions/saveParamComission",
    payload,
    { headers: { "Content-Type": "application/json" } }
  );
  return data; // espera {status: 'Ok', ...}
};