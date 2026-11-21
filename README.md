# Pedidos360 - Frontend Client (SPA React 18 + Vite)

Aplicación web empresarial Single Page Application (SPA) para la plataforma **Pedidos360**, actualizada y optimizada para la **Evaluación 3** de Desarrollo Cloud. Cumple con la regla crítica de **CERO DEPENDENCIAS DE LOCALHOST** en el código fuente, configuración y construcción para producción.

---

## 🚀 Alcance de la Evaluación 3

* **Autenticación Multi-Cloud:** Integración con Microsoft Entra ID (Azure AD) mediante `@azure/msal-browser` y `@azure/msal-react`, capturando claims del usuario y transmitiendo tokens JWT en `Authorization: Bearer <token>`.
* **Pasarela Oficial Transbank Webpay Plus:** Modal de checkout en tema oscuro con redirección oficial por formulario `POST` con `token_ws` hacia `https://webpay3gint.transbank.cl`.
* **Flujo de Retorno Robusto (`/callback`):** Pantalla de confirmación con voucher electrónico oficial, manejo de tarjetas de prueba (`6623` aprobada, `6624` fondos insuficientes), detección de cancelaciones de usuario (`TBK_TOKEN`), recargas seguras y limpieza de historial para evitar bucles.
* **Detección y Visualización Antifraude (HTTP 429):** Banner visual de alerta de seguridad ante ráfagas (`>3 intentos en <=10s`, procesadas vía tópico Kafka `payment-attempts` y alertadas en `pedidos.alertas.fraude`), deshabilitación de botones y emisión de trazas hacia `ms-analytics`.
* **Centro CloudOps 360 & Telemetría en Tiempo Real (+3 pts):** Dashboard dividido por pestañas activas (`Resumen Ejecutivo`, `Microservicios`, `Streaming Kafka`, `Demanda & Top 5`, `Seguridad & 429`, `Clúster RabbitMQ`) con conexión WebSocket remota (`/ws-analytics-raw` suscrito por STOMP al canal `/topic/metricas`).
* **Motor de Recomendaciones Dinámicas:** Sección de recomendaciones en catálogo alimentada por interacciones del usuario (`view`, `cart`, `purchase`) publicadas hacia el tópico Kafka `interacciones-user` en `ms-analytics`.
* **Cero Localhost:** Todos los endpoints se parametrizan mediante `VITE_*` y se inyectan en el `Dockerfile` como `ARG`/`ENV` durante `npm run build`.

---

## ⚙️ Variables de Entorno (Vite)

Configurables en `Pedidos360-Frontend/.env` o inyectadas en Docker:

```bash
# Host Remoto o Dominio Cloud
VITE_REMOTE_HOST=<IP_PUBLICA_EC2>

# Microsoft Entra ID (Azure AD)
VITE_AZURE_CLIENT_ID=5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4
VITE_AZURE_TENANT_ID=e5372bf0-c5e3-4286-887c-79069f209c1f
VITE_AZURE_REDIRECT_URI=https://<DOMINIO_HTTPS>

# Endpoints Remotos de Microservicios en AWS
VITE_CATALOGO_API_URL=http://<IP_PUBLICA_EC2>:8080
VITE_CARRITO_API_URL=http://<IP_PUBLICA_EC2>:8081
VITE_NOTIFICACIONES_API_URL=http://<IP_PUBLICA_EC2>:8082
VITE_AUDITORIA_API_URL=http://<IP_PUBLICA_EC2>:8083
VITE_ADMIN_API_URL=http://<IP_PUBLICA_EC2>:8084
VITE_PAGOS_API_URL=http://<IP_PUBLICA_EC2>:8085
VITE_RECOMENDACIONES_API_URL=http://<IP_PUBLICA_EC2>:8086
VITE_WS_URL=ws://<IP_PUBLICA_EC2>:8086/ws-analytics-raw
VITE_API_GATEWAY_URL=https://op6erfwwmh.execute-api.us-east-1.amazonaws.com/v1
```

---

## 🛠️ Comandos de Construcción y Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Servidor de desarrollo
npm run dev

# 3. Compilación de producción (bundle validado sin localhost)
npm run build
```

---

## 🏷️ Versionamiento Semántico

* **v3.3.0 (Evaluación 3 Final):**
  * Integración completa de Transbank Webpay Plus y `/callback` con control de `TBK_TOKEN` y rechazos bancarios.
  * Centro CloudOps con tabs independientes y WebSocket STOMP (`/topic/metricas`) en tiempo real.
  * Inyección dinámica de `VITE_*` en `Dockerfile` de producción.
  * Eliminación estricta de referencias `localhost` y `127.0.0.1` en todo el bundle cliente.
* **v3.0.0:** Incorporación de `ms-pago` y `ms-analytics` con eventos Kafka.
* **v2.0.0:** Integración de clúster RabbitMQ, auditoría SHA-256 y notificaciones SMTP.
* **v1.0.0:** Estructura base inicial con React 18, Vite y autenticación MSAL.
