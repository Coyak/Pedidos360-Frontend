import React, { useState, useEffect } from 'react';
import { CloseIcon, RefreshIcon, CopyIcon, ShieldCheckIcon, CheckIcon } from './Icons';
import { getApiEndpoints } from '../config/apiConfig';

export const MisComprasModal = ({ isOpen, onClose, activeAccount }) => {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState(null);
  const [filterMine, setFilterMine] = useState(false);

  const endpoints = getApiEndpoints();

  useEffect(() => {
    if (isOpen) {
      cargarCompras();
    }
  }, [isOpen]);

  const cargarCompras = async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoints.auditoriaEventos);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Ordenar de más reciente a más antigua
          const sorted = [...data].reverse();
          setCompras(sorted);
        }
      }
    } catch (e) {
      console.warn("No se pudieron cargar compras desde auditoría:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHash = (hash, id) => {
    if (hash) {
      navigator.clipboard.writeText(hash);
      setCopiedHash(id);
      setTimeout(() => setCopiedHash(null), 2000);
    }
  };

  if (!isOpen) return null;

  const userEmail = activeAccount?.username || activeAccount?.email || '';
  const filteredCompras = filterMine && userEmail
    ? compras.filter((c) => c.clienteEmail?.toLowerCase() === userEmail.toLowerCase())
    : compras;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card console-card" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="console-brand">
            <div className="console-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
              <ShieldCheckIcon size={24} color="#10b981" />
            </div>
            <div>
              <h3>Mis Compras & Sellos Criptográficos SHA-256</h3>
              <p className="console-subtitle">Historial transaccional auditado por RabbitMQ y Microservicio Auditoría (:8083)</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(15, 23, 42, 0.6)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              className={`btn btn-sm ${!filterMine ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterMine(false)}
            >
              Todas las Compras ({compras.length})
            </button>
            {userEmail && (
              <button 
                className={`btn btn-sm ${filterMine ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterMine(true)}
              >
                Solo mis pedidos ({compras.filter(c => c.clienteEmail?.toLowerCase() === userEmail.toLowerCase()).length})
              </button>
            )}
          </div>

          <button className="btn btn-secondary btn-sm" onClick={cargarCompras} disabled={loading}>
            <RefreshIcon size={14} /> {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              <div style={{ width: '36px', height: '36px', border: '3px solid rgba(56, 189, 248, 0.2)', borderTopColor: '#38bdf8', borderRadius: '50%', margin: '0 auto 12px auto', animation: 'spin 0.8s linear infinite' }}></div>
              <p>Consultando compras auditadas en el ledger SHA-256...</p>
            </div>
          ) : filteredCompras.length === 0 ? (
            <div className="empty-audit-state" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🛍️</div>
              <h4 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>No se registran compras todavía</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
                Agrega un producto del catálogo al carrito y confirma tu compra para ver el pedido y su hash SHA-256 encolado en tiempo real.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredCompras.map((item, idx) => {
                const pedidoId = item.pedidoId || item.idPedido || `PED-${idx + 1}`;
                const hash = item.hashIntegridad || item.hashSha256 || 'HASH-N/A';
                const fecha = item.fechaRegistroAuditoria || item.fechaPedido || item.fechaCreacion;
                const total = item.totalFacturado || item.total || 0;
                const cliente = item.clienteEmail || 'cliente@pedidos360.com';
                const direccion = item.direccionEnvio || 'Santiago, Chile';
                const isCopied = copiedHash === (item.auditId || idx);

                return (
                  <div 
                    key={item.auditId || idx}
                    style={{
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(51, 65, 85, 0.8)',
                      borderRadius: '10px',
                      padding: '1.25rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#f8fafc' }}>{pedidoId}</span>
                          <span className="badge-confirmed" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                            {item.estadoAuditoria || 'AUDITADO CONFORME'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {fecha ? new Date(fecha).toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'medium' }) : 'Fecha no disponible'}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#38bdf8' }}>
                          ${Number(total).toLocaleString('es-CL')} CLP
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Facturado</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', padding: '0.75rem 0', borderTop: '1px solid rgba(51, 65, 85, 0.4)', borderBottom: '1px solid rgba(51, 65, 85, 0.4)', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Cliente:</span>
                        <span style={{ color: '#cbd5e1' }}>{cliente}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Dirección de Entrega:</span>
                        <span style={{ color: '#cbd5e1' }}>{direccion}</span>
                      </div>
                    </div>

                    {/* Sello SHA-256 */}
                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.8)', padding: '0.6rem 0.9rem', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                        <ShieldCheckIcon size={16} color="#10b981" />
                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '600' }}>SHA-256:</span>
                        <code style={{ fontSize: '0.8rem', color: '#38bdf8', fontFamily: 'monospace' }}>
                          {hash}
                        </code>
                      </div>
                      <button 
                        onClick={() => handleCopyHash(hash, item.auditId || idx)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                        title="Copiar Hash SHA-256 de integridad"
                      >
                        {isCopied ? <CheckIcon size={13} color="#10b981" /> : <CopyIcon size={13} />}
                        <span>{isCopied ? '¡Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="console-footer" style={{ borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Garantía de Integridad: Cada transacción se sella criptográficamente al salir de <code>pedidos.auditoria.queue</code>
          </span>
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MisComprasModal;
