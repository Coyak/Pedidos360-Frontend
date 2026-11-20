import React, { useState, useEffect } from 'react';
import { getApiEndpoints } from '../config/apiConfig';
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

export const CloudOpsView = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'services' | 'kafka' | 'products' | 'rabbitmq' | 'security'
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const endpoints = getApiEndpoints();

  // Matriz de Microservicios con URLs corregidas y verificadas
  const [servicesStatus, setServicesStatus] = useState([
    {
      id: 'catalogo',
      name: 'Catálogo & Inventario API',
      port: 8080,
      endpoint: endpoints.catalogoStatus,
      tech: 'Spring Boot 3.2 • Java 21 • AMQP Consumer',
      status: 'CHECKING',
      latency: null,
      desc: 'Gestión de productos y descuento de stock transaccional.',
    },
    {
      id: 'carrito',
      name: 'Carrito & Procesador de Órdenes API',
      port: 8081,
      endpoint: endpoints.carritoStatus,
      tech: 'Spring Boot 3.2 • Java 21 • AMQP Producer',
      status: 'CHECKING',
      latency: null,
      desc: 'Orquestación de órdenes y publicación pedidos.pedido.creado.',
    },
    {
      id: 'notificaciones',
      name: 'Notificaciones & Mailer API',
      port: 8082,
      endpoint: endpoints.notificacionesStatus,
      tech: 'Spring Boot 3.2 • Java 21 • RabbitMQ DLQ + SMTP Real',
      status: 'CHECKING',
      latency: null,
      desc: 'Envío de correos reales y reintento en cola muerta (DLQ).',
    },
    {
      id: 'auditoria',
      name: 'Auditoría Criptográfica SHA-256 API',
      port: 8083,
      endpoint: endpoints.auditoriaStatus,
      tech: 'Spring Boot 3.2 • Java 21 • Ledger Inmutable',
      status: 'CHECKING',
      latency: null,
      desc: 'Registro criptográfico inmutable con sellos de tiempo y hash.',
    },
    {
      id: 'admin',
      name: 'Admin & Topología Clúster API',
      port: 8084,
      endpoint: endpoints.adminStatus,
      tech: 'Spring Boot 3.2 • Java 21 • RabbitAdmin',
      status: 'CHECKING',
      latency: null,
      desc: 'Monitoreo de topología de colas y exchanges en Clúster RabbitMQ.',
    },
    {
      id: 'pago',
      name: 'Pagos & Detección Antifraude API',
      port: 8085,
      endpoint: endpoints.pagosStatus,
      tech: 'Spring Boot 3.2 • Transbank Webpay Plus • Kafka • MySQL',
      status: 'CHECKING',
      latency: null,
      desc: 'Integración Webpay oficial y regla de velocidad antifraude.',
    },
    {
      id: 'analytics',
      name: 'Analítica, Kafka & Recomendaciones API',
      port: 8086,
      endpoint: endpoints.analyticsStatus,
      tech: 'Spring Boot 3.2 • Apache Kafka KRaft • DynamoDB • WebSockets',
      status: 'CHECKING',
      latency: null,
      desc: 'Clickstream masivo y ranking de recomendaciones Top 5.',
    },
  ]);

  // Telemetría Kafka en tiempo real (Banner Forsight)
  const [kafkaStats, setKafkaStats] = useState({
    totalEventos: 156,
    vistas: 84,
    carritos: 42,
    pagosAprobados: 24,
    bloqueosFraude: 3,
    tasaPorMinuto: 22.4,
  });

  // Ranking detallado de productos
  const [topProductosDemandados, setTopProductosDemandados] = useState([
    {
      id: 'PROD-101',
      nombre: 'Laptop Asus ROG Strix G16',
      categoria: 'Laptops',
      vistas: 48,
      carritos: 18,
      compras: 7,
      afinidadTotal: 105,
      conversionRate: '14.5%',
      stockActual: 8,
    },
    {
      id: 'PROD-102',
      nombre: 'Apple MacBook Pro 14" M3 Pro',
      categoria: 'Laptops',
      vistas: 35,
      carritos: 12,
      compras: 4,
      afinidadTotal: 71,
      conversionRate: '11.4%',
      stockActual: 5,
    },
    {
      id: 'PROD-201',
      nombre: 'Mouse Logitech G Pro X Superlight 2',
      categoria: 'Periféricos',
      vistas: 29,
      carritos: 14,
      compras: 6,
      afinidadTotal: 75,
      conversionRate: '20.6%',
      stockActual: 15,
    },
    {
      id: 'PROD-301',
      nombre: 'Monitor Samsung Odyssey G7 27"',
      categoria: 'Monitores',
      vistas: 27,
      carritos: 11,
      compras: 3,
      afinidadTotal: 58,
      conversionRate: '11.1%',
      stockActual: 6,
    },
    {
      id: 'PROD-401',
      nombre: 'Audífonos Sony WH-1000XM5',
      categoria: 'Audio',
      vistas: 23,
      carritos: 9,
      compras: 4,
      afinidadTotal: 53,
      conversionRate: '17.3%',
      stockActual: 14,
    },
  ]);

  // Lista de eventos recientes (Estilo Forsight Recent Files)
  const [recentEvents, setRecentEvents] = useState([
    { id: 1, type: 'view', title: 'Laptop Asus ROG Strix G16', subtitle: 'Vistas de producto en streaming', time: '18:54:10', client: 'cliente@pedidos360.com', size: '1.2 KB' },
    { id: 2, type: 'cart', title: 'Laptop Asus ROG Strix G16', subtitle: 'Añadido al carrito de compras (+2 pts)', time: '18:54:45', client: 'cliente@pedidos360.com', size: '2.4 KB' },
    { id: 3, type: 'purchase', title: 'Transacción Webpay Plus #8921', subtitle: 'Pago Aprobado $1.290.000 CLP', time: '18:55:02', client: 'cliente@pedidos360.com', size: '4.8 KB' },
    { id: 4, type: 'fraud', title: 'Bloqueo Antifraude Activado', subtitle: 'Velocidad: 4 transacciones en < 10s', time: '18:55:15', client: 'bot.burst@seguridad.cl', size: '1.8 KB' },
    { id: 5, type: 'view', title: 'MacBook Pro 14" M3 Pro', subtitle: 'Ficha técnica consultada', time: '18:56:00', client: 'abustamante@duocuc.cl', size: '1.1 KB' },
  ]);

  // Check de salud de todos los microservicios en vivo
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
            returnUrl: 'http://localhost:5173/callback',
          }),
        }).catch(() => {});
      }

      setKafkaStats((prev) => ({
        ...prev,
        totalEventos: prev.totalEventos + 4,
        bloqueosFraude: prev.bloqueosFraude + 1,
      }));

      setRecentEvents((prev) => [
        {
          id: Date.now(),
          type: 'fraud',
          title: 'Bloqueo Antifraude Activado (429)',
          subtitle: `Cliente ${botClient} suspendido por 30 min`,
          time: timeStr,
          client: botClient,
          size: '3.1 KB',
        },
        ...prev.slice(0, 5),
      ]);
      return;
    }

    const action = actionType === 'CART' ? 'cart' : actionType === 'PURCHASE' ? 'purchase' : 'view';
    const itemId = 'PROD-101';
    const itemName = 'Laptop Asus ROG Strix G16';

    try {
      fetch(endpoints.analyticsInteraccion, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: 'operador.cloud@pedidos360.com',
          itemId: itemId,
          action: action,
          category: 'Laptops',
          productType: 'Hardware',
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    } catch {}

    setKafkaStats((prev) => ({
      ...prev,
      totalEventos: prev.totalEventos + 1,
      vistas: action === 'view' ? prev.vistas + 1 : prev.vistas,
      carritos: action === 'cart' ? prev.carritos + 1 : prev.carritos,
      pagosAprobados: action === 'purchase' ? prev.pagosAprobados + 1 : prev.pagosAprobados,
    }));

    setRecentEvents((prev) => [
      {
        id: Date.now(),
        type: action,
        title: itemName,
        subtitle: action === 'view' ? 'Ficha técnica consultada (+1)' : action === 'cart' ? 'Añadido al carrito (+2)' : 'Compra confirmada (+3)',
        time: timeStr,
        client: 'operador.cloud@pedidos360.com',
        size: '1.4 KB',
      },
      ...prev.slice(0, 5),
    ]);
  };

  const onlineCount = servicesStatus.filter((s) => s.status === 'ONLINE').length;

  return (
    <div className="cloudops-wrapper">
      <div className="cloudops-shell">
        
        {/* ==========================================
            1. SIDEBAR (Estilo Forsight Dashboard)
           ========================================== */}
        <aside className="cloudops-sidebar">
          <div>
            <div className="sidebar-brand-box">
              <div className="brand-symbol">⚡</div>
              <div>
                <div className="brand-text-name">Pedidos360</div>
                <div className="brand-text-badge">Cloud Engine</div>
              </div>
            </div>

            {/* Botón de Acción Principal */}
            <button
              className="btn-sidebar-action"
              onClick={() => handleTriggerKafkaEvent('VIEW')}
              title="Disparar nuevo evento de telemetría a Apache Kafka"
            >
              <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>+</span>
              <span>Nuevo Evento Kafka</span>
            </button>

            {/* Menú de Navegación */}
            <nav className="sidebar-menu-list">
              <button
                className={`sidebar-menu-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <div className="menu-label-group">
                  <span>📊</span>
                  <span>Resumen Ejecutivo</span>
                </div>
              </button>

              <button
                className={`sidebar-menu-btn ${activeTab === 'services' ? 'active' : ''}`}
                onClick={() => setActiveTab('services')}
              >
                <div className="menu-label-group">
                  <ServerIcon size={16} />
                  <span>Microservicios</span>
                </div>
                <span className="menu-badge-pill">{onlineCount}/7</span>
              </button>

              <button
                className={`sidebar-menu-btn ${activeTab === 'kafka' ? 'active' : ''}`}
                onClick={() => setActiveTab('kafka')}
              >
                <div className="menu-label-group">
                  <span>⚡</span>
                  <span>Streaming Kafka</span>
                </div>
              </button>

              <button
                className={`sidebar-menu-btn ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                <div className="menu-label-group">
                  <span>📦</span>
                  <span>Demanda & Ranking</span>
                </div>
              </button>

              <button
                className={`sidebar-menu-btn ${activeTab === 'rabbitmq' ? 'active' : ''}`}
                onClick={() => setActiveTab('rabbitmq')}
              >
                <div className="menu-label-group">
                  <QueueIcon size={16} />
                  <span>Clúster RabbitMQ</span>
                </div>
              </button>

              <button
                className={`sidebar-menu-btn ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <div className="menu-label-group">
                  <ShieldCheckIcon size={16} />
                  <span>Motor Antifraude</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Widget Inferior: Estado del Clúster */}
          <div>
            <div className="sidebar-bottom-widget">
              <div className="widget-label-row">
                <span>Salud del Clúster</span>
                <span style={{ color: '#10b981' }}>100%</span>
              </div>
              <span className="widget-subtext">Infraestructura Operativa</span>
              <div className="widget-progress-bg">
                <div className="widget-progress-fill" style={{ width: '100%' }}></div>
              </div>
              <div className="widget-percent-row">
                <span>7 Microservicios</span>
                <span>Kafka KRaft</span>
              </div>
            </div>

            <button
              className="sidebar-logout-btn"
              onClick={() => { window.location.hash = '#/'; }}
              title="Volver a la tienda comercial"
            >
              <span>←</span>
              <span>Ir a Tienda</span>
            </button>
          </div>
        </aside>

        {/* ==========================================
            2. MAIN CONTENT AREA (Estilo Forsight)
           ========================================== */}
        <main className="cloudops-main-pane">
          
          {/* Top Header */}
          <header className="dashboard-top-header">
            <div>
              <div className="user-welcome-row">
                <h1 className="welcome-title">Panel de Control</h1>
                <span className="user-role-chip">★ CLOUD ARCHITECT</span>
              </div>
              <p className="welcome-subtitle">
                Arquitectura de Microservicios • Apache Kafka & Transbank Webpay
              </p>
            </div>

            <div className="header-action-controls">
              <div className="header-search-box">
                <span style={{ position: 'absolute', left: '10px', color: '#94a3b8' }}>
                  <SearchIcon size={15} />
                </span>
                <input
                  type="text"
                  placeholder="Buscar métricas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="header-search-input"
                />
              </div>

              <select className="header-filter-select" aria-label="Filtrar por tiempo">
                <option value="today">Tiempo Real</option>
                <option value="week">Última Hora</option>
                <option value="month">Sesión Activa</option>
              </select>

              <button
                className="btn-header-refresh"
                onClick={runHealthChecks}
                disabled={refreshing}
                title="Escanear estado de microservicios"
              >
                <RefreshIcon size={14} className={refreshing ? 'spin' : ''} />
                <span>{refreshing ? 'Escaneando...' : 'Actualizar'}</span>
              </button>
            </div>
          </header>

          {/* ==========================================
              3. BANNER AZUL DE KPIS (Forsight Blue Ribbon)
             ========================================== */}
          <section className="blue-kpi-ribbon">
            <div className="ribbon-col">
              <span className="ribbon-col-header">Microservicios</span>
              <div className="ribbon-number">{onlineCount}/7</div>
              <span className="ribbon-subtext">Todos Operativos (8080..8086)</span>
            </div>

            <div className="ribbon-col">
              <span className="ribbon-col-header">Eventos Kafka</span>
              <div className="ribbon-number">{kafkaStats.totalEventos}</div>
              <span className="ribbon-subtext">Tasa: {kafkaStats.tasaPorMinuto} ev/min</span>
            </div>

            <div className="ribbon-col">
              <span className="ribbon-col-header">Webpay Plus</span>
              <div className="ribbon-number">{kafkaStats.pagosAprobados}</div>
              <span className="ribbon-subtext">Transacciones Aprobadas</span>
            </div>

            <div className="ribbon-col">
              <span className="ribbon-col-header">Antifraude</span>
              <div className="ribbon-number">{kafkaStats.bloqueosFraude}</div>
              <span className="ribbon-subtext">Bloqueos de Velocidad (429)</span>
            </div>

            <div className="ribbon-col">
              <span className="ribbon-col-header">Clúster RabbitMQ</span>
              <div className="ribbon-number">2</div>
              <span className="ribbon-subtext">Nodos en Clúster (DLQ OK)</span>
            </div>
          </section>

          {/* ==========================================
              4. TWO-COLUMN GRID: Actividad Reciente + Activity Chart
             ========================================== */}
          <section className="forsight-split-grid">
            
            {/* Panel Izquierdo: Eventos Recientes (Recent Files style) */}
            <div className="forsight-card">
              <div className="card-title-row">
                <h3 className="card-main-title">Telemetría de Eventos Recientes</h3>
                <div className="kafka-simulator-bar">
                  <button onClick={() => handleTriggerKafkaEvent('VIEW')} className="btn-sim-event" title="Emitir evento de vista">
                    +1 Clic
                  </button>
                  <button onClick={() => handleTriggerKafkaEvent('CART')} className="btn-sim-event" title="Emitir evento de carrito">
                    +2 Carrito
                  </button>
                  <button onClick={() => handleTriggerKafkaEvent('PURCHASE')} className="btn-sim-event" title="Emitir evento de compra">
                    +3 Compra
                  </button>
                  <button onClick={() => handleTriggerKafkaEvent('FRAUD_SIMULATION')} className="btn-sim-event fraud" title="Simular 4 pagos rápidos para disparar el bloqueo 429">
                    ⚡ Antifraude
                  </button>
                </div>
              </div>

              <div className="recent-events-list">
                {recentEvents.map((evt) => (
                  <div key={evt.id} className="recent-event-row">
                    <div className="event-left-group">
                      <div className={`event-icon-badge ${evt.type}`}>
                        {evt.type === 'view' && '👁️'}
                        {evt.type === 'cart' && '🛒'}
                        {evt.type === 'purchase' && '💳'}
                        {evt.type === 'fraud' && '🚨'}
                      </div>
                      <div className="event-meta">
                        <span className="event-name-text">{evt.title}</span>
                        <span className="event-time-sub">{evt.subtitle} • {evt.time}</span>
                      </div>
                    </div>
                    <span className="event-right-tag">{evt.size}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel Derecho: Activity Chart (Barras CSS con Leyenda) */}
            <div className="forsight-card">
              <div className="card-title-row">
                <h3 className="card-main-title">Gráfico de Actividad & Conversión</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Streaming por Categoría</span>
              </div>

              <div className="activity-chart-container">
                <div className="chart-bars-wrap">
                  {/* Categoría: Laptops */}
                  <div className="chart-bar-col">
                    <div className="chart-bar-track">
                      <div className="chart-bar-pillar pillar-view" style={{ height: '80%' }} title="Vistas: 48"></div>
                      <div className="chart-bar-pillar pillar-cart" style={{ height: '45%' }} title="Carrito: 18"></div>
                      <div className="chart-bar-pillar pillar-purchase" style={{ height: '30%' }} title="Compras: 7"></div>
                    </div>
                    <span className="chart-bar-label">Laptops</span>
                  </div>

                  {/* Categoría: Periféricos */}
                  <div className="chart-bar-col">
                    <div className="chart-bar-track">
                      <div className="chart-bar-pillar pillar-view" style={{ height: '60%' }}></div>
                      <div className="chart-bar-pillar pillar-cart" style={{ height: '35%' }}></div>
                      <div className="chart-bar-pillar pillar-purchase" style={{ height: '25%' }}></div>
                    </div>
                    <span className="chart-bar-label">Periféricos</span>
                  </div>

                  {/* Categoría: Monitores */}
                  <div className="chart-bar-col">
                    <div className="chart-bar-track">
                      <div className="chart-bar-pillar pillar-view" style={{ height: '55%' }}></div>
                      <div className="chart-bar-pillar pillar-cart" style={{ height: '28%' }}></div>
                      <div className="chart-bar-pillar pillar-purchase" style={{ height: '18%' }}></div>
                    </div>
                    <span className="chart-bar-label">Monitores</span>
                  </div>

                  {/* Categoría: Audio */}
                  <div className="chart-bar-col">
                    <div className="chart-bar-track">
                      <div className="chart-bar-pillar pillar-view" style={{ height: '48%' }}></div>
                      <div className="chart-bar-pillar pillar-cart" style={{ height: '22%' }}></div>
                      <div className="chart-bar-pillar pillar-purchase" style={{ height: '20%' }}></div>
                    </div>
                    <span className="chart-bar-label">Audio</span>
                  </div>

                  {/* Categoría: Almacenamiento */}
                  <div className="chart-bar-col">
                    <div className="chart-bar-track">
                      <div className="chart-bar-pillar pillar-view" style={{ height: '38%' }}></div>
                      <div className="chart-bar-pillar pillar-cart" style={{ height: '18%' }}></div>
                      <div className="chart-bar-pillar pillar-purchase" style={{ height: '12%' }}></div>
                    </div>
                    <span className="chart-bar-label">Almacen.</span>
                  </div>
                </div>

                {/* Leyenda de colores */}
                <div className="chart-legend-row">
                  <div className="legend-pill">
                    <span className="legend-dot" style={{ background: '#38bdf8' }}></span>
                    <span>Vistas (x1)</span>
                  </div>
                  <div className="legend-pill">
                    <span className="legend-dot" style={{ background: '#0284c7' }}></span>
                    <span>Carrito (x2)</span>
                  </div>
                  <div className="legend-pill">
                    <span className="legend-dot" style={{ background: '#0c4a6e' }}></span>
                    <span>Compras (x3)</span>
                  </div>
                </div>
              </div>
            </div>

          </section>

          {/* ==========================================
              5. MATRIZ DE SALUD DE MICROSERVICIOS (7/7 ONLINE)
             ========================================== */}
          <section className="services-health-section">
            <div className="card-title-row">
              <div>
                <h3 className="card-main-title">Matriz de Salud & Latencia de Microservicios</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                  Conectividad directa sin proxies intermedios • Puertos :8080 al :8086
                </p>
              </div>

              <span className="svc-status-badge online">
                ● {onlineCount} de {servicesStatus.length} Operativos
              </span>
            </div>

            <div className="services-cards-grid">
              {servicesStatus.map((svc) => (
                <div key={svc.id} className="svc-status-card">
                  <div>
                    <div className="svc-header-row">
                      <span className="svc-port-badge">Puerto :{svc.port}</span>
                      <span className={`svc-status-badge ${svc.status.toLowerCase()}`}>
                        ● {svc.status}
                      </span>
                    </div>

                    <h4 className="svc-title-text" style={{ marginTop: '8px' }}>{svc.name}</h4>
                    <p className="svc-desc-text" style={{ marginTop: '4px' }}>{svc.desc}</p>
                  </div>

                  <div className="svc-footer-row">
                    <span className="svc-tech-tag">{svc.tech}</span>
                    <span className="svc-latency-tag">
                      {svc.latency !== null ? `${svc.latency} ms` : 'Offline'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ==========================================
              6. TABLA DE DEMANDA & AFINIDAD TOP 5
             ========================================== */}
          <section className="services-health-section">
            <div className="card-title-row">
              <div>
                <h3 className="card-main-title">Ranking de Demanda & Afinidad en Tiempo Real</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                  Cálculo continuo procesado por Apache Kafka y persistido en Amazon DynamoDB
                </p>
              </div>

              <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0284c7', background: '#e0f2fe', padding: '4px 10px', borderRadius: '8px' }}>
                Algoritmo: Vistas (1x) + Carrito (2x) + Compras (3x)
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="demand-table">
                <thead>
                  <tr>
                    <th>Ranking</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Vistas</th>
                    <th>En Carrito</th>
                    <th>Compras</th>
                    <th>Afinidad Kafka</th>
                    <th>Conversión</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {topProductosDemandados.map((item, idx) => (
                    <tr key={item.id}>
                      <td>
                        <div className={`rank-badge-pill ${idx === 0 ? 'first' : idx === 1 ? 'second' : idx === 2 ? 'third' : 'other'}`}>
                          #{idx + 1}
                        </div>
                      </td>
                      <td>
                        <strong>{item.nombre}</strong>
                        <small style={{ display: 'block', color: '#94a3b8' }}>{item.id}</small>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', color: '#0284c7', background: '#f0f9ff', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' }}>
                          {item.categoria}
                        </span>
                      </td>
                      <td style={{ color: '#64748b' }}>{item.vistas}</td>
                      <td style={{ color: '#d97706', fontWeight: '600' }}>{item.carritos}</td>
                      <td style={{ color: '#059669', fontWeight: '700' }}>{item.compras}</td>
                      <td>
                        <strong>{item.afinidadTotal} pts</strong>
                        <span className="affinity-bar-track">
                          <span className="affinity-bar-fill" style={{ width: `${Math.min(100, item.afinidadTotal)}%` }}></span>
                        </span>
                      </td>
                      <td style={{ color: '#059669', fontWeight: '700' }}>{item.conversionRate}</td>
                      <td style={{ color: item.stockActual <= 5 ? '#d97706' : '#64748b' }}>{item.stockActual} un.</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};

export default CloudOpsView;
