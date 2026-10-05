import React from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { MicrosoftIcon } from './Icons';

/**
 * Componente de botón para iniciar sesión con Microsoft Entra ID (Azure AD)
 * mediante el flujo de ventana emergente (Popup), utilizando el logo oficial SVG de Microsoft.
 */
export const LoginButton = () => {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch((error) => {
      console.error("Error al iniciar sesión con MSAL:", error);
    });
  };

  return (
    <button className="btn btn-microsoft" onClick={handleLogin}>
      <MicrosoftIcon size={18} />
      <span>Iniciar Sesión con Microsoft</span>
    </button>
  );
};

export default LoginButton;
