import axios from "axios";

export const selectPolizaBatch = async (ids_polizas = [], seleccionado = true) => {
  const payload = {
    ids_polizas,
    seleccionado: seleccionado ? 1 : 0,
  };

  const { data } = await axios.post(
    "/Commissions/selectToLiqBatch",
    payload,
    { headers: { "Content-Type": "application/json" } },
  );

  return data;
};
