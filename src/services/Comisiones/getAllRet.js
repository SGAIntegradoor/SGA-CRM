import axios from "axios";

export const getAllRet = async () => {
  const { data } = await axios.post(
    "/Commissions/getAllRet",
    { headers: { "Content-Type": "application/json" } }
  );
  return data.result.map(item => ({
    id: item.id_ret_user,
    porc_ret: item.porc_ret,
    enable: item.enable
  }));
   // espera {status: 'Ok', ...}
};