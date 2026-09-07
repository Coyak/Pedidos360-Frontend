import React from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';

/**
 * Componente de botón para iniciar sesión con Microsoft Entra ID (Azure AD)
 * mediante el flujo de ventana emergente (Popup).
 */
export const LoginButton = () => {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch((error) => {
      console.error("Error al iniciar sesión con MSAL:", error);
    });
  };

  return (
    <button className="btn btn-primary" onClick={handleLogin}>
      🔑 Iniciar Sesión con Microsoft
    </button>
  );
};

export default LoginButton;
