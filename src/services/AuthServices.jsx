import axios from "axios";
import { saveToken, clearSession, getToken, isTokenExpired } from "../utils/jwtHelper";

/**
 * Realiza login y guarda el token JWT
 */
export const login = async (username, password) => {
    try {
        const response = await axios.post(
            "/Auth/Login/SSO/",
            {
              ingUsuario: username,
              ingPassword: password,
            }
          );
          
          // Guardar JWT token
          if (response.data.token) {
            saveToken(response.data.token);
          }
          
          localStorage.setItem("userData", JSON.stringify(response.data.userData));
          return response.data;
    }
    catch (error){
        return error.response?.data || { state: 'error', message: 'Error de conexión' };
    }
};

/**
 * Cierra sesión y limpia datos
 */
export const logout = () => {
    clearSession();
};

/**
 * Valida el token actual con el backend
 */
export const validateToken = async () => {
    const token = getToken();
    if (!token) {
        return { valid: false, error: 'NO_TOKEN' };
    }
    
    // Verificar expiración local primero
    if (isTokenExpired(token)) {
        return { valid: false, error: 'TOKEN_EXPIRED' };
    }
    
    try {
        const response = await axios.get("/Auth/Login/SSO/", {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        return { valid: false, error: error.response?.data?.error || 'VALIDATION_ERROR' };
    }
};
