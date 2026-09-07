# Pedidos360 - Frontend Client

Aplicación web frontend para la plataforma de gestión de pedidos **Pedidos360**, desarrollada como parte del proyecto de evaluación universitaria para la asignatura de Desarrollo Cloud.

## 🚀 Descripción del Proyecto

Pedidos360 Frontend es la interfaz de usuario basada en Single Page Application (SPA) que interactúa con la arquitectura de microservicios alojada en AWS. Permite a los usuarios autenticarse mediante Microsoft Entra ID (Azure AD), consumir servicios de API Gateway protegidos mediante tokens JWT (Bearer Tokens) y gestionar el flujo de la aplicación.

## ✨ Características

- **Autenticación Empresarial con Azure AD**: Integración completa con Microsoft Entra ID mediante los SDKs oficiales `@azure/msal-browser` y `@azure/msal-react`.
- **Consumo Seguro de API Gateway en AWS**: Componente `<Catalogo />` que obtiene silenciosamente tokens JWT mediante `acquireTokenSilent` usando el scope nativo de la API (`api://5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4/.default`) y envía solicitudes HTTP autorizadas (`Authorization: Bearer <token>`) al API Gateway (`https://80nkiz7e32.execute-api.us-east-1.amazonaws.com/v1/api/status`).
- **Flujo de Inicio de Sesión Modal (Popup)**: Componente modular `<LoginButton />` que invoca `instance.loginPopup()` con los scopes configurados en `authConfig.js`.
- **Control de Estado de Autenticación**: Renderizado condicional con `<MsalProvider>`, `<AuthenticatedTemplate>` y `<UnauthenticatedTemplate>` para garantizar que la API solo sea consumida cuando exista una sesión válida.
- **Arquitectura SPA de Alto Rendimiento**: Desarrollada con React 18 y empacada con Vite.

## 🛠️ Tecnologías Utilizadas

- **Core Framework:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Autenticación & Seguridad:** [@azure/msal-browser](https://www.npmjs.com/package/@azure/msal-browser) & [@azure/msal-react](https://www.npmjs.com/package/@azure/msal-react) (OAuth 2.0 / OIDC con Microsoft Entra ID)
- **Backend & Cloud:** AWS API Gateway / Serverless Microservices (`https://80nkiz7e32.execute-api.us-east-1.amazonaws.com/v1/api/status`)
- **Lenguaje & Estilos:** JavaScript (ES6+) / JSX / Vanilla CSS (Modern Design System)

## ⚙️ Configuración y Requisitos Previos

1. **Node.js**: Asegúrate de tener instalado Node.js (versión 18 o superior).
2. **Azure AD / Microsoft Entra ID App Registration**:
   - Application (Client) ID configurado: `5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4`.
   - Tenant ID configurado: `e5372bf0-c5e3-4286-887c-79069f209c1f`.
   - Scope expuesto para autorización: `api://5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4/.default`.

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
- **v1.2.1 (Patch Fix)**: Corrección de scope MSAL a `api://5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4/.default` solucionando el error HTTP 401 (Unauthorized) al solicitar el token correcto para el backend en AWS API Gateway.
- **v1.2.0**: Consumo seguro del API Gateway en AWS mediante tokens JWT autorizados en el header `Authorization: Bearer <token>` a través del componente `<Catalogo />`.
- **v1.1.0**: Integración de `MsalProvider`, creación del componente `LoginButton` y flujo de inicio de sesión con Azure AD (MSAL).
- **v1.0.0**: Estructura base inicial con React, Vite y configuración de autenticación MSAL.