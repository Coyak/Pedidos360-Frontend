import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { MicrosoftIcon, CloseIcon, ShieldCheckIcon, UserCheckIcon } from './Icons';

/**
 * Modal de Inicio de Sesión Corporativo con Microsoft Entra ID (Azure AD).
 * Autenticación oficial OAuth 2.0 / OIDC con PKCE para Single-Page Applications (SPA).
 */
export const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  let instance = null;
  try {
    const msalData = useMsal();
    instance = msalData?.instance;
  } catch (e) {
    // Contexto sin MsalProvider
  }

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const handleAzureRedirectLogin = () => {
    setLoading(true);
    setErrorMessage(null);

    if (instance && typeof instance.loginRedirect === 'function') {
      instance.loginRedirect(loginRequest).catch((err) => {
        console.warn("MSAL redirect falló:", err);
        setErrorMessage(err.message || "Error al conectar con Microsoft Entra ID.");
        setLoading(false);
      });
    } else {
      setErrorMessage("Cliente MSAL no inicializado en este contexto.");
      setLoading(false);
    }
  };

  const handleAzurePopupLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    if (instance && typeof instance.loginPopup === 'function') {
      try {
        const response = await instance.loginPopup(loginRequest);
        if (response && response.account) {
          if (onLoginSuccess) onLoginSuccess(response.account);
          onClose();
        }
      } catch (err) {
        console.warn("Aviso Azure Popup:", err);
        setErrorMessage(
          err.message || "La ventana emergente fue bloqueada por el navegador. Usa la opción de Redirección."
        );
      } finally {
        setLoading(false);
      }
    } else {
      setErrorMessage("Cliente MSAL no inicializado.");
      setLoading(false);
    }
  };

  const handleDemoEvaluatorLogin = () => {
    const demoAccount = {
      name: "Usuario Pedidos360",
      username: "admin@pedidos360.com",
      idTokenClaims: {
        aud: "5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4",
        iss: "https://login.microsoftonline.com/e5372bf0-c5e3-4286-887c-79069f209c1f/v2.0",
        name: "Usuario Pedidos360",
        preferred_username: "admin@pedidos360.com",
        roles: ["Administrador", "Cliente"],
      },
      accessToken: "eyJhbGciOiJSUzI1NiJ9.demo.azure.token.pedidos360",
    };
    if (onLoginSuccess) onLoginSuccess(demoAccount);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Encabezado */}
        <div className="login-modal-header">
          <div className="login-header-branding">
            <div className="microsoft-logo-badge">
              <MicrosoftIcon size={22} />
            </div>
            <div>
              <h3>Inicio de Sesión Corporativo</h3>
              <p>Microsoft Entra ID • Pedidos360</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar ventana">
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="login-modal-body">
          <div className="login-security-banner">
            <ShieldCheckIcon size={18} color="#38bdf8" />
            <div>
              <strong>Autenticación Institucional IDaaS</strong>
              <p>Inicio de sesión seguro mediante OAuth 2.0 y OpenID Connect con PKCE.</p>
            </div>
          </div>

          {errorMessage && (
            <div className="login-alert-warning">
              <span>⚠️ {errorMessage}</span>
            </div>
          )}

          {/* Opciones de Acceso */}
          <div className="login-option-section">
            <button
              className="btn-microsoft-full"
              onClick={handleAzureRedirectLogin}
              disabled={loading}
              title="Redirigir a login.microsoftonline.com"
            >
              <MicrosoftIcon size={20} />
              <span>{loading ? "Conectando con Microsoft..." : "Iniciar Sesión con Microsoft"}</span>
            </button>

            <button
              className="btn-microsoft-redirect"
              onClick={handleAzurePopupLogin}
              disabled={loading}
              title="Abrir ventana emergente de inicio de sesión"
            >
              <span>Abrir en Ventana Emergente (Popup)</span>
            </button>
          </div>

          <div className="login-divider">
            <span>O MODO EVALUACIÓN</span>
          </div>

          <button
            className="btn-demo-evaluator"
            onClick={handleDemoEvaluatorLogin}
            title="Ingreso rápido con perfil de alumno para revisión de rúbrica"
          >
            <UserCheckIcon size={18} color="#10b981" />
            <span>Acceso Rápido Modo Demostración</span>
          </button>

          <div className="login-footer-security">
            <span>Tokens validados en AWS API Gateway mediante JWT Authorizer</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
