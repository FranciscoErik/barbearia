const express = require('express');
const { db } = require('../database/init');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validate, serviceSchema } = require('../middleware/validation');

const router = express.Router();

// GET /api/services - Listar todos os serviços
router.get('/', (req, res) => {
    db.all(
        `SELECT id, nome, descricao, preco, duracao_minutos, ativo, created_at 
         FROM servicos 
         WHERE ativo = 1 
         GROUP BY nome
         ORDER BY id ASC
         LIMIT 10`,
        (err, rows) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao buscar serviços'
                });
            }

            // Garantir que não há duplicatas (filtro adicional por segurança)
            const uniqueServices = [];
            const seenNames = new Set();
            
            rows.forEach(service => {
                const nameKey = service.nome?.toLowerCase().trim();
                if (nameKey && !seenNames.has(nameKey)) {
                    seenNames.add(nameKey);
                    uniqueServices.push(service);
                }
            });

            res.json({
                success: true,
                data: uniqueServices
            });
        }
    );
});

// GET /api/services/:id - Buscar serviço específico
router.get('/:id', (req, res) => {
    const { id } = req.params;

    db.get(
        `SELECT id, nome, descricao, preco, duracao_minutos, ativo, created_at 
         FROM servicos 
         WHERE id = ? AND ativo = 1`,
        [id],
        (err, row) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao buscar serviço'
                });
            }

            if (!row) {
                return res.status(404).json({
                    success: false,
                    message: 'Serviço não encontrado'
                });
            }

            res.json({
                success: true,
                data: row
            });
        }
    );
});

// POST /api/services - Criar novo serviço (apenas admin)
router.post('/', authenticateToken, requireAdmin, validate(serviceSchema), (req, res) => {
    const { nome, descricao, preco, duracao_minutos } = req.body;

    db.run(
        `INSERT INTO servicos (nome, descricao, preco, duracao_minutos) 
         VALUES (?, ?, ?, ?)`,
        [nome, descricao, preco, duracao_minutos],
        function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao criar serviço'
                });
            }

            res.status(201).json({
                success: true,
                message: 'Serviço criado com sucesso',
                data: {
                    id: this.lastID,
                    nome,
                    descricao,
                    preco,
                    duracao_minutos
                }
            });
        }
    );
});

// PUT /api/services/:id - Atualizar serviço (apenas admin)
router.put('/:id', authenticateToken, requireAdmin, validate(serviceSchema), (req, res) => {
    const { id } = req.params;
    const { nome, descricao, preco, duracao_minutos } = req.body;

    // Verificar se o serviço existe
    db.get(
        'SELECT id FROM servicos WHERE id = ? AND ativo = 1',
        [id],
        (err, service) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao verificar serviço'
                });
            }

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: 'Serviço não encontrado'
                });
            }

            // Atualizar serviço
            db.run(
                `UPDATE servicos 
                 SET nome = ?, descricao = ?, preco = ?, duracao_minutos = ?, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = ?`,
                [nome, descricao, preco, duracao_minutos, id],
                function(err) {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Erro ao atualizar serviço'
                        });
                    }

                    res.json({
                        success: true,
                        message: 'Serviço atualizado com sucesso',
                        data: {
                            id: parseInt(id),
                            nome,
                            descricao,
                            preco,
                            duracao_minutos
                        }
                    });
                }
            );
        }
    );
});

// DELETE /api/services/:id - Desativar serviço (apenas admin)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    // Verificar se o serviço existe
    db.get(
        'SELECT id FROM servicos WHERE id = ? AND ativo = 1',
        [id],
        (err, service) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao verificar serviço'
                });
            }

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: 'Serviço não encontrado'
                });
            }

            // Verificar se há agendamentos futuros para este serviço
            db.get(
                `SELECT COUNT(*) as count 
                 FROM agendamentos 
                 WHERE servico_id = ? AND data_agendamento >= date('now') AND status != 'cancelado'`,
                [id],
                (err, result) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Erro ao verificar agendamentos'
                        });
                    }

                    if (result.count > 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'Não é possível desativar serviço com agendamentos futuros'
                        });
                    }

                    // Desativar serviço
                    db.run(
                        'UPDATE servicos SET ativo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                        [id],
                        function(err) {
                            if (err) {
                                return res.status(500).json({
                                    success: false,
                                    message: 'Erro ao desativar serviço'
                                });
                            }

                            res.json({
                                success: true,
                                message: 'Serviço desativado com sucesso'
                            });
                        }
                    );
                }
            );
        }
    );
});

// GET /api/services/:id/bookings - Buscar agendamentos de um serviço (apenas admin)
router.get('/:id/bookings', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { start_date, end_date, status } = req.query;

    let query = `
        SELECT 
            a.id,
            a.data_agendamento,
            a.hora_agendamento,
            a.status,
            a.observacoes,
            a.created_at,
            u.nome as cliente_nome,
            u.telefone as cliente_telefone,
            b.nome as barbeiro_nome,
            s.nome as servico_nome,
            s.preco
        FROM agendamentos a
        JOIN usuarios u ON a.cliente_id = u.id
        JOIN usuarios b ON a.barbeiro_id = b.id
        JOIN servicos s ON a.servico_id = s.id
        WHERE a.servico_id = ?
    `;

    const params = [id];

    if (start_date) {
        query += ' AND a.data_agendamento >= ?';
        params.push(start_date);
    }

    if (end_date) {
        query += ' AND a.data_agendamento <= ?';
        params.push(end_date);
    }

    if (status) {
        query += ' AND a.status = ?';
        params.push(status);
    }

    query += ' ORDER BY a.data_agendamento, a.hora_agendamento';

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar agendamentos do serviço'
            });
        }

        res.json({
            success: true,
            data: rows
        });
    });
});

module.exports = router;























