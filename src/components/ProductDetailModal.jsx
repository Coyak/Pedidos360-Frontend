import React, { useState, useEffect } from 'react';
import { CloseIcon, StarIcon, CheckIcon, CartIcon } from './Icons';
import { initialProducts } from '../data/products';
import { getApiEndpoints } from '../config/apiConfig';

export const ProductDetailModal = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  cartItems = [],
  onSelectProduct,
}) => {
  if (!isOpen || !product) return null;

  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const endpoints = getApiEndpoints();

  // Resetear cantidad al cambiar de producto y enviar evento de vista a Apache Kafka
  useEffect(() => {
    setQuantity(1);
    setAddedAnimation(false);

    // Enviar evento de vista a Kafka (tópico interacciones-user)
    try {
      fetch(endpoints.analyticsInteraccion, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: 'cliente@pedidos360.com',
          itemId: product.id,
          action: 'view',
          category: product.category,
          productType: 'Hardware',
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    } catch {}
  }, [product?.id]);

  const existingInCart = cartItems.find((item) => item.id === product.id);
  const currentInCartQty = existingInCart ? existingInCart.quantity : 0;
  const isOutOfStock = product.stock <= 0;

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity((q) => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleAdd = () => {
    if (isOutOfStock) return;
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product);
    }
    // Enviar evento 'cart' a Kafka
    try {
      fetch(endpoints.analyticsInteraccion, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: 'cliente@pedidos360.com',
          itemId: product.id,
          action: 'cart',
          category: product.category,
          productType: 'Hardware',
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    } catch {}

    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  // Obtener productos relacionados de la misma categoría (excluyendo el actual)
  const relatedProducts = initialProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="modal-backdrop" onClick={onClose} style={styles.backdrop}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={styles.card}>
        
        {/* Botón de cierre */}
        <button onClick={onClose} style={styles.closeBtn} aria-label="Cerrar detalle">
          <CloseIcon size={20} />
        </button>

        <div style={styles.contentLayout}>
          {/* Columna Izquierda: Imagen */}
          <div style={styles.imageColumn}>
            <div style={styles.imageWrapper}>
              <img src={product.image} alt={product.name} style={styles.image} />
              {product.tag && (
                <span style={styles.imageBadge}>{product.tag}</span>
              )}
            </div>
            
            {/* Garantía y Despacho */}
            <div style={styles.trustBadges}>
              <div style={styles.trustItem}>
                <span>🛡️</span>
                <div>
                  <strong>Garantía Oficial</strong>
                  <small style={{ color: '#94a3b8', display: 'block' }}>12 meses con el fabricante</small>
                </div>
              </div>
              <div style={styles.trustItem}>
                <span>⚡</span>
                <div>
                  <strong>Despacho Express</strong>
                  <small style={{ color: '#94a3b8', display: 'block' }}>Entrega en 24/48 hrs en Chile</small>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Información y Compra */}
          <div style={styles.infoColumn}>
            <div style={styles.categoryRow}>
              <span style={styles.categoryPill}>{product.category}</span>
              <div style={styles.ratingBox}>
                <StarIcon size={14} color="#f59e0b" />
                <span style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '0.9rem' }}>{product.rating}</span>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>(Reseñas verificadas)</span>
              </div>
            </div>

            <h2 style={styles.productTitle}>{product.name}</h2>
            <p style={styles.productDesc}>{product.description}</p>

            {/* Especificaciones Técnicas */}
            {product.specs && (
              <div style={styles.specsBox}>
                <h4 style={styles.specsTitle}>Ficha Técnica de Alto Rendimiento</h4>
                <div style={styles.specsGrid}>
                  {Object.entries(product.specs).map(([key, value]) => (
                    <div key={key} style={styles.specItem}>
                      <span style={styles.specKey}>{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                      <span style={styles.specVal}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Precio y Disponibilidad */}
            <div style={styles.priceRow}>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase' }}>Precio Contado / Débito</span>
                <div style={styles.price}>${product.price.toLocaleString('es-CL')} CLP</div>
              </div>
              <div style={styles.stockIndicator}>
                <span style={{ ...styles.stockDot, background: isOutOfStock ? '#ef4444' : '#10b981' }}></span>
                <span style={{ color: isOutOfStock ? '#ef4444' : '#10b981', fontWeight: '600', fontSize: '0.85rem' }}>
                  {isOutOfStock ? 'Agotado Temporalmente' : `Stock Disponible (${product.stock} un.)`}
                </span>
              </div>
            </div>

            {/* Selector de Cantidad y Botón de Carrito */}
            <div style={styles.actionRow}>
              <div style={styles.quantityPicker}>
                <button 
                  onClick={handleDecrement} 
                  disabled={quantity <= 1 || isOutOfStock}
                  style={styles.btnQty}
                  aria-label="Disminuir cantidad"
                >
                  -
                </button>
                <span style={styles.qtyNumber}>{quantity}</span>
                <button 
                  onClick={handleIncrement} 
                  disabled={quantity >= product.stock || isOutOfStock}
                  style={styles.btnQty}
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAdd}
                disabled={isOutOfStock}
                style={{
                  ...styles.btnAddToCart,
                  background: addedAnimation ? '#10b981' : isOutOfStock ? '#334155' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                }}
              >
                {addedAnimation ? (
                  <>
                    <CheckIcon size={18} />
                    <span>¡Agregado al Carrito!</span>
                  </>
                ) : (
                  <>
                    <CartIcon size={18} />
                    <span>{isOutOfStock ? 'Sin Stock' : `Añadir al Carrito (${quantity})`}</span>
                  </>
                )}
              </button>
            </div>

            {currentInCartQty > 0 && (
              <div style={styles.inCartNotice}>
                <span>🛒 Tienes actualmente <strong>{currentInCartQty} unidades</strong> de este producto en el carrito.</span>
              </div>
            )}
          </div>
        </div>

        {/* Sección: Productos Relacionados y Recomendaciones Inteligentes */}
        {relatedProducts.length > 0 && (
          <div style={styles.relatedSection}>
            <div style={styles.relatedHeader}>
              <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✨</span> Productos Relacionados y Recomendados
              </h4>
              <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: '600' }}>
                Categoría: {product.category}
              </span>
            </div>

            <div style={styles.relatedGrid}>
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  style={styles.relatedCard}
                  onClick={() => {
                    if (onSelectProduct) onSelectProduct(rel);
                  }}
                  title={`Ver detalle de ${rel.name}`}
                >
                  <img src={rel.image} alt={rel.name} style={styles.relatedImg} />
                  <div style={styles.relatedInfo}>
                    <span style={styles.relatedName}>{rel.name}</span>
                    <span style={styles.relatedPrice}>${rel.price.toLocaleString('es-CL')} CLP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 10, 20, 0.85)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1.5rem',
  },
  card: {
    background: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '20px',
    maxWidth: '900px',
    width: '100%',
    maxHeight: '92vh',
    overflowY: 'auto',
    position: 'relative',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
    padding: '2rem',
    color: '#f8fafc',
  },
  closeBtn: {
    position: 'absolute',
    top: '1.25rem',
    right: '1.25rem',
    background: 'rgba(255, 255, 255, 0.08)',
    border: 'none',
    color: '#94a3b8',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    zIndex: 10,
  },
  contentLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.25fr',
    gap: '2rem',
  },
  imageColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: '320px',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: '#1e293b',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imageBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    background: 'rgba(2, 132, 199, 0.9)',
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '8px',
    backdropFilter: 'blur(4px)',
  },
  trustBadges: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    padding: '1rem',
    borderRadius: '12px',
  },
  trustItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.88rem',
  },
  infoColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  categoryRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.75rem',
  },
  categoryPill: {
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#38bdf8',
    background: 'rgba(56, 189, 248, 0.12)',
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid rgba(56, 189, 248, 0.25)',
  },
  ratingBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  productTitle: {
    fontSize: '1.6rem',
    fontWeight: '800',
    letterSpacing: '-0.02em',
    color: '#ffffff',
    margin: '0 0 0.75rem 0',
    lineHeight: '1.2',
  },
  productDesc: {
    fontSize: '0.92rem',
    color: '#cbd5e1',
    lineHeight: '1.5',
    margin: '0 0 1.25rem 0',
  },
  specsBox: {
    background: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    padding: '1rem',
    marginBottom: '1.5rem',
  },
  specsTitle: {
    margin: '0 0 0.75rem 0',
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  specsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '0.45rem',
  },
  specItem: {
    fontSize: '0.82rem',
    display: 'flex',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    paddingBottom: '0.35rem',
  },
  specKey: {
    color: '#94a3b8',
    fontWeight: '500',
  },
  specVal: {
    color: '#f8fafc',
    fontWeight: '600',
    textAlign: 'right',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
    padding: '0.85rem 1.2rem',
    background: 'rgba(2, 132, 199, 0.08)',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    borderRadius: '12px',
  },
  price: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: '-0.02em',
  },
  stockIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  stockDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  },
  quantityPicker: {
    display: 'flex',
    alignItems: 'center',
    background: '#1e293b',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  btnQty: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '1.2rem',
    width: '38px',
    height: '44px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
  qtyNumber: {
    padding: '0 0.85rem',
    fontWeight: '700',
    fontSize: '1rem',
    color: '#f8fafc',
  },
  btnAddToCart: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.65rem',
    border: 'none',
    color: '#ffffff',
    height: '44px',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  inCartNotice: {
    fontSize: '0.82rem',
    color: '#94a3b8',
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    padding: '0.55rem 0.85rem',
    borderRadius: '8px',
  },
  relatedSection: {
    marginTop: '2rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '1.5rem',
  },
  relatedHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  relatedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem',
  },
  relatedCard: {
    background: '#1e293b',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '10px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
  },
  relatedImg: {
    width: '100%',
    height: '100px',
    objectFit: 'cover',
  },
  relatedInfo: {
    padding: '0.65rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  relatedName: {
    fontSize: '0.78rem',
    fontWeight: '600',
    color: '#f8fafc',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  relatedPrice: {
    fontSize: '0.82rem',
    fontWeight: '700',
    color: '#38bdf8',
  },
};

export default ProductDetailModal;
