import axios from "axios";

export const selectPoliza = async (id_poliza, seleccionado) => {
  const payload = { id_poliza, seleccionado: seleccionado ? 1 : 0 };
  const { data } = await axios.post(
    "/Commissions/selectToLiq",
    payload,
    { headers: { "Content-Type": "application/json" } }
  );
  return data; // espera {status: 'Ok', ...}
};