import { Link } from "react-router-dom";
import { useMemo, useRef, useState, useEffect } from "react";
import "./SimulationBooking.css";

const MOCK_BARBERS = [
  { id: 1, nome: "João (Clássico)" },
  { id: 2, nome: "Marcos (Degradê)" },
  { id: 3, nome: "Rafa (Barba & Navalha)" },
];

const MOCK_SERVICES = [
  { id: 1, nome: "Corte Masculino", preco: 35, duracao_minutos: 30 },
  { id: 2, nome: "Corte + Barba", preco: 55, duracao_minutos: 60 },
  { id: 3, nome: "Barba", preco: 30, duracao_minutos: 30 },
];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISODate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function isSameDay(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function buildTimeSlots() {
  const slots = [];
  let h = 9;
  let m = 0;

  while (h < 18 || (h === 18 && m === 0)) {
    slots.push(`${pad2(h)}:${pad2(m)}`);
    m += 30;
    if (m >= 60) {
      m = 0;
      h++;
    }
  }

  return slots;
}

function getMonthMatrix(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startWeekday = firstDay.getDay(); // 0..6 (Dom..Sáb)
  const totalDays = lastDay.getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= totalDays; day++) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export default function SimulationBooking() {
  const [barberId, setBarberId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeStr, setTimeStr] = useState("");

  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarWrapRef = useRef(null);

  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const times = useMemo(() => buildTimeSlots(), []);
  const weeks = useMemo(() => getMonthMatrix(viewMonth), [viewMonth]);
  const today = useMemo(() => startOfDay(new Date()), []);

  const barber = useMemo(
    () => MOCK_BARBERS.find((b) => String(b.id) === String(barberId)),
    [barberId]
  );

  const service = useMemo(
    () => MOCK_SERVICES.find((s) => String(s.id) === String(serviceId)),
    [serviceId]
  );

  const monthLabel = useMemo(() => {
    return viewMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }, [viewMonth]);

  const selectedDateStr = useMemo(() => (selectedDate ? toISODate(selectedDate) : ""), [selectedDate]);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return "";
    return selectedDate.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, [selectedDate]);

  const canPreview = barber && service && selectedDate && timeStr;

  const goPrevMonth = () => {
    const d = new Date(viewMonth);
    d.setMonth(d.getMonth() - 1);
    setViewMonth(d);
  };

  const goNextMonth = () => {
    const d = new Date(viewMonth);
    d.setMonth(d.getMonth() + 1);
    setViewMonth(d);
  };

  const handlePickDay = (d) => {
    if (!d) return;
    const day = startOfDay(d);
    if (day < today) return;
    setSelectedDate(day);
    setTimeStr("");
  };

  // Fecha calendário ao clicar fora
  useEffect(() => {
    function onDocMouseDown(e) {
      if (!calendarOpen) return;
      if (!calendarWrapRef.current) return;
      if (!calendarWrapRef.current.contains(e.target)) setCalendarOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [calendarOpen]);

  return (
    <div className="sim-page">
      <div className="sim-container">
        <div className="sim-header">
          <h1>Simular Agendamento</h1>
          <p>Escolha barbeiro, serviço, data e horário para ver a prévia (sem salvar no sistema).</p>
        </div>

        <div className="sim-grid">
          <div className="sim-card">
            <h3>1) Barbeiro</h3>
            <select value={barberId} onChange={(e) => setBarberId(e.target.value)}>
              <option value="">Selecione...</option>
              {MOCK_BARBERS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="sim-card">
            <h3>2) Serviço</h3>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              <option value="">Selecione...</option>
              {MOCK_SERVICES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} — R$ {Number(s.preco).toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="sim-calendar-wrap">
          <div className="sim-card calendar-trigger-card" ref={calendarWrapRef}>
            <h3>3) Data</h3>

            <button
              type="button"
              className="calendar-trigger"
              onClick={() => setCalendarOpen((v) => !v)}
            >
              <span className={`calendar-trigger-text ${selectedDate ? "selected" : ""}`}>
                {selectedDate ? selectedDateLabel : "Clique para selecionar uma data"}
              </span>
              <i className={`fas fa-calendar-alt ${calendarOpen ? "open" : ""}`} />
            </button>

            {calendarOpen && (
              <div className="calendar-popover" role="dialog" aria-label="Selecionar data">
                <div className="calendar-card">
                  <div className="calendar-head">
                    <button className="cal-nav" type="button" onClick={goPrevMonth} aria-label="Mês anterior">
                      <i className="fas fa-chevron-left" />
                    </button>

                    <div className="cal-title">
                      <strong style={{ textTransform: "capitalize" }}>{monthLabel}</strong>
                      <span className="cal-subtitle">
                        {selectedDate ? `Selecionado: ${selectedDateStr}` : "Selecione um dia"}
                      </span>
                    </div>

                    <button className="cal-nav" type="button" onClick={goNextMonth} aria-label="Próximo mês">
                      <i className="fas fa-chevron-right" />
                    </button>
                  </div>

                  <div className="cal-weekdays">
                    <span>Dom</span>
                    <span>Seg</span>
                    <span>Ter</span>
                    <span>Qua</span>
                    <span>Qui</span>
                    <span>Sex</span>
                    <span>Sáb</span>
                  </div>

                  <div className="cal-grid">
                    {weeks.flat().map((d, idx) => {
                      const disabled = !d || startOfDay(d) < today;
                      const isToday = d && isSameDay(startOfDay(d), today);
                      const isSelected = d && selectedDate && isSameDay(d, selectedDate);

                      return (
                        <button
                          key={idx}
                          type="button"
                          className={[
                            "cal-day",
                            disabled ? "disabled" : "",
                            isToday ? "today" : "",
                            isSelected ? "selected" : "",
                          ].join(" ")}
                          disabled={disabled}
                          onClick={() => {
                            handlePickDay(d);
                            setCalendarOpen(false);
                          }}
                        >
                          {d ? d.getDate() : ""}
                        </button>
                      );
                    })}
                  </div>

                  <div className="cal-hint">
                    <span>
                      <span className="hint-dot today-dot" /> Hoje
                    </span>
                    <span>
                      <span className="hint-dot selected-dot" /> Selecionado
                    </span>
                    <span>
                      <span className="hint-dot disabled-dot" /> Passado
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="sim-card time-card">
            <h3>4) Horário</h3>

            {!selectedDate ? (
              <div className="time-empty">Selecione uma data primeiro.</div>
            ) : (
              <div className="time-grid">
                {times.map((t) => (
                  <button
                    type="button"
                    key={t}
                    className={["time-btn", timeStr === t ? "selected" : ""].join(" ")}
                    onClick={() => setTimeStr(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sim-preview">
          <h2>Prévia</h2>

          {!canPreview ? (
            <div className="sim-preview-empty">
              Selecione barbeiro, serviço, data e horário para ver a simulação.
            </div>
          ) : (
            <div className="sim-preview-box">
              <div className="sim-row">
                <span>Barbeiro</span>
                <strong>{barber?.nome}</strong>
              </div>
              <div className="sim-row">
                <span>Serviço</span>
                <strong>
                  {service?.nome} — R$ {Number(service?.preco).toFixed(2)}
                </strong>
              </div>
              <div className="sim-row">
                <span>Duração</span>
                <strong>{service?.duracao_minutos} min</strong>
              </div>
              <div className="sim-row">
                <span>Data</span>
                <strong>{selectedDateLabel}</strong>
              </div>
              <div className="sim-row">
                <span>Horário</span>
                <strong>{timeStr}</strong>
              </div>

              <div className="sim-actions">
                <Link className="btn-primary" to="/login">
                  Fazer login para confirmar
                </Link>
                <Link className="btn-secondary" to="/">
                  Voltar para Home
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="sim-footnote">
          * Isso é apenas uma simulação (não cria agendamento). Para agendar de verdade, faça login.
        </div>
      </div>
    </div>
  );
}
