import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="nav-container">
        <Link to="/" className="logo">
          <img src="/logo.png" alt="Logo Barbearia" className="logo-img" />
          <h1>BARBEARIA</h1>
        </Link>
        
        <nav className="nav-buttons">
          {isAuthenticated ? (
            <>
              {user?.tipo === 'cliente' && (
                <>
                  <Link to="/agendamento" className="btn-nav">
                    <i className="fas fa-calendar-plus"></i> Agendar
                  </Link>
                  <Link to="/historico" className="btn-nav">
                    <i className="fas fa-history"></i> Histórico
                  </Link>
                </>
              )}
              <span className="user-name">Olá, {user?.nome}</span>
              <button onClick={handleLogout} className="btn-nav">
                <i className="fas fa-sign-out-alt"></i> Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-nav">
                <i className="fas fa-sign-in-alt"></i> Login
              </Link>
              <Link to="/register" className="btn-nav">
                <i className="fas fa-user-plus"></i> Registrar
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;

