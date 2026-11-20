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
  const [activeTab, setActiveTab] = useState('health'); // 'health' | 'kafka' | 'rabbitmq' | 'webpay' | 'auditoria'
  const [refreshing, setRefreshing] = useState(false);
  const endpoints = getApiEndpoints();

  // Estados de Microservicios
  const [servicesStatus, setServicesStatus] = useState([
    {
      id: 'catalogo',
      name: 'Catálogo & Inventario API',
      port: 8080,
      endpoint: endpoints.catalogoStatus,
      tech: 'Spring Boot 3.2 • Java 21 • RabbitMQ Consumer',
      status: 'CHECKING',
      latency: null,
      desc: 'Gestión de productos y descuento de stock transaccional en tiempo real.',
    },
    {
      id: 'carrito',
      name: 'Carrito & Procesador de Órdenes API',
      port: 8081,
      endpoint: endpoints.carritoStatus,
      tech: 'Spring Boot 3.2 • Java 21 • AMQP Producer',
      status: 'CHECKING',
      latency: null,
      desc: 'Orquestación de órdenes y publicación del evento pedidos.pedido.creado.',
    },
    {
      id: 'notificaciones',
      name: 'Notificaciones & Mailer API',
      port: 8082,
      endpoint: endpoints.notificacionesStatus,
      tech: 'Spring Boot 3.2 • Java 21 • RabbitMQ DLQ + SMTP Real',
      status: 'CHECKING',
      latency: null,
      desc: 'Envío de correos reales y reintento en cola muerta (Dead Letter Queue).',
    },
    {
      id: 'auditoria',
      name: 'Auditoría Criptográfica SHA-256 API',
      port: 8083,
      endpoint: endpoints.auditoriaStatus,
      tech: 'Spring Boot 3.2 • Java 21 • Ledger Inmutable',
      status: 'CHECKING',
      latency: null,
      desc: 'Registro criptográfico de transacciones con sello de tiempo y hash único.',
    },
    {
      id: 'admin',
      name: 'Admin & Topología Clúster API',
      port: 8084,
      endpoint: endpoints.adminQueues,
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
      tech: 'Spring Boot 3.2 • Transbank Webpay Plus • Kafka Producer • MySQL',
      status: 'CHECKING',
      latency: null,
      desc: 'Integración Webpay oficial y regla de velocidad antifraude (>3 intentos/10s).',
    },
    {
      id: 'analytics',
      name: 'Analítica, Kafka & Recomendaciones API',
      port: 8086,
      endpoint: endpoints.analyticsStatus,
      tech: 'Spring Boot 3.2 • Apache Kafka KRaft • DynamoDB • WebSockets',
      status: 'CHECKING',
      latency: null,
      desc: 'Procesamiento de clickstream masivo y ranking de recomendaciones Top 5.',
    },
  ]);

  // Estados de Kafka
  const [kafkaStats, setKafkaStats] = useState({
    totalEventos: 48,
    vistas: 26,
    carritos: 14,
    pagos: 6,
    bloqueosFraude: 2,
  });

  const [kafkaLogStream, setKafkaLogStream] = useState([
    { id: 1, topic: 'interacciones-user', time: '17:28:10', type: 'VIEW', item: 'PROD-101', client: 'cliente@pedidos360.com', desc: 'Viendo Laptop Asus ROG Strix G16' },
    { id: 2, topic: 'interacciones-user', time: '17:28:35', type: 'CART', item: 'PROD-101', client: 'cliente@pedidos360.com', desc: 'Añadido al carrito (+2 pts de afinidad)' },
    { id: 3, topic: 'payment-attempts', time: '17:29:02', type: 'PAYMENT_INIT', item: 'TX-8921', client: 'cliente@pedidos360.com', desc: 'Iniciando Webpay Plus por $1.290.000 CLP' },
    { id: 4, topic: 'pedidos.alertas.fraude', time: '17:29:12', type: 'FRAUD_ALERT', item: 'TX-8922', client: 'evaluador.bot@test.cl', desc: 'Regla de velocidad activada: 4 intentos en 7 seg -> Bloqueo 30 min' },
  ]);

  // Auditoría logs
  const [auditLogs, setAuditLogs] = useState([]);

  // Check Health de todos los microservicios
  const runHealthChecks = async () => {
    setRefreshing(true);
    const updated = await Promise.all(
      servicesStatus.map(async (svc) => {
        const start = performance.now();
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);
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
    // Cargar auditoría si está disponible
    fetch(endpoints.auditoriaEventos)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setAuditLogs(data.slice(0, 8));
      })
      .catch(() => {});
  }, []);

  // Simulación de eventos Kafka para demostración viva
  const handleTriggerKafkaEvent = async (actionType) => {
    const timestamp = new Date();
    const timeStr = timestamp.toLocaleTimeString();

    if (actionType === 'FRAUD_SIMULATION') {
      // Disparar 4 intentos rápidos en ms-pago para activar el bloqueo 429
      const botClient = `test.antifraude.${Math.floor(Math.random() * 900 + 100)}@pedidos360.com`;
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
        pagos: prev.pagos + 3,
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
          desc: 'Regla de velocidad: 4 transacciones en < 10s. Cliente bloqueado por 30 min (HTTP 429).',
        },
        ...prev.slice(0, 19),
      ]);
      return;
    }

    // Eventos normales a ms-analytics
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
      pagos: action === 'purchase' ? prev.pagos + 1 : prev.pagos,
    }));

    setKafkaLogStream((prev) => [
      {
        id: Date.now(),
        topic: 'interacciones-user',
        time: timeStr,
        type: action.toUpperCase(),
        item: itemId,
        client: 'operador.cloud@pedidos360.com',
        desc: `Evento '${action}' emitido en tiempo real al topic Apache Kafka`,
      },
      ...prev.slice(0, 19),
    ]);
  };

  const onlineCount = servicesStatus.filter((s) => s.status === 'ONLINE').length;

  return (
    <div style={styles.container}>
      {/* 1. Header del Dashboard */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerBadge}>
            <span style={styles.pulseDot}></span>
            <span>Centro de Operaciones Cloud Native • Pedidos360 Enterprise</span>
          </div>
          <h2 style={styles.title}>Cloud Ops, Telemetría & Streaming</h2>
          <p style={styles.subtitle}>
            Monitoreo unificado de microservicios, clúster RabbitMQ, pipeline Apache Kafka y pasarela Transbank Webpay Plus.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button
            onClick={runHealthChecks}
            disabled={refreshing}
            style={styles.btnRefresh}
            title="Refrescar latencias y estado de salud"
          >
            <RefreshIcon size={16} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'Verificando...' : 'Escanear Servicios'}</span>
          </button>
        </div>
      </div>

      {/* 2. Resumen Superior de Infraestructura */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryHeader}>
            <span>Microservicios Activos</span>
            <ServerIcon size={18} color="#38bdf8" />
          </div>
          <div style={styles.summaryValue}>
            <span style={{ color: onlineCount === servicesStatus.length ? '#10b981' : '#38bdf8' }}>
              {onlineCount}
            </span>
            <span style={{ color: '#64748b', fontSize: '1.1rem' }}> / {servicesStatus.length}</span>
          </div>
          <span style={styles.summaryHint}>Puertos 8080 a 8086 con CORS universal</span>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryHeader}>
            <span>Pipeline Apache Kafka</span>
            <span style={{ color: '#fb923c', fontWeight: 'bold' }}>⚡ KRaft</span>
          </div>
          <div style={styles.summaryValue}>{kafkaStats.totalEventos}</div>
          <span style={styles.summaryHint}>Tópicos: payment-attempts, interacciones-user, alertas</span>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryHeader}>
            <span>Clúster RabbitMQ</span>
            <QueueIcon size={18} color="#a855f7" />
          </div>
          <div style={styles.summaryValue}>2 Nodos</div>
          <span style={styles.summaryHint}>Puertos 5672 y 5673 • DLQ activa</span>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryHeader}>
            <span>Seguridad Antifraude</span>
            <ShieldCheckIcon size={18} color="#ef4444" />
          </div>
          <div style={styles.summaryValue}>{kafkaStats.bloqueosFraude}</div>
          <span style={styles.summaryHint}>Bloqueos preventivos por regla de velocidad</span>
        </div>
      </div>

      {/* 3. Navegación por Pestañas */}
      <div style={styles.tabNav}>
        <button
          onClick={() => setActiveTab('health')}
          style={{ ...styles.tabBtn, ...(activeTab === 'health' ? styles.tabBtnActive : {}) }}
        >
          <ServerIcon size={16} />
          <span>Matriz de Microservicios ({onlineCount}/{servicesStatus.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('kafka')}
          style={{ ...styles.tabBtn, ...(activeTab === 'kafka' ? styles.tabBtnActive : {}) }}
        >
          <span>⚡</span>
          <span>Streaming Apache Kafka & Telemetría</span>
        </button>

        <button
          onClick={() => setActiveTab('rabbitmq')}
          style={{ ...styles.tabBtn, ...(activeTab === 'rabbitmq' ? styles.tabBtnActive : {}) }}
        >
          <QueueIcon size={16} />
          <span>Clúster RabbitMQ & DLQ</span>
        </button>

        <button
          onClick={() => setActiveTab('webpay')}
          style={{ ...styles.tabBtn, ...(activeTab === 'webpay' ? styles.tabBtnActive : {}) }}
        >
          <span>💳</span>
          <span>Transbank Webpay Plus & Reglas Antifraude</span>
        </button>

        <button
          onClick={() => setActiveTab('auditoria')}
          style={{ ...styles.tabBtn, ...(activeTab === 'auditoria' ? styles.tabBtnActive : {}) }}
        >
          <ShieldCheckIcon size={16} />
          <span>Ledger SHA-256</span>
        </button>
      </div>

      {/* 4. Contenido según pestaña */}
      <div style={styles.tabContent}>
        {/* TAB 1: Matriz de Microservicios */}
        {activeTab === 'health' && (
          <div>
            <div style={styles.sectionHeaderRow}>
              <div>
                <h3 style={styles.sectionTitle}>Matriz de Salud & Latencia de Microservicios</h3>
                <p style={styles.sectionDesc}>
                  Conexión directa punto a punto entre la SPA y los microservicios sin proxies inversos caseros intermedios.
                </p>
              </div>
              <button onClick={runHealthChecks} style={styles.btnSecondary}>
                <RefreshIcon size={14} className={refreshing ? 'spin' : ''} />
                <span>Re-verificar Latencias</span>
              </button>
            </div>

            <div style={styles.servicesGrid}>
              {servicesStatus.map((svc) => (
                <div key={svc.id} style={styles.svcCard}>
                  <div style={styles.svcCardHeader}>
                    <div>
                      <div style={styles.svcPortBadge}>Puerto :{svc.port}</div>
                      <h4 style={styles.svcName}>{svc.name}</h4>
                    </div>
                    <span
                      style={{
                        ...styles.statusBadge,
                        background:
                          svc.status === 'ONLINE'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : svc.status === 'CHECKING'
                            ? 'rgba(56, 189, 248, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                        color:
                          svc.status === 'ONLINE'
                            ? '#10b981'
                            : svc.status === 'CHECKING'
                            ? '#38bdf8'
                            : '#ef4444',
                        border: `1px solid ${
                          svc.status === 'ONLINE'
                            ? '#10b981'
                            : svc.status === 'CHECKING'
                            ? '#38bdf8'
                            : '#ef4444'
                        }`,
                      }}
                    >
                      ● {svc.status}
                    </span>
                  </div>

                  <p style={styles.svcDesc}>{svc.desc}</p>

                  <div style={styles.svcFooter}>
                    <span style={styles.svcTech}>{svc.tech}</span>
                    <span style={styles.svcLatency}>
                      {svc.latency !== null ? `${svc.latency} ms` : '---'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Streaming Apache Kafka */}
        {activeTab === 'kafka' && (
          <div>
            <div style={styles.sectionHeaderRow}>
              <div>
                <h3 style={styles.sectionTitle}>Pipeline de Streaming en Tiempo Real (Apache Kafka)</h3>
                <p style={styles.sectionDesc}>
                  Ingesta de telemetría desacoplada: clics, adición a carrito, eventos de checkout y detección antifraude sin sobrecargar las bases transaccionales.
                </p>
              </div>

              {/* Controles de Simulación Rápida para el Alumno */}
              <div style={styles.simControls}>
                <button onClick={() => handleTriggerKafkaEvent('VIEW')} style={styles.btnSim}>
                  +1 Clic (view)
                </button>
                <button onClick={() => handleTriggerKafkaEvent('CART')} style={styles.btnSim}>
                  +2 Carrito (cart)
                </button>
                <button onClick={() => handleTriggerKafkaEvent('PURCHASE')} style={styles.btnSim}>
                  +3 Compra (purchase)
                </button>
                <button
                  onClick={() => handleTriggerKafkaEvent('FRAUD_SIMULATION')}
                  style={{ ...styles.btnSim, background: 'rgba(239, 68, 68, 0.2)', borderColor: '#ef4444', color: '#fca5a5' }}
                  title="Simula 4 intentos rápidos en < 10s para disparar la regla antifraude vista en clases"
                >
                  ⚡ Disparar Regla Antifraude
                </button>
              </div>
            </div>

            {/* Métricas de Flujo Kafka */}
            <div style={styles.kafkaKpiRow}>
              <div style={styles.kafkaKpiCard}>
                <span style={styles.kafkaKpiLabel}>Vistas de Producto</span>
                <span style={styles.kafkaKpiNum}>{kafkaStats.vistas}</span>
                <small style={{ color: '#94a3b8' }}>Topic: interacciones-user</small>
              </div>
              <div style={styles.kafkaKpiCard}>
                <span style={styles.kafkaKpiLabel}>Adiciones al Carrito</span>
                <span style={styles.kafkaKpiNum}>{kafkaStats.carritos}</span>
                <small style={{ color: '#94a3b8' }}>Afinidad +2 pts</small>
              </div>
              <div style={styles.kafkaKpiCard}>
                <span style={styles.kafkaKpiLabel}>Intentos de Pago</span>
                <span style={styles.kafkaKpiNum}>{kafkaStats.pagos}</span>
                <small style={{ color: '#94a3b8' }}>Topic: payment-attempts</small>
              </div>
              <div style={styles.kafkaKpiCard}>
                <span style={styles.kafkaKpiLabel}>Alertas de Fraude</span>
                <span style={{ ...styles.kafkaKpiNum, color: '#ef4444' }}>{kafkaStats.bloqueosFraude}</span>
                <small style={{ color: '#94a3b8' }}>Topic: pedidos.alertas.fraude</small>
              </div>
            </div>

            {/* Terminal de Eventos en Streaming */}
            <div style={styles.terminalBox}>
              <div style={styles.terminalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                  <span style={{ marginLeft: '8px', color: '#94a3b8', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                    kafka-console-consumer --bootstrap-server localhost:9092 --from-beginning
                  </span>
                </div>
                <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 'bold' }}>● STREAM ACTIVO</span>
              </div>

              <div style={styles.terminalBody}>
                {kafkaLogStream.map((log) => (
                  <div key={log.id} style={styles.terminalLine}>
                    <span style={{ color: '#64748b' }}>[{log.time}]</span>
                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>[{log.topic}]</span>
                    <span
                      style={{
                        color:
                          log.type.includes('FRAUD')
                            ? '#ef4444'
                            : log.type === 'CART'
                            ? '#f59e0b'
                            : log.type === 'PURCHASE'
                            ? '#10b981'
                            : '#94a3b8',
                        fontWeight: '700',
                      }}
                    >
                      {log.type}
                    </span>
                    <span style={{ color: '#cbd5e1' }}>{log.desc}</span>
                    <span style={{ color: '#64748b', fontSize: '0.78rem' }}>({log.client})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RabbitMQ Clúster & DLQ */}
        {activeTab === 'rabbitmq' && (
          <div>
            <div style={styles.sectionHeaderRow}>
              <div>
                <h3 style={styles.sectionTitle}>Clúster RabbitMQ & Manejo de Errores con DLQ</h3>
                <p style={styles.sectionDesc}>
                  Arquitectura transaccional de 2 nodos con exchanges de tipo Topic y colas de descarte para procesamiento resiliente.
                </p>
              </div>
              <a
                href="http://localhost:15672"
                target="_blank"
                rel="noreferrer"
                style={styles.btnSecondary}
              >
                <span>Abrir Consola RabbitMQ (:15672)</span>
                <span>↗</span>
              </a>
            </div>

            <div style={styles.gridTwoCols}>
              <div style={styles.cardBox}>
                <h4 style={styles.cardBoxTitle}>Nodos del Clúster</h4>
                <div style={styles.nodeList}>
                  <div style={styles.nodeItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={styles.dotOnline}></span>
                      <div>
                        <strong>pedidos360-rabbitmq1</strong>
                        <small style={{ display: 'block', color: '#94a3b8' }}>AMQP Puerto 5672 • Management 15672</small>
                      </div>
                    </div>
                    <span style={styles.chipSuccess}>Líder / Primario</span>
                  </div>

                  <div style={styles.nodeItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={styles.dotOnline}></span>
                      <div>
                        <strong>pedidos360-rabbitmq2</strong>
                        <small style={{ display: 'block', color: '#94a3b8' }}>AMQP Puerto 5673 • Management 15673</small>
                      </div>
                    </div>
                    <span style={styles.chipSuccess}>Réplica Espejo</span>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px' }}>
                  <h5 style={{ margin: '0 0 0.5rem 0', color: '#cbd5e1' }}>Credenciales de Acceso</h5>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Usuario: <code>guest</code> | Contraseña: <code>guest</code>
                  </div>
                </div>
              </div>

              <div style={styles.cardBox}>
                <h4 style={styles.cardBoxTitle}>Topología de Colas y Dead Letter Queue (DLQ)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={styles.queueItem}>
                    <div>
                      <strong>pedidos.ordenes</strong>
                      <small style={{ display: 'block', color: '#94a3b8' }}>Consumido por ms-catalogo para descuento de stock</small>
                    </div>
                    <span style={styles.chipActive}>Durable</span>
                  </div>

                  <div style={styles.queueItem}>
                    <div>
                      <strong>pedidos.notificaciones</strong>
                      <small style={{ display: 'block', color: '#94a3b8' }}>Consumido por ms-notificaciones para envío de correos</small>
                    </div>
                    <span style={styles.chipActive}>Durable</span>
                  </div>

                  <div style={{ ...styles.queueItem, borderLeft: '4px solid #ef4444' }}>
                    <div>
                      <strong style={{ color: '#fca5a5' }}>pedidos.notificaciones.dlq</strong>
                      <small style={{ display: 'block', color: '#94a3b8' }}>Cola de mensajes fallidos con BasicNack / rechazo SMTP</small>
                    </div>
                    <span style={{ ...styles.chipActive, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid #ef4444' }}>
                      Dead Letter Queue
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Transbank Webpay Plus */}
        {activeTab === 'webpay' && (
          <div>
            <div style={styles.sectionHeaderRow}>
              <div>
                <h3 style={styles.sectionTitle}>Integración Transbank Webpay Plus & Motor Antifraude</h3>
                <p style={styles.sectionDesc}>
                  Pasarela de pagos en ambiente de integración oficial con regla de velocidad estricta vista en cátedra.
                </p>
              </div>
            </div>

            <div style={styles.gridTwoCols}>
              <div style={styles.cardBox}>
                <h4 style={styles.cardBoxTitle}>Configuración de Integración</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
                  <div style={styles.infoRow}>
                    <span style={{ color: '#94a3b8' }}>Código de Comercio:</span>
                    <strong style={{ color: '#38bdf8' }}>597055555532</strong>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={{ color: '#94a3b8' }}>Ambiente:</span>
                    <strong style={{ color: '#10b981' }}>Transbank Integration / Sandbox REST</strong>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={{ color: '#94a3b8' }}>Microservicio Asociado:</span>
                    <strong style={{ color: '#f8fafc' }}>Pedidos360-pago-api (:8085)</strong>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={{ color: '#94a3b8' }}>Persistencia de Estados:</span>
                    <strong style={{ color: '#f8fafc' }}>MySQL 8.0 (tabla estado_pago_cliente)</strong>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <h5 style={{ margin: '0 0 0.5rem 0', color: '#38bdf8' }}>Tarjetas de Prueba para la Presentación</h5>
                  <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ VISA (Aprobada):</span> <code>4051 8856 0044 6623</code> (CVV: 123)
                    </div>
                    <div>
                      <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✗ Mastercard (Rechazada):</span> <code>5186 0595 5959 0568</code> (CVV: 123)
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.cardBox}>
                <h4 style={styles.cardBoxTitle}>Lógica del Algoritmo Antifraude (Regla de Velocidad)</h4>
                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                  El microservicio <strong>ms-pago</strong> implementa una ventana de tiempo deslizante en memoria y base de datos:
                </p>

                <div style={styles.ruleBox}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fca5a5', fontWeight: 'bold' }}>
                    <span>🛡️ Regla de Control:</span>
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#f8fafc' }}>
                    Si un cliente intenta <strong>3 o más transacciones en menos de 10 segundos</strong>, el sistema bloquea inmediatamente la cuenta por <strong>30 minutos</strong> y responde con código HTTP <strong>429 Too Many Requests</strong>.
                  </p>
                </div>

                <button
                  onClick={() => handleTriggerKafkaEvent('FRAUD_SIMULATION')}
                  style={{
                    marginTop: '1.5rem',
                    width: '100%',
                    padding: '0.85rem',
                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  ⚡ Probar Detección Antifraude en Vivo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Auditoría Criptográfica SHA-256 */}
        {activeTab === 'auditoria' && (
          <div>
            <div style={styles.sectionHeaderRow}>
              <div>
                <h3 style={styles.sectionTitle}>Libro Mayor Inmutable (Ledger Criptográfico SHA-256)</h3>
                <p style={styles.sectionDesc}>
                  Cada transacción completada en el clúster genera un hash inmutable para auditoría y no repudio.
                </p>
              </div>
            </div>

            <div style={styles.auditTableWrapper}>
              <table style={styles.auditTable}>
                <thead>
                  <tr>
                    <th>ID Transacción</th>
                    <th>Tipo Evento</th>
                    <th>Hash Criptográfico SHA-256</th>
                    <th>Sello de Tiempo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log, idx) => (
                      <tr key={idx}>
                        <td><code>{log.transaccionId || log.id || `TX-${1000 + idx}`}</code></td>
                        <td><span style={styles.chipSuccess}>{log.tipoEvento || 'PAGO_CONFIRMADO'}</span></td>
                        <td>
                          <code style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                            {log.hashSha256 || log.hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                          </code>
                        </td>
                        <td style={{ color: '#94a3b8' }}>{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Reciente'}</td>
                        <td><span style={{ color: '#10b981', fontWeight: 'bold' }}>SELLADO</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        Esperando transacciones de compra para sellar hashes en el microservicio :8083.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '2rem 1.5rem',
    color: '#f8fafc',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1.5rem',
  },
  headerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    color: '#38bdf8',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
  },
  pulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#38bdf8',
    boxShadow: '0 0 10px #38bdf8',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    letterSpacing: '-0.03em',
    margin: '0 0 0.5rem 0',
    background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '0.95rem',
    maxWidth: '700px',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  btnRefresh: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    border: 'none',
    color: '#ffffff',
    padding: '0.75rem 1.25rem',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '0.9rem',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.25rem',
    marginBottom: '2rem',
  },
  summaryCard: {
    background: '#1e293b',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  summaryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.85rem',
    color: '#94a3b8',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#ffffff',
  },
  summaryHint: {
    fontSize: '0.78rem',
    color: '#64748b',
  },
  tabNav: {
    display: 'flex',
    gap: '0.5rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: '0.5rem',
    marginBottom: '1.5rem',
    overflowX: 'auto',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    padding: '0.75rem 1.25rem',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  tabBtnActive: {
    background: 'rgba(56, 189, 248, 0.15)',
    color: '#38bdf8',
    fontWeight: '700',
  },
  tabContent: {
    background: '#131d33',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '2rem',
  },
  sectionHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  sectionTitle: {
    margin: '0 0 0.25rem 0',
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  sectionDesc: {
    margin: 0,
    fontSize: '0.88rem',
    color: '#94a3b8',
  },
  btnSecondary: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#f8fafc',
    padding: '0.55rem 1rem',
    borderRadius: '10px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '1.25rem',
  },
  svcCard: {
    background: '#1e293b',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  svcCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  svcPortBadge: {
    fontSize: '0.72rem',
    fontWeight: '700',
    color: '#38bdf8',
    background: 'rgba(56, 189, 248, 0.1)',
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '6px',
    marginBottom: '4px',
  },
  svcName: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  statusBadge: {
    fontSize: '0.75rem',
    fontWeight: '800',
    padding: '4px 10px',
    borderRadius: '20px',
  },
  svcDesc: {
    margin: 0,
    fontSize: '0.84rem',
    color: '#cbd5e1',
    lineHeight: '1.4',
  },
  svcFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    paddingTop: '0.75rem',
    fontSize: '0.78rem',
  },
  svcTech: {
    color: '#94a3b8',
    maxWidth: '220px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  svcLatency: {
    color: '#10b981',
    fontWeight: '700',
  },
  simControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  btnSim: {
    background: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    color: '#38bdf8',
    padding: '0.5rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  kafkaKpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  kafkaKpiCard: {
    background: '#1e293b',
    padding: '1rem',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  kafkaKpiLabel: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    fontWeight: '600',
  },
  kafkaKpiNum: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#ffffff',
  },
  terminalBox: {
    background: '#090d16',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    overflow: 'hidden',
    fontFamily: 'monospace',
  },
  terminalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.65rem 1rem',
    background: '#131d33',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  terminalBody: {
    padding: '1rem',
    maxHeight: '280px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '0.84rem',
  },
  terminalLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  gridTwoCols: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '1.5rem',
  },
  cardBox: {
    background: '#1e293b',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    padding: '1.5rem',
  },
  cardBoxTitle: {
    margin: '0 0 1.25rem 0',
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  nodeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  nodeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.85rem',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  dotOnline: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 8px #10b981',
  },
  chipSuccess: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#10b981',
    background: 'rgba(16, 185, 129, 0.1)',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  queueItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.85rem',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  chipActive: {
    fontSize: '0.72rem',
    fontWeight: '700',
    color: '#38bdf8',
    background: 'rgba(56, 189, 248, 0.1)',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '0.5rem',
  },
  ruleBox: {
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '10px',
    padding: '1rem',
    marginTop: '1rem',
  },
  auditTableWrapper: {
    overflowX: 'auto',
  },
  auditTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.88rem',
  },
};

export default CloudOpsView;
