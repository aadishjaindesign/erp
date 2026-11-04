import axios from 'axios';
import { API_CONFIG } from '../config/api';

const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS
});

// Fast In-Memory Response Cache for idempotent GET requests
// Key -> { data, status, headers, timestamp }
const responseCache = new Map();
const inFlightRequests = new Map();

// 20-second fast TTL for instant snappy UI navigation
const CACHE_TTL_MS = 20000;

export const clearApiCache = () => {
  responseCache.clear();
};

/**
 * Format human-readable error messages based on HTTP status code
 */
export const classifyApiError = (error) => {
  if (!error) return 'An unexpected error occurred.';

  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'Request timed out. Please check your network connection and retry.';
    }
    return 'Network connection failed. Please check your internet connection and retry.';
  }

  const status = error.response.status;
  const serverMsg = error.response.data?.message;

  switch (status) {
    case 429: {
      const retryAfter = error.response.headers?.['retry-after'];
      return serverMsg || (retryAfter 
        ? `Too many requests. Please wait ${retryAfter} seconds and try again.` 
        : 'Too many requests. Please wait a moment and try again.');
    }
    case 401:
      return serverMsg || 'Your session has expired. Please login again.';
    case 403:
      return serverMsg || 'You do not have permission to perform this action.';
    case 404:
      return serverMsg || 'Requested resource not found.';
    case 502:
    case 503:
    case 504:
      return 'Server is temporarily unavailable. Please retry.';
    case 500:
      return serverMsg || 'Server error. Please try again.';
    default:
      return serverMsg || error.message || 'Request failed. Please try again.';
  }
};

// Request Interceptor: Attach JWT Token & Instant In-Memory Cache
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const method = (config.method || 'get').toLowerCase();

    // Invalidate cache on mutations (POST, PUT, PATCH, DELETE)
    if (method !== 'get') {
      clearApiCache();
      return config;
    }

    const requestKey = `${config.baseURL || ''}${config.url}?${JSON.stringify(config.params || {})}`;

    // 1. Check in-memory cache for instant 0ms responses
    if (!config.skipCache && responseCache.has(requestKey)) {
      const entry = responseCache.get(requestKey);
      if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
        config.adapter = async () => ({
          data: JSON.parse(JSON.stringify(entry.data)),
          status: entry.status || 200,
          statusText: 'OK',
          headers: { ...entry.headers, 'x-erp-cache': 'HIT' },
          config,
          request: {}
        });
        return config;
      } else {
        responseCache.delete(requestKey);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Save to Fast Cache & Error Formatting
axiosInstance.interceptors.response.use(
  (response) => {
    const config = response.config || {};
    const method = (config.method || 'get').toLowerCase();

    if (method === 'get' && response.status === 200 && !config.skipCache) {
      const requestKey = `${config.baseURL || ''}${config.url}?${JSON.stringify(config.params || {})}`;
      responseCache.set(requestKey, {
        data: response.data,
        status: response.status,
        headers: response.headers,
        timestamp: Date.now()
      });
    }

    return response;
  },
  (error) => {
    // Attach categorized user message
    error.userMessage = classifyApiError(error);

    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized request - session expired.');
      if (!error.config?.url?.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('erp_user');
        clearApiCache();
        window.dispatchEvent(new CustomEvent('auth-unauthorized', {
          detail: { url: error.config?.url }
        }));
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
