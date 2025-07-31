import axios from 'axios';
import { getServerConfig } from '../config/server';

// Create axios instance with centralized configuration
const api = axios.create({
  baseURL: getServerConfig().baseURL,
  timeout: getServerConfig().timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth headers here if needed
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`Response received from: ${response.config.url}`, response.status);
    return response.data;
  },
  (error) => {
    console.error('Response error:', error);
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
    api.post('/api/generate-config', { section, details, serviceName }),
  
  // AI-guided configuration generation
  generateAIGuidedConfig: (section, details, context = {}) =>
    api.post('/api/generate-config/ai-guided', { section, details, context }),
  
  // Get AI-guided information
  getAIGuidedInfo: () => api.get('/api/docs/ai-guided/info'),
  
  // Get section-specific AI guidance
  getSectionAIGuidance: (section) => api.get(`/api/docs/ai-guided/${section}`),
  
  // Get conversation context for AI
  getAIContext: (section, completedSections = [], currentConfig = {}) => 
    api.get(`/api/docs/ai-guided/context/${section}`, {
      params: { 
        completedSections: completedSections.join(','), 
        currentConfig: JSON.stringify(currentConfig) 
      }
    }),
  
  // Validate configuration
  validateConfig: (config, section) =>
    api.post('/api/validate-config', { config, section }),
  
  // Get documentation
  getDocs: () => api.get('/api/docs'),
  getSections: () => api.get('/api/docs'),
  getSectionDocs: (section) => api.get(`/api/docs/${section}`),
  getSectionSchema: (section) => api.get(`/api/docs/${section}/schema`),
  getSectionExamples: (section) => api.get(`/api/docs/${section}/examples`),

  // Get section order
  getSectionOrder: () => api.get('/api/docs/section-order'),
  
  // Get configuration creation requirements
  getCreateRequirements: () => api.get('/api/docs/create-requirements'),
  
  // Generate JSON from guided questions
  generateJsonFromGuidedQuestions: (fieldName, answers, questions) =>
    api.post('/api/docs/generate-json', { fieldName, answers, questions }),
  
  // External services
  sendToExternal: (config, service, options) =>
    api.post('/api/external-service', { config, service, options }),
  sendToGitHub: (config, options) =>
    api.post('/api/external-service/github', { config, options }),
  sendToS3: (config, options) =>
    api.post('/api/external-service/s3', { config, options }),
};

// Health check
export const healthAPI = {
  check: () => api.get('/api/health'),
};

// Export server configuration for debugging
export const serverConfig = {
  getServerURL: () => getServerConfig().baseURL,
  getServerConfig,
  currentURL: getServerConfig().baseURL
};

export { api }; 