const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database/init');
const { authenticateToken, requireBarber, requireAdmin, isAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// POST /api/barbers - Criar novo barbeiro (apenas ADMIN)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    const { nome, email, password, telefone } = req.body;

    if (!nome || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Nome, email e senha são obrigatórios'
        });
    }

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
        const hashedPassword = await bcrypt.hash(password, 10);

        // Inserir novo barbeiro
        const result = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO usuarios (nome, email, senha, telefone, tipo) 
                 VALUES (?, ?, ?, ?, ?)`,
                [nome, email, hashedPassword, telefone || null, 'barbeiro'],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });

        // Buscar dados do barbeiro criado
        const newBarber = await new Promise((resolve, reject) => {
            db.get(
                'SELECT id, nome, email, telefone, tipo, created_at FROM usuarios WHERE id = ?',
                [result.id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        res.status(201).json({
            success: true,
            message: 'Barbeiro criado com sucesso',
            data: newBarber
        });

    } catch (error) {
        console.error('Erro ao criar barbeiro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// GET /api/barbers - Listar todos os barbeiros
router.get('/', authenticateToken, (req, res) => {
    // Se for admin, retornar todos os barbeiros (ativos e inativos)
    // Se não for admin, retornar apenas os ativos
    const userRole = req.user?.role || req.user?.tipo;
    const showAll = userRole === 'admin';
    
    const query = showAll
        ? `SELECT id, nome, email, telefone, ativo, created_at 
           FROM usuarios 
           WHERE tipo = 'barbeiro' 
           ORDER BY nome`
        : `SELECT id, nome, email, telefone, ativo, created_at 
           FROM usuarios 
           WHERE tipo = 'barbeiro' AND ativo = 1 
           ORDER BY nome`;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar barbeiros'
            });
        }

        // Garantir que ativo seja retornado como número (0 ou 1)
        const formattedRows = rows.map(row => ({
            ...row,
            ativo: row.ativo === 1 || row.ativo === true || row.ativo === '1' ? 1 : 0
        }));

        res.json({
            success: true,
            data: formattedRows
        });
    });
});

// PUT /api/barbers/:id/toggle-status - Ativar/Desativar barbeiro (apenas admin)
// IMPORTANTE: Esta rota deve vir ANTES de /:id para evitar conflito
router.put('/:id/toggle-status', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    console.log('Toggle status - Barbeiro ID:', id);
    console.log('User:', req.user);

    // Verificar se o barbeiro existe
    db.get(
        'SELECT id, nome, ativo FROM usuarios WHERE id = ? AND tipo = "barbeiro"',
        [id],
        (err, barber) => {
            if (err) {
                console.error('Erro ao buscar barbeiro:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao verificar barbeiro'
                });
            }

            if (!barber) {
                console.log('Barbeiro não encontrado');
                return res.status(404).json({
                    success: false,
                    message: 'Barbeiro não encontrado'
                });
            }

            console.log('Barbeiro encontrado:', barber);
            console.log('Status atual (tipo):', typeof barber.ativo, 'valor:', barber.ativo);

            // Alternar status (ativo <-> inativo)
            // SQLite retorna 0 ou 1 como número, garantir conversão correta
            const currentStatus = barber.ativo === 1 || barber.ativo === true || barber.ativo === '1';
            const newStatus = currentStatus ? 0 : 1;

            console.log('Status atual (boolean):', currentStatus);
            console.log('Novo status:', newStatus);

            db.run(
                'UPDATE usuarios SET ativo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newStatus, id],
                function(err) {
                    if (err) {
                        console.error('Erro ao atualizar:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Erro ao atualizar status do barbeiro'
                        });
                    }

                    console.log('Status atualizado com sucesso. Linhas afetadas:', this.changes);

                    res.json({
                        success: true,
                        message: `Barbeiro ${newStatus ? 'ativado' : 'desativado'} com sucesso`,
                        data: {
                            id: barber.id,
                            nome: barber.nome,
                            ativo: newStatus
                        }
                    });
                }
            );
        }
    );
});

// GET /api/barbers/:id - Buscar barbeiro específico
router.get('/:id', (req, res) => {
    const { id } = req.params;

    db.get(
        `SELECT id, nome, email, telefone, created_at 
         FROM usuarios 
         WHERE id = ? AND tipo = 'barbeiro' AND ativo = 1`,
        [id],
        (err, row) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao buscar barbeiro'
                });
            }

            if (!row) {
                return res.status(404).json({
                    success: false,
                    message: 'Barbeiro não encontrado'
                });
            }

            res.json({
                success: true,
                data: row
            });
        }
    );
});

// GET /api/barbers/:id/schedule - Buscar horários de funcionamento do barbeiro
router.get('/:id/schedule', (req, res) => {
    const { id } = req.params;

    db.all(
        `SELECT dia_semana, hora_inicio, hora_fim 
         FROM horarios_funcionamento 
         WHERE barbeiro_id = ? AND ativo = 1 
         ORDER BY dia_semana, hora_inicio`,
        [id],
        (err, rows) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao buscar horários'
                });
            }

            res.json({
                success: true,
                data: rows
            });
        }
    );
});

// GET /api/barbers/:id/availability/:date - Buscar disponibilidade do barbeiro em uma data
router.get('/:id/availability/:date', (req, res) => {
    const { id, date } = req.params;

    // Validar formato da data (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
            success: false,
            message: 'Formato de data inválido. Use YYYY-MM-DD'
        });
    }

    // Buscar horários de funcionamento do barbeiro
    db.all(
        `SELECT dia_semana, hora_inicio, hora_fim 
         FROM horarios_funcionamento 
         WHERE barbeiro_id = ? AND ativo = 1`,
        [id],
        (err, scheduleRows) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao buscar horários de funcionamento'
                });
            }

            // Calcular dia da semana (0 = domingo, 1 = segunda, etc.)
            const dayOfWeek = new Date(date).getDay();

            // Encontrar horário de funcionamento para o dia
            const daySchedule = scheduleRows.find(row => row.dia_semana === dayOfWeek);

            if (!daySchedule) {
                return res.json({
                    success: true,
                    data: {
                        available: false,
                        message: 'Barbeiro não trabalha neste dia'
                    }
                });
            }

            // Buscar agendamentos já existentes para a data (incluindo pendentes)
            db.all(
                `SELECT hora_agendamento, s.duracao_minutos 
                 FROM agendamentos a 
                 JOIN servicos s ON a.servico_id = s.id 
                 WHERE a.barbeiro_id = ? AND a.data_agendamento = ? AND a.status IN ('pendente', 'confirmado') 
                 ORDER BY hora_agendamento`,
                [id, date],
                (err, bookingRows) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Erro ao buscar agendamentos'
                        });
                    }

                    // Gerar slots de horários disponíveis
                    const availableSlots = generateTimeSlots(
                        daySchedule.hora_inicio,
                        daySchedule.hora_fim,
                        bookingRows
                    );

                    res.json({
                        success: true,
                        data: {
                            available: true,
                            date: date,
                            workingHours: {
                                start: daySchedule.hora_inicio,
                                end: daySchedule.hora_fim
                            },
                            availableSlots: availableSlots
                        }
                    });
                }
            );
        }
    );
});

// Função auxiliar para gerar slots de horários disponíveis
function generateTimeSlots(startTime, endTime, existingBookings) {
    const slots = [];
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    const slotDuration = 30; // 30 minutos por slot

    // Converter agendamentos existentes para minutos
    const bookedSlots = existingBookings.map(booking => {
        const startMin = timeToMinutes(booking.hora_agendamento);
        const duration = booking.duracao_minutos || 30;
        return {
            start: startMin,
            end: startMin + duration
        };
    });

    // Gerar slots de 30 em 30 minutos
    for (let time = start; time < end; time += slotDuration) {
        const timeStr = minutesToTime(time);
        
        // Verificar se o slot não conflita com agendamentos existentes
        const isAvailable = !bookedSlots.some(booked => 
            time < booked.end && time + slotDuration > booked.start
        );

        if (isAvailable) {
            slots.push({
                time: timeStr,
                available: true
            });
        } else {
            slots.push({
                time: timeStr,
                available: false
            });
        }
    }

    return slots;
}

// Função auxiliar para converter tempo para minutos
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Função auxiliar para converter minutos para tempo
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// PUT /api/barbers/:id/schedule - Atualizar horários de funcionamento (apenas admin)
router.put('/:id/schedule', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { schedule } = req.body;

    if (!Array.isArray(schedule)) {
        return res.status(400).json({
            success: false,
            message: 'Horários devem ser enviados como array'
        });
    }

    // Verificar se o barbeiro existe
    db.get(
        'SELECT id FROM usuarios WHERE id = ? AND tipo = "barbeiro" AND ativo = 1',
        [id],
        (err, barber) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao verificar barbeiro'
                });
            }

            if (!barber) {
                return res.status(404).json({
                    success: false,
                    message: 'Barbeiro não encontrado'
                });
            }

            // Desativar horários existentes
            db.run(
                'UPDATE horarios_funcionamento SET ativo = 0 WHERE barbeiro_id = ?',
                [id],
                (err) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Erro ao atualizar horários'
                        });
                    }

                    // Inserir novos horários
                    let completed = 0;
                    let hasError = false;

                    if (schedule.length === 0) {
                        return res.json({
                            success: true,
                            message: 'Horários atualizados com sucesso'
                        });
                    }

                    schedule.forEach((daySchedule) => {
                        db.run(
                            `INSERT INTO horarios_funcionamento (barbeiro_id, dia_semana, hora_inicio, hora_fim) 
                             VALUES (?, ?, ?, ?)`,
                            [id, daySchedule.dia_semana, daySchedule.hora_inicio, daySchedule.hora_fim],
                            (err) => {
                                if (err && !hasError) {
                                    hasError = true;
                                    return res.status(500).json({
                                        success: false,
                                        message: 'Erro ao inserir horários'
                                    });
                                }

                                completed++;
                                if (completed === schedule.length && !hasError) {
                                    res.json({
                                        success: true,
                                        message: 'Horários atualizados com sucesso'
                                    });
                                }
                            }
                        );
                    });
                }
            );
        }
    );
});

module.exports = router;























