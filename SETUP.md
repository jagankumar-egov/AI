# 🚀 Service Config Generator AI - Setup Guide

This guide will help you set up and run the AI-powered service configuration generator.

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **OpenAI API Key** (for AI-powered generation)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/jagankumar-egov/AI.git
cd AI
```

### 2. Install Dependencies
```bash
# Install all dependencies (server + client)
npm run install:all

# Or install separately:
npm run server:install
npm run client:install
```

### 3. Environment Configuration

Create a `.env` file in the `server` directory:

```bash
cd server
cp env.example .env
```

Edit `server/.env` with your configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# OpenAI Configuration (REQUIRED)
OPENAI_API_KEY=your_openai_api_key_here

# Client URL for CORS
CLIENT_URL=http://localhost:3000

# Optional: External Service Configuration
GITHUB_TOKEN=your_github_token_here
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
```

### 4. Get OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Go to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env` file

## 🚀 Running the Application

### Development Mode (Recommended)
```bash
# Start both server and client in development mode
npm run dev
```

This will start:
- **Server**: http://localhost:3001
- **Client**: http://localhost:3000

### Production Mode
```bash
# Build the client
npm run build

# Start the server
npm start
```

### Using the Start Script
```bash
# Make the script executable
chmod +x start.sh

# Run the application
./start.sh
```

## 🎯 Features

### 1. Configuration Generator
- **Stepper Interface**: Step-by-step configuration
- **Schema-Driven Forms**: Dynamic form generation
- **AI-Powered Generation**: Natural language to config
- **Real-time Validation**: Instant feedback

### 2. Schema Explorer
- **Browse Schemas**: View all available sections
- **Documentation**: Understand field requirements
- **Examples**: See sample configurations
- **Interactive Preview**: Live schema viewing

### 3. AI Chat Assistant
- **Natural Language**: Chat to configure
- **Context Retention**: Maintains conversation state
- **Smart Suggestions**: AI-driven recommendations
- **Real-time Generation**: Instant config creation

### 4. Export Options
- **JSON Format**: Standard configuration export
- **YAML Format**: Alternative export format
- **GitHub Integration**: Direct repository commits
- **S3 Integration**: Cloud storage upload

## 🔧 API Endpoints

### Configuration Generation
```bash
POST /api/generate-config
{
  "section": "workflow",
  "details": { "prompt": "Create a workflow with DRAFT and APPROVED states" },
  "serviceName": "TradeLicense"
}
```

### Configuration Validation
```bash
POST /api/validate-config
{
  "config": { ... },
  "section": "workflow"
}
```

### Schema Documentation
```bash
GET /api/docs                    # List all sections
GET /api/docs/workflow          # Get workflow documentation
GET /api/docs/workflow/schema   # Get workflow schema
GET /api/docs/workflow/examples # Get workflow examples
```

### External Services
```bash
POST /api/external-service
{
  "config": { ... },
  "service": "github",
  "options": { "token": "...", "repo": "..." }
}
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Server Tests
```bash
npm run server:test
```

### Run Client Tests
```bash
npm run client:test
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3001
   lsof -i :3000
   
   # Kill the process
   kill -9 <PID>
   ```

2. **OpenAI API Key Issues**
   - Verify your API key is correct
   - Check your OpenAI account has credits
   - Ensure the key has proper permissions

3. **Dependencies Issues**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **CORS Issues**
   - Ensure `CLIENT_URL` in `.env` matches your client URL
   - Check that both server and client are running

### Debug Mode
```bash
# Server debug
cd server && DEBUG=* npm run dev

# Client debug
cd client && REACT_APP_DEBUG=true npm start
```

## 📁 Project Structure

```
AI/
├── server/                 # Backend API
│   ├── routes/            # API endpoints
│   ├── index.js           # Server entry point
│   └── package.json       # Server dependencies
├── client/                # Frontend React app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   ├── stores/        # State management
│   │   └── App.js         # Main app component
│   └── package.json       # Client dependencies
├── serviceConfigSchema.json # Main schema definition
├── README.md              # Project documentation
├── SETUP.md               # This setup guide
└── package.json           # Root package.json
```

## 🔒 Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **Environment Variables**: Use `.env` files for sensitive data
3. **CORS**: Configure CORS properly for production
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Validation**: Always validate user inputs

## 🚀 Deployment

### Docker Deployment
```bash
# Build the application
docker build -t service-config-ai .

# Run the container
docker run -p 3000:3000 -p 3001:3001 service-config-ai
```

### Manual Deployment
1. Build the client: `npm run build`
2. Set up a production server
3. Configure environment variables
4. Start the server: `npm start`

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the console logs for errors
3. Verify your environment configuration
4. Check the API documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**Happy Configuring! 🎉** 