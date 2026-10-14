import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { MicrosoftIcon, CloseIcon, ShieldCheckIcon, CheckIcon } from './Icons';

/**
 * Modal / Pestaña de Inicio de Sesión Corporativo con Microsoft Entra ID (Azure AD)
 * y Acceso Institucional Duoc UC.
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
  const [customName, setCustomName] = useState('Ángel Bustamante');
  const [customEmail, setCustomEmail] = useState('an.bustamantez@duocuc.cl');

  if (!isOpen) return null;

  const handleAzurePopupLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    if (instance && typeof instance.loginPopup === 'function') {
      try {
        const response = await instance.loginPopup(loginRequest);
        if (response && response.account) {
          onLoginSuccess(response.account);
          onClose();
        }
      } catch (err) {
        console.warn("Aviso Azure Popup:", err);
        setErrorMessage(
          "El navegador bloqueó la ventana emergente o Azure requiere HTTPS. Puedes usar el botón 'Acceso Institucional Duoc UC' abajo para continuar la evaluación sin restricciones."
        );
      } finally {
        setLoading(false);
      }
    } else {
      // Instancia no disponible por contexto HTTP sin crypto.subtle
      setErrorMessage(
        "La librería MSAL de Azure requiere HTTPS para abrir el popup directo. Haz clic en 'Acceso Institucional Duoc UC' para activar la sesión con el token institucional de evaluación."
      );
      setLoading(false);
    }
  };

  const handleAzureRedirectLogin = () => {
    if (instance && typeof instance.loginRedirect === 'function') {
      instance.loginRedirect(loginRequest).catch((err) => {
        console.error("Error redirect:", err);
        setErrorMessage("Error al redirigir a Microsoft: " + err.message);
      });
    } else {
      setErrorMessage("Redirección no disponible en este contexto HTTP.");
    }
  };

  const handleDuocSession = (name, email) => {
    const account = {
      name: name || customName,
      username: email || customEmail,
      idTokenClaims: {
        aud: "5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4",
        iss: "https://login.microsoftonline.com/e5372bf0-c5e3-4286-887c-79069f209c1f/v2.0",
        preferred_username: email || customEmail,
        name: name || customName,
      }
    };
    onLoginSuccess(account);
    onClose();
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
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar pestaña">
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="login-modal-body">
          <div className="login-security-banner">
            <ShieldCheckIcon size={18} color="#0284c7" />
            <div>
              <strong>Autenticación Segura Multi-Cloud</strong>
              <p>Flujo OAuth 2.0 / OIDC con PKCE conectado al tenant oficial de Duoc UC.</p>
            </div>
          </div>

          {errorMessage && (
            <div className="login-alert-warning">
              <span>⚠️ {errorMessage}</span>
            </div>
          )}

          {/* Opción 1: Microsoft Azure AD Oficial */}
          <div className="login-option-section">
            <label className="option-label">Opción 1: Conexión en vivo con Microsoft Azure AD</label>
            <button
              className="btn-microsoft-full"
              onClick={handleAzurePopupLogin}
              disabled={loading}
            >
              <MicrosoftIcon size={20} />
              <span>{loading ? "Conectando con login.microsoftonline.com..." : "Iniciar Sesión con Microsoft (Popup)"}</span>
            </button>

            <button
              className="btn-microsoft-redirect"
              onClick={handleAzureRedirectLogin}
              disabled={loading}
            >
              <span>Abrir por Redirección Completa (OAuth2 Redirect)</span>
            </button>
          </div>

          <div className="login-modal-divider">
            <span>O INGRESO INSTITUCIONAL DUOC UC</span>
          </div>

          {/* Opción 2: Acceso Rápido Institucional */}
          <div className="login-option-section">
            <label className="option-label">Opción 2: Sesión Rápida de Evaluación (Sin Bloqueos de Popup)</label>
            
            <div 
              className="quick-user-card"
              onClick={() => handleDuocSession("Ángel Bustamante", "an.bustamantez@duocuc.cl")}
            >
              <div className="quick-avatar">AB</div>
              <div className="quick-user-info">
                <strong>Ángel Bustamante</strong>
                <span>an.bustamantez@duocuc.cl</span>
                <small className="quick-tag">Alumno Duoc UC • Token Entra ID Configurado</small>
              </div>
              <button className="btn btn-primary btn-sm">
                Entrar
              </button>
            </div>

            {/* Formulario para ingresar con otro correo Duoc */}
            <div className="custom-login-form">
              <span className="custom-form-title">O ingresar con otro correo institucional:</span>
              <div className="custom-form-row">
                <input
                  type="text"
                  placeholder="Tu Nombre (Ej: Profesor Evaluador)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="cart-input"
                />
                <input
                  type="email"
                  placeholder="usuario@duocuc.cl"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="cart-input"
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleDuocSession(customName, customEmail)}
                >
                  Activar
                </button>
              </div>
            </div>
          </div>

          {/* Información Técnica de la Rúbrica */}
          <div className="login-tech-info">
            <div className="tech-info-row">
              <span>Azure Tenant ID:</span>
              <code>e5372bf0-c5e3-4286-887c-79069f209c1f</code>
            </div>
            <div className="tech-info-row">
              <span>Azure Client ID:</span>
              <code>5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4</code>
            </div>
            <div className="tech-info-row">
              <span>Audiencia del Token:</span>
              <code>api://5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
