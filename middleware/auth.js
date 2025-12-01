const jwt = require('jsonwebtoken');
const { db } = require('../database/init');

// Middleware para verificar autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token de acesso não fornecido'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta_super_segura_aqui', async (err, decoded) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Token inválido ou expirado'
            });
        }
        
        // Buscar dados atualizados do usuário no banco
        try {
            const user = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT id, nome, email, tipo, ativo FROM usuarios WHERE id = ?',
                    [decoded.id],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (!user || !user.ativo) {
                return res.status(403).json({
                    success: false,
                    message: 'Usuário inativo ou não encontrado'
                });
            }

            // Adicionar role (mapear tipo do banco para role no código)
            req.user = {
                id: user.id,
                email: user.email,
                nome: user.nome,
                tipo: user.tipo, // Mantido para compatibilidade
                role: user.tipo   // Novo campo padronizado
            };
            
            next();
        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao verificar autenticação'
            });
        }
    });
};

// Middleware para verificar role (suporta tanto 'tipo' quanto 'role' para compatibilidade)
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuário não autenticado'
            });
        }

        // Verificar tanto 'role' quanto 'tipo' para compatibilidade
        const userRole = req.user.role || req.user.tipo;

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado. Permissões insuficientes.'
            });
        }

        next();
    };
};

// Middleware específico para ADMIN
const isAdmin = authorize('admin');

// Middleware específico para BARBEIRO (barbeiro ou admin)
const isBarber = authorize('barbeiro', 'admin');

// Middleware específico para CLIENTE (cliente, barbeiro ou admin)
const isClient = authorize('cliente', 'barbeiro', 'admin');

// Middleware para verificar se é barbeiro (apenas barbeiro, não admin)
const requireBarber = authorize('barbeiro');

// Middleware específico para admin (apenas admin)
const requireAdmin = authorize('admin');

module.exports = {
    authenticateToken,
    authorize,
    isAdmin,
    isBarber,
    isClient,
    requireBarber,
    requireAdmin
};
