/**
 * Helper para manejar JWT en el frontend
 * Permite decodificar tokens, verificar permisos y manejar la sesión
 */

const TOKEN_KEY = 'jwt_token';
const USER_DATA_KEY = 'userData';

/**
 * Guarda el token JWT en localStorage
 * @param {string} token - Token JWT
 */
export const saveToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Obtiene el token JWT de localStorage
 * @returns {string|null} Token o null
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Elimina el token JWT de localStorage
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Decodifica el payload del JWT sin verificar la firma
 * (La verificación se hace en el backend)
 * @param {string} token - Token JWT
 * @returns {object|null} Payload decodificado o null
 */
export const decodeToken = (token) => {
  try {
    if (!token) return null;
    
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decodificando token:', error);
    return null;
  }
};

/**
 * Obtiene los datos del usuario del token actual
 * @returns {object|null} Datos del usuario o null
 */
export const getUserFromToken = () => {
  const token = getToken();
  if (!token) return null;
  
  const decoded = decodeToken(token);
  return decoded?.data || null;
};

/**
 * Obtiene los permisos del usuario del token
 * @returns {object} Permisos del usuario
 */
export const getPermissions = () => {
  const userData = getUserFromToken();
  return userData?.permisos || {};
};

/**
 * Verifica si el usuario tiene un permiso específico
 * @param {string} permission - Nombre del permiso (clientes, cotizaciones, polizas, etc.)
 * @returns {boolean}
 */
export const hasPermission = (permission) => {
  const permisos = getPermissions();
  return permisos[permission] === 1;
};

/**
 * Verifica múltiples permisos a la vez
 * @param {string[]} permissions - Array de nombres de permisos
 * @returns {boolean} true si tiene TODOS los permisos
 */
export const hasAllPermissions = (permissions) => {
  return permissions.every(p => hasPermission(p));
};

/**
 * Verifica si tiene al menos uno de los permisos
 * @param {string[]} permissions - Array de nombres de permisos
 * @returns {boolean} true si tiene al menos uno
 */
export const hasAnyPermission = (permissions) => {
  return permissions.some(p => hasPermission(p));
};

/**
 * Verifica si el token ha expirado
 * @param {string} token - Token JWT (opcional, usa el guardado si no se proporciona)
 * @returns {boolean} true si expiró
 */
export const isTokenExpired = (token = null) => {
  const tokenToCheck = token || getToken();
  if (!tokenToCheck) return true;
  
  const decoded = decodeToken(tokenToCheck);
  if (!decoded?.exp) return true;
  
  // exp está en segundos, Date.now() en milisegundos
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

/**
 * Verifica si el token está próximo a expirar (15 minutos)
 * @returns {boolean}
 */
export const isTokenExpiringSoon = () => {
  const token = getToken();
  if (!token) return false;
  
  const decoded = decodeToken(token);
  if (!decoded?.exp) return false;
  
  const currentTime = Date.now() / 1000;
  const timeToExpire = decoded.exp - currentTime;
  
  // Menor a 15 minutos (900 segundos)
  return timeToExpire < 900 && timeToExpire > 0;
};

/**
 * Obtiene el tiempo restante del token en segundos
 * @returns {number} Segundos restantes (0 si expiró)
 */
export const getTokenTimeRemaining = () => {
  const token = getToken();
  if (!token) return 0;
  
  const decoded = decodeToken(token);
  if (!decoded?.exp) return 0;
  
  const currentTime = Date.now() / 1000;
  const remaining = decoded.exp - currentTime;
  
  return remaining > 0 ? Math.floor(remaining) : 0;
};

/**
 * Formatea el tiempo restante del token
 * @returns {string} Tiempo formateado (ej: "45:30")
 */
export const getFormattedTimeRemaining = () => {
  const seconds = getTokenTimeRemaining();
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Verifica si el usuario está autenticado con un token válido
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = getToken();
  return token && !isTokenExpired(token);
};

/**
 * Obtiene el ID del usuario del token
 * @returns {number|null}
 */
export const getUserId = () => {
  const userData = getUserFromToken();
  return userData?.id_usuario || null;
};

/**
 * Obtiene el rol del usuario
 * @returns {number|null}
 */
export const getUserRole = () => {
  const userData = getUserFromToken();
  return userData?.id_rol || null;
};

/**
 * Obtiene el cargo del usuario
 * @returns {object|null} { id_cargo, nombre_cargo }
 */
export const getUserCargo = () => {
  const userData = getUserFromToken();
  if (!userData) return null;
  return {
    id_cargo: userData.id_cargo,
    nombre_cargo: userData.nombre_cargo
  };
};

/**
 * Obtiene el intermediario del usuario
 * @returns {number|null}
 */
export const getUserIntermediario = () => {
  const userData = getUserFromToken();
  return userData?.id_intermediario || null;
};

/**
 * Limpia todos los datos de sesión
 */
export const clearSession = () => {
  removeToken();
  localStorage.removeItem(USER_DATA_KEY);
  localStorage.removeItem('logged');
};

/**
 * Lista de permisos disponibles en el CRM
 */
export const PERMISSIONS = {
  // Pólizas
  REGISTRO_POLIZA: 'registro_poliza',
  EDITAR_REMISIONES: 'editar_remisiones',
  CONSULTAR_POLIZA_CERTIFICADO: 'consultar_poliza_certificado',
  
  // Movimientos
  REGISTAR_MOVIMIENTO: 'registar_movimiento',
  EDITAR_MOVIMIENTO: 'editar_movimiento',
  VER_MOVIMIENTOS: 'ver_movimientos',
  
  // Pagos y Liquidaciones
  REGISTRAR_PAGOS_POLIZA: 'registrar_pagos_poliza',
  GENERAR_LIQ_COL_SGA: 'generar_liq_col_sga',
  REGISTRAR_PAGOS_COMISIONES: 'registrar_pagos_comisiones',
  CONSULTAR_LIQ_COMISIONES: 'consultar_liq_comisiones',
  ANULAR_LIQUIDACION: 'anular_liquidacion',
  
  // Clientes
  CREAR_CLIENTE: 'crear_cliente',
  CONSULTAR_CLIENTES: 'consultar_clientes',
  MODIFICAR_CLIENTES: 'modificar_clientes',
  
  // Configuración y Usuarios
  CONFIGURAR_COMISIONES: 'configurar_comisiones',
  CREAR_USUARIO: 'crear_usuario',
  CONSULTAR_USUARIOS: 'consultar_usuarios',
  MODIFICAR_USUARIOS: 'modificar_usuarios'
};

export default {
  saveToken,
  getToken,
  removeToken,
  decodeToken,
  getUserFromToken,
  getPermissions,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  isTokenExpired,
  isTokenExpiringSoon,
  getTokenTimeRemaining,
  getFormattedTimeRemaining,
  isAuthenticated,
  getUserId,
  getUserRole,
  getUserCargo,
  getUserIntermediario,
  clearSession,
  PERMISSIONS
};
