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
  console.warn("MSAL no pudo crearse directamente (contexto no seguro o sin crypto):", error);
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
    // Si MSAL falla al instanciar, renderiza la app de todos modos sin pantalla blanca
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
};

if (msalInstance && typeof msalInstance.initialize === 'function') {
  msalInstance.initialize()
    .then(renderApplication)
    .catch((err) => {
      console.warn("Advertencia en msalInstance.initialize():", err);
      renderApplication();
    });
} else {
  renderApplication();
}
