import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import LoginButton from './components/LoginButton';
import Catalogo from './components/Catalogo';
import Carrito from './components/Carrito';
import OrderSuccessModal from './components/OrderSuccessModal';
import MisComprasModal from './components/MisComprasModal';
import WebpayModal from './components/WebpayModal';
import ProductDetailPage from './components/ProductDetailPage';
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

  // Sincronización de Rutas con window.location (Hash Routing nativo: #/, #/producto/:id, #/cloudops)
  const parseCurrentRoute = () => {
    if (typeof window === 'undefined') return { view: 'home', param: null };
    const hash = window.location.hash || '#/';
    if (hash.startsWith('#/producto/')) {
      return { view: 'product', param: hash.replace('#/producto/', '') };
    }
    if (hash === '#/cloudops') {
      return { view: 'cloudops', param: null };
    }
    return { view: 'home', param: null };
  };

  const [currentRoute, setCurrentRoute] = useState(parseCurrentRoute());

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(parseCurrentRoute());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Función unificada de navegación
  const navigateTo = (view, param = null) => {
    if (view === 'home') {
      window.location.hash = '#/';
      if (param) setSelectedCategory(param);
    } else if (view === 'product') {
      window.location.hash = `#/producto/${param}`;
    } else if (view === 'cloudops') {
      window.location.hash = '#/cloudops';
    }
  };

  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshStockCounter, setRefreshStockCounter] = useState(0);

  // Carrito vacío por defecto (sin productos pre-agregados)
  const [cartItems, setCartItems] = useState([]);
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
    // Si estaba en la vista de Cloud Ops y se deslogea, volver a la tienda
    if (currentRoute.view === 'cloudops') {
      navigateTo('home');
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
              navigateTo('home');
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

          {/* Switch de Vistas: Solo muestra Cloud Ops si el usuario está autenticado */}
          <nav className="header-nav-switcher">
            <button
              className={`nav-tab-btn ${currentRoute.view === 'home' || currentRoute.view === 'product' ? 'active' : ''}`}
              onClick={() => navigateTo('home')}
            >
              <span>🛍️</span>
              <span>Tienda Online</span>
            </button>

            {activeAccount && (
              <button
                className={`nav-tab-btn ${currentRoute.view === 'cloudops' ? 'active' : ''}`}
                onClick={() => navigateTo('cloudops')}
                title="Consola técnica disponible para usuarios autenticados"
              >
                <span className="live-dot-green"></span>
                <span>⚡ Cloud Ops & Telemetría</span>
              </button>
            )}
          </nav>
        </div>

        {/* Buscador Central (Solo visible en la vista de Catálogo Tienda) */}
        {currentRoute.view === 'home' && (
          <div className="header-center">
            <div className="search-bar-wrapper">
              <span className="search-icon">
                <SearchIcon size={18} color="var(--text-muted)" />
              </span>
              <input
                type="text"
                className="search-input"
                placeholder="Buscar laptops gamer, periféricos, monitores, audio..."
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

      {/* 2. Ruteo de Vistas */}

      {/* RUTA 1: Centro Cloud Ops & Telemetría (#/cloudops) */}
      {currentRoute.view === 'cloudops' && (
        <main className="app-main">
          {activeAccount ? (
            <CloudOpsView />
          ) : (
            <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
              <h3>Acceso Restringido</h3>
              <p style={{ color: '#94a3b8' }}>Debes iniciar sesión con tu cuenta corporativa para acceder al centro de operaciones.</p>
              <button className="btn btn-primary" onClick={() => navigateTo('home')} style={{ marginTop: '1rem' }}>
                Volver a la Tienda
              </button>
            </div>
          )}
        </main>
      )}

      {/* RUTA 2: Página Dedicada de Producto (#/producto/:id) */}
      {currentRoute.view === 'product' && (
        <main className="app-main">
          <ProductDetailPage
            productId={currentRoute.param}
            onNavigate={navigateTo}
            onAddToCart={handleAddToCart}
            cartItems={cartItems}
          />
        </main>
      )}

      {/* RUTA 3: Tienda y Catálogo General (#/ o ruta por defecto) */}
      {currentRoute.view === 'home' && (
        <>
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

          <main className="app-main">
            <Catalogo
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchTerm={searchTerm}
              onAddToCart={handleAddToCart}
              cartItems={cartItems}
              refreshTrigger={refreshStockCounter}
              onOpenProductDetail={(product) => navigateTo('product', product.id)}
            />
          </main>
        </>
      )}

      {/* 3. Carrito de Compras (Drawer lateral) */}
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

      {/* 4. Modal de Pagos con Webpay Plus y Detección Antifraude */}
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

      {/* 5. Modal de Confirmación de Pedido */}
      <OrderSuccessModal
        orderData={completedOrderData}
        onClose={() => setCompletedOrderData(null)}
      />

      {/* 6. Modal de Mis Compras Recientes (Auditoría SHA-256) */}
      <MisComprasModal
        isOpen={isComprasOpen}
        onClose={() => setIsComprasOpen(false)}
        activeAccount={activeAccount}
      />

      {/* 7. Footer Corporativo */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>© 2026 Pedidos360 Enterprise • Arquitectura Cloud Native & Streaming</p>
          <div className="footer-links">
            <span>Perímetro: <code>AWS Native Multi-Port Architecture</code></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
