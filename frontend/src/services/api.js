import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000
});

// Set token header if exists
const storedToken = localStorage.getItem('token');
if (storedToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
}

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

export const uploadDocumentForScreening = async (formData) => {
  try {
    const response = await apiClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to upload and screen document.'
    };
  }
};

export const fetchVerificationReport = async (id) => {
  try {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch verification report.'
    };
  }
};

export const fetchUserHistory = async () => {
  try {
    const response = await apiClient.get('/documents/history');
    return response.data;
  } catch (error) {
    return { success: false, verifications: [] };
  }
};

export const fetchVerificationHistory = fetchUserHistory;

export const deleteVerificationRecord = async (id) => {
  try {
    const response = await apiClient.delete(`/documents/${id}`);
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to delete record.'
    };
  }
};

export const fetchAdminDashboardStats = async () => {
  try {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
  } catch (error) {
    return { success: false, stats: {}, documentTypeBreakdown: [] };
  }
};

export const fetchEvaluationMetrics = async () => {
  try {
    const response = await apiClient.get('/eval/metrics');
    return response.data;
  } catch (error) {
    return { evaluated: false, message: 'Evaluation metrics unavailable' };
  }
};

export const triggerEvaluationRun = async () => {
  try {
    const response = await apiClient.post('/eval/run');
    return response.data;
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const triggerModelEvaluation = triggerEvaluationRun;
