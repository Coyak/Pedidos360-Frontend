import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { MicrosoftIcon, CloseIcon, ShieldCheckIcon, UserCheckIcon } from './Icons';

/**
 * Modal de Autenticación Corporativo - Pedidos360 Enterprise
 * Conexión oficial OAuth 2.0 / OpenID Connect con Microsoft Entra ID (Azure AD).
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
          err.message || "La ventana emergente fue bloqueada por el navegador. Usa la opción directa de Redirección."
        );
      } finally {
        setLoading(false);
      }
    } else {
      setErrorMessage("Cliente MSAL no inicializado.");
      setLoading(false);
    }
  };

  const handleDemoAdminLogin = () => {
    const demoAccount = {
      name: "Ángel Bustamante",
      username: "abustamante@duocuc.cl",
      idTokenClaims: {
        aud: "5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4",
        iss: "https://login.microsoftonline.com/e5372bf0-c5e3-4286-887c-79069f209c1f/v2.0",
        name: "Ángel Bustamante",
        preferred_username: "abustamante@duocuc.cl",
        roles: ["Cloud Architect", "Store Administrator"],
      },
      accessToken: "eyJhbGciOiJSUzI1NiJ9.demo.azure.token.pedidos360",
    };
    if (onLoginSuccess) onLoginSuccess(demoAccount);
    onClose();
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        {/* Encabezado */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={styles.logoBadge}>
              <MicrosoftIcon size={24} />
            </div>
            <div>
              <h3 style={styles.title}>Acceso Corporativo</h3>
              <p style={styles.subtitle}>Microsoft Entra ID • Single Sign-On</p>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Cerrar ventana">
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Cuerpo */}
        <div style={styles.body}>
          <div style={styles.securityBanner}>
            <ShieldCheckIcon size={20} color="#38bdf8" />
            <div>
              <strong style={{ color: '#f8fafc', fontSize: '0.85rem' }}>Autenticación Segura IDaaS</strong>
              <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '0.78rem' }}>
                Inicio de sesión cifrado mediante protocolo OAuth 2.0 y OpenID Connect con PKCE.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div style={styles.alert}>
              <span>⚠️ {errorMessage}</span>
            </div>
          )}

          {/* Opciones de Acceso */}
          <div style={styles.buttonGroup}>
            <button
              style={styles.btnPrimary}
              onClick={handleAzureRedirectLogin}
              disabled={loading}
              title="Redirigir a login.microsoftonline.com"
            >
              <MicrosoftIcon size={20} />
              <span>{loading ? "Conectando..." : "Iniciar Sesión con Microsoft"}</span>
            </button>

            <button
              style={styles.btnSecondary}
              onClick={handleAzurePopupLogin}
              disabled={loading}
              title="Abrir ventana emergente de Microsoft"
            >
              <span>Abrir en Ventana Emergente</span>
            </button>
          </div>

          <div style={styles.divider}>
            <span style={styles.dividerText}>O INGRESO DE PRUEBAS</span>
          </div>

          <button
            style={styles.btnDemo}
            onClick={handleDemoAdminLogin}
            title="Ingreso rápido con perfil corporativo"
          >
            <UserCheckIcon size={18} color="#10b981" />
            <span>Continuar con Perfil Administrador</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 10, 20, 0.85)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: '1.5rem',
  },
  card: {
    background: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '20px',
    maxWidth: '460px',
    width: '100%',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
    overflow: 'hidden',
    position: 'relative',
    margin: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.02)',
  },
  logoBadge: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: 0,
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    margin: '2px 0 0 0',
    fontSize: '0.8rem',
    color: '#38bdf8',
  },
  closeBtn: {
    background: 'rgba(255, 255, 255, 0.06)',
    border: 'none',
    color: '#94a3b8',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  body: {
    padding: '1.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  securityBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'rgba(56, 189, 248, 0.08)',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    padding: '0.85rem 1rem',
    borderRadius: '12px',
  },
  alert: {
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    fontSize: '0.85rem',
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    background: 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)',
    border: 'none',
    color: '#ffffff',
    padding: '0.85rem',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0, 120, 212, 0.4)',
    transition: 'transform 0.2s',
  },
  btnSecondary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#cbd5e1',
    padding: '0.75rem',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
    margin: '0.25rem 0',
  },
  dividerText: {
    width: '100%',
    color: '#64748b',
    fontSize: '0.72rem',
    fontWeight: '700',
    letterSpacing: '0.1em',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    lineHeight: '0.1em',
  },
  btnDemo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    color: '#10b981',
    padding: '0.75rem',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '0.88rem',
    cursor: 'pointer',
  },
};

export default LoginModal;
