const express = require('express');
const { db } = require('../database/init');
const { authenticateToken, requireBarber, requireAdmin } = require('../middleware/auth');
const { validate, bookingSchema, updateBookingStatusSchema } = require('../middleware/validation');
// const { bookingLimiter } = require('../middleware/rateLimiter'); // DESABILITADO

const router = express.Router();

// GET /api/bookings - Listar agendamentos
router.get('/', authenticateToken, (req, res) => {
    const { 
        barbeiro_id, 
        cliente_id, 
        data_inicio, 
        data_fim, 
        status,
        page = 1,
        limit = 20
    } = req.query;

    let query = `
        SELECT 
            a.id,
            a.data_agendamento,
            a.hora_agendamento,
            a.status,
            a.observacoes,
            a.created_at,
            u.nome as cliente_nome,
            u.email as cliente_email,
            u.telefone as cliente_telefone,
            b.nome as barbeiro_nome,
            s.nome as servico_nome,
            s.preco,
            s.duracao_minutos
        FROM agendamentos a
        JOIN usuarios u ON a.cliente_id = u.id
        JOIN usuarios b ON a.barbeiro_id = b.id
        JOIN servicos s ON a.servico_id = s.id
        WHERE 1=1
    `;

    const params = [];

    // Filtros baseados no role do usuário
    const userRole = req.user.role || req.user.tipo;
    if (userRole === 'cliente') {
        query += ' AND a.cliente_id = ?';
        params.push(req.user.id);
    } else if (userRole === 'barbeiro') {
        query += ' AND a.barbeiro_id = ?';
        params.push(req.user.id);
    }

    if (barbeiro_id) {
        query += ' AND a.barbeiro_id = ?';
        params.push(barbeiro_id);
    }

    if (cliente_id) {
        query += ' AND a.cliente_id = ?';
        params.push(cliente_id);
    }

    if (data_inicio) {
        query += ' AND a.data_agendamento >= ?';
        params.push(data_inicio);
    }

    if (data_fim) {
        query += ' AND a.data_agendamento <= ?';
        params.push(data_fim);
    }

    if (status) {
        query += ' AND a.status = ?';
        params.push(status);
    }

    query += ' ORDER BY a.data_agendamento, a.hora_agendamento';

    // Paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar agendamentos'
            });
        }

        res.json({
            success: true,
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: rows.length
            }
        });
    });
});

// GET /api/bookings/:id - Buscar agendamento específico
router.get('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    let query = `
        SELECT 
            a.id,
            a.data_agendamento,
            a.hora_agendamento,
            a.status,
            a.observacoes,
            a.created_at,
            u.nome as cliente_nome,
            u.email as cliente_email,
            u.telefone as cliente_telefone,
            b.nome as barbeiro_nome,
            s.nome as servico_nome,
            s.preco,
            s.duracao_minutos
        FROM agendamentos a
        JOIN usuarios u ON a.cliente_id = u.id
        JOIN usuarios b ON a.barbeiro_id = b.id
        JOIN servicos s ON a.servico_id = s.id
        WHERE a.id = ?
    `;

    const params = [id];

    // Restrições baseadas no role do usuário
    const userRole = req.user.role || req.user.tipo;
    if (userRole === 'cliente') {
        query += ' AND a.cliente_id = ?';
        params.push(req.user.id);
    } else if (userRole === 'barbeiro') {
        query += ' AND a.barbeiro_id = ?';
        params.push(req.user.id);
    }

    db.get(query, params, (err, row) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar agendamento'
            });
        }

        if (!row) {
            return res.status(404).json({
                success: false,
                message: 'Agendamento não encontrado'
            });
        }

        res.json({
            success: true,
            data: row
        });
    });
});

// POST /api/bookings - Criar novo agendamento
router.post('/', authenticateToken, validate(bookingSchema), (req, res) => {
    const { barbeiro_id, servico_id, data_agendamento, hora_agendamento, observacoes } = req.body;
    const cliente_id = req.user.id;
    const observacoesValue = observacoes || ''; // Garantir que seja string vazia se não fornecido

    // Verificar se o barbeiro existe e está ativo
    db.get(
        'SELECT id FROM usuarios WHERE id = ? AND tipo = "barbeiro" AND ativo = 1',
        [barbeiro_id],
        (err, barber) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao verificar barbeiro'
                });
            }

            if (!barber) {
                return res.status(400).json({
                    success: false,
                    message: 'Barbeiro não encontrado ou inativo'
                });
            }

            // Verificar se o serviço existe e está ativo
            db.get(
                'SELECT id, duracao_minutos FROM servicos WHERE id = ? AND ativo = 1',
                [servico_id],
                (err, service) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Erro ao verificar serviço'
                        });
                    }

                    if (!service) {
                        return res.status(400).json({
                            success: false,
                            message: 'Serviço não encontrado ou inativo'
                        });
                    }

                    // Verificar se o horário está disponível
                    checkAvailability(barbeiro_id, data_agendamento, hora_agendamento, service.duracao_minutos)
                        .then((isAvailable) => {
                            if (!isAvailable) {
                                return res.status(400).json({
                                    success: false,
                                    message: 'Horário não disponível'
                                });
                            }

                            // Criar agendamento
                            db.run(
                                `INSERT INTO agendamentos (cliente_id, barbeiro_id, servico_id, data_agendamento, hora_agendamento, observacoes) 
                                 VALUES (?, ?, ?, ?, ?, ?)`,
                                [cliente_id, barbeiro_id, servico_id, data_agendamento, hora_agendamento, observacoesValue],
                                function(err) {
                                    if (err) {
                                        return res.status(500).json({
                                            success: false,
                                            message: 'Erro ao criar agendamento'
                                        });
                                    }

                                    res.status(201).json({
                                        success: true,
                                        message: 'Agendamento criado com sucesso',
                                        data: {
                                            id: this.lastID,
                                            cliente_id,
                                            barbeiro_id,
                                            servico_id,
                                            data_agendamento,
                                            hora_agendamento,
                                            observacoes: observacoesValue,
                                            status: 'pendente'
                                        }
                                    });
                                }
                            );
                        })
                        .catch((error) => {
                            res.status(500).json({
                                success: false,
                                message: 'Erro ao verificar disponibilidade'
                            });
                        });
                }
            );
        }
    );
});

// PUT /api/bookings/:id/status - Atualizar status do agendamento
router.put('/:id/status', authenticateToken, validate(updateBookingStatusSchema), (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Verificar se o agendamento existe e se o usuário tem permissão
    let query = 'SELECT * FROM agendamentos WHERE id = ?';
    const params = [id];

    if (req.user.tipo === 'cliente') {
        query += ' AND cliente_id = ?';
        params.push(req.user.id);
    } else if (req.user.tipo === 'barbeiro') {
        query += ' AND barbeiro_id = ?';
        params.push(req.user.id);
    }

    db.get(query, params, (err, booking) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao verificar agendamento'
            });
        }

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Agendamento não encontrado'
            });
        }

        // Restrições de status baseadas no role do usuário
        const userRole = req.user.role || req.user.tipo;
        if (userRole === 'cliente' && !['cancelado'].includes(status)) {
            return res.status(403).json({
                success: false,
                message: 'Clientes só podem cancelar agendamentos'
            });
        }

        // Atualizar status
        db.run(
            'UPDATE agendamentos SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, id],
            function(err) {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Erro ao atualizar status do agendamento'
                    });
                }

                res.json({
                    success: true,
                    message: 'Status do agendamento atualizado com sucesso',
                    data: {
                        id: parseInt(id),
                        status: status
                    }
                });
            }
        );
    });
});

// GET /api/bookings/history - Histórico de agendamentos do cliente
router.get('/history', authenticateToken, (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    
    let query = `
        SELECT 
            a.id,
            a.data_agendamento,
            a.hora_agendamento,
            a.status,
            a.observacoes,
            a.created_at,
            a.updated_at,
            b.nome as barbeiro_nome,
            b.email as barbeiro_email,
            b.telefone as barbeiro_telefone,
            s.nome as servico_nome,
            s.preco,
            s.duracao_minutos,
            s.descricao as servico_descricao
        FROM agendamentos a
        JOIN usuarios b ON a.barbeiro_id = b.id
        JOIN servicos s ON a.servico_id = s.id
        WHERE a.cliente_id = ?
        ORDER BY a.data_agendamento DESC, a.hora_agendamento DESC
    `;
    
    const params = [req.user.id];
    
    // Paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar histórico'
            });
        }
        
        res.json({
            success: true,
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: rows.length
            }
        });
    });
});

// DELETE /api/bookings/:id - Cancelar agendamento
router.delete('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    // Verificar se o agendamento existe e se o usuário tem permissão
    let query = 'SELECT * FROM agendamentos WHERE id = ?';
    const params = [id];
    const userRole = req.user.role || req.user.tipo;

    if (userRole === 'cliente') {
        query += ' AND cliente_id = ?';
        params.push(req.user.id);
    } else if (userRole === 'barbeiro') {
        query += ' AND barbeiro_id = ?';
        params.push(req.user.id);
    }

    db.get(query, params, (err, booking) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao verificar agendamento'
            });
        }

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Agendamento não encontrado'
            });
        }

        if (booking.status === 'cancelado') {
            return res.status(400).json({
                success: false,
                message: 'Agendamento já foi cancelado'
            });
        }

        if (booking.status === 'concluido') {
            return res.status(400).json({
                success: false,
                message: 'Não é possível cancelar um agendamento concluído'
            });
        }

        // Cancelar agendamento
        db.run(
            'UPDATE agendamentos SET status = "cancelado", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id],
            function(err) {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Erro ao cancelar agendamento'
                    });
                }

                res.json({
                    success: true,
                    message: 'Agendamento cancelado com sucesso'
                });
            }
        );
    });
});

// Função auxiliar para verificar disponibilidade
function checkAvailability(barbeiro_id, data_agendamento, hora_agendamento, duracao_minutos) {
    return new Promise((resolve, reject) => {
        // Verificar se o barbeiro trabalha neste dia
        const dayOfWeek = new Date(data_agendamento).getDay();
        
        db.get(
            `SELECT hora_inicio, hora_fim 
             FROM horarios_funcionamento 
             WHERE barbeiro_id = ? AND dia_semana = ? AND ativo = 1`,
            [barbeiro_id, dayOfWeek],
            (err, schedule) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!schedule) {
                    resolve(false); // Barbeiro não trabalha neste dia
                    return;
                }

                // Verificar se o horário está dentro do horário de funcionamento
                const startTime = timeToMinutes(hora_agendamento);
                const endTime = startTime + duracao_minutos;
                const workStart = timeToMinutes(schedule.hora_inicio);
                const workEnd = timeToMinutes(schedule.hora_fim);

                if (startTime < workStart || endTime > workEnd) {
                    resolve(false); // Fora do horário de funcionamento
                    return;
                }

                // Verificar conflitos com outros agendamentos (incluindo pendentes)
                db.all(
                    `SELECT hora_agendamento, s.duracao_minutos 
                     FROM agendamentos a 
                     JOIN servicos s ON a.servico_id = s.id 
                     WHERE a.barbeiro_id = ? AND a.data_agendamento = ? AND a.status IN ('pendente', 'confirmado')`,
                    [barbeiro_id, data_agendamento],
                    (err, existingBookings) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        const hasConflict = existingBookings.some(booking => {
                            const existingStart = timeToMinutes(booking.hora_agendamento);
                            const existingEnd = existingStart + (booking.duracao_minutos || 30);
                            
                            return (startTime < existingEnd && endTime > existingStart);
                        });

                        resolve(!hasConflict);
                    }
                );
            }
        );
    });
}

// Função auxiliar para converter tempo para minutos
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

module.exports = router;





