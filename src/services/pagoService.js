import { apiClient } from './apiClient';
import { getApiEndpoints } from '../config/apiConfig';

/**
 * Servicio de Pagos y Motor Antifraude (ms-pago + Transbank Webpay Plus)
 * Administra el ciclo de vida de la transacción, ráfagas de velocidad y confirmación vía /callback.
 */
export const pagoService = {
  /**
   * 1. Iniciar Transacción en Webpay Plus
   * @param {Object} params { clientId, amount, transactionId, returnUrl }
   * @returns {Promise<{ url: string, token: string, transactionId: string }>}
   */
  async iniciarPago({ clientId, amount, transactionId, returnUrl }) {
    const endpoints = getApiEndpoints();
    const effectiveReturnUrl = returnUrl || (typeof window !== 'undefined' ? `${window.location.origin}/callback` : '/callback');

    const payload = {
      clientId,
      amount: Number(amount),
      transactionId: transactionId || `TX-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
      returnUrl: effectiveReturnUrl,
    };

    return await apiClient(endpoints.pagosIniciar, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * 2. Redirección oficial por formulario POST hacia la pasarela Webpay Plus
   * @param {string} url - URL retornada por Transbank
   * @param {string} token - Token de transacción (token_ws)
   */
  redirigirAWebpay(url, token) {
    if (typeof document === 'undefined') return;

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.style.display = 'none';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'token_ws';
    input.value = token;

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
  },

  /**
   * 3. Confirmar / Commit de la Transacción en el Retorno (/callback)
   * @param {string} tokenWs - Token devuelto por Transbank
   * @returns {Promise<Object>} Voucher de confirmación
   */
  async confirmarPago(tokenWs) {
    const endpoints = getApiEndpoints();
    const url = `${endpoints.pagosCommit}?token_ws=${encodeURIComponent(tokenWs)}`;

    return await apiClient(url, {
      method: 'POST',
      body: JSON.stringify({ token_ws: tokenWs }),
    });
  },

  /**
   * 4. Consultar Estado de Seguridad y Bloqueo de un Cliente
   * @param {string} clientId
   * @returns {Promise<{ idCliente: string, bloqueado: boolean, cantidadIntentos: number }>}
   */
  async consultarEstadoCliente(clientId) {
    const endpoints = getApiEndpoints();
    const url = `${endpoints.pagosEstadoCliente}/${encodeURIComponent(clientId)}`;
    return await apiClient(url, { method: 'GET' });
  },
};

export default pagoService;
