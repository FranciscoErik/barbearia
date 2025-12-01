import api from './api';

export const barberService = {
  async getBarbers() {
    const response = await api.get('/barbers');
    return response.data;
  },

  async getBarber(id) {
    const response = await api.get(`/barbers/${id}`);
    return response.data;
  },

  async getSchedule(barberId) {
    const response = await api.get(`/barbers/${barberId}/schedule`);
    return response.data;
  },

  async getAvailability(barberId, date) {
    const response = await api.get(`/barbers/${barberId}/availability/${date}`);
    return response.data;
  },

  async createBarber(barberData) {
    const response = await api.post('/barbers', barberData);
    return response.data;
  },

  async toggleBarberStatus(barberId, ativo) {
    const response = await api.put(`/barbers/${barberId}/status`, { ativo });
    return response.data;
  }
};

