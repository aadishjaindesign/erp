import axios from 'axios';
import { API_CONFIG } from '../../../config/api';

// Dedicated axios instance for Lead Management
const leadAxios = axios.create({
  baseURL: API_CONFIG.LEAD_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS
});

// Fast In-Memory Response Cache for Lead Management GET queries
const leadCache = new Map();
const LEAD_CACHE_TTL_MS = 20000;

export const clearLeadCache = () => {
  leadCache.clear();
};

// Request Interceptor: Attach auth token & memory cache
leadAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const method = (config.method || 'get').toLowerCase();

    // Clear cache immediately on data changes (create, edit, delete, status change)
    if (method !== 'get') {
      clearLeadCache();
      return config;
    }

    const requestKey = `${config.baseURL || ''}${config.url}?${JSON.stringify(config.params || {})}`;

    if (!config.skipCache && leadCache.has(requestKey)) {
      const entry = leadCache.get(requestKey);
      if (Date.now() - entry.timestamp < LEAD_CACHE_TTL_MS) {
        config.adapter = async () => ({
          data: JSON.parse(JSON.stringify(entry.data)),
          status: entry.status || 200,
          statusText: 'OK',
          headers: { ...entry.headers, 'x-lead-cache': 'HIT' },
          config,
          request: {}
        });
        return config;
      } else {
        leadCache.delete(requestKey);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Store responses in cache
leadAxios.interceptors.response.use(
  (response) => {
    const config = response.config || {};
    const method = (config.method || 'get').toLowerCase();

    if (method === 'get' && response.status === 200 && !config.skipCache) {
      const requestKey = `${config.baseURL || ''}${config.url}?${JSON.stringify(config.params || {})}`;
      leadCache.set(requestKey, {
        data: response.data,
        status: response.status,
        headers: response.headers,
        timestamp: Date.now()
      });
    }

    return response;
  },
  (error) => Promise.reject(error)
);

export const leadApi = {
  getLeads: async (forceRefresh = false) => {
    const response = await leadAxios.get('/lead', { skipCache: forceRefresh });
    return response.data;
  },

  updateLeadStatus: async (leadId, status) => {
    const response = await leadAxios.put(`/lead/${leadId}`, { status });
    return response.data;
  },

  deleteLead: async (leadId) => {
    const response = await leadAxios.delete(`/lead/${leadId}`);
    return response.data;
  },

  createLead: async (leadData) => {
    const response = await leadAxios.post('/lead', leadData);
    return response.data;
  },

  createOfflineLead: async (leadData) => {
    const response = await leadAxios.post('/lead/offline', leadData);
    return response.data;
  },

  updateLead: async (leadId, leadData) => {
    const response = await leadAxios.put(`/lead/${leadId}`, leadData);
    return response.data;
  },

  admitStudent: async (admissionData) => {
    const formData = new FormData();
    for (const key in admissionData) {
      if (admissionData[key] !== null && admissionData[key] !== undefined) {
        if (key === 'selectedCourses' || key === 'enrolledCourses' || key === 'courses' || key === 'emiSchedule') {
          formData.append(key, JSON.stringify(admissionData[key]));
        } else if (key === 'idDocumentPhotos') {
          admissionData[key].forEach(file => {
            formData.append('idDocumentPhotos', file);
          });
        } else if (key === 'retainedIdDocumentPhotos') {
          formData.append(key, JSON.stringify(admissionData[key]));
        } else {
          formData.append(key, admissionData[key]);
        }
      }
    }
    const response = await leadAxios.post('/lead/admission', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  updateAdmittedStudent: async (id, admissionData) => {
    const formData = new FormData();
    for (const key in admissionData) {
      if (admissionData[key] !== null && admissionData[key] !== undefined) {
        if (key === 'selectedCourses' || key === 'enrolledCourses' || key === 'courses' || key === 'emiSchedule') {
          formData.append(key, JSON.stringify(admissionData[key]));
        } else if (key === 'idDocumentPhotos') {
          admissionData[key].forEach(file => {
            formData.append('idDocumentPhotos', file);
          });
        } else if (key === 'retainedIdDocumentPhotos') {
          formData.append(key, JSON.stringify(admissionData[key]));
        } else {
          formData.append(key, admissionData[key]);
        }
      }
    }
    const response = await leadAxios.put(`/lead/admission/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getAdmittedStudents: async (forceRefresh = false) => {
    const response = await leadAxios.get('/lead/admissions', { skipCache: forceRefresh });
    return response.data;
  },

  deleteAdmittedStudent: async (id) => {
    const response = await leadAxios.delete(`/lead/admission/${id}`);
    return response.data;
  }
};
