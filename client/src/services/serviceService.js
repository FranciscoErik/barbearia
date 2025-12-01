import api from './api';

export const serviceService = {
  async getServices() {
    const response = await api.get('/services');
    return response.data;
  },

  async getService(id) {
    const response = await api.get(`/services/${id}`);
    return response.data;
  }
};




