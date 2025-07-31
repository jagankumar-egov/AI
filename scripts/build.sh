#!/bin/bash

# AI Config Creator - Docker Build Script
# Supports multi-architecture builds (AMD64, ARM64)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGISTRY=${REGISTRY:-"ghcr.io"}
IMAGE_NAME=${IMAGE_NAME:-"ai-config-creator"}
VERSION=${VERSION:-"latest"}
PLATFORMS=${PLATFORMS:-"linux/amd64,linux/arm64"}

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Check if buildx is available
    if ! docker buildx version &> /dev/null; then
        log_error "Docker buildx is not available. Please enable buildx."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Setup buildx
setup_buildx() {
    log_info "Setting up Docker buildx..."
    
    # Create new builder if it doesn't exist
    if ! docker buildx inspect multiarch &> /dev/null; then
        docker buildx create --name multiarch --driver docker-container --use
    fi
    
    # Use the multiarch builder
    docker buildx use multiarch
    
    # Bootstrap the builder
    docker buildx inspect --bootstrap
    
    log_success "Buildx setup completed"
}

# Build backend image
build_backend() {
    log_info "Building backend image..."
    
    docker buildx build \
        --platform $PLATFORMS \
        --tag $REGISTRY/$IMAGE_NAME-backend:$VERSION \
        --tag $REGISTRY/$IMAGE_NAME-backend:latest \
        --file server/Dockerfile \
        --target production \
        --push \
        ./server
    
    log_success "Backend image built and pushed"
}

# Build frontend image
build_frontend() {
    log_info "Building frontend image..."
    
    docker buildx build \
        --platform $PLATFORMS \
        --tag $REGISTRY/$IMAGE_NAME-frontend:$VERSION \
        --tag $REGISTRY/$IMAGE_NAME-frontend:latest \
        --file client/Dockerfile \
        --target production \
        --push \
        ./client
    
    log_success "Frontend image built and pushed"
}

# Build all images
build_all() {
    log_info "Building all images..."
    
    build_backend
    build_frontend
    
    log_success "All images built successfully"
}

# Test images locally
test_images() {
    log_info "Testing images locally..."
    
    # Pull and run backend
    docker pull $REGISTRY/$IMAGE_NAME-backend:latest
    docker run -d --name test-backend -p 3001:3001 \
        -e NODE_ENV=production \
        -e PORT=3001 \
        $REGISTRY/$IMAGE_NAME-backend:latest
    
    # Wait for backend to start
    sleep 10
    
    # Test backend health
    if curl -f http://localhost:3001/api/health &> /dev/null; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        docker logs test-backend
        exit 1
    fi
    
    # Cleanup
    docker stop test-backend
    docker rm test-backend
    
    log_success "Local testing completed"
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] COMMAND"
    echo ""
    echo "Commands:"
    echo "  build-backend    Build backend image only"
    echo "  build-frontend   Build frontend image only"
    echo "  build-all        Build all images (default)"
    echo "  test             Test images locally"
    echo "  setup            Setup buildx and prerequisites"
    echo ""
    echo "Options:"
    echo "  --registry REGISTRY    Docker registry (default: ghcr.io)"
    echo "  --image-name NAME      Image name prefix (default: ai-config-creator)"
    echo "  --version VERSION      Image version (default: latest)"
    echo "  --platforms PLATFORMS Comma-separated platforms (default: linux/amd64,linux/arm64)"
    echo ""
    echo "Environment Variables:"
    echo "  REGISTRY       Docker registry"
    echo "  IMAGE_NAME     Image name prefix"
    echo "  VERSION        Image version"
    echo "  PLATFORMS      Comma-separated platforms"
}

# Parse command line arguments
COMMAND="build-all"

while [[ $# -gt 0 ]]; do
    case $1 in
        build-backend|build-frontend|build-all|test|setup)
            COMMAND="$1"
            shift
            ;;
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        --image-name)
            IMAGE_NAME="$2"
            shift 2
            ;;
        --version)
            VERSION="$2"
            shift 2
            ;;
        --platforms)
            PLATFORMS="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
case $COMMAND in
    setup)
        check_prerequisites
        setup_buildx
        ;;
    build-backend)
        check_prerequisites
        setup_buildx
        build_backend
        ;;
    build-frontend)
        check_prerequisites
        setup_buildx
        build_frontend
        ;;
    build-all)
        check_prerequisites
        setup_buildx
        build_all
        ;;
    test)
        test_images
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        show_usage
        exit 1
        ;;
esac

log_success "Build script completed successfully" 