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
  const [useTrailingSlash, setUseTrailingSlash] = useState(false);

  if (!isOpen) return null;

  const TENANT_ID = "e5372bf0-c5e3-4286-887c-79069f209c1f";
  const CLIENT_ID = "5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4";
  const baseOrigin = typeof window !== 'undefined' ? window.location.origin : "http://localhost:5173";
  const REDIRECT_URI = useTrailingSlash ? `${baseOrigin}/` : baseOrigin;

  const currentRequest = {
    ...loginRequest,
    redirectUri: REDIRECT_URI,
  };

  const handleAzurePopupLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    if (instance && typeof instance.loginPopup === 'function') {
      try {
        const response = await instance.loginPopup(currentRequest);
        if (response && response.account) {
          if (onLoginSuccess) onLoginSuccess(response.account);
          onClose();
        }
      } catch (err) {
        console.warn("Aviso Azure Popup:", err);
        setErrorMessage(
          err.message || "El popup fue bloqueado por tu navegador. Usa el botón 'Redirección Oficial de Microsoft'."
        );
      } finally {
        setLoading(false);
      }
    } else {
      directMicrosoftOAuthRedirect();
    }
  };

  const handleAzureRedirectLogin = () => {
    setLoading(true);
    setErrorMessage(null);

    if (instance && typeof instance.loginRedirect === 'function') {
      instance.loginRedirect(currentRequest).catch((err) => {
        console.warn("MSAL redirect falló, usando endpoint OIDC directo:", err);
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
              <span>{loading ? "Redirigiendo a Microsoft..." : "Iniciar Sesión con Microsoft (Redirección)"}</span>
            </button>

            <button
              className="btn-microsoft-redirect"
              onClick={handleAzurePopupLogin}
              disabled={loading}
              title="Abre ventana emergente de Microsoft"
            >
              <span>Iniciar con Ventana Emergente (Popup)</span>
            </button>
          </div>

          {/* Selector de formato de URI para solucionar AADSTS50011 */}
          <div style={{ background: '#090e17', padding: '0.85rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>URI de Redirección enviada:</span>
              <button
                type="button"
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid #38bdf8',
                  color: '#38bdf8',
                  borderRadius: '4px',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.72rem',
                  cursor: 'pointer'
                }}
                onClick={() => setUseTrailingSlash(!useTrailingSlash)}
                title="Alternar entre URI con barra final o sin barra final"
              >
                Alternar a: {useTrailingSlash ? 'Sin Barra Final' : 'Con Barra Final (/)'}
              </button>
            </div>
            <code style={{ color: '#38bdf8', fontSize: '0.85rem' }}>{REDIRECT_URI}</code>
          </div>

          {/* Guía rápida para resolver AADSTS50011 */}
          <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.4' }}>
            <strong style={{ color: '#fbbf24' }}>💡 Si Azure muestra AADSTS50011:</strong>
            <p style={{ margin: '0.3rem 0 0 0' }}>
              En <strong>portal.azure.com</strong> &rarr; <em>Microsoft Entra ID</em> &rarr; <em>Registros de aplicaciones</em> &rarr; <em>Pedidos360</em> &rarr; <strong>Autenticación</strong>, agrega ambas URIs en <em>Single-page application (SPA)</em>:
            </p>
            <ul style={{ margin: '0.3rem 0 0 1.2rem', padding: 0 }}>
              <li><code>http://100.26.45.41</code></li>
              <li><code>http://100.26.45.41/</code></li>
            </ul>
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
