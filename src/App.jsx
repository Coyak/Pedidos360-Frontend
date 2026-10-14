import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import LoginButton from './components/LoginButton';
import Catalogo from './components/Catalogo';
import Carrito from './components/Carrito';
import OrderSuccessModal from './components/OrderSuccessModal';
import CloudConsoleModal from './components/CloudConsoleModal';
import { SearchIcon, CartIcon, CloseIcon, CloudIcon, QueueIcon } from './components/Icons';
import './App.css';

function App() {
  let instance = null;
  let accounts = [];
  try {
    const msal = useMsal();
    instance = msal?.instance;
    accounts = msal?.accounts || [];
  } catch (e) {
    // Si MSAL no está disponible
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
          console.warn("No se pudo procesar el token retornado de Microsoft:", e);
        }
      }
    }
  }, []);

  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshStockCounter, setRefreshStockCounter] = useState(0);

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
  const [isCloudConsoleOpen, setIsCloudConsoleOpen] = useState(false);
  const [completedOrderData, setCompletedOrderData] = useState(null);

  const handleLogout = () => {
    setCustomAccount(null);
    try {
      localStorage.removeItem('pedidos360_user');
    } catch {}
    if (instance && typeof instance.logoutPopup === 'function') {
      instance.logoutPopup().catch((e) => {
        console.error("Error al cerrar sesión:", e);
      });
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
    setRefreshStockCounter((prev) => prev + 1); // Disparar refresco de stock en Catálogo
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="app-container">
      {/* 1. Header de la Tienda */}
      <header className="app-header">
        <div className="header-left">
          <div 
            className="logo-container" 
            onClick={() => { setSelectedCategory('Todos'); setSearchTerm(''); }} 
            style={{ cursor: 'pointer' }}
          >
            <div className="logo-badge">360</div>
            <div className="logo-text-group">
              <h1>Pedidos360</h1>
              <span className="logo-tagline">Cloud Native Store</span>
            </div>
          </div>
        </div>

        {/* Buscador Central */}
        <div className="header-center">
          <div className="search-bar-wrapper">
            <span className="search-icon">
              <SearchIcon size={18} color="var(--text-muted)" />
            </span>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar laptops gamer, periféricos, audio..."
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

        {/* Acciones del Header */}
        <div className="header-right">
          {/* Botón Consola Cloud Ops (Para el Profesor y Evaluadores) */}
          <button
            className="cloud-console-nav-btn pulse-glow"
            onClick={() => setIsCloudConsoleOpen(true)}
            title="Abrir Consola de Rúbricas: Clúster RabbitMQ, DLQs, Auditoría SHA-256 y API Gateway"
          >
            <span className="live-dot"></span>
            <QueueIcon size={16} color="#38bdf8" />
            <span className="console-nav-text">Consola Cloud Ops</span>
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

          {/* Sección de Autenticación */}
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
                  title="Cerrar Sesión Microsoft"
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

      {/* 2. Hero Section Moderno & Limpio */}
      <section className="store-hero">
        <div className="hero-content">
          <div className="hero-pill">
            <span className="dot online"></span>
            <span>Ecosistema Multi-Cloud • AWS & Microsoft Azure</span>
          </div>
          <h2>Hardware & Tecnología de Alto Rendimiento</h2>
          <p>
            Plataforma desacoplada con <strong>AWS HTTP API Gateway</strong>, autenticación corporativa <strong>Microsoft Entra ID (PKCE)</strong> y mensajería transaccional con <strong>Clúster RabbitMQ</strong>.
          </p>
          <div className="hero-badges-row">
            <span className="tech-badge aws-chip">
              <CloudIcon size={14} /> AWS API Gateway
            </span>
            <span className="tech-badge rabbit-chip">
              <QueueIcon size={14} /> Clúster RabbitMQ 2 Nodos
            </span>
            <span className="tech-badge azure-chip">
              Azure Entra ID JWT
            </span>
            <span className="tech-badge spring-chip">
              5 Microservicios Spring Boot
            </span>
          </div>
        </div>
      </section>

      {/* 3. Catálogo Principal con Stock en Vivo */}
      <main className="app-main">
        <Catalogo
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchTerm={searchTerm}
          onAddToCart={handleAddToCart}
          cartItems={cartItems}
          refreshTrigger={refreshStockCounter}
        />
      </main>

      {/* 4. Carrito de Compras (Drawer lateral) */}
      <Carrito
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOrderSuccess={handleOrderSuccess}
        activeAccount={activeAccount}
      />

      {/* 5. Modal de Pedido Procesado */}
      <OrderSuccessModal
        orderData={completedOrderData}
        onClose={() => setCompletedOrderData(null)}
      />

      {/* 6. Consola de Microservicios & RabbitMQ (Rúbricas EP3 y EP4) */}
      <CloudConsoleModal
        isOpen={isCloudConsoleOpen}
        onClose={() => setIsCloudConsoleOpen(false)}
      />

      {/* 7. Footer Limpio */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>© 2026 Pedidos360 Cloud Store • Plataforma Cloud Native Multi-Cloud</p>
          <div className="footer-links">
            <span>Perímetro Cloud: <code>AWS HTTP API Gateway (v1)</code></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
