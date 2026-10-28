# Lista de Tarefas

Aplicativo web de lista de tarefas feito com **HTML, CSS e JavaScript puro** — sem frameworks e sem etapa de build.

## Funcionalidades

- Adicionar tarefas com categoria
- Marcar como concluída, com animação
- Editar o texto e a categoria (duplo clique ou botão ✎)
- Reordenar arrastando pela alça ⋮⋮ (mouse ou dedo; no teclado, setas ↑ ↓)
- Prioridade Alta, Média ou Baixa, com opção de ordenar a lista por prioridade
- Categorias personalizadas: crie, renomeie e escolha a cor
- Subtarefas (passos) dentro de cada tarefa, com progresso do tipo "2/3"
- Filtrar por categoria e buscar por texto (ignora acentos; atalho `/`)
- Contador de tarefas pendentes e barra de progresso
- Limpar concluídas de uma vez, com opção de desfazer
- Exportar e importar backup em `.json`
- Exportar a lista em PDF
- Tema escuro e layout responsivo para celular
- Tudo fica salvo no navegador (`localStorage`)

## Como usar

- **Online:** acesse o link do GitHub Pages deste repositório.
- **No computador:** baixe os arquivos e abra o `index.html` no navegador.

## Estrutura

```
index.html             Estrutura da página
css/style.css          Visual (tema escuro e responsivo)
js/app.js              Lógica do aplicativo
icons/                 Ícones da aba e da tela inicial
manifest.webmanifest   Permite "Adicionar à tela inicial" no celular
```

## Privacidade

As tarefas ficam guardadas apenas no navegador de quem usa o app. Nada é enviado para servidores.
