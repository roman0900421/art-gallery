import axios from "axios";

// Create a configured axios instance with defaults
const api = axios.create({
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for logging and authentication
api.interceptors.request.use(
  (config) => {
    // You could add authentication token here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Implement retry logic for network errors or 5xx responses
    if (
      (error.message.includes('timeout') || 
      error.message.includes('Network Error') ||
      (error.response && error.response.status >= 500)) && 
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      return api(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

// Helper function for API calls with consistent error handling
const apiCall = async (endpoint, method = 'GET', data = null) => {
  try {
    const response = await api({
      url: endpoint,
      method,
      data,
    });
    
    return response;
  } catch (error) {
    console.error(`API call to ${endpoint} failed:`, error);
    
    // Return a structured error response
    return {
      error: true,
      message: error.response?.data?.message || error.message || 'Unknown error occurred',
      status: error.response?.status || 500,
      request: { status: error.response?.status || 500 },
    };
  }
};

export const getAllCategories = async () => {
  return apiCall('/api/categories');
};

export const getAllProducts = async () => {
  return apiCall('/api/products');
};

export const getProductById = async (productId) => {
  return apiCall(`/api/products/${productId}`);
};

// Add more API services as needed
