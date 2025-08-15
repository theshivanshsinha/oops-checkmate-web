// API Configuration
// Change this to switch between local and production environments
import { ENVIRONMENT } from './environment';

const API_CONFIG = {
  local: {
    baseURL: 'http://localhost:5000/api',
    serverURL: 'http://localhost:5000'
  },
  production: {
    baseURL: 'https://oops-checkmate-web.onrender.com/api',
    serverURL: 'https://oops-checkmate-web.onrender.com'
  }
};

export const API_BASE_URL = API_CONFIG[ENVIRONMENT].baseURL;
export const SERVER_URL = API_CONFIG[ENVIRONMENT].serverURL;

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function to get full server URL
export const getServerUrl = (endpoint) => {
  return `${SERVER_URL}${endpoint}`;
};

console.log(`Using ${ENVIRONMENT} environment: ${API_BASE_URL}`); 