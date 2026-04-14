import axios from "axios";

export const getPreSettlements = async () => {
  try {
    const response = await axios.post(`/Settlements/getPreSettlements`, {});
    const payload = response?.data?.data ?? response?.data ?? {};
    const liquidaciones = Array.isArray(payload?.liquidacion)
      ? payload.liquidacion
      : [];

    return liquidaciones.map((item) => {

      const total = Number(item?.valor_total_liquidacion || 0);
      const anexos = Array.isArray(item?.anexos_liquidados)
        ? item.anexos_liquidados
        : [];

      return {
        id_liquidacion: item?.id_liquidacion ?? "",
        doc_usuario: item?.identificacion_usuario_sga ?? "",
        nombre_usuario: item?.usuario_sga ?? "",
        fecha: item?.fecha_liquidacion ?? "",
        estado: item?.estado ?? "",
        valor_total_comision: total.toLocaleString("es-CO", {
          style: "currency",
          currency: "COP",
          minimumFractionDigits: 0,
        }),
        doc_liquidador: item?.cc_emisor_poliza_liq ?? "",
        nombre_emisor_liq: item?.nombre_emisor_liq ?? "",
        ids_anexos: anexos.map((anexo) => anexo.id_anexo_poliza).join(", "),
        usuario_data: {
          id: item?.usuario_data.cargo ?? null,
          rol: item?.usuario_data.rol ?? null,
        },
      };

    });
  } catch (error) {
    return [];
  }
};
