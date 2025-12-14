import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import SimulationBooking from './pages/SimulationBooking';



// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Booking from './pages/Booking';
import BookingHistory from './pages/BookingHistory';
import BarberDashboard from './pages/BarberDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Confirmation from './pages/Confirmation';
import Payment from './pages/Payment';

import './App.css';

function AppContent() {
  const location = useLocation();
  const hideHeader = location.pathname === '/register' || location.pathname === '/login';

  return (
    <div className="App">
      {!hideHeader && <Header />}
      <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route
                path="/agendamento"
                element={
                  <ProtectedRoute>
                    <Booking />
                  </ProtectedRoute>
                }
              />
              <Route path="/simulacao" element={<SimulationBooking />} />


              
              <Route
                path="/historico"
                element={
                  <ProtectedRoute>
                    <BookingHistory />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/painel-barbeiro"
                element={
                  <ProtectedRoute requiredRole="barbeiro">
                    <BarberDashboard />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/painel-admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/confirmacao"
                element={
                  <ProtectedRoute>
                    <Confirmation />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/pagamento"
                element={
                  <ProtectedRoute>
                    <Payment />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;

