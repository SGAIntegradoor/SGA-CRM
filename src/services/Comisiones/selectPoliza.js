import axios from "axios";

export const selectPoliza = async (id_poliza, seleccionado, id_liquidacion) => {
  const payload = {
    id_poliza,
    seleccionado: seleccionado ? 1 : 0,
    ...(id_liquidacion ? { id_liquidacion } : {}),
  };
  const { data } = await axios.post(
    "/Commissions/selectToLiq",
    payload,
    { headers: { "Content-Type": "application/json" } }
  );
  return data; // espera {status: 'Ok', ...}
};