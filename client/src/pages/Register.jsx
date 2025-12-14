import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...userData } = formData;
      const result = await register(userData);

      if (result?.success) {
        navigate('/agendamento');
      } else {
        setError(result?.message || 'Erro ao registrar');
      }
    } catch (err) {
      setError('Erro ao registrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-card">
          <div className="register-header">
            <div className="logo">
              <img src="/logo.png" alt="Logo Barbearia" className="logo-img" />
              <h1>BARBEARIA</h1>
            </div>
            <h2>Cadastro</h2>
            <p>Crie sua conta para agendar horários</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="nome">NOME COMPLETO</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                className="input-default"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">EMAIL</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-highlight"
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefone">TELEFONE</label>
              <input
                type="tel"
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className="input-default"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">SENHA</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="input-highlight"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">CONFIRMAR SENHA</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="input-default"
              />
            </div>

            <button type="submit" className="btn-register" disabled={loading}>
              {loading ? 'CADASTRANDO...' : 'CADASTRAR'}
            </button>

            {/* BOTÕES ABAIXO DO CADASTRAR */}
            <div className="register-footer-buttons">
              <Link to="/" className="btn-footer-home">
                <i className="fas fa-home"></i> Home
              </Link>

              <Link to="/login" className="btn-footer-login">
                <i className="fas fa-sign-in-alt"></i> Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
