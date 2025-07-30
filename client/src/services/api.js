import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          throw new Error(data.message || 'Bad request');
        case 401:
          throw new Error('Unauthorized');
        case 403:
          throw new Error('Forbidden');
        case 404:
          throw new Error('Resource not found');
        case 500:
          throw new Error(data.message || 'Internal server error');
        default:
          throw new Error(data.message || 'An error occurred');
      }
    } else if (error.request) {
      throw new Error('Network error - please check your connection');
    } else {
      throw new Error('An unexpected error occurred');
    }
  }
);

// API methods
export const configAPI = {
  // Generate configuration
  generateConfig: (section, details, serviceName) =>
    api.post('/generate-config', { section, details, serviceName }),
  
  // AI-guided configuration generation
  generateAIGuidedConfig: (section, details, context = {}) =>
    api.post('/generate-config/ai-guided', { section, details, context }),
  
  // Get AI-guided information
  getAIGuidedInfo: () => api.get('/docs/ai-guided/info'),
  
  // Get section-specific AI guidance
  getSectionAIGuidance: (section) => api.get(`/docs/ai-guided/${section}`),
  
  // Get conversation context for AI
  getAIContext: (section, completedSections = [], currentConfig = {}) => 
    api.get(`/docs/ai-guided/context/${section}`, {
      params: { 
        completedSections: completedSections.join(','), 
        currentConfig: JSON.stringify(currentConfig) 
      }
    }),
  
  // Validate configuration
  validateConfig: (config, section) =>
    api.post('/validate-config', { config, section }),
  
  // Get documentation
  getDocs: () => api.get('/docs'),
  getSections: () => api.get('/docs'),
  getSectionDocs: (section) => api.get(`/docs/${section}`),
  getSectionSchema: (section) => api.get(`/docs/${section}/schema`),
  getSectionExamples: (section) => api.get(`/docs/${section}/examples`),

  // Get section order
  getSectionOrder: () => api.get('/docs/section-order'),
  
  // Get configuration creation requirements
  getCreateRequirements: () => api.get('/docs/create-requirements'),
  
  // External services
  sendToExternal: (config, service, options) =>
    api.post('/external-service', { config, service, options }),
  sendToGitHub: (config, options) =>
    api.post('/external-service/github', { config, options }),
  sendToS3: (config, options) =>
    api.post('/external-service/s3', { config, options }),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export { api }; 