import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { barberService } from '../services/barberService';
import { serviceService } from '../services/serviceService';
import { bookingService } from '../services/bookingService';
import './Booking.css';

const Booking = () => {
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedBarber && selectedDate) {
      loadAvailability();
    }
  }, [selectedBarber, selectedDate]);

  const loadData = async () => {
    try {
      const [barbersRes, servicesRes] = await Promise.all([
        barberService.getBarbers(),
        serviceService.getServices()
      ]);
      if (barbersRes.success) setBarbers(barbersRes.data);
      if (servicesRes.data) {
        // Remover duplicatas baseado no ID e no nome (garantir apenas um de cada)
        const uniqueServices = [];
        const seenIds = new Set();
        const seenNames = new Set();
        
        servicesRes.data.forEach(service => {
          // Verificar se já vimos este ID ou este nome
          if (!seenIds.has(service.id) && !seenNames.has(service.nome?.toLowerCase())) {
            seenIds.add(service.id);
            seenNames.add(service.nome?.toLowerCase());
            uniqueServices.push(service);
          }
        });
        
        setServices(uniqueServices);
      }
    } catch (err) {
      setError('Erro ao carregar dados');
    }
  };

  const loadAvailability = async () => {
    if (!selectedDate) return;
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const result = await barberService.getAvailability(selectedBarber.id, dateStr);
      if (result.success) {
        setAvailability(result.data);
      }
    } catch (err) {
      console.error('Erro ao carregar disponibilidade:', err);
    }
  };

  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      days.push({
        date: date,
        dayName: dayNames[date.getDay()],
        day: date.getDate(),
        month: date.getMonth() + 1
      });
    }
    return days;
  };

  const handleDateSelect = async (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    // Carregar disponibilidade automaticamente se barbeiro estiver selecionado
    if (selectedBarber) {
      try {
        const dateStr = date.toISOString().split('T')[0];
        const result = await barberService.getAvailability(selectedBarber.id, dateStr);
        if (result.success) {
          setAvailability(result.data);
        }
      } catch (err) {
        console.error('Erro ao carregar disponibilidade:', err);
      }
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleSubmit = async () => {
    if (!selectedBarber || !selectedService || !selectedDate || !selectedTime) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const timeStr = selectedTime;
      
      const result = await bookingService.createBooking({
        barbeiro_id: selectedBarber.id,
        servico_id: selectedService.id,
        data_agendamento: dateStr,
        hora_agendamento: timeStr
      });

      if (result.success) {
        const bookingResult = await bookingService.getBooking(result.data.id);
        const bookingData = bookingResult.success ? bookingResult.data : result.data;
        
        const fullBookingData = {
          ...bookingData,
          servico: selectedService,
          servico_nome: selectedService.nome,
          preco: selectedService.preco,
          barbeiro: selectedBarber,
          barbeiro_nome: selectedBarber.nome
        };
        
        navigate('/pagamento', { 
          state: { 
            booking: fullBookingData
          } 
        });
      } else {
        setError(result.message || 'Erro ao criar agendamento');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableSlots = () => {
    if (!availability?.availableSlots) return [];
    return availability.availableSlots.filter(slot => slot.available);
  };

  const getTimeSlots = () => {
    if (!availability?.workingHours) return [];
    const slots = [];
    const [startHour, startMin] = availability.workingHours.start.split(':').map(Number);
    const [endHour, endMin] = availability.workingHours.end.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMin = startMin;
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      const available = getAvailableSlots().some(slot => slot.time === timeStr);
      slots.push({ time: timeStr, available });
      
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }
    
    return slots;
  };

  return (
    <div className="booking-page">
      <div className="booking-container">
        {/* Painel Esquerdo */}
        <div className="booking-left-panel">
          <div className="panel-section">
            <div className="logo-section">
              <img src="/logo.png" alt="Logo" className="logo-small" />
              <span className="logo-text">BARBEARIA</span>
            </div>
          </div>

          <div className="panel-section">
            <h3 className="section-title">Selecionar Barbeiro</h3>
            <div className="barber-select">
              <select 
                value={selectedBarber?.id || ''} 
                onChange={(e) => {
                  const barber = barbers.find(b => b.id === parseInt(e.target.value));
                  setSelectedBarber(barber);
                  setSelectedDate(null);
                  setSelectedTime(null);
                }}
                className="barber-dropdown"
              >
                <option value="">Selecione um barbeiro</option>
                {barbers.map(barber => (
                  <option key={barber.id} value={barber.id}>{barber.nome}</option>
                ))}
              </select>
              <i className="fas fa-user"></i>
            </div>
          </div>

          <div className="panel-section">
            <h3 className="section-title">Preços</h3>
            <div className="services-list">
              {services.map(service => (
                <div
                  key={service.id}
                  className={`service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
                  onClick={() => setSelectedService(service)}
                >
                  <div className="service-name">{service.nome}</div>
                  <div className="service-price">
                    R$ {Number(service.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="service-duration">({Math.floor(service.duracao_minutos / 60)}h {service.duracao_minutos % 60 > 0 ? `${service.duracao_minutos % 60} min` : ''})</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <h3 className="section-title">Semana</h3>
            <div className="week-grid">
              {getWeekDays().map((day, idx) => (
                <button
                  key={idx}
                  className={`week-day ${selectedDate && selectedDate.toDateString() === day.date.toDateString() ? 'selected' : ''}`}
                  onClick={() => handleDateSelect(day.date)}
                >
                  {day.dayName} {day.day}/{day.month}
                </button>
              ))}
            </div>
            {!selectedBarber && (
              <p className="helper-text">Selecione um barbeiro para ver os horários disponíveis</p>
            )}
            {selectedBarber && !selectedDate && (
              <p className="helper-text">Selecione um dia da semana para ver os horários</p>
            )}
          </div>
        </div>

        {/* Painel Direito */}
        <div className="booking-right-panel">
          {/* Mostrar horários quando barbeiro e data estiverem selecionados */}
          {selectedBarber && selectedDate ? (
            <>
              {getTimeSlots().length > 0 ? (
                <div className="time-slots-section">
                  <h3>Horários Disponíveis - {selectedDate.toLocaleDateString('pt-BR')}</h3>
                  <div className="time-slots-grid">
                    {getTimeSlots().map((slot, idx) => (
                      <button
                        key={idx}
                        className={`time-slot-btn ${slot.available ? 'available' : 'unavailable'} ${selectedTime === slot.time ? 'selected' : ''}`}
                        onClick={() => slot.available && handleTimeSelect(slot.time)}
                        disabled={!slot.available}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <i className="fas fa-clock"></i>
                  <p>Carregando horários disponíveis...</p>
                </div>
              )}

              {/* Detalhes do agendamento quando horário estiver selecionado */}
              {selectedTime && (
                <div className="booking-details">
                  <h3>Detalhes do Agendamento</h3>
                  {selectedBarber && (
                    <div className="detail-item">
                      <strong>Barbeiro:</strong> {selectedBarber.nome}
                    </div>
                  )}
                  {selectedService && (
                    <div className="detail-item">
                      <strong>Serviço:</strong> {selectedService.nome} - R$ {Number(selectedService.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}
                  {selectedDate && (
                    <div className="detail-item">
                      <strong>Data:</strong> {selectedDate.toLocaleDateString('pt-BR')}
                    </div>
                  )}
                  {selectedTime && (
                    <div className="detail-item">
                      <strong>Horário:</strong> {selectedTime}
                    </div>
                  )}
                  <button
                    className="btn-confirm"
                    onClick={handleSubmit}
                    disabled={loading || !selectedBarber || !selectedService || !selectedDate || !selectedTime}
                  >
                    {loading ? 'Confirmando...' : 'Confirmar Agendamento'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <i className="fas fa-calendar-times"></i>
              <p>Selecione um barbeiro e um dia da semana para ver os horários disponíveis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;
