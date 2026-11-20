import React, { useState, useEffect } from 'react';
import { getApiEndpoints } from '../config/apiConfig';

export const RecomendacionesSection = ({ activeAccount, onAddToCart }) => {
  const [recomendados, setRecomendados] = useState([]);
  const [loading, setLoading] = useState(false);

  const endpoints = getApiEndpoints();
  const userId = activeAccount?.username || activeAccount?.name || 'cliente@pedidos360.com';

  const fetchRecomendaciones = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${endpoints.analyticsRecomendaciones}/${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setRecomendados(data);
        }
      }
    } catch {
      // Fallback silencioso si el microservicio de analítica aún no está iniciado
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecomendaciones();
    // Refresco periódico cada 15 segundos para reflejar nuevos eventos de Kafka
    const interval = setInterval(fetchRecomendaciones, 15000);
    return () => clearInterval(interval);
  }, [userId]);

  if (recomendados.length === 0) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.3rem' }}>✨</span>
          <h3 style={styles.title}>Recomendados para ti (Streaming en Tiempo Real con Apache Kafka)</h3>
        </div>
        <span style={styles.badge}>Hiperpersonalización EV3</span>
      </div>

      <div style={styles.grid}>
        {recomendados.map((prod) => (
          <div key={prod.id} style={styles.card}>
            <img src={prod.imagen} alt={prod.nombre} style={styles.image} />
            <div style={styles.content}>
              <div style={styles.categoryBadge}>{prod.categoria || 'Tecnología'}</div>
              <h4 style={styles.prodName}>{prod.nombre}</h4>
              <div style={styles.footer}>
                <span style={styles.price}>${prod.precio?.toLocaleString('es-CL')} CLP</span>
                <button
                  style={styles.btnAdd}
                  onClick={() => onAddToCart({
                    id: prod.id,
                    name: prod.nombre,
                    price: prod.precio,
                    image: prod.imagen,
                    quantity: 1,
                  })}
                >
                  + Agregar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    margin: '1.5rem 2rem',
    padding: '1.5rem',
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
    borderRadius: '16px',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '10px',
  },
  title: {
    margin: 0,
    fontSize: '1.15rem',
    color: '#f8fafc',
    fontWeight: '700',
  },
  badge: {
    background: 'rgba(56, 189, 248, 0.15)',
    color: '#38bdf8',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    border: '1px solid rgba(56, 189, 248, 0.3)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '1rem',
  },
  card: {
    background: '#1e293b',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s',
  },
  image: {
    width: '100%',
    height: '140px',
    objectFit: 'cover',
  },
  content: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  categoryBadge: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '4px',
  },
  prodName: {
    margin: '0 0 10px 0',
    fontSize: '0.92rem',
    color: '#f8fafc',
    fontWeight: '600',
    lineHeight: '1.3',
    flex: 1,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  price: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  btnAdd: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    background: '#0284c7',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '0.82rem',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
};

export default RecomendacionesSection;
