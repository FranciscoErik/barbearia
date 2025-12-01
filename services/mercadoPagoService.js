const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');

class MercadoPagoService {
    constructor() {
        // Inicializar com Access Token do Mercado Pago
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        
        if (!accessToken) {
            console.warn('⚠️  MERCADOPAGO_ACCESS_TOKEN não configurado. Pagamentos não funcionarão.');
        }
        
        this.client = accessToken ? new MercadoPagoConfig({ 
            accessToken: accessToken,
            options: {
                timeout: 5000,
                idempotencyKey: 'abc'
            }
        }) : null;
        
        this.payment = this.client ? new Payment(this.client) : null;
        this.preference = this.client ? new Preference(this.client) : null;
    }

    /**
     * Criar preferência de pagamento (Pix ou Cartão)
     * @param {Object} data - Dados do pagamento
     * @param {number} data.amount - Valor do pagamento
     * @param {string} data.description - Descrição do pagamento
     * @param {string} data.external_reference - ID do agendamento
     * @param {Object} data.payer - Dados do pagador
     * @param {string} data.back_urls - URLs de retorno
     * @returns {Promise<Object>} Preferência criada
     */
    async createPreference(data) {
        if (!this.preference) {
            throw new Error('Mercado Pago não configurado. Configure MERCADOPAGO_ACCESS_TOKEN');
        }

        try {
            const defaultFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const successUrl = data.back_urls?.success || `${defaultFrontendUrl}/confirmacao.html`;
            const failureUrl = data.back_urls?.failure || `${defaultFrontendUrl}/agendamento.html`;
            const pendingUrl = data.back_urls?.pending || `${defaultFrontendUrl}/agendamento.html`;

            // Garantir que o valor seja pelo menos 0.50 (valor mínimo do Mercado Pago)
            const amount = Math.max(parseFloat(data.amount), 0.50);
            
            const preferenceData = {
                items: [
                    {
                        title: data.description,
                        quantity: 1,
                        unit_price: amount,
                        currency_id: 'BRL'
                    }
                ],
                payer: {
                    name: data.payer.name || 'Test User',
                    email: data.payer.email || 'test@test.com',
                    phone: {
                        area_code: data.payer.phone?.substring(0, 2) || '11',
                        number: data.payer.phone?.substring(2) || '999999999'
                    }
                },
                external_reference: data.external_reference,
                notification_url: data.notification_url || `${process.env.BASE_URL || 'http://localhost:3000'}/api/payments/webhook`,
                back_urls: {
                    success: successUrl,
                    failure: failureUrl,
                    pending: pendingUrl
                },
                payment_methods: {
                    excluded_payment_types: [],
                    excluded_payment_methods: [],
                    installments: 12
                },
                statement_descriptor: 'BARBEARIA',
                // Configurações adicionais para sandbox
                binary_mode: false,
                expires: false
            };

            if (successUrl && successUrl.startsWith('https://')) {
                preferenceData.auto_return = 'approved';
            } else {
                console.warn('⚠️  auto_return desativado: back_urls.success precisa ser HTTPS para evitar erro do Mercado Pago.');
            }

            const preference = await this.preference.create({ body: preferenceData });
            
            // Usar sandbox_init_point se disponível (ambiente de teste)
            const initPoint = preference.sandbox_init_point || preference.init_point;
            
            if (!initPoint) {
                throw new Error('URL de checkout não foi retornada pelo Mercado Pago');
            }
            
            console.log('✅ Preferência criada:', {
                id: preference.id,
                amount: amount,
                init_point: initPoint
            });
            
            return {
                id: preference.id,
                init_point: initPoint,
                sandbox_init_point: preference.sandbox_init_point,
                qr_code: preference.qr_code,
                qr_code_base64: preference.qr_code_base64
            };
        } catch (error) {
            console.error('❌ Erro ao criar preferência no Mercado Pago:', error);
            console.error('Detalhes do erro:', {
                message: error.message,
                status: error.status,
                cause: error.cause
            });
            throw new Error(`Erro ao criar pagamento: ${error.message || 'Erro desconhecido'}`);
        }
    }

    /**
     * Criar pagamento Pix
     * @param {Object} data - Dados do pagamento
     * @returns {Promise<Object>} Dados do pagamento Pix
     */
    async createPixPayment(data) {
        if (!this.payment) {
            throw new Error('Mercado Pago não configurado');
        }

        try {
            // Garantir que o valor seja pelo menos 0.50 (valor mínimo do Mercado Pago)
            const amount = Math.max(parseFloat(data.amount), 0.50);
            
            const paymentData = {
                transaction_amount: amount,
                description: data.description,
                payment_method_id: 'pix',
                payer: {
                    email: data.payer.email || 'test@test.com',
                    first_name: data.payer.name?.split(' ')[0] || 'Test',
                    last_name: data.payer.name?.split(' ').slice(1).join(' ') || 'User',
                },
                external_reference: data.external_reference,
                notification_url: data.notification_url || `${process.env.BASE_URL || 'http://localhost:3000'}/api/payments/webhook`
            };

            const payment = await this.payment.create({ body: paymentData });
            
            return {
                id: payment.id,
                status: payment.status,
                status_detail: payment.status_detail,
                qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
                qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
                ticket_url: payment.point_of_interaction?.transaction_data?.ticket_url
            };
        } catch (error) {
            console.error('Erro ao criar pagamento Pix:', error);
            throw new Error(`Erro ao criar pagamento Pix: ${error.message}`);
        }
    }

    /**
     * Verificar status do pagamento
     * @param {string} paymentId - ID do pagamento
     * @returns {Promise<Object>} Status do pagamento
     */
    async getPaymentStatus(paymentId) {
        if (!this.payment) {
            throw new Error('Mercado Pago não configurado');
        }

        try {
            const payment = await this.payment.get({ id: paymentId });
            
            return {
                id: payment.id,
                status: payment.status,
                status_detail: payment.status_detail,
                external_reference: payment.external_reference
            };
        } catch (error) {
            console.error('Erro ao verificar status do pagamento:', error);
            throw new Error(`Erro ao verificar pagamento: ${error.message}`);
        }
    }

    /**
     * Processar webhook do Mercado Pago
     * @param {Object} data - Dados do webhook
     * @returns {Object} Dados processados
     */
    processWebhook(data) {
        const { type, data: webhookData } = data;
        
        if (type === 'payment') {
            const payment = webhookData;
            
            return {
                payment_id: payment.id,
                status: payment.status,
                status_detail: payment.status_detail,
                external_reference: payment.external_reference,
                transaction_amount: payment.transaction_amount,
                date_approved: payment.date_approved
            };
        }
        
        return null;
    }
}

module.exports = new MercadoPagoService();

