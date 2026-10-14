import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './authConfig';
import App from './App';
import './index.css';

// Inicializar la instancia principal de MSAL con la configuración declarada
const msalInstance = new PublicClientApplication(msalConfig);

const root = ReactDOM.createRoot(document.getElementById('root'));

// MSAL Browser v3 requiere invocar initialize() antes de renderizar la app
msalInstance.initialize()
  .then(() => {
    root.render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      </React.StrictMode>
    );
  })
  .catch((error) => {
    console.warn("Advertencia en inicialización de MSAL (contexto HTTP/IP):", error);
    // Renderizado seguro ante advertencias para que la aplicación nunca quede en pantalla blanca
    root.render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      </React.StrictMode>
    );
  });
