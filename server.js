require('dotenv').config({ path: './config.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { initDatabase } = require('./database/init');
const { generalLimiter } = require('./middleware/rateLimiter');

// Importar rotas
const authRoutes = require('./routes/auth');
const barberRoutes = require('./routes/barbers');
const serviceRoutes = require('./routes/services');
const bookingRoutes = require('./routes/bookings');
const dashboardRoutes = require('./routes/dashboard');
const paymentRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Confiar no proxy em produção (Fly.io usa proxy reverso)
if (isProduction) {
    app.set('trust proxy', 1);
}

// Middleware de segurança
app.use(helmet({
    contentSecurityPolicy: isProduction ? {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    } : false,  // Desabilita CSP em desenvolvimento para facilitar
}));

// Middleware de CORS
app.use(cors({
    origin: isProduction 
        ? [process.env.BASE_URL, process.env.FRONTEND_URL].filter(Boolean)
        : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://localhost:5500'],
    credentials: true
}));

// Middleware de rate limiting
app.use(generalLimiter);

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// Rota de health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API da Barbearia está funcionando',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/barbers', barberRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentRoutes);

// Servir arquivos estáticos do frontend React (em produção)
if (isProduction) {
    app.use(express.static(path.join(__dirname, 'client/dist')));
} else {
    // Em desenvolvimento, servir arquivos da pasta raiz (se houver)
    app.use(express.static('.'));
}

// Rota para documentação da API
app.get('/api-docs', (req, res) => {
    res.json({
        success: true,
        message: 'Documentação da API da Barbearia',
        version: '1.0.0',
        baseUrl: `http://localhost:${PORT}/api`,
        endpoints: {
            health: {
                method: 'GET',
                path: '/health',
                description: 'Verificar status da API'
            },
            auth: {
                login: {
                    method: 'POST',
                    path: '/api/auth/login',
                    description: 'Realizar login'
                },
                register: {
                    method: 'POST',
                    path: '/api/auth/register',
                    description: 'Registrar novo usuário'
                },
                me: {
                    method: 'GET',
                    path: '/api/auth/me',
                    description: 'Obter dados do usuário logado',
                    auth: true
                },
                verify: {
                    method: 'GET',
                    path: '/api/auth/verify',
                    description: 'Verificar token JWT',
                    auth: true
                },
                logout: {
                    method: 'POST',
                    path: '/api/auth/logout',
                    description: 'Realizar logout',
                    auth: true
                }
            },
            barbers: {
                list: {
                    method: 'GET',
                    path: '/api/barbers',
                    description: 'Listar barbeiros'
                },
                get: {
                    method: 'GET',
                    path: '/api/barbers/:id',
                    description: 'Buscar barbeiro por ID'
                },
                schedule: {
                    method: 'GET',
                    path: '/api/barbers/:id/schedule',
                    description: 'Horários de funcionamento'
                },
                availability: {
                    method: 'GET',
                    path: '/api/barbers/:id/availability/:date',
                    description: 'Verificar disponibilidade'
                },
                updateSchedule: {
                    method: 'PUT',
                    path: '/api/barbers/:id/schedule',
                    description: 'Atualizar horários (admin)',
                    auth: true,
                    role: 'admin'
                }
            },
            services: {
                list: {
                    method: 'GET',
                    path: '/api/services',
                    description: 'Listar serviços'
                },
                get: {
                    method: 'GET',
                    path: '/api/services/:id',
                    description: 'Buscar serviço por ID'
                },
                create: {
                    method: 'POST',
                    path: '/api/services',
                    description: 'Criar serviço (admin)',
                    auth: true,
                    role: 'admin'
                },
                update: {
                    method: 'PUT',
                    path: '/api/services/:id',
                    description: 'Atualizar serviço (admin)',
                    auth: true,
                    role: 'admin'
                },
                delete: {
                    method: 'DELETE',
                    path: '/api/services/:id',
                    description: 'Desativar serviço (admin)',
                    auth: true,
                    role: 'admin'
                },
                bookings: {
                    method: 'GET',
                    path: '/api/services/:id/bookings',
                    description: 'Agendamentos do serviço (admin)',
                    auth: true,
                    role: 'admin'
                }
            },
            bookings: {
                list: {
                    method: 'GET',
                    path: '/api/bookings',
                    description: 'Listar agendamentos',
                    auth: true
                },
                get: {
                    method: 'GET',
                    path: '/api/bookings/:id',
                    description: 'Buscar agendamento por ID',
                    auth: true
                },
                create: {
                    method: 'POST',
                    path: '/api/bookings',
                    description: 'Criar agendamento',
                    auth: true
                },
                updateStatus: {
                    method: 'PUT',
                    path: '/api/bookings/:id/status',
                    description: 'Atualizar status do agendamento',
                    auth: true
                },
                cancel: {
                    method: 'DELETE',
                    path: '/api/bookings/:id',
                    description: 'Cancelar agendamento',
                    auth: true
                },
                history: {
                    method: 'GET',
                    path: '/api/bookings/history',
                    description: 'Histórico de agendamentos',
                    auth: true
                }
            },
            dashboard: {
                stats: {
                    method: 'GET',
                    path: '/api/dashboard/stats',
                    description: 'Estatísticas gerais',
                    auth: true
                },
                recentBookings: {
                    method: 'GET',
                    path: '/api/dashboard/recent-bookings',
                    description: 'Agendamentos recentes',
                    auth: true
                },
                calendar: {
                    method: 'GET',
                    path: '/api/dashboard/calendar/:year/:month',
                    description: 'Dados do calendário',
                    auth: true
                },
                servicesPopularity: {
                    method: 'GET',
                    path: '/api/dashboard/services-popularity',
                    description: 'Serviços mais populares (admin)',
                    auth: true,
                    role: 'admin'
                },
                barbersPerformance: {
                    method: 'GET',
                    path: '/api/dashboard/barbers-performance',
                    description: 'Performance dos barbeiros (admin)',
                    auth: true,
                    role: 'admin'
                },
                monthlyRevenue: {
                    method: 'GET',
                    path: '/api/dashboard/monthly-revenue',
                    description: 'Receita mensal (admin)',
                    auth: true,
                    role: 'admin'
                }
            }
        },
        authentication: {
            type: 'JWT',
            header: 'Authorization: Bearer <token>',
            expiresIn: '24h'
        },
        rateLimiting: {
            general: '100 requests per 15 minutes',
            auth: '5 attempts per 15 minutes',
            bookings: '3 bookings per minute'
        },
        userTypes: {
            cliente: 'Pode agendar e cancelar seus próprios agendamentos',
            barbeiro: 'Pode ver e gerenciar seus agendamentos',
            admin: 'Acesso total ao sistema'
        },
        documentation: {
            postman: 'Barbearia_API_Collection.postman_collection.json',
            environment: 'Barbearia_API_Environment.postman_environment.json',
            markdown: 'API_DOCUMENTATION.md'
        }
    });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            message: 'JSON inválido'
        });
    }
    
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
    });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
    // Em produção, redireciona para o frontend React (SPA)
    if (isProduction && !req.originalUrl.startsWith('/api')) {
        return res.sendFile(path.join(__dirname, 'client/dist/index.html'));
    }
    
    res.status(404).json({
        success: false,
        message: 'Rota não encontrada'
    });
});

// Inicializar banco de dados e iniciar servidor
const startServer = async () => {
    try {
        await initDatabase();
        
        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🌐 Frontend: http://localhost:${PORT}`);
            console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        console.error('Erro ao inicializar servidor:', error);
        process.exit(1);
    }
};

// Tratamento de sinais para encerramento graceful
process.on('SIGTERM', () => {
    console.log('SIGTERM recebido. Encerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT recebido. Encerrando servidor...');
    process.exit(0);
});

startServer();












