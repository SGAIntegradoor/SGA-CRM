import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { decodeToken, isTokenExpired } from '../utils/jwtHelper';

/**
 * Componente que maneja el callback del SSO desde Integradoor
 * Recibe el token JWT por query parameter y lo valida
 */
const SSOCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('validating');
  const [message, setMessage] = useState('Validando credenciales...');

  useEffect(() => {
    const processToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('No se recibió token de autenticación');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        // Verificar si el token ha expirado
        if (isTokenExpired(token)) {
          setStatus('error');
          setMessage('El token ha expirado. Redirigiendo al login...');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Decodificar el token para obtener los datos del usuario
        const decoded = decodeToken(token);
        
        if (!decoded || !decoded.data) {
          setStatus('error');
          setMessage('Token inválido. Redirigiendo al login...');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Realizar login con el token
        const userData = decoded.data;
        
        // Guardar token y datos en el contexto de autenticación
        login(token, userData);

        setStatus('success');
        setMessage('Autenticación exitosa. Redirigiendo...');
        
        // Redirigir al dashboard o página principal
        setTimeout(() => navigate('/inicio'), 1000);
        
      } catch (error) {
        console.error('Error procesando token SSO:', error);
        setStatus('error');
        setMessage('Error al procesar la autenticación');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    processToken();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
        {status === 'validating' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">{message}</h2>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="text-green-500 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-600">{message}</h2>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="text-red-500 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-600">{message}</h2>
          </>
        )}
      </div>
    </div>
  );
};

export default SSOCallback;
