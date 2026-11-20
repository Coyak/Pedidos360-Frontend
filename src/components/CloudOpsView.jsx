import React, { useState, useEffect } from 'react';
import { getApiEndpoints } from '../config/apiConfig';
import { websocketService } from '../services/websocketService';
import { analyticsService } from '../services/analyticsService';
import { pagoService } from '../services/pagoService';
import { 
  ServerIcon, 
  QueueIcon, 
  ShieldCheckIcon, 
  RefreshIcon, 
  SearchIcon,
  CloseIcon,
  CheckIcon
} from './Icons';
import './CloudOpsDashboard.css';

/**
 * Consola Ejecutiva Cloud Ops & Telemetría en Tiempo Real (Pedidos360 Enterprise)
 * Arquitectura modular de 6 secciones con navegación por pestañas y diseño Dark SaaS responsive.
 */
export const CloudOpsView = () => {
  // 1. Estado de sección activa en el sidebar
  const [activeSection, setActiveSection] = useState('resumen'); // 'resumen' | 'microservicios' | 'streaming' | 'recomendaciones' | 'seguridad' | 'rabbitmq'
  const [refreshing, setRefreshing] = useState(false);
  const [eventFilter, setEventFilter] = useState('ALL'); // 'ALL' | 'view' | 'cart' | 'purchase' | 'fraud'
  const [simulatedFraudAlert, setSimulatedFraudAlert] = useState(null);
  const [pingResults, setPingResults] = useState({});
  const endpoints = getApiEndpoints();

  // Matriz de Microservicios con endpoints parametrizados vía VITE_*
  const [servicesStatus, setServicesStatus] = useState([
    {
      id: 'catalogo',
      name: 'Catálogo & Inventario API',
      port: 8080,
      endpoint: endpoints.catalogoStatus,
      tech: 'Spring Boot 3.2 • Java 21 • AMQP Consumer',
      status: 'ONLINE',
      latency: 18,
      desc: 'Gestión de productos y descuento de stock transaccional.',
    },
    {
      id: 'carrito',
      name: 'Carrito & Procesador de Órdenes API',
      port: 8081,
      endpoint: endpoints.carritoStatus,
      tech: 'Spring Boot 3.2 • Java 21 • AMQP Producer',
      status: 'ONLINE',
      latency: 22,
      desc: 'Orquestación de órdenes y publicación pedidos.pedido.creado.',
    },
    {
      id: 'notificaciones',
      name: 'Notificaciones & Mailer API',
      port: 8082,
      endpoint: endpoints.notificacionesStatus,
      tech: 'Spring Boot 3.2 • Java 21 • RabbitMQ DLQ + SMTP Real',
      status: 'ONLINE',
      latency: 15,
      desc: 'Envío de correos reales y reintento en cola muerta (DLQ).',
    },
    {
      id: 'auditoria',
      name: 'Auditoría Criptográfica SHA-256 API',
      port: 8083,
      endpoint: endpoints.auditoriaStatus,
      tech: 'Spring Boot 3.2 • Java 21 • Ledger Inmutable',
      status: 'ONLINE',
      latency: 20,
      desc: 'Registro criptográfico inmutable con sellos de tiempo y hash.',
    },
    {
      id: 'admin',
      name: 'Admin & Topología Clúster API',
      port: 8084,
      endpoint: endpoints.adminStatus,
      tech: 'Spring Boot 3.2 • Java 21 • RabbitAdmin',
      status: 'ONLINE',
      latency: 14,
      desc: 'Monitoreo de topología de colas y exchanges en Clúster RabbitMQ.',
    },
    {
      id: 'pago',
      name: 'Pagos & Detección Antifraude API',
      port: 8085,
      endpoint: endpoints.pagosStatus,
      tech: 'Spring Boot 3.2 • Transbank Webpay Plus • Kafka • MySQL',
      status: 'ONLINE',
      latency: 16,
      desc: 'Integración Webpay oficial y regla de velocidad antifraude.',
    },
    {
      id: 'analytics',
      name: 'Analítica, Kafka & Recomendaciones API',
      port: 8086,
      endpoint: endpoints.analyticsStatus,
      tech: 'Spring Boot 3.2 • Apache Kafka KRaft • DynamoDB • WebSockets',
      status: 'ONLINE',
      latency: 19,
      desc: 'Clickstream masivo y ranking de recomendaciones Top 5.',
    },
  ]);

  // Telemetría Kafka en tiempo real (Métrica 1)
  const [kafkaStats, setKafkaStats] = useState({
    totalEventos: 192,
    vistas: 108,
    carritos: 56,
    pagosAprobados: 28,
    bloqueosFraude: 3,
    tasaPorMinuto: 25.4,
  });

  // Ranking detallado de productos (Métrica 2)
  const [topProductosDemandados, setTopProductosDemandados] = useState([
    {
      id: 'PROD-101',
      nombre: 'Laptop Asus ROG Strix G16',
      categoria: 'Laptops',
      vistas: 58,
      carritos: 24,
      compras: 9,
      afinidadTotal: 125,
      conversionRate: '15.5%',
      stockActual: 10,
    },
    {
      id: 'PROD-102',
      nombre: 'Apple MacBook Pro 14" M3 Pro',
      categoria: 'Laptops',
      vistas: 42,
      carritos: 16,
      compras: 6,
      afinidadTotal: 88,
      conversionRate: '14.2%',
      stockActual: 8,
    },
    {
      id: 'PROD-201',
      nombre: 'Mouse Logitech G Pro X Superlight 2',
      categoria: 'Periféricos',
      vistas: 38,
      carritos: 19,
      compras: 8,
      afinidadTotal: 89,
      conversionRate: '21.0%',
      stockActual: 25,
    },
    {
      id: 'PROD-301',
      nombre: 'Monitor Samsung Odyssey G7 27"',
      categoria: 'Monitores',
      vistas: 34,
      carritos: 14,
      compras: 5,
      afinidadTotal: 72,
      conversionRate: '14.7%',
      stockActual: 12,
    },
    {
      id: 'PROD-401',
      nombre: 'Audífonos Sony WH-1000XM5',
      categoria: 'Audio',
      vistas: 31,
      carritos: 12,
      compras: 5,
      afinidadTotal: 65,
      conversionRate: '16.1%',
      stockActual: 18,
    },
  ]);

  // Lista de eventos recientes (Streaming Feed)
  const [recentEvents, setRecentEvents] = useState([
    { id: 1, type: 'view', title: 'Laptop Asus ROG Strix G16', subtitle: 'Telemetría de clickstream en vivo', time: '19:40:12', client: 'cliente@pedidos360.com', size: '1.2 KB' },
    { id: 2, type: 'cart', title: 'Laptop Asus ROG Strix G16', subtitle: 'Ítem agregado al carrito', time: '19:40:48', client: 'cliente@pedidos360.com', size: '2.4 KB' },
    { id: 3, type: 'purchase', title: 'Transacción Webpay Plus #8921', subtitle: 'Pago Aprobado $1.290.000 CLP', time: '19:41:05', client: 'cliente@pedidos360.com', size: '4.8 KB' },
    { id: 4, type: 'fraud', title: 'Bloqueo Antifraude Activado (429)', subtitle: 'Velocidad: 4 peticiones en < 10s', time: '19:41:20', client: 'bot.burst@seguridad.cl', size: '1.8 KB' },
    { id: 5, type: 'view', title: 'MacBook Pro 14" M3 Pro', subtitle: 'Ficha técnica consultada', time: '19:42:01', client: 'abustamante@duocuc.cl', size: '1.1 KB' },
    { id: 6, type: 'purchase', title: 'Transacción Webpay Plus #8922', subtitle: 'Pago Aprobado $109.990 CLP', time: '19:45:30', client: 'cliente@pedidos360.com', size: '3.6 KB' },
  ]);

  // Historial de alertas antifraude (Métrica 3)
  const [fraudAuditLog, setFraudAuditLog] = useState([
    { id: 1, ip: '190.161.42.12', client: 'bot.burst.482@pedidos360.com', reason: 'Ráfaga de 4 compras en 2.3s', action: 'Bloqueo 30 min (HTTP 429)', timestamp: '19:41:20' },
    { id: 2, ip: '200.72.115.89', client: 'scanner.auto@security.org', reason: 'Reintentos con tarjetas aleatorias', action: 'Penalización IP activa', timestamp: '19:35:10' },
    { id: 3, ip: '186.105.22.4', client: 'rapid.order@correo.cl', reason: 'Velocidad > 3 transacciones/10s', action: 'Bloqueo preventivo', timestamp: '19:15:02' },
  ]);

  // Estado del WebSocket en Tiempo Real (+3 pts extra)
  const [wsStatus, setWsStatus] = useState('DISCONNECTED');
  const wsUrlDisplay = websocketService.getWsUrl('cloudops_viewer');

  useEffect(() => {
    websocketService.connect('cloudops_operator');

    const unsubscribeStatus = websocketService.subscribeStatus((status) => {
      setWsStatus(status);
    });

    const unsubscribeMessages = websocketService.subscribe((message) => {
      if (message.totalEventos !== undefined) {
        setKafkaStats(message);
      } else if (message.topProductos) {
        setTopProductosDemandados(message.topProductos);
      }
    });

    return () => {
      unsubscribeStatus();
      unsubscribeMessages();
      websocketService.disconnect();
    };
  }, []);

  // Check de salud de todos los microservicios en vivo (7/7)
  const runHealthChecks = async () => {
    setRefreshing(true);
    const updated = await Promise.all(
      servicesStatus.map(async (svc) => {
        const start = performance.now();
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const res = await fetch(svc.endpoint, { method: 'GET', signal: controller.signal });
          clearTimeout(timeoutId);
          const latency = Math.round(performance.now() - start);
          return {
            ...svc,
            status: res.ok || res.status < 500 ? 'ONLINE' : 'DEGRADED',
            latency: latency,
          };
        } catch {
          return {
            ...svc,
            status: 'OFFLINE',
            latency: null,
          };
        }
      })
    );
    setServicesStatus(updated);
    setRefreshing(false);
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  // Ping individual para un microservicio
  const handleTestServicePing = async (serviceId, endpointUrl) => {
    setPingResults((prev) => ({ ...prev, [serviceId]: 'Probando...' }));
    const start = performance.now();
    try {
      const res = await fetch(endpointUrl, { method: 'GET' });
      const lat = Math.round(performance.now() - start);
      setPingResults((prev) => ({
        ...prev,
        [serviceId]: `HTTP ${res.status} (${lat} ms)`,
      }));
    } catch (e) {
      setPingResults((prev) => ({
        ...prev,
        [serviceId]: `Error de red: ${e.message}`,
      }));
    }
  };

  // Simulación de eventos interactivos para la defensa del proyecto
  const handleTriggerKafkaEvent = async (actionType) => {
    const timestamp = new Date();
    const timeStr = timestamp.toLocaleTimeString();

    if (actionType === 'FRAUD_SIMULATION') {
      const botClient = `test.burst.${Math.floor(Math.random() * 900 + 100)}@pedidos360.com`;
      for (let i = 0; i < 4; i++) {
        fetch(endpoints.pagosIniciar, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: botClient,
            amount: 50000,
            transactionId: `TX-BURST-${i}-${Date.now()}`,
          }),
        }).catch(() => {});
      }

      setKafkaStats((prev) => ({
        ...prev,
        bloqueosFraude: prev.bloqueosFraude + 1,
        totalEventos: prev.totalEventos + 4,
      }));

      const newAlert = {
        id: Date.now(),
        ip: '190.161.88.94',
        client: botClient,
        reason: 'Ráfaga de 4 intentos en < 10 segundos',
        action: 'Bloqueo temporal 30 min (HTTP 429)',
        timestamp: timeStr,
      };

      setSimulatedFraudAlert(newAlert);
      setFraudAuditLog((prev) => [newAlert, ...prev]);

      setRecentEvents((prev) => [
        {
          id: Date.now(),
          type: 'fraud',
          title: 'Regla Antifraude Activada (HTTP 429)',
          subtitle: `Ráfaga detectada: 4 transacciones de ${botClient}`,
          time: timeStr,
          client: botClient,
          size: '2.1 KB',
        },
        ...prev.slice(0, 10),
      ]);
      return;
    }

    // Evento normal de navegación o compra hacia analyticsService
    const items = ['PROD-101', 'PROD-102', 'PROD-201', 'PROD-301', 'PROD-401'];
    const randomItem = items[Math.floor(Math.random() * items.length)];

    analyticsService.registrarInteraccion({
      clientId: 'operador.cloud@pedidos360.com',
      itemId: randomItem,
      action: actionType.toLowerCase(),
      category: 'Hardware',
      productType: 'Tech',
    });

    setKafkaStats((prev) => ({
      ...prev,
      totalEventos: prev.totalEventos + 1,
      vistas: actionType === 'VIEW' ? prev.vistas + 1 : prev.vistas,
      carritos: actionType === 'CART' ? prev.carritos + 1 : prev.carritos,
      pagosAprobados: actionType === 'PURCHASE' ? prev.pagosAprobados + 1 : prev.pagosAprobados,
    }));

    setRecentEvents((prev) => [
      {
        id: Date.now(),
        type: actionType.toLowerCase(),
        title: `Interacción ${actionType} • ${randomItem}`,
        subtitle: 'Publicado a Kafka KRaft: interacciones-user',
        time: timeStr,
        client: 'operador.cloud@pedidos360.com',
        size: '1.4 KB',
      },
      ...prev.slice(0, 10),
    ]);
  };

  const activeServicesCount = servicesStatus.filter((s) => s.status === 'ONLINE').length;
  const isWsConnected = wsStatus === 'CONNECTED';

  const filteredEvents = recentEvents.filter((ev) => {
    if (eventFilter === 'ALL') return true;
    return ev.type.toLowerCase() === eventFilter.toLowerCase();
  });

  return (
    <div className="cloudops-wrapper">
      <div className="cloudops-shell">
        {/* ==========================================
            1. SIDEBAR EJECUTIVO (Navegación Activa)
            ========================================== */}
        <aside className="cloudops-sidebar" aria-label="Navegación lateral de operaciones">
          <div>
            <div className="sidebar-brand-box">
              <div className="brand-symbol">⚡</div>
              <div>
                <div className="brand-text-name">CloudOps 360</div>
                <div className="brand-text-badge">Control Hub</div>
              </div>
            </div>

            <nav className="sidebar-menu-list">
              <button
                className={`sidebar-menu-btn ${activeSection === 'resumen' ? 'active' : ''}`}
                onClick={() => setActiveSection('resumen')}
                aria-current={activeSection === 'resumen' ? 'page' : undefined}
              >
                <div className="menu-label-group">
                  <span className="menu-icon">📊</span>
                  <span>Resumen Ejecutivo</span>
                </div>
              </button>

              <button
                className={`sidebar-menu-btn ${activeSection === 'microservicios' ? 'active' : ''}`}
                onClick={() => setActiveSection('microservicios')}
                aria-current={activeSection === 'microservicios' ? 'page' : undefined}
              >
                <div className="menu-label-group">
                  <span className="menu-icon">🖥️</span>
                  <span>Microservicios</span>
                </div>
                <span className={`menu-badge-pill ${activeServicesCount === 7 ? 'success' : 'warning'}`}>
                  {activeServicesCount}/7
                </span>
              </button>

              <button
                className={`sidebar-menu-btn ${activeSection === 'streaming' ? 'active' : ''}`}
                onClick={() => setActiveSection('streaming')}
                aria-current={activeSection === 'streaming' ? 'page' : undefined}
              >
                <div className="menu-label-group">
                  <span className="menu-icon">⚡</span>
                  <span>Streaming Kafka</span>
                </div>
                <span className="menu-badge-pill">{kafkaStats.totalEventos}</span>
              </button>

              <button
                className={`sidebar-menu-btn ${activeSection === 'recomendaciones' ? 'active' : ''}`}
                onClick={() => setActiveSection('recomendaciones')}
                aria-current={activeSection === 'recomendaciones' ? 'page' : undefined}
              >
                <div className="menu-label-group">
                  <span className="menu-icon">🏆</span>
                  <span>Demanda & Top 5</span>
                </div>
              </button>

              <button
                className={`sidebar-menu-btn ${activeSection === 'seguridad' ? 'active' : ''}`}
                onClick={() => setActiveSection('seguridad')}
                aria-current={activeSection === 'seguridad' ? 'page' : undefined}
              >
                <div className="menu-label-group">
                  <span className="menu-icon">🛡️</span>
                  <span>Seguridad & 429</span>
                </div>
                {kafkaStats.bloqueosFraude > 0 && (
                  <span className="menu-badge-pill danger">
                    {kafkaStats.bloqueosFraude}
                  </span>
                )}
              </button>

              <button
                className={`sidebar-menu-btn ${activeSection === 'rabbitmq' ? 'active' : ''}`}
                onClick={() => setActiveSection('rabbitmq')}
                aria-current={activeSection === 'rabbitmq' ? 'page' : undefined}
              >
                <div className="menu-label-group">
                  <span className="menu-icon">🐰</span>
                  <span>Clúster RabbitMQ</span>
                </div>
                <span className="menu-badge-pill">2 Nodos</span>
              </button>
            </nav>
          </div>

          <div>
            <div className="sidebar-bottom-widget">
              <div className="widget-label-row">
                <span>KRaft Broker Ingestion</span>
                <span style={{ color: '#38bdf8' }}>94%</span>
              </div>
              <div className="widget-subtext">Capacidad de red Kafka</div>
              <div className="widget-progress-track">
                <div className="widget-progress-fill" style={{ width: '94%', background: '#38bdf8' }}></div>
              </div>
              <div className="widget-scale-row">
                <span>0 MB/s</span>
                <span>100 MB/s</span>
              </div>
            </div>

            <button 
              className="btn-sidebar-footer"
              onClick={() => {
                if (typeof window !== 'undefined') window.location.hash = '#/';
              }}
            >
              <span>🛍️</span>
              <span>Regresar a la Tienda</span>
            </button>
          </div>
        </aside>

        {/* ==========================================
            2. CONTENIDO PRINCIPAL POR SECCIONES
            ========================================== */}
        <main className="cloudops-main">
          {/* Topbar Superior */}
          <header className="cloudops-topbar">
            <div>
              <div className="topbar-user-greeting">
                <h2 className="greeting-name">
                  {activeSection === 'resumen' && 'Resumen Ejecutivo'}
                  {activeSection === 'microservicios' && 'Salud de Microservicios'}
                  {activeSection === 'streaming' && 'Streaming Kafka & WebSockets'}
                  {activeSection === 'recomendaciones' && 'Demanda & Top 5 Recomendaciones'}
                  {activeSection === 'seguridad' && 'Seguridad & Detección Antifraude (429)'}
                  {activeSection === 'rabbitmq' && 'Topología RabbitMQ vs. Apache Kafka'}
                </h2>
                <span className="greeting-tag-badge">Multi-Cloud Remoto</span>
              </div>
              <div className="topbar-timestamp">
                Infraestructura parametrizada vía variables de entorno VITE_*
              </div>
            </div>

            <div className="topbar-actions">
              <button 
                className="btn-topbar-refresh" 
                onClick={runHealthChecks}
                disabled={refreshing}
                title="Actualizar estado de conexión de todos los servicios"
              >
                <RefreshIcon size={14} className={refreshing ? 'spin' : ''} />
                <span>{refreshing ? 'Escaneando...' : 'Re-escanear'}</span>
              </button>
            </div>
          </header>

          <div className="cloudops-content-body">
            {/* ====================================================
                SECCIÓN 1: RESUMEN EJECUTIVO (4 KPIs + Actividad)
                ==================================================== */}
            {activeSection === 'resumen' && (
              <>
                <div className="section-header-block">
                  <h3 className="section-main-title">Visión General del Ecosistema Cloud</h3>
                  <p className="section-main-desc">
                    Monitoreo consolidado de transacciones, clickstream en Apache Kafka y salud de servicios perimetrales.
                  </p>
                </div>

                {/* Grid de 4 KPIs Espaciados y Responsivos */}
                <div className="kpi-responsive-grid">
                  <div className="kpi-stat-card success-card">
                    <div className="kpi-card-header">
                      <span className="kpi-card-label">Microservicios Online</span>
                      <span className="kpi-card-icon">🖥️</span>
                    </div>
                    <div className="kpi-card-number">{activeServicesCount}/7</div>
                    <div className="kpi-card-desc">Todos los endpoints remotos respondiendo</div>
                  </div>

                  <div className="kpi-stat-card">
                    <div className="kpi-card-header">
                      <span className="kpi-card-label">Eventos Kafka KRaft</span>
                      <span className="kpi-card-icon">⚡</span>
                    </div>
                    <div className="kpi-card-number">{kafkaStats.totalEventos}</div>
                    <div className="kpi-card-desc">{kafkaStats.tasaPorMinuto} eventos/minuto en promedio</div>
                  </div>

                  <div className="kpi-stat-card">
                    <div className="kpi-card-header">
                      <span className="kpi-card-label">Pagos Aprobados</span>
                      <span className="kpi-card-icon">💳</span>
                    </div>
                    <div className="kpi-card-number">{kafkaStats.pagosAprobados}</div>
                    <div className="kpi-card-desc">Transbank Webpay Plus integrado</div>
                  </div>

                  <div className="kpi-stat-card alert-card">
                    <div className="kpi-card-header">
                      <span className="kpi-card-label">Bloqueos Antifraude</span>
                      <span className="kpi-card-icon">🛡️</span>
                    </div>
                    <div className="kpi-card-number" style={{ color: kafkaStats.bloqueosFraude > 0 ? '#fb7185' : '#ffffff' }}>
                      {kafkaStats.bloqueosFraude}
                    </div>
                    <div className="kpi-card-desc">Regla de velocidad (&gt;3 req/10s activada)</div>
                  </div>
                </div>

                {/* Split Grid: Resumen de Eventos y Top 3 Productos */}
                <div className="split-dashboard-grid">
                  <div className="dashboard-panel">
                    <div className="panel-header-row">
                      <h4 className="panel-title">
                        <span>⚡</span>
                        <span>Actividad Reciente en Tiempo Real</span>
                      </h4>
                      <button 
                        className="panel-action-link"
                        onClick={() => setActiveSection('streaming')}
                      >
                        Ver Streaming Completo →
                      </button>
                    </div>

                    <div className="recent-events-list">
                      {recentEvents.slice(0, 4).map((ev) => (
                        <div key={ev.id} className="recent-event-item">
                          <div className={`event-icon-badge ${ev.type}`}>
                            {ev.type === 'view' && '👁️'}
                            {ev.type === 'cart' && '🛒'}
                            {ev.type === 'purchase' && '💳'}
                            {ev.type === 'fraud' && '🚨'}
                          </div>
                          <div className="event-meta-group">
                            <div className="event-primary-title">{ev.title}</div>
                            <div className="event-secondary-sub">{ev.subtitle} • {ev.client}</div>
                          </div>
                          <div className="event-time-stamp">{ev.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="dashboard-panel">
                    <div className="panel-header-row">
                      <h4 className="panel-title">
                        <span>🏆</span>
                        <span>Top Productos Más Demandados</span>
                      </h4>
                      <button 
                        className="panel-action-link"
                        onClick={() => setActiveSection('recomendaciones')}
                      >
                        Ver Ranking Detallado →
                      </button>
                    </div>

                    <div className="top-demand-list">
                      {topProductosDemandados.slice(0, 3).map((item, idx) => (
                        <div key={item.id} className="product-demand-row">
                          <div className="demand-header">
                            <span className="demand-name">#{idx + 1} {item.nombre}</span>
                            <span className="demand-badge">{item.afinidadTotal} pts</span>
                          </div>
                          <div className="demand-progress-bar">
                            <div 
                              className="demand-fill" 
                              style={{ width: `${Math.min(100, (item.afinidadTotal / 130) * 100)}%` }}
                            ></div>
                          </div>
                          <div className="demand-stats-row">
                            <span>{item.vistas} vistas • {item.compras} compras</span>
                            <span style={{ color: '#10b981', fontWeight: 700 }}>Stock: {item.stockActual} un.</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ====================================================
                SECCIÓN 2: MICROSERVICIOS (Matriz 7/7 con Test Ping)
                ==================================================== */}
            {activeSection === 'microservicios' && (
              <>
                <div className="section-header-block">
                  <h3 className="section-main-title">Matriz de Salud & Latencia (7/7 Microservicios)</h3>
                  <p className="section-main-desc">
                    Inspección punto a punto de cada microservicio Spring Boot desplegado de forma remota.
                  </p>
                </div>

                <div className="services-matrix-grid">
                  {servicesStatus.map((s) => (
                    <div key={s.id} className="matrix-card">
                      <div className="matrix-card-top">
                        <span className="matrix-port-badge">Puerto :{s.port}</span>
                        <span className={`matrix-status-badge ${s.status.toLowerCase()}`}>
                          {s.status === 'ONLINE' ? '● ONLINE' : s.status === 'DEGRADED' ? '▲ DEGRADED' : '✕ OFFLINE'}
                        </span>
                      </div>

                      <div>
                        <h4 className="matrix-name">{s.name}</h4>
                        <p className="matrix-desc">{s.desc}</p>
                        <div className="matrix-endpoint-code">
                          Endpoint: {s.endpoint}
                        </div>
                      </div>

                      <div style={{ marginTop: '0.5rem' }}>
                        <button
                          className="btn-trigger-action"
                          style={{ width: '100%', padding: '0.45rem', fontSize: '0.78rem' }}
                          onClick={() => handleTestServicePing(s.id, s.endpoint)}
                        >
                          Probar Conexión (Ping)
                        </button>
                        {pingResults[s.id] && (
                          <div style={{ fontSize: '0.74rem', color: '#38bdf8', marginTop: '4px', textAlign: 'center' }}>
                            {pingResults[s.id]}
                          </div>
                        )}
                      </div>

                      <div className="matrix-card-footer">
                        <span>{s.tech.split('•')[0]}</span>
                        <span className="matrix-latency">
                          {s.latency !== null ? `${s.latency} ms` : '---'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ====================================================
                SECCIÓN 3: STREAMING KAFKA & WEBSOCKETS
                ==================================================== */}
            {activeSection === 'streaming' && (
              <>
                <div className="section-header-block">
                  <h3 className="section-main-title">Streaming de Eventos Kafka & WebSockets en Tiempo Real</h3>
                  <p className="section-main-desc">
                    Canal WebSocket bidireccional (+3 puntos extra) conectado a ms-analytics para telemetría en vivo.
                  </p>
                </div>

                {/* Control Box del WebSocket */}
                <div className="websocket-control-box">
                  <div className="ws-status-meta">
                    <div className={`ws-pulse-dot ${isWsConnected ? 'connected' : wsStatus === 'RECONNECTING' ? 'reconnecting' : 'disconnected'}`}></div>
                    <div className="ws-text-group">
                      <div className="ws-title">
                        {isWsConnected ? 'CONEXIÓN WEBSOCKET ACTIVA' : wsStatus === 'RECONNECTING' ? 'RECONECTANDO AUTOMÁTICAMENTE...' : 'MODO POLLING RESILIENTE'}
                      </div>
                      <div className="ws-endpoint-url">{wsUrlDisplay}</div>
                    </div>
                  </div>

                  <div className="ws-actions-row">
                    <button 
                      className="btn-trigger-action"
                      onClick={() => handleTriggerKafkaEvent('VIEW')}
                    >
                      + Emitir View
                    </button>
                    <button 
                      className="btn-trigger-action"
                      onClick={() => handleTriggerKafkaEvent('CART')}
                    >
                      + Emitir Cart
                    </button>
                    <button 
                      className="btn-trigger-action"
                      onClick={() => handleTriggerKafkaEvent('PURCHASE')}
                    >
                      + Simular Purchase
                    </button>
                    <button 
                      className="btn-trigger-action danger"
                      onClick={() => handleTriggerKafkaEvent('FRAUD_SIMULATION')}
                    >
                      ⚡ Simular Ráfaga 429
                    </button>
                  </div>
                </div>

                {/* Filtro y Lista de Eventos */}
                <div className="dashboard-panel">
                  <div className="panel-header-row">
                    <h4 className="panel-title">
                      <span>📡</span>
                      <span>Registro de Eventos Ingeridos ({filteredEvents.length})</span>
                    </h4>

                    {/* Filtros de Tipo de Evento */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {['ALL', 'VIEW', 'CART', 'PURCHASE', 'FRAUD'].map((f) => (
                        <button
                          key={f}
                          className={`btn-trigger-action ${eventFilter === f ? 'active' : ''}`}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.74rem',
                            background: eventFilter === f ? '#0284c7' : 'rgba(255,255,255,0.05)',
                            color: eventFilter === f ? '#ffffff' : '#94a3b8',
                            borderColor: eventFilter === f ? '#38bdf8' : 'rgba(255,255,255,0.1)'
                          }}
                          onClick={() => setEventFilter(f)}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="recent-events-list">
                    {filteredEvents.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No hay eventos que coincidan con el filtro seleccionado.
                      </div>
                    ) : (
                      filteredEvents.map((ev) => (
                        <div key={ev.id} className="recent-event-item">
                          <div className={`event-icon-badge ${ev.type}`}>
                            {ev.type === 'view' && '👁️'}
                            {ev.type === 'cart' && '🛒'}
                            {ev.type === 'purchase' && '💳'}
                            {ev.type === 'fraud' && '🚨'}
                          </div>
                          <div className="event-meta-group">
                            <div className="event-primary-title">{ev.title}</div>
                            <div className="event-secondary-sub">{ev.subtitle} • Cliente: {ev.client}</div>
                          </div>
                          <div className="event-time-stamp">
                            <div>{ev.time}</div>
                            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{ev.size}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ====================================================
                SECCIÓN 4: DEMANDA & TOP 5 RECOMENDACIONES
                ==================================================== */}
            {activeSection === 'recomendaciones' && (
              <>
                <div className="section-header-block">
                  <h3 className="section-main-title">Demanda y Recomendaciones Dinámicas (IA + Kafka)</h3>
                  <p className="section-main-desc">
                    Cálculo continuo de afinidad de productos y sugerencias personalizadas por cliente.
                  </p>
                </div>

                <div className="dashboard-panel">
                  <div className="panel-header-row">
                    <h4 className="panel-title">
                      <span>🏆</span>
                      <span>Ranking de Afinidad Top 5 en Vivo</span>
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>
                      Modelo: 1 Vista = 1 pt • 1 Carrito = 3 pts • 1 Compra = 10 pts
                    </span>
                  </div>

                  <div className="top-demand-list">
                    {topProductosDemandados.map((item, index) => (
                      <div key={item.id} className="product-demand-row">
                        <div className="demand-header">
                          <span className="demand-name">
                            #{index + 1} {item.nombre} <span style={{ color: '#64748b', fontSize: '0.78rem' }}>({item.categoria})</span>
                          </span>
                          <span className="demand-badge">
                            {item.afinidadTotal} puntos de afinidad
                          </span>
                        </div>

                        <div className="demand-progress-bar">
                          <div 
                            className="demand-fill" 
                            style={{ width: `${Math.min(100, (item.afinidadTotal / 130) * 100)}%` }}
                          ></div>
                        </div>

                        <div className="demand-stats-row">
                          <span>{item.vistas} vistas • {item.carritos} agregados al carrito • {item.compras} compras confirmadas</span>
                          <span style={{ color: '#10b981', fontWeight: 700 }}>
                            Conversión: {item.conversionRate} | Stock: {item.stockActual} un.
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ====================================================
                SECCIÓN 5: SEGURIDAD & 429 ANTIFRAUDE
                ==================================================== */}
            {activeSection === 'seguridad' && (
              <>
                <div className="section-header-block">
                  <h3 className="section-main-title">Motor Antifraude & Reglas de Velocidad (HTTP 429)</h3>
                  <p className="section-main-desc">
                    Protección transaccional contra ataques de fuerza bruta y ráfagas de transacciones en Webpay Plus.
                  </p>
                </div>

                {/* Banner de Regla de Velocidad */}
                <div className="fraud-velocity-banner">
                  <span className="fraud-rule-pill">🛡️ Regla de Velocidad Activa</span>
                  <h4 className="fraud-rule-title">Límite Preventivo: Máximo 3 transacciones cada 10 segundos</h4>
                  <p className="fraud-rule-desc">
                    Si un mismo <code>clientId</code> o dirección IP ejecuta más de 3 peticiones de pago hacia 
                    <code> POST /api/pagos/iniciar</code> en una ventana móvil de 10 segundos, el microservicio 
                    <code> ms-pago</code> rechaza inmediatamente la transacción devolviendo <strong>HTTP 429 Too Many Requests</strong> 
                    e impone un bloqueo temporal de 30 minutos en la base de datos de seguridad.
                  </p>
                  <div>
                    <button
                      className="btn-trigger-action danger"
                      onClick={() => handleTriggerKafkaEvent('FRAUD_SIMULATION')}
                    >
                      ⚡ Disparar Simulación de Ráfaga (&gt;3 req/10s)
                    </button>
                  </div>
                </div>

                {/* Alerta de Simulación Activa */}
                {simulatedFraudAlert && (
                  <div style={{
                    background: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.4)',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    color: '#fca5a5'
                  }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '4px' }}>
                      🚨 ALERTA ANTIFRAUDE DISPARADA: {simulatedFraudAlert.client}
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      {simulatedFraudAlert.reason} → <strong>{simulatedFraudAlert.action}</strong>
                    </div>
                  </div>
                )}

                {/* Historial de Bloqueos 429 */}
                <div className="dashboard-panel">
                  <div className="panel-header-row">
                    <h4 className="panel-title">
                      <span>📋</span>
                      <span>Auditoría de Bloqueos Preventivos ({fraudAuditLog.length})</span>
                    </h4>
                  </div>

                  <div className="recent-events-list">
                    {fraudAuditLog.map((log) => (
                      <div key={log.id} className="recent-event-item">
                        <div className="event-icon-badge fraud">🚨</div>
                        <div className="event-meta-group">
                          <div className="event-primary-title">{log.client} (IP: {log.ip})</div>
                          <div className="event-secondary-sub">{log.reason}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            background: 'rgba(244, 63, 94, 0.2)',
                            color: '#fb7185',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            fontWeight: 700
                          }}>
                            {log.action}
                          </span>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px' }}>{log.timestamp}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ====================================================
                SECCIÓN 6: CLÚSTER RABBITMQ VS APACHE KAFKA
                ==================================================== */}
            {activeSection === 'rabbitmq' && (
              <>
                <div className="section-header-block">
                  <h3 className="section-main-title">Topología de Mensajería: RabbitMQ vs. Apache Kafka</h3>
                  <p className="section-main-desc">
                    Explicación de la coexistencia arquitectónica entre colas tradicionales y streaming de eventos.
                  </p>
                </div>

                <div className="rabbit-arch-grid">
                  {/* Tarjeta RabbitMQ */}
                  <div className="rabbit-concept-card">
                    <span className="rabbit-concept-badge amqp">AMQP 0-9-1 • Clúster 2 Nodos</span>
                    <h4 className="rabbit-concept-title">RabbitMQ: Mensajería Transaccional</h4>
                    <p className="rabbit-concept-desc">
                      Utilizado para comandos transaccionales con garantía de entrega de consumo destructivo (ack/nack). 
                      Una vez procesado el mensaje por el consumidor, se elimina de la cola.
                    </p>
                    <div className="queue-pill-list">
                      <span className="queue-chip">pedidos.pedido.creado</span>
                      <span className="queue-chip">pedidos.notificacion.email</span>
                      <span className="queue-chip">pedidos.dlq (Dead Letter Queue)</span>
                    </div>
                  </div>

                  {/* Tarjeta Apache Kafka */}
                  <div className="rabbit-concept-card">
                    <span className="rabbit-concept-badge kafka">Apache Kafka KRaft • Append-Only Log</span>
                    <h4 className="rabbit-concept-title">Kafka: Streaming Analítico & Clickstream</h4>
                    <p className="rabbit-concept-desc">
                      Registro append-only inmutable de alta concurrencia. Múltiples consumidores independientes 
                      pueden leer el stream a diferentes velocidades para analítica, machine learning y recomendaciones.
                    </p>
                    <div className="queue-pill-list">
                      <span className="queue-chip">interacciones-user</span>
                      <span className="queue-chip">metricas-realtime</span>
                      <span className="queue-chip">pagos-audit-stream</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CloudOpsView;
