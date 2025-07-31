# Docker Deployment Guide

## Overview
This guide covers Docker deployment for the AI Config Creator application with multi-architecture support (AMD64 and ARM64).

## Architecture

### Application Stack
- **Backend**: Node.js API server (port 3001)
- **Frontend**: React application served by Nginx (port 80)
- **Database**: No external database required (stateless)
- **Reverse Proxy**: Nginx for production deployments

### Multi-Architecture Support
- **AMD64**: Intel/AMD processors
- **ARM64**: Apple Silicon, ARM servers

## Quick Start

### Local Development
```bash
# Build and run with docker-compose
docker-compose up --build

# Access the application
# Frontend: http://localhost:80
# Backend API: http://localhost:3001
```

### Production Deployment
```bash
# Build multi-architecture images
docker buildx build --platform linux/amd64,linux/arm64 \
  -t your-registry/ai-config-backend:latest \
  -f server/Dockerfile ./server

docker buildx build --platform linux/amd64,linux/arm64 \
  -t your-registry/ai-config-frontend:latest \
  -f client/Dockerfile ./client
```

## Docker Images

### Backend Image (`server/Dockerfile`)
```dockerfile
# Multi-stage build with security best practices
FROM node:20-alpine AS builder
# ... build stage

FROM node:20-alpine AS production
# ... production stage with non-root user
```

**Features:**
- Multi-stage build for smaller image size
- Non-root user for security
- Health checks
- Signal handling with dumb-init
- Alpine Linux for minimal attack surface

### Frontend Image (`client/Dockerfile`)
```dockerfile
# Multi-stage build with Nginx
FROM node:20-alpine AS builder
# ... React build stage

FROM nginx:alpine AS production
# ... Nginx serving stage
```

**Features:**
- Nginx for high-performance static file serving
- Gzip compression
- Security headers
- Rate limiting
- API proxy to backend

## Docker Compose

### Development Setup (`docker-compose.yml`)
```yaml
services:
  backend:
    build: ./server
    ports: ["3001:3001"]
    
  frontend:
    build: ./client
    ports: ["80:80"]
    depends_on:
      backend:
        condition: service_healthy
```

### Production Setup
```yaml
services:
  nginx:
    image: nginx:alpine
    ports: ["443:443", "80:80"]
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
```

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (1.20+)
- Nginx Ingress Controller
- Cert-Manager (for SSL certificates)

### Deploy to Kubernetes
```bash
# Apply the deployment
kubectl apply -f k8s/deployment.yml

# Check deployment status
kubectl get pods -n ai-config-creator

# Access the application
kubectl port-forward -n ai-config-creator svc/ai-config-frontend-service 8080:80
```

### Kubernetes Features
- **High Availability**: 3 replicas each for frontend and backend
- **Resource Limits**: CPU and memory limits defined
- **Health Checks**: Liveness and readiness probes
- **SSL/TLS**: Automatic certificate management
- **Load Balancing**: Ingress with path-based routing

## GitHub Actions CI/CD

### Workflow Features
- **Multi-Architecture Builds**: AMD64 and ARM64 support
- **Automated Testing**: Unit and integration tests
- **Security Scanning**: Trivy vulnerability scanning
- **Performance Testing**: Artillery load testing
- **Automated Deployment**: Staging and production environments

### Workflow Triggers
- **Push to main**: Deploy to production
- **Push to develop**: Deploy to staging
- **Pull Requests**: Build and test only
- **Tags (v*)**: Release builds

### Build Process
1. **Test Stage**: Run all tests
2. **Build Stage**: Build Docker images for multiple architectures
3. **Deploy Stage**: Deploy to appropriate environment
4. **Security Stage**: Scan for vulnerabilities
5. **Performance Stage**: Run load tests

## Environment Configuration

### Environment Variables
```bash
# Backend
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=your-openai-api-key

# Frontend
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_ENVIRONMENT=production
```

### Secrets Management
```bash
# Kubernetes secrets
kubectl create secret generic ai-config-secrets \
  --from-literal=openai-api-key=your-key

# Docker secrets (for swarm)
echo "your-openai-api-key" | docker secret create openai-api-key -
```

## Monitoring and Logging

### Health Checks
- **Backend**: `GET /api/health`
- **Frontend**: `GET /health`
- **Kubernetes**: Liveness and readiness probes

### Logging
```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Kubernetes logs
kubectl logs -f deployment/ai-config-backend -n ai-config-creator
kubectl logs -f deployment/ai-config-frontend -n ai-config-creator
```

### Monitoring
- **Resource Usage**: CPU and memory monitoring
- **Response Times**: API response time tracking
- **Error Rates**: Error rate monitoring
- **Uptime**: Service availability monitoring

## Security Best Practices

### Container Security
- Non-root users
- Minimal base images (Alpine)
- Regular security updates
- Vulnerability scanning

### Network Security
- HTTPS/TLS encryption
- Rate limiting
- Security headers
- CORS configuration

### Application Security
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection

## Performance Optimization

### Image Optimization
- Multi-stage builds
- Layer caching
- Minimal dependencies
- Gzip compression

### Runtime Optimization
- Resource limits
- Horizontal scaling
- Load balancing
- CDN integration

## Troubleshooting

### Common Issues
1. **Port conflicts**: Check if ports 80/3001 are available
2. **Memory issues**: Increase Docker memory allocation
3. **Build failures**: Check Node.js version compatibility
4. **Network issues**: Verify Docker network configuration

### Debug Commands
```bash
# Check container status
docker ps -a

# View container logs
docker logs container-name

# Execute commands in container
docker exec -it container-name sh

# Check resource usage
docker stats
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Secrets properly managed
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Security scanning completed
- [ ] Performance testing passed
- [ ] Documentation updated
- [ ] Rollback plan prepared

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review container logs
3. Verify environment configuration
4. Test with minimal setup
5. Create issue with detailed information 