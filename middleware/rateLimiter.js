const rateLimit = require('express-rate-limit');

// Rate limiter para autenticação
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 tentativas por IP
    message: {
        success: false,
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter geral
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // máximo 100 requests por IP
    message: {
        success: false,
        message: 'Muitas requisições. Tente novamente mais tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter para agendamentos
const bookingLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 3, // máximo 3 agendamentos por minuto
    message: {
        success: false,
        message: 'Muitos agendamentos. Aguarde um momento antes de tentar novamente.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    authLimiter,
    generalLimiter,
    bookingLimiter
};


























