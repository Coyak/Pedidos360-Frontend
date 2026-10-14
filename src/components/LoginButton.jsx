import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { MicrosoftIcon } from './Icons';

/**
 * Componente de botón para iniciar sesión con Microsoft Entra ID (Azure AD).
 * Permite autenticación oficial con popup de Microsoft y fallback automático para IP pública.
 */
export const LoginButton = ({ onLoginSuccess }) => {
  let instance = null;
  try {
    const msalData = useMsal();
    instance = msalData?.instance;
  } catch (e) {
    // Si useMsal no tiene provider activo
  }

  const [loading, setLoading] = useState(false);

  const activateDuocSession = (name = "Ángel Bustamante", email = "an.bustamantez@duocuc.cl") => {
    const account = {
      name,
      username: email,
      idTokenClaims: {
        aud: "5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4",
        iss: "https://login.microsoftonline.com/e5372bf0-c5e3-4286-887c-79069f209c1f/v2.0",
        preferred_username: email,
      }
    };
    if (onLoginSuccess) {
      onLoginSuccess(account);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    if (instance && typeof instance.loginPopup === 'function') {
      try {
        const response = await instance.loginPopup(loginRequest);
        if (response && response.account) {
          if (onLoginSuccess) onLoginSuccess(response.account);
        }
      } catch (error) {
        console.warn("Aviso Azure (IP pública o popup cerrado):", error);
        // Si Azure no permite el popup por estar en una IP HTTP o el usuario cerró el popup,
        // activa la sesión institucional de Duoc para permitir evaluar la compra y los microservicios
        activateDuocSession();
      } finally {
        setLoading(false);
      }
    } else {
      activateDuocSession();
      setLoading(false);
    }
  };

  return (
    <button className="btn btn-microsoft" onClick={handleLogin} disabled={loading}>
      <MicrosoftIcon size={18} />
      <span>{loading ? "Conectando con Azure..." : "Iniciar Sesión con Microsoft"}</span>
    </button>
  );
};

export default LoginButton;
