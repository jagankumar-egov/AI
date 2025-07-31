# Server Configuration Guide

## Overview
This application uses a centralized server configuration system with axios for all HTTP requests.

## Configuration Files

### 1. Server Configuration (`src/config/server.js`)
Centralized server configuration for different environments:

```javascript
export const SERVER_CONFIG = {
  development: {
    baseURL: 'http://localhost:3001',
    timeout: 30000,
    retryAttempts: 3
  },
  production: {
    baseURL: process.env.REACT_APP_API_URL || 'https://api.yourservice.com',
    timeout: 60000,
    retryAttempts: 5
  },
  test: {
    baseURL: 'http://localhost:3001',
    timeout: 10000,
    retryAttempts: 1
  }
};
```

### 2. API Service (`src/services/api.js`)
Centralized axios instance with interceptors and error handling:

```javascript
const api = axios.create({
  baseURL: getServerConfig().baseURL,
  timeout: getServerConfig().timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## Environment Variables

### Development
```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
```

### Production
```bash
REACT_APP_API_URL=https://api.yourservice.com
REACT_APP_ENVIRONMENT=production
REACT_APP_DEBUG=false
```

## Usage

### All HTTP requests use the centralized API:
```javascript
import { configAPI } from '../services/api';

// Instead of fetch, use axios
const data = await configAPI.generateJsonFromGuidedQuestions(fieldName, answers, questions);
```

### Benefits:
1. **Consistent HTTP Client**: All requests use axios
2. **Centralized Configuration**: Server URL configured in one place
3. **Environment Support**: Different configs for dev/prod/test
4. **Error Handling**: Centralized error handling and logging
5. **Request/Response Logging**: Automatic logging for debugging

## Migration from fetch to axios

### Before (fetch):
```javascript
const response = await fetch('/api/docs/generate-json', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fieldName, answers, questions })
});
const data = await response.json();
```

### After (axios):
```javascript
const data = await configAPI.generateJsonFromGuidedQuestions(fieldName, answers, questions);
```

## API Endpoints

All endpoints are prefixed with `/api` and use the centralized configuration:

- `/api/health` - Health check
- `/api/docs` - Documentation endpoints
- `/api/generate-config` - Configuration generation
- `/api/validate-config` - Configuration validation
- `/api/external-service` - External service integration 