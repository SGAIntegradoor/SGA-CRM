import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/crm1/",   // 👈 importante, coincide con la carpeta
  plugins: [react()],
});