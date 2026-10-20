import axios from "axios";
import { getToken } from "../../utils/jwtHelper";

// La IA puede tardar con PDFs de varias páginas
const TIMEOUT_MS = 150000;

/**
 * Envía el PDF de la póliza al lector con IA (apiLector /Lector/analizarPoliza).
 * Devuelve { status: "Ok", data, camposFaltantes, advertencias } o
 * { status: "Error", message } sin lanzar.
 */
export const analizarPolizaPdf = async (archivo) => {
  const token = getToken();
  const formData = new FormData();
  formData.append("pdf", archivo);
  // Respaldo por si el hosting quita el header Authorization
  if (token) formData.append("token", token);

  try {
    const response = await axios.post("/Lector/analizarPoliza", formData, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: TIMEOUT_MS,
    });
    return response.data;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      return {
        status: "Error",
        message: "La lectura tardó demasiado. Intenta de nuevo.",
      };
    }
    return {
      status: "Error",
      message:
        error.response?.data?.message ||
        "No se pudo analizar el PDF. Verifique su conexión e intente nuevamente.",
    };
  }
};
