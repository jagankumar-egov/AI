# Stage 1: Build React
FROM node:18 AS builder
WORKDIR /app
COPY client ./client
RUN cd client && npm install && npm run build

# Stage 2: Serve React + Run Node API
FROM node:18

# Install PM2 globally
RUN npm install -g pm2

WORKDIR /app

# Copy server and built frontend
COPY server ./server
COPY serviceConfigSchema.json ./
COPY ecosystem.config.js ./
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/client/build ./client/build

# Install server dependencies
RUN cd server && npm install

# ✅ Install Nginx in non-interactive mode
RUN DEBIAN_FRONTEND=noninteractive \
    apt-get update && \
    apt-get install -y \
    -o Dpkg::Options::="--force-confdef" \
    -o Dpkg::Options::="--force-confold" \
    nginx && \
    rm -rf /var/lib/apt/lists/*

# Expose ports
EXPOSE 80

# Make start.sh executable and use it as the entrypoint
COPY start.sh ./start.sh
RUN chmod +x ./start.sh
CMD ["./start.sh"]
