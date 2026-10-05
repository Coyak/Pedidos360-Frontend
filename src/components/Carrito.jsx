import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { CartIcon, CloseIcon, TrashIcon, EmptyBoxIcon, ShieldCheckIcon } from './Icons';

export const Carrito = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
}) => {
  const { instance, accounts } = useMsal();
  const [shippingAddress, setShippingAddress] = useState('Av. España 8, Santiago - Chile');
  const [customerEmail, setCustomerEmail] = useState('');
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [carritoStatus, setCarritoStatus] = useState(null);

  const CARRITO_STATUS_URL = 'https://op6erfwwmh.execute-api.us-east-1.amazonaws.com/v1/api/carrito/status';
  const CARRITO_PEDIDOS_URL = 'https://op6erfwwmh.execute-api.us-east-1.amazonaws.com/v1/api/carrito/pedidos';

  // Sincronizar email con cuenta activa de Microsoft Entra ID
  useEffect(() => {
    if (accounts.length > 0) {
      setCustomerEmail(accounts[0]?.username || accounts[0]?.name || 'estudiante@duocuc.cl');
    } else {
      setCustomerEmail('usuario@duocuc.cl');
    }
  }, [accounts]);

  // Verificar estado del microservicio Carrito en AWS
  useEffect(() => {
    const checkCarritoStatus = async () => {
      try {
        const res = await fetch(CARRITO_STATUS_URL);
        if (res.ok) {
          const json = await res.json();
          setCarritoStatus(json);
        }
      } catch {
        // Silencioso si no conecta
      }
    };
    checkCarritoStatus();
  }, []);

  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const acquireAzureToken = async () => {
    if (accounts.length === 0) return null;
    const request = {
      scopes: ["5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4/.default"],
      account: accounts[0],
    };

    try {
      const response = await instance.acquireTokenSilent(request);
      return response.accessToken || response.idToken;
    } catch {
      const response = await instance.acquireTokenPopup(request);
      return response.accessToken || response.idToken;
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setErrorMessage(null);

    // Si el usuario no ha iniciado sesión, invocar login de Azure AD
    if (accounts.length === 0) {
      try {
        await instance.loginPopup({
          scopes: ["5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4/.default"],
        });
      } catch {
        setErrorMessage("Debes iniciar sesión con tu cuenta de Azure AD para continuar con el pago.");
        return;
      }
    }

    try {
      setLoadingOrder(true);

      const token = await acquireAzureToken();
      if (!token) {
        throw new Error("No se pudo obtener el token JWT de Microsoft Entra ID.");
      }

      // Estructura requerida por el microservicio Spring Boot Carrito API
      const payload = {
        clienteEmail: customerEmail,
        direccionEnvio: shippingAddress,
        items: cartItems.map((item) => ({
          productoId: item.id,
          nombreProducto: item.name,
          cantidad: item.quantity,
          precioUnitario: item.price,
        })),
      };

      const res = await fetch(CARRITO_PEDIDOS_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let responseData;
      if (res.ok) {
        responseData = await res.json();
      } else {
        const errorText = await res.text();
        throw new Error(`AWS API Gateway retornó código ${res.status}: ${errorText || res.statusText}`);
      }

      onOrderSuccess({
        response: responseData,
        payload,
        token,
        endpoint: CARRITO_PEDIDOS_URL,
        timestamp: new Date().toISOString(),
      });

      onClearCart();
      onClose();
    } catch (err) {
      console.error("Error al procesar pedido en AWS:", err);
      setErrorMessage(
        err.message || "Error al conectar con el microservicio de Carrito en AWS."
      );
    } finally {
      setLoadingOrder(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <div className="cart-header-title">
            <CartIcon size={22} color="var(--primary-accent)" />
            <h3>Carrito de Compras</h3>
            <span className="cart-badge-count">{totalItemsCount}</span>
          </div>
          <button className="btn-close-drawer" onClick={onClose} aria-label="Cerrar carrito">
            <CloseIcon size={20} />
          </button>
        </div>

        {carritoStatus && (
          <div className="cart-cloud-status">
            <span className="dot online"></span>
            <span>Microservicio Carrito AWS Conectado (:8081)</span>
          </div>
        )}

        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div className="cart-empty-state">
              <div className="empty-cart-illustration">
                <EmptyBoxIcon size={64} />
              </div>
              <h4>Tu carrito está vacío</h4>
              <p>Explora nuestro catálogo tecnológico y añade productos para armar tu pedido.</p>
              <button className="btn btn-primary" onClick={onClose}>
                Ver Catálogo
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item-card">
                  {/* Foto en miniatura del producto */}
                  <div className="cart-item-thumb-container">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="cart-item-thumb" />
                    ) : (
                      <div className="cart-item-thumb-placeholder">PROD</div>
                    )}
                  </div>

                  <div className="cart-item-details">
                    <h4 className="cart-item-name">{item.name}</h4>
                    <span className="cart-item-id">{item.id}</span>
                    <span className="cart-item-unit-price">
                      ${item.price.toLocaleString('es-CL')} c/u
                    </span>
                  </div>

                  <div className="cart-item-actions">
                    <div className="quantity-controller">
                      <button
                        className="qty-btn"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        aria-label="Disminuir cantidad"
                      >
                        -
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        aria-label="Aumentar cantidad"
                      >
                        +
                      </button>
                    </div>

                    <div className="cart-item-subtotal">
                      ${(item.price * item.quantity).toLocaleString('es-CL')}
                    </div>

                    <button
                      className="btn-remove-item"
                      onClick={() => onRemoveItem(item.id)}
                      title="Eliminar producto"
                      aria-label="Eliminar producto"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="checkout-inputs">
              <div className="input-field">
                <label>Email Cliente (Microsoft Entra ID):</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="usuario@duocuc.cl"
                  className="cart-input"
                />
              </div>

              <div className="input-field">
                <label>Dirección de Envío en Chile:</label>
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Ej: Av. España 8, Santiago"
                  className="cart-input"
                />
              </div>
            </div>

            <div className="cart-summary-totals">
              <div className="summary-row">
                <span>Subtotal ({totalItemsCount} items):</span>
                <span>${subtotal.toLocaleString('es-CL')} CLP</span>
              </div>
              <div className="summary-row">
                <span>Envío Courier:</span>
                <span style={{ color: 'var(--success-color)' }}>Gratis (Cloud Native)</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total-row">
                <span>Total a Pagar:</span>
                <span className="total-highlight">${subtotal.toLocaleString('es-CL')} CLP</span>
              </div>
            </div>

            {errorMessage && (
              <div className="cart-error-alert">
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              className="btn btn-checkout"
              onClick={handleCheckout}
              disabled={loadingOrder}
            >
              {loadingOrder ? (
                <span>Enviando a AWS HTTP API Gateway...</span>
              ) : accounts.length === 0 ? (
                <span>Iniciar Sesión con Microsoft para Comprar</span>
              ) : (
                <span>Confirmar y Procesar en AWS (POST 201)</span>
              )}
            </button>

            <div className="cart-security-note">
              <ShieldCheckIcon size={14} color="var(--primary-accent)" />
              <span>Transacción protegida con token JWT de Microsoft Entra ID y enrutada por AWS API Gateway.</span>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default Carrito;
