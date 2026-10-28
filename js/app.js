// ===== Configuração =====

// Chave usada para salvar no localStorage
const CHAVE_ARMAZENAMENTO = 'lista-tarefas';
const CHAVE_PREFERENCIAS = 'lista-tarefas-preferencias';

// Backup
const VERSAO_BACKUP = 1;
const TAMANHO_MAXIMO_BACKUP = 5 * 1024 * 1024; // 5 MB

const CHAVE_CATEGORIAS = 'lista-tarefas-categorias';

// Paleta de cores para as categorias. Todas foram escolhidas para ficarem
// legíveis sobre o fundo escuro (por isso não usamos um seletor de cor livre).
const CORES = [
  { valor: '#4fc3f7', nome: 'Azul' },
  { valor: '#ffb74d', nome: 'Laranja' },
  { valor: '#b49cff', nome: 'Lilás' },
  { valor: '#5ee6a8', nome: 'Verde' },
  { valor: '#ff8a80', nome: 'Salmão' },
  { valor: '#f48fb1', nome: 'Rosa' },
  { valor: '#ffd54f', nome: 'Amarelo' },
  { valor: '#80deea', nome: 'Ciano' },
  { valor: '#aed581', nome: 'Limão' },
  { valor: '#d7ccc8', nome: 'Areia' }
];

// Categorias iniciais (o "id" é usado no código; o "nome" e a "cor" aparecem na tela).
// Você pode renomear, mudar a cor, excluir e criar outras no painel "Categorias".
const CATEGORIAS_PADRAO = [
  { id: 'pessoal', nome: 'Pessoal', cor: '#4fc3f7' },
  { id: 'trabalho', nome: 'Trabalho', cor: '#ffb74d' },
  { id: 'estudos', nome: 'Estudos', cor: '#b49cff' },
  { id: 'saude', nome: 'Saúde', cor: '#5ee6a8' },
  { id: 'compras', nome: 'Compras', cor: '#ff8a80' }
];
const MAXIMO_CATEGORIAS = 12;
const MAXIMO_SUBTAREFAS = 50;

// Prioridades. "peso" define a ordem ao ordenar (menor = vem antes)
// e "barras" quantas barrinhas do indicador ficam acesas.
const PRIORIDADES = [
  { id: 'alta', nome: 'Alta', peso: 0, barras: 3 },
  { id: 'media', nome: 'Média', peso: 1, barras: 2 },
  { id: 'baixa', nome: 'Baixa', peso: 2, barras: 1 }
];
const PRIORIDADE_PADRAO = 'media';

function obterPrioridade(id) {
  return PRIORIDADES.find((p) => p.id === id) || PRIORIDADES.find((p) => p.id === PRIORIDADE_PADRAO);
}

// ===== Elementos da página =====
const formulario = document.getElementById('formulario');
const campoTarefa = document.getElementById('campo-tarefa');
const campoCategoria = document.getElementById('campo-categoria');
const campoPrioridade = document.getElementById('campo-prioridade');
const elementoOrdenacao = document.getElementById('ordenacao');
const dicaOrdenacao = document.getElementById('dica-ordenacao');
const elementoFiltros = document.getElementById('filtros');
const elementoLista = document.getElementById('lista');
const elementoContador = document.getElementById('contador');
const mensagemVazia = document.getElementById('mensagem-vazia');
const botaoLimpar = document.getElementById('botao-limpar');
const botaoExportar = document.getElementById('botao-exportar');
const infoImpressao = document.getElementById('info-impressao');
const elementoContadorRotulo = document.getElementById('contador-rotulo');
const elementoDataHoje =document.getElementById('data-hoje');
const progressoTexto = document.getElementById('progresso-texto');
const progressoBarra = document.getElementById('progresso-barra');
const campoBusca = document.getElementById('campo-busca');
const botaoLimparBusca = document.getElementById('botao-limpar-busca');
const buscaAtalho = document.getElementById('busca-atalho');
const avisoArmazenamento = document.getElementById('aviso-armazenamento');
const toast = document.getElementById('toast');
const toastTexto = document.getElementById('toast-texto');
const toastDesfazer = document.getElementById('toast-desfazer');
const botaoExportarBackup = document.getElementById('botao-exportar-backup');
const botaoImportarBackup = document.getElementById('botao-importar-backup');
const campoArquivoBackup = document.getElementById('campo-arquivo-backup');
const painelImportar = document.getElementById('painel-importar');
const painelImportarTitulo = document.getElementById('painel-importar-titulo');
const botaoImportarJuntar = document.getElementById('importar-juntar');
const botaoImportarSubstituir = document.getElementById('importar-substituir');
const botaoImportarCancelar = document.getElementById('importar-cancelar');
const painelCategorias = document.getElementById('painel-categorias');
const listaCategorias = document.getElementById('lista-categorias');
const formNovaCategoria = document.getElementById('form-nova-categoria');
const campoNovaCategoria = document.getElementById('campo-nova-categoria');
const paletaNovaCategoria = document.getElementById('paleta-nova-categoria');
const botaoNovaCategoria = document.getElementById('botao-nova-categoria');
const botaoFecharCategorias = document.getElementById('fechar-categorias');

// ===== Estado do aplicativo =====
// As categorias são carregadas ANTES das tarefas, porque ao carregar
// as tarefas conferimos se a categoria de cada uma existe.
let categorias = carregarCategorias();
// Parecido com um array de structs no Swift: cada tarefa é um objeto.
let tarefas = carregarTarefas();

// Painel de categorias
let corNovaCategoria = proximaCorLivre();
let idCategoriaComPaletaAberta = null; // categoria cuja paleta de cores está aberta
let idCategoriaExcluindo = null;       // categoria esperando "mover tarefas para..."

// Subtarefas: quais tarefas estão com a lista de passos aberta (não é salvo)
const tarefasExpandidas = new Set();
let filtroAtual = 'todas';
let ordenacaoAtual = 'manual'; // 'manual' (Minha ordem) ou 'prioridade'
let idAnimarPrioridade = null;  // tarefa cujo indicador de prioridade acabou de mudar
let textoBusca = '';

// Guardam qual tarefa deve ser animada no próximo desenho da tela.
// Assim só a tarefa que mudou anima, e não a lista inteira.
let idAnimarEntrada = null;
let idAnimarConclusao = null;

// Para o botão "Limpar Concluídas" e o "Desfazer"
let ultimasRemovidas = [];
let temporizadorToast = null;
let limpezaEmAndamento = false; // evita clique duplo durante a animação
let acaoDesfazer = null;        // o que o botão "Desfazer" do aviso deve fazer
let idEmEdicao = null;          // id da tarefa que está sendo editada (ou null)
let arraste = null;             // dados do arraste em andamento (ou null)

// Tarefas (e categorias) lidas do arquivo, esperando você escolher "Juntar" ou "Substituir"
let tarefasParaImportar = [];
let categoriasParaImportar = [];

// ===== Armazenamento =====

// O localStorage guarda só texto. Por isso usamos JSON.stringify para
// transformar o array em texto ao salvar, e JSON.parse para voltar a array ao carregar.
// (Parecido com Codable + JSONEncoder/JSONDecoder + UserDefaults no Swift.)

// Confere se um objeto lido do armazenamento tem o formato de uma tarefa válida
function ehTarefaValida(item) {
  return (
    item !== null &&
    typeof item === 'object' &&
    typeof item.id === 'number' &&
    typeof item.texto === 'string' &&
    item.texto.trim() !== '' &&
    typeof item.concluida === 'boolean'
  );
}

function carregarTarefas() {
  try {
    const dados = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (!dados) {
      return [];
    }

    const lista = JSON.parse(dados);
    return Array.isArray(lista) ? normalizarListaDeTarefas(lista) : [];
  } catch (erro) {
    console.error('Não foi possível carregar as tarefas:', erro);
    return [];
  }
}

// ----- Categorias -----

// Confere e limpa uma lista de categorias vinda do armazenamento ou de um backup
function normalizarCategorias(lista) {
  if (!Array.isArray(lista)) {
    return [];
  }
  const idsVistos = new Set();
  const resultado = [];
  lista.forEach((item) => {
    const valida =
      item !== null &&
      typeof item === 'object' &&
      typeof item.id === 'string' && item.id !== '' && item.id.length <= 40 &&
      typeof item.nome === 'string' && item.nome.trim() !== '' &&
      typeof item.cor === 'string' && /^#[0-9a-fA-F]{6}$/.test(item.cor); // cor no formato #rrggbb
    if (valida && !idsVistos.has(item.id) && resultado.length < MAXIMO_CATEGORIAS) {
      idsVistos.add(item.id);
      resultado.push({ id: item.id, nome: item.nome.trim().slice(0, 20), cor: item.cor.toLowerCase() });
    }
  });
  return resultado;
}

function carregarCategorias() {
  try {
    const dados = localStorage.getItem(CHAVE_CATEGORIAS);
    const lista = dados ? normalizarCategorias(JSON.parse(dados)) : [];
    // Primeira vez (ou dados com problema): começa com as 5 categorias padrão
    return lista.length > 0 ? lista : CATEGORIAS_PADRAO.map((c) => ({ ...c }));
  } catch (erro) {
    console.error('Não foi possível carregar as categorias:', erro);
    return CATEGORIAS_PADRAO.map((c) => ({ ...c }));
  }
}

function salvarCategorias() {
  try {
    localStorage.setItem(CHAVE_CATEGORIAS, JSON.stringify(categorias));
  } catch (erro) {
    console.error('Não foi possível salvar as categorias:', erro);
    avisoArmazenamento.hidden = false;
  }
}

// Devolve a categoria pelo id. Se não existir mais, usa a primeira (nunca devolve "nada").
function obterCategoria(id) {
  return categorias.find((c) => c.id === id) || categorias[0];
}

function contarTarefasDaCategoria(id) {
  return tarefas.filter((t) => t.categoria === id).length;
}

// Primeira cor da paleta que nenhuma categoria usa (ou a primeira, se todas estiverem em uso)
function proximaCorLivre() {
  const livre = CORES.find((cor) => !categorias.some((c) => c.cor === cor.valor));
  return (livre || CORES[0]).valor;
}

// ----- Subtarefas -----

function normalizarSubtarefas(lista) {
  if (!Array.isArray(lista)) {
    return []; // tarefas antigas não têm subtarefas
  }
  const idsVistos = new Set();
  const resultado = [];
  lista.forEach((item) => {
    const valida =
      item !== null &&
      typeof item === 'object' &&
      typeof item.id === 'number' &&
      typeof item.texto === 'string' && item.texto.trim() !== '' &&
      typeof item.concluida === 'boolean';
    if (valida && !idsVistos.has(item.id) && resultado.length < MAXIMO_SUBTAREFAS) {
      idsVistos.add(item.id);
      resultado.push({ id: item.id, texto: item.texto.trim().slice(0, 100), concluida: item.concluida });
    }
  });
  return resultado;
}

// Recebe uma lista "crua" (do localStorage ou de um backup) e devolve só tarefas válidas:
// descarta itens corrompidos, ids repetidos e garante uma categoria conhecida.
// idsCategoriasValidos: quais categorias aceitar (num backup, inclui as categorias do arquivo).
function normalizarListaDeTarefas(lista, idsCategoriasValidos = new Set(categorias.map((c) => c.id))) {
  const idsVistos = new Set(); // Set = conjunto sem repetição (igual ao Set do Swift)

  return lista
    .filter((item) => {
      if (!ehTarefaValida(item) || idsVistos.has(item.id)) {
        return false;
      }
      idsVistos.add(item.id);
      return true;
    })
    .map((tarefa) => ({
      id: tarefa.id,
      texto: tarefa.texto.trim().slice(0, 120),
      // Categoria que não existe mais vai para a primeira categoria da lista
      categoria: idsCategoriasValidos.has(tarefa.categoria) ? tarefa.categoria : categorias[0].id,
      // Tarefas antigas (ou de backups antigos) não têm prioridade: viram "Média"
      prioridade: PRIORIDADES.some((p) => p.id === tarefa.prioridade) ? tarefa.prioridade : PRIORIDADE_PADRAO,
      concluida: tarefa.concluida,
      subtarefas: normalizarSubtarefas(tarefa.subtarefas)
    }));
}

function salvarTarefas() {
  try {
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(tarefas));
    avisoArmazenamento.hidden = true;
  } catch (erro) {
    // Acontece em janela anônima de alguns navegadores ou com o armazenamento cheio
    console.error('Não foi possível salvar as tarefas:', erro);
    avisoArmazenamento.hidden = false;
  }
}

// Preferências da tela: filtro escolhido, busca e última categoria usada
function carregarPreferencias() {
  try {
    const dados = localStorage.getItem(CHAVE_PREFERENCIAS);
    return dados ? JSON.parse(dados) : {};
  } catch (erro) {
    return {};
  }
}

function salvarPreferencias() {
  const preferencias = {
    filtro: filtroAtual,
    busca: textoBusca,
    categoriaFormulario: campoCategoria.value,
    prioridadeFormulario: campoPrioridade.value,
    ordenacao: ordenacaoAtual
  };
  try {
    localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(preferencias));
  } catch (erro) {
    console.error('Não foi possível salvar as preferências:', erro);
  }
}

// Aplica na tela as preferências salvas (conferindo se ainda são válidas)
function aplicarPreferencias() {
  const preferencias = carregarPreferencias();
  const categoriaExiste = (id) => categorias.some((c) => c.id === id);

  if (preferencias.filtro === 'todas' || categoriaExiste(preferencias.filtro)) {
    filtroAtual = preferencias.filtro;
  }

  if (categoriaExiste(preferencias.categoriaFormulario)) {
    campoCategoria.value = preferencias.categoriaFormulario;
  }

  if (PRIORIDADES.some((p) => p.id === preferencias.prioridadeFormulario)) {
    campoPrioridade.value = preferencias.prioridadeFormulario;
  }

  if (preferencias.ordenacao === 'manual' || preferencias.ordenacao === 'prioridade') {
    ordenacaoAtual = preferencias.ordenacao;
  }

  if (typeof preferencias.busca === 'string' && preferencias.busca !== '') {
    campoBusca.value = preferencias.busca;
    textoBusca = preferencias.busca;
    botaoLimparBusca.hidden = false;
    buscaAtalho.hidden = true;
  }
}

// ===== Ações (alteram o estado → salvam → renderizam) =====

function adicionarTarefa(texto, categoria, prioridade) {
  const novaTarefa = {
    id: Date.now(),
    texto: texto,
    categoria: categoria,
    prioridade: prioridade,
    concluida: false,
    subtarefas: []
  };
  tarefas.unshift(novaTarefa); // adiciona no início da lista
  idAnimarEntrada = novaTarefa.id;
  atualizar();
}

function alternarConcluida(id) {
  tarefas = tarefas.map((tarefa) =>
    tarefa.id === id ? { ...tarefa, concluida: !tarefa.concluida } : tarefa
  );

  // Só anima quando a tarefa passou a ser concluída (não ao desmarcar)
  const tarefa = tarefas.find((t) => t.id === id);
  if (tarefa && tarefa.concluida) {
    idAnimarConclusao = id;
  }
  atualizar();
}

function excluirTarefa(id) {
  tarefas = tarefas.filter((tarefa) => tarefa.id !== id);
  atualizar();
}

// Remove de uma vez todas as tarefas concluídas (de todas as categorias,
// mesmo as que não aparecem por causa do filtro ou da busca).
function limparConcluidas() {
  const quantidade = tarefas.filter((tarefa) => tarefa.concluida).length;
  if (quantidade === 0 || limpezaEmAndamento) {
    return;
  }
  limpezaEmAndamento = true;

  // Guarda as tarefas removidas e a posição de cada uma, para poder desfazer
  ultimasRemovidas = [];
  tarefas.forEach((tarefa, indice) => {
    if (tarefa.concluida) {
      ultimasRemovidas.push({ tarefa: tarefa, indice: indice });
    }
  });

  // Anima a saída das concluídas que estão na tela, depois remove de verdade
  elementoLista.querySelectorAll('.tarefa-concluida').forEach((item) => {
    item.classList.add('saindo');
  });

  setTimeout(() => {
    tarefas = tarefas.filter((tarefa) => !tarefa.concluida);
    atualizar();
    limpezaEmAndamento = false;

    const texto = quantidade === 1
      ? '1 tarefa concluída removida'
      : `${quantidade} tarefas concluídas removidas`;
    mostrarAviso(texto, { desfazer: desfazerLimpeza });
  }, 250);
}

// Coloca de volta as tarefas removidas, nas mesmas posições de antes
function desfazerLimpeza() {
  ultimasRemovidas.forEach(({ tarefa, indice }) => {
    const jaExiste = tarefas.some((t) => t.id === tarefa.id);
    if (!jaExiste) {
      tarefas.splice(indice, 0, tarefa); // splice insere na posição indicada
    }
  });
  ultimasRemovidas = [];
  esconderAviso();
  atualizar();
}

// ----- Aviso na parte de baixo da tela (some sozinho depois de 6 segundos) -----
// opcoes.desfazer: função chamada pelo botão "Desfazer" (se não tiver, o botão some)
// opcoes.erro: true deixa o aviso vermelho
function mostrarAviso(texto, opcoes = {}) {
  toastTexto.textContent = texto;
  acaoDesfazer = opcoes.desfazer || null;
  toastDesfazer.hidden = acaoDesfazer === null;
  toast.classList.toggle('toast-erro', opcoes.erro === true);
  toast.hidden = false;

  clearTimeout(temporizadorToast);
  temporizadorToast = setTimeout(esconderAviso, 6000);
}

function esconderAviso() {
  clearTimeout(temporizadorToast);
  toast.hidden = true;
  acaoDesfazer = null; // passou o tempo: não dá mais para desfazer
}

// ===== Backup (exportar e importar .json) =====

// Data local no formato 2026-10-28, para usar em nomes de arquivo
function dataParaNomeDeArquivo() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0'); // getMonth começa em 0
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function exportarBackup() {
  if (tarefas.length === 0) {
    mostrarAviso('Não há tarefas para exportar.', { erro: true });
    return;
  }

  const backup = {
    aplicativo: 'lista-tarefas',
    versao: VERSAO_BACKUP,
    exportadoEm: new Date().toISOString(),
    categorias: categorias, // as suas categorias (nomes e cores) vão junto
    tarefas: tarefas
  };

  // Cria um arquivo na memória e "clica" num link invisível para baixá-lo
  const conteudo = JSON.stringify(backup, null, 2); // null, 2 = texto indentado e legível
  const arquivo = new Blob([conteudo], { type: 'application/json' });
  const endereco = URL.createObjectURL(arquivo);

  const link = document.createElement('a');
  link.href = endereco;
  link.download = `backup-tarefas-${dataParaNomeDeArquivo()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(endereco), 1000); // libera a memória

  const texto = tarefas.length === 1 ? '1 tarefa' : `${tarefas.length} tarefas`;
  mostrarAviso(`Backup com ${texto} exportado.`);
}

// Lê o arquivo escolhido. "async/await" espera a leitura terminar
// sem travar a página (parecido com async/await no Swift).
async function lerArquivoBackup(arquivo) {
  if (!arquivo) {
    return;
  }

  try {
    if (arquivo.size > TAMANHO_MAXIMO_BACKUP) {
      throw new Error('Arquivo grande demais');
    }

    const conteudo = await arquivo.text();
    const dados = JSON.parse(conteudo);

    // Aceita o formato do nosso backup ({ tarefas: [...] }) ou uma lista simples
    const lista = Array.isArray(dados) ? dados : dados && dados.tarefas;
    if (!Array.isArray(lista)) {
      throw new Error('Formato desconhecido');
    }

    // Backups novos trazem as categorias; os antigos não (aí usamos as atuais)
    const categoriasDoBackup = !Array.isArray(dados) ? normalizarCategorias(dados.categorias) : [];
    const idsAceitos = new Set([...categorias, ...categoriasDoBackup].map((c) => c.id));

    const validas = normalizarListaDeTarefas(lista, idsAceitos);
    if (validas.length === 0) {
      mostrarAviso('O arquivo não tem nenhuma tarefa válida.', { erro: true });
      return;
    }

    tarefasParaImportar = validas;
    categoriasParaImportar = categoriasDoBackup;

    // Lista atual vazia: não há o que perguntar, importa direto
    if (tarefas.length === 0) {
      importarTarefas('substituir');
      return;
    }

    const quantidade = validas.length === 1 ? '1 tarefa' : `${validas.length} tarefas`;
    const ignoradas = lista.length - validas.length;
    const textoIgnoradas = ignoradas > 0 ? ` (${ignoradas} ignorada${ignoradas === 1 ? '' : 's'} por estar${ignoradas === 1 ? '' : 'em'} com problema)` : '';
    painelImportarTitulo.textContent = `Backup com ${quantidade}${textoIgnoradas}.`;
    painelImportar.hidden = false;
    botaoImportarJuntar.focus();
  } catch (erro) {
    console.error('Erro ao importar backup:', erro);
    mostrarAviso('Não foi possível ler o arquivo. Escolha um backup .json exportado por este app.', { erro: true });
  } finally {
    // Limpa o campo para permitir escolher o mesmo arquivo de novo
    campoArquivoBackup.value = '';
  }
}

// modo: 'juntar' (mantém as atuais e acrescenta as novas) ou 'substituir'
function importarTarefas(modo) {
  const tarefasAnteriores = tarefas.slice(); // cópias, para poder desfazer
  const categoriasAnteriores = categorias.slice();
  let mensagem;

  if (modo === 'substituir') {
    // Substituir: se o backup tem categorias, elas substituem as atuais também
    if (categoriasParaImportar.length > 0) {
      categorias = categoriasParaImportar;
    }
    tarefas = tarefasParaImportar;
    const n = tarefas.length;
    mensagem = n === 1 ? '1 tarefa importada.' : `${n} tarefas importadas.`;
  } else {
    // Não duplica tarefas que já estão na lista (mesmo id)
    const idsAtuais = new Set(tarefas.map((tarefa) => tarefa.id));
    const novas = tarefasParaImportar.filter((tarefa) => !idsAtuais.has(tarefa.id));

    if (novas.length === 0) {
      tarefasParaImportar = [];
      categoriasParaImportar = [];
      painelImportar.hidden = true;
      mostrarAviso('Nenhuma tarefa nova: todas já estavam na lista.');
      return;
    }

    // Juntar: acrescenta as categorias do backup que você ainda não tem.
    // Se já existe uma com o MESMO NOME, as tarefas vão para a sua (não duplica).
    const trocaDeId = new Map();
    const categoriasNovas = [];
    categoriasParaImportar.forEach((c) => {
      if (categorias.some((atual) => atual.id === c.id)) {
        return; // você já tem essa categoria
      }
      const mesmoNome = categorias.find((atual) => normalizar(atual.nome) === normalizar(c.nome));
      if (mesmoNome) {
        trocaDeId.set(c.id, mesmoNome.id);
      } else if (categorias.length + categoriasNovas.length < MAXIMO_CATEGORIAS) {
        categoriasNovas.push(c);
      }
    });
    categorias = [...categorias, ...categoriasNovas];
    const novasAjustadas = novas.map((t) =>
      trocaDeId.has(t.categoria) ? { ...t, categoria: trocaDeId.get(t.categoria) } : t
    );

    tarefas = [...tarefas, ...novasAjustadas];
    const repetidas = tarefasParaImportar.length - novas.length;
    mensagem = novas.length === 1 ? '1 tarefa adicionada' : `${novas.length} tarefas adicionadas`;
    if (repetidas > 0) {
      mensagem += ` (${repetidas} já estava${repetidas === 1 ? '' : 'm'} na lista)`;
    }
    mensagem += '.';
  }

  tarefasParaImportar = [];
  categoriasParaImportar = [];
  painelImportar.hidden = true;

  // Segurança: toda tarefa precisa apontar para uma categoria que existe
  tarefas = tarefas.map((t) =>
    categorias.some((c) => c.id === t.categoria) ? t : { ...t, categoria: categorias[0].id }
  );

  // Mostra tudo, para as tarefas importadas não ficarem escondidas por filtro ou busca
  filtroAtual = 'todas';
  campoBusca.value = '';
  textoBusca = '';
  botaoLimparBusca.hidden = true;
  buscaAtalho.hidden = false;
  salvarPreferencias();

  salvarTarefas();
  categoriasMudaram(); // salva as categorias e redesenha tudo
  renderizarPainelCategorias();
  mostrarAviso(mensagem, {
    desfazer: () => {
      tarefas = tarefasAnteriores;
      categorias = categoriasAnteriores;
      esconderAviso();
      salvarTarefas();
      categoriasMudaram();
      renderizarPainelCategorias();
    }
  });
}

function cancelarImportacao() {
  tarefasParaImportar = [];
  categoriasParaImportar = [];
  painelImportar.hidden = true;
}

function mudarFiltro(novoFiltro) {
  filtroAtual = novoFiltro;
  salvarPreferencias();
  renderizar();
}

function mudarOrdenacao(novaOrdenacao) {
  if (novaOrdenacao === ordenacaoAtual) {
    return;
  }
  ordenacaoAtual = novaOrdenacao;
  salvarPreferencias();
  renderizar();
}

// Clique no indicador: Baixa → Média → Alta → Baixa...
function trocarPrioridade(id) {
  const ciclo = ['baixa', 'media', 'alta'];
  tarefas = tarefas.map((t) => {
    if (t.id !== id) {
      return t;
    }
    const proxima = ciclo[(ciclo.indexOf(t.prioridade) + 1) % ciclo.length];
    return { ...t, prioridade: proxima };
  });
  idAnimarPrioridade = id;
  atualizar();

  // Mantém o foco no indicador (útil no teclado: Enter várias vezes)
  const botao = elementoLista.querySelector(`.tarefa[data-id="${id}"] .prioridade`);
  if (botao) {
    botao.focus();
  }
}

function mudarBusca(novoTexto) {
  textoBusca = novoTexto;
  botaoLimparBusca.hidden = textoBusca === '';
  buscaAtalho.hidden = textoBusca !== '';
  salvarPreferencias();
  renderizarLista();
}

// ===== Busca =====

// Deixa o texto em minúsculas e sem acentos: "Saúde" → "saude".
// Assim a busca encontra a tarefa digitando com ou sem acento.
function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Devolve só as tarefas que passam no filtro de categoria E na busca,
// já na ordem escolhida ("Minha ordem" ou "Prioridade")
function obterTarefasVisiveis() {
  const busca = normalizar(textoBusca.trim());

  const visiveis = tarefas.filter((tarefa) => {
    const passaNaCategoria = filtroAtual === 'todas' || tarefa.categoria === filtroAtual;
    // A busca olha o texto da tarefa e também o texto dos passos (subtarefas)
    const passaNaBusca = busca === '' ||
      normalizar(tarefa.texto).includes(busca) ||
      tarefa.subtarefas.some((s) => normalizar(s.texto).includes(busca));
    return passaNaCategoria && passaNaBusca;
  });

  if (ordenacaoAtual === 'prioridade') {
    // Pendentes primeiro; dentro de cada grupo, Alta → Média → Baixa.
    // O sort do JavaScript é "estável": empates mantêm a sua ordem manual.
    // (Usamos uma cópia para não bagunçar a ordem manual guardada em "tarefas".)
    return visiveis.slice().sort((a, b) =>
      (Number(a.concluida) - Number(b.concluida)) ||
      (obterPrioridade(a.prioridade).peso - obterPrioridade(b.prioridade).peso)
    );
  }
  return visiveis;
}

// Coloca o texto da tarefa dentro do elemento, destacando o trecho buscado com <mark>.
// Usamos createTextNode (e não innerHTML) para continuar seguro contra XSS.
function preencherComDestaque(elemento, texto) {
  const busca = normalizar(textoBusca.trim());
  const textoNormalizado = normalizar(texto);
  const inicio = busca === '' ? -1 : textoNormalizado.indexOf(busca);

  // Se a remoção de acentos mudou o tamanho do texto, não arrisca destacar errado
  if (inicio === -1 || textoNormalizado.length !== texto.length) {
    elemento.textContent = texto;
    return;
  }

  const fim = inicio + busca.length;
  const destaque = document.createElement('mark');
  destaque.textContent = texto.slice(inicio, fim);

  elemento.append(
    document.createTextNode(texto.slice(0, inicio)),
    destaque,
    document.createTextNode(texto.slice(fim))
  );
}

// Exporta a lista visível (respeitando o filtro) para PDF.
// Usa a janela de impressão do navegador: basta escolher "Salvar como PDF".
function exportarPdf() {
  if (tarefas.length === 0) {
    mostrarAviso('Não há tarefas para exportar.', { erro: true });
    return;
  }

  const agora = new Date();
  const dataFormatada = agora.toLocaleDateString('pt-BR');
  const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const categoria = categorias.find((c) => c.id === filtroAtual);
  const nomeFiltro = categoria ? categoria.nome : 'Todas as categorias';

  const infoBusca = textoBusca.trim() !== '' ? ` · Busca: "${textoBusca.trim()}"` : '';
  const infoOrdem = ordenacaoAtual === 'prioridade' ? ' · Ordenado por prioridade' : '';
  infoImpressao.textContent = `${nomeFiltro}${infoBusca}${infoOrdem} · Exportado em ${dataFormatada} às ${horaFormatada}`;

  // O título da página vira o nome sugerido do arquivo PDF
  const tituloOriginal = document.title;
  document.title = `tarefas-${dataParaNomeDeArquivo()}`;

  // Volta o título ao normal quando a janela de impressão fechar
  window.addEventListener('afterprint', () => {
    document.title = tituloOriginal;
  }, { once: true });

  window.print();
}

// Salva e redesenha a tela
function atualizar() {
  salvarTarefas();
  renderizar();
}

// ===== Renderização (desenha a tela a partir do estado) =====

function renderizar() {
  renderizarFiltros();
  renderizarOrdenacao();
  renderizarLista();
  renderizarContador();

  // As animações já foram aplicadas; limpa para não repetirem
  idAnimarEntrada = null;
  idAnimarConclusao = null;
  idAnimarPrioridade = null;
}

// Marca o botão escolhido em "Ordenar por" e mostra a dica no modo Prioridade
function renderizarOrdenacao() {
  elementoOrdenacao.querySelectorAll('button').forEach((botao) => {
    botao.setAttribute('aria-checked', String(botao.dataset.ordenacao === ordenacaoAtual));
  });
  dicaOrdenacao.hidden = ordenacaoAtual !== 'prioridade';
}

// Indicador de prioridade: 3 barrinhas + nome. É um botão: cada clique troca a prioridade.
function criarIndicadorPrioridade(tarefa) {
  const prioridade = obterPrioridade(tarefa.prioridade);

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = `prioridade prio-${prioridade.id}`;
  if (tarefa.id === idAnimarPrioridade) {
    botao.classList.add('prioridade-mudou');
  }
  botao.title = 'Clique para mudar a prioridade';
  botao.setAttribute('aria-label', `Prioridade ${prioridade.nome}. Clique para mudar`);

  const barras = document.createElement('span');
  barras.className = 'barras';
  barras.setAttribute('aria-hidden', 'true');
  for (let i = 1; i <= 3; i++) {
    const barra = document.createElement('i');
    if (i <= prioridade.barras) {
      barra.className = 'acesa';
    }
    barras.append(barra);
  }

  const nome = document.createElement('span');
  nome.className = 'prioridade-nome';
  nome.textContent = prioridade.nome;

  botao.append(barras, nome);
  botao.addEventListener('click', () => trocarPrioridade(tarefa.id));
  return botao;
}

function renderizarDataHoje() {
  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  elementoDataHoje.textContent = hoje; // ex.: "quarta-feira, 28 de outubro"
}

function renderizarFiltros() {
  elementoFiltros.replaceChildren(); // limpa os botões antigos

  // Botão "Todas" + um botão por categoria
  const opcoes = [{ id: 'todas', nome: 'Todas' }, ...categorias];

  opcoes.forEach((opcao) => {
    const quantidade = opcao.id === 'todas'
      ? tarefas.length
      : tarefas.filter((t) => t.categoria === opcao.id).length;

    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = `filtro cat-${opcao.id}`;
    if (opcao.id === filtroAtual) {
      botao.classList.add('filtro-ativo');
    }

    if (opcao.id !== 'todas') {
      // A cor de cada categoria vai numa "variável CSS" do próprio botão
      botao.style.setProperty('--cor-cat', opcao.cor);
      const ponto = document.createElement('span');
      ponto.className = 'ponto';
      botao.append(ponto);
    }

    botao.append(`${opcao.nome} (${quantidade})`);
    botao.addEventListener('click', () => mudarFiltro(opcao.id));
    elementoFiltros.append(botao);
  });

  // Último botão: abre/fecha o painel de categorias
  const gerenciar = document.createElement('button');
  gerenciar.type = 'button';
  gerenciar.className = 'filtro filtro-gerenciar';
  gerenciar.textContent = '✎ Categorias';
  gerenciar.setAttribute('aria-expanded', String(!painelCategorias.hidden));
  gerenciar.setAttribute('aria-controls', 'painel-categorias');
  gerenciar.addEventListener('click', () => alternarPainelCategorias());
  elementoFiltros.append(gerenciar);
}

// Recria as opções do campo "Categoria" do formulário, mantendo a escolhida
function renderizarSelectCategorias() {
  const escolhida = campoCategoria.value;
  campoCategoria.replaceChildren();
  categorias.forEach((categoria) => {
    const opcao = document.createElement('option');
    opcao.value = categoria.id;
    opcao.textContent = categoria.nome;
    campoCategoria.append(opcao);
  });
  campoCategoria.value = categorias.some((c) => c.id === escolhida) ? escolhida : categorias[0].id;
}

function renderizarLista() {
  elementoLista.replaceChildren();

  const visiveis = obterTarefasVisiveis();

  visiveis.forEach((tarefa) => {
    elementoLista.append(criarItemTarefa(tarefa));
  });

  // Mensagem diferente quando a busca não encontra nada
  if (textoBusca.trim() !== '') {
    mensagemVazia.textContent = `Nenhuma tarefa encontrada para "${textoBusca.trim()}".`;
  } else if (filtroAtual !== 'todas') {
    mensagemVazia.textContent = 'Nenhuma tarefa nesta categoria.';
  } else {
    mensagemVazia.textContent = 'Nenhuma tarefa por aqui. Adicione a primeira acima.';
  }
  mensagemVazia.hidden = visiveis.length > 0;
}

function criarItemTarefa(tarefa) {
  // A tarefa que está sendo editada é desenhada como um formulário
  if (tarefa.id === idEmEdicao) {
    return criarItemEmEdicao(tarefa);
  }

  const item = document.createElement('li');
  item.className = 'tarefa';
  item.dataset.id = tarefa.id; // vira o atributo data-id="..." (usado para reordenar)
  if (tarefa.concluida) {
    item.classList.add('tarefa-concluida');
  }
  if (tarefa.id === idAnimarEntrada) {
    item.classList.add('entrando');
  }
  if (tarefa.id === idAnimarConclusao) {
    item.classList.add('concluindo');
  }

  // Checkbox para concluir
  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'tarefa-check';
  check.checked = tarefa.concluida;
  check.setAttribute('aria-label', `Marcar "${tarefa.texto}" como concluída`);
  check.addEventListener('change', () => alternarConcluida(tarefa.id));

  // Texto (textContent é seguro contra código malicioso)
  // O <span> interno recebe o risco animado
  const texto = document.createElement('div');
  texto.className = 'tarefa-texto';
  const textoInterno = document.createElement('span');
  preencherComDestaque(textoInterno, tarefa.texto);
  texto.append(textoInterno);
  texto.title = 'Clique duas vezes para editar';
  texto.addEventListener('dblclick', () => iniciarEdicao(tarefa.id));

  // Etiqueta de categoria (a cor vem da categoria, numa variável CSS)
  const categoria = obterCategoria(tarefa.categoria);
  const etiqueta = document.createElement('span');
  etiqueta.className = 'etiqueta';
  etiqueta.style.setProperty('--cor-cat', categoria.cor);
  etiqueta.textContent = categoria.nome;

  // Botão excluir
  const botaoExcluir = document.createElement('button');
  botaoExcluir.type = 'button';
  botaoExcluir.className = 'botao-excluir';
  botaoExcluir.textContent = '✕';
  botaoExcluir.setAttribute('aria-label', `Excluir "${tarefa.texto}"`);
  botaoExcluir.addEventListener('click', () => {
    // Primeiro anima a saída (0,25 s), depois remove de verdade.
    // Usamos um tempo fixo em vez de esperar o fim da animação: se a lista for
    // redesenhada no meio, a exclusão acontece do mesmo jeito.
    item.classList.add('saindo');
    setTimeout(() => excluirTarefa(tarefa.id), 250);
  });

  // Botão editar (no celular é o jeito principal, já que não há duplo clique confiável)
  const botaoEditar = document.createElement('button');
  botaoEditar.type = 'button';
  botaoEditar.className = 'botao-editar';
  botaoEditar.textContent = '✎';
  botaoEditar.setAttribute('aria-label', `Editar "${tarefa.texto}"`);
  botaoEditar.addEventListener('click', () => iniciarEdicao(tarefa.id));

  // Alça para arrastar (mouse ou dedo) e mover com as setas do teclado
  const alca = document.createElement('button');
  alca.type = 'button';
  alca.className = 'alca-arrastar';
  alca.title = 'Arraste para mudar a ordem (ou use as setas ↑ ↓)';
  alca.setAttribute('aria-label', `Mover "${tarefa.texto}". Use as setas para cima e para baixo`);
  alca.addEventListener('pointerdown', (evento) => iniciarArraste(evento, item));
  alca.addEventListener('keydown', (evento) => {
    if (evento.key === 'ArrowUp' || evento.key === 'ArrowDown') {
      evento.preventDefault(); // não rola a página
      moverComTeclado(tarefa.id, evento.key === 'ArrowUp' ? -1 : 1);
    }
  });

  // Prioridade + categoria + passos ficam juntos (no celular, numa linha abaixo do texto)
  const meta = document.createElement('div');
  meta.className = 'tarefa-meta';
  meta.append(criarIndicadorPrioridade(tarefa), etiqueta, criarResumoSubtarefas(tarefa));

  const partes = [check, texto, meta, botaoEditar, botaoExcluir];
  // A alça de arrastar só aparece em "Minha ordem" (no modo Prioridade a ordem é automática)
  if (ordenacaoAtual === 'manual') {
    partes.unshift(alca);
  }
  item.append(...partes); // "..." espalha o array como vários argumentos

  // Lista de passos: criada se estiver aberta OU se houver passos
  // (fechada, fica escondida na tela, mas aparece no PDF)
  const expandida = tarefasExpandidas.has(tarefa.id);
  if (expandida || tarefa.subtarefas.length > 0) {
    const painel = criarPainelSubtarefas(tarefa);
    painel.hidden = !expandida;
    item.append(painel);
  }
  if (expandida) {
    item.classList.add('expandida');
  }
  return item;
}

// ===== Subtarefas (passos dentro de uma tarefa) =====

// Botão "+ Passos" (sem passos) ou "2/3" com uma minibarra de progresso
function criarResumoSubtarefas(tarefa) {
  const total = tarefa.subtarefas.length;
  const feitas = tarefa.subtarefas.filter((s) => s.concluida).length;
  const expandida = tarefasExpandidas.has(tarefa.id);

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'subtarefas-resumo';
  botao.setAttribute('aria-expanded', String(expandida));
  botao.setAttribute('aria-controls', `subtarefas-${tarefa.id}`);

  if (total === 0) {
    botao.classList.add('sem-passos');
    botao.textContent = '+ Passos';
    botao.setAttribute('aria-label', `Adicionar passos à tarefa "${tarefa.texto}"`);
  } else {
    if (feitas === total) {
      botao.classList.add('completo');
    }
    const barra = document.createElement('span');
    barra.className = 'minibarra';
    barra.setAttribute('aria-hidden', 'true');
    // A largura da parte preenchida vai numa variável CSS (0% a 100%)
    barra.style.setProperty('--progresso', `${Math.round((feitas / total) * 100)}%`);
    botao.append(barra, `${feitas}/${total}`);
    botao.setAttribute('aria-label',
      `Passos: ${feitas} de ${total} concluídos. Clique para ${expandida ? 'esconder' : 'mostrar'}`);
  }

  botao.addEventListener('click', () => alternarSubtarefas(tarefa.id));
  return botao;
}

function criarPainelSubtarefas(tarefa) {
  const painel = document.createElement('div');
  painel.className = 'subtarefas';
  painel.id = `subtarefas-${tarefa.id}`;

  const lista = document.createElement('ul');
  lista.className = 'subtarefas-lista';

  tarefa.subtarefas.forEach((sub) => {
    const linha = document.createElement('li');
    linha.className = 'subtarefa';
    if (sub.concluida) {
      linha.classList.add('feita');
    }

    const marcar = document.createElement('input');
    marcar.type = 'checkbox';
    marcar.id = `passo-${tarefa.id}-${sub.id}`;
    marcar.className = 'subtarefa-check';
    marcar.checked = sub.concluida;
    marcar.dataset.sub = sub.id;
    marcar.addEventListener('change', () => alternarSubtarefa(tarefa.id, sub.id));

    // O texto é um <label> ligado à caixinha: tocar no texto também marca o passo
    const texto = document.createElement('label');
    texto.className = 'subtarefa-texto';
    texto.htmlFor = marcar.id;
    preencherComDestaque(texto, sub.texto); // destaca a busca também nos passos

    const excluir = document.createElement('button');
    excluir.type = 'button';
    excluir.className = 'subtarefa-excluir';
    excluir.textContent = '✕';
    excluir.setAttribute('aria-label', `Excluir o passo "${sub.texto}"`);
    excluir.addEventListener('click', () => excluirSubtarefa(tarefa.id, sub.id));

    linha.append(marcar, texto, excluir);
    lista.append(linha);
  });

  // Campo para adicionar um passo novo
  const form = document.createElement('form');
  form.className = 'subtarefa-nova';

  const rotulo = document.createElement('label');
  rotulo.className = 'visualmente-oculto';
  rotulo.htmlFor = `campo-passo-${tarefa.id}`;
  rotulo.textContent = `Novo passo para "${tarefa.texto}"`;

  const campo = document.createElement('input');
  campo.type = 'text';
  campo.id = `campo-passo-${tarefa.id}`;
  campo.className = 'campo-passo';
  campo.placeholder = 'Adicionar passo…';
  campo.maxLength = 100;
  campo.autocomplete = 'off';

  const adicionar = document.createElement('button');
  adicionar.type = 'submit';
  adicionar.className = 'botao-secundario';
  adicionar.textContent = 'Adicionar';

  const cheio = tarefa.subtarefas.length >= MAXIMO_SUBTAREFAS;
  campo.disabled = cheio;
  adicionar.disabled = cheio;

  form.append(rotulo, campo, adicionar);
  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    adicionarSubtarefa(tarefa.id, campo.value);
  });
  campo.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      alternarSubtarefas(tarefa.id); // Esc fecha a lista de passos
    }
  });

  painel.append(lista, form);
  return painel;
}

// Abre/fecha a lista de passos de uma tarefa
function alternarSubtarefas(id) {
  const abrir = !tarefasExpandidas.has(id);
  if (abrir) {
    tarefasExpandidas.add(id);
  } else {
    tarefasExpandidas.delete(id);
  }
  renderizarLista();

  // Ao abrir, coloca o cursor no campo "Adicionar passo"; ao fechar, volta para o botão
  const seletor = abrir ? `#campo-passo-${id}` : `.tarefa[data-id="${id}"] .subtarefas-resumo`;
  const alvo = elementoLista.querySelector(seletor);
  if (alvo) {
    alvo.focus();
  }
}

// Troca as subtarefas de UMA tarefa, salvando e redesenhando
function mudarSubtarefas(id, transformar) {
  tarefas = tarefas.map((t) => (t.id === id ? { ...t, subtarefas: transformar(t.subtarefas) } : t));
  atualizar();
}

function adicionarSubtarefa(id, textoDigitado) {
  const texto = textoDigitado.trim().slice(0, 100);
  if (texto === '') {
    return;
  }
  mudarSubtarefas(id, (subs) => {
    // id do passo: o maior id atual + 1 (únicos dentro da tarefa)
    const novoId = subs.reduce((maior, s) => Math.max(maior, s.id), 0) + 1;
    return [...subs, { id: novoId, texto: texto, concluida: false }];
  });
  // Continua no campo, pronto para digitar o próximo passo
  const campo = document.getElementById(`campo-passo-${id}`);
  if (campo) {
    campo.focus();
  }
}

function alternarSubtarefa(id, idPasso) {
  mudarSubtarefas(id, (subs) =>
    subs.map((s) => (s.id === idPasso ? { ...s, concluida: !s.concluida } : s))
  );
  // Mantém o foco na caixinha (útil no teclado: Espaço várias vezes)
  const caixa = elementoLista.querySelector(`#subtarefas-${id} [data-sub="${idPasso}"]`);
  if (caixa) {
    caixa.focus();
  }
}

function excluirSubtarefa(id, idPasso) {
  const tarefa = tarefas.find((t) => t.id === id);
  const posicao = tarefa.subtarefas.findIndex((s) => s.id === idPasso);
  const removida = tarefa.subtarefas[posicao];

  mudarSubtarefas(id, (subs) => subs.filter((s) => s.id !== idPasso));
  mostrarAviso('Passo excluído.', {
    desfazer: () => {
      esconderAviso();
      mudarSubtarefas(id, (subs) => {
        const copia = subs.slice();
        copia.splice(posicao, 0, removida); // volta para a mesma posição
        return copia;
      });
    }
  });
}

// ===== Painel de categorias =====

function alternarPainelCategorias(abrir = painelCategorias.hidden) {
  painelCategorias.hidden = !abrir;
  idCategoriaComPaletaAberta = null;
  idCategoriaExcluindo = null;
  renderizarFiltros(); // atualiza o aria-expanded do botão "✎ Categorias"
  renderizarPainelCategorias();
  if (abrir) {
    campoNovaCategoria.focus();
  } else {
    elementoFiltros.querySelector('.filtro-gerenciar').focus();
  }
}

// Cria os botões redondos de cor. aoEscolher(cor) é chamado no clique.
function criarBotoesPaleta(corEscolhida, aoEscolher) {
  return CORES.map((cor) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'cor-amostra';
    botao.style.setProperty('--amostra', cor.valor);
    botao.setAttribute('role', 'radio');
    botao.setAttribute('aria-checked', String(cor.valor === corEscolhida));
    botao.setAttribute('aria-label', cor.nome);
    botao.title = cor.nome;
    botao.addEventListener('click', () => aoEscolher(cor.valor));
    return botao;
  });
}

function nomeDaCor(valor) {
  const cor = CORES.find((c) => c.valor === valor);
  return cor ? cor.nome : valor;
}

function renderizarPainelCategorias() {
  if (painelCategorias.hidden) {
    return;
  }
  listaCategorias.replaceChildren(...categorias.map(criarLinhaCategoria));

  paletaNovaCategoria.replaceChildren(...criarBotoesPaleta(corNovaCategoria, (cor) => {
    corNovaCategoria = cor;
    renderizarPainelCategorias();
    paletaNovaCategoria.querySelector('[aria-checked="true"]').focus();
  }));

  const cheio = categorias.length >= MAXIMO_CATEGORIAS;
  campoNovaCategoria.disabled = cheio;
  botaoNovaCategoria.disabled = cheio;
  campoNovaCategoria.placeholder = cheio ? `Limite de ${MAXIMO_CATEGORIAS} categorias` : 'Nova categoria';
}

function criarLinhaCategoria(categoria) {
  const linha = document.createElement('li');
  linha.className = 'linha-categoria';
  linha.dataset.id = categoria.id;
  linha.style.setProperty('--cor-cat', categoria.cor);
  const quantidade = contarTarefasDaCategoria(categoria.id);

  // Confirmação de exclusão: "N tarefas usam X. Mover para: [..]"
  if (idCategoriaExcluindo === categoria.id) {
    linha.classList.add('excluindo');

    const pergunta = document.createElement('p');
    pergunta.textContent = quantidade === 1
      ? `1 tarefa usa "${categoria.nome}". Mover para:`
      : `${quantidade} tarefas usam "${categoria.nome}". Mover para:`;

    const destino = document.createElement('select');
    destino.className = 'campo-select';
    destino.setAttribute('aria-label', 'Categoria para onde as tarefas vão');
    categorias.filter((c) => c.id !== categoria.id).forEach((c) => {
      const opcao = document.createElement('option');
      opcao.value = c.id;
      opcao.textContent = c.nome;
      destino.append(opcao);
    });

    const confirmar = document.createElement('button');
    confirmar.type = 'button';
    confirmar.className = 'botao-perigo';
    confirmar.textContent = 'Excluir e mover';
    confirmar.addEventListener('click', () => excluirCategoria(categoria.id, destino.value));

    const cancelar = document.createElement('button');
    cancelar.type = 'button';
    cancelar.className = 'botao-texto';
    cancelar.textContent = 'Cancelar';
    cancelar.addEventListener('click', () => {
      idCategoriaExcluindo = null;
      renderizarPainelCategorias();
    });

    linha.append(pergunta, destino, confirmar, cancelar);
    return linha;
  }

  // Bolinha da cor atual: abre/fecha a paleta
  const corAtual = document.createElement('button');
  corAtual.type = 'button';
  corAtual.className = 'cor-atual';
  corAtual.setAttribute('aria-expanded', String(idCategoriaComPaletaAberta === categoria.id));
  corAtual.setAttribute('aria-label', `Cor de ${categoria.nome}: ${nomeDaCor(categoria.cor)}. Clique para mudar`);
  corAtual.addEventListener('click', () => {
    idCategoriaComPaletaAberta = idCategoriaComPaletaAberta === categoria.id ? null : categoria.id;
    renderizarPainelCategorias();
    const foco = listaCategorias.querySelector(`[data-id="${categoria.id}"] .cor-atual`);
    if (foco) {
      foco.focus();
    }
  });

  // Nome: editável direto no campo (salva ao sair do campo ou com Enter)
  const nome = document.createElement('input');
  nome.type = 'text';
  nome.className = 'nome-categoria';
  nome.value = categoria.nome;
  nome.maxLength = 20;
  nome.setAttribute('aria-label', `Nome da categoria ${categoria.nome}`);
  nome.addEventListener('change', () => renomearCategoria(categoria.id, nome));
  nome.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
      evento.preventDefault();
      nome.blur(); // dispara o "change"
    } else if (evento.key === 'Escape') {
      // Desiste da mudança: volta ao nome ATUAL (a categoria pode ter sido
      // renomeada depois que esta linha foi desenhada, então buscamos de novo)
      const atual = categorias.find((c) => c.id === categoria.id);
      nome.value = atual ? atual.nome : nome.value;
      nome.blur();
    }
  });

  const contagem = document.createElement('span');
  contagem.className = 'contagem-categoria';
  contagem.textContent = quantidade === 1 ? '1 tarefa' : `${quantidade} tarefas`;

  const excluir = document.createElement('button');
  excluir.type = 'button';
  excluir.className = 'botao-excluir';
  excluir.textContent = '✕';
  excluir.setAttribute('aria-label', `Excluir a categoria ${categoria.nome}`);
  if (categorias.length === 1) {
    excluir.disabled = true;
    excluir.title = 'Precisa existir pelo menos uma categoria';
  }
  excluir.addEventListener('click', () => pedirExclusaoCategoria(categoria.id));

  linha.append(corAtual, nome, contagem, excluir);

  // Paleta (aparece embaixo da linha quando a bolinha é clicada)
  if (idCategoriaComPaletaAberta === categoria.id) {
    const paleta = document.createElement('div');
    paleta.className = 'paleta';
    paleta.setAttribute('role', 'radiogroup');
    paleta.setAttribute('aria-label', `Cor de ${categoria.nome}`);
    paleta.append(...criarBotoesPaleta(categoria.cor, (cor) => mudarCorCategoria(categoria.id, cor)));
    linha.append(paleta);
  }
  return linha;
}

// Confere um nome de categoria. Devolve a mensagem de erro, ou null se estiver tudo certo.
function validarNomeCategoria(nome, idIgnorado) {
  if (nome === '') {
    return 'O nome da categoria não pode ficar vazio.';
  }
  const repetida = categorias.find((c) => c.id !== idIgnorado && normalizar(c.nome) === normalizar(nome));
  if (repetida) {
    return `Já existe uma categoria chamada "${repetida.nome}".`;
  }
  return null;
}

// Depois de mudar categorias: salva e redesenha o que depende delas
function categoriasMudaram() {
  salvarCategorias();
  renderizarSelectCategorias();
  if (filtroAtual !== 'todas' && !categorias.some((c) => c.id === filtroAtual)) {
    filtroAtual = 'todas';
    salvarPreferencias();
  }
  renderizar();
}

function renomearCategoria(id, campo) {
  const categoria = categorias.find((c) => c.id === id);
  const nome = campo.value.trim().slice(0, 20);
  if (!categoria || nome === categoria.nome) {
    campo.value = categoria ? categoria.nome : campo.value;
    return;
  }
  const erro = validarNomeCategoria(nome, id);
  if (erro) {
    campo.value = categoria.nome; // volta o nome antigo
    mostrarAviso(erro, { erro: true });
    return;
  }
  categorias = categorias.map((c) => (c.id === id ? { ...c, nome: nome } : c));
  // Não redesenha o painel aqui: assim o foco continua onde você clicou/tabulou
  categoriasMudaram();
}

function mudarCorCategoria(id, cor) {
  categorias = categorias.map((c) => (c.id === id ? { ...c, cor: cor } : c));
  idCategoriaComPaletaAberta = null;
  categoriasMudaram();
  renderizarPainelCategorias();
  const foco = listaCategorias.querySelector(`[data-id="${id}"] .cor-atual`);
  if (foco) {
    foco.focus();
  }
}

function adicionarCategoria() {
  const nome = campoNovaCategoria.value.trim().slice(0, 20);
  if (categorias.length >= MAXIMO_CATEGORIAS) {
    return;
  }
  const erro = validarNomeCategoria(nome, null);
  if (erro) {
    mostrarAviso(erro, { erro: true });
    campoNovaCategoria.focus();
    return;
  }
  categorias = [...categorias, { id: `cat-${Date.now()}`, nome: nome, cor: corNovaCategoria }];
  campoNovaCategoria.value = '';
  corNovaCategoria = proximaCorLivre();
  categoriasMudaram();
  renderizarPainelCategorias();
  mostrarAviso(`Categoria "${nome}" criada.`);
  campoNovaCategoria.focus();
}

function pedirExclusaoCategoria(id) {
  if (categorias.length === 1) {
    return;
  }
  if (contarTarefasDaCategoria(id) === 0) {
    excluirCategoria(id, null); // nenhuma tarefa usa: exclui direto (com "Desfazer")
    return;
  }
  idCategoriaExcluindo = id;
  idCategoriaComPaletaAberta = null;
  renderizarPainelCategorias();
  const campo = listaCategorias.querySelector(`[data-id="${id}"] select`);
  if (campo) {
    campo.focus();
  }
}

// Exclui a categoria e move as tarefas dela para "idDestino"
function excluirCategoria(id, idDestino) {
  const posicao = categorias.findIndex((c) => c.id === id);
  const removida = categorias[posicao];
  const destino = categorias.find((c) => c.id === idDestino);
  const idsMovidas = new Set(tarefas.filter((t) => t.categoria === id).map((t) => t.id));

  categorias = categorias.filter((c) => c.id !== id);
  if (idsMovidas.size > 0) {
    tarefas = tarefas.map((t) => (idsMovidas.has(t.id) ? { ...t, categoria: destino.id } : t));
    salvarTarefas();
  }
  idCategoriaExcluindo = null;
  categoriasMudaram();
  renderizarPainelCategorias();

  const mensagem = idsMovidas.size === 0
    ? `Categoria "${removida.nome}" excluída.`
    : `Categoria "${removida.nome}" excluída. ${idsMovidas.size === 1 ? '1 tarefa movida' : `${idsMovidas.size} tarefas movidas`} para "${destino.nome}".`;

  mostrarAviso(mensagem, {
    desfazer: () => {
      // Devolve a categoria à mesma posição e as tarefas para ela
      const copia = categorias.slice();
      copia.splice(posicao, 0, removida);
      categorias = copia;
      tarefas = tarefas.map((t) => (idsMovidas.has(t.id) ? { ...t, categoria: removida.id } : t));
      salvarTarefas();
      esconderAviso();
      categoriasMudaram();
      renderizarPainelCategorias();
    }
  });
}

// ===== Reordenar arrastando =====
// Ideia: enquanto você arrasta, o próprio <li> vai trocando de lugar com os vizinhos
// na tela. Ao soltar, lemos a nova ordem da tela e aplicamos no array "tarefas".

function iniciarArraste(evento, item) {
  // Só o botão esquerdo do mouse (no toque, "button" é 0 também)
  if (evento.button !== 0 || arraste) {
    return;
  }
  evento.preventDefault(); // evita selecionar texto

  // Se outra tarefa estiver em edição, salva primeiro. Salvar redesenha a lista,
  // então depois pegamos de novo a tarefa (agora redesenhada) que vai ser arrastada.
  if (idEmEdicao !== null) {
    const id = item.dataset.id;
    const campoAtivo = document.activeElement;
    if (campoAtivo && campoAtivo.closest('.tarefa-edicao')) {
      campoAtivo.blur(); // dispara o "clicar fora salva"
    } else {
      idEmEdicao = null;
      renderizar();
    }
    item = elementoLista.querySelector(`.tarefa[data-id="${id}"]`);
    if (!item) {
      return; // a tarefa ficou oculta (ex.: mudou de categoria com filtro ativo)
    }
  }

  const alca = item.querySelector('.alca-arrastar');
  // "Captura" o ponteiro: os próximos movimentos chegam à alça
  // mesmo que o dedo/mouse saia de cima dela.
  alca.setPointerCapture(evento.pointerId);

  arraste = {
    item: item,
    alca: alca,
    ponteiroId: evento.pointerId,
    y: evento.clientY,
    // Distância entre o ponto onde você pegou e o topo da tarefa
    deslocamento: evento.clientY - item.getBoundingClientRect().top,
    ordemAntes: tarefas.map((t) => t.id), // para o "Desfazer"
    quadro: null
  };

  item.classList.add('arrastando');
  document.body.classList.add('arrastando-tarefa');
  if (navigator.vibrate) {
    navigator.vibrate(10); // pequena vibração no Android
  }

  alca.addEventListener('pointermove', moverArraste);
  alca.addEventListener('pointerup', terminarArraste);
  alca.addEventListener('pointercancel', terminarArraste);
  // Proteção: se o navegador "soltar" o ponteiro por outro motivo, encerra o arraste
  alca.addEventListener('lostpointercapture', terminarArraste);

  arraste.quadro = requestAnimationFrame(passoDoArraste);
}

function moverArraste(evento) {
  if (arraste && evento.pointerId === arraste.ponteiroId) {
    arraste.y = evento.clientY; // só guarda a posição; quem desenha é o passoDoArraste
  }
}

// Posição vertical de um elemento na tela, ignorando animações (transform).
// offsetTop é a posição "de layout"; somamos o topo da lista na tela.
function topoNaTela(elemento) {
  return elementoLista.getBoundingClientRect().top + (elemento.offsetTop - elementoLista.offsetTop);
}

function centroNaTela(elemento) {
  return topoNaTela(elemento) + elemento.offsetHeight / 2;
}

// Roda ~60 vezes por segundo enquanto você arrasta
function passoDoArraste() {
  if (!arraste) {
    return;
  }
  const { item, y } = arraste;

  // 1. Rolagem automática perto das bordas da tela (importante no celular)
  const margem = 70;
  if (y < margem) {
    window.scrollBy(0, -Math.ceil((margem - y) / 5));
  } else if (y > window.innerHeight - margem) {
    window.scrollBy(0, Math.ceil((y - (window.innerHeight - margem)) / 5));
  }

  // 2. Troca de lugar com o vizinho quando o ponteiro passa do meio dele.
  // Importante: movemos sempre o VIZINHO, nunca a tarefa arrastada. Mover o elemento
  // arrastado na página faz o navegador "soltar" o ponteiro no meio do arraste.
  let trocou = true;
  while (trocou) {
    trocou = false;
    const anterior = item.previousElementSibling;
    const proximo = item.nextElementSibling;
    if (anterior && y < centroNaTela(anterior)) {
      animarTroca(anterior, () => item.after(anterior)); // o de cima passa para baixo
      trocou = true;
    } else if (proximo && y > centroNaTela(proximo)) {
      animarTroca(proximo, () => item.before(proximo)); // o de baixo passa para cima
      trocou = true;
    }
  }

  // 3. A tarefa arrastada acompanha o ponteiro
  const deslocamentoY = y - arraste.deslocamento - topoNaTela(item);
  item.style.transform = `translateY(${deslocamentoY}px) scale(1.02)`;

  arraste.quadro = requestAnimationFrame(passoDoArraste);
}

// Faz o vizinho "deslizar" até o novo lugar em vez de pular (técnica FLIP)
function animarTroca(vizinho, trocar) {
  const antes = vizinho.offsetTop;
  trocar();
  const diferenca = antes - vizinho.offsetTop;
  if (diferenca === 0) {
    return;
  }
  vizinho.style.transition = 'none';
  vizinho.style.transform = `translateY(${diferenca}px)`;
  requestAnimationFrame(() => {
    vizinho.style.transition = 'transform 0.15s ease';
    vizinho.style.transform = '';
  });
}

function terminarArraste(evento) {
  if (!arraste || evento.pointerId !== arraste.ponteiroId) {
    return;
  }
  cancelAnimationFrame(arraste.quadro);

  const { item, alca, ordemAntes } = arraste;
  alca.removeEventListener('pointermove', moverArraste);
  alca.removeEventListener('pointerup', terminarArraste);
  alca.removeEventListener('pointercancel', terminarArraste);
  alca.removeEventListener('lostpointercapture', terminarArraste);

  item.classList.remove('arrastando');
  item.style.transform = '';
  document.body.classList.remove('arrastando-tarefa');
  arraste = null;

  aplicarOrdemDaTela(ordemAntes);
}

// Lê a ordem das tarefas na tela e aplica no array.
// Com filtro ou busca ativos, as tarefas escondidas continuam onde estavam:
// as visíveis só trocam de lugar entre si.
function aplicarOrdemDaTela(ordemAntes) {
  const idsNaTela = [...elementoLista.querySelectorAll('.tarefa[data-id]')].map((li) => Number(li.dataset.id));
  const naTela = new Set(idsNaTela);
  const porId = new Map(tarefas.map((t) => [t.id, t]));

  let k = 0;
  const novaOrdem = tarefas.map((t) => (naTela.has(t.id) ? porId.get(idsNaTela[k++]) : t));
  const mudou = novaOrdem.some((t, i) => t.id !== tarefas[i].id);

  if (!mudou) {
    renderizar(); // nada mudou: só redesenha (fecha uma edição pendente, por exemplo)
    return;
  }

  tarefas = novaOrdem;
  atualizar();
  mostrarAviso('Ordem atualizada.', {
    desfazer: () => restaurarOrdem(ordemAntes)
  });
}

function restaurarOrdem(ordemDeIds) {
  const porId = new Map(tarefas.map((t) => [t.id, t]));
  const naOrdemAntiga = ordemDeIds.filter((id) => porId.has(id)).map((id) => porId.get(id));
  const novasDepois = tarefas.filter((t) => !ordemDeIds.includes(t.id)); // criadas depois do arraste
  tarefas = [...novasDepois, ...naOrdemAntiga];
  esconderAviso();
  atualizar();
}

// Setas ↑ ↓ com a alça em foco: troca com a tarefa visível de cima ou de baixo
function moverComTeclado(id, direcao) {
  const visiveis = obterTarefasVisiveis();
  const posicao = visiveis.findIndex((t) => t.id === id);
  const vizinha = visiveis[posicao + direcao];
  if (posicao === -1 || !vizinha) {
    return; // já está no topo ou no fim
  }

  const a = tarefas.findIndex((t) => t.id === id);
  const b = tarefas.findIndex((t) => t.id === vizinha.id);
  const copia = tarefas.slice();
  [copia[a], copia[b]] = [copia[b], copia[a]]; // troca as duas de lugar
  tarefas = copia;
  atualizar();

  // Mantém o foco na alça da tarefa que foi movida, para poder apertar a seta de novo
  const alca = elementoLista.querySelector(`.tarefa[data-id="${id}"] .alca-arrastar`);
  if (alca) {
    alca.focus();
  }
}

// ===== Edição de tarefa =====

// Desenha a tarefa como um pequeno formulário: texto + categoria + Salvar/Cancelar
function criarItemEmEdicao(tarefa) {
  const item = document.createElement('li');
  item.className = 'tarefa editando';
  item.dataset.id = tarefa.id;

  const formularioEdicao = document.createElement('form');
  formularioEdicao.className = 'tarefa-edicao';

  // Campo de texto
  const rotuloTexto = document.createElement('label');
  rotuloTexto.className = 'visualmente-oculto';
  rotuloTexto.htmlFor = 'campo-edicao';
  rotuloTexto.textContent = 'Texto da tarefa';

  const campoEdicao = document.createElement('input');
  campoEdicao.type = 'text';
  campoEdicao.id = 'campo-edicao';
  campoEdicao.className = 'campo-edicao';
  campoEdicao.value = tarefa.texto;
  campoEdicao.maxLength = 120;
  campoEdicao.autocomplete = 'off';

  // Categoria
  const rotuloCategoria = document.createElement('label');
  rotuloCategoria.className = 'visualmente-oculto';
  rotuloCategoria.htmlFor = 'campo-edicao-categoria';
  rotuloCategoria.textContent = 'Categoria da tarefa';

  const campoCategoriaEdicao = document.createElement('select');
  campoCategoriaEdicao.id = 'campo-edicao-categoria';
  campoCategoriaEdicao.className = 'campo-select';
  categorias.forEach((categoria) => {
    const opcao = document.createElement('option');
    opcao.value = categoria.id;
    opcao.textContent = categoria.nome;
    campoCategoriaEdicao.append(opcao);
  });
  campoCategoriaEdicao.value = tarefa.categoria;

  // Prioridade
  const rotuloPrioridade = document.createElement('label');
  rotuloPrioridade.className = 'visualmente-oculto';
  rotuloPrioridade.htmlFor = 'campo-edicao-prioridade';
  rotuloPrioridade.textContent = 'Prioridade da tarefa';

  const campoPrioridadeEdicao = document.createElement('select');
  campoPrioridadeEdicao.id = 'campo-edicao-prioridade';
  campoPrioridadeEdicao.className = 'campo-select';
  PRIORIDADES.forEach((prioridade) => {
    const opcao = document.createElement('option');
    opcao.value = prioridade.id;
    opcao.textContent = prioridade.nome;
    campoPrioridadeEdicao.append(opcao);
  });
  campoPrioridadeEdicao.value = obterPrioridade(tarefa.prioridade).id;

  // Botões
  const botoes = document.createElement('div');
  botoes.className = 'edicao-botoes';

  const botaoSalvar = document.createElement('button');
  botaoSalvar.type = 'submit'; // Enter no campo de texto também "clica" aqui
  botaoSalvar.className = 'botao-salvar';
  botaoSalvar.textContent = 'Salvar';

  const botaoCancelar = document.createElement('button');
  botaoCancelar.type = 'button';
  botaoCancelar.className = 'botao-texto';
  botaoCancelar.textContent = 'Cancelar';

  botoes.append(botaoSalvar, botaoCancelar);
  formularioEdicao.append(
    rotuloTexto, campoEdicao,
    rotuloCategoria, campoCategoriaEdicao,
    rotuloPrioridade, campoPrioridadeEdicao,
    botoes
  );
  item.append(formularioEdicao);

  const salvar = (opcoes) =>
    salvarEdicao(tarefa.id, {
      texto: campoEdicao.value,
      categoria: campoCategoriaEdicao.value,
      prioridade: campoPrioridadeEdicao.value
    }, opcoes);

  // Enter (ou o botão Salvar) salva
  formularioEdicao.addEventListener('submit', (evento) => {
    evento.preventDefault();
    salvar();
  });

  botaoCancelar.addEventListener('click', cancelarEdicao);

  // No Safari (iPhone/Mac) botões não recebem foco ao clicar. Sem isto, o campo
  // perderia o foco antes do clique e o "clicar fora salva" agiria no lugar do Cancelar.
  [botaoSalvar, botaoCancelar].forEach((botao) => {
    botao.addEventListener('mousedown', (evento) => evento.preventDefault());
  });

  // Esc cancela
  formularioEdicao.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      evento.preventDefault();
      cancelarEdicao();
    }
  });

  // Clicar fora do formulário também salva.
  // "relatedTarget" é o elemento que vai receber o foco a seguir.
  formularioEdicao.addEventListener('focusout', (evento) => {
    const destino = evento.relatedTarget;
    if (formularioEdicao.contains(destino)) {
      return; // o foco só mudou de um campo para outro dentro da edição
    }

    // Se o foco foi para outro botão ou campo (ex.: o ✎ de outra tarefa),
    // salva os dados agora, mas só redesenha depois, para o clique nele não se perder.
    const foiParaOutroControle = Boolean(destino && destino.closest('button, input, select, a'));
    salvar({ adiarDesenho: foiParaOutroControle, item: item });
  });

  return item;
}

function iniciarEdicao(id) {
  idEmEdicao = id;
  renderizar(); // completo: se a edição anterior mudou a categoria, os filtros se atualizam

  // Coloca o cursor no campo, com o texto selecionado
  const campo = document.getElementById('campo-edicao');
  if (campo) {
    campo.focus();
    campo.select();
  }
}

// opcoes.adiarDesenho: redesenha a tela um pouco depois (ver o "focusout" acima)
// novos: { texto, categoria, prioridade } vindos do formulário de edição
function salvarEdicao(id, novos, opcoes = {}) {
  // Evita salvar duas vezes (ex.: Enter e depois o "clicar fora")
  if (idEmEdicao !== id) {
    return;
  }
  idEmEdicao = null;

  const desenhar = () => {
    if (!opcoes.adiarDesenho) {
      renderizar();
      return;
    }
    // O clique no outro botão normalmente já redesenha a tela.
    // Só se isso NÃO aconteceu (o formulário antigo ainda está na tela) redesenhamos aqui;
    // redesenhar sempre poderia "roubar" um clique que a pessoa está fazendo.
    setTimeout(() => {
      // Durante um arraste não redesenha: o fim do arraste já redesenha tudo
      if (opcoes.item && opcoes.item.isConnected && !arraste) {
        renderizar();
      }
    }, 300);
  };

  const tarefa = tarefas.find((t) => t.id === id);
  const texto = novos.texto.trim().slice(0, 120);
  const categoria = novos.categoria;
  const prioridade = obterPrioridade(novos.prioridade).id;

  if (!tarefa) {
    desenhar();
    return;
  }

  if (texto === '') {
    desenhar();
    mostrarAviso('A tarefa não pode ficar sem texto. Nada foi alterado.', { erro: true });
    return;
  }

  // Nada mudou: só sai do modo de edição
  if (texto === tarefa.texto && categoria === tarefa.categoria && prioridade === tarefa.prioridade) {
    desenhar();
    return;
  }

  const valoresAnteriores = { texto: tarefa.texto, categoria: tarefa.categoria, prioridade: tarefa.prioridade };
  tarefas = tarefas.map((t) =>
    t.id === id ? { ...t, texto: texto, categoria: categoria, prioridade: prioridade } : t
  );
  salvarTarefas();
  desenhar();

  // Avisa se a tarefa sumiu da tela por causa do filtro ou da busca
  const continuaVisivel = obterTarefasVisiveis().some((t) => t.id === id);
  const mensagem = continuaVisivel
    ? 'Tarefa editada.'
    : 'Tarefa editada (ficou oculta pelo filtro ou pela busca).';

  mostrarAviso(mensagem, {
    desfazer: () => {
      tarefas = tarefas.map((t) => (t.id === id ? { ...t, ...valoresAnteriores } : t));
      esconderAviso();
      atualizar();
    }
  });
}

function cancelarEdicao() {
  idEmEdicao = null;
  renderizarLista();
}

function renderizarContador() {
  const total = tarefas.length;
  const pendentes = tarefas.filter((tarefa) => !tarefa.concluida).length;
  const concluidas = total - pendentes;

  // Se o número mudou, faz o contador "pulsar"
  const valorAnterior = elementoContador.textContent;
  elementoContador.textContent = pendentes;
  elementoContadorRotulo.textContent = pendentes === 1 ? 'Tarefa Pendente' : 'Tarefas Pendentes';
  if (valorAnterior !== String(pendentes)) {
    elementoContador.classList.remove('pulsar');
    void elementoContador.offsetWidth; // truque para reiniciar a animação
    elementoContador.classList.add('pulsar');
  }

  // Barra de progresso
  const porcentagem = total === 0 ? 0 : Math.round((concluidas / total) * 100);
  progressoBarra.style.width = `${porcentagem}%`;
  progressoTexto.textContent = `${concluidas} de ${total} concluídas`;

  // Botão "Limpar Concluídas" mostra quantas serão removidas
  botaoLimpar.hidden = concluidas === 0;
  botaoLimpar.textContent = `Limpar Concluídas (${concluidas})`;
}

// ===== Eventos =====

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault(); // impede a página de recarregar

  const texto = campoTarefa.value.trim();
  if (texto === '') {
    return;
  }

  adicionarTarefa(texto, campoCategoria.value, campoPrioridade.value);
  campoTarefa.value = ''; // limpa só o texto e mantém a categoria escolhida
  campoTarefa.focus();
});

botaoLimpar.addEventListener('click', limparConcluidas);
toastDesfazer.addEventListener('click', () => {
  if (acaoDesfazer) {
    acaoDesfazer();
  }
});

// Backup
botaoExportarBackup.addEventListener('click', exportarBackup);
botaoImportarBackup.addEventListener('click', () => campoArquivoBackup.click());
campoArquivoBackup.addEventListener('change', () => lerArquivoBackup(campoArquivoBackup.files[0]));
botaoImportarJuntar.addEventListener('click', () => importarTarefas('juntar'));
botaoImportarSubstituir.addEventListener('click', () => importarTarefas('substituir'));
botaoImportarCancelar.addEventListener('click', cancelarImportacao);
botaoExportar.addEventListener('click', exportarPdf);

// Busca: filtra enquanto você digita
campoBusca.addEventListener('input', () => mudarBusca(campoBusca.value));

botaoLimparBusca.addEventListener('click', () => {
  campoBusca.value = '';
  mudarBusca('');
  campoBusca.focus();
});

// Esc limpa a busca
campoBusca.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') {
    campoBusca.value = '';
    mudarBusca('');
  }
});

// Atalho: a tecla "/" leva para a busca (se você não estiver digitando em outro campo)
document.addEventListener('keydown', (evento) => {
  const digitandoEmCampo = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName);
  if (evento.key === '/' && !digitandoEmCampo) {
    evento.preventDefault();
    campoBusca.focus();
  }
});

// Guarda a última categoria escolhida no formulário
campoCategoria.addEventListener('change', salvarPreferencias);
campoPrioridade.addEventListener('change', salvarPreferencias);

// "Ordenar por": clique nos botões, ou setas ← → quando um deles está em foco
elementoOrdenacao.querySelectorAll('button').forEach((botao) => {
  botao.addEventListener('click', () => mudarOrdenacao(botao.dataset.ordenacao));
  botao.addEventListener('keydown', (evento) => {
    if (evento.key === 'ArrowLeft' || evento.key === 'ArrowRight') {
      evento.preventDefault();
      const outro = botao.dataset.ordenacao === 'manual' ? 'prioridade' : 'manual';
      mudarOrdenacao(outro);
      elementoOrdenacao.querySelector(`[data-ordenacao="${outro}"]`).focus();
    }
  });
});

// Se o app estiver aberto em duas abas, mantém as duas sincronizadas:
// o evento "storage" avisa quando OUTRA aba alterou o localStorage.
window.addEventListener('storage', (evento) => {
  // (durante um arraste ignoramos: redesenhar no meio "soltaria" a tarefa)
  if (evento.key === CHAVE_ARMAZENAMENTO && !arraste) {
    tarefas = carregarTarefas();
    renderizar();
  }
  if (evento.key === CHAVE_CATEGORIAS && !arraste) {
    categorias = carregarCategorias();
    renderizarSelectCategorias();
    renderizar();
    renderizarPainelCategorias();
  }
});

// Painel de categorias
formNovaCategoria.addEventListener('submit', (evento) => {
  evento.preventDefault();
  adicionarCategoria();
});
botaoFecharCategorias.addEventListener('click', () => alternarPainelCategorias(false));
painelCategorias.addEventListener('keydown', (evento) => {
  // Esc fecha o painel (menos no campo de nome, onde Esc desfaz a digitação)
  if (evento.key === 'Escape' && !evento.target.classList.contains('nome-categoria')) {
    alternarPainelCategorias(false);
  }
});

// ===== Início =====
renderizarSelectCategorias(); // cria as opções antes de aplicar a última categoria usada
aplicarPreferencias();
renderizarDataHoje();
renderizar();
