# CLAUDE.md

Este arquivo orienta o Claude ao trabalhar neste projeto. Leia-o antes de qualquer alteração.

## Visão geral do projeto

**Lista de Tarefas** — um aplicativo web simples para criar, concluir, editar e excluir tarefas.

- Feito com **HTML, CSS e JavaScript puro** (vanilla), sem frameworks nem bibliotecas.
- Roda direto no navegador, sem etapa de build e sem servidor obrigatório.
- Os dados ficam salvos no navegador via `localStorage`.

## Sobre o desenvolvedor

- O autor está **começando** em desenvolvimento web (vem do Swift/Xcode).
- Explique as mudanças de forma didática, em português, e quando útil compare com conceitos de Swift (ex.: `let`/`const`, arrays, closures/arrow functions, structs/objetos).
- Prefira código claro e legível a código "esperto" ou curto demais.
- Faça mudanças pequenas e incrementais, explicando o porquê de cada uma.

## Estrutura de arquivos

```
lista_tarefas/
├── index.html      # Estrutura da página
├── css/
│   └── style.css   # Estilos visuais
├── js/
│   └── app.js      # Lógica do aplicativo
├── icons/          # favicon.svg, apple-touch-icon.png, icone-192.png, icone-512.png
├── manifest.webmanifest  # "Adicionar à tela inicial" no celular
├── .nojekyll       # Diz ao GitHub Pages para servir os arquivos como estão
├── README.md       # Apresentação do projeto no GitHub
└── CLAUDE.md       # Este arquivo
```

Publicado com **GitHub Pages**. Use sempre caminhos relativos (`css/style.css`, nunca `/css/style.css`),
pois o site fica numa subpasta (`usuario.github.io/lista-tarefas/`). Nomes de arquivo diferenciam
maiúsculas de minúsculas na web.

Não crie novos arquivos ou pastas sem necessidade. Se for preciso, explique o motivo.

## Como executar

1. Abra o arquivo `index.html` diretamente no navegador (duplo clique), **ou**
2. Use a extensão **Live Server** do VS Code para recarregar automaticamente ao salvar.

Não há dependências para instalar (sem `npm install`).

## Funcionalidades esperadas

- [x] Adicionar uma nova tarefa (campo de texto + botão ou tecla Enter)
- [x] Categorias com etiquetas coloridas (Pessoal, Trabalho, Estudos, Saúde, Compras)
- [x] Marcar/desmarcar tarefa como concluída (com animação)
- [x] Editar tarefa: texto e categoria (duplo clique no texto ou botão ✎; Enter salva, Esc cancela, clicar fora salva; com "Desfazer")
- [x] Excluir uma tarefa
- [x] Reordenar arrastando pela alça ⋮⋮ (mouse e toque, com rolagem automática e "Desfazer"; setas ↑ ↓ no teclado).
      Usa Pointer Events. Regra: durante o arraste, mover sempre o VIZINHO na página, nunca a tarefa arrastada
      (isso faz o navegador soltar o ponteiro). Com filtro/busca, só as tarefas visíveis trocam entre si.
- [x] Prioridade Alta/Média/Baixa (campo `prioridade`; padrão e valor para dados antigos: `media`).
      Indicador com 3 barrinhas (só a Alta é colorida, para não confundir com as cores das categorias);
      clique no indicador troca Baixa → Média → Alta. "Ordenar por: Minha ordem | Prioridade":
      no modo Prioridade, pendentes primeiro (Alta → Média → Baixa), concluídas no fim, sem alça de arrastar;
      a ordem manual em `tarefas` nunca é alterada pela ordenação (ela só vale para a exibição).
- [x] Categorias personalizadas (botão "✎ Categorias" no fim dos filtros): criar, renomear, mudar a cor e excluir.
      Salvas em `lista-tarefas-categorias` como `{ id, nome, cor }`; tarefas guardam só o `id` da categoria.
      Cores só da paleta `CORES` (10 tons testados para contraste no tema escuro); cor chega ao CSS pela variável `--cor-cat`.
      Excluir categoria com tarefas pede "mover para…". Limite: 12 categorias. Padrão: as 5 originais.
- [x] Subtarefas ("passos"): campo `subtarefas: [{ id, texto, concluida }]` em cada tarefa (máx. 50).
      Botão "+ Passos" / "2/3" abre a lista abaixo da tarefa; a busca também procura nos passos; o PDF imprime os passos.
- [x] Backup inclui `categorias`. Ao juntar, categoria do backup com o mesmo nome de uma existente é unificada.
- [x] Limpar Concluídas de uma vez (com contador no botão e opção "Desfazer" por 6 s)
- [x] Filtrar por categoria
- [ ] Filtrar: todas / pendentes / concluídas
- [x] Busca por texto (ignora acentos e maiúsculas; atalho `/`)
- [x] Contador de tarefas pendentes + barra de progresso
- [x] Exportar a lista em PDF (via janela de impressão)
- [x] Exportar Backup (.json) e Importar Backup (juntar ou substituir, com "Desfazer")
- [x] Salvar e carregar as tarefas do `localStorage` (chave `lista-tarefas`, com validação dos dados)
- [x] Lembrar filtro, busca e última categoria usada (chave `lista-tarefas-preferencias`)
- [x] Sincronizar entre abas abertas (evento `storage`)

## Convenções de código

### Geral
- Idioma: **nomes de variáveis e funções em português**, em camelCase (ex.: `adicionarTarefa`, `listaDeTarefas`).
- Comentários em português, explicando o *porquê*, não o óbvio.
- Indentação de 2 espaços. Use aspas duplas em HTML e aspas simples em JavaScript.

### HTML
- HTML5 semântico: `<header>`, `<main>`, `<form>`, `<ul>`, `<li>`, `<button>`.
- Use `lang="pt-BR"` e `<meta charset="UTF-8">`.
- Todo campo de formulário deve ter `<label>` (acessibilidade).
- Carregue o script no final do `<body>` ou com `defer`.
- Não escreva CSS ou JavaScript inline no HTML.

### CSS
- Use variáveis CSS em `:root` para cores, espaçamentos e fontes.
- Nomes de classes em kebab-case e descritivos (ex.: `.tarefa-concluida`, `.botao-excluir`).
- Layout com Flexbox ou Grid. Design responsivo, pensado primeiro para celular (mobile-first).
- Evite `!important` e seletores por `id` para estilização.
- Celular: botões e áreas de toque com pelo menos 44×44px; campos com `font-size: 16px` (evita zoom no iPhone);
  nada pode causar rolagem lateral. Breakpoints: `600px` (celular) e `360px` (telas bem estreitas);
  `@media (hover: none)` para aparelhos de toque.

### JavaScript
- Use `const` por padrão; `let` só quando o valor muda. **Nunca use `var`.**
- Use `===` e `!==` (comparação estrita).
- Prefira arrow functions e template literals (`` `Olá, ${nome}` ``).
- Use `addEventListener` — nada de `onclick` no HTML.
- **Não use `innerHTML` com texto digitado pelo usuário** (risco de XSS). Use `textContent` e `document.createElement`.
- Mantenha o estado em um array de objetos e renderize a tela a partir dele:

```js
// Modelo de uma tarefa
const tarefa = {
  id: Date.now(),        // identificador único
  texto: 'Comprar pão',
  concluida: false
};
```

- Fluxo recomendado: **alterar o estado → salvar no `localStorage` → renderizar a lista**.
- Envolva leituras do `localStorage` em `try/catch` e use `JSON.parse`/`JSON.stringify`.
- Funções pequenas, cada uma com uma única responsabilidade.

## O que NÃO fazer

- Não adicionar frameworks (React, Vue, jQuery, Bootstrap, Tailwind etc.) sem pedido explícito.
- Não introduzir ferramentas de build (Webpack, Vite, npm) nem TypeScript.
- Não reescrever arquivos inteiros quando uma alteração pontual resolve.
- Não remover funcionalidades existentes sem avisar.

## Testes e verificação

- Não há testes automatizados. Após cada mudança, descreva como testar manualmente no navegador.
- Verifique o **Console** do navegador (F12 → Console) para erros.
- Teste em tela pequena (modo responsivo do DevTools) e grande.
- Confirme que as tarefas continuam lá após recarregar a página (F5).

## Publicação (GitHub Pages)

- Repositório: https://github.com/adalbertozauli/lista-tarefas (branch `main`, raiz `/`)
- Site no ar: https://adalbertozauli.github.io/lista-tarefas/
- Pasta local do projeto: `C:\temp\claude_desktop\lista_tarefas`

Como subir alterações (não há conector do GitHub nem `git` disponível para o Claude):
1. Alterar, testar e salvar na pasta local.
2. Só subir quando o autor pedir ("pode subir" / "altere e suba").
3. No navegador logado no GitHub: repositório → **Add file → Upload files**, enviando apenas
   os arquivos alterados, cada um na pasta certa (`css/`, `js/`, `icons/`).
4. Mostrar a lista de arquivos e a mensagem do commit antes de clicar em **Commit changes**
   (exceto se o pedido já autorizou subir).
5. Esperar 1–2 min o deploy e abrir o site para conferir.
- Nunca enviar a pasta `Claude outputs`. Se aparecer tela de login, parar e pedir ao autor.

## Git (opcional)

- Mensagens de commit em português, curtas e no imperativo (ex.: `Adiciona filtro de tarefas concluídas`).
- Um commit por funcionalidade ou correção.
