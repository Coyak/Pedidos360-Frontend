# Pedidos360 - Frontend Client

Aplicación web frontend para la plataforma de gestión de pedidos **Pedidos360**, desarrollada como parte del proyecto de evaluación universitaria para la asignatura de Desarrollo Cloud.

## 🚀 Descripción del Proyecto

Pedidos360 Frontend es la interfaz de usuario basada en Single Page Application (SPA) que interactúa con la arquitectura de microservicios alojada en AWS. Permite a los usuarios autenticarse mediante Microsoft Entra ID (Azure AD), gestionar el catálogo de productos y visualizar el seguimiento de pedidos en tiempo real.

## ✨ Características

- **Autenticación Empresarial con Azure AD**: Integración completa con Microsoft Entra ID mediante los SDKs oficiales `@azure/msal-browser` y `@azure/msal-react`.
- **Flujo de Inicio de Sesión Modal (Popup)**: Uso del componente modular `<LoginButton />` que invoca `instance.loginPopup()` con los permisos (scopes) requeridos (`User.Read`).
- **Control de Estado de Autenticación**: Renderizado condicional mediante `<MsalProvider>`, `<AuthenticatedTemplate>` y `<UnauthenticatedTemplate>` para proteger rutas y componentes.
- **Arquitectura SPA de Alto Rendimiento**: Desarrollada con React 18 y empacada con Vite para cargas ultrarrápidas en desarrollo y producción.

## 🛠️ Tecnologías Utilizadas

- **Core Framework:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Autenticación & Seguridad:** [@azure/msal-browser](https://www.npmjs.com/package/@azure/msal-browser) & [@azure/msal-react](https://www.npmjs.com/package/@azure/msal-react) (OAuth 2.0 / OIDC con Microsoft Entra ID)
- **Lenguaje:** JavaScript (ES6+) / JSX
- **Estilos:** Vanilla CSS / Modern Design Tokens

## ⚙️ Configuración y Requisitos Previos

1. **Node.js**: Asegúrate de tener instalado Node.js (versión 18 o superior).
2. **Azure AD / Microsoft Entra ID App Registration**:
   - Obtén el **Application (Client) ID** de tu registro de aplicación en Azure AD.
   - Configura el archivo `src/authConfig.js` reemplazando `'TU_CLIENT_ID_AQUI'` con tu Client ID real.
   - El Tenant ID configurado por defecto es: `e5372bf0-c5e3-4286-887c-79069f209c1f`.

## 📦 Instalación y Ejecución Local

1. **Ingresar al directorio del proyecto**:
   ```bash
   cd Pedidos360-Frontend
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   La aplicación estará disponible por defecto en `http://localhost:5173`.

4. **Construir para producción**:
   ```bash
   npm run build
   ```

## 🏷️ Versionamiento Semántico

Este proyecto sigue la especificación de **Semantic Versioning 2.0.0 (SemVer)**:
- **v1.1.0**: Integración de `MsalProvider`, creación del componente `LoginButton` y flujo de inicio de sesión con Azure AD (MSAL).
- **v1.0.0**: Estructura base inicial con React, Vite y configuración de autenticación MSAL.