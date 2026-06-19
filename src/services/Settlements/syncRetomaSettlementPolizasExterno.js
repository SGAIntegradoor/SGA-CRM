import axios from "axios";

export const syncRetomaSettlementPolizasExterno = async (
  id_liquidacion,
  polizas = [],
  seleccionado = true,
  tipo_usuario = null
) => {
  const payload = {
    id_liquidacion,
    seleccionado: seleccionado ? 1 : 0,
    polizas,
    tipo_usuario,
  };

  const { data } = await axios.post(
    "/SettlementsExterno/syncRetomaSettlementPolizasExterno",
    payload,
    { headers: { "Content-Type": "application/json" } }
  );

  return data?.data ?? data;
};
