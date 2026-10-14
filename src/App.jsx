import React, { useState } from 'react';
import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import LoginButton from './components/LoginButton';
import Catalogo from './components/Catalogo';
import Carrito from './components/Carrito';
import OrderSuccessModal from './components/OrderSuccessModal';
import CloudConsoleModal from './components/CloudConsoleModal';
import { initialProducts } from './data/products';
import { SearchIcon, CartIcon, CloseIcon, CloudIcon, ShieldCheckIcon, QueueIcon } from './components/Icons';
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
  const activeAccount = accounts[0];

  const [products] = useState(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

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
  const [showArchDetails, setShowArchDetails] = useState(false);

  const handleLogout = () => {
    instance.logoutPopup().catch((e) => {
      console.error("Error al cerrar sesión:", e);
    });
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
              <span className="logo-tagline">Cloud Store</span>
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
              placeholder="Buscar laptops, periféricos, monitores..."
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

        {/* Acciones y Autenticación de Usuario */}
        <div className="header-right">
          <button
            className="cloud-console-nav-btn"
            onClick={() => setIsCloudConsoleOpen(true)}
            title="Abrir Consola RabbitMQ, Auditoría SHA-256 y Microservicios"
          >
            <QueueIcon size={17} color="#38bdf8" />
            <span className="console-nav-text">Consola RabbitMQ & Cloud</span>
          </button>

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
              <LoginButton />
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Banner de la Tienda */}
      <section className="store-hero">
        <div className="hero-content">
          <div className="hero-pill">
            <span className="dot online"></span>
            <span>Arquitectura Cloud Native • Duoc UC</span>
          </div>
          <h2>Equipamiento Tecnológico de Alto Rendimiento</h2>
          <p>
            Plataforma e-commerce desacoplada y securizada con <strong>Microsoft Entra ID (Azure AD)</strong>, 
            perímetro en <strong>AWS HTTP API Gateway</strong> y mensajería distribuida con <strong>Clúster RabbitMQ</strong>.
          </p>
          <div className="hero-badges-row">
            <span className="tech-badge aws-chip">
              <CloudIcon size={15} /> AWS API Gateway
            </span>
            <span className="tech-badge rabbit-chip" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#ea580c', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
              <QueueIcon size={15} /> Clúster RabbitMQ 2 Nodos
            </span>
            <span className="tech-badge audit-chip" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <ShieldCheckIcon size={15} /> Auditoría SHA-256
            </span>
            <span className="tech-badge azure-chip">
              <ShieldCheckIcon size={15} /> Azure AD JWT Token
            </span>
            <span className="tech-badge spring-chip">
              5 Microservicios Spring Boot
            </span>
          </div>
        </div>
      </section>

      {/* 3. Catálogo Principal */}
      <main className="app-main">
        <Catalogo
          products={products}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchTerm={searchTerm}
          onAddToCart={handleAddToCart}
          cartItems={cartItems}
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
        onOrderSuccess={(orderData) => setCompletedOrderData(orderData)}
      />

      {/* 5. Modal de Pedido Procesado en AWS */}
      <OrderSuccessModal
        orderData={completedOrderData}
        onClose={() => setCompletedOrderData(null)}
      />

      {/* 6. Consola de Microservicios & RabbitMQ */}
      <CloudConsoleModal
        isOpen={isCloudConsoleOpen}
        onClose={() => setIsCloudConsoleOpen(false)}
      />

      {/* 7. Panel Desplegable de Arquitectura Cloud */}
      <section className="architecture-bar">
        <div className="arch-bar-header" onClick={() => setShowArchDetails(!showArchDetails)}>
          <div className="arch-title">
            <CloudIcon size={18} color="var(--primary-accent)" />
            <span>Diagrama de Flujo e Integración Cloud Native (AWS + Azure + RabbitMQ)</span>
          </div>
          <button className="btn-toggle-arch">
            {showArchDetails ? 'Ocultar' : 'Ver Detalle de Arquitectura'}
          </button>
        </div>

        {showArchDetails && (
          <div className="arch-details-content">
            <div className="arch-steps-grid">
              <div className="arch-step-card">
                <span className="step-num">1</span>
                <h4>Azure AD (Entra ID)</h4>
                <p>Autenticación OAuth2/OIDC con PKCE vía MSAL. Emite JWT firmado con el Client ID de Pedidos360.</p>
              </div>

              <div className="arch-step-card">
                <span className="step-num">2</span>
                <h4>AWS API Gateway</h4>
                <p>Perímetro de red con JWT Authorizer nativo. Valida firma y audiencia; rechaza 401 si no hay token.</p>
              </div>

              <div className="arch-step-card">
                <span className="step-num">3</span>
                <h4>Microservicio Carrito (:8081)</h4>
                <p>Recibe la transacción en <code>/carrito/pedidos</code> y publica el evento <code>pedidos.pedido.creado</code> en RabbitMQ.</p>
              </div>

              <div className="arch-step-card">
                <span className="step-num">4</span>
                <h4>Clúster RabbitMQ (2 Nodos)</h4>
                <p>Exchange topic <code>pedidos.exchange</code> enruta a 3 colas de dominio con sus 3 DLQs vía <code>pedidos.dlx.exchange</code>.</p>
              </div>

              <div className="arch-step-card">
                <span className="step-num">5</span>
                <h4>Catálogo (:8080) & Notificaciones (:8082)</h4>
                <p>Consumen eventos con ACK manual; Catálogo descuenta inventario y Notificaciones despacha el correo.</p>
              </div>

              <div className="arch-step-card">
                <span className="step-num">6</span>
                <h4>Auditoría (:8083) & Admin (:8084)</h4>
                <p>Auditoría sella transacciones con Hash SHA-256 inmutable. Admin expone API REST para gestionar colas.</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 7. Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>© 2026 Pedidos360 Store • Evaluación Desarrollo Cloud Native • Duoc UC</p>
          <div className="footer-links">
            <span>Backend AWS: <code>op6erfwwmh.execute-api.us-east-1.amazonaws.com</code></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
