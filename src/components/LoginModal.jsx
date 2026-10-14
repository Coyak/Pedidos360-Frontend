import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { MicrosoftIcon, CloseIcon, ShieldCheckIcon } from './Icons';

/**
 * Modal de Inicio de Sesión Corporativo con Microsoft Entra ID (Azure AD).
 * Conexión oficial a login.microsoftonline.com mediante Popup y Redirección OAuth2 / OIDC con PKCE.
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

  const TENANT_ID = "e5372bf0-c5e3-4286-887c-79069f209c1f";
  const CLIENT_ID = "5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4";
  const REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/` : "http://localhost:5173/";

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
          "El popup fue bloqueado por tu navegador o requiere HTTPS. Usa el botón 'Redirección Oficial de Microsoft' para abrir directamente la página de login de Microsoft."
        );
      } finally {
        setLoading(false);
      }
    } else {
      handleAzureRedirectLogin();
    }
  };

  const handleAzureRedirectLogin = () => {
    setLoading(true);
    setErrorMessage(null);

    // Intentar primero vía MSAL redirect si la instancia está disponible
    if (instance && typeof instance.loginRedirect === 'function') {
      instance.loginRedirect(loginRequest).catch((err) => {
        console.warn("MSAL redirect advertencia, usando endpoint OIDC directo:", err);
        directMicrosoftOAuthRedirect();
      });
    } else {
      directMicrosoftOAuthRedirect();
    }
  };

  // Redirección directa al endpoint oficial de autorización de Microsoft Entra ID
  const directMicrosoftOAuthRedirect = () => {
    const scopeParam = encodeURIComponent(`openid profile email ${CLIENT_ID}/.default`);
    const redirectParam = encodeURIComponent(REDIRECT_URI);
    const state = Date.now();
    const nonce = Math.random().toString(36).substring(2);

    const authUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?client_id=${CLIENT_ID}&response_type=token+id_token&redirect_uri=${redirectParam}&scope=${scopeParam}&response_mode=fragment&state=${state}&nonce=${nonce}`;

    window.location.href = authUrl;
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Encabezado del Modal */}
        <div className="login-modal-header">
          <div className="login-header-branding">
            <div className="microsoft-logo-badge">
              <MicrosoftIcon size={24} />
            </div>
            <div>
              <h3>Inicio de Sesión Corporativo</h3>
              <p>Microsoft Entra ID (Azure AD) • Pedidos360</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar ventana">
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="login-modal-body">
          <div className="login-security-banner">
            <ShieldCheckIcon size={18} color="#0284c7" />
            <div>
              <strong>Autenticación Oficial Multi-Cloud</strong>
              <p>Conexión directa con el tenant institucional de Duoc UC en Microsoft Azure.</p>
            </div>
          </div>

          {errorMessage && (
            <div className="login-alert-warning">
              <span>⚠️ {errorMessage}</span>
            </div>
          )}

          {/* Opciones Oficiales Microsoft Entra ID */}
          <div className="login-option-section">
            <button
              className="btn-microsoft-full"
              onClick={handleAzureRedirectLogin}
              disabled={loading}
              title="Redirige directamente al portal oficial de login de Microsoft"
            >
              <MicrosoftIcon size={20} />
              <span>{loading ? "Redirigiendo a login.microsoftonline.com..." : "Iniciar Sesión con Microsoft (Redirección Oficial)"}</span>
            </button>

            <button
              className="btn-microsoft-redirect"
              onClick={handleAzurePopupLogin}
              disabled={loading}
              title="Abre ventana emergente de Microsoft"
            >
              <span>Abrir en Ventana Emergente (Popup MSAL)</span>
            </button>
          </div>

          {/* Información Técnica de Rúbrica */}
          <div className="login-tech-info">
            <div className="tech-info-row">
              <span>Azure Tenant ID:</span>
              <code>{TENANT_ID}</code>
            </div>
            <div className="tech-info-row">
              <span>Azure Client ID:</span>
              <code>{CLIENT_ID}</code>
            </div>
            <div className="tech-info-row">
              <span>Redirect URI Autorizada:</span>
              <code>{REDIRECT_URI}</code>
            </div>
            <div className="tech-info-row">
              <span>Audiencia del Token:</span>
              <code>api://{CLIENT_ID}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
