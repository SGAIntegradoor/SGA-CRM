import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginSSO } from "../services/Login/loginSSO";

export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const nav = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState({});

  useEffect(() => {
    setUserData(JSON.parse(localStorage.getItem("userData")));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("logged");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const loginWithSSO = async (token) => {
    try {
      const response = await loginSSO(token);

      if (response?.status !== "Ok") {
        nav("/login");
        return;
      }

      // Guardar datos de sesión
      localStorage.setItem("logged", true);
      localStorage.setItem("userData", JSON.stringify(response.data.usuario));
      localStorage.setItem("token", token);

      setUserData(response.data.usuario);
      setIsAuthenticated(true);
    } catch (err) {
      console.error("Error en login SSO:", err);
      nav("/login");
    }
  };

  const login = (token, userData) => {
    localStorage.setItem("logged", true);
    localStorage.setItem("userData", JSON.stringify(userData));
    setUserData(userData);
    setIsAuthenticated(token);
  };

  const logout = () => {
    localStorage.removeItem("logged");
    localStorage.removeItem("userData");
    localStorage.removeItem("lastVisitCRM");
    setIsAuthenticated(false);
    setUserData({});
    nav("/login");
  };

  const isLogged = () => {
    return isAuthenticated;
  };

  const loggedData = () => {
    return userData;
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, login, logout, isLogged, loggedData, loginWithSSO }}
    >
      {children}
    </AuthContext.Provider>
  );
};
