import axios from "axios";

export const syncRetomaSettlementPolizas = async (
  id_liquidacion,
  polizas = [],
  seleccionado = true,
) => {
  const payload = {
    id_liquidacion,
    seleccionado: seleccionado ? 1 : 0,
    polizas,
  };

  const { data } = await axios.post(
    "/Settlements/syncRetomaSettlementPolizas",
    payload,
    { headers: { "Content-Type": "application/json" } },
  );

  return data?.data ?? data;
};
