import { getApiEndpoints } from '../config/apiConfig';

/**
 * Gestor de Conexión WebSocket en Tiempo Real (+3 Puntos Extra)
 * Provee reconexión automática, emisión de estados (conectado, desconectado, reconectando)
 * y despacho de telemetría de eventos analíticos y alertas antifraude.
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
   * Inicia la conexión con el servidor WebSocket
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
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyMessage(data);
        } catch {
          this.notifyMessage({ raw: event.data });
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
