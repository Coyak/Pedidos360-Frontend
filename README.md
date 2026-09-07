# Pedidos360 - Frontend Client

Aplicación web frontend para la plataforma de gestión de pedidos **Pedidos360**, desarrollada como parte del proyecto de evaluación universitaria para la asignatura de Desarrollo Cloud.

## 🚀 Descripción del Proyecto

Pedidos360 Frontend es la interfaz de usuario basada en Single Page Application (SPA) que interactúa con la arquitectura de microservicios alojada en AWS. Permite a los usuarios autenticarse mediante Microsoft Entra ID (Azure AD), consumir servicios de API Gateway protegidos mediante tokens JWT (Bearer Tokens) y gestionar el flujo de catálogo y pedidos de compra en tiempo real.

## ✨ Características

- **Autenticación Empresarial con Azure AD**: Integración completa con Microsoft Entra ID mediante los SDKs oficiales `@azure/msal-browser` y `@azure/msal-react`.
- **Integración con AWS HTTP API Gateway (JWT Authorizer Nativo)**: Conexión directa a la API HTTP Gateway (`https://op6erfwwmh.execute-api.us-east-1.amazonaws.com`) con validación de tokens JWT en la capa perimetral (Edge).
- **Módulo de Catálogo & Módulo de Carrito**:
  - `<Catalogo />`: Consulta de disponibilidad de servicios de Catálogo (`GET /v1/api/status`).
  - `<Carrito />`: Registro de pedidos de compra en tiempo real (`POST /v1/api/carrito/pedidos`) que interactúa con el microservicio desacoplado en puerto 8081.
- **Control de Estado de Autenticación**: Renderizado condicional con `<MsalProvider>`, `<AuthenticatedTemplate>` y `<UnauthenticatedTemplate>`.
- **Arquitectura SPA de Alto Rendimiento**: Desarrollada con React 18 y empacada con Vite.

## 🛠️ Tecnologías Utilizadas

- **Core Framework:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Autenticación & Seguridad:** [@azure/msal-browser](https://www.npmjs.com/package/@azure/msal-browser) & [@azure/msal-react](https://www.npmjs.com/package/@azure/msal-react) (OAuth 2.0 / OIDC con Microsoft Entra ID)
- **Backend & Cloud:** AWS HTTP API Gateway / Microservicios Spring Boot (`Catálogo` y `Carrito`)
- **Lenguaje & Estilos:** JavaScript (ES6+) / JSX / Vanilla CSS (Modern Design System)

## ⚙️ Configuración y Requisitos Previos

1. **Node.js**: Asegúrate de tener instalado Node.js (versión 18 o superior).
2. **Azure AD / Microsoft Entra ID App Registration**:
   - Application (Client) ID configurado: `5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4`.
   - Tenant ID configurado: `e5372bf0-c5e3-4286-887c-79069f209c1f`.
   - Scope expuesto para autorización: `5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4/.default`.

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
- **v1.3.0**: Incorporación del componente `<Carrito />` para el registro transaccional de pedidos de compra mediante peticiones `POST /v1/api/carrito/pedidos` con tokens JWT autorizados.
- **v1.2.2 (Patch Fix)**: Migración de endpoint de consulta a la nueva API HTTP Gateway en AWS (`https://op6erfwwmh.execute-api.us-east-1.amazonaws.com/v1/api/status`).
- **v1.2.1**: Corrección de scope MSAL a `5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4/.default`.
- **v1.2.0**: Consumo seguro del API Gateway en AWS mediante tokens JWT autorizados en el header `Authorization: Bearer <token>` a través del componente `<Catalogo />`.
- **v1.1.0**: Integración de `MsalProvider`, creación del componente `LoginButton` y flujo de inicio de sesión con Azure AD (MSAL).
- **v1.0.0**: Estructura base inicial con React, Vite y configuración de autenticación MSAL.