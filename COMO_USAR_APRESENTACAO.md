# 📊 Como Usar a Apresentação

## Opções para Visualizar os Slides

### 1. **Marp (Recomendado)**
Marp é uma ferramenta que converte Markdown em slides.

**Instalação:**
```bash
npm install -g @marp-team/marp-cli
```

**Converter para PDF:**
```bash
marp APRESENTACAO_PROJETO.md --pdf
```

**Converter para HTML:**
```bash
marp APRESENTACAO_PROJETO.md --html
```

### 2. **Reveal.js**
Apresentações HTML interativas.

**Instalação:**
```bash
npm install -g reveal-md
```

**Executar:**
```bash
reveal-md APRESENTACAO_PROJETO.md
```

### 3. **PowerPoint/Google Slides**
1. Copie o conteúdo do arquivo `APRESENTACAO_PROJETO.md`
2. Cole no PowerPoint ou Google Slides
3. Cada slide está separado por `---`
4. Formate conforme necessário

### 4. **Online (Marp Web)**
1. Acesse: https://web.marp.app/
2. Cole o conteúdo do arquivo
3. Visualize e exporte

## Estrutura dos Slides

Cada slide está separado por `---` e contém:

- **Título** (com #)
- **Subtítulo** (com ##)
- **Conteúdo** (texto, listas, etc.)

## Personalização

Você pode:
- Adicionar imagens
- Modificar cores
- Ajustar conteúdo
- Adicionar mais slides

## Dicas

- Use emojis para destacar pontos importantes
- Mantenha slides concisos (máximo 5-7 pontos)
- Use listas para organizar informações
- Adicione imagens de demonstração quando possível

