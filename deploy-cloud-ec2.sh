#!/bin/bash
# ==============================================================================
# Script de Despliegue Automatizado para AWS EC2 - Pedidos360 Multi-Cloud
# ==============================================================================
set -e

echo "=========================================================="
echo "🚀 Iniciando Despliegue Cloud de Pedidos360 en AWS EC2"
echo "=========================================================="

# 1. Actualizar paquetes e instalar dependencias básicas
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release git

# 1.1 Configurar 4GB de memoria Swap para compilar y ejecutar microservicios sin OOM
if [ ! -f /swapfile ]; then
    echo "💾 Configurando 4GB de memoria Swap..."
    sudo fallocate -l 4G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=4096
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap de 4GB activado."
fi

# 2. Instalar Docker si no está instalado
if ! command -v docker &> /dev/null; then
    echo "📦 Instalando Docker Engine..."
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
    echo "✅ Docker instalado exitosamente."
else
    echo "✅ Docker ya está instalado."
fi

# 3. Crear directorio de trabajo
WORKDIR="$HOME/pedidos360-deploy"
mkdir -p "$WORKDIR"
cd "$WORKDIR"

# 4. Clonar o actualizar los repositorios desde GitHub
GITHUB_USER="Coyak"

repos=(
    "Pedidos360-catalogo-api"
    "Pedidos360-carrito-api"
    "Pedidos360-notificaciones-api"
    "Pedidos360-auditoria-api"
    "Pedidos360-admin-api"
    "Pedidos360-Frontend"
)

echo "📥 Descargando repositorios desde GitHub..."
for repo in "${repos[@]}"; do
    if [ -d "$repo" ]; then
        echo "🔄 Actualizando $repo..."
        cd "$repo"
        git pull origin main || true
        cd "$WORKDIR"
    else
        echo "⬇️ Clonando $repo..."
        git clone "https://github.com/$GITHUB_USER/$repo.git" || echo "⚠️ Advertencia: No se pudo clonar $repo, asegúrate que esté público en GitHub."
    fi
done

# 5. Crear estructura de configuración para RabbitMQ Clúster
mkdir -p docker/rabbitmq
cat << 'EOF' > docker/rabbitmq/rabbitmq.conf
loopback_users.guest = false
listeners.tcp.default = 5672
cluster_formation.peer_discovery_backend = rabbit_peer_discovery_classic_config
cluster_formation.classic_config.nodes.1 = rabbit@rabbitmq1
cluster_formation.classic_config.nodes.2 = rabbit@rabbitmq2
management.tcp.port = 15672
EOF

# 6. Generar docker-compose.yml completo
cat << 'EOF' > docker-compose.yml
version: '3.8'

services:
  rabbitmq1:
    image: rabbitmq:3.13-management-alpine
    container_name: pedidos360-rabbitmq1
    hostname: rabbitmq1
    restart: unless-stopped
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_ERLANG_COOKIE: "PEDIDOS360_SECRET_COOKIE_2026"
      RABBITMQ_DEFAULT_USER: pedidos360_user
      RABBITMQ_DEFAULT_PASS: pedidos360_pass
      RABBITMQ_NODENAME: rabbit@rabbitmq1
    volumes:
      - rabbitmq1_data:/var/lib/rabbitmq
      - ./docker/rabbitmq/rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf:ro
    networks:
      - pedidos360-network
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_port_connectivity"]
      interval: 10s
      timeout: 5s
      retries: 5

  rabbitmq2:
    image: rabbitmq:3.13-management-alpine
    container_name: pedidos360-rabbitmq2
    hostname: rabbitmq2
    restart: unless-stopped
    depends_on:
      - rabbitmq1
    ports:
      - "5673:5672"
      - "15673:15672"
    environment:
      RABBITMQ_ERLANG_COOKIE: "PEDIDOS360_SECRET_COOKIE_2026"
      RABBITMQ_DEFAULT_USER: pedidos360_user
      RABBITMQ_DEFAULT_PASS: pedidos360_pass
      RABBITMQ_NODENAME: rabbit@rabbitmq2
    volumes:
      - rabbitmq2_data:/var/lib/rabbitmq
      - ./docker/rabbitmq/rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf:ro
    networks:
      - pedidos360-network
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_port_connectivity"]
      interval: 10s
      timeout: 5s
      retries: 5

  catalogo-api:
    build:
      context: ./Pedidos360-catalogo-api
      dockerfile: Dockerfile
    container_name: pedidos360-catalogo-api
    restart: unless-stopped
    depends_on:
      rabbitmq1:
        condition: service_healthy
    ports:
      - "8080:8080"
    environment:
      RABBITMQ_HOST: rabbitmq1
      RABBITMQ_PORT: 5672
      RABBITMQ_USERNAME: pedidos360_user
      RABBITMQ_PASSWORD: pedidos360_pass
      SERVER_PORT: 8080
    networks:
      - pedidos360-network

  carrito-api:
    build:
      context: ./Pedidos360-carrito-api
      dockerfile: Dockerfile
    container_name: pedidos360-carrito-api
    restart: unless-stopped
    depends_on:
      rabbitmq1:
        condition: service_healthy
    ports:
      - "8081:8081"
    environment:
      RABBITMQ_HOST: rabbitmq1
      RABBITMQ_PORT: 5672
      RABBITMQ_USERNAME: pedidos360_user
      RABBITMQ_PASSWORD: pedidos360_pass
      SERVER_PORT: 8081
    networks:
      - pedidos360-network

  notificaciones-api:
    build:
      context: ./Pedidos360-notificaciones-api
      dockerfile: Dockerfile
    container_name: pedidos360-notificaciones-api
    restart: unless-stopped
    depends_on:
      rabbitmq1:
        condition: service_healthy
    ports:
      - "8082:8082"
    environment:
      RABBITMQ_HOST: rabbitmq1
      RABBITMQ_PORT: 5672
      RABBITMQ_USERNAME: pedidos360_user
      RABBITMQ_PASSWORD: pedidos360_pass
      SERVER_PORT: 8082
    networks:
      - pedidos360-network

  auditoria-api:
    build:
      context: ./Pedidos360-auditoria-api
      dockerfile: Dockerfile
    container_name: pedidos360-auditoria-api
    restart: unless-stopped
    depends_on:
      rabbitmq1:
        condition: service_healthy
    ports:
      - "8083:8083"
    environment:
      RABBITMQ_HOST: rabbitmq1
      RABBITMQ_PORT: 5672
      RABBITMQ_USERNAME: pedidos360_user
      RABBITMQ_PASSWORD: pedidos360_pass
      SERVER_PORT: 8083
    networks:
      - pedidos360-network

  admin-api:
    build:
      context: ./Pedidos360-admin-api
      dockerfile: Dockerfile
    container_name: pedidos360-admin-api
    restart: unless-stopped
    depends_on:
      rabbitmq1:
        condition: service_healthy
    ports:
      - "8084:8084"
    environment:
      RABBITMQ_HOST: rabbitmq1
      RABBITMQ_PORT: 5672
      RABBITMQ_USERNAME: pedidos360_user
      RABBITMQ_PASSWORD: pedidos360_pass
      SERVER_PORT: 8084
    networks:
      - pedidos360-network

  frontend:
    build:
      context: ./Pedidos360-Frontend
      dockerfile: Dockerfile
    container_name: pedidos360-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    networks:
      - pedidos360-network

volumes:
  rabbitmq1_data:
    driver: local
  rabbitmq2_data:
    driver: local

networks:
  pedidos360-network:
    driver: bridge
EOF

# 6. Levantar todo el stack con Docker Compose
echo "🐳 Levantando Clúster RabbitMQ y Microservicios con Docker Compose..."
sudo docker compose up -d --build

echo "=========================================================="
echo "🎉 ¡Despliegue completado con éxito en AWS!"
echo "=========================================================="
echo "📊 Estado de los contenedores:"
sudo docker compose ps
echo ""
echo "🔗 Servicios disponibles:"
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com || echo "IP_PUBLICA_EC2")
echo " - RabbitMQ UI (Nodo 1):   http://$PUBLIC_IP:15672 (user: pedidos360_user / pass: pedidos360_pass)"
echo " - RabbitMQ UI (Nodo 2):   http://$PUBLIC_IP:15673"
echo " - Catálogo API:          http://$PUBLIC_IP:8080/api/status"
echo " - Carrito API:           http://$PUBLIC_IP:8081/api/carrito/status"
echo " - Notificaciones API:    http://$PUBLIC_IP:8082/api/notificaciones/status"
echo " - Auditoría API:         http://$PUBLIC_IP:8083/api/auditoria/status"
echo " - Admin API (RabbitMQ):  http://$PUBLIC_IP:8084/api/admin/queues"
echo " - Frontend SPA:          http://$PUBLIC_IP:80"
echo "=========================================================="
