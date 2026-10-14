# ==========================================
# ETAPA 1: Construcción (Builder)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app
# Copiamos primero dependencias para aprovechar caché
COPY package*.json ./
RUN npm install
# Copiamos el resto del código y construimos con base: './'
COPY . .
RUN npm run build

# ==========================================
# ETAPA 2: Servidor de Producción (Nginx)
# ==========================================
FROM nginx:alpine
# Copiamos archivos compilados
COPY --from=builder /app/dist /usr/share/nginx/html
# Configuración personalizada para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
