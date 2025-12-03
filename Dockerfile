# ============================================
# AIS Data Forwarder - Docker Image
# ============================================
# Multi-stage build untuk image yang lebih kecil

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Install build dependencies untuk native modules (serialport)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    linux-headers \
    udev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (gunakan npm install karena tidak ada package-lock.json)
RUN npm install --omit=dev

# Stage 2: Production stage
FROM node:20-alpine AS production

# Label untuk image
LABEL maintainer="WiWIT Project"
LABEL description="AIS Data Forwarder - Menerima data AIS dari Serial/TCP/UDP dan meneruskan ke WebSocket Server"
LABEL version="1.0.0"

# Install runtime dependencies untuk serialport
RUN apk add --no-cache \
    udev \
    && rm -rf /var/cache/apk/*

# Create non-root user untuk security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S aisforwarder -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy node_modules dari builder
COPY --from=builder /app/node_modules ./node_modules

# Copy source code
COPY --chown=aisforwarder:nodejs . .

# Set user
USER aisforwarder

# Environment variables default (bisa di-override saat runtime)
ENV NODE_ENV=production \
    CONNECTION_MODE=tcp \
    TCP_HOST=192.168.1.100 \
    TCP_PORT=10110 \
    UDP_HOST=192.168.1.100 \
    UDP_PORT=10110 \
    UDP_LISTEN_PORT=10110 \
    SERIAL_PORT=/dev/ttyUSB0 \
    SERIAL_BAUD_RATE=38400 \
    SERIAL_DATA_BITS=8 \
    SERIAL_STOP_BITS=1 \
    SERIAL_PARITY=none \
    WEBSOCKET_SERVER=ws://socket-ais.jasalog.com:8081 \
    DEBOUNCE_DELAY=100 \
    FORWARDER_ENABLED=true \
    FORWARDER_HOST=0.0.0.0 \
    FORWARDER_PORT=10111 \
    APP_KEY="" \
    USER_KEY=""

# Expose port untuk TCP Forwarder (OpenCPN)
EXPOSE 10111

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check passed')" || exit 1

# Start command
CMD ["node", "src/index.js"]
