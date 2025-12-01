import api from './api';

export const paymentService = {
  async createPayment(bookingId, paymentData = {}) {
    const response = await api.post('/payments/create', {
      booking_id: bookingId,
      ...paymentData
    });
    return response.data;
  },

  async createPixPayment(bookingId, paymentData = {}) {
    const response = await api.post('/payments/create-pix', {
      booking_id: bookingId,
      ...paymentData
    });
    return response.data;
  },

  async getPaymentStatus(bookingId) {
    const response = await api.get(`/payments/status/${bookingId}`);
    return response.data;
  }
};
