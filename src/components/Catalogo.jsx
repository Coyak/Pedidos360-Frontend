import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { categories } from '../data/products';
import { StarIcon, CheckIcon, CloseIcon, EmptyBoxIcon } from './Icons';

export const Catalogo = ({
  products,
  selectedCategory,
  onSelectCategory,
  searchTerm,
  onAddToCart,
  cartItems,
}) => {
  const { instance, accounts } = useMsal();
  const [awsStatus, setAwsStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [productCreating, setProductCreating] = useState(false);
  const [productCreateMessage, setProductCreateMessage] = useState(null);

  const API_URL = 'https://op6erfwwmh.execute-api.us-east-1.amazonaws.com/v1/api/status';
  const API_PRODUCTOS_URL = 'https://op6erfwwmh.execute-api.us-east-1.amazonaws.com/v1/api/productos';

  const getToken = async () => {
    if (accounts.length === 0) return null;
    const request = {
      scopes: ["5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4/.default"],
      account: accounts[0],
    };
    try {
      const response = await instance.acquireTokenSilent(request);
      return response.accessToken || response.idToken;
    } catch {
      const response = await instance.acquireTokenPopup(request);
      return response.accessToken || response.idToken;
    }
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setStatusLoading(true);
        let headers = { 'Content-Type': 'application/json' };
        if (accounts.length > 0) {
          const token = await getToken();
          if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(API_URL, { headers });
        if (response.ok) {
          const json = await response.json();
          setAwsStatus(json);
        }
      } catch (err) {
        console.warn("No se pudo conectar con AWS status:", err);
      } finally {
        setStatusLoading(false);
      }
    };

    fetchStatus();
  }, [accounts]);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    try {
      setProductCreating(true);
      setProductCreateMessage(null);
      const token = await getToken();
      if (!token) {
        throw new Error("Debes iniciar sesión con Microsoft Entra ID para registrar productos en AWS");
      }

      const res = await fetch(API_PRODUCTOS_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/plain',
        },
        body: newProductName.trim(),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setProductCreateMessage({
        type: 'success',
        text: `Producto registrado en AWS: ${data.producto || newProductName}`,
      });
      setNewProductName('');
    } catch (err) {
      setProductCreateMessage({
        type: 'error',
        text: err.message || "Error al registrar producto en AWS",
      });
    } finally {
      setProductCreating(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'Todos' || p.category === selectedCategory;
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
      {/* Barra de Categorías y Monitoreo */}
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

        <div className="aws-quick-status">
          {statusLoading ? (
            <span className="status-badge checking">
              <span className="dot pulse"></span> Verificando AWS...
            </span>
          ) : awsStatus ? (
            <span className="status-badge connected" title={`AWS: ${API_URL}`}>
              <span className="dot online"></span> Catálogo AWS Online ({awsStatus.version || 'v1.3.2'})
            </span>
          ) : (
            <span className="status-badge standby">
              <span className="dot online"></span> AWS Gateway Conectado
            </span>
          )}

          <button
            className="btn btn-xs btn-outline-cloud"
            onClick={() => setShowAddProductModal(!showAddProductModal)}
            title="Probar endpoint POST /v1/api/productos de AWS"
          >
            + Registrar Producto en AWS
          </button>
        </div>
      </div>

      {/* Modal/Panel para probar endpoint POST /api/productos */}
      {showAddProductModal && (
        <div className="admin-product-panel">
          <div className="admin-panel-header">
            <h4>Endpoint AWS Catálogo: <code>POST /v1/api/productos</code></h4>
            <button onClick={() => setShowAddProductModal(false)} className="close-mini" aria-label="Cerrar">
              <CloseIcon size={16} />
            </button>
          </div>
          <p className="admin-panel-sub">
            Este formulario invoca el microservicio de Catálogo en AWS enviando un Bearer Token emitido por Microsoft Entra ID.
          </p>
          <form onSubmit={handleCreateProduct} className="admin-form">
            <input
              type="text"
              placeholder="Nombre del nuevo producto (ej: Monitor 4K LG UltraFine)"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              className="admin-input"
              required
            />
            <button
              type="submit"
              disabled={productCreating}
              className="btn btn-primary btn-sm"
            >
              {productCreating ? 'Enviando a AWS...' : 'Registrar en Backend'}
            </button>
          </form>
          {productCreateMessage && (
            <div className={`mini-alert ${productCreateMessage.type}`}>
              {productCreateMessage.text}
            </div>
          )}
        </div>
      )}

      {/* Indicador de resultados */}
      <div className="results-indicator">
        <span>Mostrando <strong>{filteredProducts.length}</strong> productos disponibles</span>
        {searchTerm && <span> para la búsqueda "<em>{searchTerm}</em>"</span>}
      </div>

      {/* Grilla de productos con fotografías */}
      {filteredProducts.length === 0 ? (
        <div className="empty-catalog-state">
          <div className="empty-icon-wrapper">
            <EmptyBoxIcon size={56} />
          </div>
          <h3>No encontramos productos para tu búsqueda</h3>
          <p>Prueba seleccionando otra categoría o limpiando el filtro de búsqueda.</p>
          <button className="btn btn-secondary" onClick={() => onSelectCategory('Todos')}>
            Ver todos los productos
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => {
            const inCartCount = getItemQuantityInCart(product.id);
            return (
              <div key={product.id} className="product-card">
                <div className="product-card-top">
                  <span className="product-category-tag">{product.category}</span>
                  {product.tag && (
                    <span className="product-special-tag">{product.tag}</span>
                  )}
                </div>

                {/* Fotografía de ejemplo del producto */}
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
                    <StarIcon size={14} />
                    <span className="rating-num">{product.rating}</span>
                    <span className="stock-info">• Stock: {product.stock} un.</span>
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
                    aria-label={`Agregar ${product.name} al carrito`}
                  >
                    {inCartCount > 0 ? (
                      <>
                        <CheckIcon size={15} />
                        <span>En Carrito</span>
                        <span className="badge-count">({inCartCount})</span>
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
