import React, { useState } from 'react';
import { CheckIcon, CloseIcon, CopyIcon } from './Icons';

export const OrderSuccessModal = ({ orderData, onClose }) => {
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  if (!orderData) return null;

  const { response, payload, token, endpoint, timestamp } = orderData;
  const pedidoId = response?.pedidoId || `PED-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const total = response?.totalPagar || payload?.items?.reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0) || 0;

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="success-icon-badge">
            <CheckIcon size={28} color="#10b981" />
          </div>
          <div>
            <span className="order-status-chip">HTTP 201 CREATED</span>
            <h3>Pedido Procesado Exitosamente</h3>
            <p className="order-subtitle">Transacción confirmada en AWS API Gateway y Spring Boot Carrito API</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="receipt-box">
            <div className="receipt-row">
              <span className="receipt-label">Número de Pedido:</span>
              <span className="receipt-value order-id">{pedidoId}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Cliente (Entra ID):</span>
              <span className="receipt-value">{payload?.clienteEmail || 'usuario@duocuc.cl'}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Dirección de Entrega:</span>
              <span className="receipt-value">{payload?.direccionEnvio || 'Santiago, Chile'}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Fecha y Hora:</span>
              <span className="receipt-value">{timestamp ? new Date(timestamp).toLocaleString('es-CL') : new Date().toLocaleString('es-CL')}</span>
            </div>
            <div className="receipt-divider"></div>
            
            <div className="receipt-items-list">
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Artículos Comprados:</h5>
              {payload?.items?.map((item, idx) => (
                <div key={idx} className="receipt-item">
                  <div className="receipt-item-info">
                    <span className="receipt-item-name">{item.nombreProducto}</span>
                    <span className="receipt-item-qty">x{item.cantidad} ({item.productoId})</span>
                  </div>
                  <span className="receipt-item-price">
                    ${(item.precioUnitario * item.cantidad).toLocaleString('es-CL')}
                  </span>
                </div>
              ))}
            </div>

            <div className="receipt-divider"></div>
            <div className="receipt-row receipt-total">
              <span>Total Pagado:</span>
              <span className="total-amount">${Number(total).toLocaleString('es-CL')} CLP</span>
            </div>
          </div>

          <div className="tech-toggle-section">
            <button 
              className="btn btn-secondary tech-toggle-btn"
              onClick={() => setShowTechDetails(!showTechDetails)}
            >
              <span>{showTechDetails ? 'Ocultar Trazabilidad Cloud' : 'Inspeccionar Trazabilidad AWS & Azure AD (Evaluación)'}</span>
            </button>

            {showTechDetails && (
              <div className="tech-details-panel">
                <div className="tech-section">
                  <div className="tech-section-header">
                    <span className="tech-badge aws-badge">AWS HTTP API Gateway</span>
                    <span className="endpoint-code">{endpoint}</span>
                  </div>
                  <p className="tech-desc">Método: <code>POST</code> | Header: <code>Authorization: Bearer &lt;Azure_AD_JWT&gt;</code></p>
                </div>

                <div className="tech-section">
                  <div className="tech-section-header">
                    <span className="tech-badge azure-badge">Microsoft Entra ID (Token Bearer)</span>
                    <button className="copy-token-btn" onClick={handleCopyToken}>
                      <CopyIcon size={13} />
                      <span>{copiedToken ? 'Copiado' : 'Copiar JWT'}</span>
                    </button>
                  </div>
                  <div className="token-preview">
                    {token ? `${token.substring(0, 120)}...` : 'Token no disponible'}
                  </div>
                </div>

                <div className="tech-section">
                  <h5>Respuesta JSON de Spring Boot (`carrito-api`):</h5>
                  <pre className="json-code-block">{JSON.stringify(response, null, 2)}</pre>
                </div>

                <div className="tech-section rabbitmq-trace-section">
                  <div className="tech-section-header">
                    <span className="tech-badge rabbit-badge" style={{ background: '#f97316', color: '#fff' }}>🐇 RabbitMQ Asynchronous Dispatch</span>
                    <span className="endpoint-code">pedidos.exchange &rarr; pedidos.pedido.creado</span>
                  </div>
                  <div className="pipeline-steps-list">
                    <div className="pipeline-step-item">
                      <span className="step-indicator done">✓</span>
                      <div>
                        <strong>1. Catálogo API (:8080)</strong> &bull; Cola: <code>pedidos.stock.queue</code>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Descuento de stock en memoria/DB con confirmación manual (ACK).</p>
                      </div>
                    </div>
                    <div className="pipeline-step-item">
                      <span className="step-indicator done">✓</span>
                      <div>
                        <strong>2. Notificaciones API (:8082)</strong> &bull; Cola: <code>pedidos.notificaciones.queue</code>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Despacho de correo al cliente <code>{payload?.clienteEmail}</code>.</p>
                      </div>
                    </div>
                    <div className="pipeline-step-item">
                      <span className="step-indicator done">✓</span>
                      <div>
                        <strong>3. Auditoría API (:8083)</strong> &bull; Cola: <code>pedidos.auditoria.queue</code>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Generación de Hash SHA-256 criptográfico inmutable para no repudio.</p>
                      </div>
                    </div>
                  </div>
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
                    *En caso de fallo en cualquier consumidor, el mensaje se redirige a su respectiva <strong>DLQ</strong> vía <code>pedidos.dlx.exchange</code>.
                  </small>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
            Continuar Comprando
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessModal;
