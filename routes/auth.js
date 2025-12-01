const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database/init');
const { validate, loginSchema, registerSchema } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), (req, res) => {
    const { email, password } = req.body;
    const senha = password; // Mapear password para senha
    const emailOrName = email.trim(); // Remove espaços

    // Função para buscar usuário
    const findUser = (query, params) => {
        return new Promise((resolve, reject) => {
            db.get(query, params, (err, user) => {
                if (err) reject(err);
                else resolve(user);
            });
        });
    };

    // Buscar usuário: primeiro por email, depois por nome
    (async () => {
        try {
            let user = null;
            
            // Se contém @, buscar por email
            if (emailOrName.includes('@')) {
                user = await findUser(
        'SELECT * FROM usuarios WHERE email = ? AND ativo = 1',
                    [emailOrName]
                );
            } else {
                // Buscar por nome
                user = await findUser(
                    'SELECT * FROM usuarios WHERE nome = ? AND ativo = 1',
                    [emailOrName]
                );
            }

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciais inválidas'
                });
            }

                const senhaValida = await bcrypt.compare(senha, user.senha);
                
                if (!senhaValida) {
                    return res.status(401).json({
                        success: false,
                        message: 'Credenciais inválidas'
                    });
                }

                const token = jwt.sign(
                    { 
                        id: user.id, 
                        email: user.email, 
                        tipo: user.tipo,
                        role: user.tipo  // Adicionar role para padronização
                    },
                    process.env.JWT_SECRET || 'sua_chave_secreta_super_segura_aqui',
                    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
                );

                res.json({
                    success: true,
                    message: 'Login realizado com sucesso',
                    data: {
                        token,
                        user: {
                            id: user.id,
                            nome: user.nome,
                            email: user.email,
                            role: user.tipo,  // Retornar como 'role'
                            tipo: user.tipo,  // Manter 'tipo' para compatibilidade
                            telefone: user.telefone
                        }
                    }
                });
            } catch (error) {
            console.error('Erro no login:', error);
                res.status(500).json({
                    success: false,
                    message: 'Erro interno do servidor'
                });
            }
    })();
});

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res) => {
    const { nome, email, password, telefone } = req.body;
    const senha = password; // Mapear password para senha
    
    // FORÇAR role "cliente" - usuário NÃO pode escolher o tipo
    const tipo = 'cliente';

    try {
        // Verificar se email já existe
        const existingUser = await new Promise((resolve, reject) => {
            db.get(
                'SELECT id FROM usuarios WHERE email = ?',
                [email],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email já está em uso'
            });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(senha, 10);

        // Inserir novo usuário - SEMPRE como cliente
        const result = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO usuarios (nome, email, senha, telefone, tipo) 
                 VALUES (?, ?, ?, ?, ?)`,
                [nome, email, hashedPassword, telefone, tipo],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });

        // Gerar token
        const token = jwt.sign(
            { 
                id: result.id, 
                email: email, 
                tipo: tipo,
                role: tipo  // Adicionar role para padronização
            },
            process.env.JWT_SECRET || 'sua_chave_secreta_super_segura_aqui',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            data: {
                token,
                user: {
                    id: result.id,
                    nome,
                    email,
                    role: tipo,  // Retornar como 'role'
                    tipo: tipo,  // Manter 'tipo' para compatibilidade
                    telefone
                }
            }
        });

    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
    // Este endpoint será protegido pelo middleware de autenticação
    res.json({
        success: true,
        data: {
            user: req.user
        }
    });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    // Em uma implementação mais robusta, você poderia invalidar o token
    // Por enquanto, apenas retornamos sucesso
    res.json({
        success: true,
        message: 'Logout realizado com sucesso'
    });
});

// GET /api/auth/verify - Verificar se token é válido
router.get('/verify', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token não fornecido'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta_super_segura_aqui', (err, decoded) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Token inválido'
            });
        }

        res.json({
            success: true,
            data: {
                user: decoded
            }
        });
    });
});

module.exports = router;












