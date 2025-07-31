# 🔧 CORS Troubleshooting Guide

## Overview
This guide helps you resolve CORS (Cross-Origin Resource Sharing) issues with the AI Config Creator application.

## Quick Diagnosis

### 1. Check Current Setup
```bash
# Check if server is running
curl http://localhost:3001/health

# Check CORS headers
curl -H "Origin: http://localhost:3000" -v http://localhost:3001/api/docs/create-requirements
```

### 2. Expected CORS Headers
You should see these headers in the response:
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
```

## Common CORS Issues & Solutions

### Issue 1: "No 'Access-Control-Allow-Origin' header"
**Symptoms:**
- Browser console shows CORS error
- Network tab shows preflight request failing

**Solutions:**
1. **Check server is running:**
   ```bash
   cd server && yarn start
   ```

2. **Verify CORS configuration:**
   ```javascript
   // In server/index.js
   app.use(cors({
     origin: function (origin, callback) {
       // Allow requests with no origin
       if (!origin) return callback(null, true);
       
       const allowedOrigins = [
         'http://localhost:3000',
         'http://localhost:3001',
         'http://localhost:80',
         'http://localhost',
         'http://127.0.0.1:3000',
         'http://127.0.0.1:3001',
         'http://127.0.0.1:80',
         'http://127.0.0.1'
       ];
       
       if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
         callback(null, true);
       } else {
         callback(new Error('Not allowed by CORS'));
       }
     },
     credentials: true
   }));
   ```

3. **Restart server after changes:**
   ```bash
   pkill -f "node index.js"
   cd server && yarn start
   ```

### Issue 2: Frontend running on different port
**Symptoms:**
- Frontend on port 3000, but API calls failing
- Origin mismatch in browser console

**Solutions:**
1. **Check frontend port:**
   ```bash
   # If using React dev server
   lsof -i :3000
   
   # If using different port, update CORS config
   ```

2. **Add your port to allowed origins:**
   ```javascript
   const allowedOrigins = [
     'http://localhost:3000',
     'http://localhost:3001',
     'http://localhost:3002', // Add your port
     'http://localhost:3003', // Add your port
     // ... other ports
   ];
   ```

### Issue 3: HTTPS vs HTTP mismatch
**Symptoms:**
- Frontend on HTTPS, backend on HTTP
- Mixed content warnings

**Solutions:**
1. **Use HTTP for development:**
   ```bash
   # Frontend
   REACT_APP_API_URL=http://localhost:3001
   
   # Backend
   # Already configured for HTTP
   ```

2. **Or use HTTPS for both:**
   ```bash
   # Frontend
   REACT_APP_API_URL=https://localhost:3001
   
   # Backend (with SSL)
   # Configure SSL certificates
   ```

### Issue 4: Credentials not being sent
**Symptoms:**
- `credentials: 'include'` not working
- Cookies not being sent with requests

**Solutions:**
1. **Check axios configuration:**
   ```javascript
   // In client/src/services/api.js
   const api = axios.create({
     baseURL: getServerConfig().baseURL,
     withCredentials: true, // Add this
     timeout: getServerConfig().timeout,
     headers: {
       'Content-Type': 'application/json',
     },
   });
   ```

2. **Check fetch requests:**
   ```javascript
   fetch('/api/endpoint', {
     credentials: 'include', // Add this
     headers: {
       'Content-Type': 'application/json',
     }
   });
   ```

## Testing CORS Configuration

### 1. Use the CORS Test Page
```bash
# Open in browser
open server/test-cors.html
```

### 2. Manual Testing
```bash
# Test health endpoint
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://localhost:3001/health

# Test API endpoint
curl -H "Origin: http://localhost:3000" \
     -v http://localhost:3001/api/docs/create-requirements
```

### 3. Browser Developer Tools
1. Open Developer Tools (F12)
2. Go to Network tab
3. Make API request from your app
4. Check for CORS errors in Console tab
5. Look at Response headers in Network tab

## Environment-Specific Issues

### Development Environment
```bash
# Frontend (React)
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENVIRONMENT=development

# Backend (Node.js)
NODE_ENV=development
PORT=3001
```

### Production Environment
```bash
# Frontend
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_ENVIRONMENT=production

# Backend
NODE_ENV=production
PORT=3001
```

### Docker Environment
```yaml
# docker-compose.yml
services:
  backend:
    environment:
      - NODE_ENV=production
      - CLIENT_URL=http://localhost:80
    ports:
      - "3001:3001"
  
  frontend:
    environment:
      - REACT_APP_API_URL=http://localhost:3001
    ports:
      - "80:80"
```

## Debugging Steps

### Step 1: Check Server Status
```bash
# Check if server is running
curl http://localhost:3001/health

# Check server logs
cd server && yarn start
```

### Step 2: Check CORS Headers
```bash
# Test CORS preflight
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://localhost:3001/api/docs/create-requirements
```

### Step 3: Check Frontend Configuration
```javascript
// In client/src/config/server.js
export const SERVER_CONFIG = {
  development: {
    baseURL: 'http://localhost:3001', // Check this URL
    timeout: 30000,
    retryAttempts: 3
  }
};
```

### Step 4: Check Browser Console
1. Open Developer Tools
2. Go to Console tab
3. Look for CORS errors
4. Check Network tab for failed requests

### Step 5: Test with Simple HTML
```html
<!-- Create test.html -->
<!DOCTYPE html>
<html>
<head>
    <title>CORS Test</title>
</head>
<body>
    <h1>CORS Test</h1>
    <button onclick="testAPI()">Test API</button>
    <div id="result"></div>
    
    <script>
        async function testAPI() {
            try {
                const response = await fetch('http://localhost:3001/api/docs/create-requirements', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const data = await response.json();
                    document.getElementById('result').innerHTML = 
                        `<pre>${JSON.stringify(data, null, 2)}</pre>`;
                } else {
                    document.getElementById('result').innerHTML = 
                        `Error: ${response.status} ${response.statusText}`;
                }
            } catch (error) {
                document.getElementById('result').innerHTML = 
                    `Error: ${error.message}`;
            }
        }
    </script>
</body>
</html>
```

## Common Error Messages

### "Access to fetch at 'http://localhost:3001/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy"
**Solution:** Check CORS configuration in server/index.js

### "No 'Access-Control-Allow-Origin' header is present on the requested resource"
**Solution:** Ensure server is running and CORS middleware is loaded

### "Request header field content-type is not allowed by Access-Control-Allow-Headers"
**Solution:** Add 'Content-Type' to allowed headers in CORS config

### "The request client is not a secure context and the resource is in a more-private address space"
**Solution:** Use HTTP for localhost development, not HTTPS

## Quick Fix Checklist

- [ ] Server is running on port 3001
- [ ] CORS middleware is configured in server/index.js
- [ ] Frontend is making requests to correct URL
- [ ] Origin is in allowed origins list
- [ ] Credentials are properly configured
- [ ] No HTTPS/HTTP mismatch
- [ ] Browser cache is cleared
- [ ] Server restarted after CORS changes

## Still Having Issues?

1. **Check server logs** for CORS-related errors
2. **Use the CORS test page** (server/test-cors.html)
3. **Test with curl** to isolate browser issues
4. **Check browser console** for detailed error messages
5. **Verify network connectivity** between frontend and backend

## Support

If you're still experiencing CORS issues:
1. Check the server logs for errors
2. Use the CORS test page to verify configuration
3. Share the specific error message from browser console
4. Include your current setup (ports, URLs, etc.) 