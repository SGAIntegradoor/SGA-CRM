// src/context/NavContext.jsx
import React, { createContext, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const NavContext = createContext();

const NavProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [actualSelected, setActualSelected] = useState("Inicio");
  const [isModalOpenCliente, setIsModalOpenCliente] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [movimientoContext, setMovimientoContext] = useState(null);
  const [selected, setSelected] = useState(location.pathname);

  useEffect(() => {
    // Redirige a /inicio si se entra directamente a /polizas
    if (location.pathname === "/polizas") {
      navigate("/inicio", { replace: true });
    }
    setSelected(location.pathname);
    const storedSelected = localStorage.getItem("actual_path");
    if (storedSelected) {
      setActualSelected(storedSelected);
    }
  }, [location.pathname, navigate]);

  const moving = (path) => {
    let newPath = "";

    switch (path) {
      case "Inicio":
        newPath = "/inicio";
        break;
      case "Admin. Integradoor":
        newPath = "/admincoti";
        break;
      case "Clientes":
        newPath = "/clientes";
        break;
      case "Registro de Póliza":
        newPath = "/polizas/registro";
        break;
      default:
        newPath = path.replace(/\b\w/g, (l) => l.toUpperCase());
        break;
    }

    localStorage.setItem("actual_path", newPath);
    setSelected(newPath);
    setActualSelected(newPath);
  };

 const loadMovimiento = (idPoliza, idMovimiento) => {
  const payload = { idPoliza, idMovimiento };
  setMovimientoContext(payload);
  return payload; // opcional: por si quieres encadenar algo
};

  const clearMovimiento = () => {
    setMovimientoContext(null);
  };

  const clearState = () => {
    setActualSelected("Inicio");
    localStorage.removeItem("actual_path");
  };

  const clearNewClient = () => {
    setIsNewClient(false);
  };

  const setNewClient = (set) => {
    setIsNewClient(set);
  }

  return (
    <NavContext.Provider
      value={{
        actualSelected,
        selected,
        moving,
        clearState,
        loadMovimiento,
        clearMovimiento,
        movimientoContext,
        isModalOpenCliente,
        setIsModalOpenCliente,
        selectedClientId,
        setSelectedClientId,

        // para clientes nuevos o buscarlos cuando se abra modal

        isNewClient,
        setNewClient,
        clearNewClient,
      }}
    >
      {children}
    </NavContext.Provider>
  );
};

export { NavContext };
export default NavProvider;
