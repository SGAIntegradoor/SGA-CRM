// utils/getCities.js
import axios from "axios";

export const obtenerCiudades = async (codigoDpto) => {
  try {
    // Normalizar el valor de departamento sin importar cómo llegue
    const raw =
      codigoDpto && typeof codigoDpto === "object"
        ? // soporta { value }, eventos, y objetos raros
          (codigoDpto.value ??
           codigoDpto.target?.value ??
           // fallback por si te llega { departamento: '05' } u otros
           codigoDpto.departamento ??
           codigoDpto.cod ??
           null)
        : codigoDpto; // string o number directo

    const codeStr = String(raw ?? "").trim();
    if (!codeStr) return []; // nada que consultar

    // Asegurar 2 dígitos
    const depto = codeStr.padStart(2, "0");

    const respuesta = await axios.post(`/Utils/getCities`, {
      departamento: depto,
    });

    const data = Array.isArray(respuesta?.data?.data)
      ? respuesta.data.data
      : [];

    // Map a {label, value} con defensivo
    return data.map((ciudad) => ({
      label: ciudad?.ciudad ?? "",
      value: ciudad?.codigo ?? "",
    }));
  } catch (error) {
    console.error("Error al obtener ciudades:", error);
    return [];
  }
};
