import { useTheme } from "@emotion/react";
import { Box } from "@mui/material";
import React from "react";
import { tokens } from "../../theme";

export const Footer = () => {
const theme = useTheme();
const colors = tokens(theme.palette.mode);
  return (
    <footer className="footer footer-center ml-0 mb-1 mt-4 w-900 xl:ml-2 xl:mr-2 md:w-auto md:mr-1 lg:w-auto p-5 rounded-sm shadow-md" style={{color: colors.gray[100], backgroundColor: colors.gray[700]}}>
      <Box display="flex" flexDirection="row" justifyContent="space-between">
        <div>
          <strong>CRM SGA - Copyright</strong> © <strong>{new Date().getFullYear()}</strong> Seguros Grupo Asistencia SAS BIC.
          Todos los derechos reservados.{" "}
        </div>
        <div>Versión <strong>1.0.0</strong> - Alpha</div>
      </Box>
    </footer>
  );
};
