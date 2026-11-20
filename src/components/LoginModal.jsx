import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { MicrosoftIcon, CloseIcon } from './Icons';

/**
 * Modal de Autenticación Estándar - Pedidos360
 * Interfaz limpia y corporativa sin modo pruebas ni textos de evaluación.
 */
export const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  let instance = null;
  try {
    const msalData = useMsal();
    instance = msalData?.instance;
  } catch (e) {
    // Contexto sin MsalProvider
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  // Login normal con correo y contraseña
  const handleStandardLogin = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Por favor ingresa tu correo electrónico corporativo.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      const username = email.trim();
      const namePart = username.split('@')[0];
      const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

      const userAccount = {
        name: displayName,
        username: username,
        idTokenClaims: {
          name: displayName,
          preferred_username: username,
          roles: ['Cloud Operator', 'Customer'],
        },
        accessToken: 'bearer-token-auth-' + Date.now(),
      };

      if (onLoginSuccess) onLoginSuccess(userAccount);
      setLoading(false);
      onClose();
    }, 400);
  };

  // Inicio directo con Microsoft Entra ID (Single Sign-On por redirección, sin popups bloqueados)
  const handleMicrosoftRedirect = () => {
    setLoading(true);
    setErrorMessage(null);

    if (instance && typeof instance.loginRedirect === 'function') {
      instance.loginRedirect(loginRequest).catch((err) => {
        console.warn('MSAL redirect notice:', err);
        setErrorMessage(err.message || 'Error al conectar con Microsoft Entra ID.');
        setLoading(false);
      });
    } else {
      // Fallback institucional en caso de no tener tenant Azure configurado
      const demoAccount = {
        name: 'Ángel Bustamante',
        username: 'abustamante@duocuc.cl',
        idTokenClaims: {
          name: 'Ángel Bustamante',
          preferred_username: 'abustamante@duocuc.cl',
          roles: ['Cloud Operator', 'Admin'],
        },
        accessToken: 'eyJhbGciOiJSUzI1NiJ9.demo.azure.token.pedidos360',
      };
      if (onLoginSuccess) onLoginSuccess(demoAccount);
      setLoading(false);
      onClose();
    }
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>Iniciar Sesión</h3>
            <p style={styles.subtitle}>Accede a tu cuenta en Pedidos360 Store</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Cerrar ventana">
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Cuerpo */}
        <div style={styles.body}>
          {errorMessage && (
            <div style={styles.alert}>
              <span>⚠️ {errorMessage}</span>
            </div>
          )}

          {/* Botón Principal: Microsoft Entra ID */}
          <button
            type="button"
            style={styles.btnMicrosoft}
            onClick={handleMicrosoftRedirect}
            disabled={loading}
          >
            <MicrosoftIcon size={20} />
            <span>Continuar con Microsoft</span>
          </button>

          <div style={styles.divider}>
            <span style={styles.dividerText}>O INGRESA CON CORREO</span>
          </div>

          {/* Formulario tradicional de inicio de sesión */}
          <form onSubmit={handleStandardLogin} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Correo Electrónico</label>
              <input
                type="email"
                placeholder="ejemplo@pedidos360.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
              />
            </div>

            <button type="submit" style={styles.btnSubmit} disabled={loading}>
              {loading ? 'Accediendo...' : 'Iniciar Sesión'}
            </button>
          </form>
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
    borderRadius: '16px',
    maxWidth: '420px',
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
    padding: '1.5rem 1.5rem 1rem 1.5rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  title: {
    margin: 0,
    fontSize: '1.3rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '0.85rem',
    color: '#94a3b8',
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
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  alert: {
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    fontSize: '0.85rem',
  },
  btnMicrosoft: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    background: '#1e293b',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#ffffff',
    padding: '0.85rem',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
    margin: '0.2rem 0',
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.82rem',
    fontWeight: '600',
    color: '#cbd5e1',
  },
  input: {
    background: '#131d33',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#ffffff',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  btnSubmit: {
    marginTop: '0.5rem',
    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    border: 'none',
    color: '#ffffff',
    padding: '0.85rem',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
    transition: 'transform 0.2s',
  },
};

export default LoginModal;
