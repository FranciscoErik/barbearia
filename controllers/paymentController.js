const { db } = require('../database/init');
const mercadoPagoService = require('../services/mercadoPagoService');

class PaymentController {
    /**
     * Criar pagamento para um agendamento
     */
    async createPayment(req, res) {
        try {
            const { booking_id } = req.body;
            const userId = req.user.id;

            if (!booking_id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do agendamento é obrigatório'
                });
            }

            // Buscar agendamento
            const booking = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT 
                        a.id,
                        a.status,
                        a.data_agendamento,
                        a.hora_agendamento,
                        a.cliente_id,
                        u.nome as cliente_nome,
                        u.email as cliente_email,
                        u.telefone as cliente_telefone,
                        s.nome as servico_nome,
                        s.preco,
                        b.nome as barbeiro_nome
                    FROM agendamentos a
                    JOIN usuarios u ON a.cliente_id = u.id
                    JOIN servicos s ON a.servico_id = s.id
                    JOIN usuarios b ON a.barbeiro_id = b.id
                    WHERE a.id = ? AND a.cliente_id = ?`,
                    [booking_id, userId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Agendamento não encontrado'
                });
            }

            if (booking.status !== 'pendente') {
                return res.status(400).json({
                    success: false,
                    message: `Agendamento já está ${booking.status}. Não é possível criar pagamento.`
                });
            }

            // Criar preferência de pagamento
            // Permitir valor customizado para testes (se fornecido no body)
            const amount = req.body.amount || booking.preco;
            
            // Validar email do pagador (necessário para Mercado Pago)
            const payerEmail = req.body.payer?.email || booking.cliente_email || 'test@test.com';
            if (!payerEmail.includes('@')) {
                return res.status(400).json({
                    success: false,
                    message: 'Email do pagador é obrigatório e deve ser válido'
                });
            }
            
            const preferenceData = {
                amount: amount,
                description: req.body.description || `${booking.servico_nome} - ${booking.barbeiro_nome} - ${booking.data_agendamento} ${booking.hora_agendamento}`,
                external_reference: booking.id.toString(),
                payer: req.body.payer || {
                    name: booking.cliente_nome || 'Test User',
                    email: payerEmail,
                    phone: booking.cliente_telefone || '11999999999'
                },
                notification_url: `${process.env.BASE_URL || 'http://localhost:3000'}/api/payments/webhook`,
                back_urls: req.body.back_urls || {
                    success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/confirmacao`,
                    failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pagamento`,
                    pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pagamento`
                }
            };

            const preference = await mercadoPagoService.createPreference(preferenceData);

            // Salvar ID da preferência no agendamento
            await new Promise((resolve, reject) => {
                db.run(
                    'UPDATE agendamentos SET payment_id = ? WHERE id = ?',
                    [preference.id, booking_id],
                    function(err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            res.json({
                success: true,
                data: {
                    payment_id: preference.id,
                    init_point: preference.init_point,
                    sandbox_init_point: preference.sandbox_init_point,
                    qr_code: preference.qr_code,
                    qr_code_base64: preference.qr_code_base64,
                    booking_id: booking.id
                }
            });
        } catch (error) {
            console.error('Erro ao criar pagamento:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Erro ao criar pagamento'
            });
        }
    }

    /**
     * Criar pagamento Pix
     */
    async createPixPayment(req, res) {
        try {
            const { booking_id } = req.body;
            const userId = req.user.id;

            if (!booking_id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do agendamento é obrigatório'
                });
            }

            // Buscar agendamento
            const booking = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT 
                        a.id,
                        a.status,
                        a.data_agendamento,
                        a.hora_agendamento,
                        a.cliente_id,
                        u.nome as cliente_nome,
                        u.email as cliente_email,
                        u.telefone as cliente_telefone,
                        s.nome as servico_nome,
                        s.preco,
                        b.nome as barbeiro_nome
                    FROM agendamentos a
                    JOIN usuarios u ON a.cliente_id = u.id
                    JOIN servicos s ON a.servico_id = s.id
                    JOIN usuarios b ON a.barbeiro_id = b.id
                    WHERE a.id = ? AND a.cliente_id = ?`,
                    [booking_id, userId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Agendamento não encontrado'
                });
            }

            if (booking.status !== 'pendente') {
                return res.status(400).json({
                    success: false,
                    message: `Agendamento já está ${booking.status}. Não é possível criar pagamento.`
                });
            }

            // Criar pagamento Pix
            const paymentData = {
                amount: booking.preco,
                description: `${booking.servico_nome} - ${booking.barbeiro_nome} - ${booking.data_agendamento} ${booking.hora_agendamento}`,
                external_reference: booking.id.toString(),
                payer: {
                    name: booking.cliente_nome,
                    email: booking.cliente_email,
                    phone: booking.cliente_telefone
                },
                notification_url: `${process.env.BASE_URL || 'http://localhost:3000'}/api/payments/webhook`
            };

            const payment = await mercadoPagoService.createPixPayment(paymentData);

            // Salvar ID do pagamento no agendamento
            await new Promise((resolve, reject) => {
                db.run(
                    'UPDATE agendamentos SET payment_id = ? WHERE id = ?',
                    [payment.id, booking_id],
                    function(err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            res.json({
                success: true,
                data: {
                    payment_id: payment.id,
                    qr_code: payment.qr_code,
                    qr_code_base64: payment.qr_code_base64,
                    ticket_url: payment.ticket_url,
                    status: payment.status,
                    booking_id: booking.id
                }
            });
        } catch (error) {
            console.error('Erro ao criar pagamento Pix:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Erro ao criar pagamento Pix'
            });
        }
    }

    /**
     * Webhook do Mercado Pago
     */
    async handleWebhook(req, res) {
        try {
            // Mercado Pago pode enviar de duas formas:
            // 1. { type: 'payment', data: { id: '123' } }
            // 2. { action: 'payment.updated', data: { id: '123' } }
            
            let paymentId = null;
            
            if (req.body.type === 'payment' && req.body.data?.id) {
                paymentId = req.body.data.id;
            } else if (req.body.action === 'payment.updated' && req.body.data?.id) {
                paymentId = req.body.data.id;
            } else if (req.body.data?.id) {
                paymentId = req.body.data.id;
            } else if (req.query?.data?.id) {
                paymentId = req.query.data.id;
            }
            
            if (!paymentId) {
                console.log('Webhook recebido sem payment_id:', req.body);
                return res.status(200).json({ success: true, message: 'Webhook recebido mas sem payment_id' });
            }
            
            // Buscar informações do pagamento no Mercado Pago
            const paymentInfo = await mercadoPagoService.getPaymentStatus(paymentId);
            
            if (!paymentInfo.external_reference) {
                console.log('Pagamento sem external_reference:', paymentId);
                return res.status(200).json({ success: true, message: 'Pagamento sem external_reference' });
            }

            const bookingId = parseInt(paymentInfo.external_reference);
                
                // Verificar se o pagamento foi aprovado
                if (paymentInfo.status === 'approved') {
                    // Atualizar agendamento para confirmado
                    await new Promise((resolve, reject) => {
                        db.run(
                            'UPDATE agendamentos SET status = ?, payment_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                            ['confirmado', paymentId, bookingId],
                            function(err) {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    });

                    console.log(`✅ Agendamento ${bookingId} confirmado após pagamento ${paymentId}`);
                } else if (paymentInfo.status === 'rejected' || paymentInfo.status === 'cancelled') {
                    // Atualizar agendamento para cancelado
                    await new Promise((resolve, reject) => {
                        db.run(
                            'UPDATE agendamentos SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                            ['cancelado', bookingId],
                            function(err) {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    });

                    console.log(`❌ Agendamento ${bookingId} cancelado - pagamento ${paymentId} rejeitado`);
                }

                return res.status(200).json({ success: true });

            res.status(200).json({ success: true, message: 'Webhook recebido mas não processado' });
        } catch (error) {
            console.error('Erro ao processar webhook:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao processar webhook'
            });
        }
    }

    /**
     * Verificar status do pagamento
     */
    async checkPaymentStatus(req, res) {
        try {
            const { booking_id } = req.params;
            const userId = req.user.id;

            // Buscar agendamento
            const booking = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT id, status, payment_id FROM agendamentos WHERE id = ? AND cliente_id = ?',
                    [booking_id, userId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Agendamento não encontrado'
                });
            }

            if (!booking.payment_id) {
                return res.json({
                    success: true,
                    data: {
                        status: booking.status,
                        payment_id: null,
                        payment_status: null
                    }
                });
            }

            // Verificar status no Mercado Pago
            const paymentInfo = await mercadoPagoService.getPaymentStatus(booking.payment_id);

            // Se o pagamento foi aprovado e o agendamento ainda está pendente, atualizar
            if (paymentInfo.status === 'approved' && booking.status === 'pendente') {
                await new Promise((resolve, reject) => {
                    db.run(
                        'UPDATE agendamentos SET status = ? WHERE id = ?',
                        ['confirmado', booking_id],
                        function(err) {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            }

            res.json({
                success: true,
                data: {
                    status: paymentInfo.status === 'approved' ? 'confirmado' : booking.status,
                    payment_status: paymentInfo.status,
                    payment_id: booking.payment_id
                }
            });
        } catch (error) {
            console.error('Erro ao verificar status do pagamento:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Erro ao verificar status do pagamento'
            });
        }
    }
}

module.exports = new PaymentController();

