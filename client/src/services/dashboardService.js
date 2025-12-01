import api from './api';

export const dashboardService = {
  async getStats(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const response = await api.get(`/dashboard/stats?${params.toString()}`);
    return response.data;
  },

  async getRecentBookings() {
    const response = await api.get('/dashboard/recent-bookings');
    return response.data;
  },

  async getTodayBookings() {
    const response = await api.get('/dashboard/today-bookings');
    return response.data;
  },

  async getBarberPerformance() {
    const response = await api.get('/dashboard/barber-performance');
    return response.data;
  },

  async getPopularServices() {
    const response = await api.get('/dashboard/popular-services');
    return response.data;
  }
};




