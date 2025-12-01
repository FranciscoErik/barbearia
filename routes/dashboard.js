const express = require('express');
const { db } = require('../database/init');
const { authenticateToken, requireBarber, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats - Estatísticas gerais
router.get('/stats', authenticateToken, async (req, res) => {
    const { start_date, end_date } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role || req.user.tipo;

    const filters = [];
    const params = [];

    if (userRole === 'barbeiro') {
        filters.push('a.barbeiro_id = ?');
        params.push(userId);
    } else if (userRole === 'cliente') {
        filters.push('a.cliente_id = ?');
        params.push(userId);
    }

    if (start_date) {
        filters.push('a.data_agendamento >= ?');
        params.push(start_date);
    }

    if (end_date) {
        filters.push('a.data_agendamento <= ?');
        params.push(end_date);
    }

    const baseWhereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const withExtraFilter = (extraCondition) => {
        if (!extraCondition) return baseWhereClause;
        return baseWhereClause
            ? `${baseWhereClause} AND ${extraCondition}`
            : `WHERE ${extraCondition}`;
    };

    const runQuery = (query) => new Promise((resolve, reject) => {
        db.get(query, [...params], (err, row) => {
            if (err) return reject(err);
            resolve(row ? row.total : 0);
        });
    });

    const queries = {
        totalBookings: `
            SELECT COUNT(*) as total
            FROM agendamentos a
            ${baseWhereClause}
        `,
        todayBookings: `
            SELECT COUNT(*) as total
            FROM agendamentos a
            ${withExtraFilter(`a.data_agendamento = date('now')`)}
        `,
        confirmedBookings: `
            SELECT COUNT(*) as total
            FROM agendamentos a
            ${withExtraFilter(`a.status = 'confirmado'`)}
        `,
        pendingBookings: `
            SELECT COUNT(*) as total
            FROM agendamentos a
            ${withExtraFilter(`a.status = 'pendente'`)}
        `,
        totalRevenue: `
            SELECT COALESCE(SUM(s.preco), 0) as total
            FROM agendamentos a
            JOIN servicos s ON a.servico_id = s.id
            ${withExtraFilter(`a.status IN ('confirmado', 'concluido')`)}
        `,
        todayRevenue: `
            SELECT COALESCE(SUM(s.preco), 0) as total
            FROM agendamentos a
            JOIN servicos s ON a.servico_id = s.id
            ${withExtraFilter(`a.data_agendamento = date('now') AND a.status IN ('confirmado', 'concluido')`)}
        `
    };

    try {
        const results = await Promise.all(
            Object.entries(queries).map(async ([key, query]) => ({
                key,
                value: await runQuery(query)
            }))
        );

        const stats = results.reduce((acc, { key, value }) => {
            acc[key] = value;
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                totalBookings: stats.totalBookings,
                todayBookings: stats.todayBookings,
                confirmedBookings: stats.confirmedBookings,
                pendingBookings: stats.pendingBookings,
                totalRevenue: stats.totalRevenue,
                todayRevenue: stats.todayRevenue
            }
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas do dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar estatísticas'
        });
    }
});

// GET /api/dashboard/recent-bookings - Agendamentos recentes
router.get('/recent-bookings', authenticateToken, (req, res) => {
    const { limit = 10 } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role || req.user.tipo;

    let whereClause = '';
    let params = [];

    if (userRole === 'barbeiro') {
        whereClause = 'WHERE a.barbeiro_id = ?';
        params.push(userId);
    } else if (userRole === 'cliente') {
        whereClause = 'WHERE a.cliente_id = ?';
        params.push(userId);
    }

    params.push(parseInt(limit));

    const query = `
        SELECT 
            a.id,
            a.data_agendamento,
            a.hora_agendamento,
            a.status,
            u.nome as cliente_nome,
            b.nome as barbeiro_nome,
            s.nome as servico_nome,
            s.preco
        FROM agendamentos a
        JOIN usuarios u ON a.cliente_id = u.id
        JOIN usuarios b ON a.barbeiro_id = b.id
        JOIN servicos s ON a.servico_id = s.id
        ${whereClause}
        ORDER BY a.data_agendamento DESC, a.hora_agendamento DESC
        LIMIT ?
    `;

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar agendamentos recentes'
            });
        }

        res.json({
            success: true,
            data: rows
        });
    });
});

// GET /api/dashboard/calendar/:year/:month - Dados do calendário
router.get('/calendar/:year/:month', authenticateToken, (req, res) => {
    const { year, month } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role || req.user.tipo;

    let whereClause = '';
    let params = [];

    if (userRole === 'barbeiro') {
        whereClause = 'WHERE a.barbeiro_id = ?';
        params.push(userId);
    } else if (userRole === 'cliente') {
        whereClause = 'WHERE a.cliente_id = ?';
        params.push(userId);
    }

    whereClause += whereClause ? ' AND' : 'WHERE';
    whereClause += ` strftime('%Y', a.data_agendamento) = ? AND strftime('%m', a.data_agendamento) = ?`;
    params.push(year, month.padStart(2, '0'));

    const query = `
        SELECT 
            a.data_agendamento,
            COUNT(*) as total_bookings,
            GROUP_CONCAT(a.status) as statuses
        FROM agendamentos a
        ${whereClause}
        GROUP BY a.data_agendamento
        ORDER BY a.data_agendamento
    `;

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar dados do calendário'
            });
        }

        // Processar dados para o calendário
        const calendarData = {};
        rows.forEach(row => {
            const date = row.data_agendamento;
            const statuses = row.statuses.split(',');
            
            calendarData[date] = {
                totalBookings: row.total_bookings,
                hasConfirmed: statuses.includes('confirmado'),
                hasPending: statuses.includes('pendente'),
                hasCancelled: statuses.includes('cancelado')
            };
        });

        res.json({
            success: true,
            data: calendarData
        });
    });
});

// GET /api/dashboard/services-popularity - Serviços mais populares
router.get('/services-popularity', authenticateToken, requireAdmin, (req, res) => {
    const { start_date, end_date, limit = 10 } = req.query;

    let whereClause = 'WHERE a.status != "cancelado"';
    let params = [];

    if (start_date) {
        whereClause += ' AND a.data_agendamento >= ?';
        params.push(start_date);
    }

    if (end_date) {
        whereClause += ' AND a.data_agendamento <= ?';
        params.push(end_date);
    }

    params.push(parseInt(limit));

    const query = `
        SELECT 
            s.id,
            s.nome,
            s.preco,
            COUNT(a.id) as total_agendamentos,
            COALESCE(SUM(s.preco), 0) as receita_total
        FROM servicos s
        LEFT JOIN agendamentos a ON s.id = a.servico_id AND a.status != 'cancelado'
        ${whereClause}
        GROUP BY s.id, s.nome, s.preco
        ORDER BY total_agendamentos DESC
        LIMIT ?
    `;

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar popularidade dos serviços'
            });
        }

        res.json({
            success: true,
            data: rows
        });
    });
});

// GET /api/dashboard/barbers-performance - Performance dos barbeiros
router.get('/barbers-performance', authenticateToken, requireAdmin, (req, res) => {
    const { start_date, end_date } = req.query;

    let bookingConditions = [];
    let params = [];

    // Condições para agendamentos
    bookingConditions.push("a.status != 'cancelado'");
    
    if (start_date) {
        bookingConditions.push('a.data_agendamento >= ?');
        params.push(start_date);
    }

    if (end_date) {
        bookingConditions.push('a.data_agendamento <= ?');
        params.push(end_date);
    }

    // Construir a condição para o LEFT JOIN
    const bookingJoinConditions = bookingConditions.length > 0 
        ? `AND ${bookingConditions.join(' AND ')}`
        : '';

    const query = `
        SELECT 
            b.id,
            b.nome,
            COUNT(CASE WHEN a.id IS NOT NULL THEN 1 END) as total_agendamentos,
            COUNT(CASE WHEN a.status = 'confirmado' THEN 1 END) as agendamentos_confirmados,
            COUNT(CASE WHEN a.status = 'concluido' THEN 1 END) as agendamentos_concluidos,
            COALESCE(SUM(CASE WHEN a.status != 'cancelado' THEN s.preco ELSE 0 END), 0) as receita_total
        FROM usuarios b
        LEFT JOIN agendamentos a ON b.id = a.barbeiro_id ${bookingJoinConditions}
        LEFT JOIN servicos s ON a.servico_id = s.id AND a.status != 'cancelado'
        WHERE b.tipo = 'barbeiro' AND b.ativo = 1
        GROUP BY b.id, b.nome
        ORDER BY total_agendamentos DESC
    `;

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar performance dos barbeiros'
            });
        }

        res.json({
            success: true,
            data: rows
        });
    });
});

// GET /api/dashboard/monthly-revenue - Receita mensal
router.get('/monthly-revenue', authenticateToken, requireAdmin, (req, res) => {
    const { year = new Date().getFullYear() } = req.query;

    const query = `
        SELECT 
            strftime('%m', a.data_agendamento) as month,
            COUNT(a.id) as total_agendamentos,
            COALESCE(SUM(s.preco), 0) as receita
        FROM agendamentos a
        JOIN servicos s ON a.servico_id = s.id
        WHERE strftime('%Y', a.data_agendamento) = ? 
        AND a.status IN ('confirmado', 'concluido')
        GROUP BY strftime('%m', a.data_agendamento)
        ORDER BY month
    `;

    db.all(query, [year], (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar receita mensal'
            });
        }

        // Preencher meses sem dados com zero
        const monthlyData = {};
        for (let i = 1; i <= 12; i++) {
            const month = i.toString().padStart(2, '0');
            monthlyData[month] = {
                month: month,
                total_agendamentos: 0,
                receita: 0
            };
        }

        rows.forEach(row => {
            monthlyData[row.month] = {
                month: row.month,
                total_agendamentos: row.total_agendamentos,
                receita: row.receita
            };
        });

        res.json({
            success: true,
            data: Object.values(monthlyData)
        });
    });
});

module.exports = router;























