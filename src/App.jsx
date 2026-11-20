import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import LoginButton from './components/LoginButton';
import Catalogo from './components/Catalogo';
import Carrito from './components/Carrito';
import OrderSuccessModal from './components/OrderSuccessModal';
import MisComprasModal from './components/MisComprasModal';
import WebpayModal from './components/WebpayModal';
import ProductDetailModal from './components/ProductDetailModal';
import CloudOpsView from './components/CloudOpsView';
import { SearchIcon, CartIcon, CloseIcon, CloudIcon, QueueIcon, ShieldCheckIcon } from './components/Icons';
import './App.css';

function App() {
  let instance = null;
  let accounts = [];
  try {
    const msal = useMsal();
    instance = msal?.instance;
    accounts = msal?.accounts || [];
  } catch (e) {
    // MSAL provider opcional
  }

  const [customAccount, setCustomAccount] = useState(() => {
    try {
      const saved = localStorage.getItem('pedidos360_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const activeAccount = customAccount || accounts[0];

  const handleLoginSuccess = (account) => {
    setCustomAccount(account);
    try {
      localStorage.setItem('pedidos360_user', JSON.stringify(account));
    } catch {}
  };

  // Escuchar retorno de Microsoft Entra ID OAuth2 (#id_token=... o #access_token=...)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get('id_token') || params.get('access_token');
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length >= 2) {
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const payload = JSON.parse(jsonPayload);
            const account = {
              name: payload.name || payload.preferred_username || 'Usuario Microsoft',
              username: payload.preferred_username || payload.email || payload.upn || 'cliente@pedidos360.com',
              idTokenClaims: payload,
              accessToken: token,
            };
            handleLoginSuccess(account);
            window.history.replaceState(null, '', window.location.pathname);
          }
        } catch (e) {
          console.warn("No se pudo procesar el token de Microsoft:", e);
        }
      }
    }
  }, []);

  // Vistas principales: 'store' (Tienda) o 'cloudops' (Cloud Ops & Telemetría)
  const [activeMainView, setActiveMainView] = useState('store');

  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshStockCounter, setRefreshStockCounter] = useState(0);

  // Modal de Detalle de Producto
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);

  const [cartItems, setCartItems] = useState([
    {
      id: "PROD-101",
      name: "Laptop Asus ROG Strix G16",
      price: 1290000,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80",
    }
  ]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isComprasOpen, setIsComprasOpen] = useState(false);
  const [webpayCheckoutData, setWebpayCheckoutData] = useState(null);
  const [completedOrderData, setCompletedOrderData] = useState(null);

  const handleLogout = () => {
    setCustomAccount(null);
    try {
      localStorage.removeItem('pedidos360_user');
    } catch {}
    if (instance && typeof instance.logoutPopup === 'function') {
      instance.logoutPopup().catch(() => {});
    }
  };

  const handleAddToCart = (product) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === product.id);
      if (existing) {
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prevItems,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId, delta) => {
    setCartItems((prevItems) => {
      return prevItems
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const handleRemoveItem = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleOrderSuccess = (orderData) => {
    setCompletedOrderData(orderData);
    setRefreshStockCounter((prev) => prev + 1);
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="app-container">
      {/* 1. Header de la Aplicación */}
      <header className="app-header">
        <div className="header-left">
          <div 
            className="logo-container" 
            onClick={() => { 
              setActiveMainView('store');
              setSelectedCategory('Todos'); 
              setSearchTerm(''); 
            }} 
            style={{ cursor: 'pointer' }}
          >
            <div className="logo-badge">360</div>
            <div className="logo-text-group">
              <h1>Pedidos360</h1>
              <span className="logo-tagline">Enterprise Cloud Store</span>
            </div>
          </div>

          {/* Switch de Vistas: Tienda vs Cloud Ops */}
          <nav className="header-nav-switcher">
            <button
              className={`nav-tab-btn ${activeMainView === 'store' ? 'active' : ''}`}
              onClick={() => setActiveMainView('store')}
            >
              <span>🛍️</span>
              <span>Tienda Online</span>
            </button>
            <button
              className={`nav-tab-btn ${activeMainView === 'cloudops' ? 'active' : ''}`}
              onClick={() => setActiveMainView('cloudops')}
            >
              <span className="live-dot-green"></span>
              <span>⚡ Cloud Ops & Telemetría</span>
            </button>
          </nav>
        </div>

        {/* Buscador Central (Solo visible en la Tienda) */}
        {activeMainView === 'store' && (
          <div className="header-center">
            <div className="search-bar-wrapper">
              <span className="search-icon">
                <SearchIcon size={18} color="var(--text-muted)" />
              </span>
              <input
                type="text"
                className="search-input"
                placeholder="Buscar laptops, periféricos, monitores, audio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="clear-search-btn" 
                  onClick={() => setSearchTerm('')}
                  aria-label="Limpiar búsqueda"
                >
                  <CloseIcon size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Acciones del Header */}
        <div className="header-right">
          {/* Botón Mis Compras (Sellos SHA-256) */}
          <button
            className="compras-nav-btn"
            onClick={() => setIsComprasOpen(true)}
            title="Ver historial de compras y comprobantes de auditoría"
          >
            <ShieldCheckIcon size={16} color="#10b981" />
            <span className="compras-nav-text">Mis Compras</span>
          </button>

          {/* Carrito de Compras */}
          <button
            className="cart-nav-btn"
            onClick={() => setIsCartOpen(true)}
            aria-label="Abrir carrito de compras"
          >
            <CartIcon size={18} />
            <span className="cart-nav-text">Carrito</span>
            {totalCartCount > 0 && (
              <span className="cart-nav-badge">{totalCartCount}</span>
            )}
          </button>

          {/* Autenticación Corporativa Azure Entra ID */}
          <div className="auth-section">
            {activeAccount ? (
              <div className="user-profile-menu">
                <div className="user-avatar">
                  {activeAccount?.name ? activeAccount.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="user-meta">
                  <span className="user-name">{activeAccount?.name || 'Usuario'}</span>
                  <span className="user-email">{activeAccount?.username || 'Entra ID'}</span>
                </div>
                <button
                  className="btn btn-logout"
                  onClick={handleLogout}
                  title="Cerrar Sesión"
                >
                  Salir
                </button>
              </div>
            ) : (
              <LoginButton onLoginSuccess={handleLoginSuccess} />
            )}
          </div>
        </div>
      </header>

      {/* 2. Renderizado Condicional de la Vista Principal */}
      {activeMainView === 'cloudops' ? (
        <main className="app-main">
          <CloudOpsView />
        </main>
      ) : (
        <>
          {/* Hero Section Corporativo y Elegante */}
          <section className="store-hero">
            <div className="hero-content">
              <div className="hero-pill">
                <span className="dot online"></span>
                <span>Plataforma Multi-Cloud • AWS & Microsoft Azure</span>
              </div>
              <h2>Hardware & E-Commerce de Alto Rendimiento</h2>
              <p>
                Equipamiento profesional respaldado por arquitectura orientada a eventos con <strong>Apache Kafka</strong>, pasarela oficial <strong>Transbank Webpay Plus</strong> y mensajería transaccional <strong>RabbitMQ</strong>.
              </p>
              <div className="hero-badges-row">
                <span className="tech-badge aws-chip">
                  <CloudIcon size={14} /> AWS Cloud Native
                </span>
                <span className="tech-badge" style={{ background: 'rgba(234, 88, 12, 0.15)', color: '#fb923c', border: '1px solid #ea580c' }}>
                  ⚡ Apache Kafka KRaft
                </span>
                <span className="tech-badge" style={{ background: 'rgba(2, 132, 199, 0.15)', color: '#38bdf8', border: '1px solid #0284c7' }}>
                  💳 Transbank Webpay Plus
                </span>
                <span className="tech-badge rabbit-chip">
                  <QueueIcon size={14} /> RabbitMQ Clúster Resiliente
                </span>
              </div>
            </div>
          </section>

          {/* Catálogo Principal */}
          <main className="app-main">
            <Catalogo
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchTerm={searchTerm}
              onAddToCart={handleAddToCart}
              cartItems={cartItems}
              refreshTrigger={refreshStockCounter}
              onOpenProductDetail={(product) => setSelectedProductForDetail(product)}
            />
          </main>
        </>
      )}

      {/* 3. Modal de Ficha Técnica y Detalle del Producto (con Recomendaciones) */}
      <ProductDetailModal
        product={selectedProductForDetail}
        isOpen={!!selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        onAddToCart={handleAddToCart}
        cartItems={cartItems}
        onSelectProduct={(newProduct) => setSelectedProductForDetail(newProduct)}
      />

      {/* 4. Carrito de Compras (Drawer lateral) */}
      <Carrito
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOrderSuccess={handleOrderSuccess}
        onOpenWebpay={(checkoutInfo) => {
          setIsCartOpen(false);
          setWebpayCheckoutData(checkoutInfo);
        }}
        activeAccount={activeAccount}
      />

      {/* 5. Modal de Pagos con Webpay Plus y Detección Antifraude */}
      <WebpayModal
        isOpen={!!webpayCheckoutData}
        onClose={() => setWebpayCheckoutData(null)}
        cartItems={cartItems}
        customerEmail={webpayCheckoutData?.customerEmail || activeAccount?.username || 'cliente@pedidos360.com'}
        shippingAddress={webpayCheckoutData?.shippingAddress || 'Av. Providencia 1234, Santiago'}
        totalAmount={webpayCheckoutData?.totalAmount || 0}
        onPaymentSuccess={(pagoResult) => {
          handleClearCart();
          handleOrderSuccess({
            response: {
              pedidoId: pagoResult.buyOrder,
              totalPagar: pagoResult.total,
              estado: 'CONFIRMADO_WEBPAY',
            },
            payload: pagoResult,
            timestamp: new Date().toISOString(),
            metodo: 'Transbank Webpay Plus',
          });
        }}
      />

      {/* 6. Modal de Confirmación de Pedido */}
      <OrderSuccessModal
        orderData={completedOrderData}
        onClose={() => setCompletedOrderData(null)}
      />

      {/* 7. Modal de Mis Compras Recientes (Auditoría SHA-256) */}
      <MisComprasModal
        isOpen={isComprasOpen}
        onClose={() => setIsComprasOpen(false)}
        activeAccount={activeAccount}
      />

      {/* 8. Footer Corporativo */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>© 2026 Pedidos360 Enterprise • Arquitectura Cloud Native & Streaming</p>
          <div className="footer-links">
            <span>Perímetro: <code>AWS Native (Direct Multi-Port Architecture)</code></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
