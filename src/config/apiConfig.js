/**
 * Configuración centralizada de Endpoints Multi-Nube (AWS API Gateway & Localhost)
 */

export const AWS_API_GATEWAY_URL = 'https://op6erfwwmh.execute-api.us-east-1.amazonaws.com/v1';

// Detectar si está en localhost o en la nube
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const getApiEndpoints = (targetMode = null) => {
  const savedMode = typeof localStorage !== 'undefined' ? localStorage.getItem('pedidos360_api_mode') : null;
  const mode = targetMode || savedMode || (isLocalhost ? 'local' : 'cloud');

  if (mode === 'local') {
    return {
      mode: 'local',
      label: 'Localhost (Docker / Spring Boot Directo)',
      catalogoStatus: 'http://localhost:8080/api/status',
      catalogoProductos: 'http://localhost:8080/api/productos',
      carritoStatus: 'http://localhost:8081/api/carrito/status',
      carritoPedidos: 'http://localhost:8081/api/carrito/pedidos',
      notificacionesStatus: 'http://localhost:8082/api/notificaciones/status',
      notificacionesEnviar: 'http://localhost:8082/api/notificaciones/enviar',
      auditoriaStatus: 'http://localhost:8083/api/auditoria/status',
      auditoriaEventos: 'http://localhost:8083/api/auditoria',
      auditoriaStats: 'http://localhost:8083/api/auditoria/stats',
      adminQueues: 'http://localhost:8084/api/admin/queues',
      adminExchanges: 'http://localhost:8084/api/admin/exchanges',
      adminBindings: 'http://localhost:8084/api/admin/bindings',
    };
  }

  // Cloud Mode: AWS HTTP API Gateway
  return {
    mode: 'cloud',
    label: 'AWS HTTP API Gateway (Perímetro Cloud)',
    catalogoStatus: `${AWS_API_GATEWAY_URL}/api/status`,
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
