import React, { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';

/**
 * Componente Catalogo
 * Obtiene el token JWT de MSAL mediante acquireTokenSilent especificando explícitamente el scope de la API
 * e invoca el endpoint protegido de la API Gateway HTTP en AWS con JWT Authorizer nativo.
 */
export const Catalogo = () => {
  const { instance, accounts } = useMsal();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState('');

  const API_URL = 'https://op6erfwwmh.execute-api.us-east-1.amazonaws.com/v1/api/status';

  useEffect(() => {
    const fetchApiData = async () => {
      if (accounts.length === 0) return;

      // Solicitud explícita con el scope del Client ID y la cuenta activa
      const request = {
        scopes: ["5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4/.default"],
        account: accounts[0],
      };

      try {
        setLoading(true);
        setError(null);

        // 1. Intentar adquirir el token JWT silenciosamente con el scope de la API
        let tokenResponse;
        try {
          tokenResponse = await instance.acquireTokenSilent(request);
        } catch (silentError) {
          console.warn("AcquireTokenSilent falló, intentando acquireTokenPopup...", silentError);
          tokenResponse = await instance.acquireTokenPopup(request);
        }

        const token = tokenResponse.accessToken || tokenResponse.idToken;
        setAccessToken(token);

        // 2. Realizar petición HTTP GET a la nueva API HTTP Gateway en AWS con el token JWT en el header Authorization
        const response = await fetch(API_URL, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Error en la API (${response.status}): ${response.statusText}`);
        }

        const jsonResult = await response.json();
        setData(jsonResult);
      } catch (err) {
        console.error("Error al consumir la API:", err);
        setError(err.message || "Error al conectar con la API HTTP de AWS");
      } finally {
        setLoading(false);
      }
    };

    fetchApiData();
  }, [instance, accounts]);

  return (
    <div className="catalogo-container">
      <div className="card-header">
        <h3>📡 Estado de Servicios en AWS (HTTP API Gateway)</h3>
        <p className="card-subtitle">Endpoint: <code>{API_URL}</code></p>
      </div>

      {loading && (
        <div className="status-box loading-box">
          <p>⏳ Obteniendo token JWT y consultando API Gateway HTTP en AWS...</p>
        </div>
      )}

      {error && (
        <div className="status-box error-box">
          <h4>❌ Error de Comunicación (HTTP Error)</h4>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <div className="status-box success-api-box">
          <div className="api-badge-status">
            <span className="dot online"></span> API Conectada Exitosamente (JWT Authorizer Nativo)
          </div>
          <h4>Respuesta de la API (JSON):</h4>
          <pre className="json-display">{JSON.stringify(data, null, 2)}</pre>
          
          {accessToken && (
            <details className="token-details">
              <summary>Ver Token Bearer (JWT) enviado</summary>
              <p className="token-text">{accessToken}</p>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

export default Catalogo;
