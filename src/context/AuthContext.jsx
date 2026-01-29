import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginSSO } from "../services/Login/loginSSO";
import { 
  getToken, 
  getUserFromToken, 
  isAuthenticated as checkAuth, 
  clearSession,
  saveToken,
  getPermissions,
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
  isTokenExpiringSoon,
  getFormattedTimeRemaining,
  PERMISSIONS
} from "../utils/jwtHelper";

export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const nav = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState({});
  const [permissions, setPermissions] = useState({});
  const [tokenTimeRemaining, setTokenTimeRemaining] = useState('');

  // Verificar autenticación al cargar
  useEffect(() => {
    const token = getToken();
    if (token && checkAuth()) {
      setIsAuthenticated(true);
      const userFromToken = getUserFromToken();
      if (userFromToken) {
        setUserData(userFromToken);
        setPermissions(userFromToken.permisos || {});
      } else {
        // Fallback a localStorage si el token no tiene datos
        const storedData = localStorage.getItem("userData");
        if (storedData) {
          setUserData(JSON.parse(storedData));
        }
      }
    } else if (token) {
      // Token existe pero expiró
      clearSession();
      setIsAuthenticated(false);
    }
  }, []);

  // Actualizar tiempo restante del token cada minuto
  useEffect(() => {
    if (isAuthenticated) {
      const updateTime = () => {
        setTokenTimeRemaining(getFormattedTimeRemaining());
        
        // Avisar si el token está por expirar
        if (isTokenExpiringSoon()) {
          console.warn('El token está por expirar');
        }
      };
      
      updateTime();
      const interval = setInterval(updateTime, 60000); // Cada minuto
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loginWithSSO = async (token) => {
    try {
      const response = await loginSSO(token);

      if (response?.status !== "Ok") {
        nav("/login");
        return;
      }

      // Guardar JWT si viene en la respuesta
      if (response.data?.token) {
        saveToken(response.data.token);
      }

      // Guardar datos de sesión
      localStorage.setItem("logged", true);
      localStorage.setItem("userData", JSON.stringify(response.data.usuario));
      localStorage.setItem("token", token);

      const userFromToken = getUserFromToken();
      setUserData(userFromToken || response.data.usuario);
      setPermissions(userFromToken?.permisos || {});
      setIsAuthenticated(true);
    } catch (err) {
      console.error("Error en login SSO:", err);
      nav("/login");
    }
  };

  const login = (token, userData) => {
    // Guardar JWT token
    if (token) {
      saveToken(token);
    }
    
    localStorage.setItem("logged", true);
    localStorage.setItem("userData", JSON.stringify(userData));
    
    // Obtener datos del token si está disponible
    const tokenData = getUserFromToken();
    setUserData(tokenData || userData);
    setPermissions(tokenData?.permisos || {});
    setIsAuthenticated(true);
  };

  const logout = () => {
    clearSession();
    localStorage.removeItem("lastVisitCRM");
    setIsAuthenticated(false);
    setUserData({});
    setPermissions({});
    nav("/login");
  };

  const isLogged = () => {
    return isAuthenticated && checkAuth();
  };

  const loggedData = () => {
    return userData;
  };

  // Verificar si el usuario tiene un permiso específico
  const hasPermission = (permission) => {
    return checkPermission(permission);
  };

  // Verificar si tiene alguno de los permisos
  const hasAnyPermission = (permissionList) => {
    return checkAnyPermission(permissionList);
  };

  // Obtener todos los permisos del usuario
  const getUserPermissions = () => {
    return getPermissions();
  };

  return (
    <AuthContext.Provider
      value={{ 
        isAuthenticated, 
        login, 
        logout, 
        isLogged, 
        loggedData, 
        loginWithSSO,
        hasPermission,
        hasAnyPermission,
        getUserPermissions,
        permissions,
        tokenTimeRemaining,
        PERMISSIONS
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
