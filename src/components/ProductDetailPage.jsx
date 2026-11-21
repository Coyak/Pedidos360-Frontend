import React, { useState, useEffect } from 'react';
import { initialProducts } from '../data/products';
import { analyticsService } from '../services/analyticsService';
import { StarIcon, CheckIcon, CartIcon, ShieldCheckIcon, RefreshIcon } from './Icons';

export const ProductDetailPage = ({
  productId,
  onNavigate,
  onAddToCart,
  cartItems = [],
  activeAccount,
}) => {
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const currentClientId = activeAccount?.username || activeAccount?.name || 'cliente@pedidos360.com';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const found = initialProducts.find((p) => p.id === productId) || initialProducts[0];
    setProduct(found);
    setQuantity(1);
    setAddedAnimation(false);

    // Enviar evento de vista a Apache Kafka con el usuario autenticado
    if (found) {
      analyticsService.registrarInteraccion({
        clientId: currentClientId,
        itemId: found.id,
        action: 'view',
        category: found.category,
        productType: 'Hardware',
      });
    }
  }, [productId, currentClientId]);

  if (!product) return null;

  const existingInCart = cartItems.find((item) => item.id === product.id);
  const currentInCartQty = existingInCart ? existingInCart.quantity : 0;
  const isOutOfStock = product.stock <= 0;

  const handleIncrement = () => {
    if (quantity < product.stock) setQuantity((q) => q + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity((q) => q - 1);
  };

  const handleAdd = () => {
    if (isOutOfStock) return;
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product);
    }
    // Enviar evento 'cart' a Apache Kafka con el usuario autenticado
    analyticsService.registrarInteraccion({
      clientId: currentClientId,
      itemId: product.id,
      action: 'cart',
      category: product.category,
      productType: 'Hardware',
    });

    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const relatedProducts = initialProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div style={styles.pageContainer}>
      {/* Breadcrumb de navegación */}
      <nav style={styles.breadcrumb}>
        <button onClick={() => onNavigate('home')} style={styles.breadcrumbLink}>
          Tienda
        </button>
        <span style={styles.breadcrumbSeparator}>/</span>
        <button onClick={() => onNavigate('home', product.category)} style={styles.breadcrumbLink}>
          {product.category}
        </button>
        <span style={styles.breadcrumbSeparator}>/</span>
        <span style={styles.breadcrumbCurrent}>{product.name}</span>
      </nav>

      <div style={styles.mainGrid}>
        {/* Columna Izquierda: Imagen y Garantías */}
        <div style={styles.leftCol}>
          <div style={styles.imageCard}>
            <img src={product.image} alt={product.name} style={styles.productImg} />
            {product.tag && <span style={styles.tagBadge}>{product.tag}</span>}
          </div>

          <div style={styles.warrantyBox}>
            <div style={styles.warrantyItem}>
              <ShieldCheckIcon size={20} color="#38bdf8" />
              <div>
                <strong style={{ color: '#f8fafc', fontSize: '0.88rem' }}>Garantía Oficial del Fabricante</strong>
                <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '0.78rem' }}>12 meses con cobertura técnica nacional.</p>
              </div>
            </div>
            <div style={styles.warrantyItem}>
              <span style={{ fontSize: '1.2rem' }}>⚡</span>
              <div>
                <strong style={{ color: '#f8fafc', fontSize: '0.88rem' }}>Despacho Express Certificado</strong>
                <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '0.78rem' }}>Entrega prioritaria en 24 a 48 horas hábiles en todo Chile.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Información, Precios y Compra */}
        <div style={styles.rightCol}>
          <div style={styles.categoryPillRow}>
            <span style={styles.categoryBadge}>{product.category}</span>
            <div style={styles.ratingGroup}>
              <StarIcon size={15} color="#f59e0b" />
              <span style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '0.92rem' }}>{product.rating}</span>
              <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>(Valoración Verificada)</span>
            </div>
          </div>

          <h1 style={styles.title}>{product.name}</h1>
          <p style={styles.desc}>{product.description}</p>

          {/* Ficha Técnica */}
          {product.specs && (
            <div style={styles.specsCard}>
              <h3 style={styles.specsTitle}>Especificaciones Técnicas</h3>
              <div style={styles.specsList}>
                {Object.entries(product.specs).map(([key, val]) => (
                  <div key={key} style={styles.specRow}>
                    <span style={styles.specLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    <span style={styles.specValue}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tarjeta de Precios y Compra */}
          <div style={styles.buyBox}>
            <div style={styles.priceSection}>
              <div>
                <span style={styles.priceSubtext}>Precio Contado / Débito / Webpay</span>
                <div style={styles.price}>${product.price.toLocaleString('es-CL')} CLP</div>
              </div>
              <div style={styles.stockBadge}>
                <span style={{ ...styles.stockDot, background: isOutOfStock ? '#ef4444' : '#10b981' }}></span>
                <span style={{ color: isOutOfStock ? '#ef4444' : '#10b981', fontWeight: '700', fontSize: '0.88rem' }}>
                  {isOutOfStock ? 'Agotado' : `${product.stock} unidades disponibles`}
                </span>
              </div>
            </div>

            <div style={styles.actionRow}>
              <div style={styles.qtyControl}>
                <button onClick={handleDecrement} disabled={quantity <= 1 || isOutOfStock} style={styles.qtyBtn}>-</button>
                <span style={styles.qtyVal}>{quantity}</span>
                <button onClick={handleIncrement} disabled={quantity >= product.stock || isOutOfStock} style={styles.qtyBtn}>+</button>
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
              <div style={styles.cartNotice}>
                <span>🛒 Actualmente tienes <strong>{currentInCartQty} unidades</strong> de este producto en el carrito.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sección de Productos Relacionados */}
      {relatedProducts.length > 0 && (
        <section style={styles.relatedSection}>
          <div style={styles.relatedHeader}>
            <h3 style={styles.relatedTitle}>✨ Productos Relacionados de {product.category}</h3>
            <span style={{ color: '#38bdf8', fontSize: '0.85rem' }}>Explora alternativas similares</span>
          </div>

          <div style={styles.relatedGrid}>
            {relatedProducts.map((rel) => (
              <div
                key={rel.id}
                style={styles.relatedCard}
                onClick={() => onNavigate('product', rel.id)}
              >
                <img src={rel.image} alt={rel.name} style={styles.relatedImg} />
                <div style={styles.relatedBody}>
                  <h4 style={styles.relatedName}>{rel.name}</h4>
                  <div style={styles.relatedPrice}>${rel.price.toLocaleString('es-CL')} CLP</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const styles = {
  pageContainer: {
    maxWidth: '1240px',
    margin: '0 auto',
    padding: '1.5rem 1.5rem 4rem 1.5rem',
    color: '#f8fafc',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '2rem',
    fontSize: '0.88rem',
  },
  breadcrumbLink: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: 0,
    fontFamily: 'inherit',
    fontSize: '0.88rem',
    textDecoration: 'none',
  },
  breadcrumbSeparator: {
    color: '#64748b',
  },
  breadcrumbCurrent: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 1.3fr',
    gap: '2.5rem',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  imageCard: {
    position: 'relative',
    borderRadius: '20px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: '#1e293b',
    height: '420px',
  },
  productImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  tagBadge: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    background: 'rgba(2, 132, 199, 0.9)',
    color: '#ffffff',
    fontSize: '0.8rem',
    fontWeight: '700',
    padding: '6px 14px',
    borderRadius: '10px',
    backdropFilter: 'blur(6px)',
  },
  warrantyBox: {
    background: '#131d33',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  warrantyItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  categoryPillRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  categoryBadge: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#38bdf8',
    background: 'rgba(56, 189, 248, 0.12)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    padding: '4px 12px',
    borderRadius: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  ratingGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  title: {
    fontSize: '2.1rem',
    fontWeight: '800',
    letterSpacing: '-0.03em',
    color: '#ffffff',
    margin: '0 0 1rem 0',
    lineHeight: '1.2',
  },
  desc: {
    fontSize: '1rem',
    color: '#cbd5e1',
    lineHeight: '1.6',
    margin: '0 0 1.5rem 0',
  },
  specsCard: {
    background: '#131d33',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '1.25rem',
    marginBottom: '1.5rem',
  },
  specsTitle: {
    margin: '0 0 1rem 0',
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  specsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.55rem',
  },
  specRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.88rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '0.45rem',
  },
  specLabel: {
    color: '#94a3b8',
  },
  specValue: {
    color: '#f8fafc',
    fontWeight: '600',
    textAlign: 'right',
  },
  buyBox: {
    background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    borderRadius: '16px',
    padding: '1.5rem',
  },
  priceSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
  },
  priceSubtext: {
    fontSize: '0.82rem',
    color: '#94a3b8',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '4px',
  },
  price: {
    fontSize: '2.2rem',
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: '-0.02em',
  },
  stockBadge: {
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
  },
  qtyControl: {
    display: 'flex',
    alignItems: 'center',
    background: '#1e293b',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  qtyBtn: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '1.25rem',
    width: '42px',
    height: '46px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyVal: {
    padding: '0 1rem',
    fontWeight: '700',
    fontSize: '1rem',
    color: '#ffffff',
  },
  btnAddToCart: {
    flex: 1,
    height: '46px',
    borderRadius: '12px',
    border: 'none',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '1rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
    transition: 'all 0.2s',
  },
  cartNotice: {
    marginTop: '1rem',
    fontSize: '0.85rem',
    color: '#94a3b8',
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    padding: '0.65rem 1rem',
    borderRadius: '10px',
  },
  relatedSection: {
    marginTop: '4rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '2.5rem',
  },
  relatedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  relatedTitle: {
    margin: 0,
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  relatedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '1.5rem',
  },
  relatedCard: {
    background: '#1e293b',
    borderRadius: '14px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
  },
  relatedImg: {
    width: '100%',
    height: '160px',
    objectFit: 'cover',
  },
  relatedBody: {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  relatedName: {
    margin: 0,
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#f8fafc',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  relatedPrice: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#38bdf8',
  },
};

export default ProductDetailPage;
