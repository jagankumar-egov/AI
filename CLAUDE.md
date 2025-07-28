Project Overview: Service Config Generator AI This is a full-stack application that uses AI to automatically generate service configurations from natural language descriptions. Here's how it's structured:

Architecture:

Frontend: React application served via Nginx
Backend: Node.js API server
AI Integration: OpenAI API (GPT-4)
Deployment: Docker with Docker Compose
Key Components:

client: React frontend with Material UI
server: Node.js backend with:
OpenAI integration for config generation
JSON schema validation
Chat assistant for help
deployment: Kubernetes manifests
docker-compose.yml: Local development setup
nginx.conf: Web server configuration
serviceConfigSchema.json: JSON schema for validation
Main Features:

Convert natural language descriptions into JSON service configs
Real-time validation against a schema
Chat assistant for help and documentation
Containerized deployment ready
Support for both development and production environments
Core Functionality:

Users describe what they want in plain English
The AI (using GPT-4) converts this to a structured JSON config
The backend validates the generated config
The frontend provides a user-friendly interface to interact with this system
DevOps Setup:

Docker for containerization
Nginx as reverse proxy
PM2 for Node.js process management
Kubernetes deployment support