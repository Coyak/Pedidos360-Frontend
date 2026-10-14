import React from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { MicrosoftIcon } from './Icons';

/**
 * Componente de botón para iniciar sesión con Microsoft Entra ID (Azure AD).
 * Tolera ejecución con o sin contexto MsalProvider activo.
 */
export const LoginButton = () => {
  let instance = null;
  try {
    const msalData = useMsal();
    instance = msalData?.instance;
  } catch (e) {
    // Si useMsal no tiene provider activo
  }

  const handleLogin = () => {
    if (instance && typeof instance.loginPopup === 'function') {
      instance.loginPopup(loginRequest).catch((error) => {
        console.error("Error al iniciar sesión con MSAL:", error);
      });
    } else {
      alert("Iniciando sesión con Microsoft Entra ID (Pedidos360 Store)");
    }
  };

  return (
    <button className="btn btn-microsoft" onClick={handleLogin}>
      <MicrosoftIcon size={18} />
      <span>Iniciar Sesión con Microsoft</span>
    </button>
  );
};

export default LoginButton;
