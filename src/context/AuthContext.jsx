import React, { createContext, useState, useEffect, useContext } from "react";
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
  PERMISSIONS,
} from "../utils/jwtHelper";

export const AuthContext = createContext();

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const nav = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState({});
  const [permissions, setPermissions] = useState({});
  const [tokenTimeRemaining, setTokenTimeRemaining] = useState("");

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
        const storedPermisos = localStorage.getItem("permisos");
        if (storedData) {
          setUserData(JSON.parse(storedData));
        }
        if (storedPermisos) {
          setPermissions(JSON.parse(storedPermisos));
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
          console.warn("El token está por expirar");
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

  const login = (token, responseData) => {
    // Guardar JWT token
    if (token) {
      saveToken(token);
    }

    // Normalizar la estructura de datos
    // Puede venir como:
    // 1. Login normal: { state, token, userData: {...}, permisos: {...} }
    // 2. SSO (decoded token): { id_usuario, nombre, permisos: {...} }

    let normalizedUserData;
    let normalizedPermisos;

    // Si tiene userData anidado (viene del login normal)
    if (responseData?.userData) {
      normalizedUserData = {
        id_usuario: responseData.userData.id_usuario,
        nombre: responseData.userData.nombre,
        apellido: responseData.userData.apellido,
        usuario: responseData.usuario,
        documento: responseData.userData.documento,
        foto: responseData.userData.usu_foto,
        id_rol: responseData.userData.id_rol,
        id_intermediario: responseData.userData.id_intermediario,
        id_cargo: responseData.userData.id_cargo,
        descripcion_cargo: responseData.userData.descripcion_cargo,
      };
      normalizedPermisos =
        responseData.permisos || responseData.userData.permisos || {};
    }
    // Si tiene id_usuario directo (viene del SSO/token decodificado)
    else if (responseData?.id_usuario) {
      normalizedUserData = {
        id_usuario: responseData.id_usuario,
        nombre: responseData.nombre,
        apellido: responseData.apellido,
        usuario: responseData.usuario,
        documento: responseData.userData.documento,
        foto: responseData.foto,
        id_rol: responseData.id_rol,
        id_intermediario: responseData.id_intermediario,
        id_cargo: responseData.id_cargo,
        descripcion_cargo: responseData.descripcion_cargo,
      };
      normalizedPermisos = responseData.permisos || {};
    }
    // Fallback: intentar obtener del token
    else {
      //console.log(responseData);
      const tokenData = getUserFromToken();
      normalizedUserData = tokenData || responseData;
      normalizedPermisos = tokenData?.permisos || {};
    }

    localStorage.setItem("logged", true);
    localStorage.setItem("userData", JSON.stringify(normalizedUserData));
    localStorage.setItem("permisos", JSON.stringify(normalizedPermisos));

    setUserData(normalizedUserData);
    setPermissions(normalizedPermisos);
    setIsAuthenticated(true);
  };

  const logout = () => {
    clearSession();
    localStorage.removeItem("lastVisitCRM");
    localStorage.removeItem("permisos");
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
        PERMISSIONS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
