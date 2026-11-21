import { getApiEndpoints } from '../config/apiConfig';

/**
 * Gestor de Conexión WebSocket en Tiempo Real (+3 Puntos Extra)
 * Compatible tanto con Spring STOMP (/ws-analytics-raw -> suscripción a /topic/metricas)
 * como con frames JSON directos, con reconexión automática y estado visual.
 */
class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectTimer = null;
    this.listeners = new Set();
    this.statusListeners = new Set();
    this.isConnected = false;
    this.reconnectInterval = 5000;
  }

  /**
   * Obtiene la URL de WebSocket desde variable de entorno o configuración centralizada
   */
  getWsUrl(clientId = 'cloudops_client') {
    const endpoints = getApiEndpoints();
    const baseWs = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WS_URL)
      ? import.meta.env.VITE_WS_URL
      : endpoints.analyticsWs;

    const separator = baseWs.includes('?') ? '&' : '?';
    return `${baseWs}${separator}clientId=${encodeURIComponent(clientId)}`;
  }

  /**
   * Inicia la conexión con el servidor WebSocket y negocia suscripción STOMP a /topic/metricas
   */
  connect(clientId) {
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return;
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
      return;
    }

    const url = this.getWsUrl(clientId);

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.notifyStatus('CONNECTED');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // Enviar handshake STOMP CONNECT para endpoints Spring @EnableWebSocketMessageBroker
        try {
          const connectFrame = 'CONNECT\naccept-version:1.2,1.1,1.0\nheart-beat:10000,10000\n\n\0';
          this.socket.send(connectFrame);
        } catch {
          // Si es un servidor WebSocket raw que ignora STOMP, continúa conectado
        }
      };

      this.socket.onmessage = (event) => {
        const rawData = typeof event.data === 'string' ? event.data : '';
        if (!rawData || rawData === '\n' || rawData === '\r\n') {
          return; // Heartbeat frame
        }

        // 1. Respuesta STOMP CONNECTED -> suscribirse inmediatamente a /topic/metricas
        if (rawData.startsWith('CONNECTED')) {
          try {
            const subFrame = 'SUBSCRIBE\nid:sub-metricas-0\ndestination:/topic/metricas\n\n\0';
            this.socket.send(subFrame);
          } catch {}
          return;
        }

        // 2. Frame STOMP MESSAGE (destination:/topic/metricas)
        if (rawData.startsWith('MESSAGE')) {
          const bodySeparatorIdx = rawData.indexOf('\n\n');
          if (bodySeparatorIdx !== -1) {
            const jsonBody = rawData.substring(bodySeparatorIdx + 2).replace(/\0/g, '').trim();
            if (jsonBody) {
              try {
                const parsed = JSON.parse(jsonBody);
                this.notifyMessage(parsed);
                return;
              } catch {}
            }
          }
        }

        // 3. Fallback: mensaje WebSocket JSON directo
        try {
          const cleanJson = rawData.replace(/\0/g, '').trim();
          const data = JSON.parse(cleanJson);
          this.notifyMessage(data);
        } catch {
          // Ignorar otros frames de control STOMP (RECEIPT, etc.)
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.notifyStatus('DISCONNECTED');
        this.scheduleReconnect(clientId);
      };

      this.socket.onerror = () => {
        this.isConnected = false;
        this.notifyStatus('ERROR');
      };
    } catch {
      this.isConnected = false;
      this.notifyStatus('ERROR');
      this.scheduleReconnect(clientId);
    }
  }

  scheduleReconnect(clientId) {
    if (this.reconnectTimer) return;
    this.notifyStatus('RECONNECTING');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(clientId);
    }, this.reconnectInterval);
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  subscribeStatus(callback) {
    this.statusListeners.add(callback);
    callback(this.isConnected ? 'CONNECTED' : 'DISCONNECTED');
    return () => this.statusListeners.delete(callback);
  }

  notifyMessage(data) {
    this.listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (err) {
        console.error('Error en suscriptor WebSocket:', err);
      }
    });
  }

  notifyStatus(status) {
    this.statusListeners.forEach((listener) => {
      try {
        listener(status);
      } catch (err) {
        console.error('Error en suscriptor de estado WebSocket:', err);
      }
    });
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.notifyStatus('DISCONNECTED');
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
