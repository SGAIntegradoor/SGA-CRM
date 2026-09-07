import axios from "axios";

// El HTML de la liquidación llega con los recursos (logos, @font-face)
// en URLs absolutas a integradoor.com. Corriendo en localhost eso es
// otro origen y el navegador los descarta por CORS aunque el GET dé 200.
// Pasarlas a rutas relativas las manda al proxy de vite.config.js, que
// las resuelve contra integradoor.com pero las devuelve por
// localhost:5173: mismo origen, sin CORS de por medio.
//
// Solo aplica en desarrollo. En producción el CRM ya se sirve desde el
// mismo dominio que esos recursos y el HTML debe quedar intacto.
const RECURSOS_ABSOLUTOS = /https?:\/\/(?:www\.)?integradoor\.com\/app\//g;

const aRutasDelProxy = (html) =>
  typeof html === "string" ? html.replace(RECURSOS_ABSOLUTOS, "/app/") : html;

export const pdfServices = async (id) => {
  const { data } = await axios.post(
    "/PdfService/PdfService?id="+id,
  );

  if (!import.meta.env.DEV) return data;

  return { ...data, data: aRutasDelProxy(data?.data) };
};
