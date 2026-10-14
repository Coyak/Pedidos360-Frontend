import './cryptoPolyfill'; // Activa soporte WebCrypto SHA-256 en HTTP IP pública
import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './authConfig';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

let msalInstance = null;
try {
  msalInstance = new PublicClientApplication(msalConfig);
} catch (error) {
  console.error("Error al inicializar MSAL PublicClientApplication:", error);
}

const renderApplication = () => {
  if (msalInstance) {
    root.render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      </React.StrictMode>
    );
  } else {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
};

if (msalInstance && typeof msalInstance.initialize === 'function') {
  msalInstance.initialize()
    .then(() => {
      // Manejar el retorno de la redirección de Microsoft Entra ID
      return msalInstance.handleRedirectPromise();
    })
    .then((response) => {
      if (response && response.account) {
        msalInstance.setActiveAccount(response.account);
        console.log("Sesión Microsoft Entra ID iniciada con éxito:", response.account);
      }
      renderApplication();
    })
    .catch((err) => {
      console.warn("Advertencia en inicialización/redirección MSAL:", err);
      renderApplication();
    });
} else {
  renderApplication();
}
