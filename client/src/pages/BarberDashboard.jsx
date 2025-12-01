import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { bookingService } from '../services/bookingService';
import './BarberDashboard.css';

const BarberDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      const statsRes = await dashboardService.getStats();
      if (statsRes.success) setStats(statsRes.data);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const result = await bookingService.getBookings({
        barbeiro_id: user?.id,
        data_inicio: selectedDate,
        data_fim: selectedDate
      });
      if (result.success) {
        setBookings(result.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const result = await bookingService.updateStatus(id, status);
      if (result.success) {
        loadBookings();
        loadData();
      }
    } catch (err) {
      alert('Erro ao atualizar status');
    }
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Dias vazios no início
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getWeekStats = async () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    try {
      const result = await bookingService.getBookings({
        barbeiro_id: user?.id,
        data_inicio: weekStart.toISOString().split('T')[0],
        data_fim: weekEnd.toISOString().split('T')[0]
      });
      return result.success ? (result.data || []).length : 0;
    } catch (err) {
      return 0;
    }
  };

  const [weekBookings, setWeekBookings] = useState(0);

  useEffect(() => {
    const fetchWeekStats = async () => {
      const count = await getWeekStats();
      setWeekBookings(count);
    };
    fetchWeekStats();
  }, []);

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="barber-dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="page-title">
            <img src="/logo.png" alt="Logo" className="header-logo" />
            Painel do Barbeiro
          </h1>
          <div className="header-user">
            <span>{user?.nome}</span>
          </div>
        </div>

        <div className="dashboard-section">
          <h2 className="section-title">Dashboard</h2>
          <p className="section-subtitle">Bem-vindo ao painel de controle</p>
          
          <div className="stats-grid">
            <div className="stat-card blue">
              <i className="fas fa-calendar-day"></i>
              <h3>Agendamentos Hoje</h3>
              <p className="stat-value">{stats?.todayBookings || 0}</p>
            </div>
            <div className="stat-card green">
              <i className="fas fa-calendar-week"></i>
              <h3>Esta Semana</h3>
              <p className="stat-value">{weekBookings}</p>
            </div>
            <div className="stat-card yellow">
              <i className="fas fa-users"></i>
              <h3>Total de Clientes</h3>
              <p className="stat-value">0</p>
            </div>
            <div className="stat-card purple">
              <i className="fas fa-dollar-sign"></i>
              <h3>Faturamento Hoje</h3>
              <p className="stat-value">R$ {Number(stats?.todayRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Agendamentos do Dia</h2>
            <div className="date-picker-wrapper">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-picker"
              />
              <i className="fas fa-calendar"></i>
            </div>
          </div>

          <div className="bookings-list">
            {bookings.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-calendar-times"></i>
                <p>Nenhum agendamento para esta data</p>
              </div>
            ) : (
              bookings.map(booking => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-header">
                    <h3>{booking.servico_nome || booking.servico?.nome || 'Serviço'}</h3>
                    <span className={`status-badge status-${booking.status}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="booking-info">
                    <p><i className="fas fa-clock"></i> {booking.hora_agendamento}</p>
                    <p><i className="fas fa-user"></i> {booking.cliente_nome || booking.cliente?.nome || 'Cliente'}</p>
                    {booking.observacoes && <p>{booking.observacoes}</p>}
                  </div>
                  <div className="booking-actions">
                    {booking.status === 'pendente' && (
                      <>
                        <button
                          className="btn-confirm"
                          onClick={() => handleStatusUpdate(booking.id, 'confirmado')}
                        >
                          Confirmar
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={() => handleStatusUpdate(booking.id, 'cancelado')}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmado' && (
                      <button
                        className="btn-complete"
                        onClick={() => handleStatusUpdate(booking.id, 'concluido')}
                      >
                        Marcar como Concluído
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Calendário de Agendamentos</h2>
          <div className="calendar-wrapper">
            <div className="calendar-header">
              <button 
                className="calendar-nav"
                onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(newMonth.getMonth() - 1);
                  setCurrentMonth(newMonth);
                }}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <h3>{currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
              <button 
                className="calendar-nav"
                onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(newMonth.getMonth() + 1);
                  setCurrentMonth(newMonth);
                }}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
            <div className="calendar-grid">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="calendar-day-name">{day}</div>
              ))}
              {getCalendarDays().map((day, idx) => (
                <div 
                  key={idx} 
                  className={`calendar-day ${day === null ? 'empty' : ''} ${day === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth() ? 'today' : ''}`}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarberDashboard;
