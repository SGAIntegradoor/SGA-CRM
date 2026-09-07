import axios from "axios";

/**
 * Historial de interacciones (bitácora) de una póliza.
 * @param {number|string} id_poliza
 * @returns {Array} filas de bitacora_control_polizas con el nombre del usuario
 */
export const getBitacoraPoliza = async (id_poliza) => {
  try {
    const response = await axios.post(
      "/Policy/getBitacoraPoliza",
      { data: { id_poliza } },
      { headers: { "Content-Type": "application/json" } }
    );
    const { data } = response.data ?? {};
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error consultando la bitácora de la póliza:", error);
    return [];
  }
};
