import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/crm/",   // 👈 importante, coincide con la carpeta
  plugins: [react()],
  server: {
    // El HTML de la liquidación trae logos y @font-face apuntando a
    // integradoor.com/app. El navegador pide esos recursos en modo CORS
    // -las fuentes siempre, y las imágenes porque html2pdf necesita leer
    // los píxeles- y el servidor no manda Access-Control-Allow-Origin,
    // así que en local se caían todos.
    //
    // En producción el CRM se sirve desde el mismo dominio y no hay
    // cruce de orígenes; el problema es solo del dev server. Con este
    // proxy los recursos salen por localhost:5173 y quedan del mismo
    // origen que la app, sin abrir CORS en integradoor.com.
    proxy: {
      "/app": {
        target: "https://integradoor.com",
        changeOrigin: true,
      },
    },
  },
});
