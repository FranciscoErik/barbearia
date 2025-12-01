# Guia de Teste - Sistema de Agendamento e Pagamento (React)

## Como Testar o Fluxo Completo

### 1. Preparação

1. **Certifique-se de que ambos os servidores estão rodando:**

   **Opção 1: Executar tudo junto (Recomendado)**
   ```bash
   # Na raiz do projeto
   npm run dev:all
   ```
   Isso inicia:
   - Backend na porta 3000
   - Frontend React na porta 5173

   **Opção 2: Executar separadamente**
   ```bash
   # Terminal 1 - Backend
   npm run dev

   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

2. **Acesse a aplicação:**
   - Frontend React: `http://localhost:5173`
   - Backend API: `http://localhost:3000/api`

3. **Verifique se você está logado como cliente:**
   - Acesse `http://localhost:5173/login`
   - Faça login com uma conta de cliente
   - Se não tiver conta, crie uma em `/register` (será criada automaticamente como cliente)

### 2. Testar o Agendamento

1. **Acesse a página de agendamento:**
   - Vá para `http://localhost:5173/agendamento`
   - Ou clique em "Agendar" no menu após fazer login

2. **Preencha o formulário em 4 etapas:**
   
   **Etapa 1 - Selecionar Barbeiro:**
   - Clique em um card de barbeiro disponível
   - Você será automaticamente levado para a próxima etapa
   
   **Etapa 2 - Selecionar Serviço:**
   - Escolha um serviço da lista (ex: "Corte de Cabelo", "Barba", "Combo")
   - O preço será exibido
   - Clique no serviço desejado
   
   **Etapa 3 - Selecionar Data:**
   - Use o campo de data para escolher uma data futura
   - A data mínima é amanhã
   - A data máxima é 30 dias a partir de hoje
   
   **Etapa 4 - Selecionar Horário:**
   - Os horários disponíveis serão carregados automaticamente
   - Clique em um horário disponível (em verde)
   - Horários ocupados aparecem desabilitados

3. **Confirme o agendamento:**
   - Clique no botão **"Confirmar Agendamento"**
   - O botão mostrará "Agendando..." durante o processo
   - Você será **redirecionado automaticamente para a página de pagamento**

### 3. Verificar se o Botão Está Funcionando

**Se o botão não funcionar, verifique:**

1. **Console do navegador (F12):**
   - Abra o DevTools (F12)
   - Vá na aba "Console"
   - Clique no botão e veja se há erros
   - Verifique se há erros de rede na aba "Network"

2. **Verifique se todos os campos estão preenchidos:**
   - ✅ Barbeiro selecionado (etapa 1 completa)
   - ✅ Serviço selecionado (etapa 2 completa)
   - ✅ Data selecionada (etapa 3 completa)
   - ✅ Horário selecionado (etapa 4 completa)
   - O resumo do agendamento à direita mostra todas as informações

3. **Verifique se está logado:**
   - O token deve estar no localStorage
   - Verifique no console: `localStorage.getItem('token')`
   - Se não estiver logado, será redirecionado para `/login`

4. **Verifique se o backend está rodando:**
   - Acesse `http://localhost:3000/health`
   - Deve retornar uma resposta JSON com `success: true`

### 4. Testar o Pagamento

Após confirmar o agendamento, você será **automaticamente redirecionado** para `/pagamento`

**A página de pagamento mostra:**
- ✅ Resumo completo do agendamento
- ✅ Serviço selecionado
- ✅ Barbeiro selecionado
- ✅ Data e horário
- ✅ Valor total

**Opções disponíveis:**

1. **Pagar Agora:**
   - Clique em "Pagar Agora"
   - Atualmente mostra um alert (integração com Mercado Pago será implementada)
   - Após o pagamento, redireciona para confirmação

2. **Pagar Depois:**
   - Clique em "Pagar Depois"
   - Redireciona para a página de confirmação
   - O agendamento fica criado, mas sem pagamento

### 5. Integração com Mercado Pago (Futuro)

Para implementar pagamentos reais:

1. **Pix:**
   - Usar `paymentService.createPixPayment(bookingId)`
   - Retorna QR Code para pagamento

2. **Cartão (Mercado Pago):**
   - Usar `paymentService.createPayment(bookingId, paymentData)`
   - Redireciona para checkout do Mercado Pago

**Cartões de Teste do Mercado Pago (Sandbox):**

**Cartões aprovados:**
- Número: `5031 4332 1540 6351`
- CVV: `123`
- Data: Qualquer data futura
- Nome: Qualquer nome

**Cartões recusados:**
- Número: `5031 4332 1540 6352`
- CVV: `123`

### 6. Testar Webhook (Opcional)

Para testar o webhook do Mercado Pago em desenvolvimento local:

1. **Instale o ngrok:**
   ```bash
   npm install -g ngrok
   # ou baixe de https://ngrok.com/
   ```

2. **Exponha o servidor:**
   ```bash
   ngrok http 3000
   ```

3. **Configure o webhook no Mercado Pago:**
   - Use a URL do ngrok: `https://seu-id.ngrok.io/api/payments/webhook`
   - Configure no painel do Mercado Pago

### 7. Troubleshooting

**Problema: Botão não funciona**
- ✅ Verifique o console do navegador (F12)
- ✅ Verifique se todos os 4 passos foram completados
- ✅ Verifique se está logado (token no localStorage)
- ✅ Verifique se o backend está rodando na porta 3000
- ✅ Verifique se há erros de CORS (o proxy do Vite deve resolver)

**Problema: Erro ao criar agendamento**
- ✅ Verifique se o servidor backend está rodando
- ✅ Verifique se o token é válido (faça logout e login novamente)
- ✅ Verifique se o horário está disponível
- ✅ Verifique os logs do servidor no terminal
- ✅ Verifique a aba Network no DevTools para ver a resposta da API

**Problema: Não redireciona para pagamento**
- ✅ Verifique se o agendamento foi criado com sucesso (status 201)
- ✅ Verifique o console para erros de navegação
- ✅ Verifique se a rota `/pagamento` está configurada no App.jsx
- ✅ Verifique se os dados do booking estão sendo passados corretamente

**Problema: Página de pagamento não carrega**
- ✅ Verifique se o booking foi passado via `location.state`
- ✅ Se não houver booking, você será redirecionado para home
- ✅ Verifique o console para erros

**Problema: Horários não aparecem**
- ✅ Verifique se a data foi selecionada
- ✅ Verifique se o barbeiro foi selecionado
- ✅ Verifique se o backend está respondendo na rota `/api/barbers/:id/availability/:date`
- ✅ Verifique o console para erros de API

### 8. Verificar Agendamento Criado

Após criar o agendamento, você pode verificar:

1. **No histórico:**
   - Acesse `/historico` ou clique em "Histórico" no menu
   - O agendamento deve aparecer com status "pendente"
   - Você pode cancelar agendamentos pendentes

2. **No painel do barbeiro:**
   - Faça logout e login como barbeiro
   - Acesse `/painel-barbeiro`
   - O agendamento deve aparecer na lista
   - O barbeiro pode confirmar, cancelar ou marcar como concluído

3. **No painel do admin:**
   - Faça login como admin
   - Acesse `/painel-admin`
   - Veja todas as estatísticas e agendamentos

### 9. Testar Sem Mercado Pago Configurado

Se você não tiver o Mercado Pago configurado, o sistema ainda deve:
- ✅ Criar o agendamento normalmente
- ✅ Redirecionar para a página de pagamento
- ✅ Mostrar o resumo do agendamento
- ⚠️ Ao clicar em "Pagar Agora", mostrará um alert (isso é esperado)
- ✅ A opção "Pagar Depois" funciona normalmente

Para testar sem Mercado Pago:
1. Crie o agendamento normalmente
2. Será redirecionado para pagamento
3. Clique em "Pagar Depois" para pular o pagamento
4. O agendamento estará criado e visível no histórico

### 10. Logs Úteis

**No console do navegador (F12), você verá:**
```
POST /api/bookings 201 (Created)
Response: { success: true, data: { id: 1, ... } }
```

**Na aba Network do DevTools:**
- Verifique a requisição POST para `/api/bookings`
- Status deve ser 201 (Created)
- Response deve conter `success: true`

**No servidor (terminal), você verá:**
```
POST /api/bookings - 201
Agendamento criado com sucesso
```

### 11. Fluxo Completo de Teste

1. ✅ **Acessar aplicação:** `http://localhost:5173`
2. ✅ **Registrar/Login:** Criar conta de cliente
3. ✅ **Agendar:** Completar os 4 passos (Barbeiro → Serviço → Data → Horário)
4. ✅ **Confirmar:** Clicar em "Confirmar Agendamento"
5. ✅ **Pagamento:** Ser redirecionado automaticamente para `/pagamento`
6. ✅ **Ver resumo:** Verificar todas as informações do agendamento
7. ✅ **Pagar depois:** Clicar em "Pagar Depois" para pular pagamento
8. ✅ **Confirmação:** Ver página de confirmação
9. ✅ **Histórico:** Verificar agendamento em `/historico`
10. ✅ **Painel Barbeiro:** Login como barbeiro e ver agendamento

## Checklist de Teste

### Preparação
- [ ] Backend está rodando na porta 3000
- [ ] Frontend React está rodando na porta 5173
- [ ] Acessou `http://localhost:5173`

### Autenticação
- [ ] Consegue registrar nova conta
- [ ] Consegue fazer login
- [ ] Token é salvo no localStorage
- [ ] Header mostra nome do usuário

### Agendamento
- [ ] Consegue acessar `/agendamento`
- [ ] Etapa 1: Consegue selecionar barbeiro
- [ ] Etapa 2: Consegue selecionar serviço
- [ ] Etapa 3: Consegue selecionar data
- [ ] Etapa 4: Horários disponíveis aparecem
- [ ] Consegue selecionar horário
- [ ] Resumo do agendamento aparece corretamente
- [ ] Botão "Confirmar Agendamento" aparece
- [ ] Botão funciona ao clicar
- [ ] Agendamento é criado com sucesso (status 201)

### Pagamento
- [ ] Redireciona automaticamente para `/pagamento`
- [ ] Página de pagamento carrega
- [ ] Resumo do agendamento aparece completo
- [ ] Mostra serviço, barbeiro, data, horário e valor
- [ ] Botão "Pagar Agora" aparece
- [ ] Botão "Pagar Depois" aparece
- [ ] "Pagar Depois" redireciona para confirmação

### Verificação
- [ ] Agendamento aparece no histórico
- [ ] Status está correto (pendente)
- [ ] Consegue cancelar agendamento pendente
- [ ] Barbeiro vê agendamento no painel
- [ ] Admin vê estatísticas atualizadas

## Estrutura de Rotas (React)

- `/` - Home (pública)
- `/login` - Login (pública)
- `/register` - Registro (pública)
- `/agendamento` - Agendamento (protegida - cliente)
- `/historico` - Histórico (protegida - cliente)
- `/pagamento` - Pagamento (protegida)
- `/confirmacao` - Confirmação (protegida)
- `/painel-barbeiro` - Dashboard Barbeiro (protegida - barbeiro)
- `/painel-admin` - Dashboard Admin (protegida - admin)

## Notas Importantes

1. **O sistema agora é uma SPA (Single Page Application)** - Não há recarregamento de página
2. **Navegação é feita via React Router** - URLs mudam mas a página não recarrega
3. **Autenticação usa JWT** - Token salvo no localStorage
4. **API está em `/api`** - Proxy do Vite redireciona para `http://localhost:3000/api`
5. **Após confirmar agendamento, redireciona automaticamente para pagamento** - Não passa pela confirmação primeiro

---

**✅ Sistema React totalmente funcional e integrado com a API!**
