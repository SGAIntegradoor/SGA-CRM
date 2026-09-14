import axios from "axios";

/**
 * Certificados (anexos) de una póliza con los tipos de certificado que cada
 * uno puede tomar según las reglas del backend (tiposCertificadoPermitidos).
 * Devuelve siempre un arreglo: [{ id_anexo_poliza, no_certificado,
 * tipo_certificado, fecha_registro, tipos_permitidos: number[] }]
 */
export const getCertificadosPoliza = async (id_poliza) => {
  try {
    const response = await axios.post(
      "/Policy/getCertificadosPoliza",
      { data: { id_poliza } },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = response?.data?.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error consultando los certificados de la póliza:", error);
    return [];
  }
};
