import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-page">
      <div className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Bem-vindo à Barbearia</h1>
          <p className="hero-subtitle">
            Agende seu horário de forma rápida e fácil. Cortes modernos e estilosos para você!
          </p>
          <div className="hero-buttons">
            {isAuthenticated && user?.tipo === 'cliente' ? (
              <Link to="/agendamento" className="btn-primary">
                <i className="fas fa-calendar-plus"></i> Agendar Agora
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-primary">
                  <i className="fas fa-sign-in-alt"></i> Fazer Login
                </Link>
                <Link to="/register" className="btn-secondary">
                  <i className="fas fa-user-plus"></i> Criar Conta
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <section className="features">
        <div className="container">
          <h2 className="section-title">Por que escolher nossa barbearia?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <i className="fas fa-clock"></i>
              <h3>Horários Flexíveis</h3>
              <p>Agende no horário que melhor se encaixa na sua rotina</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-cut"></i>
              <h3>Profissionais Qualificados</h3>
              <p>Nossos barbeiros são experientes e atualizados nas tendências</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-star"></i>
              <h3>Alta Qualidade</h3>
              <p>Serviços de excelência com produtos de primeira linha</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-shield-alt"></i>
              <h3>Ambiente Seguro</h3>
              <p>Protocolos de higiene e segurança para seu bem-estar</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;




