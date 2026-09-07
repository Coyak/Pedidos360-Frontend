import React from 'react';
import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import LoginButton from './components/LoginButton';
import './App.css';

function App() {
  const { instance, accounts } = useMsal();
  const activeAccount = accounts[0];

  const handleLogout = () => {
    instance.logoutPopup().catch((e) => {
      console.error("Error al cerrar sesión:", e);
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
            <LoginButton />
          </UnauthenticatedTemplate>
        </div>
      </header>

      <main className="app-main">
        <div className="hero-card">
          <h2>Plataforma de Gestión de Pedidos</h2>
          <p className="subtitle">
            Frontend modular estructurado con React + Vite y autenticación empresarial Microsoft Entra ID (MSAL).
          </p>

          <div className="badge-row">
            <span className="tech-badge">React 18</span>
            <span className="tech-badge">Vite</span>
            <span className="tech-badge">MSAL React</span>
            <span className="tech-badge">Azure AD</span>
            <span className="tech-badge version-badge">v1.1.0</span>
          </div>

          <UnauthenticatedTemplate>
            <div className="info-box">
              <h3>🔒 Autenticación Requerida</h3>
              <p>
                Haz clic en el botón <strong>"Iniciar Sesión con Microsoft"</strong> para autenticarte mediante tu cuenta empresarial/institucional de Azure AD.
              </p>
            </div>
          </UnauthenticatedTemplate>

          <AuthenticatedTemplate>
            <div className="info-box success-box">
              <h3>✅ Autenticación Exitosa</h3>
              <p>Has iniciado sesión como <strong>{activeAccount?.name}</strong> ({activeAccount?.username}).</p>
              <pre className="account-json">{JSON.stringify(activeAccount, null, 2)}</pre>
            </div>
          </AuthenticatedTemplate>
        </div>
      </main>

      <footer className="app-footer">
        <p>Pedidos360 Frontend - Versión 1.1.0 (Desarrollo Cloud)</p>
      </footer>
    </div>
  );
}

export default App;
