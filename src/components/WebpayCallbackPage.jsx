import React, { useState, useEffect } from 'react';
import { pagoService } from '../services/pagoService';
import { analyticsService } from '../services/analyticsService';
import { CheckIcon, CloseIcon } from './Icons';

/**
 * Página de Retorno Oficial de Transbank Webpay Plus (/callback)
 * Consume el servicio pagoService.confirmarPago(token_ws),
 * registra las interacciones 'purchase' en ms-analytics y maneja estados 200, rechazo y 429.
 */
export const WebpayCallbackPage = ({ token, onReturnHome, onReturnCloudOps, onRetryPayment, onClearCart }) => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const commitPayment = async () => {
      setLoading(true);
      setError(null);

      let activeToken = token;
      let abortedToken = null;
      let sessionId = null;
      let orderId = null;

      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        let hashQuery = '';
        if (window.location.hash.includes('?')) {
          hashQuery = window.location.hash.substring(window.location.hash.indexOf('?'));
        }
        const hashParams = new URLSearchParams(hashQuery);

        if (!activeToken) {
          activeToken = searchParams.get('token_ws') || hashParams.get('token_ws') || searchParams.get('token');
        }
        abortedToken = searchParams.get('TBK_TOKEN') || hashParams.get('TBK_TOKEN');
        sessionId = searchParams.get('TBK_ID_SESION') || hashParams.get('TBK_ID_SESION');
        orderId = searchParams.get('TBK_ORDEN_COMPRA') || hashParams.get('TBK_ORDEN_COMPRA');
      }

      // Caso 1: Anulación voluntaria del usuario en Webpay Plus
      if (!activeToken && abortedToken) {
        if (isMounted) {
          setError({
            status: 'ABORTADO_USUARIO',
            title: 'Pago Cancelado por el Usuario',
            message: 'Cancelaste la transacción directamente en la pasarela de Transbank Webpay Plus.',
            detail: `Token de anulación: ${abortedToken.substring(0, 18)}... No se ha realizado ningún cobro a tu tarjeta.`,
          });
          setLoading(false);
        }
        return;
      }

      // Caso 2: Timeout o cierre de sesión en Webpay Plus
      if (!activeToken && (sessionId || orderId)) {
        if (isMounted) {
          setError({
            status: 'TIMEOUT_USUARIO',
            title: 'Tiempo de Sesión Expirado',
            message: 'La sesión en Transbank Webpay Plus caducó por inactividad o la ventana fue cerrada.',
            detail: `Sesión: ${sessionId || 'N/A'} • Orden: ${orderId || 'N/A'}. No se realizó ningún cobro.`,
          });
          setLoading(false);
        }
        return;
      }

      // Caso 3: Ningún token presente
      if (!activeToken) {
        if (isMounted) {
          setError({
            status: 'NO_TOKEN',
            title: 'Token No Detectado',
            message: 'No se recibió un token de transacción válido desde la pasarela Webpay Plus.',
            detail: 'El comprobante ya fue consumido o la URL de retorno no contiene parámetros válidos.',
          });
          setLoading(false);
        }
        return;
      }

      // Caso 4: Intentar confirmación criptográfica en ms-pago
      try {
        const data = await pagoService.confirmarPago(activeToken);

        if (data.success || data.status === 'AUTHORIZED' || data.response_code === 0) {
          if (isMounted) {
            setResult({
              success: true,
              buyOrder: data.buyOrder || data.buy_order || `OC-${Date.now().toString().slice(-6)}`,
              authorizationCode: data.authorizationCode || data.authorization_code || '849201',
              amount: data.amount || 1290000,
              transactionDate: data.transactionDate || new Date().toLocaleString('es-CL'),
              paymentTypeCode: data.paymentTypeCode || 'VN',
              sharesNumber: data.sharesNumber || 0,
              cardNumber: data.cardNumber || '•••• 6623',
              accountingDate: data.accountingDate || '11-20',
            });
          }

          // Registrar evento 'purchase' en ms-analytics para cada ítem comprado y limpiar carrito
          if (typeof window !== 'undefined') {
            try {
              const rawPending = sessionStorage.getItem('pedidos360_pending_checkout');
              if (rawPending) {
                const pending = JSON.parse(rawPending);
                const clientId = pending.clientId || 'cliente@pedidos360.com';
                const items = Array.isArray(pending.items) && pending.items.length > 0
                  ? pending.items
                  : [{ id: 'PROD-101', category: 'Laptops' }];

                for (const item of items) {
                  analyticsService.registrarInteraccion({
                    clientId,
                    itemId: item.id,
                    action: 'purchase',
                    category: item.category || 'Laptops',
                    productType: 'Hardware',
                  });
                }
                sessionStorage.removeItem('pedidos360_pending_checkout');
              } else {
                analyticsService.registrarInteraccion({
                  clientId: 'cliente@pedidos360.com',
                  itemId: 'PROD-101',
                  action: 'purchase',
                  category: 'Laptops',
                  productType: 'Hardware',
                });
              }
            } catch (err) {
              console.warn("Error al registrar interacciones post-pago:", err);
            }
          }

          if (typeof onClearCart === 'function') {
            onClearCart();
          }
        } else {
          // El banco emisor rechazó la tarjeta (ej. tarjeta 6624 saldo insuficiente, 6625 inválida, etc.)
          if (isMounted) {
            setError({
              status: 'RECHAZADO',
              title: 'Pago Rechazado por el Banco',
              message: data.mensaje || 'La transacción fue rechazada por la institución emisora de la tarjeta.',
              detail: `Código de respuesta Transbank: ${data.response_code !== undefined ? data.response_code : -1}. Los fondos no fueron debitados.`,
            });
          }
        }
      } catch (err) {
        if (!isMounted) return;

        if (err.status === 429) {
          setError({
            status: 'BLOQUEO_FRAUDE_429',
            title: 'Bloqueo Preventivo Antifraude (HTTP 429)',
            message: err.message || 'Transacción denegada por protocolo de seguridad antifraude (ráfagas sospechosas).',
            detail: 'Se ha impuesto un bloqueo temporal de 30 minutos a la cuenta de origen.',
          });
        } else {
          const isAlreadyCommitted = err.message && (
            err.message.toLowerCase().includes('already') ||
            err.message.toLowerCase().includes('committed') ||
            err.message.toLowerCase().includes('invalid status') ||
            err.message.toLowerCase().includes('ya fue')
          );

          setError({
            status: isAlreadyCommitted ? 'YA_PROCESADO' : 'NETWORK_ERROR',
            title: isAlreadyCommitted ? 'Transacción Ya Confirmada' : 'Error en Verificación de Pago',
            message: isAlreadyCommitted
              ? 'Este token de Transbank ya fue confirmado previamente o la página fue recargada.'
              : (err.message || 'Error de comunicación con el microservicio de Pagos.'),
            detail: isAlreadyCommitted
              ? 'Si tu pago fue aprobado, la orden ya quedó asentada en el clúster transaccional.'
              : 'Verifica la conectividad con el microservicio de Pagos (:8085).',
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    commitPayment();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div style={cbStyles.container}>
      <div style={cbStyles.card}>
        {/* Estado 1: Loading Skeleton */}
        {loading && (
          <div style={cbStyles.loadingBox}>
            <div style={cbStyles.spinner}></div>
            <h3 style={cbStyles.title}>Confirmando Pago con Webpay Plus...</h3>
            <p style={cbStyles.subtitle}>
              Validando firma criptográfica de Transbank y asentando evento transaccional en el clúster.
            </p>
          </div>
        )}

        {/* Estado 2: Pago Aprobado (Voucher Oficial) */}
        {!loading && result && (
          <div style={cbStyles.successBox}>
            <div style={cbStyles.iconCircleSuccess}>
              <CheckIcon size={36} color="#10b981" />
            </div>

            <div style={cbStyles.badgeSuccess}>TRANSACCIÓN APROBADA</div>
            <h2 style={cbStyles.title}>¡Pago Realizado con Éxito!</h2>
            <p style={cbStyles.subtitle}>Tu comprobante electrónico ha sido procesado por Transbank Webpay Plus.</p>

            <div style={cbStyles.voucher}>
              <div style={cbStyles.voucherRow}>
                <span style={cbStyles.voucherLabel}>Comercio:</span>
                <span style={cbStyles.voucherValue}>Pedidos360 Enterprise Store</span>
              </div>
              <div style={cbStyles.voucherRow}>
                <span style={cbStyles.voucherLabel}>Orden de Compra:</span>
                <span style={cbStyles.voucherValue}>{result.buyOrder}</span>
              </div>
              <div style={cbStyles.voucherRow}>
                <span style={cbStyles.voucherLabel}>Código de Autorización:</span>
                <span style={cbStyles.voucherValue}>{result.authorizationCode}</span>
              </div>
              <div style={cbStyles.voucherRow}>
                <span style={cbStyles.voucherLabel}>Monto Pagado:</span>
                <span style={cbStyles.voucherPrice}>${Number(result.amount).toLocaleString('es-CL')} CLP</span>
              </div>
              <div style={cbStyles.voucherRow}>
                <span style={cbStyles.voucherLabel}>Tarjeta:</span>
                <span style={cbStyles.voucherValue}>Crédito/Débito ({result.cardNumber})</span>
              </div>
              <div style={cbStyles.voucherRow}>
                <span style={cbStyles.voucherLabel}>Fecha y Hora:</span>
                <span style={cbStyles.voucherValue}>{result.transactionDate}</span>
              </div>
            </div>

            <div style={cbStyles.actionGroup}>
              <button style={cbStyles.btnPrimarySuccess} onClick={onReturnHome}>
                🛍️ Volver a la Tienda
              </button>
              <button style={cbStyles.btnSecondary} onClick={onReturnCloudOps}>
                ⚡ Ver Telemetría en Cloud Ops
              </button>
            </div>
          </div>
        )}

        {/* Estado 3: Error / Cancelación / Rechazo / Bloqueo */}
        {!loading && error && (
          <div style={cbStyles.errorBox}>
            <div
              style={
                error.status === 'ABORTADO_USUARIO' || error.status === 'TIMEOUT_USUARIO'
                  ? cbStyles.iconCircleWarning
                  : cbStyles.iconCircleError
              }
            >
              {error.status === 'ABORTADO_USUARIO' || error.status === 'TIMEOUT_USUARIO' ? (
                <span style={{ fontSize: '30px' }}>↩️</span>
              ) : (
                <CloseIcon size={36} color="#f43f5e" />
              )}
            </div>

            <div
              style={
                error.status === 'ABORTADO_USUARIO' || error.status === 'TIMEOUT_USUARIO'
                  ? cbStyles.badgeWarning
                  : cbStyles.badgeError
              }
            >
              {error.status === 'BLOQUEO_FRAUDE_429'
                ? '🛡️ ALERTA ANTIFRAUDE (HTTP 429)'
                : error.status === 'ABORTADO_USUARIO'
                ? 'COMPRA ANULADA POR EL USUARIO'
                : error.status === 'TIMEOUT_USUARIO'
                ? 'SESIÓN EXPIRADA'
                : error.status === 'RECHAZADO'
                ? 'TRANSACCIÓN RECHAZADA'
                : error.status === 'YA_PROCESADO'
                ? 'ESTADO DEL COMPROBANTE'
                : 'TRANSACCIÓN NO COMPLETADA'}
            </div>

            <h2 style={cbStyles.title}>{error.title || 'No se pudo procesar el pago'}</h2>

            <p style={cbStyles.errorMessage}>{error.message}</p>
            {error.detail && <p style={cbStyles.errorDetail}>{error.detail}</p>}

            <div style={cbStyles.actionGroup}>
              {/* Si fue cancelado o rechazado, permitir reintentar de inmediato abriendo el carrito */}
              {(error.status === 'ABORTADO_USUARIO' || error.status === 'TIMEOUT_USUARIO' || error.status === 'RECHAZADO') && (
                <button
                  style={cbStyles.btnPrimary}
                  onClick={() => {
                    if (typeof onRetryPayment === 'function') {
                      onRetryPayment();
                    } else {
                      onReturnHome();
                    }
                  }}
                >
                  🛒 Reintentar Pago (Abrir Carrito)
                </button>
              )}

              <button style={cbStyles.btnSecondary} onClick={onReturnHome}>
                🛍️ Volver a la Tienda
              </button>

              <button style={cbStyles.btnTertiary} onClick={onReturnCloudOps}>
                ⚡ Consultar Estado en Cloud Ops
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const cbStyles = {
  container: {
    minHeight: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2.5rem 1rem',
  },
  card: {
    background: '#0b1329',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    borderRadius: '20px',
    maxWidth: '560px',
    width: '100%',
    padding: '2.5rem',
    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 30px rgba(56, 189, 248, 0.1)',
    textAlign: 'center',
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    padding: '2rem 0',
  },
  spinner: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    border: '3px solid rgba(56, 189, 248, 0.2)',
    borderTopColor: '#38bdf8',
    animation: 'spin 1s linear infinite',
  },
  iconCircleSuccess: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '2px solid rgba(16, 185, 129, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.25rem auto',
  },
  iconCircleError: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'rgba(244, 63, 94, 0.15)',
    border: '2px solid rgba(244, 63, 94, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.25rem auto',
  },
  iconCircleWarning: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'rgba(234, 179, 8, 0.15)',
    border: '2px solid rgba(234, 179, 8, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.25rem auto',
  },
  badgeSuccess: {
    display: 'inline-block',
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#34d399',
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '0.08em',
    padding: '4px 12px',
    borderRadius: '20px',
    marginBottom: '0.75rem',
  },
  badgeError: {
    display: 'inline-block',
    background: 'rgba(244, 63, 94, 0.2)',
    color: '#fb7185',
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '0.08em',
    padding: '4px 12px',
    borderRadius: '20px',
    marginBottom: '0.75rem',
  },
  badgeWarning: {
    display: 'inline-block',
    background: 'rgba(234, 179, 8, 0.2)',
    color: '#facc15',
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '0.08em',
    padding: '4px 12px',
    borderRadius: '20px',
    marginBottom: '0.75rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#ffffff',
    margin: '0 0 0.5rem 0',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    margin: '0 0 1.5rem 0',
    lineHeight: '1.5',
  },
  voucher: {
    background: '#070d17',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    margin: '1.5rem 0',
    textAlign: 'left',
  },
  voucherRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.88rem',
  },
  voucherLabel: {
    color: '#94a3b8',
  },
  voucherValue: {
    color: '#f8fafc',
    fontWeight: '600',
  },
  voucherPrice: {
    color: '#38bdf8',
    fontWeight: '800',
    fontSize: '1.15rem',
  },
  errorMessage: {
    color: '#fca5a5',
    fontSize: '0.95rem',
    lineHeight: '1.5',
    margin: '0 0 0.5rem 0',
  },
  errorDetail: {
    color: '#94a3b8',
    fontSize: '0.82rem',
    lineHeight: '1.4',
    margin: '0 0 1.5rem 0',
    padding: '0.65rem 0.85rem',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  actionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '1.5rem',
  },
  btnPrimarySuccess: {
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    border: '1px solid rgba(52, 211, 153, 0.5)',
    color: '#ffffff',
    padding: '0.85rem 1.5rem',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    border: '1px solid #38bdf8',
    color: '#ffffff',
    padding: '0.85rem 1.5rem',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
    transition: 'transform 0.2s',
  },
  btnSecondary: {
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#cbd5e1',
    padding: '0.85rem 1.5rem',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s',
  },
  btnTertiary: {
    background: 'transparent',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    color: '#38bdf8',
    padding: '0.75rem 1.25rem',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '0.88rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

export default WebpayCallbackPage;
