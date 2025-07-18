// API Configuration

// Base URL for the API
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// WebSocket Configuration
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://10.10.1.214:3333';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    login: {
      url: `${API_BASE_URL}/api/auth/login`,
      method: 'POST'
    },
    register: {
      url: `${API_BASE_URL}/api/auth/register`,
      method: 'POST'
    }
  },
  // GET endpoints
  operators: {
    url: `${API_BASE_URL}/api/operators`,
    method: 'GET'
  },
  categories: {
    url: `${API_BASE_URL}/api/categories`,
    method: 'GET'
  },
  addcategorie: {
    url: `${API_BASE_URL}/api/categories`,
    method: 'POST'
  },
  providers: {
    url: `${API_BASE_URL}/api/providers`,
    method: 'GET'
  },
  projects: {
    url: `${API_BASE_URL}/api/projects`,
    method: 'GET'
  },
  // POST endpoints
  projadd: {
    url: `${API_BASE_URL}/api/project`,
    method: 'POST'
  }
};

// WebSocket Endpoints
export const WS_ENDPOINTS = {
  ssh: (operatorId: string) => `${WS_BASE_URL}/ws/ssh/${operatorId}`
};

// Export a function to build a complete API URL
export const buildApiUrl = (endpoint: string, params?: Record<string, string>) => {
  const url = new URL(endpoint);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }
  }

  return url.toString();
};
