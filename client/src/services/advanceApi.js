import api from './api';

// Dedicated API methods for the advance and settlement workflow.
export const advanceApi = {
  getAll: () => api.get('/advances'),
  create: (data) => api.post('/advances', data),
  approve: (id, action, rejectionReason = '') => api.patch(`/advances/${id}/approve`, { action, rejectionReason }),
  disburse: (id, transactionCode, amount) => api.patch(`/advances/${id}/disburse`, { transactionCode, amount }),
  submitSettlement: (id, data) => api.post(`/advances/${id}/settlement`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  confirmSurplus: (id) => api.patch(`/advances/${id}/confirm-surplus`),
};
