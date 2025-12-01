const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

// POST /api/payments/create - Criar pagamento (checkout)
router.post('/create', authenticateToken, (req, res) => {
    paymentController.createPayment(req, res);
});

// POST /api/payments/create-pix - Criar pagamento Pix
router.post('/create-pix', authenticateToken, (req, res) => {
    paymentController.createPixPayment(req, res);
});

// POST /api/payments/webhook - Webhook do Mercado Pago
router.post('/webhook', express.json(), (req, res) => {
    paymentController.handleWebhook(req, res);
});

// GET /api/payments/status/:booking_id - Verificar status do pagamento
router.get('/status/:booking_id', authenticateToken, (req, res) => {
    paymentController.checkPaymentStatus(req, res);
});

module.exports = router;

