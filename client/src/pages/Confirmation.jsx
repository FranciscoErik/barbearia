import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './Confirmation.css';

const Confirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(location.state?.booking || null);

  useEffect(() => {
    // Se não veio pelo state, tentar pegar do localStorage (retorno do Mercado Pago)
    if (!booking) {
      const pendingBooking = localStorage.getItem('pendingBooking');
      if (pendingBooking) {
        try {
          const parsedBooking = JSON.parse(pendingBooking);
          setBooking(parsedBooking);
          // Limpar do localStorage após usar
          localStorage.removeItem('pendingBooking');
        } catch (e) {
          console.error('Erro ao recuperar booking:', e);
          navigate('/');
        }
      } else {
        navigate('/');
      }
    }
  }, [booking, navigate]);

  if (!booking) {
    return (
      <div className="confirmation-page">
        <div className="container">
          <div className="confirmation-card">
            <p>Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <div className="container">
        <div className="confirmation-card">
          <div className="success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h1>Agendamento Confirmado!</h1>
          <p className="confirmation-message">
            Seu agendamento foi realizado com sucesso. Você receberá uma confirmação em breve.
          </p>

          <div className="booking-details">
            <h2>Detalhes do Agendamento</h2>
            <div className="detail-item">
              <i className="fas fa-calendar"></i>
              <span>Data: {new Date(booking.data_agendamento).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="detail-item">
              <i className="fas fa-clock"></i>
              <span>Horário: {booking.hora_agendamento}</span>
            </div>
            {booking.barbeiro_nome && (
              <div className="detail-item">
                <i className="fas fa-user"></i>
                <span>Barbeiro: {booking.barbeiro_nome}</span>
              </div>
            )}
            {booking.servico_nome && (
              <div className="detail-item">
                <i className="fas fa-cut"></i>
                <span>Serviço: {booking.servico_nome}</span>
              </div>
            )}
            <div className="detail-item">
              <i className="fas fa-info-circle"></i>
              <span>Status: {booking.status}</span>
            </div>
          </div>

          <div className="confirmation-actions">
            <Link to="/historico" className="btn-primary">
              Ver Meus Agendamentos
            </Link>
            <Link to="/agendamento" className="btn-secondary">
              Fazer Novo Agendamento
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;

