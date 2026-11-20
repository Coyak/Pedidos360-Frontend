import React, { useState, useEffect } from 'react';
import { getApiEndpoints } from '../config/apiConfig';
import { 
  ServerIcon, 
  QueueIcon, 
  ShieldCheckIcon, 
  ActivityIcon, 
  RefreshIcon, 
  CloudIcon, 
  CheckIcon, 
  CloseIcon 
} from './Icons';

export const CloudOpsView = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'services' | 'kafka' | 'products' | 'rabbitmq' | 'security'
  const [refreshing, setRefreshing] = useState(false);
  const endpoints = getApiEndpoints();

  // Matriz de Microservicios con URLs corregidas y verificadas
  const [servicesStatus, setServicesStatus] = useState([
    {
      id: 'catalogo',
      name: 'Catálogo & Inventario API',
      port: 8080,
      endpoint: endpoints.catalogoStatus, // http://localhost:8080/api/status
      tech: 'Spring Boot 3.2 • Java 21 • AMQP Consumer',
      status: 'CHECKING',
      latency: null,
      desc: 'Gestión de productos y descuento de stock transaccional.',
    },
    {
      id: 'carrito',
      name: 'Carrito & Procesador de Órdenes API',
      port: 8081,
      endpoint: endpoints.carritoStatus, // http://localhost:8081/api/carrito/status
      tech: 'Spring Boot 3.2 • Java 21 • AMQP Producer',
      status: 'CHECKING',
      latency: null,
      desc: 'Orquestación de órdenes y publicación pedidos.pedido.creado.',
    },
    {
      id: 'notificaciones',
      name: 'Notificaciones & Mailer API',
      port: 8082,
      endpoint: endpoints.notificacionesStatus, // http://localhost:8082/api/notificaciones/status
      tech: 'Spring Boot 3.2 • Java 21 • RabbitMQ DLQ + SMTP Real',
      status: 'CHECKING',
      latency: null,
      desc: 'Envío de correos reales y reintento en cola muerta (DLQ).',
    },
    {
      id: 'auditoria',
      name: 'Auditoría Criptográfica SHA-256 API',
      port: 8083,
      endpoint: endpoints.auditoriaStatus, // http://localhost:8083/api/auditoria/status
      tech: 'Spring Boot 3.2 • Java 21 • Ledger Inmutable',
      status: 'CHECKING',
      latency: null,
      desc: 'Registro criptográfico inmutable con sellos de tiempo y hash.',
    },
    {
      id: 'admin',
      name: 'Admin & Topología Clúster API',
      port: 8084,
      endpoint: 'http://localhost:8084/api/admin/status',
      tech: 'Spring Boot 3.2 • Java 21 • RabbitAdmin',
      status: 'CHECKING',
      latency: null,
      desc: 'Monitoreo de topología de colas y exchanges en Clúster RabbitMQ.',
    },
    {
      id: 'pago',
      name: 'Pagos & Detección Antifraude API',
      port: 8085,
      endpoint: endpoints.pagosStatus, // http://localhost:8085/api/pagos/status
      tech: 'Spring Boot 3.2 • Transbank Webpay Plus • Kafka • MySQL',
      status: 'CHECKING',
      latency: null,
      desc: 'Integración Webpay oficial y regla de velocidad antifraude.',
    },
    {
      id: 'analytics',
      name: 'Analítica, Kafka & Recomendaciones API',
      port: 8086,
      endpoint: endpoints.analyticsStatus, // http://localhost:8086/api/recomendaciones/status
      tech: 'Spring Boot 3.2 • Apache Kafka KRaft • DynamoDB • WebSockets',
      status: 'CHECKING',
      latency: null,
      desc: 'Clickstream masivo y ranking de recomendaciones Top 5.',
    },
  ]);

  // Telemetría Kafka en tiempo real
  const [kafkaStats, setKafkaStats] = useState({
    totalEventos: 156,
    vistas: 84,
    carritos: 42,
    pagosIniciados: 21,
    pagosAprobados: 18,
    bloqueosFraude: 3,
    tasaPorMinuto: 22.4,
    throughputKbps: 4.8,
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

  // Terminal de eventos Kafka
  const [kafkaLogStream, setKafkaLogStream] = useState([
    { id: 1, topic: 'interacciones-user', time: '18:36:12', type: 'VIEW', item: 'PROD-101', client: 'cliente@pedidos360.com', desc: 'Ficha técnica consultada: Laptop Asus ROG Strix G16' },
    { id: 2, topic: 'interacciones-user', time: '18:36:45', type: 'CART', item: 'PROD-101', client: 'cliente@pedidos360.com', desc: 'Artículo añadido al carrito (+2 afinidad)' },
    { id: 3, topic: 'payment-attempts', time: '18:37:02', type: 'PAYMENT_INIT', item: 'TX-9821', client: 'cliente@pedidos360.com', desc: 'Iniciando Webpay Plus por $1.290.000 CLP' },
    { id: 4, topic: 'pedidos.alertas.fraude', time: '18:37:15', type: 'FRAUD_ALERT', item: 'TX-9822', client: 'test.burst@seguridad.cl', desc: 'Velocidad excedida: 4 intentos en 6s -> Cliente bloqueado 30 min (429)' },
    { id: 5, topic: 'interacciones-user', time: '18:38:00', type: 'VIEW', item: 'PROD-102', client: 'abustamante@duocuc.cl', desc: 'Ficha técnica consultada: Apple MacBook Pro 14" M3 Pro' },
  ]);

  const [auditLogs, setAuditLogs] = useState([]);

  // Check de salud de todos los microservicios
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
    fetch(endpoints.auditoriaEventos)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setAuditLogs(data.slice(0, 8));
      })
      .catch(() => {});
  }, []);

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
        pagosIniciados: prev.pagosIniciados + 3,
        bloqueosFraude: prev.bloqueosFraude + 1,
      }));

      setKafkaLogStream((prev) => [
        {
          id: Date.now(),
          topic: 'pedidos.alertas.fraude',
          time: timeStr,
          type: 'FRAUD_BLOCKED',
          item: 'VELOCITY_LIMIT',
          client: botClient,
          desc: 'Regla de velocidad activada: 4 transacciones en < 10s. Cliente bloqueado por 30 min (HTTP 429).',
        },
        ...prev.slice(0, 24),
      ]);
      return;
    }

    const action = actionType === 'CART' ? 'cart' : actionType === 'PURCHASE' ? 'purchase' : 'view';
    const itemId = 'PROD-101';

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

    setKafkaLogStream((prev) => [
      {
        id: Date.now(),
        topic: 'interacciones-user',
        time: timeStr,
        type: action.toUpperCase(),
        item: itemId,
        client: 'operador.cloud@pedidos360.com',
        desc: `Evento '${action}' emitido en streaming directo al topic Apache Kafka`,
      },
      ...prev.slice(0, 24),
    ]);
  };

  const onlineCount = servicesStatus.filter((s) => s.status === 'ONLINE').length;

  return (
    <div style={styles.dashboardLayout}>
      {/* Sidebar Lateral del Dashboard */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarBrand}>
            <span style={styles.brandIcon}>⚡</span>
            <div>
              <strong style={{ color: '#ffffff', fontSize: '0.95rem' }}>Cloud Console</strong>
              <small style={{ display: 'block', color: '#38bdf8', fontSize: '0.72rem' }}>Pedidos360 Ops</small>
            </div>
          </div>
        </div>

        <nav style={styles.sidebarNav}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{ ...styles.navItem, ...(activeTab === 'overview' ? styles.navItemActive : {}) }}
          >
            <span>📈</span>
            <span>Resumen Ejecutivo</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            style={{ ...styles.navItem, ...(activeTab === 'services' ? styles.navItemActive : {}) }}
          >
            <ServerIcon size={16} />
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span>Microservicios</span>
              <span style={styles.badgeMini}>{onlineCount}/7</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('kafka')}
            style={{ ...styles.navItem, ...(activeTab === 'kafka' ? styles.navItemActive : {}) }}
          >
            <span>⚡</span>
            <span>Streaming Kafka</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            style={{ ...styles.navItem, ...(activeTab === 'products' ? styles.navItemActive : {}) }}
          >
            <span>📊</span>
            <span>Demanda & Afinidad</span>
          </button>

          <button
            onClick={() => setActiveTab('rabbitmq')}
            style={{ ...styles.navItem, ...(activeTab === 'rabbitmq' ? styles.navItemActive : {}) }}
          >
            <QueueIcon size={16} />
            <span>Clúster RabbitMQ</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            style={{ ...styles.navItem, ...(activeTab === 'security' ? styles.navItemActive : {}) }}
          >
            <ShieldCheckIcon size={16} />
            <span>Seguridad & Ledger</span>
          </button>
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.clusterStatusCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={styles.pulseGreen}></span>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#10b981' }}>Sistemas Operativos</span>
            </div>
            <small style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', marginTop: '4px' }}>
              Kafka KRaft • MySQL • RabbitMQ
            </small>
          </div>
        </div>
      </aside>

      {/* Contenido Principal del Dashboard */}
      <div style={styles.mainContent}>
        {/* Barra Superior del Dashboard */}
        <header style={styles.topBar}>
          <div>
            <h2 style={styles.pageTitle}>
              {activeTab === 'overview' && 'Panel de Control & Telemetría Global'}
              {activeTab === 'services' && 'Matriz de Salud & Latencias de Microservicios'}
              {activeTab === 'kafka' && 'Pipeline de Streaming Apache Kafka en Vivo'}
              {activeTab === 'products' && 'Analítica de Demanda & Afinidad de Productos'}
              {activeTab === 'rabbitmq' && 'Clúster RabbitMQ & Tolerancia a Fallos (DLQ)'}
              {activeTab === 'security' && 'Motor Antifraude & Auditoría Criptográfica'}
            </h2>
            <p style={styles.pageDesc}>Infraestructura distribuida multi-servicio con comunicación orientada a eventos.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={runHealthChecks} disabled={refreshing} style={styles.btnActionPrimary}>
              <RefreshIcon size={14} className={refreshing ? 'spin' : ''} />
              <span>{refreshing ? 'Escanenado...' : 'Escanear Estado'}</span>
            </button>
          </div>
        </header>

        {/* Tarjetas KPI Superiores (Siempre visibles en Overview y Servicios) */}
        <div style={styles.kpiGrid}>
          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Microservicios Activos</span>
            <div style={styles.kpiValueRow}>
              <span style={{ color: onlineCount === servicesStatus.length ? '#10b981' : '#38bdf8' }}>{onlineCount}</span>
              <span style={{ color: '#64748b', fontSize: '1.2rem' }}>/ {servicesStatus.length}</span>
            </div>
            <span style={styles.kpiFoot}>100% Puertos HTTP directos (8080..8086)</span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Eventos Kafka Ingeridos</span>
            <div style={styles.kpiValueRow}>
              <span>{kafkaStats.totalEventos}</span>
              <span style={{ color: '#fb923c', fontSize: '0.85rem' }}>⚡ {kafkaStats.tasaPorMinuto} ev/m</span>
            </div>
            <span style={styles.kpiFoot}>Tópicos activos con cluster KRaft</span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Clúster RabbitMQ</span>
            <div style={styles.kpiValueRow}>
              <span style={{ color: '#a855f7' }}>2 Nodos</span>
            </div>
            <span style={styles.kpiFoot}>rabbitmq1 (5672) & rabbitmq2 (5673)</span>
          </div>

          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Alertas Antifraude</span>
            <div style={styles.kpiValueRow}>
              <span style={{ color: '#ef4444' }}>{kafkaStats.bloqueosFraude}</span>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Bloqueados</span>
            </div>
            <span style={styles.kpiFoot}>Regla de velocidad: 3 intentos / 10s</span>
          </div>
        </div>

        {/* VISTA 1: OVERVIEW & SERVICIOS */}
        {(activeTab === 'overview' || activeTab === 'services') && (
          <section style={styles.sectionContainer}>
            <div style={styles.cardHeaderRow}>
              <h3 style={styles.cardTitle}>Matriz de Salud & Latencia en Tiempo Real</h3>
              <span style={styles.badgeSuccess}>Arquitectura Punto a Punto (Direct CORS)</span>
            </div>

            <div style={styles.servicesGrid}>
              {servicesStatus.map((svc) => (
                <div key={svc.id} style={styles.svcCard}>
                  <div style={styles.svcTop}>
                    <span style={styles.svcPort}>Port :{svc.port}</span>
                    <span style={{
                      ...styles.statusChip,
                      background: svc.status === 'ONLINE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: svc.status === 'ONLINE' ? '#10b981' : '#ef4444',
                      border: `1px solid ${svc.status === 'ONLINE' ? '#10b981' : '#ef4444'}`,
                    }}>
                      ● {svc.status}
                    </span>
                  </div>

                  <h4 style={styles.svcTitle}>{svc.name}</h4>
                  <p style={styles.svcDescText}>{svc.desc}</p>

                  <div style={styles.svcBottom}>
                    <code style={styles.svcTechCode}>{svc.tech}</code>
                    <span style={styles.svcLatencyText}>
                      {svc.latency !== null ? `${svc.latency} ms` : 'Offline'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* VISTA 2: STREAMING KAFKA */}
        {(activeTab === 'overview' || activeTab === 'kafka') && (
          <section style={{ ...styles.sectionContainer, marginTop: '2rem' }}>
            <div style={styles.cardHeaderRow}>
              <div>
                <h3 style={styles.cardTitle}>Pipeline Apache Kafka & Feed de Eventos</h3>
                <p style={styles.cardSubtitle}>Eventos procesados de forma asíncrona sin bloquear la capa web.</p>
              </div>

              {/* Botones de Prueba Rápida */}
              <div style={styles.simButtonsRow}>
                <button onClick={() => handleTriggerKafkaEvent('VIEW')} style={styles.btnSimAction}>
                  +1 Clic
                </button>
                <button onClick={() => handleTriggerKafkaEvent('CART')} style={styles.btnSimAction}>
                  +2 Carrito
                </button>
                <button onClick={() => handleTriggerKafkaEvent('PURCHASE')} style={styles.btnSimAction}>
                  +3 Compra
                </button>
                <button
                  onClick={() => handleTriggerKafkaEvent('FRAUD_SIMULATION')}
                  style={{ ...styles.btnSimAction, background: 'rgba(239, 68, 68, 0.2)', borderColor: '#ef4444', color: '#fca5a5' }}
                >
                  ⚡ Disparar Antifraude
                </button>
              </div>
            </div>

            {/* Terminal de Consola */}
            <div style={styles.terminalContainer}>
              <div style={styles.terminalBar}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span>
                </div>
                <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                  kafka-console-consumer --bootstrap-server localhost:9092 --topics interacciones-user,payment-attempts
                </span>
                <span style={{ color: '#10b981', fontSize: '0.78rem', fontWeight: 'bold' }}>● STREAM VIVO</span>
              </div>

              <div style={styles.terminalLogs}>
                {kafkaLogStream.map((log) => (
                  <div key={log.id} style={styles.terminalRow}>
                    <span style={{ color: '#64748b' }}>[{log.time}]</span>
                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>[{log.topic}]</span>
                    <span style={{
                      color: log.type.includes('FRAUD') ? '#ef4444' : log.type === 'CART' ? '#f59e0b' : log.type === 'PURCHASE' ? '#10b981' : '#94a3b8',
                      fontWeight: '700',
                    }}>
                      {log.type}
                    </span>
                    <span style={{ color: '#cbd5e1' }}>{log.desc}</span>
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>({log.client})</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* VISTA 3: DEMANDA & PRODUCTOS */}
        {(activeTab === 'overview' || activeTab === 'products') && (
          <section style={{ ...styles.sectionContainer, marginTop: '2rem' }}>
            <div style={styles.cardHeaderRow}>
              <div>
                <h3 style={styles.cardTitle}>Ranking de Demanda & Afinidad de Productos</h3>
                <p style={styles.cardSubtitle}>Cálculo en streaming por ms-analytics y almacenado en Amazon DynamoDB.</p>
              </div>
              <span style={styles.badgeSuccess}>Fórmula: Vistas×1 + Carrito×2 + Compra×3</span>
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.customTable}>
                <thead>
                  <tr>
                    <th>Ranking</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Vistas</th>
                    <th>En Carrito</th>
                    <th>Compras</th>
                    <th>Afinidad</th>
                    <th>Conversión</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {topProductosDemandados.map((item, idx) => (
                    <tr key={item.id}>
                      <td>
                        <span style={{
                          ...styles.rankPill,
                          background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#334155',
                        }}>
                          #{idx + 1}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#f8fafc' }}>{item.nombre}</strong>
                        <small style={{ display: 'block', color: '#64748b' }}>{item.id}</small>
                      </td>
                      <td><span style={styles.categoryChip}>{item.categoria}</span></td>
                      <td style={{ color: '#cbd5e1' }}>{item.vistas}</td>
                      <td style={{ color: '#fb923c' }}>{item.carritos}</td>
                      <td style={{ color: '#10b981', fontWeight: 'bold' }}>{item.compras}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{item.afinidadTotal} pts</span>
                          <div style={{ width: '70px', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, item.afinidadTotal)}%`, height: '100%', background: '#38bdf8' }}></div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: '#10b981', fontWeight: '600' }}>{item.conversionRate}</td>
                      <td style={{ color: item.stockActual <= 5 ? '#f59e0b' : '#94a3b8' }}>{item.stockActual} un.</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* VISTA 4: RABBITMQ */}
        {(activeTab === 'rabbitmq') && (
          <section style={styles.sectionContainer}>
            <div style={styles.cardHeaderRow}>
              <div>
                <h3 style={styles.cardTitle}>Clúster RabbitMQ & Manejo de Mensajes</h3>
                <p style={styles.cardSubtitle}>Topología transaccional de 2 nodos con Dead Letter Queue.</p>
              </div>
              <a href="http://localhost:15672" target="_blank" rel="noreferrer" style={styles.btnActionSecondary}>
                Consola RabbitMQ (:15672) ↗
              </a>
            </div>

            <div style={styles.twoColGrid}>
              <div style={styles.infoBox}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#ffffff' }}>Nodos del Clúster</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={styles.nodeCard}>
                    <div>
                      <strong>pedidos360-rabbitmq1</strong>
                      <small style={{ display: 'block', color: '#94a3b8' }}>Puerto AMQP: 5672 • Web: 15672</small>
                    </div>
                    <span style={styles.badgeSuccess}>Primario (Online)</span>
                  </div>
                  <div style={styles.nodeCard}>
                    <div>
                      <strong>pedidos360-rabbitmq2</strong>
                      <small style={{ display: 'block', color: '#94a3b8' }}>Puerto AMQP: 5673 • Web: 15673</small>
                    </div>
                    <span style={styles.badgeSuccess}>Espejo (Online)</span>
                  </div>
                </div>
              </div>

              <div style={styles.infoBox}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#ffffff' }}>Colas Principales</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={styles.queueCard}>
                    <span>pedidos.ordenes</span>
                    <span style={styles.categoryChip}>Durable</span>
                  </div>
                  <div style={styles.queueCard}>
                    <span>pedidos.notificaciones</span>
                    <span style={styles.categoryChip}>Durable</span>
                  </div>
                  <div style={{ ...styles.queueCard, borderColor: '#ef4444' }}>
                    <span style={{ color: '#fca5a5' }}>pedidos.notificaciones.dlq</span>
                    <span style={{ ...styles.categoryChip, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>Dead Letter Queue</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* VISTA 5: SEGURIDAD & LEDGER */}
        {(activeTab === 'security') && (
          <section style={styles.sectionContainer}>
            <div style={styles.cardHeaderRow}>
              <div>
                <h3 style={styles.cardTitle}>Seguridad Antifraude & Ledger Criptográfico</h3>
                <p style={styles.cardSubtitle}>Regla de velocidad en ms-pago y sellos inmutables SHA-256 en ms-auditoria.</p>
              </div>
            </div>

            <div style={styles.twoColGrid}>
              <div style={styles.infoBox}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#ffffff' }}>Regla Antifraude de Velocidad</h4>
                <p style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>
                  Si un cliente ejecuta $\ge 3$ intentos en $\le 10$ segundos, el sistema bloquea su cuenta por 30 minutos emitiendo un código HTTP 429 Too Many Requests.
                </p>
                <button onClick={() => handleTriggerKafkaEvent('FRAUD_SIMULATION')} style={{ ...styles.btnActionPrimary, background: '#ef4444', marginTop: '1rem', width: '100%' }}>
                  ⚡ Probar Disparo Antifraude
                </button>
              </div>

              <div style={styles.infoBox}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#ffffff' }}>Ledger SHA-256 Reciente</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log, i) => (
                      <div key={i} style={styles.queueCard}>
                        <code>{log.transaccionId || `TX-${1000 + i}`}</code>
                        <span style={{ color: '#38bdf8', fontSize: '0.75rem' }}>{log.hashSha256?.substring(0, 20)}...</span>
                      </div>
                    ))
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Sin transacciones recientes selladas.</span>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

const styles = {
  dashboardLayout: {
    display: 'flex',
    minHeight: 'calc(100vh - 72px)',
    background: '#090d16',
    color: '#f8fafc',
  },
  sidebar: {
    width: '260px',
    background: '#0f172a',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '1.25rem 0',
  },
  sidebarHeader: {
    padding: '0 1.25rem 1.25rem 1.25rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  sidebarBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  brandIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(56, 189, 248, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
    color: '#38bdf8',
  },
  sidebarNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '1rem 0.75rem',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0.7rem 0.9rem',
    borderRadius: '10px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '0.88rem',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  navItemActive: {
    background: 'rgba(56, 189, 248, 0.12)',
    color: '#38bdf8',
    fontWeight: '700',
  },
  badgeMini: {
    fontSize: '0.7rem',
    background: 'rgba(56, 189, 248, 0.2)',
    color: '#38bdf8',
    padding: '2px 6px',
    borderRadius: '10px',
  },
  sidebarFooter: {
    padding: '1rem 1.25rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
  },
  clusterStatusCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '10px',
    padding: '0.75rem',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  pulseGreen: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 8px #10b981',
  },
  mainContent: {
    flex: 1,
    padding: '2rem 2.5rem',
    overflowY: 'auto',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  pageTitle: {
    margin: 0,
    fontSize: '1.6rem',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '-0.02em',
  },
  pageDesc: {
    margin: '4px 0 0 0',
    fontSize: '0.88rem',
    color: '#94a3b8',
  },
  btnActionPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    border: 'none',
    color: '#ffffff',
    padding: '0.65rem 1.2rem',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: '0.86rem',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
  },
  btnActionSecondary: {
    display: 'flex',
    alignItems: 'center',
    background: '#1e293b',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#f8fafc',
    padding: '0.55rem 1rem',
    borderRadius: '8px',
    fontSize: '0.84rem',
    fontWeight: '600',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1.25rem',
    marginBottom: '2rem',
  },
  kpiCard: {
    background: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  kpiLabel: {
    fontSize: '0.82rem',
    fontWeight: '600',
    color: '#94a3b8',
  },
  kpiValueRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#ffffff',
  },
  kpiFoot: {
    fontSize: '0.74rem',
    color: '#64748b',
  },
  sectionContainer: {
    background: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '1.5rem',
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  cardTitle: {
    margin: 0,
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  cardSubtitle: {
    margin: '3px 0 0 0',
    fontSize: '0.84rem',
    color: '#94a3b8',
  },
  badgeSuccess: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#10b981',
    background: 'rgba(16, 185, 129, 0.12)',
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid rgba(16, 185, 129, 0.25)',
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
  },
  svcCard: {
    background: '#131d33',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    padding: '1.1rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '10px',
  },
  svcTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  svcPort: {
    fontSize: '0.72rem',
    fontWeight: '700',
    color: '#38bdf8',
    background: 'rgba(56, 189, 248, 0.1)',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  statusChip: {
    fontSize: '0.72rem',
    fontWeight: '800',
    padding: '3px 8px',
    borderRadius: '12px',
  },
  svcTitle: {
    margin: 0,
    fontSize: '0.96rem',
    fontWeight: '700',
    color: '#f8fafc',
  },
  svcDescText: {
    margin: 0,
    fontSize: '0.8rem',
    color: '#94a3b8',
    lineHeight: '1.4',
  },
  svcBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '0.65rem',
  },
  svcTechCode: {
    fontSize: '0.72rem',
    color: '#64748b',
    maxWidth: '190px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  svcLatencyText: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#10b981',
  },
  simButtonsRow: {
    display: 'flex',
    gap: '8px',
  },
  btnSimAction: {
    background: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    color: '#38bdf8',
    padding: '0.45rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  terminalContainer: {
    background: '#040711',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  terminalBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.65rem 1rem',
    background: '#0d1322',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  terminalLogs: {
    padding: '1rem',
    maxHeight: '260px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '0.82rem',
    fontFamily: 'monospace',
  },
  terminalRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  customTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.86rem',
    textAlign: 'left',
  },
  rankPill: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '0.78rem',
  },
  categoryChip: {
    fontSize: '0.72rem',
    fontWeight: '700',
    color: '#38bdf8',
    background: 'rgba(56, 189, 248, 0.1)',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  twoColGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
  },
  infoBox: {
    background: '#131d33',
    borderRadius: '12px',
    padding: '1.25rem',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  nodeCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.85rem',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
  },
  queueCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    fontSize: '0.85rem',
  },
};

export default CloudOpsView;
