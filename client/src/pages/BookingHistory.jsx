import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { bookingService } from '../services/bookingService';
import './BookingHistory.css';

const BookingHistory = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const result = await bookingService.getBookings({
        cliente_id: user?.id
      });
      if (result.success) {
        // A API retorna os dados já formatados
        const bookingsData = Array.isArray(result.data) ? result.data : (result.data?.bookings || []);
        setBookings(bookingsData);
      }
    } catch (err) {
      setError('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Deseja realmente cancelar este agendamento?')) return;
    
    try {
      const result = await bookingService.cancelBooking(id);
      if (result.success) {
        loadBookings();
      }
    } catch (err) {
      alert('Erro ao cancelar agendamento');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pendente: { class: 'status-pending', label: 'Pendente' },
      confirmado: { class: 'status-confirmed', label: 'Confirmado' },
      cancelado: { class: 'status-cancelled', label: 'Cancelado' },
      concluido: { class: 'status-completed', label: 'Concluído' }
    };
    return statusMap[status] || { class: '', label: status };
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="booking-history-page">
      <div className="container">
        <h1 className="page-title">Meus Agendamentos</h1>
        
        {error && <div className="error-message">{error}</div>}

        {bookings.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-calendar-times"></i>
            <p>Você ainda não possui agendamentos</p>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map(booking => {
              const status = getStatusBadge(booking.status);
              return (
                <div key={booking.id} className="booking-card">
                  <div className="booking-header">
                    <h3>{booking.servico_nome || booking.servico?.nome || 'Serviço'}</h3>
                    <span className={`status-badge ${status.class}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="booking-details">
                    <p><i className="fas fa-calendar"></i> {new Date(booking.data_agendamento).toLocaleDateString('pt-BR')}</p>
                    <p><i className="fas fa-clock"></i> {booking.hora_agendamento}</p>
                    <p><i className="fas fa-user"></i> {booking.barbeiro_nome || booking.barbeiro?.nome || 'Barbeiro'}</p>
                    {booking.preco && (
                      <p><i className="fas fa-dollar-sign"></i> R$ {Number(booking.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    )}
                  </div>
                  {booking.status === 'pendente' && (
                    <button
                      className="btn-cancel"
                      onClick={() => handleCancel(booking.id)}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;

