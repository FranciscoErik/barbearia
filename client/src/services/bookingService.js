import api from './api';

export const bookingService = {
  async getBookings(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    const response = await api.get(`/bookings?${params.toString()}`);
    return response.data;
  },

  async getBooking(id) {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  async createBooking(bookingData) {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  async updateStatus(id, status) {
    const response = await api.put(`/bookings/${id}/status`, { status });
    return response.data;
  },

  async cancelBooking(id) {
    const response = await api.delete(`/bookings/${id}`);
    return response.data;
  }
};




