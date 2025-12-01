# 🪒 Sistema de Agendamento para Barbearia - Documentação Completa

## 📋 Visão Geral do Projeto

Sistema Full-Stack completo para gerenciamento de agendamentos em barbearia, desenvolvido com **React** (frontend) e **Node.js/Express** (backend). O sistema permite que clientes agendem horários online, barbeiros gerenciem seus agendamentos e administradores controlem toda a operação através de dashboards interativos.

### Características Principais
- ✅ **SPA (Single Page Application)** com React e React Router
- ✅ **API RESTful** completa com Node.js e Express
- ✅ **Autenticação JWT** com controle de acesso por roles
- ✅ **Banco de dados SQLite** com estrutura relacional
- ✅ **Interface responsiva** e moderna
- ✅ **Integração com Mercado Pago** para pagamentos
- ✅ **Dashboards** com estatísticas em tempo real

---

## 🏗️ Arquitetura do Sistema

### Stack Tecnológica

**Backend:**
- Node.js + Express.js
- SQLite (banco de dados)
- JWT (autenticação)
- bcryptjs (criptografia de senhas)
- Joi (validação de dados)
- Helmet (segurança)
- CORS (Cross-Origin Resource Sharing)
- Mercado Pago SDK (pagamentos)

**Frontend:**
- React 19.2.0
- React Router DOM 7.9.6
- Axios 1.13.2
- Vite 7.2.4 (build tool)
- Context API (gerenciamento de estado)
- CSS Modules (estilização)

### Estrutura de Pastas

```
barbeariau/
├── server.js                 # Servidor principal
├── package.json              # Dependências backend
├── config.env                # Variáveis de ambiente
│
├── routes/                   # Rotas da API
│   ├── auth.js              # Autenticação
│   ├── barbers.js           # Barbeiros
│   ├── bookings.js          # Agendamentos
│   ├── services.js          # Serviços
│   ├── dashboard.js         # Dashboards
│   └── payments.js          # Pagamentos
│
├── middleware/              # Middlewares
│   ├── auth.js             # Autenticação JWT
│   ├── validation.js       # Validação com Joi
│   └── rateLimiter.js      # Rate limiting
│
├── database/                 # Banco de dados
│   ├── init.js             # Inicialização
│   ├── barbearia.db        # Arquivo SQLite
│   └── migrations/         # Migrações
│
├── controllers/             # Controladores
│   └── paymentController.js
│
├── services/                # Serviços
│   └── mercadoPagoService.js
│
└── client/                  # Frontend React
    ├── package.json
    ├── vite.config.js
    │
    └── src/
        ├── main.jsx         # Entry point
        ├── App.jsx          # Componente principal
        │
        ├── pages/           # Páginas
        │   ├── Home.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Booking.jsx
        │   ├── BookingHistory.jsx
        │   ├── BarberDashboard.jsx
        │   ├── AdminDashboard.jsx
        │   ├── Confirmation.jsx
        │   └── Payment.jsx
        │
        ├── components/      # Componentes
        │   ├── Header.jsx
        │   └── ProtectedRoute.jsx
        │
        ├── contexts/        # Context API
        │   └── AuthContext.jsx
        │
        └── services/        # Serviços de API
            ├── api.js
            ├── authService.js
            ├── barberService.js
            ├── bookingService.js
            ├── serviceService.js
            ├── dashboardService.js
            └── paymentService.js
```

---

## 🔐 Sistema de Autenticação

### Como Funciona

1. **Registro/Login**: Usuário se registra ou faz login
2. **Geração de Token**: Backend gera JWT token com informações do usuário
3. **Armazenamento**: Token salvo no `localStorage` do navegador
4. **Interceptors**: Axios adiciona automaticamente o token em todas as requisições
5. **Validação**: Backend valida o token em cada requisição protegida
6. **Controle de Acesso**: Middleware verifica role do usuário (cliente, barbeiro, admin)

### Tipos de Usuário

- **Cliente**: Pode agendar e cancelar seus próprios agendamentos
- **Barbeiro**: Pode ver e gerenciar seus agendamentos, confirmar/cancelar
- **Admin**: Acesso total - criar barbeiros, serviços, ver todas estatísticas

### Endpoints de Autenticação

```
POST /api/auth/register    - Registrar novo usuário
POST /api/auth/login        - Fazer login
GET  /api/auth/me           - Obter dados do usuário logado
GET  /api/auth/verify       - Verificar se token é válido
POST /api/auth/logout       - Fazer logout
```

---

## 🗄️ Banco de Dados

### Estrutura SQLite

**Tabela: usuarios**
- `id` (INTEGER PRIMARY KEY)
- `nome` (TEXT NOT NULL)
- `email` (TEXT UNIQUE NOT NULL)
- `senha` (TEXT NOT NULL) - Hash bcrypt
- `telefone` (TEXT)
- `tipo` (TEXT) - 'cliente', 'barbeiro', 'admin'
- `ativo` (BOOLEAN DEFAULT 1)
- `created_at`, `updated_at` (DATETIME)

**Tabela: servicos**
- `id` (INTEGER PRIMARY KEY)
- `nome` (TEXT NOT NULL)
- `descricao` (TEXT)
- `preco` (DECIMAL 10,2)
- `duracao_minutos` (INTEGER)
- `ativo` (BOOLEAN DEFAULT 1)
- `created_at`, `updated_at` (DATETIME)

**Tabela: agendamentos**
- `id` (INTEGER PRIMARY KEY)
- `cliente_id` (INTEGER) - FK usuarios
- `barbeiro_id` (INTEGER) - FK usuarios
- `servico_id` (INTEGER) - FK servicos
- `data_agendamento` (DATE)
- `hora_agendamento` (TIME)
- `status` (TEXT) - 'pendente', 'confirmado', 'cancelado', 'concluido'
- `observacoes` (TEXT)
- `created_at`, `updated_at` (DATETIME)

**Tabela: horarios_funcionamento**
- `id` (INTEGER PRIMARY KEY)
- `barbeiro_id` (INTEGER) - FK usuarios
- `dia_semana` (INTEGER 0-6) - 0=domingo, 6=sábado
- `hora_inicio` (TIME)
- `hora_fim` (TIME)
- `ativo` (BOOLEAN DEFAULT 1)

**Tabela: disponibilidade**
- `id` (INTEGER PRIMARY KEY)
- `barbeiro_id` (INTEGER) - FK usuarios
- `data` (DATE)
- `hora` (TIME)
- `disponivel` (BOOLEAN DEFAULT 1)

### Dados Iniciais

O sistema cria automaticamente:
- 3 barbeiros de exemplo
- 4 serviços (Corte, Barba, Combo, Sobrancelha)
- Horários de funcionamento padrão (Seg-Sex, 8h-18h)

---

## 🌐 API REST - Endpoints Completos

### Base URL
```
http://localhost:3000/api
```

### Autenticação
Todas as rotas protegidas requerem header:
```
Authorization: Bearer <token_jwt>
```

### 1. Autenticação (`/api/auth`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Registrar novo usuário | ❌ |
| POST | `/api/auth/login` | Fazer login | ❌ |
| GET | `/api/auth/me` | Obter dados do usuário | ✅ |
| GET | `/api/auth/verify` | Verificar token | ✅ |
| POST | `/api/auth/logout` | Fazer logout | ✅ |

**Exemplo de Login:**
```json
POST /api/auth/login
Body: {
  "email": "joao@email.com",
  "password": "123456"
}

Response: {
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@email.com",
      "tipo": "cliente"
    }
  }
}
```

### 2. Barbeiros (`/api/barbers`)

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|------|------|
| GET | `/api/barbers` | Listar barbeiros | ❌ | - |
| GET | `/api/barbers/:id` | Buscar barbeiro | ❌ | - |
| GET | `/api/barbers/:id/schedule` | Horários de funcionamento | ❌ | - |
| GET | `/api/barbers/:id/availability/:date` | Verificar disponibilidade | ❌ | - |
| POST | `/api/barbers` | Criar barbeiro | ✅ | admin |
| PUT | `/api/barbers/:id` | Atualizar barbeiro | ✅ | admin |
| PUT | `/api/barbers/:id/status` | Ativar/Desativar | ✅ | admin |

**Exemplo de Disponibilidade:**
```json
GET /api/barbers/1/availability/2024-01-20

Response: {
  "success": true,
  "data": {
    "available": true,
    "date": "2024-01-20",
    "workingHours": {
      "start": "08:00",
      "end": "18:00"
    },
    "availableSlots": [
      {"time": "08:00", "available": true},
      {"time": "08:30", "available": false},
      {"time": "09:00", "available": true}
    ]
  }
}
```

### 3. Serviços (`/api/services`)

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|------|------|
| GET | `/api/services` | Listar serviços | ❌ | - |
| GET | `/api/services/:id` | Buscar serviço | ❌ | - |
| POST | `/api/services` | Criar serviço | ✅ | admin |
| PUT | `/api/services/:id` | Atualizar serviço | ✅ | admin |
| DELETE | `/api/services/:id` | Desativar serviço | ✅ | admin |

### 4. Agendamentos (`/api/bookings`)

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|------|------|
| GET | `/api/bookings` | Listar agendamentos | ✅ | - |
| GET | `/api/bookings/:id` | Buscar agendamento | ✅ | - |
| POST | `/api/bookings` | Criar agendamento | ✅ | cliente |
| PUT | `/api/bookings/:id/status` | Atualizar status | ✅ | barbeiro/admin |
| DELETE | `/api/bookings/:id` | Cancelar agendamento | ✅ | cliente/barbeiro |

**Query Parameters (GET /api/bookings):**
- `barbeiro_id` - Filtrar por barbeiro
- `cliente_id` - Filtrar por cliente
- `data_inicio` - Data inicial (YYYY-MM-DD)
- `data_fim` - Data final (YYYY-MM-DD)
- `status` - Filtrar por status
- `page` - Página (padrão: 1)
- `limit` - Itens por página (padrão: 20)

**Exemplo de Criar Agendamento:**
```json
POST /api/bookings
Headers: Authorization: Bearer <token>

Body: {
  "barbeiro_id": 1,
  "servico_id": 1,
  "data_agendamento": "2024-01-20",
  "hora_agendamento": "10:00",
  "observacoes": "Corte moderno"
}

Response: {
  "success": true,
  "data": {
    "id": 1,
    "cliente_id": 1,
    "barbeiro_id": 1,
    "servico_id": 1,
    "data_agendamento": "2024-01-20",
    "hora_agendamento": "10:00",
    "status": "pendente"
  }
}
```

**Status do Agendamento:**
- `pendente` - Aguardando confirmação
- `confirmado` - Confirmado pelo barbeiro
- `cancelado` - Cancelado
- `concluido` - Serviço realizado

### 5. Dashboard (`/api/dashboard`)

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|------|------|
| GET | `/api/dashboard/stats` | Estatísticas gerais | ✅ | - |
| GET | `/api/dashboard/recent-bookings` | Agendamentos recentes | ✅ | - |
| GET | `/api/dashboard/today-bookings` | Agendamentos do dia | ✅ | barbeiro |
| GET | `/api/dashboard/barber-performance` | Performance barbeiros | ✅ | admin |
| GET | `/api/dashboard/popular-services` | Serviços populares | ✅ | admin |

**Exemplo de Estatísticas:**
```json
GET /api/dashboard/stats?start_date=2024-01-01&end_date=2024-01-31

Response: {
  "success": true,
  "data": {
    "totalBookings": 150,
    "todayBookings": 5,
    "confirmedBookings": 120,
    "pendingBookings": 10,
    "totalRevenue": 4500.00,
    "todayRevenue": 180.00
  }
}
```

### 6. Pagamentos (`/api/payments`)

| Método | Endpoint | Descrição | Auth | Role |
|--------|----------|-----------|------|------|
| POST | `/api/payments/create` | Criar pagamento | ✅ | cliente |
| POST | `/api/payments/create-pix` | Criar pagamento Pix | ✅ | cliente |
| POST | `/api/payments/webhook` | Webhook Mercado Pago | ❌ | - |
| GET | `/api/payments/status/:booking_id` | Status do pagamento | ✅ | - |

---

## 💻 Frontend React - Como Funciona

### Estrutura de Rotas

```
/                    → Home (pública)
/login               → Login (pública)
/register            → Registro (pública)
/agendamento         → Agendamento (protegida - cliente)
/historico           → Histórico (protegida - cliente)
/painel-barbeiro     → Dashboard Barbeiro (protegida - barbeiro)
/painel-admin        → Dashboard Admin (protegida - admin)
/confirmacao         → Confirmação (protegida)
/pagamento           → Pagamento (protegida)
```

### Fluxo de Autenticação no Frontend

1. **AuthContext** gerencia estado global de autenticação
2. **Login/Register** fazem requisição à API e recebem token
3. **Token salvo** no localStorage
4. **ProtectedRoute** verifica autenticação antes de renderizar
5. **Axios interceptors** adicionam token automaticamente
6. **Logout** limpa token e redireciona

### Componentes Principais

**Header.jsx**
- Navegação dinâmica baseada no role do usuário
- Mostra nome do usuário quando logado
- Botões de login/registro quando não logado

**ProtectedRoute.jsx**
- Verifica se usuário está autenticado
- Verifica se usuário tem role necessária
- Redireciona para login se não autenticado
- Redireciona para dashboard apropriado se role incorreta

**AuthContext.jsx**
- Gerencia estado de autenticação globalmente
- Funções: `login()`, `register()`, `logout()`, `checkAuth()`
- Estado: `user`, `isAuthenticated`, `loading`

### Serviços de API (Frontend)

Todos os serviços usam o cliente axios configurado em `api.js`:

- **authService.js** - Login, registro, verificação
- **barberService.js** - Listar barbeiros, disponibilidade
- **serviceService.js** - Listar serviços
- **bookingService.js** - Criar, listar, atualizar agendamentos
- **dashboardService.js** - Estatísticas e dados do dashboard
- **paymentService.js** - Criar pagamentos

### Exemplo de Uso no Frontend

```javascript
// Em um componente React
import { bookingService } from '../services/bookingService';
import { useAuth } from '../contexts/AuthContext';

function BookingPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    async function loadBookings() {
      const result = await bookingService.getBookings({
        cliente_id: user.id,
        status: 'pendente'
      });
      
      if (result.success) {
        setBookings(result.data);
      }
    }
    
    loadBookings();
  }, [user]);

  // ...
}
```

---

## 🔒 Segurança

### Implementações de Segurança

1. **JWT Tokens**
   - Tokens expiram em 24h
   - Validação em cada requisição protegida
   - Refresh automático no frontend

2. **Criptografia de Senhas**
   - bcryptjs com salt rounds 10
   - Senhas nunca armazenadas em texto plano

3. **Rate Limiting**
   - 100 requisições por 15 minutos (geral)
   - 5 tentativas de login por 15 minutos
   - 3 agendamentos por minuto

4. **Validação de Dados**
   - Joi para validação de schemas
   - Validação em todas as rotas POST/PUT

5. **Headers de Segurança**
   - Helmet.js configurado
   - CSP (Content Security Policy)
   - XSS Protection

6. **CORS**
   - Configurado para aceitar apenas origens permitidas
   - Credenciais habilitadas

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js 16+ instalado
- npm ou yarn

### 1. Instalar Dependências

```bash
# Backend
npm install

# Frontend
cd client
npm install
```

### 2. Configurar Variáveis de Ambiente

Criar arquivo `config.env` na raiz:
```env
PORT=3000
NODE_ENV=development
DB_PATH=./database/barbearia.db
JWT_SECRET=sua_chave_secreta_super_segura_aqui
JWT_EXPIRES_IN=24h
MERCADOPAGO_ACCESS_TOKEN=seu_token_mercadopago
```

### 3. Iniciar Servidores

**Opção 1: Separadamente**
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

**Opção 2: Ambos juntos**
```bash
npm run dev:all
```

### 4. Acessar Aplicação

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **API Docs**: http://localhost:3000/api-docs

---

## 📱 Funcionalidades por Tipo de Usuário

### 👤 Cliente

- ✅ Registrar conta
- ✅ Fazer login
- ✅ Visualizar página inicial
- ✅ Agendar horário (selecionar barbeiro, serviço, data, horário)
- ✅ Ver histórico de agendamentos
- ✅ Cancelar agendamentos próprios
- ✅ Ver confirmação de agendamento
- ✅ Realizar pagamento

### 💇 Barbeiro

- ✅ Fazer login
- ✅ Ver dashboard com estatísticas pessoais
- ✅ Ver agendamentos do dia
- ✅ Filtrar agendamentos por data
- ✅ Confirmar agendamentos
- ✅ Cancelar agendamentos
- ✅ Marcar agendamentos como concluídos
- ✅ Ver detalhes completos de cada agendamento

### 👨‍💼 Admin

- ✅ Fazer login
- ✅ Ver dashboard administrativo completo
- ✅ Criar novos barbeiros
- ✅ Ativar/Desativar barbeiros
- ✅ Criar/Editar/Desativar serviços
- ✅ Ver todas as estatísticas
- ✅ Ver performance dos barbeiros
- ✅ Ver serviços mais populares
- ✅ Ver receita mensal
- ✅ Gerenciar todos os agendamentos

---

## 🎨 Design e Interface

### Paleta de Cores
- **Primária**: Dourado (#D4AF37, #B8941F)
- **Secundária**: Preto (#2A2A2A, #1A1A1A)
- **Neutra**: Branco (#FFFFFF), Cinza (#F8F9FA)
- **Status**: Verde (#28A745), Amarelo (#FFC107), Vermelho (#DC3545)

### Tipografia
- **Fonte**: Poppins (Google Fonts)
- **Ícones**: Font Awesome 6.0

### Responsividade
- Mobile First
- Breakpoints: 480px, 768px, 1024px
- Layout adaptativo com CSS Grid e Flexbox

---

## 📊 Fluxo de Agendamento Completo

1. **Cliente acessa** a página inicial
2. **Faz login** ou se registra
3. **Acessa página de agendamento**
4. **Seleciona barbeiro** (lista de barbeiros ativos)
5. **Seleciona serviço** (lista de serviços disponíveis)
6. **Seleciona data** (calendário com disponibilidade)
7. **Seleciona horário** (horários disponíveis do barbeiro na data)
8. **Confirma agendamento** (cria registro no banco)
9. **Vê confirmação** com detalhes
10. **Realiza pagamento** (opcional, integração Mercado Pago)
11. **Barbeiro recebe** notificação do novo agendamento
12. **Barbeiro confirma** ou cancela
13. **Cliente recebe** atualização do status

---

## 🔧 Configurações Importantes

### Vite Config (Frontend)
```javascript
{
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
}
```

### CORS (Backend)
```javascript
{
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}
```

---

## 📦 Dependências Principais

### Backend
- express: ^4.18.2
- sqlite3: ^5.1.7
- jsonwebtoken: ^9.0.2
- bcryptjs: ^2.4.3
- joi: ^18.0.2
- helmet: ^7.1.0
- cors: ^2.8.5
- mercadopago: ^2.10.1

### Frontend
- react: ^19.2.0
- react-dom: ^19.2.0
- react-router-dom: ^7.9.6
- axios: ^1.13.2
- vite: ^7.2.4

---

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de CORS**
   - Verificar se backend está rodando na porta 3000
   - Verificar configuração CORS no server.js

2. **Token inválido**
   - Verificar se JWT_SECRET está configurado
   - Limpar localStorage e fazer login novamente

3. **Banco de dados não inicializa**
   - Verificar permissões de escrita na pasta database
   - Deletar barbearia.db e reiniciar servidor

4. **Frontend não conecta com API**
   - Verificar se proxy está configurado no vite.config.js
   - Verificar se backend está rodando

---

## 📝 Notas para Implementação no Lovable

1. **Estrutura de Autenticação**: Sistema completo JWT implementado
2. **Banco de Dados**: SQLite com migrations automáticas
3. **API RESTful**: Todos os endpoints documentados e funcionais
4. **Frontend React**: SPA completa com roteamento e proteção de rotas
5. **Integração Pagamento**: Mercado Pago configurado (requer token)
6. **Responsividade**: Design mobile-first implementado
7. **Segurança**: Rate limiting, validação, criptografia implementados

---

**Desenvolvido como projeto extensionista - Sistema completo Full-Stack para agendamento de barbearia**




