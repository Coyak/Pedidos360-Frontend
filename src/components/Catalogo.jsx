import React, { useState, useEffect } from 'react';
import { initialProducts, categories } from '../data/products';
import { StarIcon, CheckIcon, EmptyBoxIcon, RefreshIcon } from './Icons';
import { getApiEndpoints } from '../config/apiConfig';

export const Catalogo = ({
  selectedCategory,
  onSelectCategory,
  searchTerm,
  onAddToCart,
  cartItems = [],
  refreshTrigger,
  onOpenProductDetail,
}) => {
  const [productsList, setProductsList] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);

  const endpoints = getApiEndpoints();
  const API_PRODUCTOS_URL = endpoints.catalogoProductos;

  const fetchLiveProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_PRODUCTOS_URL);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.map((item) => {
            const id = item.id || `PROD-${Math.random().toString(36).substring(7).toUpperCase()}`;
            // Buscar si existe en local para heredar specs o imágenes en alta resolución
            const localMatch = initialProducts.find((p) => p.id === id);

            return {
              id: id,
              name: item.nombre || item.name || localMatch?.name || 'Dispositivo Tecnológico',
              description: item.descripcion || item.description || localMatch?.description || 'Equipamiento de alto rendimiento con garantía oficial.',
              price: Number(item.precio || item.price || localMatch?.price || 49990),
              stock: item.stock !== undefined ? Number(item.stock) : (localMatch?.stock || 10),
              category: item.categoria || item.category || localMatch?.category || 'Laptops',
              rating: item.rating || localMatch?.rating || 4.8,
              tag: item.stock !== undefined && item.stock <= 4 ? '¡Últimas Unidades!' : (localMatch?.tag || 'En Stock'),
              image: item.imagen || item.image || localMatch?.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
              specs: localMatch?.specs || null,
            };
          });
          setProductsList(normalized);
          setBackendConnected(true);
        }
      }
    } catch {
      setBackendConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveProducts();
  }, [refreshTrigger]);

  const filteredProducts = productsList.filter((p) => {
    const matchesCategory =
      selectedCategory === 'Todos' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getItemQuantityInCart = (productId) => {
    const found = cartItems.find((item) => item.id === productId);
    return found ? found.quantity : 0;
  };

  const handleAddToCartWithKafka = (product) => {
    onAddToCart(product);
    // Publicar evento asíncrono a Apache Kafka
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
  };

  const handleCardClick = (product) => {
    if (onOpenProductDetail) {
      onOpenProductDetail(product);
    }
  };

  return (
    <section className="catalog-section">
      {/* Barra de Filtros y Categorías */}
      <div className="catalog-toolbar">
        <div className="categories-pill-list">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="catalog-status-actions">
          <div className="backend-sync-indicator" title={backendConnected ? 'Conectado a Catálogo API (:8080)' : 'Catálogo Local Activo'}>
            <span className={`dot ${backendConnected ? 'online' : 'standby'}`}></span>
            <span className="sync-text">
              {backendConnected ? 'Stock Sincronizado' : 'Catálogo Local'}
            </span>
          </div>

          <button
            className="btn-refresh-catalog"
            onClick={fetchLiveProducts}
            disabled={loading}
            title="Refrescar catálogo y stock"
            aria-label="Actualizar catálogo"
          >
            <RefreshIcon size={14} className={loading ? 'spin' : ''} />
            <span>{loading ? 'Sincronizando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      <div className="results-indicator">
        <span>Mostrando <strong>{filteredProducts.length}</strong> productos disponibles</span>
        {searchTerm && <span> para la búsqueda "<em>{searchTerm}</em>"</span>}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="empty-catalog-state">
          <div className="empty-icon-wrapper">
            <EmptyBoxIcon size={48} />
          </div>
          <h3>No encontramos productos</h3>
          <p>Prueba seleccionando otra categoría o limpiando el filtro de búsqueda.</p>
          <button className="btn btn-secondary" onClick={() => onSelectCategory('Todos')}>
            Ver todos los productos
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => {
            const inCartCount = getItemQuantityInCart(product.id);
            const isOutOfStock = product.stock <= 0;

            return (
              <div
                key={product.id}
                className="product-card"
                onClick={() => handleCardClick(product)}
                style={{ cursor: 'pointer' }}
                title="Haz clic para ver especificaciones completas y productos recomendados"
              >
                <div className="product-card-top">
                  <span className="product-category-tag">{product.category}</span>
                  {product.tag && (
                    <span className={`product-special-tag ${product.stock <= 4 ? 'tag-warning' : ''}`}>
                      {product.tag}
                    </span>
                  )}
                </div>

                <div className="product-visual">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-image"
                    loading="lazy"
                  />
                  <div className="view-detail-hint">
                    <span>👁️ Ver Ficha Técnica</span>
                  </div>
                </div>

                <div className="product-info">
                  <div className="product-rating">
                    <StarIcon size={13} color="#f59e0b" />
                    <span className="rating-num">{product.rating}</span>
                    <span className="stock-info">
                      • Stock: <strong>{product.stock} un.</strong>
                    </span>
                  </div>

                  <h3 className="product-title">{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                </div>

                <div className="product-footer">
                  <div className="product-price-block">
                    <span className="price-label">Precio CLP</span>
                    <span className="price-value">${product.price.toLocaleString('es-CL')}</span>
                  </div>

                  <button
                    className={`btn btn-add-cart ${inCartCount > 0 ? 'in-cart' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation(); // Evitar abrir el modal si solo quiere agregar rápido
                      handleAddToCartWithKafka(product);
                    }}
                    disabled={isOutOfStock}
                    aria-label={`Agregar ${product.name} al carrito`}
                    title="Agregar directo al carrito"
                  >
                    {isOutOfStock ? (
                      <span>Agotado</span>
                    ) : inCartCount > 0 ? (
                      <>
                        <CheckIcon size={14} />
                        <span>En Carrito ({inCartCount})</span>
                      </>
                    ) : (
                      <span>+ Agregar</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default Catalogo;
