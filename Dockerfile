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

# Install Nginx
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# Expose ports
EXPOSE 80

# Start Nginx + Node API via PM2
CMD nginx && pm2 start ecosystem.config.js && pm2 logs
