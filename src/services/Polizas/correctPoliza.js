import axios from "axios";

/**
 * Aplica la corrección de campos primarios de una póliza.
 * Sólo viajan los campos realmente modificados.
 *
 * @param {Object} payload
 * @param {number} payload.id_poliza
 * @param {number} payload.id_anexo_poliza
 * @param {boolean} payload.aplicar_todos_anexos
 * @param {string} payload.motivo
 * @param {Object} payload.campos - { nombre_columna: valor_nuevo }
 * @param {Object} payload.userData - { id_usuario }
 */
export const correctPoliza = async (payload) => {
  try {
    const response = await axios.post(
      "/Policy/correctPoliza",
      { data: payload },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error) {
    const respuesta = error?.response?.data;
    return {
      status: "Error",
      message:
        respuesta?.message ||
        "No fue posible aplicar la corrección. Intenta nuevamente.",
    };
  }
};
