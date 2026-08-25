import { Box, IconButton, useTheme, Menu, MenuItem, Typography } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { ColorModeContext, tokens } from "../../theme";
import { AuthContext } from "../../context/AuthContext";
import { NavContext }  from "../../context/NavContext";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";

export const Topbar = ({ isCollapsed, setIsCollapsed }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { isLogged, logout, loggedData } = useContext(AuthContext);
  const [imageSession, setImageSession] = useState("");
  const {clearState} = useContext(NavContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    let userData = JSON.parse(localStorage.getItem("userData"));
    if (isLogged()) {
      setImageSession(`https://integradoor.com/app/${userData?.foto}`);
    }
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogOut = () => { 
    setAnchorEl(null);
    clearState();
    logout();
  };

  // console.log(imageSession)

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      width="100%"
      padding="11px"
      paddingBottom="7px"
      boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);"
    >
      <Box display="flex">
        <IconButton
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            color: colors.gray[400],
          }}
          type="button"
        >
          <MenuOutlinedIcon />
        </IconButton>
      </Box>
      {/* Icon Buttonss */}
      <Box display="flex" alignItems="center" gap="12px">
        <a
          id="btnVolverIntegradoor"
          href="https://integradoor.com/app/"
          className="flex items-center rounded-md bg-lime-9000 h-[35px] px-4 text-sm font-semibold text-white transition duration-300 ease-in-out hover:bg-lime-600"
        >
          Volver a Integradoor
        </a>
        <IconButton
          id="basic-button"
          aria-controls={open ? "basic-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClick}
        >
          {/* <PersonOutlinedIcon /> */}
          <img
            src={
              isLogged()
                ? `${imageSession}`
                : "img"
            }
            alt="Avatar"
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
            }}
          />
          
        </IconButton>
      </Box>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        {/* <MenuItem onClick={handleClose}><Typography variant="h5">Perfil</Typography></MenuItem>
        <MenuItem onClick={handleClose}><Typography variant="h5">Mi Cuenta</Typography></MenuItem> */}
        <MenuItem onClick={handleLogOut}><Typography variant="h5">Logout</Typography></MenuItem>
      </Menu>
    </Box>
  );
};
