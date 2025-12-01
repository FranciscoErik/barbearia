import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { paymentService } from '../services/paymentService';
import './Payment.css';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const booking = location.state?.booking;
  const [loading, setLoading] = useState(false);
  const [loadingPix, setLoadingPix] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [pixQrCode, setPixQrCode] = useState(null);
  const [pixCopyPaste, setPixCopyPaste] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const checkIntervalRef = useRef(null);

  if (!booking) {
    navigate('/');
    return null;
  }

  const handleCardPayment = async () => {
    setLoading(true);
    setError('');
    setPaymentMethod('card');

    try {
      // Permitir valor de teste (R$ 1,00) - pode ser alterado aqui para testes
      // Nota: Mercado Pago aceita valores a partir de R$ 0,50, mas R$ 1,00 funciona melhor
      const testAmount = 1.00; // Valor para teste
      const amount = testAmount || Number(booking.preco || booking.servico?.preco || 0);
      
      const result = await paymentService.createPayment(booking.id, {
        description: `${booking.servico_nome || booking.servico?.nome || 'Serviço'} - ${booking.barbeiro_nome || booking.barbeiro?.nome || 'Barbeiro'}`,
        amount: amount,
        payer: {
          name: user?.nome || 'Cliente',
          email: user?.email || '',
          phone: user?.telefone || ''
        },
        back_urls: {
          success: `${window.location.origin}/confirmacao`,
          failure: `${window.location.origin}/pagamento`,
          pending: `${window.location.origin}/pagamento`
        }
      });

      if (result.success && result.data?.init_point) {
        // Salvar dados do booking no localStorage antes de redirecionar
        localStorage.setItem('pendingBooking', JSON.stringify({
          ...booking,
          status: 'confirmado'
        }));
        // Redirecionar para o checkout do Mercado Pago
        window.location.href = result.data.init_point;
      } else {
        setError(result.message || 'Erro ao criar pagamento');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handlePixPayment = async () => {
    setLoadingPix(true);
    setError('');
    setPaymentMethod('pix');

    try {
      // Permitir valor de teste (R$ 1,00) - pode ser alterado aqui para testes
      const testAmount = 1.00; // Valor para teste
      const amount = testAmount || Number(booking.preco || booking.servico?.preco || 0);
      
      const result = await paymentService.createPixPayment(booking.id, { amount });

      if (result.success && result.data) {
        setPixQrCode(result.data.qr_code_base64 || result.data.qr_code);
        setPixCopyPaste(result.data.qr_code || result.data.copy_paste);
        // Iniciar verificação automática de status
        startPaymentStatusCheck();
      } else {
        setError(result.message || 'Erro ao criar pagamento Pix');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao processar pagamento Pix');
    } finally {
      setLoadingPix(false);
    }
  };

  // Verificar status do pagamento
  const checkPaymentStatus = async () => {
    if (!booking?.id || isCheckingStatus) return;
    
    setIsCheckingStatus(true);
    try {
      const result = await paymentService.getPaymentStatus(booking.id);
      
      if (result.success && result.data) {
        const paymentStatusValue = result.data.payment_status;
        const bookingStatus = result.data.status;
        
        setPaymentStatus(paymentStatusValue);
        
        // Se pagamento aprovado ou agendamento confirmado, redirecionar
        if (paymentStatusValue === 'approved' || bookingStatus === 'confirmado') {
          stopPaymentStatusCheck();
          // Atualizar booking com status confirmado
          const updatedBooking = { ...booking, status: 'confirmado' };
          navigate('/confirmacao', { state: { booking: updatedBooking, paymentStatus: 'approved' } });
        }
      }
    } catch (err) {
      console.error('Erro ao verificar status:', err);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Iniciar verificação automática de status
  const startPaymentStatusCheck = () => {
    // Verificar imediatamente
    checkPaymentStatus();
    
    // Verificar a cada 3 segundos
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }
    
    checkIntervalRef.current = setInterval(() => {
      checkPaymentStatus();
    }, 3000);
  };

  // Parar verificação automática
  const stopPaymentStatusCheck = () => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  };

  // Limpar intervalo ao desmontar componente
  useEffect(() => {
    return () => {
      stopPaymentStatusCheck();
    };
  }, []);

  const handleSkipPayment = () => {
    navigate('/confirmacao', { state: { booking } });
  };

  return (
    <div className="payment-page">
      <div className="container">
        <div className="payment-card">
          <h1>Pagamento</h1>
          
          {/* Aviso de modo de teste */}
          <div style={{ 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffc107', 
            borderRadius: '8px', 
            padding: '12px', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <i className="fas fa-info-circle" style={{ color: '#856404', fontSize: '20px' }}></i>
            <div>
              <strong style={{ color: '#856404' }}>Modo de Teste Ativo</strong>
              <p style={{ margin: '5px 0 0 0', color: '#856404', fontSize: '14px' }}>
                Os pagamentos serão processados com valor de <strong>R$ 1,00</strong> para facilitar os testes.
              </p>
            </div>
          </div>
          
          <div className="booking-summary">
            <h2>Resumo do Agendamento</h2>
            <div className="summary-item">
              <span><i className="fas fa-cut"></i> Serviço:</span>
              <span>{booking.servico_nome || booking.servico?.nome || 'Serviço'}</span>
            </div>
            {booking.barbeiro_nome && (
              <div className="summary-item">
                <span><i className="fas fa-user"></i> Barbeiro:</span>
                <span>{booking.barbeiro_nome || booking.barbeiro?.nome}</span>
              </div>
            )}
            <div className="summary-item">
              <span><i className="fas fa-calendar"></i> Data:</span>
              <span>{new Date(booking.data_agendamento).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="summary-item">
              <span><i className="fas fa-clock"></i> Horário:</span>
              <span>{booking.hora_agendamento}</span>
            </div>
            <div className="summary-item total">
              <span><i className="fas fa-dollar-sign"></i> Total:</span>
              <span>R$ {(paymentMethod === 'pix' || paymentMethod === 'card' ? 1.00 : Number(booking.preco || booking.servico?.preco || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              {(paymentMethod === 'pix' || paymentMethod === 'card') && (
                <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>
                  (Valor de teste: R$ 1,00)
                </small>
              )}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Opções de Pagamento */}
          {!paymentMethod && (
            <div className="payment-methods">
              <h2>Escolha a forma de pagamento</h2>
              <div className="payment-options">
                <button
                  className="payment-option-card"
                  onClick={handleCardPayment}
                  disabled={loading || loadingPix}
                >
                  <i className="fas fa-credit-card"></i>
                  <div>
                    <h3>Cartão de Crédito/Débito</h3>
                    <p>Pague com cartão via Mercado Pago</p>
                  </div>
                  {loading && <span className="loading-spinner"></span>}
                </button>

                <button
                  className="payment-option-pix"
                  onClick={handlePixPayment}
                  disabled={loading || loadingPix}
                >
                  <i className="fas fa-qrcode"></i>
                  <div>
                    <h3>Pix</h3>
                    <p>Pague instantaneamente com Pix</p>
                  </div>
                  {loadingPix && <span className="loading-spinner"></span>}
                </button>
              </div>
            </div>
          )}

          {/* QR Code Pix */}
          {paymentMethod === 'pix' && pixQrCode && (
            <div className="pix-payment">
              <h2>Pagamento via Pix</h2>
              <div className="pix-instructions">
                <p>Escaneie o QR Code com o app do seu banco ou copie o código Pix</p>
              </div>
              
              {pixQrCode && (
                <div className="pix-qr-code">
                  <img 
                    src={`data:image/png;base64,${pixQrCode}`} 
                    alt="QR Code Pix" 
                    onError={(e) => {
                      // Se não for base64, tenta como URL
                      e.target.src = pixQrCode;
                    }}
                  />
                </div>
              )}

              {pixCopyPaste && (
                <div className="pix-copy-paste">
                  <label>Código Pix (Copiar e Colar):</label>
                  <div className="copy-input">
                    <input 
                      type="text" 
                      value={pixCopyPaste} 
                      readOnly 
                      id="pix-code"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pixCopyPaste);
                        alert('Código Pix copiado!');
                      }}
                      className="btn-copy"
                    >
                      <i className="fas fa-copy"></i> Copiar
                    </button>
                  </div>
                </div>
              )}

              <div className="pix-status">
                {paymentStatus === 'pending' && (
                  <div className="status-message pending">
                    <i className="fas fa-clock"></i>
                    <p>Aguardando confirmação do pagamento...</p>
                    <p className="status-note">Verificando automaticamente a cada 3 segundos</p>
                  </div>
                )}
                {paymentStatus === 'approved' && (
                  <div className="status-message success">
                    <i className="fas fa-check-circle"></i>
                    <p>Pagamento aprovado! Redirecionando...</p>
                  </div>
                )}
                {!paymentStatus && (
                  <div>
                    <p><i className="fas fa-info-circle"></i> Após o pagamento, o status será atualizado automaticamente</p>
                    <button
                      className="btn-check-status"
                      onClick={checkPaymentStatus}
                      disabled={isCheckingStatus}
                    >
                      {isCheckingStatus ? 'Verificando...' : 'Verificar Status do Pagamento'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botão Voltar */}
          {paymentMethod && (
            <button
              className="btn-back-payment"
              onClick={() => {
                setPaymentMethod(null);
                setPixQrCode(null);
                setPixCopyPaste(null);
              }}
            >
              <i className="fas fa-arrow-left"></i> Voltar
            </button>
          )}

          {/* Botão Pagar Depois */}
          {!paymentMethod && (
            <div className="payment-actions">
              <button
                className="btn-skip"
                onClick={handleSkipPayment}
              >
                Pagar Depois
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payment;
