import { Box, Typography } from "@mui/material";
import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { NavContext } from "../../context/NavContext";
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded";
import { useTheme } from "@emotion/react";
import { tokens } from "../../theme";

export const HeaderPage = ({ title }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { selected, moving } = useContext(NavContext);
  const location = useLocation();
  const onlyPath = location.pathname.slice(1, location.pathname.length);
  let newPath = "";

  if (onlyPath == "/clientes") {
    newPath = "Clientes";
  } else if (onlyPath == "cotizarmotos") {
    newPath = "Cotizador Motos";
  } else if (onlyPath == "cotizarpesados") {
    newPath = "Cotizador Pesados";
  } else if (onlyPath == "ayudaventas") {
    newPath = "Ayuda Ventas";
  } else if (onlyPath == "invitacion") {
    newPath = "Invitar Asesores";
  } else if (onlyPath == "cotizarlivianos") {
    newPath = "Cotizador Livianos";
  } else if (onlyPath == "editar-cotizacion") {
    newPath = "Editar Cotización";
  } else if (onlyPath == "cotizarlivianos") {
    newPath = "Cotizador Livianos";
  } else if (onlyPath == "cotizarlivianos") {
    newPath = "Cotizador Livianos";
  } else {
    newPath = onlyPath.replace(/\b\w/g, (l) => l.toUpperCase());
  }
  return (
    <div className="flex flex-row xs:p-6 xxs:p-6 xl:p-6 lg:p-6 md:p-6 xs:justify-center xxs:justify-center xxl:justify-between md:justify-between xl:justify-between lg:justify-between items-center">
      <Box>
        <Typography variant="h4" style={{ fontWeight: "bold" }}>
          {title}
        </Typography>
      </Box>
      {newPath !== "Inicio" ? (
        <div
          className="p-2 rounded-md text-sm xxs:hidden xs:hidden md:block xl:block xxl:block "
          style={{ color: colors.gray[100], backgroundColor: colors.gray[700] }}
        >
          {onlyPath === "inicio" ? (
            ""
          ) : (
            <>
              <Link
                to="/inicio"
                onClick={() => moving("Inicio")}
                className="hover:text-lime-9000"
              >
                <DashboardCustomizeRoundedIcon style={{ width: "16px" }} />{" "}
                <strong>Inicio</strong>
              </Link>
              &nbsp;{`  >  `}&nbsp;
              <strong>{newPath}</strong>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
};
