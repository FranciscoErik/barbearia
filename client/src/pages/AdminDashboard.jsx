import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { barberService } from '../services/barberService';
import api from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingBarber, setCreatingBarber] = useState(false);
  
  const [newBarber, setNewBarber] = useState({
    nome: '',
    email: '',
    telefone: '',
    password: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, barbersRes] = await Promise.all([
        dashboardService.getStats(),
        barberService.getBarbers()
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (barbersRes.success) setBarbers(barbersRes.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBarber = async (e) => {
    e.preventDefault();
    setCreatingBarber(true);

    try {
      const response = await api.post('/barbers', newBarber);
      if (response.data.success) {
        alert('Barbeiro criado com sucesso!');
        setNewBarber({ nome: '', email: '', telefone: '', password: '' });
        loadData();
      } else {
        alert(response.data.message || 'Erro ao criar barbeiro');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao criar barbeiro');
    } finally {
      setCreatingBarber(false);
    }
  };

  const handleToggleBarber = async (barberId, currentStatus) => {
    try {
      const response = await api.put(`/barbers/${barberId}/toggle-status`);
      if (response.data.success) {
        loadData();
      }
    } catch (err) {
      alert('Erro ao atualizar status do barbeiro');
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  const activeBarbers = barbers.filter(b => b.ativo !== 0);

  return (
    <div className="admin-dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="page-title">
            <img src="/logo.png" alt="Logo" className="header-logo" />
            Painel Admin
          </h1>
          <div className="header-user">
            <span>Administrador</span>
          </div>
        </div>

        <div className="dashboard-section">
          <h2 className="section-title">Visão Geral</h2>
          
          <div className="stats-grid">
            <div className="stat-card">
              <h3>TOTAL DE AGENDAMENTOS</h3>
              <p className="stat-value">{stats?.totalBookings || 0}</p>
              <p className="stat-subtitle">Todos os status</p>
            </div>
            <div className="stat-card">
              <h3>CONFIRMADOS</h3>
              <p className="stat-value">{stats?.confirmedBookings || 0}</p>
              <p className="stat-subtitle">Confirmados ou concluídos</p>
            </div>
            <div className="stat-card">
              <h3>PENDENTES</h3>
              <p className="stat-value">{stats?.pendingBookings || 0}</p>
              <p className="stat-subtitle">Aguardando ação</p>
            </div>
            <div className="stat-card">
              <h3>FATURAMENTO TOTAL</h3>
              <p className="stat-value">R$ {Number(stats?.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="stat-subtitle">Baseado em serviços confirmados</p>
            </div>
            <div className="stat-card small">
              <h3>HOJE</h3>
              <p className="stat-value">{stats?.todayBookings || 0}</p>
              <p className="stat-subtitle">Receita hoje: R$ {Number(stats?.todayRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <div className="admin-content-grid">
          {/* Coluna Esquerda - Criar Barbeiro */}
          <div className="admin-left-column">
            <div className="create-barber-section">
              <h3>Criar novo barbeiro</h3>
              <p className="section-description">Gere usuários de teste rapidamente para validar o fluxo.</p>
              
              <form onSubmit={handleCreateBarber} className="barber-form">
                <div className="form-group">
                  <label>Nome completo</label>
                  <input
                    type="text"
                    value={newBarber.nome}
                    onChange={(e) => setNewBarber({ ...newBarber, nome: e.target.value })}
                    placeholder="Ex.: Lucas Ferreira"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>E-mail</label>
                  <input
                    type="email"
                    value={newBarber.email}
                    onChange={(e) => setNewBarber({ ...newBarber, email: e.target.value })}
                    placeholder="erik@barbearia.com"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Telefone</label>
                  <input
                    type="tel"
                    value={newBarber.telefone}
                    onChange={(e) => setNewBarber({ ...newBarber, telefone: e.target.value })}
                    placeholder="(11) 99999-0000"
                  />
                </div>
                
                <div className="form-group">
                  <label>Senha</label>
                  <input
                    type="password"
                    value={newBarber.password}
                    onChange={(e) => setNewBarber({ ...newBarber, password: e.target.value })}
                    placeholder="••••••"
                    required
                    minLength={6}
                  />
                </div>
                
                <button type="submit" className="btn-register-barber" disabled={creatingBarber}>
                  <i className="fas fa-user"></i> Registrar Barbeiro
                </button>
              </form>
            </div>
          </div>

          {/* Coluna Direita - Barbeiros Ativos */}
          <div className="admin-right-column">
            <div className="active-barbers-section">
              <h3>Barbeiros ativos</h3>
              
              <div className="barbers-list">
                {activeBarbers.length === 0 ? (
                  <div className="empty-state">Nenhum barbeiro ativo</div>
                ) : (
                  activeBarbers.map(barber => (
                    <div key={barber.id} className="barber-item">
                      <div className="barber-info">
                        <div className="barber-name">{barber.nome}</div>
                        <div className="barber-email">{barber.email}</div>
                      </div>
                      <button
                        className="btn-deactivate"
                        onClick={() => handleToggleBarber(barber.id, barber.ativo)}
                      >
                        Desativar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
