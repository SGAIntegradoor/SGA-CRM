/* eslint-disable */
import {
  Box,
  Typography,
  useTheme,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Popover,
  useMediaQuery,
} from "@mui/material";
import { ExpandLess, ExpandMore, SafetyCheck } from "@mui/icons-material";
import HomeIcon from "@mui/icons-material/Home";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { cloneElement, Children, useContext, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { tokens } from "../../theme";
import { NavContext } from "../../context/NavContext";
import Integrador from "../../assets/img/integradoorLogoWhite.png";
import iconIntegradoor from "../../assets/img/iconLogoIntegradoorBlack.png";
import { FaCalculator } from "react-icons/fa6";
import { HiCurrencyDollar } from "react-icons/hi";
import { MdBusinessCenter } from "react-icons/md";
import { FaCircleCheck } from "react-icons/fa6";


const EXPANDED_WIDTH = 240;
const COLLAPSED_WIDTH = 64;
const ACCENT = "#88d600";
const drawerZIndex = 1000; // Puedes ajustar este valor según tus necesidades

// ── Item ──────────────────────────────────────────────────────────────────────
export const Item = ({
  title,
  to,
  icon,
  isCollapsed,
  setIsCollapsed,
  onAfterClick,
  closeOnClick = false,
}) => {
  const { selected, moving } = useContext(NavContext);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const isActive = selected === to;

  const handleClick = () => {
    moving(title);
    navigate(to);
    onAfterClick?.();
    if (closeOnClick) {
      setIsCollapsed(true);
    }
  };

  const btn = (
    <ListItemButton
      onClick={handleClick}
      sx={{
        borderRadius: "5px",
        mr: isCollapsed ? 0 : "7px",
        minHeight: 40,
        width: "100%",
        justifyContent: isCollapsed ? "center" : "flex-start",
        px: isCollapsed ? "8px" : "12px",
        color: isActive ? ACCENT : colors.gray[100],
        backgroundColor: isActive ? `${colors.gray[900]} !important` : "transparent",
        "&:hover": {
          color: ACCENT,
          "& .MuiListItemIcon-root": { color: ACCENT },
        },
        "& .MuiListItemIcon-root": {
          color: isActive ? ACCENT : colors.gray[100],
          minWidth: 0,
          mr: isCollapsed ? 0 : "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
        },
      }}
    >
      <ListItemIcon>{icon}</ListItemIcon>
      {!isCollapsed && (
        <ListItemText
          primary={
            <Typography variant="h5" sx={{ padding: 0 }}>
              {title}
            </Typography>
          }
        />
      )}
    </ListItemButton>
  );

  return (
    <ListItem disablePadding sx={{ display: "block" }}>
      {isCollapsed ? (
        <Tooltip title={title} placement="right" arrow>
          {btn}
        </Tooltip>
      ) : (
        btn
      )}
    </ListItem>
  );
};

// ── SubMenuGroup ──────────────────────────────────────────────────────────────
const SubMenuGroup = ({ title, icon, isCollapsed, children }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [expanded, setExpanded] = useState(false);
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const closeTimer = useRef(null);

  const openPopover = (e) => {
    clearTimeout(closeTimer.current);
    setPopoverAnchor(e.currentTarget);
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setPopoverAnchor(null), 160);
  };

  const cancelClose = () => clearTimeout(closeTimer.current);

  const popoverOpen = Boolean(popoverAnchor);

  const triggerBtn = (
    <ListItemButton
      onMouseEnter={isCollapsed ? openPopover : undefined}
      onMouseLeave={isCollapsed ? scheduleClose : undefined}
      onClick={() => !isCollapsed && setExpanded((v) => !v)}
      sx={{
        borderRadius: "5px",
        mr: isCollapsed ? 0 : "7px",
        minHeight: 40,
        width: "100%",
        justifyContent: isCollapsed ? "center" : "flex-start",
        px: isCollapsed ? "8px" : "12px",
        color: colors.gray[100],
        "&:hover": {
          color: ACCENT,
          "& .MuiListItemIcon-root": { color: ACCENT },
        },
        "& .MuiListItemIcon-root": {
          color: colors.gray[100],
          minWidth: 0,
          mr: isCollapsed ? 0 : "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
        },
      }}
    >
      <ListItemIcon>{icon}</ListItemIcon>
      {!isCollapsed && (
        <>
          <ListItemText
            primary={
              <Typography variant="h5" sx={{ padding: 0 }}>
                {title}
              </Typography>
            }
          />
          {expanded ? (
            <ExpandLess fontSize="small" sx={{ color: colors.gray[300] }} />
          ) : (
            <ExpandMore fontSize="small" sx={{ color: colors.gray[300] }} />
          )}
        </>
      )}
    </ListItemButton>
  );

  return (
    <section>
      <Box
        onMouseEnter={!isCollapsed ? () => setExpanded(true) : undefined}
        onMouseLeave={!isCollapsed ? () => setExpanded(false) : undefined}
      >
        <ListItem disablePadding sx={{ display: "block" }}>
          {triggerBtn}
        </ListItem>

        {/* Modo expandido: acordeón */}
        {!isCollapsed && (
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <List dense disablePadding sx={{ pl: "8px" }}>
              {Children.map(children, (child) =>
                cloneElement(child, {
                  onAfterClick: () => setExpanded(false),
                })
              )}
            </List>
          </Collapse>
        )}
      </Box>

      {/* Modo colapsado: popover flotante al hacer hover */}
      {isCollapsed && (
        <Popover
          open={popoverOpen}
          anchorEl={popoverAnchor}
          onClose={() => setPopoverAnchor(null)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          disableRestoreFocus
          disableAutoFocus
          disableEnforceFocus
          PaperProps={{
            onMouseEnter: cancelClose,
            onMouseLeave: scheduleClose,
            elevation: 8,
            sx: {
              backgroundColor: colors.primary[400],
              borderRadius: 2,
              ml: "4px",
              minWidth: 210,
              overflow: "hidden",
            },
          }}
          sx={{
            pointerEvents: "none",
            "& .MuiPopover-paper": { pointerEvents: "auto" },
          }}
        >
          <Box sx={{ p: "8px" }}>
            <Typography
              variant="caption"
              sx={{
                px: "8px",
                py: "4px",
                display: "block",
                color: colors.gray[400],
                textTransform: "uppercase",
                fontSize: "0.65rem",
                letterSpacing: "0.08em",
                mb: "4px",
              }}
            >
              {title}
            </Typography>
            <List dense disablePadding>
              {Children.map(children, (child) =>
                cloneElement(child, {
                  isCollapsed: false,
                  onAfterClick: () => {
                    setPopoverAnchor(null);
                    setExpanded(false);
                  },
                })
              )}
            </List>
          </Box>
        </Popover>
      )}
    </section>
  );
};

// ── Contenido del sidebar (reutilizable en drawer mobile y pane desktop) ──────
const SidebarContent = ({
  isCollapsed,
  setIsCollapsed,
  colors,
  closeOnItemClick = false,
}) => (
  <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
    {/* Logo */}
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: isCollapsed ? "center" : "flex-start",
        px: isCollapsed ? "8px" : 2,
        py: "10px",
        backgroundColor: ACCENT,
        flexShrink: 0,
      }}
    >
      <a
        href="https://integradoor.com/app"
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "flex", alignItems: "center" }}
      >
        <img
          src={isCollapsed ? iconIntegradoor : Integrador}
          alt="Integradoor"
          style={{ maxHeight: 40, objectFit: "contain" }}
        />
      </a>
    </Box>

    {/* Navegación */}
    <Box
      sx={{
        pt: "10px",
        px: isCollapsed ? 0 : "2%",
        flexGrow: 1,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <List dense disablePadding>
        {/* Inicio */}
        <Item
          title="Inicio"
          to="/inicio"
          icon={<HomeIcon />}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          closeOnClick={closeOnItemClick}
        />

        {/* Clientes */}
        <Item
          title="Clientes"
          to="/clientes"
          icon={<AccountCircleIcon />}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          closeOnClick={closeOnItemClick}
        />

        {/* Registro de Póliza */}
        <Item
          title="Registro de Póliza"
          to="/polizas/registro"
          icon={<SafetyCheck />}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          closeOnClick={closeOnItemClick}
        />

        {/* Liquidación de comisiones — submenú */}
        <SubMenuGroup
          title="Liquidación de comisiones"
          icon={<FaCalculator size={19} />}
          isCollapsed={isCollapsed}
        >
          <Item
            title="Liquidar Usuario SGA"
            to="/comisiones/liquidacion/internos"
            // icon={<FaCalculator size={17} />}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            closeOnClick={closeOnItemClick}
          />
          <Item
            title="Liquidar Freelance"
            to="/comisiones/liquidacion/externos"
            // icon={<FaCalculator size={17} />}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            closeOnClick={closeOnItemClick}
          />
          <Item
            title="Configuración"
            to="/comisiones/configuracion"
            // icon={<FaCalculator size={17} />}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            closeOnClick={closeOnItemClick}
          />
        </SubMenuGroup>

        {/* Conciliación aseguradoras */}
        <Item
          title="Conciliación aseguradoras"
          to="/conciliacion/"
          icon={<FaCircleCheck size={20} />}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          closeOnClick={closeOnItemClick}
        />

        {/* Registro de pagos */}
        <Item
          title="Registro de pagos"
          to="/comisiones/registro/pagos"
          icon={<HiCurrencyDollar size={23} />}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          closeOnClick={closeOnItemClick}
        />

        {/* Administrador de negocios */}
        <Item
          title="Administrador de negocios"
          to="/polizas/consulta"
          icon={<MdBusinessCenter size={20} />}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          closeOnClick={closeOnItemClick}
        />
      </List>
    </Box>
  </Box>
);

// ── Sidebar principal ─────────────────────────────────────────────────────────
export const Sidebar = ({ isCollapsed, setIsCollapsed, loggedDataInfo }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const paperSx = {
    boxSizing: "border-box",
    backgroundColor: colors.primary[400],
    borderRight: "none",
    overflowX: "hidden",
    zIndex: drawerZIndex,
  };

  // Mobile: drawer temporal (slide desde la izquierda)
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={!isCollapsed}
        onClose={() => setIsCollapsed(true)}
        ModalProps={{ keepMounted: true }}
        sx={{
          zIndex: drawerZIndex,
          "& .MuiDrawer-paper": { ...paperSx, width: EXPANDED_WIDTH },
        }}
      >
        <SidebarContent
          isCollapsed={false}
          setIsCollapsed={setIsCollapsed}
          colors={colors}
          closeOnItemClick
        />
      </Drawer>
    );
  }

  // Desktop: drawer permanente que colapsa/expande
  return (
    <Drawer
      variant="permanent"
      sx={{
        zIndex: drawerZIndex,
        width: isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        flexShrink: 0,
        transition: "width 0.25s ease",
        "& .MuiDrawer-paper": {
          ...paperSx,
          width: isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
          transition: "width 0.25s ease",
          overflowY: "auto",
        },
      }}
    >
      <SidebarContent
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        colors={colors}
      />
    </Drawer>
  );
};
