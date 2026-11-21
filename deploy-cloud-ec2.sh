#!/bin/bash
# ==============================================================================
# Script de Despliegue Automatizado para AWS EC2 - Pedidos360 Multi-Cloud (EV3)
# Incluye: Clúster RabbitMQ, Apache Kafka KRaft, MySQL, 7 Microservicios y Frontend SPA
# Cumple con la regla estricta: Despliegue 100% Remoto sin referencias locales
# ==============================================================================
set -e

echo "=========================================================="
echo "🚀 Iniciando Despliegue Cloud de Pedidos360 EV3 en AWS EC2"
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

# 3. Detectar IP Pública o Dominio Remoto de AWS EC2
PUBLIC_HOST="${PUBLIC_HOST:-$(curl -s --max-time 5 http://checkip.amazonaws.com || curl -s --max-time 5 http://169.254.169.254/latest/meta-data/public-ipv4 || hostname -I | awk '{print $1}')}"
PUBLIC_SCHEME="${PUBLIC_SCHEME:-http}"
WS_SCHEME="ws"
if [ "$PUBLIC_SCHEME" = "https" ]; then
    WS_SCHEME="wss"
fi

echo "🌐 Host Remoto Detectado: $PUBLIC_HOST ($PUBLIC_SCHEME)"

# 4. Crear directorio de trabajo
WORKDIR="$HOME/pedidos360-deploy"
mkdir -p "$WORKDIR"
cd "$WORKDIR"

# 5. Clonar o actualizar los 8 repositorios desde GitHub
GITHUB_USER="Coyak"

repos=(
    "Pedidos360-catalogo-api"
    "Pedidos360-carrito-api"
    "Pedidos360-notificaciones-api"
    "Pedidos360-auditoria-api"
    "Pedidos360-admin-api"
    "Pedidos360-pago-api"
    "Pedidos360-analytics-api"
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
        git clone "https://github.com/$GITHUB_USER/$repo.git" || echo "⚠️ Advertencia: No se pudo clonar $repo, verifica permisos en GitHub."
    fi
done

# 6. Crear estructura de configuración para RabbitMQ Clúster
mkdir -p docker/rabbitmq
cat << 'EOF' > docker/rabbitmq/rabbitmq.conf
loopback_users.guest = false
listeners.tcp.default = 5672
cluster_formation.peer_discovery_backend = rabbit_peer_discovery_classic_config
cluster_formation.classic_config.nodes.1 = rabbit@rabbitmq1
cluster_formation.classic_config.nodes.2 = rabbit@rabbitmq2
management.tcp.port = 15672
EOF

# 7. Generar archivo .env raíz y Pedidos360-Frontend/.env con endpoints 100% remotos
cat << EOF > .env
PUBLIC_HOST=$PUBLIC_HOST
VITE_REMOTE_HOST=$PUBLIC_HOST
VITE_AZURE_CLIENT_ID=${VITE_AZURE_CLIENT_ID:-5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4}
VITE_AZURE_TENANT_ID=${VITE_AZURE_TENANT_ID:-e5372bf0-c5e3-4286-887c-79069f209c1f}
VITE_AZURE_REDIRECT_URI=${VITE_AZURE_REDIRECT_URI:-$PUBLIC_SCHEME://$PUBLIC_HOST}
VITE_CATALOGO_API_URL=$PUBLIC_SCHEME://$PUBLIC_HOST:8080
VITE_CARRITO_API_URL=$PUBLIC_SCHEME://$PUBLIC_HOST:8081
VITE_NOTIFICACIONES_API_URL=$PUBLIC_SCHEME://$PUBLIC_HOST:8082
VITE_AUDITORIA_API_URL=$PUBLIC_SCHEME://$PUBLIC_HOST:8083
VITE_ADMIN_API_URL=$PUBLIC_SCHEME://$PUBLIC_HOST:8084
VITE_PAGOS_API_URL=$PUBLIC_SCHEME://$PUBLIC_HOST:8085
VITE_RECOMENDACIONES_API_URL=$PUBLIC_SCHEME://$PUBLIC_HOST:8086
VITE_WS_URL=$WS_SCHEME://$PUBLIC_HOST:8086/ws-analytics-raw
VITE_API_GATEWAY_URL=${VITE_API_GATEWAY_URL:-https://op6erfwwmh.execute-api.us-east-1.amazonaws.com/v1}
TRANSBANK_COMMERCE_CODE=${TRANSBANK_COMMERCE_CODE:-597055555532}
TRANSBANK_API_KEY=${TRANSBANK_API_KEY:-579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C}
TRANSBANK_RETURN_URL=$PUBLIC_SCHEME://$PUBLIC_HOST/callback
DB_HOST=${DB_HOST:-mysql-db}
DB_PORT=${DB_PORT:-3306}
MYSQL_DATABASE=${MYSQL_DATABASE:-pagos_db}
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-123456}
SPRING_KAFKA_BOOTSTRAP_SERVERS=${SPRING_KAFKA_BOOTSTRAP_SERVERS:-kafka:29092}
RABBITMQ_HOST=${RABBITMQ_HOST:-rabbitmq1}
RABBITMQ_PORT=${RABBITMQ_PORT:-5672}
RABBITMQ_USERNAME=${RABBITMQ_USERNAME:-pedidos360_user}
RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD:-pedidos360_pass}
RABBITMQ_ERLANG_COOKIE=${RABBITMQ_ERLANG_COOKIE:-PEDIDOS360_SECRET_COOKIE_2026}
AWS_REGION=${AWS_REGION:-us-east-1}
DYNAMODB_TABLE_NAME=${DYNAMODB_TABLE_NAME:-Pedidos360_Interacciones}
DYNAMODB_ENDPOINT=${DYNAMODB_ENDPOINT:-}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-}
AWS_SESSION_TOKEN=${AWS_SESSION_TOKEN:-}
SPRING_MAIL_USERNAME=${SPRING_MAIL_USERNAME:-pedidos360.tienda@gmail.com}
SPRING_MAIL_PASSWORD=${SPRING_MAIL_PASSWORD:-}
EOF

cp .env Pedidos360-Frontend/.env

# 8. Generar docker-compose.yml unificado (idéntico al docker-compose.yml raíz)
cat << 'EOF' > docker-compose.yml
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
      RABBITMQ_ERLANG_COOKIE: "${RABBITMQ_ERLANG_COOKIE:-PEDIDOS360_SECRET_COOKIE_2026}"
      RABBITMQ_DEFAULT_USER: "${RABBITMQ_USERNAME:-pedidos360_user}"
      RABBITMQ_DEFAULT_PASS: "${RABBITMQ_PASSWORD:-pedidos360_pass}"
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
      RABBITMQ_ERLANG_COOKIE: "${RABBITMQ_ERLANG_COOKIE:-PEDIDOS360_SECRET_COOKIE_2026}"
      RABBITMQ_DEFAULT_USER: "${RABBITMQ_USERNAME:-pedidos360_user}"
      RABBITMQ_DEFAULT_PASS: "${RABBITMQ_PASSWORD:-pedidos360_pass}"
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

  mysql-db:
    image: mysql:8.0
    container_name: mysql-pagos-db
    hostname: mysql-db
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: "${MYSQL_DATABASE:-pagos_db}"
      MYSQL_ROOT_PASSWORD: "${MYSQL_ROOT_PASSWORD:-123456}"
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - pedidos360-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "mysql-db", "-uroot", "-p${MYSQL_ROOT_PASSWORD:-123456}"]
      interval: 5s
      timeout: 3s
      retries: 10

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    container_name: pedidos360-kafka
    hostname: kafka
    restart: unless-stopped
    ports:
      - "9092:9092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: 'CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT'
      KAFKA_ADVERTISED_LISTENERS: 'PLAINTEXT://kafka:29092,PLAINTEXT_HOST://${PUBLIC_HOST:-kafka}:9092'
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_PROCESS_ROLES: 'broker,controller'
      KAFKA_CONTROLLER_QUORUM_VOTERS: '1@kafka:29093'
      KAFKA_LISTENERS: 'PLAINTEXT://0.0.0.0:29092,CONTROLLER://0.0.0.0:29093,PLAINTEXT_HOST://0.0.0.0:9092'
      KAFKA_INTER_BROKER_LISTENER_NAME: 'PLAINTEXT'
      KAFKA_CONTROLLER_LISTENER_NAMES: 'CONTROLLER'
      KAFKA_LOG_DIRS: '/tmp/kraft-combined-logs'
      CLUSTER_ID: 'Mk3OEYBSD3T24T8rDQIB8w'
    volumes:
      - kafka_data:/var/lib/kafka/data
    networks:
      - pedidos360-network

  catalogo-api:
    build:
      context: ./Pedidos360-catalogo-api
      dockerfile: Dockerfile
    container_name: pedidos360-catalogo-api
    restart: unless-stopped
    depends_on:
      rabbitmq1:
        condition: service_healthy
      kafka:
        condition: service_started
    ports:
      - "8080:8080"
    environment:
      RABBITMQ_HOST: "${RABBITMQ_HOST:-rabbitmq1}"
      RABBITMQ_PORT: "${RABBITMQ_PORT:-5672}"
      RABBITMQ_USERNAME: "${RABBITMQ_USERNAME:-pedidos360_user}"
      RABBITMQ_PASSWORD: "${RABBITMQ_PASSWORD:-pedidos360_pass}"
      SPRING_KAFKA_BOOTSTRAP_SERVERS: "${SPRING_KAFKA_BOOTSTRAP_SERVERS:-kafka:29092}"
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
      kafka:
        condition: service_started
    ports:
      - "8081:8081"
    environment:
      RABBITMQ_HOST: "${RABBITMQ_HOST:-rabbitmq1}"
      RABBITMQ_PORT: "${RABBITMQ_PORT:-5672}"
      RABBITMQ_USERNAME: "${RABBITMQ_USERNAME:-pedidos360_user}"
      RABBITMQ_PASSWORD: "${RABBITMQ_PASSWORD:-pedidos360_pass}"
      SPRING_KAFKA_BOOTSTRAP_SERVERS: "${SPRING_KAFKA_BOOTSTRAP_SERVERS:-kafka:29092}"
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
      RABBITMQ_HOST: "${RABBITMQ_HOST:-rabbitmq1}"
      RABBITMQ_PORT: "${RABBITMQ_PORT:-5672}"
      RABBITMQ_USERNAME: "${RABBITMQ_USERNAME:-pedidos360_user}"
      RABBITMQ_PASSWORD: "${RABBITMQ_PASSWORD:-pedidos360_pass}"
      SERVER_PORT: 8082
      SPRING_MAIL_USERNAME: "${SPRING_MAIL_USERNAME:-pedidos360.tienda@gmail.com}"
      SPRING_MAIL_PASSWORD: "${SPRING_MAIL_PASSWORD:-}"
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
      RABBITMQ_HOST: "${RABBITMQ_HOST:-rabbitmq1}"
      RABBITMQ_PORT: "${RABBITMQ_PORT:-5672}"
      RABBITMQ_USERNAME: "${RABBITMQ_USERNAME:-pedidos360_user}"
      RABBITMQ_PASSWORD: "${RABBITMQ_PASSWORD:-pedidos360_pass}"
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
      RABBITMQ_HOST: "${RABBITMQ_HOST:-rabbitmq1}"
      RABBITMQ_PORT: "${RABBITMQ_PORT:-5672}"
      RABBITMQ_USERNAME: "${RABBITMQ_USERNAME:-pedidos360_user}"
      RABBITMQ_PASSWORD: "${RABBITMQ_PASSWORD:-pedidos360_pass}"
      SERVER_PORT: 8084
    networks:
      - pedidos360-network

  pago-api:
    build:
      context: ./Pedidos360-pago-api
      dockerfile: Dockerfile
    container_name: pedidos360-pago-api
    restart: unless-stopped
    depends_on:
      kafka:
        condition: service_started
      mysql-db:
        condition: service_healthy
    ports:
      - "8085:8085"
    environment:
      SERVER_PORT: 8085
      DB_HOST: "${DB_HOST:-mysql-db}"
      DB_PORT: "${DB_PORT:-3306}"
      SPRING_DATASOURCE_URL: "${SPRING_DATASOURCE_URL:-jdbc:mysql://mysql-db:3306/pagos_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true}"
      SPRING_DATASOURCE_USERNAME: "${SPRING_DATASOURCE_USERNAME:-root}"
      SPRING_DATASOURCE_PASSWORD: "${MYSQL_ROOT_PASSWORD:-123456}"
      SPRING_KAFKA_BOOTSTRAP_SERVERS: "${SPRING_KAFKA_BOOTSTRAP_SERVERS:-kafka:29092}"
      TRANSBANK_COMMERCE_CODE: "${TRANSBANK_COMMERCE_CODE:-597055555532}"
      TRANSBANK_API_KEY: "${TRANSBANK_API_KEY:-579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C}"
      TRANSBANK_RETURN_URL: "${TRANSBANK_RETURN_URL:-http://${PUBLIC_HOST:-pedidos360.cloud}/callback}"
    networks:
      - pedidos360-network

  analytics-api:
    build:
      context: ./Pedidos360-analytics-api
      dockerfile: Dockerfile
    container_name: pedidos360-analytics-api
    restart: unless-stopped
    depends_on:
      kafka:
        condition: service_started
      mysql-db:
        condition: service_healthy
    ports:
      - "8086:8086"
    environment:
      SERVER_PORT: 8086
      DB_HOST: "${DB_HOST:-mysql-db}"
      DB_PORT: "${DB_PORT:-3306}"
      SPRING_DATASOURCE_URL: "${SPRING_DATASOURCE_URL:-jdbc:mysql://mysql-db:3306/pagos_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true}"
      SPRING_DATASOURCE_USERNAME: "${SPRING_DATASOURCE_USERNAME:-root}"
      SPRING_DATASOURCE_PASSWORD: "${MYSQL_ROOT_PASSWORD:-123456}"
      SPRING_KAFKA_BOOTSTRAP_SERVERS: "${SPRING_KAFKA_BOOTSTRAP_SERVERS:-kafka:29092}"
      AWS_REGION: "${AWS_REGION:-us-east-1}"
      AWS_ACCESS_KEY_ID: "${AWS_ACCESS_KEY_ID:-}"
      AWS_SECRET_ACCESS_KEY: "${AWS_SECRET_ACCESS_KEY:-}"
      AWS_SESSION_TOKEN: "${AWS_SESSION_TOKEN:-}"
      DYNAMODB_TABLE_NAME: "${DYNAMODB_TABLE_NAME:-Pedidos360_Interacciones}"
      DYNAMODB_ENDPOINT: "${DYNAMODB_ENDPOINT:-}"
    networks:
      - pedidos360-network

  frontend:
    build:
      context: ./Pedidos360-Frontend
      dockerfile: Dockerfile
      args:
        VITE_REMOTE_HOST: "${PUBLIC_HOST:-}"
        VITE_AZURE_CLIENT_ID: "${VITE_AZURE_CLIENT_ID:-5f5ad1dc-7259-4d00-a29d-75f1c2b3b2f4}"
        VITE_AZURE_TENANT_ID: "${VITE_AZURE_TENANT_ID:-e5372bf0-c5e3-4286-887c-79069f209c1f}"
        VITE_AZURE_REDIRECT_URI: "${VITE_AZURE_REDIRECT_URI:-}"
        VITE_PAGOS_API_URL: "${VITE_PAGOS_API_URL:-}"
        VITE_RECOMENDACIONES_API_URL: "${VITE_RECOMENDACIONES_API_URL:-}"
        VITE_WS_URL: "${VITE_WS_URL:-}"
        VITE_CATALOGO_API_URL: "${VITE_CATALOGO_API_URL:-}"
        VITE_CARRITO_API_URL: "${VITE_CARRITO_API_URL:-}"
        VITE_NOTIFICACIONES_API_URL: "${VITE_NOTIFICACIONES_API_URL:-}"
        VITE_AUDITORIA_API_URL: "${VITE_AUDITORIA_API_URL:-}"
        VITE_ADMIN_API_URL: "${VITE_ADMIN_API_URL:-}"
        VITE_API_GATEWAY_URL: "${VITE_API_GATEWAY_URL:-https://op6erfwwmh.execute-api.us-east-1.amazonaws.com/v1}"
    container_name: pedidos360-frontend
    restart: unless-stopped
    depends_on:
      - catalogo-api
      - carrito-api
      - pago-api
      - analytics-api
    ports:
      - "80:80"
      - "443:443"
    networks:
      - pedidos360-network

volumes:
  rabbitmq1_data:
    driver: local
  rabbitmq2_data:
    driver: local
  mysql_data:
    driver: local
  kafka_data:
    driver: local

networks:
  pedidos360-network:
    driver: bridge
EOF

# 9. Levantar todo el stack con Docker Compose
echo "🐳 Levantando Clúster RabbitMQ, Kafka, MySQL, los 7 Microservicios y Frontend con Docker Compose..."
sudo docker compose up -d --build

echo "=========================================================="
echo "🎉 ¡Despliegue completado con éxito en AWS!"
echo "=========================================================="
echo "📊 Estado de los contenedores:"
sudo docker compose ps
echo ""
echo "🔗 Servicios Remotos Disponibles:"
echo " - RabbitMQ UI (Nodo 1):   http://$PUBLIC_HOST:15672"
echo " - RabbitMQ UI (Nodo 2):   http://$PUBLIC_HOST:15673"
echo " - Catálogo API:           $PUBLIC_SCHEME://$PUBLIC_HOST:8080/api/status"
echo " - Carrito API:            $PUBLIC_SCHEME://$PUBLIC_HOST:8081/api/carrito/status"
echo " - Notificaciones API:     $PUBLIC_SCHEME://$PUBLIC_HOST:8082/api/notificaciones/status"
echo " - Auditoría API:          $PUBLIC_SCHEME://$PUBLIC_HOST:8083/api/auditoria/status"
echo " - Admin API (RabbitMQ):   $PUBLIC_SCHEME://$PUBLIC_HOST:8084/api/admin/queues"
echo " - Pagos API (EV3):        $PUBLIC_SCHEME://$PUBLIC_HOST:8085/api/pagos/status"
echo " - Analytics API (EV3):    $PUBLIC_SCHEME://$PUBLIC_HOST:8086/api/recomendaciones/status"
echo " - Frontend SPA:           $PUBLIC_SCHEME://$PUBLIC_HOST"
echo "=========================================================="
