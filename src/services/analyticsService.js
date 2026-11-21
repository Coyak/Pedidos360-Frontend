import { apiClient } from './apiClient';
import { getApiEndpoints } from '../config/apiConfig';

/**
 * Servicio de Analítica, Streaming Kafka y Recomendaciones Dinámicas
 * Permite la ingesta de eventos de clickstream, consulta de sugerencias personalizadas
 * y obtención de métricas analíticas en tiempo real.
 */
export const analyticsService = {
  /**
   * 1. Registrar evento de interacción hacia Apache Kafka (view, cart, purchase)
   * @param {Object} param0 { clientId, itemId, action, category, productType }
   */
  async registrarInteraccion({ clientId, itemId, action, category = 'Laptops', productType = 'Hardware' }) {
    const endpoints = getApiEndpoints();
    const payload = {
      clientId: clientId || 'cliente@pedidos360.com',
      itemId,
      action: (action || 'view').toLowerCase(), // 'view' | 'cart' | 'purchase'
      category,
      productType,
      timestamp: Date.now(),
    };

    try {
      return await apiClient(endpoints.analyticsInteraccion, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Registro de interacción advertencia:', err.message);
      return null;
    }
  },

  /**
   * 2. Consultar recomendaciones personalizadas basadas en Kafka/MySQL
   * @param {string} userId - ID o email del cliente
   * @returns {Promise<Array>} Lista de productos recomendados
   */
  async obtenerRecomendaciones(userId) {
    const endpoints = getApiEndpoints();
    const cleanId = userId || 'cliente@pedidos360.com';

    // Soporta ambas firmas: /api/recomendaciones/{userId} y /api/recomendaciones?userId=...
    const url = `${endpoints.analyticsRecomendaciones}/${encodeURIComponent(cleanId)}`;

    try {
      const data = await apiClient(url, { method: 'GET' });
      return Array.isArray(data) ? data : [];
    } catch {
      try {
        const queryUrl = `${endpoints.analyticsRecomendaciones}?userId=${encodeURIComponent(cleanId)}`;
        const queryData = await apiClient(queryUrl, { method: 'GET' });
        return Array.isArray(queryData) ? queryData : [];
      } catch {
        return [];
      }
    }
  },

  /**
   * 3. Obtener snapshot de métricas analíticas reales desde ms-analytics
   */
  async obtenerMetricas() {
    const endpoints = getApiEndpoints();
    try {
      return await apiClient(endpoints.analyticsMetricas, { method: 'GET' });
    } catch {
      return null;
    }
  },

  /**
   * 4. Registrar alerta antifraude (HTTP 429) para telemetría en vivo
   */
  async registrarAlertaFraude({ clientId, razon, ip = '190.161.88.94' }) {
    const endpoints = getApiEndpoints();
    try {
      return await apiClient(endpoints.analyticsAlertaFraude, {
        method: 'POST',
        body: JSON.stringify({ clientId, razon, ip }),
      });
    } catch {
      return null;
    }
  },

  /**
   * 5. Forzar emisión de métricas en tiempo real a través del WebSocket (/topic/metricas)
   */
  async forzarEmisionMetricas() {
    const endpoints = getApiEndpoints();
    try {
      return await apiClient(endpoints.analyticsEmitirMetricas, { method: 'POST' });
    } catch {
      return null;
    }
  },
};

export default analyticsService;
