# ==========================================
# ETAPA 1: Construcción (Builder con VITE_* Parametrizados)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

# Argumentos de compilación inyectables desde docker-compose.yml / CI-CD
ARG VITE_REMOTE_HOST=""
ARG VITE_AZURE_CLIENT_ID="5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4"
ARG VITE_AZURE_TENANT_ID="e5372bf0-c5e3-4286-887c-79069f209c1f"
ARG VITE_AZURE_REDIRECT_URI=""
ARG VITE_PAGOS_API_URL=""
ARG VITE_RECOMENDACIONES_API_URL=""
ARG VITE_WS_URL=""
ARG VITE_CATALOGO_API_URL=""
ARG VITE_CARRITO_API_URL=""
ARG VITE_NOTIFICACIONES_API_URL=""
ARG VITE_AUDITORIA_API_URL=""
ARG VITE_ADMIN_API_URL=""
ARG VITE_API_GATEWAY_URL="https://op6erfwwmh.execute-api.us-east-1.amazonaws.com/v1"

# Exportar variables de entorno para que Vite las empaquete durante npm run build
ENV VITE_REMOTE_HOST=$VITE_REMOTE_HOST
ENV VITE_AZURE_CLIENT_ID=$VITE_AZURE_CLIENT_ID
ENV VITE_AZURE_TENANT_ID=$VITE_AZURE_TENANT_ID
ENV VITE_AZURE_REDIRECT_URI=$VITE_AZURE_REDIRECT_URI
ENV VITE_PAGOS_API_URL=$VITE_PAGOS_API_URL
ENV VITE_RECOMENDACIONES_API_URL=$VITE_RECOMENDACIONES_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_CATALOGO_API_URL=$VITE_CATALOGO_API_URL
ENV VITE_CARRITO_API_URL=$VITE_CARRITO_API_URL
ENV VITE_NOTIFICACIONES_API_URL=$VITE_NOTIFICACIONES_API_URL
ENV VITE_AUDITORIA_API_URL=$VITE_AUDITORIA_API_URL
ENV VITE_ADMIN_API_URL=$VITE_ADMIN_API_URL
ENV VITE_API_GATEWAY_URL=$VITE_API_GATEWAY_URL

# Copiamos dependencias primero para aprovechar caché de capas
COPY package*.json ./
RUN npm install

# Copiamos el código fuente y construimos el bundle estático de producción
COPY . .
RUN npm run build

# ==========================================
# ETAPA 2: Servidor Estático SPA (Nginx)
# ==========================================
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
