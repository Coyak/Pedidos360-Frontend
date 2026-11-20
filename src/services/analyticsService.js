import { apiClient } from './apiClient';
import { getApiEndpoints } from '../config/apiConfig';

/**
 * Servicio de Analítica, Streaming Kafka y Recomendaciones Dinámicas
 * Permite la ingesta de eventos de clickstream y la consulta de sugerencias personalizadas.
 */
export const analyticsService = {
  /**
   * 1. Registrar evento de interacción hacia Apache Kafka
   * @param {Object} param0 { clientId, itemId, action, category, productType }
   */
  async registrarInteraccion({ clientId, itemId, action, category = 'General', productType = 'Tech' }) {
    const endpoints = getApiEndpoints();
    const payload = {
      clientId: clientId || 'cliente.anonimo@pedidos360.com',
      itemId,
      action: action.toLowerCase(), // 'view' | 'cart' | 'purchase'
      category,
      productType,
      timestamp: Date.now(),
    };

    try {
      // Intentar primero endpoint directo de interacciones, con fallback al controlador de recomendaciones
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
   * 2. Consultar recomendaciones personalizadas basadas en IA/Kafka
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
      // Intento con query param si el backend expone el formato estándar
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
   * 3. Forzar emisión de métricas en tiempo real a través del WebSocket
   */
  async forzarEmisionMetricas() {
    const endpoints = getApiEndpoints();
    const url = `${endpoints.analyticsStatus.replace('/status', '')}/emitir-metricas`;
    try {
      return await apiClient(url, { method: 'POST' });
    } catch {
      return null;
    }
  },
};

export default analyticsService;
