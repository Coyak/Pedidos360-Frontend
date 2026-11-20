import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { CartIcon, CloseIcon, TrashIcon, EmptyBoxIcon, ShieldCheckIcon } from './Icons';
import { getApiEndpoints } from '../config/apiConfig';

export const Carrito = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
  onOpenWebpay,
  activeAccount,
}) => {
  let instance = null;
  let accounts = [];
  try {
    const msalData = useMsal();
    instance = msalData?.instance;
    accounts = msalData?.accounts || [];
  } catch (e) {
    // MSAL provider optional
  }

  const [shippingAddress, setShippingAddress] = useState('Av. Providencia 1234, Santiago - Chile');
  const [customerEmail, setCustomerEmail] = useState(activeAccount?.username || 'cliente@pedidos360.com');
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [carritoStatus, setCarritoStatus] = useState(null);

  const endpoints = getApiEndpoints();
  const CARRITO_STATUS_URL = endpoints.carritoStatus;
  const CARRITO_PEDIDOS_URL = endpoints.carritoPedidos;

  // Sincronizar email con cuenta activa
  useEffect(() => {
    if (activeAccount) {
      setCustomerEmail(activeAccount.username || activeAccount.name || 'cliente@pedidos360.com');
    } else if (accounts.length > 0) {
      setCustomerEmail(accounts[0]?.username || accounts[0]?.name || 'cliente@pedidos360.com');
    }
  }, [activeAccount, accounts]);

  // Verificar estado del microservicio Carrito
  useEffect(() => {
    const checkCarritoStatus = async () => {
      try {
        const res = await fetch(CARRITO_STATUS_URL);
        if (res.ok) {
          const json = await res.json();
          setCarritoStatus(json);
        }
      } catch {}
    };
    if (isOpen) checkCarritoStatus();
  }, [isOpen]);

  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Procesamiento Directo con RabbitMQ (Flujo transaccional EV2)
  const handleCheckoutDirecto = async () => {
    if (cartItems.length === 0) return;
    setErrorMessage(null);
    setLoadingOrder(true);

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

    try {
      const res = await fetch(CARRITO_PEDIDOS_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.pedidos360.token`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Servicio de Carrito respondió HTTP ${res.status}: ${errText}`);
      }

      const responseData = await res.json();

      onOrderSuccess({
        response: responseData,
        payload,
        endpoint: CARRITO_PEDIDOS_URL,
        timestamp: new Date().toISOString(),
        metodo: 'RabbitMQ Transaccional',
      });

      onClearCart();
      onClose();
    } catch (err) {
      console.error("Error al procesar compra directa:", err);
      setErrorMessage(err.message || "Error al conectar con Carrito API.");
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
            <span>Microservicio Carrito Conectado (:8081)</span>
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
                <label>Email Cliente:</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="cliente@pedidos360.com"
                  className="cart-input"
                />
              </div>

              <div className="input-field">
                <label>Dirección de Envío:</label>
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Ej: Av. Providencia 1234, Santiago"
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
                <span>Despacho:</span>
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

            {/* Dos Botones de Checkout Claros: Webpay Plus (Rúbrica EV3) y Directo RabbitMQ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <button
                className="btn btn-checkout"
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                }}
                onClick={() => onOpenWebpay({ customerEmail, shippingAddress, totalAmount: subtotal })}
                disabled={loadingOrder}
              >
                💳 Pagar con Webpay Plus (+5 Pts Extra)
              </button>

              <button
                className="btn"
                style={{
                  background: '#1e293b',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
                onClick={handleCheckoutDirecto}
                disabled={loadingOrder}
              >
                {loadingOrder ? 'Procesando en RabbitMQ...' : '⚡ Simular Pedido Directo (RabbitMQ)'}
              </button>
            </div>

            <div className="cart-security-note">
              <ShieldCheckIcon size={14} color="var(--primary-accent)" />
              <span>Transacción protegida con regla antifraude en tiempo real y clúster RabbitMQ.</span>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default Carrito;
