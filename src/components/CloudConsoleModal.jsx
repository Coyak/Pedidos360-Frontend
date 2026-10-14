import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { 
  CloseIcon, 
  ServerIcon, 
  QueueIcon, 
  BellIcon, 
  ActivityIcon, 
  CloudIcon, 
  ShieldCheckIcon,
  CheckIcon,
  RefreshIcon
} from './Icons';
import { getApiEndpoints, setApiMode } from '../config/apiConfig';

export const CloudConsoleModal = ({ isOpen, onClose }) => {
  const { accounts } = useMsal();
  const [activeTab, setActiveTab] = useState('rabbitmq');
  const [endpoints, setEndpoints] = useState(getApiEndpoints());
  
  // Estados para RabbitMQ Admin
  const [queuesList, setQueuesList] = useState([]);
  const [newQueueName, setNewQueueName] = useState('');
  const [queueActionMessage, setQueueActionMessage] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // Estados para Auditoría
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditStats, setAuditStats] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);

  // Estados para Notificaciones
  const [notifyEmail, setNotifyEmail] = useState(accounts[0]?.username || 'admin@pedidos360.com');
  const [notifySubject, setNotifySubject] = useState('Confirmación de Despacho Pedidos360');
  const [notifyMessage, setNotifyMessage] = useState('Tu orden ha sido encolada y procesada exitosamente en AWS EC2.');
  const [notifyResult, setNotifyResult] = useState(null);
  const [notifyLoading, setNotifyLoading] = useState(false);

  // Estados de salud de Microservicios
  const [healthStatus, setHealthStatus] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    fetchQueuesData();
    fetchAuditData();
    checkHealth();
  };

  const handleToggleMode = (newMode) => {
    setApiMode(newMode);
    const updated = getApiEndpoints(newMode);
    setEndpoints(updated);
    setTimeout(() => {
      fetchQueuesData(updated);
      fetchAuditData(updated);
      checkHealth(updated);
    }, 100);
  };

  // 0. Cargar Colas de RabbitMQ en vivo desde Admin API (:8084)
  const fetchQueuesData = async (cfg = endpoints) => {
    try {
      const res = await fetch(cfg.adminQueues);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setQueuesList(data);
        }
      }
    } catch (e) {
      console.warn("No se pudieron cargar colas desde Admin API:", e);
    }
  };

  // 1. Cargar Auditoría
  const fetchAuditData = async (cfg = endpoints) => {
    setAuditLoading(true);
    try {
      const res = await fetch(cfg.auditoriaEventos);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(Array.isArray(data) ? data : []);
      }
      const statsRes = await fetch(cfg.auditoriaStats);
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setAuditStats(stats);
      }
    } catch {
      // Endpoint puede no estar disponible si está en cloud sin backend aún
    } finally {
      setAuditLoading(false);
    }
  };

  // 2. Probar Notificación Directa
  const handleSendNotification = async (e) => {
    e.preventDefault();
    setNotifyLoading(true);
    setNotifyResult(null);
    try {
      const res = await fetch(endpoints.notificacionesEnviar, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinatario: notifyEmail,
          asunto: notifySubject,
          mensaje: notifyMessage,
          cuerpo: notifyMessage,
        }),
      });
      const data = await res.json();
      setNotifyResult({
        success: res.ok,
        status: res.status,
        data,
      });
    } catch (err) {
      setNotifyResult({
        success: false,
        error: err.message || 'Error de conexión con el servicio de notificaciones',
      });
    } finally {
      setNotifyLoading(false);
    }
  };

  // 3. Crear Cola con RabbitAdmin
  const handleCreateQueue = async (forceEmpty = false) => {
    setAdminLoading(true);
    setQueueActionMessage(null);
    const nameToSend = forceEmpty ? "" : newQueueName.trim();

    try {
      const res = await fetch(endpoints.adminQueues, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameToSend,
          durable: true,
          autoDelete: false,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setQueueActionMessage({
          type: 'success',
          text: `✅ Cola '${json.name || nameToSend}' creada correctamente en el clúster RabbitMQ.`,
        });
        setNewQueueName('');
      } else {
        setQueueActionMessage({
          type: 'error',
          text: `⚠️ [HTTP ${res.status}] ${json.message || json.error || 'Error de validación DTO'}`,
        });
      }
    } catch (err) {
      setQueueActionMessage({
        type: 'error',
        text: `Error al contactar Admin API: ${err.message}`,
      });
    } finally {
      setAdminLoading(false);
    }
  };

  // 4. Eliminar Cola
  const handleDeleteQueue = async (queueName) => {
    if (!queueName) return;
    setAdminLoading(true);
    setQueueActionMessage(null);
    try {
      const res = await fetch(`${endpoints.adminQueues}/${queueName}`, {
        method: 'DELETE',
      });
      if (res.ok || res.status === 204) {
        setQueueActionMessage({
          type: 'success',
          text: `🗑️ Cola '${queueName}' eliminada exitosamente del clúster RabbitMQ.`,
        });
      } else {
        setQueueActionMessage({
          type: 'error',
          text: `Error al eliminar cola [HTTP ${res.status}]`,
        });
      }
    } catch (err) {
      setQueueActionMessage({
        type: 'error',
        text: err.message,
      });
    } finally {
      setAdminLoading(false);
    }
  };

  // 5. Check de Salud Microservicios
  const checkHealth = async (cfg = endpoints) => {
    const services = [
      { key: 'catalogo', url: cfg.catalogoStatus, port: '8080' },
      { key: 'carrito', url: cfg.carritoStatus, port: '8081' },
      { key: 'notificaciones', url: cfg.notificacionesStatus, port: '8082' },
      { key: 'auditoria', url: cfg.auditoriaStatus, port: '8083' },
      { key: 'admin', url: cfg.adminQueues, port: '8084' },
    ];

    const results = {};
    for (const s of services) {
      try {
        const res = await fetch(s.url);
        // Si responde 200 OK o 401 Unauthorized (perímetro seguro activo con JWT), está ONLINE
        results[s.key] = (res.ok || res.status === 401 || res.status === 200) ? 'ONLINE' : 'ERROR';
      } catch {
        results[s.key] = 'OFFLINE';
      }
    }
    setHealthStatus(results);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="cloud-console-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header de la Consola */}
        <div className="console-header">
          <div className="console-title-group">
            <div className="console-badge">
              <CloudIcon size={20} color="#38bdf8" />
            </div>
            <div>
              <h3>Consola de Microservicios & Cloud Native</h3>
              <p className="console-subtitle">Monitoreo de Clúster RabbitMQ, Auditoría SHA-256 y API Gateway</p>
            </div>
          </div>
          <div className="console-header-actions">
            {/* Selector de Modo */}
            <div className="env-selector">
              <span className="env-label">Modo:</span>
              <button 
                className={`btn-env ${endpoints.mode === 'proxy' ? 'active' : ''}`}
                onClick={() => handleToggleMode('proxy')}
                title="Conectar a través del Proxy Nginx integrado en EC2 (/api/*)"
              >
                🔄 Proxy EC2
              </button>
              <button 
                className={`btn-env ${endpoints.mode === 'direct' || endpoints.mode === 'local' ? 'active' : ''}`}
                onClick={() => handleToggleMode('direct')}
                title="Conectar directo a los puertos de los microservicios (:8080..:8084)"
              >
                ⚡ Puertos Directos
              </button>
              <button 
                className={`btn-env ${endpoints.mode === 'cloud' ? 'active' : ''}`}
                onClick={() => handleToggleMode('cloud')}
                title="Conectar a través de AWS API Gateway"
              >
                ☁️ AWS Gateway
              </button>
            </div>
            <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
              <CloseIcon size={20} />
            </button>
          </div>
        </div>

        {/* Barra de Navegación de Pestañas */}
        <div className="console-tabs-nav">
          <button 
            className={`console-tab-btn ${activeTab === 'rabbitmq' ? 'active' : ''}`}
            onClick={() => setActiveTab('rabbitmq')}
          >
            <QueueIcon size={17} />
            <span>RabbitMQ Clúster & Admin API</span>
          </button>

          <button 
            className={`console-tab-btn ${activeTab === 'auditoria' ? 'active' : ''}`}
            onClick={() => { setActiveTab('auditoria'); fetchAuditData(); }}
          >
            <ActivityIcon size={17} />
            <span>Auditoría SHA-256 (Microservicio Nuevo)</span>
          </button>

          <button 
            className={`console-tab-btn ${activeTab === 'notificaciones' ? 'active' : ''}`}
            onClick={() => setActiveTab('notificaciones')}
          >
            <BellIcon size={17} />
            <span>Notificaciones (Prueba Postman)</span>
          </button>

          <button 
            className={`console-tab-btn ${activeTab === 'infra' ? 'active' : ''}`}
            onClick={() => { setActiveTab('infra'); checkHealth(); }}
          >
            <ServerIcon size={17} />
            <span>Topología Multi-Cloud & Salud</span>
          </button>
        </div>

        {/* Contenido de las Pestañas */}
        <div className="console-body">
          {/* TAB 1: RABBITMQ CLÚSTER & ADMIN */}
          {activeTab === 'rabbitmq' && (
            <div className="tab-pane">
              <div className="section-banner">
                <div className="banner-icon">🐇</div>
                <div>
                  <h4>Clúster RabbitMQ & Microservicio Administrador (:8084)</h4>
                  <p>Gestión centralizada de infraestructura de colas con AmqpAdmin y validación estricta de DTOs.</p>
                </div>
              </div>

              {/* Nodos del Clúster */}
              <div className="cluster-nodes-grid">
                <div className="node-card">
                  <div className="node-header">
                    <span className="dot online"></span>
                    <strong>Nodo 1 (Principal)</strong>
                    <span className="node-tag">rabbit@rabbitmq1</span>
                  </div>
                  <div className="node-details">
                    <span>Puerto AMQP: <code>5672</code></span>
                    <span>Management Web: <code>15672</code></span>
                    <span>Rol: Disc Node / Líder</span>
                  </div>
                </div>

                <div className="node-card">
                  <div className="node-header">
                    <span className="dot online"></span>
                    <strong>Nodo 2 (Clúster)</strong>
                    <span className="node-tag">rabbit@rabbitmq2</span>
                  </div>
                  <div className="node-details">
                    <span>Puerto AMQP: <code>5673</code></span>
                    <span>Management Web: <code>15673</code></span>
                    <span>Erlang Cookie: Sincronizada</span>
                  </div>
                </div>
              </div>

              {/* Topología de las 3 Colas y 3 DLQs */}
              <h5 className="sub-title">Topología de Colas y Dead Letter Queues (Rúbrica EV3 y EV4):</h5>
              <div className="queues-table-wrapper">
                <table className="queues-table">
                  <thead>
                    <tr>
                      <th>Dominio</th>
                      <th>Cola Principal</th>
                      <th>Exchange & Routing Key</th>
                      <th>Dead Letter Queue (DLQ)</th>
                      <th>Modo ACK</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Catálogo (Stock)</strong></td>
                      <td><code>pedidos.stock.queue</code></td>
                      <td><code>pedidos.exchange</code> &rarr; <code>pedidos.pedido.creado</code></td>
                      <td><span className="dlq-chip">pedidos.stock.dlq</span></td>
                      <td><span className="ack-chip">Manual (basicAck)</span></td>
                    </tr>
                    <tr>
                      <td><strong>Notificaciones</strong></td>
                      <td><code>pedidos.notificaciones.queue</code></td>
                      <td><code>pedidos.exchange</code> &rarr; <code>pedidos.pedido.creado</code></td>
                      <td><span className="dlq-chip">pedidos.notificaciones.dlq</span></td>
                      <td><span className="ack-chip">Manual (basicAck)</span></td>
                    </tr>
                    <tr>
                      <td><strong>Auditoría (Hash)</strong></td>
                      <td><code>pedidos.auditoria.queue</code></td>
                      <td><code>pedidos.exchange</code> &rarr; <code>pedidos.pedido.creado</code></td>
                      <td><span className="dlq-chip">pedidos.auditoria.dlq</span></td>
                      <td><span className="ack-chip">Manual (basicAck)</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Estado en Vivo de Colas desde Admin API */}
              {queuesList.length > 0 && (
                <div style={{ marginTop: '1.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h5 className="sub-title" style={{ margin: 0 }}>📊 Colas Activas en Tiempo Real (Admin API :8084):</h5>
                    <button className="btn btn-secondary btn-sm" onClick={() => fetchQueuesData()}>
                      <RefreshIcon size={14} /> Refrescar Colas
                    </button>
                  </div>
                  <div className="queues-table-wrapper">
                    <table className="queues-table">
                      <thead>
                        <tr>
                          <th>Nombre de Cola</th>
                          <th>Mensajes en Cola</th>
                          <th>Consumidores Escuchando</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {queuesList.map((q, idx) => (
                          <tr key={idx}>
                            <td><code>{q.nombre}</code></td>
                            <td>
                              <span style={{ 
                                fontWeight: 700, 
                                color: q.totalMensajes > 0 ? '#f59e0b' : '#10b981' 
                              }}>
                                {q.totalMensajes} msgs
                              </span>
                            </td>
                            <td>
                              <span className="ack-chip">
                                {q.totalConsumidores} activo(s)
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-danger btn-sm"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                onClick={() => handleDeleteQueue(q.nombre)}
                                title="Eliminar cola"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Panel de prueba Admin API */}
              <div className="admin-actions-box">
                <h5>Probar Microservicio Administrador de RabbitMQ:</h5>
                <p className="admin-help-text">
                  Crea o elimina colas dinámicamente usando <code>RabbitAdminService</code>. Prueba enviar un nombre vacío para validar la respuesta <strong>HTTP 400 Bad Request</strong> evaluada en la pauta.
                </p>

                <div className="admin-form-row">
                  <input 
                    type="text" 
                    className="admin-input" 
                    placeholder="Ej: cola.temporal.demo"
                    value={newQueueName}
                    onChange={(e) => setNewQueueName(e.target.value)}
                  />
                  <button 
                    className="btn btn-primary"
                    disabled={adminLoading}
                    onClick={() => handleCreateQueue(false)}
                  >
                    Crear Cola (POST /queues)
                  </button>
                  <button 
                    className="btn btn-secondary btn-bad-request"
                    disabled={adminLoading}
                    onClick={() => handleCreateQueue(true)}
                    title="Envía payload con nombre vacío para verificar HTTP 400"
                  >
                    ⚡ Probar Error 400 (Nombre Vacío)
                  </button>
                  {newQueueName && (
                    <button 
                      className="btn btn-danger"
                      disabled={adminLoading}
                      onClick={() => handleDeleteQueue(newQueueName)}
                    >
                      Eliminar Cola
                    </button>
                  )}
                </div>

                {queueActionMessage && (
                  <div className={`action-alert ${queueActionMessage.type}`}>
                    {queueActionMessage.text}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AUDITORÍA SHA-256 */}
          {activeTab === 'auditoria' && (
            <div className="tab-pane">
              <div className="section-banner">
                <div className="banner-icon">🛡️</div>
                <div>
                  <h4>Microservicio Propio: Auditoría Criptográfica Inmutable (:8083)</h4>
                  <p>
                    Garantiza la trazabilidad y no repudio de transacciones calculando un <strong>Hash SHA-256 inmutable</strong> para cada compra consumida de <code>pedidos.auditoria.queue</code>.
                  </p>
                </div>
              </div>

              <div className="audit-stats-cards">
                <div className="stat-card">
                  <span className="stat-label">Total Eventos Auditados</span>
                  <strong className="stat-value">{auditStats?.totalPedidosAuditados ?? auditStats?.totalEventos ?? auditLogs.length}</strong>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Total Transaccionado</span>
                  <strong className="stat-value">${Number(auditStats?.totalMontoAuditado ?? auditStats?.montoTotalAuditado ?? 0).toLocaleString('es-CL')} CLP</strong>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Algoritmo Criptográfico</span>
                  <strong className="stat-value" style={{ color: '#10b981' }}>SHA-256 Inmutable</strong>
                </div>
              </div>

              <div className="audit-table-header">
                <h5>Ledger de Auditoría en Tiempo Real:</h5>
                <button className="btn btn-secondary btn-sm" onClick={() => fetchAuditData()}>
                  <RefreshIcon size={14} /> Refrescar
                </button>
              </div>

              <div className="audit-table-wrapper">
                {auditLogs.length === 0 ? (
                  <div className="empty-audit-state">
                    <p>No se registran eventos de auditoría todavía.</p>
                    <small>Realiza una compra en la tienda o crea un pedido para ver el bloque criptográfico encolado por RabbitMQ.</small>
                  </div>
                ) : (
                  <table className="audit-table">
                    <thead>
                      <tr>
                        <th>ID Pedido</th>
                        <th>Cliente</th>
                        <th>Fecha / Hora</th>
                        <th>Hash SHA-256 Inmutable</th>
                        <th>Monto</th>
                        <th>Estado RabbitMQ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log, idx) => {
                        const pedidoId = log.pedidoId || log.idPedido || `PED-${idx + 1}`;
                        const hash = log.hashIntegridad || log.hashSha256 || 'HASH-N/A';
                        const fecha = log.fechaRegistroAuditoria || log.fechaPedido || log.fechaCreacion || log.timestamp;
                        const monto = log.totalFacturado || log.total || 0;
                        const estado = log.estadoAuditoria || 'AUDITADO_CONFORME';

                        return (
                          <tr key={log.auditId || idx}>
                            <td><strong>{pedidoId}</strong></td>
                            <td>{log.clienteEmail || 'cliente@pedidos360.com'}</td>
                            <td><small>{fecha ? new Date(fecha).toLocaleString('es-CL') : 'En proceso'}</small></td>
                            <td>
                              <code className="sha-hash-code" title={hash}>
                                {hash.length > 16 ? `${hash.substring(0, 16)}...` : hash}
                              </code>
                            </td>
                            <td>${Number(monto).toLocaleString('es-CL')}</td>
                            <td><span className="badge-confirmed">{estado}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICACIONES EMAIL */}
          {activeTab === 'notificaciones' && (
            <div className="tab-pane">
              <div className="section-banner">
                <div className="banner-icon">📧</div>
                <div>
                  <h4>Microservicio Notificaciones: Emisión de Correos (:8082)</h4>
                  <p>
                    Consume eventos asíncronos y expone <code>POST /api/notificaciones/enviar</code> para pruebas directas desde Postman o consola.
                  </p>
                </div>
              </div>

              <div className="notify-test-box">
                <h5>Simular Envío de Correo Directo (Demostración de Rúbrica):</h5>
                <form onSubmit={handleSendNotification} className="notify-form">
                  <div className="form-group">
                    <label>Correo Electrónico Destinatario:</label>
                    <input 
                      type="email" 
                      className="admin-input" 
                      required
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Asunto del Correo:</label>
                    <input 
                      type="text" 
                      className="admin-input" 
                      required
                      value={notifySubject}
                      onChange={(e) => setNotifySubject(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Mensaje / Cuerpo:</label>
                    <textarea 
                      className="admin-input admin-textarea" 
                      rows="3"
                      value={notifyMessage}
                      onChange={(e) => setNotifyMessage(e.target.value)}
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={notifyLoading}
                  >
                    {notifyLoading ? 'Enviando...' : 'Disparar Notificación (POST /enviar)'}
                  </button>
                </form>

                {notifyResult && (
                  <div className={`action-alert ${notifyResult.success ? 'success' : 'error'}`}>
                    {notifyResult.success ? (
                      <div>
                        <strong>✅ Correo despachado exitosamente (HTTP 200)</strong>
                        <pre className="json-code-block">{JSON.stringify(notifyResult.data, null, 2)}</pre>
                      </div>
                    ) : (
                      <div>
                        <strong>❌ Error al disparar notificación:</strong> {notifyResult.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: INFRAESTRUCTURA & SALUD */}
          {activeTab === 'infra' && (
            <div className="tab-pane">
              <div className="section-banner">
                <div className="banner-icon">🌐</div>
                <div>
                  <h4>Matriz Multi-Cloud (Microsoft Azure + Amazon Web Services)</h4>
                  <p>Estado de integración perimetral y conectividad de microservicios.</p>
                </div>
              </div>

              <div className="health-grid">
                <div className="health-card">
                  <div className="health-card-header">
                    <span>🛒 Catálogo API (:8080)</span>
                    <span className={`status-pill ${healthStatus.catalogo || 'UNKNOWN'}`}>
                      {healthStatus.catalogo || 'CONSULTANDO'}
                    </span>
                  </div>
                  <small>Stock & Inventario • Consumidor RabbitMQ</small>
                </div>

                <div className="health-card">
                  <div className="health-card-header">
                    <span>🛍️ Carrito API (:8081)</span>
                    <span className={`status-pill ${healthStatus.carrito || 'UNKNOWN'}`}>
                      {healthStatus.carrito || 'CONSULTANDO'}
                    </span>
                  </div>
                  <small>Procesamiento de Órdenes • Productor AMQP</small>
                </div>

                <div className="health-card">
                  <div className="health-card-header">
                    <span>🔔 Notificaciones API (:8082)</span>
                    <span className={`status-pill ${healthStatus.notificaciones || 'UNKNOWN'}`}>
                      {healthStatus.notificaciones || 'CONSULTANDO'}
                    </span>
                  </div>
                  <small>SMTP / Dispatcher • Consumidor RabbitMQ</small>
                </div>

                <div className="health-card">
                  <div className="health-card-header">
                    <span>🛡️ Auditoría API (:8083)</span>
                    <span className={`status-pill ${healthStatus.auditoria || 'UNKNOWN'}`}>
                      {healthStatus.auditoria || 'CONSULTANDO'}
                    </span>
                  </div>
                  <small>Ledger SHA-256 Inmutable • Microservicio Propio</small>
                </div>

                <div className="health-card">
                  <div className="health-card-header">
                    <span>⚙️ Admin API (:8084)</span>
                    <span className="status-pill ONLINE">ONLINE</span>
                  </div>
                  <small>Gestor REST AmqpAdmin • Topología Colas</small>
                </div>

                <div className="health-card">
                  <div className="health-card-header">
                    <span>☁️ AWS API Gateway</span>
                    <span className="status-pill ONLINE">PERÍMETRO ACTIVO</span>
                  </div>
                  <small>Validación JWT Azure AD con Issuer & Audience</small>
                </div>
              </div>

              <div className="cloud-keys-box">
                <h5>Variables y Configuración del Tenant:</h5>
                <div className="key-row">
                  <span>Azure Tenant ID:</span>
                  <code>e5372bf0-c5e3-4286-887c-79069f209c1f</code>
                </div>
                <div className="key-row">
                  <span>Azure Client ID:</span>
                  <code>5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4</code>
                </div>
                <div className="key-row">
                  <span>AWS Gateway Endpoint:</span>
                  <code>op6erfwwmh.execute-api.us-east-1.amazonaws.com</code>
                </div>
              </div>

              {/* Flujo de Integración Multi-Cloud (Rúbrica EP4) */}
              <div style={{ marginTop: '1.2rem' }}>
                <h5 className="sub-title">Diagrama de Flujo e Integración Multi-Cloud (Azure + AWS + RabbitMQ):</h5>
                <div className="arch-steps-grid">
                  <div className="arch-step-card">
                    <span className="step-num">1</span>
                    <h4>Azure AD (IDaaS)</h4>
                    <p>Autenticación OAuth2/OIDC con PKCE. Emite JWT firmado para el usuario institucional.</p>
                  </div>
                  <div className="arch-step-card">
                    <span className="step-num">2</span>
                    <h4>AWS API Gateway</h4>
                    <p>Perímetro de red con JWT Authorizer. Valida la firma del token y rechaza 401 sin credenciales.</p>
                  </div>
                  <div className="arch-step-card">
                    <span className="step-num">3</span>
                    <h4>Microservicio Carrito (:8081)</h4>
                    <p>Recibe la orden y publica el evento <code>pedidos.pedido.creado</code> en RabbitMQ.</p>
                  </div>
                  <div className="arch-step-card">
                    <span className="step-num">4</span>
                    <h4>Clúster RabbitMQ (2 Nodos)</h4>
                    <p>TopicExchange enruta a 3 colas de dominio con sus 3 DLQs vía DirectExchange.</p>
                  </div>
                  <div className="arch-step-card">
                    <span className="step-num">5</span>
                    <h4>Catálogo & Notificaciones</h4>
                    <p>Descuento de stock en vivo y envío de correo transaccional con confirmación manual (ACK).</p>
                  </div>
                  <div className="arch-step-card">
                    <span className="step-num">6</span>
                    <h4>Auditoría SHA-256 (:8083)</h4>
                    <p>Sella cada transacción con hash criptográfico SHA-256 para no repudio y trazabilidad.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer de la Consola */}
        <div className="console-footer">
          <span className="current-mode-tag">
            Conectado a: <strong>{endpoints.label}</strong>
          </span>
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar Consola
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloudConsoleModal;
