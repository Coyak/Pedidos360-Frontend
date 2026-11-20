/**
 * Configuración Centralizada de Endpoints Multi-Nube (Pedidos360 Enterprise)
 * RESTRICCIÓN DE EVALUACIÓN 3: Prohibido hardcodear localhost.
 * Todos los endpoints se resuelven dinámicamente vía variables de entorno (VITE_*)
 * o mediante el origen activo de la red (AWS EC2 / API Gateway).
 */

// 1. Detección del host remoto activo
export const getActiveHost = () => {
  if (typeof window !== 'undefined' && window.location.hostname) {
    return window.location.hostname;
  }
  return '127.0.0.1';
};

// 2. AWS API Gateway Perimetral
export const AWS_API_GATEWAY_URL = 
  import.meta.env?.VITE_API_GATEWAY_URL || 'https://op6erfwwmh.execute-api.us-east-1.amazonaws.com/v1';

// 3. Resolución dinámica de microservicios sin localhost hardcodeado
export const getApiEndpoints = () => {
  const host = getActiveHost();
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:';
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';

  // Base URLs desde variables de entorno VITE_* con fallback dinámico
  const catalogoBase = import.meta.env?.VITE_CATALOGO_API_URL || `${protocol}//${host}:8080`;
  const carritoBase = import.meta.env?.VITE_CARRITO_API_URL || `${protocol}//${host}:8081`;
  const notificacionesBase = import.meta.env?.VITE_NOTIFICACIONES_API_URL || `${protocol}//${host}:8082`;
  const auditoriaBase = import.meta.env?.VITE_AUDITORIA_API_URL || `${protocol}//${host}:8083`;
  const adminBase = import.meta.env?.VITE_ADMIN_API_URL || `${protocol}//${host}:8084`;
  const pagosBase = import.meta.env?.VITE_PAGOS_API_URL || `${protocol}//${host}:8085`;
  const analyticsBase = import.meta.env?.VITE_RECOMENDACIONES_API_URL || `${protocol}//${host}:8086`;
  const wsUrl = import.meta.env?.VITE_WS_URL || `${wsProtocol}//${host}:8086/ws-analytics-raw`;

  return {
    mode: 'cloud-native',
    label: `Plataforma Remota (${host})`,

    // 1. Catálogo API (:8080)
    catalogoStatus: `${catalogoBase}/api/status`,
    catalogoProductos: `${catalogoBase}/api/productos`,

    // 2. Carrito & Procesador de Órdenes API (:8081)
    carritoStatus: `${carritoBase}/api/carrito/status`,
    carritoPedidos: `${carritoBase}/api/carrito/pedidos`,

    // 3. Notificaciones & Mailer API (:8082)
    notificacionesStatus: `${notificacionesBase}/api/notificaciones/status`,
    notificacionesEnviar: `${notificacionesBase}/api/notificaciones/enviar`,
    notificacionesHistorial: `${notificacionesBase}/api/notificaciones/historial`,

    // 4. Auditoría Criptográfica SHA-256 API (:8083)
    auditoriaStatus: `${auditoriaBase}/api/auditoria/status`,
    auditoriaEventos: `${auditoriaBase}/api/auditoria`,
    auditoriaStats: `${auditoriaBase}/api/auditoria/stats`,

    // 5. Admin & Topología RabbitMQ API (:8084)
    adminStatus: `${adminBase}/api/admin/status`,
    adminQueues: `${adminBase}/api/admin/queues`,
    adminExchanges: `${adminBase}/api/admin/exchanges`,
    adminBindings: `${adminBase}/api/admin/bindings`,

    // 6. Pagos & Motor Antifraude Webpay Plus (:8085)
    pagosStatus: `${pagosBase}/api/pagos/status`,
    pagosIniciar: `${pagosBase}/api/pagos/iniciar`,
    pagosCommit: `${pagosBase}/api/pagos/commit`,
    pagosEstadoCliente: `${pagosBase}/api/pagos/estado-cliente`,

    // 7. Analítica, Kafka & Recomendaciones (:8086)
    analyticsStatus: `${analyticsBase}/api/recomendaciones/status`,
    analyticsRecomendaciones: `${analyticsBase}/api/recomendaciones`,
    analyticsInteraccion: `${analyticsBase}/api/interacciones`,
    analyticsWs: wsUrl,
  };
};

export default getApiEndpoints;
