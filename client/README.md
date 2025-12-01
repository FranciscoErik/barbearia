# Frontend React - Sistema de Agendamento Barbearia

## 🚀 Como Executar

### 1. Instalar Dependências

```bash
cd client
npm install
```

### 2. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

O frontend estará disponível em: `http://localhost:5173`

### 3. Executar Backend e Frontend Juntos

Na raiz do projeto:

```bash
npm run dev:all
```

Isso iniciará tanto o backend (porta 3000) quanto o frontend (porta 5173).

## 📁 Estrutura do Projeto

```
client/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   │   ├── Header.jsx
│   │   └── ProtectedRoute.jsx
│   ├── contexts/        # Context API
│   │   └── AuthContext.jsx
│   ├── pages/          # Páginas da aplicação
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Booking.jsx
│   │   ├── BookingHistory.jsx
│   │   ├── BarberDashboard.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── Confirmation.jsx
│   │   └── Payment.jsx
│   ├── services/       # Serviços de API
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── barberService.js
│   │   ├── bookingService.js
│   │   ├── dashboardService.js
│   │   ├── paymentService.js
│   │   └── serviceService.js
│   ├── App.jsx         # Componente principal
│   └── main.jsx        # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## 🔧 Tecnologias Utilizadas

- React 19.2.0
- React Router DOM 7.9.6
- Axios 1.13.2
- Vite 7.2.4

## 📝 Notas Importantes

1. O frontend está configurado para usar proxy no Vite, então todas as requisições para `/api` são redirecionadas para `http://localhost:3000/api`

2. A autenticação usa JWT tokens armazenados no localStorage

3. O sistema suporta três tipos de usuários:
   - Cliente: pode agendar e ver histórico
   - Barbeiro: pode ver e gerenciar agendamentos
   - Admin: acesso total ao sistema

## ✅ Funcionalidades Implementadas

- ✅ Autenticação (Login/Registro)
- ✅ Agendamento de serviços
- ✅ Histórico de agendamentos
- ✅ Dashboard do Barbeiro
- ✅ Dashboard do Admin
- ✅ Confirmação de agendamento
- ✅ Interface responsiva
- ✅ Proteção de rotas por role




