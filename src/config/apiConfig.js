/**
 * Configuración centralizada de Endpoints Multi-Nube (AWS API Gateway & Directo EC2 / Localhost)
 */

export const AWS_API_GATEWAY_URL = 'https://op6erfwwmh.execute-api.us-east-1.amazonaws.com/v1';

// Detectar hostname actual (localhost o IP de EC2)
const getBaseHost = () => {
  if (typeof window !== 'undefined' && window.location.hostname) {
    return window.location.hostname;
  }
  return 'localhost';
};

export const getApiEndpoints = (targetMode = null) => {
  const host = getBaseHost();
  const savedMode = typeof localStorage !== 'undefined' ? localStorage.getItem('pedidos360_api_mode') : null;
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  
  // Por defecto usa 'cloud' (API Gateway) para evaluación o 'direct'
  const mode = targetMode || savedMode || (isLocal ? 'local' : 'cloud');

  if (mode === 'direct' || mode === 'local') {
    return {
      mode: 'direct',
      label: `Servidores Directos (http://${host}:8080..8084)`,
      catalogoStatus: `http://${host}:8080/api/status`,
      catalogoProductos: `http://${host}:8080/api/productos`,
      carritoStatus: `http://${host}:8081/api/carrito/status`,
      carritoPedidos: `http://${host}:8081/api/carrito/pedidos`,
      notificacionesStatus: `http://${host}:8082/api/notificaciones/status`,
      notificacionesEnviar: `http://${host}:8082/api/notificaciones/enviar`,
      auditoriaStatus: `http://${host}:8083/api/auditoria/status`,
      auditoriaEventos: `http://${host}:8083/api/auditoria`,
      auditoriaStats: `http://${host}:8083/api/auditoria/stats`,
      adminQueues: `http://${host}:8084/api/admin/queues`,
      adminExchanges: `http://${host}:8084/api/admin/exchanges`,
      adminBindings: `http://${host}:8084/api/admin/bindings`,
    };
  }

  // Cloud Mode: AWS HTTP API Gateway (Punto de entrada único)
  return {
    mode: 'cloud',
    label: 'AWS HTTP API Gateway (Perímetro Cloud)',
    catalogoStatus: `${AWS_API_GATEWAY_URL}/api/productos`,
    catalogoProductos: `${AWS_API_GATEWAY_URL}/api/productos`,
    carritoStatus: `${AWS_API_GATEWAY_URL}/api/carrito/status`,
    carritoPedidos: `${AWS_API_GATEWAY_URL}/api/carrito/pedidos`,
    notificacionesStatus: `${AWS_API_GATEWAY_URL}/api/notificaciones/status`,
    notificacionesEnviar: `${AWS_API_GATEWAY_URL}/api/notificaciones/enviar`,
    auditoriaStatus: `${AWS_API_GATEWAY_URL}/api/auditoria/status`,
    auditoriaEventos: `${AWS_API_GATEWAY_URL}/api/auditoria`,
    auditoriaStats: `${AWS_API_GATEWAY_URL}/api/auditoria/stats`,
    adminQueues: `${AWS_API_GATEWAY_URL}/api/admin/queues`,
    adminExchanges: `${AWS_API_GATEWAY_URL}/api/admin/exchanges`,
    adminBindings: `${AWS_API_GATEWAY_URL}/api/admin/bindings`,
  };
};

export const setApiMode = (mode) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('pedidos360_api_mode', mode);
  }
};
