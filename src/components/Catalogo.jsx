import React, { useState, useEffect } from 'react';
import { initialProducts, categories } from '../data/products';
import { StarIcon, CheckIcon, EmptyBoxIcon, RefreshIcon } from './Icons';
import { getApiEndpoints } from '../config/apiConfig';

const imageMap = {
  'PROD-101': 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80',
  'PROD-001': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
  'PROD-102': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
  'PROD-202': 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
  'PROD-203': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
  'PROD-301': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
  'PROD-005': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
};

const defaultImage = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80';

export const Catalogo = ({
  selectedCategory,
  onSelectCategory,
  searchTerm,
  onAddToCart,
  cartItems,
  refreshTrigger,
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
            return {
              id: id,
              name: item.nombre || item.name || 'Dispositivo Tecnológico',
              description: item.descripcion || item.description || 'Equipamiento de alto rendimiento con garantía oficial.',
              price: Number(item.precio || item.price || 49990),
              stock: item.stock !== undefined ? Number(item.stock) : 10,
              category: item.categoria || item.category || 'Tecnología',
              rating: item.rating || 4.8,
              tag: item.stock !== undefined && item.stock <= 5 ? '¡Últimas Unidades!' : 'En Stock',
              image: item.imagen || item.image || imageMap[id] || defaultImage,
            };
          });
          setProductsList(normalized);
          setBackendConnected(true);
        }
      }
    } catch (err) {
      console.warn("Backend Catálogo offline o en CORS, usando inventario local:", err);
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

  return (
    <section className="catalog-section">
      {/* Barra de Filtros y Estado de Inventario */}
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
          <div className="backend-sync-indicator" title={backendConnected ? 'Conectado a AWS Catálogo API' : 'Modo Offline / Caché'}>
            <span className={`dot ${backendConnected ? 'online' : 'standby'}`}></span>
            <span className="sync-text">
              {backendConnected ? 'Inventario AWS Sincronizado' : 'Catálogo Local'}
            </span>
          </div>

          <button
            className="btn-refresh-catalog"
            onClick={fetchLiveProducts}
            disabled={loading}
            title="Refrescar stock en vivo desde RabbitMQ"
            aria-label="Actualizar catálogo"
          >
            <RefreshIcon size={14} className={loading ? 'spin' : ''} />
            <span>{loading ? 'Sincronizando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {/* Contador de Productos */}
      <div className="results-indicator">
        <span>Mostrando <strong>{filteredProducts.length}</strong> productos disponibles</span>
        {searchTerm && <span> para la búsqueda "<em>{searchTerm}</em>"</span>}
      </div>

      {/* Grilla de Productos */}
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
              <div key={product.id} className="product-card">
                <div className="product-card-top">
                  <span className="product-category-tag">{product.category}</span>
                  {product.tag && (
                    <span className={`product-special-tag ${product.stock <= 5 ? 'tag-warning' : ''}`}>
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
                </div>

                <div className="product-info">
                  <div className="product-rating">
                    <StarIcon size={13} />
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
                    onClick={() => onAddToCart(product)}
                    disabled={isOutOfStock}
                    aria-label={`Agregar ${product.name} al carrito`}
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
