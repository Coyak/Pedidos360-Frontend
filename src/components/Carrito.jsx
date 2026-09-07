import React, { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';

/**
 * Componente Carrito
 * Permite interactuar con el microservicio desacoplado de Carrito y Pedidos en AWS API Gateway
 * realizando solicitudes POST con el token JWT de Azure AD.
 */
export const Carrito = () => {
  const { instance, accounts } = useMsal();
  const [carritoStatus, setCarritoStatus] = useState(null);
  const [pedidoResponse, setPedidoResponse] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingPedido, setLoadingPedido] = useState(false);
  const [error, setError] = useState(null);

  const CARRITO_STATUS_URL = 'https://op6erfwwmh.execute-api.us-east-1.amazonaws.com/v1/api/carrito/status';
  const CARRITO_PEDIDOS_URL = 'https://op6erfwwmh.execute-api.us-east-1.amazonaws.com/v1/api/carrito/pedidos';

  const scopeRequest = {
    scopes: ["5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4/.default"],
    account: accounts[0],
  };

  const getToken = async () => {
    try {
      const response = await instance.acquireTokenSilent(scopeRequest);
      return response.accessToken || response.idToken;
    } catch (e) {
      const response = await instance.acquireTokenPopup(scopeRequest);
      return response.accessToken || response.idToken;
    }
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoadingStatus(true);
        const response = await fetch(CARRITO_STATUS_URL);
        if (response.ok) {
          const json = await response.json();
          setCarritoStatus(json);
        }
      } catch (err) {
        console.error("Error al consultar status de Carrito API:", err);
      } finally {
        setLoadingStatus(false);
      }
    };

    fetchStatus();
  }, []);

  const handleCrearPedido = async () => {
    try {
      setLoadingPedido(true);
      setError(null);
      const token = await getToken();

      const payload = {
        clienteEmail: accounts[0]?.username || accounts[0]?.name || "estudiante@duocuc.cl",
        direccionEnvio: "Av. España 8, Santiago - Chile",
        items: [
          {
            productoId: "PROD-101",
            nombreProducto: "Laptop Asus ROG Strix",
            cantidad: 1,
            precioUnitario: 1290000.00
          },
          {
            productoId: "PROD-202",
            nombreProducto: "Mouse Inalámbrico Logitech",
            cantidad: 2,
            precioUnitario: 35000.00
          }
        ]
      };

      const res = await fetch(CARRITO_PEDIDOS_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Error HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setPedidoResponse(data);
    } catch (err) {
      console.error("Error al procesar pedido:", err);
      setError(err.message || "Error al conectar con Carrito API");
    } finally {
      setLoadingPedido(false);
    }
  };

  return (
    <div className="carrito-container" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <div className="card-header">
        <h3>🛒 Microservicio de Carrito & Pedidos (AWS EC2 :8081)</h3>
        <p className="card-subtitle">Endpoint Transaccional: <code>{CARRITO_PEDIDOS_URL}</code></p>
      </div>

      {loadingStatus ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>⏳ Consultando estado de Carrito API...</p>
      ) : carritoStatus ? (
        <div className="api-badge-status" style={{ marginBottom: '1.25rem' }}>
          <span className="dot online"></span> Carrito API Operativo ({carritoStatus.port ? `Puerto ${carritoStatus.port}` : 'AWS'})
        </div>
      ) : null}

      <div className="actions-row" style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-primary" onClick={handleCrearPedido} disabled={loadingPedido} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
          {loadingPedido ? '⏳ Procesando Pedido...' : '🛍️ Registrar Pedido de Compra (POST 201 Created)'}
        </button>
      </div>

      {error && (
        <div className="status-box error-box" style={{ marginBottom: '1rem' }}>
          <h4>❌ Error de Transacción</h4>
          <p>{error}</p>
        </div>
      )}

      {pedidoResponse && (
        <div className="status-box success-api-box">
          <div className="api-badge-status">
            <span className="dot online"></span> Pedido Procesado con Éxito (HTTP 201 Created)
          </div>
          <h4>Detalle del Pedido Creado en AWS:</h4>
          <pre className="json-display">{JSON.stringify(pedidoResponse, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Carrito;
