import { Box, Typography, useTheme } from "@mui/material";
import { useContext } from "react";
import { ProSidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { Link } from "react-router-dom";
import "react-pro-sidebar/dist/css/styles.css";
import { tokens } from "../../theme";
import Integrador from "../../assets/img/integradoorLogoWhite.png";
import iconIntegradoor from "../../assets/img/iconLogoIntegradoorBlack.png";
import HomeIcon from "@mui/icons-material/Home";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { Image } from "primereact/image";
import { NavContext } from "../../context/NavContext";
import { SafetyCheck } from "@mui/icons-material";
import { FaCalculator } from "react-icons/fa6";
import { HiCurrencyDollar } from "react-icons/hi";
import { MdBusinessCenter } from "react-icons/md";

/* eslint-disable */
export const Item = ({ title, to, icon, isCollapsed, setIsCollapsed }) => {
  const { selected, moving } = useContext(NavContext);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const handleClick = () => {
    // ☑️ No colapsar automáticamente al hacer clic en un item
    moving(title);
  };

  return (
    <MenuItem
      key={title}
      icon={icon}
      style={{
        color: colors.gray[100],
        backgroundColor: selected === to ? colors.gray[900] : "transparent",
        display: "flex",
        alignItems: "center",
        marginRight: isCollapsed ? "0px" : "7px",
        borderRadius: "5px",
      }}
      onClick={handleClick}
      active={selected === to}
    >
      <Typography variant="h5" sx={{ padding: "0px" }}>
        {isCollapsed ? "" : title}
      </Typography>
      <Link to={to} />
    </MenuItem>
  );
};

export const Sidebar = ({ isCollapsed, setIsCollapsed, loggedDataInfo }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box
      sx={{
        "& .pro-sidebar-inner": {
          background: `${colors.primary[400]} !important`,
        },
        "& .pro-icon-wrapper": {
          backgroundColor: "transparent !important",
          width: "28px",
          height: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },

        // Hover
        "& .pro-inner-item:hover": {
          color: "#88d600 !important",
          position: "relative",
          zIndex: 2,
        },

        // Activo
        "& .pro-menu-item.active": {
          color: "#88d600 !important",
          borderLeft: isCollapsed ? "3px solid #88d600" : "",
        },

        // Alturas / padding
        "& .pro-menu": {
          height: "100% !important",
        },
        "& .pro-sidebar .pro-menu": {
          paddingTop: "0px",
          paddingBottom: "0px",
        },

        // Logo
        "& #logos .pro-item-content": {
          backgroundColor: "#88d600 !important",
          verticalAlign: "middle",
        },

        // ===== ALINEACIÓN SUBMENU & ÍCONOS =====

        // Centrar y alinear la flecha del SubMenu (modo normal)
        "& .pro-sidebar .pro-inner-item .pro-arrow": {
          top: "50% !important",
          transform: "translateY(-50%)",
          right: "10px",
        },

        // Alinear aún más en colapsado
        "& .pro-sidebar.collapsed .pro-inner-item .pro-arrow": {
          display: "none !important",
        },

        // (Opcional) Ocultar flecha en modo colapsado para un look limpio
        // Descomenta si la quieres ocultar:
        // "& .pro-sidebar.collapsed .pro-inner-item .pro-arrow": {
        //   display: "none",
        // },

        // // Sangría de sub-items (modo normal)
        // "& .pro-menu .pro-sub-menu .pro-menu-item > .pro-inner-item": {
        //   paddingLeft: "36px !important",
        // },

        // // Sangría de sub-items (modo colapsado) -> más a la izquierda
        // "& .pro-sidebar.collapsed .pro-sub-menu .pro-menu-item > .pro-inner-item":
        //   {
        //     paddingLeft: "14px !important",
        //   },

        // Ícono de sub-items en colapsado: más pegado a la izquierda
        "& .pro-sidebar.collapsed .pro-sub-menu .pro-menu-item > .pro-inner-item .pro-icon-wrapper":
          {
            marginRight: "0 !important",
          },

        // Ícono del título del SubMenu en colapsado: también alineado
        "& .pro-sidebar.collapsed .pro-menu > .pro-sub-menu > .pro-inner-item > .pro-icon-wrapper":
          {
            marginLeft: "4px !important",
            marginRight: "0",
          },

        // Ítems raíz: padding consistente
        "& .pro-menu .pro-menu-item > .pro-inner-item": {
          padding: "8px 12px",
          minHeight: "40px",
        },

        /* Flecha bien centrada en modo normal */

        /* ❌ Ocultar flecha en modo colapsado (evita el desalineado que se ve en tu captura) */
        // "& .pro-sidebar.collapsed .pro-menu > .pro-sub-menu > .pro-inner-item > .pro-arrow":
        //   {
        //     display: "none !important",
        //   },

        /* Sub-items (modo normal): sangría cómoda */
        "& .pro-menu .pro-sub-menu .pro-menu-item > .pro-inner-item": {
          paddingLeft: "36px !important",
        },

        /* Sub-items (modo colapsado): más a la izquierda */
        "& .pro-sidebar.collapsed .pro-sub-menu .pro-menu-item > .pro-inner-item":
          {
            paddingLeft: "12px !important",
          },

        /* Ícono de cualquier item en colapsado: pegado a la izquierda y sin margen extra */
        "& .pro-sidebar.collapsed .pro-inner-item > .pro-icon-wrapper": {
          marginLeft: "4px !important",
          marginRight: "0 !important",
        },

        "& .pro-inner-list-item": {
          paddingLeft: "5px !important",
        },
        "& .pro-sidebar.collapsed .pro-menu > .pro-sub-menu > .pro-inner-item > .pro-arrow":
          {
            right: "50px !important",
            top: "50% !important",
            transform: "translateY(-50%)",
            // Si prefieres ocultarla: descomenta la línea de abajo y borra las 3 de arriba
            // display: "none !important",
          },
        "& .pro-arrow-wrapper": {
          right: "10px",
          top: "41% !important",
          transform: "translateY(-50%)",
        },
      }}
    >
      <ProSidebar collapsed={isCollapsed} collapsedWidth={64}>
        <Menu iconShape="square">
          <MenuItem
            style={{
              color: colors.gray[100],
            }}
            id="logos"
            // onFocus={}
          >
            {!isCollapsed && (
              <Box
                id="logoIntegradoor"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <a
                  href="https://integradoor.com/Pruebas"
                  target="_blank"
                  rel="noopener"
                >
                  <Image src={Integrador} />
                </a>
              </Box>
            )}
            {isCollapsed && (
              <Box id="icoIntegradoor">
                <a
                  href="https://integradoor.com/Pruebas"
                  target="_blank"
                  rel="noopener"
                >
                  <Image src={iconIntegradoor} />
                </a>
              </Box>
            )}
          </MenuItem>

          <Box
            paddingLeft={isCollapsed ? undefined : "2%"}
            marginTop={isCollapsed ? undefined : "10px"}
          >
            {/* Inicio */}
            <Item
              title="Inicio"
              to={"/inicio"}
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
              icon={<HomeIcon />}
            />

            {/* Clientes con sub-items */}
            <Item
              title="Clientes"
              to="/clientes"
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
              icon={<AccountCircleIcon />} // puedes quitar el icono del sub-item si quieres aún más alineado
            />

            {/* Registro de póliza (solo) */}
            <Item
              title="Registro de Póliza"
              to="/polizas/registro"
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
              icon={<SafetyCheck />}
            />

            {/* Comisiones con sub-items */}

            <Item
              title="Liquidación de comisiones"
              icon={<FaCalculator size={19} />}
              to="/comisiones/liquidacion"
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
            />

            <Item
              title="Registro de pagos"
              icon={<HiCurrencyDollar size={23} />}
              to="/comisiones/registro/pagos"
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
            />

            {/* Consultas de pólizas (solo) */}
            <Item
              title="Administrador de negocios"
              to="/polizas/consulta"
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
              icon={<MdBusinessCenter size={20} />}
            />
          </Box>
        </Menu>
      </ProSidebar>
    </Box>
  );
};
