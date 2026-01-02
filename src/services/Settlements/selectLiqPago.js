import axios from "axios";

export const selectLiqPago = async (id_liquidacion, seleccionado) => {
  const payload = { id_liquidacion, seleccionado: seleccionado ? 1 : 0 };
  const { data } = await axios.post(
    "/Settlements/selectLiqPago",
    payload,
    { headers: { "Content-Type": "application/json" } }
  );
  return data; // espera {status: 'Ok', ...}
};