import React, { useState } from 'react';
import { pagoService } from '../services/pagoService';
import { analyticsService } from '../services/analyticsService';
import { CloseIcon, ShieldCheckIcon } from './Icons';

/**
 * Modal de Checkout con Webpay Plus y Motor Antifraude
 * Maneja el inicio de transacción, redirección oficial por POST y alertas de bloqueo (HTTP 429).
 */
export const WebpayModal = ({
  isOpen,
  onClose,
  cartItems,
  customerEmail,
  shippingAddress,
  totalAmount,
  onPaymentSuccess,
}) => {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(false);
  const [fraudAlert, setFraudAlert] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [webpayData, setWebpayData] = useState(null);

  // 1. Iniciar Transacción en Webpay Plus (evalúa regla antifraude en ms-pago)
  const handleIniciarWebpay = async () => {
    setLoading(true);
    setFraudAlert(null);
    setErrorMessage(null);

    const clientId = customerEmail || 'cliente@pedidos360.com';
    const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}/callback` : '/callback';
    const transactionId = `TX-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    try {
      const data = await pagoService.iniciarPago({
        clientId,
        amount: totalAmount,
        transactionId,
        returnUrl,
      });

      // Guardar contexto del pedido en sessionStorage para registrar evento 'purchase' al volver a /callback
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(
            'pedidos360_pending_checkout',
            JSON.stringify({
              clientId,
              transactionId: data.transactionId || transactionId,
              totalAmount,
              items: cartItems.map((i) => ({
                id: i.id,
                name: i.name,
                price: i.price,
                quantity: i.quantity,
                category: i.category || 'Hardware',
              })),
            })
          );
        } catch {}
      }

      setWebpayData(data); // Contiene { url, token, transactionId }
    } catch (err) {
      if (err.status === 429) {
        // Bloqueo preventivo por regla antifraude (>3 intentos en 10 seg)
        const msg = err.message || 'Se detectaron más de 3 transacciones en menos de 10 segundos. La cuenta ha sido bloqueada temporalmente por 30 minutos.';
        setFraudAlert({
          titulo: '🚨 BLOQUEO PREVENTIVO DE SEGURIDAD (HTTP 429)',
          mensaje: msg,
          detalles: 'Protocolo de protección contra ataques de fuerza bruta y transacciones repetitivas.',
        });
        analyticsService.registrarAlertaFraude({
          clientId,
          razon: `Bloqueo 429 en Checkout Webpay: ${msg}`,
        });
      } else {
        setErrorMessage(err.message || 'No se pudo conectar con el microservicio de Pagos.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Redirección oficial POST con token_ws a la pasarela Webpay Plus
  const handleRedirigirPasarelaOficial = () => {
    if (!webpayData?.url || !webpayData?.token) return;
    pagoService.redirigirAWebpay(webpayData.url, webpayData.token);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card webpay-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Encabezado */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-badge-tag">Pasarela Oficial</span>
            <h3>Transbank Webpay Plus</h3>
            <p className="modal-subtitle">Integración con motor antifraude de velocidad</p>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Cerrar modal">
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="modal-body">
          {/* Alerta de Bloqueo Antifraude (HTTP 429) */}
          {fraudAlert && (
            <div className="fraud-alert-banner">
              <div className="fraud-alert-header">
                <span className="fraud-icon">🛡️</span>
                <h4>{fraudAlert.titulo}</h4>
              </div>
              <p className="fraud-alert-desc">{fraudAlert.mensaje}</p>
              <div className="fraud-alert-meta">
                <span>{fraudAlert.detalles}</span>
              </div>
            </div>
          )}

          {/* Error general de red */}
          {errorMessage && (
            <div className="error-alert-banner">
              <span>⚠️ {errorMessage}</span>
            </div>
          )}

          {/* Resumen del Pedido */}
          <div className="checkout-summary-card">
            <div className="summary-row">
              <span className="summary-label">Cliente / Tarjetahabiente:</span>
              <span className="summary-value">{customerEmail || 'cliente@pedidos360.com'}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Dirección de Envío:</span>
              <span className="summary-value">{shippingAddress}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Ítems a Facturar:</span>
              <span className="summary-value">{cartItems.reduce((acc, i) => acc + i.quantity, 0)} unidades</span>
            </div>
            <div className="summary-row total-highlight">
              <span className="summary-label">Total a Pagar (CLP):</span>
              <span className="summary-price">${totalAmount.toLocaleString('es-CL')}</span>
            </div>
          </div>

          {/* Estado de Transacción Lista para Redirigir */}
          {webpayData && (
            <div className="webpay-ready-box">
              <div className="webpay-ready-icon">
                <ShieldCheckIcon size={28} color="#10b981" />
              </div>
              <h4>Token de Transacción Generado</h4>
              <p>Tu orden ha sido registrada en el clúster transaccional. Haz clic en el botón verde abajo para ir a Transbank Webpay Plus.</p>
              <div className="token-display">
                <code>token_ws: {webpayData.token.substring(0, 24)}...</code>
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="modal-footer webpay-modal-footer">
          <button className="btn btn-secondary btn-cancel-webpay" onClick={onClose} disabled={loading}>
            Cancelar
          </button>

          {!webpayData ? (
            <button
              className="btn btn-primary btn-pay-webpay"
              onClick={handleIniciarWebpay}
              disabled={loading || !!fraudAlert}
            >
              {loading ? 'Evaluando Seguridad...' : `Pagar con Webpay Plus $${totalAmount.toLocaleString('es-CL')}`}
            </button>
          ) : (
            <button
              className="btn btn-success btn-pay-webpay btn-redirect-transbank"
              onClick={handleRedirigirPasarelaOficial}
            >
              🚀 Redirigir a Pasarela Transbank (POST)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebpayModal;
