import axios from "axios";

const POLIZA_VACIA = {
  id_remision: null,
  tipo_poliza: 0,
  bloqueada: false,
  liquidaciones: [],
  familia: [],
  nueva_en_familia: false,
  nueva_en_remision: false,
};

/**
 * Certificados (anexos) de una póliza con los tipos de certificado que cada
 * uno puede tomar según las reglas del backend (tiposCertificadoPermitidos),
 * más el contexto de la póliza para el módulo de corrección.
 * Devuelve siempre:
 *  - certificados: [{ id_anexo_poliza, no_certificado, tipo_certificado,
 *    fecha_registro, tipos_permitidos: number[] }]
 *  - poliza: { id_remision, tipo_poliza, bloqueada, liquidaciones[],
 *    familia[], nueva_en_familia, nueva_en_remision }
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
    return {
      certificados: Array.isArray(data) ? data : [],
      poliza: { ...POLIZA_VACIA, ...(response?.data?.poliza ?? {}) },
    };
  } catch (error) {
    console.error("Error consultando los certificados de la póliza:", error);
    return { certificados: [], poliza: { ...POLIZA_VACIA } };
  }
};
