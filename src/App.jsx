import React from 'react';
import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import LoginButton from './components/LoginButton';
import Catalogo from './components/Catalogo';
import Carrito from './components/Carrito';
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
            Frontend modular estructurado con React + Vite, autenticación Microsoft Entra ID (MSAL) e integración multi-servicio en AWS (Catálogo & Carrito de Compras).
          </p>

          <div className="badge-row">
            <span className="tech-badge">React 18</span>
            <span className="tech-badge">Vite</span>
            <span className="tech-badge">MSAL React</span>
            <span className="tech-badge">AWS HTTP API Gateway</span>
            <span className="tech-badge version-badge">v1.3.0</span>
          </div>

          <UnauthenticatedTemplate>
            <div className="info-box">
              <h3>🔒 Autenticación Requerida</h3>
              <p>
                Haz clic en el botón <strong>"Iniciar Sesión con Microsoft"</strong> para autenticarte mediante tu cuenta de Azure AD y acceder a las APIs protegidas en AWS.
              </p>
            </div>
          </UnauthenticatedTemplate>

          <AuthenticatedTemplate>
            <Catalogo />
            <Carrito />
          </AuthenticatedTemplate>
        </div>
      </main>

      <footer className="app-footer">
        <p>Pedidos360 Frontend - Versión 1.3.0 (Desarrollo Cloud)</p>
      </footer>
    </div>
  );
}

export default App;
