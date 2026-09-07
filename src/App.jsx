import React from 'react';
import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { loginRequest } from './authConfig';
import './App.css';

function App() {
  const { instance, accounts } = useMsal();
  const activeAccount = accounts[0];

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch((e) => {
      console.error(e);
    });
  };

  const handleLogout = () => {
    instance.logoutPopup().catch((e) => {
      console.error(e);
    });
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-badge">360</div>
          <h1>Pedidos360</h1>
        </div>
        <div className="auth-status">
          <AuthenticatedTemplate>
            <span className="user-welcome">Hola, {activeAccount?.name || 'Usuario'}</span>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </AuthenticatedTemplate>
          <UnauthenticatedTemplate>
            <button className="btn btn-primary" onClick={handleLogin}>
              Iniciar Sesión (Azure AD)
            </button>
          </UnauthenticatedTemplate>
        </div>
      </header>

      <main className="app-main">
        <div className="hero-card">
          <h2>Plataforma de Gestión de Pedidos</h2>
          <p className="subtitle">
            Frontend estructurado con React + Vite y autenticación empresarial Microsoft Entra ID (MSAL).
          </p>

          <div className="badge-row">
            <span className="tech-badge">React 18</span>
            <span className="tech-badge">Vite</span>
            <span className="tech-badge">MSAL Browser</span>
            <span className="tech-badge">Azure AD</span>
            <span className="tech-badge version-badge">v1.0.0</span>
          </div>

          <UnauthenticatedTemplate>
            <div className="info-box">
              <h3>🔒 Autenticación Requerida</h3>
              <p>
                Por favor, configura tu <code>Client ID</code> en <code>src/authConfig.js</code> e inicia sesión para acceder al panel de control y APIs de la plataforma.
              </p>
            </div>
          </UnauthenticatedTemplate>

          <AuthenticatedTemplate>
            <div className="info-box success-box">
              <h3>✅ Sesión Activa</h3>
              <p>Has iniciado sesión correctamente como <strong>{activeAccount?.username}</strong>.</p>
              <pre className="account-json">{JSON.stringify(activeAccount, null, 2)}</pre>
            </div>
          </AuthenticatedTemplate>
        </div>
      </main>

      <footer className="app-footer">
        <p>Pedidos360 Frontend - Evaluación 1 (Desarrollo Cloud)</p>
      </footer>
    </div>
  );
}

export default App;
