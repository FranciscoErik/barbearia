# 🚀 Instruções para Subir no Git

## 1️⃣ **Instalar o Git**

### Windows:
1. Acesse: https://git-scm.com/download/win
2. Baixe e instale o Git
3. Reinicie o terminal/PowerShell

### Verificar instalação:
```bash
git --version
```

## 2️⃣ **Configurar o Git (primeira vez)**

```bash
git config --global user.name "Seu Nome Completo"
git config --global user.email "seu.email@exemplo.com"
```

## 3️⃣ **Criar Repositório no GitHub**

1. Acesse: https://github.com
2. Clique em "New repository"
3. Nome: `barbeariau`
4. Descrição: "Sistema de agendamento online para barbearia com design moderno"
5. Escolha: Público ou Privado
6. **NÃO marque** "Add README" (já temos arquivos)
7. Clique "Create repository"

## 4️⃣ **Comandos para Subir o Projeto**

Execute estes comandos no terminal (na pasta do projeto):

```bash
# 1. Inicializar repositório
git init

# 2. Adicionar todos os arquivos
git add .

# 3. Fazer primeiro commit
git commit -m "Initial commit: Barbearia website with modern CSS and responsive design"

# 4. Conectar com GitHub (substitua SEU-USUARIO)
git remote add origin https://github.com/SEU-USUARIO/barbeariau.git

# 5. Subir para o GitHub
git push -u origin main
```

## 5️⃣ **Comandos Úteis para o Futuro**

```bash
# Ver status dos arquivos
git status

# Adicionar arquivos modificados
git add .

# Fazer commit das mudanças
git commit -m "Descrição da mudança"

# Subir mudanças para o GitHub
git push

# Baixar mudanças do GitHub
git pull

# Ver histórico de commits
git log --oneline
```

## 6️⃣ **Estrutura do Projeto no Git**

```
barbeariau/
├── index.html              # Página inicial
├── agendamento.html        # Página de agendamento
├── login.html             # Página de login
├── painel-barbeiro.html   # Painel administrativo
├── assets/
│   ├── css/
│   │   └── styles.css     # CSS moderno com Grid/Flexbox
│   └── images/
│       └── logo.png       # Logo da barbearia
├── .gitignore             # Arquivos ignorados pelo Git
├── README.md              # Documentação do projeto
└── GIT_INSTRUCTIONS.md    # Este arquivo
```

## 7️⃣ **Próximos Passos**

Após subir no Git:
1. ✅ Compartilhe o link do repositório
2. ✅ Adicione colaboradores se necessário
3. ✅ Configure GitHub Pages para hospedar o site
4. ✅ Continue fazendo commits das melhorias

## 🆘 **Problemas Comuns**

### Erro: "git não é reconhecido"
- **Solução**: Instale o Git primeiro

### Erro: "remote origin already exists"
- **Solução**: `git remote remove origin` e tente novamente

### Erro: "authentication failed"
- **Solução**: Use token de acesso pessoal do GitHub

### Erro: "branch main does not exist"
- **Solução**: `git branch -M main` antes do push

---

**🎉 Pronto! Seu projeto estará no GitHub!**

