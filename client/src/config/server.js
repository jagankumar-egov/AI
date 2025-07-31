// Server configuration for different environments
export const SERVER_CONFIG = {
  // Development environment
  development: {
    baseURL: 'http://localhost:3001',
    timeout: 30000,
    retryAttempts: 3
  },
  
  // Production environment
  production: {
    baseURL: process.env.REACT_APP_API_URL || 'https://api.yourservice.com',
    timeout: 60000,
    retryAttempts: 5
  },
  
  // Test environment
  test: {
    baseURL: 'http://localhost:3001',
    timeout: 10000,
    retryAttempts: 1
  }
};

// Get current environment
export const getCurrentEnvironment = () => {
  return process.env.NODE_ENV || 'development';
};

// Get server configuration for current environment
export const getServerConfig = () => {
  const env = getCurrentEnvironment();
  return SERVER_CONFIG[env] || SERVER_CONFIG.development;
};

// Get server URL for current environment
export const getServerURL = () => {
  return getServerConfig().baseURL;
};

// Export current configuration
export const currentConfig = {
  environment: getCurrentEnvironment(),
  serverURL: getServerURL(),
  config: getServerConfig()
};

export default {
  SERVER_CONFIG,
  getCurrentEnvironment,
  getServerConfig,
  getServerURL,
  currentConfig
}; 