# API da Barbearia - Documentação Completa

## Visão Geral

API RESTful para sistema de agendamento de barbearia desenvolvida com Node.js e Express.js. A API permite gerenciar usuários, barbeiros, serviços, agendamentos e fornece dashboards com estatísticas.

## Base URL

```
http://localhost:3000/api
```

## Arquivos de Entrega

### 1. Código-fonte completo
- `server.js` - Servidor principal da API
- `routes/` - Todas as rotas da API organizadas por módulo
- `middleware/` - Middlewares de autenticação, validação e rate limiting
- `database/` - Configuração e inicialização do banco de dados
- `package.json` - Dependências e scripts do projeto

### 2. Documentação dos endpoints
- `Barbearia_API_Collection.postman_collection.json` - Coleção completa do Postman
- `Barbearia_API_Environment.postman_environment.json` - Ambiente do Postman
- `API_DOCUMENTATION.md` - Esta documentação completa

## Autenticação

A API utiliza JWT (JSON Web Token) para autenticação. Inclua o token no header `Authorization`:

```
Authorization: Bearer <seu_token>
```

## Endpoints

### Health Check e Documentação

#### GET `/health`
Verificar se a API está funcionando corretamente.

**Resposta:**
```json
{
  "success": true,
  "message": "API da Barbearia está funcionando",
  "timestamp": "2024-01-20T10:00:00.000Z",
  "version": "1.0.0"
}
```

#### GET `/api-docs`
Obter documentação completa da API em formato JSON.

**Resposta:**
```json
{
  "success": true,
  "message": "Documentação da API da Barbearia",
  "version": "1.0.0",
  "baseUrl": "http://localhost:3000/api",
  "endpoints": {
    // ... todos os endpoints documentados
  },
  "authentication": {
    "type": "JWT",
    "header": "Authorization: Bearer <token>",
    "expiresIn": "24h"
  }
}
```

### Autenticação (`/api/auth`)

#### POST `/api/auth/login`
Realizar login no sistema.

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "123456"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "token": "jwt_token_aqui",
    "user": {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@email.com",
      "tipo": "cliente",
      "telefone": "(11) 99999-1111"
    }
  }
}
```

#### POST `/api/auth/register`
Registrar novo usuário.

**Body:**
```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "password": "123456",
  "telefone": "(11) 99999-1111",
  "tipo": "cliente"
}
```

#### GET `/api/auth/me`
Obter dados do usuário logado.

**Headers:** `Authorization: Bearer <token>`

#### POST `/api/auth/logout`
Realizar logout do sistema.

**Headers:** `Authorization: Bearer <token>`

**Resposta:**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

#### GET `/api/auth/verify`
Verificar se o token é válido.

**Headers:** `Authorization: Bearer <token>`

**Resposta:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "joao@email.com",
      "tipo": "cliente"
    }
  }
}
```

### Barbeiros (`/api/barbers`)

#### GET `/api/barbers`
Listar todos os barbeiros.

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@barbearia.com",
      "telefone": "(11) 99999-1111",
      "created_at": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

#### GET `/api/barbers/:id`
Buscar barbeiro específico.

#### GET `/api/barbers/:id/schedule`
Buscar horários de funcionamento do barbeiro.

#### GET `/api/barbers/:id/availability/:date`
Buscar disponibilidade do barbeiro em uma data específica.

**Parâmetros:**
- `date`: Data no formato YYYY-MM-DD

**Resposta:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "date": "2024-01-20",
    "workingHours": {
      "start": "08:00",
      "end": "18:00"
    },
    "availableSlots": [
      {
        "time": "08:00",
        "available": true
      },
      {
        "time": "08:30",
        "available": false
      }
    ]
  }
}
```

### Serviços (`/api/services`)

#### GET `/api/services`
Listar todos os serviços.

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "Corte de Cabelo",
      "descricao": "Corte moderno e estiloso",
      "preco": 30.00,
      "duracao_minutos": 30,
      "ativo": 1
    }
  ]
}
```

#### GET `/api/services/:id`
Buscar serviço específico.

#### POST `/api/services`
Criar novo serviço (apenas admin).

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "nome": "Novo Serviço",
  "descricao": "Descrição do serviço",
  "preco": 25.00,
  "duracao_minutos": 45
}
```

#### PUT `/api/services/:id`
Atualizar serviço (apenas admin).

#### DELETE `/api/services/:id`
Desativar serviço (apenas admin).

#### GET `/api/services/:id/bookings`
Obter agendamentos de um serviço específico (apenas admin).

**Headers:** `Authorization: Bearer <token>`

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "data_agendamento": "2025-10-25",
      "hora": "14:00",
      "status": "confirmado",
      "cliente": {
        "id": 1,
        "nome": "João Silva",
        "email": "joao@email.com"
      },
      "barbeiro": {
        "id": 1,
        "nome": "Carlos Santos"
      }
    }
  ]
}
```

### Agendamentos (`/api/bookings`)

#### GET `/api/bookings`
Listar agendamentos com filtros.

**Query Parameters:**
- `barbeiro_id`: ID do barbeiro
- `cliente_id`: ID do cliente
- `data_inicio`: Data inicial (YYYY-MM-DD)
- `data_fim`: Data final (YYYY-MM-DD)
- `status`: Status do agendamento
- `page`: Página (padrão: 1)
- `limit`: Limite por página (padrão: 20)

#### GET `/api/bookings/:id`
Buscar agendamento específico.

#### POST `/api/bookings`
Criar novo agendamento.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "barbeiro_id": 1,
  "servico_id": 1,
  "data_agendamento": "2024-01-20",
  "hora_agendamento": "10:00",
  "observacoes": "Observações opcionais"
}
```

#### PUT `/api/bookings/:id/status`
Atualizar status do agendamento.

**Body:**
```json
{
  "status": "confirmado"
}
```

**Status possíveis:**
- `pendente`: Aguardando confirmação
- `confirmado`: Confirmado pelo barbeiro
- `cancelado`: Cancelado
- `concluido`: Serviço realizado

#### DELETE `/api/bookings/:id`
Cancelar agendamento.

#### GET `/api/bookings/history`
Obter histórico de agendamentos do usuário logado.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`: Página (padrão: 1)
- `limit`: Limite por página (padrão: 10)

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "data_agendamento": "2025-10-25",
      "hora": "14:00",
      "status": "confirmado",
      "servico": {
        "id": 1,
        "nome": "Corte Masculino",
        "preco": 25.00
      },
      "barbeiro": {
        "id": 1,
        "nome": "João Silva"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 10
  }
}
```

### Dashboard (`/api/dashboard`)

#### GET `/api/dashboard/stats`
Obter estatísticas gerais.

**Query Parameters:**
- `start_date`: Data inicial (YYYY-MM-DD)
- `end_date`: Data final (YYYY-MM-DD)

**Resposta:**
```json
{
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

#### GET `/api/dashboard/recent-bookings`
Obter agendamentos recentes.

**Query Parameters:**
- `limit`: Número de agendamentos (padrão: 10)

#### GET `/api/dashboard/calendar/:year/:month`
Obter dados do calendário para um mês específico.

#### GET `/api/dashboard/services-popularity`
Obter serviços mais populares (apenas admin).

#### GET `/api/dashboard/barbers-performance`
Obter performance dos barbeiros (apenas admin).

#### GET `/api/dashboard/monthly-revenue`
Obter receita mensal (apenas admin).

## Códigos de Status HTTP

- `200`: Sucesso
- `201`: Criado com sucesso
- `400`: Dados inválidos
- `401`: Não autorizado
- `403`: Acesso negado
- `404`: Não encontrado
- `429`: Muitas requisições
- `500`: Erro interno do servidor

## Rate Limiting

- **Geral**: 100 requisições por 15 minutos
- **Autenticação**: 5 tentativas por 15 minutos
- **Agendamentos**: 3 agendamentos por minuto

## Tipos de Usuário

- `cliente`: Pode agendar e cancelar seus próprios agendamentos
- `barbeiro`: Pode ver e gerenciar seus agendamentos
- `admin`: Acesso total ao sistema

## Exemplos de Uso

### 1. Login e obtenção de token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "joao@email.com", "senha": "123456"}'
```

### 2. Criar agendamento
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "barbeiro_id": 1,
    "servico_id": 1,
    "data_agendamento": "2024-01-20",
    "hora_agendamento": "10:00"
  }'
```

### 3. Verificar disponibilidade
```bash
curl http://localhost:3000/api/barbers/1/availability/2024-01-20
```

## Como Usar a Coleção do Postman

### 1. Importar a Coleção
1. Abra o Postman
2. Clique em "Import" no canto superior esquerdo
3. Selecione o arquivo `Barbearia_API_Collection.postman_collection.json`
4. A coleção será importada com todos os endpoints organizados

### 2. Configurar o Ambiente
1. Clique em "Import" novamente
2. Selecione o arquivo `Barbearia_API_Environment.postman_environment.json`
3. Selecione o ambiente "Barbearia API - Environment" no canto superior direito
4. Configure as variáveis conforme necessário:
   - `base_url`: http://localhost:3000 (padrão)
   - `token`: Token JWT do usuário logado
   - `admin_token`: Token JWT do administrador
   - `barber_token`: Token JWT do barbeiro
   - `client_token`: Token JWT do cliente

### 3. Fluxo de Teste Recomendado
1. **Health Check**: Teste se a API está funcionando
2. **Registrar Usuário**: Crie um usuário de teste
3. **Login**: Faça login e copie o token retornado
4. **Configurar Token**: Cole o token na variável `token` do ambiente
5. **Testar Endpoints**: Execute os endpoints na ordem desejada

### 4. Exemplos de Uso
- **Cliente**: Use `client_token` para testar funcionalidades de cliente
- **Barbeiro**: Use `barber_token` para testar funcionalidades de barbeiro  
- **Admin**: Use `admin_token` para testar funcionalidades administrativas

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3000
NODE_ENV=development
DB_PATH=./database/barbearia.db
JWT_SECRET=sua_chave_secreta_super_segura_aqui
JWT_EXPIRES_IN=24h
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Instalação

```bash
# Instalar dependências
npm install

# Inicializar banco de dados
node database/init.js

# Iniciar servidor
npm start

# Modo desenvolvimento
npm run dev
```

## Banco de Dados

A API utiliza SQLite como banco de dados. O arquivo do banco é criado automaticamente em `./database/barbearia.db`.

### Tabelas Principais

- `usuarios`: Usuários do sistema (clientes, barbeiros, admin)
- `servicos`: Serviços oferecidos pela barbearia
- `agendamentos`: Agendamentos de clientes
- `horarios_funcionamento`: Horários de trabalho dos barbeiros
- `disponibilidade`: Horários específicos disponíveis

## Segurança

- Senhas são criptografadas com bcrypt
- Tokens JWT com expiração configurável
- Rate limiting para prevenir ataques
- Validação de dados com Joi
- Headers de segurança com Helmet
- CORS configurado adequadamente













