// services/Polizas/Query/getLiquidacionesToQuery.js
import axios from "axios";

export const getLiquidacionesToQuery = async (sendData) => {
  try {
    const resp = await axios.post(
      "/Policy/loadLiquidacionesToQuery",
      { data: sendData },
      { headers: { "Content-Type": "application/json" } }
    );

    const status = resp?.data?.status ?? "Ok";
    const codeStatus = resp?.data?.codeStatus ?? 200;

    const rows = Array.isArray(resp?.data?.data)
      ? resp.data.data
      : resp?.data?.data
      ? [resp.data.data]
      : [];

    if (!rows.length) {
      return { status, codeStatus: codeStatus || 404, data: null };
    }

    const mappingCargos = {
      "Director Comercial": "Director Comercial",
      "Analista Comercial": "Analista Comercial",
      "Asistente Comercial": "Asistente Comercial",
      "Analista Tecnica": "Analista Tecnica",
      "Asesor Comercial": "Asesor Comercial",
      "Asesor 10": "Asesor 10",
      "Asesor Ganador": "Asesor Ganador",
      "Asesor Freelance": "Asesor Freelance",
    };

    // estructura por defecto para todos los roles
    const objResponse = {
      "Analista Comercial": null,
      "Director Comercial": null,
      "Asistente Comercial": null,
      "Analista Tecnica": null,
      "Asesor Comercial": null,
      "Asesor 10": null,
      "Asesor Ganador": null,
      "Asesor Freelance": null,
    };

    rows.forEach((r) => {
      const cargoRaw = (r?.cargo_usuario ?? "").toString().trim();
      if (!cargoRaw) return;
      const key = mappingCargos[cargoRaw] ?? cargoRaw; // si no está mapeado, usa el literal

      const registro = {
        valor: r?.valor_comision ?? r?.valor ?? r?.valor_comision_director ?? null,
        fecha: r?.fecha_pago ?? r?.fecha ?? r?.fecha_pago_liq_director ?? null,
        id_liquidacion: r?.id_liquidacion ?? r?.liquidacion ?? r?.id ?? null,
        cargo_usuario: r?.cargo_usuario ?? cargoRaw,
      };

      // Si el rol no estaba en el esqueleto, lo agregamos (por seguridad)
      if (!(key in objResponse)) {
        objResponse[key] = null;
      }
      objResponse[key] = registro;
    });

    return { status, codeStatus, data: objResponse };
  } catch (error) {
    return {
      status: "Error",
      codeStatus: 500,
      message: error?.message || "Fallo consultando liquidaciones",
    };
  }
};
