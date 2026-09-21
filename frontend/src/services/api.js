import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000
});

export const fetchSystemHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    return {
      status: 'ERROR',
      services: {
        backend: { status: 'offline' },
        mongodb: { status: 'disconnected' },
        aiService: { status: 'unreachable', details: error.message }
      }
    };
  }
};

export const fetchSupportedDocumentTypes = async () => {
  try {
    const response = await apiClient.get('/documents/supported-types');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch document types:', error);
    return { success: false, supportedTypes: [] };
  }
};
