

# 🪒 Sistema de Agendamento - Barbearia

## 📋 Descrição do Projeto

Sistema web responsivo para agendamento de serviços em barbearia, com identidade visual moderna e técnicas avançadas de CSS.
Permite que clientes agendem horários online e que barbeiros gerenciem seus agendamentos via painel administrativo.

---

## ✨ TED 1 - Identidade Visual Aplicada

O projeto implementa uma identidade visual moderna com:

* **Design System:** Cores, tipografia e espaçamentos consistentes
* **CSS Grid & Flexbox:** Layouts responsivos
* **Media Queries:** Adaptação a diferentes telas
* **Animações:** Transições suaves e efeitos visuais
* **UX/UI:** Interface intuitiva e acessível

---

## 🎯 Funcionalidades

### Para Clientes

* Visualização da página inicial com informações da barbearia
* Agendamento online (serviço, data e horário)
* Validação de horários disponíveis
* Confirmação de agendamento com detalhes
* Interface responsiva e intuitiva

### Para Barbeiros

* Dashboard com estatísticas em tempo real
* Visualização de agendamentos por data
* Confirmação e cancelamento de agendamentos
* Calendário interativo com ocupação visual
* Detalhes completos de cada agendamento

---

## 🚀 Como Executar

### Pré-requisitos

* Navegador moderno (Chrome, Firefox, Safari, Edge)
* Servidor local opcional

### Execução Local

**Método Simples:**

1. Baixe todos os arquivos para uma pasta
2. Abra `index.html` no navegador

**Método com Servidor Local:**

```bash
# Python
python -m http.server 8000

# Node.js
npx http-server
```

Acesse: `http://localhost:8000`

---

## 📁 Estrutura do Projeto

```
barbeariau/
├── index.html              # Página inicial
├── agendamento.html        # Página de agendamento
├── painel-barbeiro.html    # Painel administrativo
├── styles.css              # Estilos CSS
└── README.md               # Documentação
```

---

## 🎨 Design e Interface

### Características

* **Responsivo:** Adapta-se a diferentes telas
* **Moderno:** Interface limpa e profissional
* **Acessível:** Cores contrastantes e navegação intuitiva
* **UX Otimizada:** Fluxo de agendamento simplificado

### Paleta de Cores

* **Primária:** Dourado (#D4AF37, #B8941F)
* **Secundária:** Preto (#2A2A2A, #1A1A1A)
* **Neutra:** Branco (#FFFFFF), Cinza (#F8F9FA)
* **Status:** Verde (#28A745), Amarelo (#FFC107), Vermelho (#DC3545)

---

## 🔧 Tecnologias Utilizadas

* **HTML5:** Estrutura semântica
* **CSS3:** Flexbox, Grid, animações
* **Font Awesome:** Ícones
* **Google Fonts:** Tipografia Poppins

---

## 📱 Páginas do Sistema

### 1. Página Inicial (`index.html`)

* Seção Hero (apresentação da barbearia)
* Lista de serviços com preços
* Contato (localização e horários)
* Menu responsivo

### 2. Página de Agendamento (`agendamento.html`)

* Formulário completo (nome, telefone, e-mail, serviço, dia, horário, observações)
* Seleção visual de serviços e horários
* Resumo do agendamento em tempo real

### 3. Painel do Barbeiro (`painel-barbeiro.html`)

* Dashboard com estatísticas
* Lista de agendamentos do dia
* Calendário mensal com ocupação
* Indicadores visuais de status

---

## 🔄 Fluxo de Agendamento

1. Cliente acessa a página inicial
2. Clica em "Agendar Horário"
3. Preenche o formulário
4. Confirma o agendamento
5. Recebe confirmação com detalhes

### Fluxo do Barbeiro

1. Acessa o painel administrativo
2. Visualiza dashboard e agendamentos
3. Confirma ou cancela agendamentos
4. Consulta calendário e detalhes de clientes

---

## 🎯 Melhorias Futuras

**Funcionalidades Planejadas:**

* Notificações por e-mail
* Integração com WhatsApp
* Sistema de cadastro de clientes
* Pagamento online
* Relatórios avançados
* Temas personalizáveis
* Agendamento recorrente
* Sistema de avaliações

**Melhorias Técnicas:**

* Autenticação de usuários
* Banco de dados real
* Hospedagem na nuvem
* Aplicativo mobile
* Sincronização em tempo real

---

## 🐛 Solução de Problemas

**Problemas Comuns:**

1. Dados não persistem → verificar LocalStorage / limpar cache
2. Horários não aparecem → verificar data futura / recarregar página
3. Formulário não envia → campos obrigatórios preenchidos / horário disponível

## 📄 Licença

Projeto desenvolvido como iniciativa educacional, disponível para uso educacional e comercial.

---

**Desenvolvido com ❤️ para modernizar o agendamento de barbearias**

---

Se você quiser, posso também criar **uma versão mais enxuta e visual do README** com badges, ícones e seções colapsáveis para ficar ainda mais profissional para o GitHub. Quer que eu faça?
