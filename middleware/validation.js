const Joi = require('joi');

// Validação para login
const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email deve ter um formato válido',
        'any.required': 'Email é obrigatório'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Senha deve ter pelo menos 6 caracteres',
        'any.required': 'Senha é obrigatória'
    })
});

// Validação para registro de usuário (sempre cria como cliente)
const registerSchema = Joi.object({
    nome: Joi.string().min(2).max(100).required().messages({
        'string.min': 'Nome deve ter pelo menos 2 caracteres',
        'string.max': 'Nome deve ter no máximo 100 caracteres',
        'any.required': 'Nome é obrigatório'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Email deve ter um formato válido',
        'any.required': 'Email é obrigatório'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Senha deve ter pelo menos 6 caracteres',
        'any.required': 'Senha é obrigatória'
    }),
    telefone: Joi.string().pattern(/^\(?\d{2}\)?\s*\d{4,5}\s*-?\s*\d{4}$/).allow('', null).optional().messages({
        'string.pattern.base': 'Telefone inválido. Exemplos válidos: (99) 99999-9999, 99 99999-9999, 99999999999'
    })
    // Campo 'tipo' removido - sempre será 'cliente' no backend
});

// Validação para agendamento
const bookingSchema = Joi.object({
    barbeiro_id: Joi.number().integer().positive().required().messages({
        'number.base': 'ID do barbeiro deve ser um número',
        'number.integer': 'ID do barbeiro deve ser um número inteiro',
        'number.positive': 'ID do barbeiro deve ser positivo',
        'any.required': 'ID do barbeiro é obrigatório'
    }),
    servico_id: Joi.number().integer().positive().required().messages({
        'number.base': 'ID do serviço deve ser um número',
        'number.integer': 'ID do serviço deve ser um número inteiro',
        'number.positive': 'ID do serviço deve ser positivo',
        'any.required': 'ID do serviço é obrigatório'
    }),
    data_agendamento: Joi.alternatives().try(
        Joi.date().min('now'),
        Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).custom((value, helpers) => {
            const date = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            date.setHours(0, 0, 0, 0);
            if (date < today) {
                return helpers.error('date.min');
            }
            return value;
        })
    ).required().messages({
        'date.base': 'Data deve ser uma data válida',
        'date.min': 'Data deve ser hoje ou no futuro',
        'any.required': 'Data é obrigatória',
        'string.pattern.base': 'Data deve estar no formato YYYY-MM-DD'
    }),
    hora_agendamento: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
        'string.pattern.base': 'Hora deve estar no formato HH:MM',
        'any.required': 'Hora é obrigatória'
    }),
    observacoes: Joi.string().max(500).allow('', null).empty('').optional().messages({
        'string.max': 'Observações devem ter no máximo 500 caracteres'
    })
});

// Validação para serviço
const serviceSchema = Joi.object({
    nome: Joi.string().min(2).max(100).required().messages({
        'string.min': 'Nome deve ter pelo menos 2 caracteres',
        'string.max': 'Nome deve ter no máximo 100 caracteres',
        'any.required': 'Nome é obrigatório'
    }),
    descricao: Joi.string().max(500).optional().messages({
        'string.max': 'Descrição deve ter no máximo 500 caracteres'
    }),
    preco: Joi.number().positive().precision(2).required().messages({
        'number.base': 'Preço deve ser um número',
        'number.positive': 'Preço deve ser positivo',
        'number.precision': 'Preço deve ter no máximo 2 casas decimais',
        'any.required': 'Preço é obrigatório'
    }),
    duracao_minutos: Joi.number().integer().positive().required().messages({
        'number.base': 'Duração deve ser um número',
        'number.integer': 'Duração deve ser um número inteiro',
        'number.positive': 'Duração deve ser positiva',
        'any.required': 'Duração é obrigatória'
    })
});

// Validação para atualização de status de agendamento
const updateBookingStatusSchema = Joi.object({
    status: Joi.string().valid('pendente', 'confirmado', 'cancelado', 'concluido').required().messages({
        'any.only': 'Status deve ser: pendente, confirmado, cancelado ou concluido',
        'any.required': 'Status é obrigatório'
    })
});

// Middleware de validação genérico
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: false });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            
            return res.status(400).json({
                success: false,
                message: 'Dados inválidos',
                errors
            });
        }
        
        req.body = value;
        next();
    };
};

module.exports = {
    validate,
    loginSchema,
    registerSchema,
    bookingSchema,
    serviceSchema,
    updateBookingStatusSchema
};

