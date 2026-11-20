/**
 * Configuración centralizada de Endpoints Multi-Nube (Pedidos360)
 * Comunicación directa punto a punto con los microservicios en puertos 8080..8086.
 * Sin proxies inversos ni redirecciones rotas.
 */

export const AWS_API_GATEWAY_URL = 'https://op6erfwwmh.execute-api.us-east-1.amazonaws.com/v1';

// Detectar hostname dinámico (localhost o IP de AWS EC2)
export const getBaseHost = () => {
  if (typeof window !== 'undefined' && window.location.hostname) {
    return window.location.hostname;
  }
  return 'localhost';
};

export const getApiEndpoints = () => {
  const host = getBaseHost();

  // Limpiar cualquier residuo de modos obsoletos de evaluaciones anteriores
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('pedidos360_api_mode');
  }

  return {
    mode: 'direct',
    label: `Servidores Cloud Native (http://${host}:8080..8086)`,
    
    // 1. Catálogo API (:8080)
    catalogoStatus: `http://${host}:8080/api/status`,
    catalogoProductos: `http://${host}:8080/api/productos`,
    
    // 2. Carrito & Órdenes API (:8081)
    carritoStatus: `http://${host}:8081/api/carrito/status`,
    carritoPedidos: `http://${host}:8081/api/carrito/pedidos`,
    
    // 3. Notificaciones & Mailer API (:8082)
    notificacionesStatus: `http://${host}:8082/api/notificaciones/status`,
    notificacionesEnviar: `http://${host}:8082/api/notificaciones/enviar`,
    notificacionesHistorial: `http://${host}:8082/api/notificaciones/historial`,
    
    // 4. Auditoría Criptográfica SHA-256 API (:8083)
    auditoriaStatus: `http://${host}:8083/api/auditoria/status`,
    auditoriaEventos: `http://${host}:8083/api/auditoria`,
    auditoriaStats: `http://${host}:8083/api/auditoria/stats`,
    
    // 5. Admin & Topología RabbitMQ API (:8084)
    adminStatus: `http://${host}:8084/api/admin/status`,
    adminQueues: `http://${host}:8084/api/admin/queues`,
    adminExchanges: `http://${host}:8084/api/admin/exchanges`,
    adminBindings: `http://${host}:8084/api/admin/bindings`,
    
    // 6. Pagos & Motor Antifraude Webpay Plus (:8085)
    pagosStatus: `http://${host}:8085/api/pagos/status`,
    pagosIniciar: `http://${host}:8085/api/pagos/iniciar`,
    pagosCommit: `http://${host}:8085/api/pagos/commit`,
    pagosEstadoCliente: `http://${host}:8085/api/pagos/estado-cliente`,
    
    // 7. Analítica, Kafka & Recomendaciones (:8086)
    analyticsStatus: `http://${host}:8086/api/recomendaciones/status`,
    analyticsRecomendaciones: `http://${host}:8086/api/recomendaciones`,
    analyticsInteraccion: `http://${host}:8086/api/recomendaciones/interaccion`,
    analyticsWs: `ws://${host}:8086/ws-analytics-raw`,
    analyticsWsSockJs: `http://${host}:8086/ws-analytics`,
  };
};

export const setApiMode = () => {};
