// ===== Configuração =====

// Chave usada para salvar no localStorage
const CHAVE_ARMAZENAMENTO = 'lista-tarefas';
const CHAVE_PREFERENCIAS = 'lista-tarefas-preferencias';

// Backup
const VERSAO_BACKUP = 1;
const TAMANHO_MAXIMO_BACKUP = 5 * 1024 * 1024; // 5 MB

// Categorias disponíveis (o "id" é usado no código; o "nome" aparece na tela)
const CATEGORIAS = [
  { id: 'pessoal', nome: 'Pessoal' },
  { id: 'trabalho', nome: 'Trabalho' },
  { id: 'estudos', nome: 'Estudos' },
  { id: 'saude', nome: 'Saúde' },
  { id: 'compras', nome: 'Compras' }
];

// ===== Elementos da página =====
const formulario = document.getElementById('formulario');
const campoTarefa = document.getElementById('campo-tarefa');
const campoCategoria = document.getElementById('campo-categoria');
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

// ===== Estado do aplicativo =====
// Parecido com um array de structs no Swift: cada tarefa é um objeto.
let tarefas = carregarTarefas();
let filtroAtual = 'todas';
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

// Tarefas lidas do arquivo, esperando você escolher "Juntar" ou "Substituir"
let tarefasParaImportar = [];

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

// Recebe uma lista "crua" (do localStorage ou de um backup) e devolve só tarefas válidas:
// descarta itens corrompidos, ids repetidos e garante uma categoria conhecida.
function normalizarListaDeTarefas(lista) {
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
      categoria: CATEGORIAS.some((c) => c.id === tarefa.categoria) ? tarefa.categoria : 'pessoal',
      concluida: tarefa.concluida
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
    categoriaFormulario: campoCategoria.value
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
  const categoriaExiste = (id) => CATEGORIAS.some((c) => c.id === id);

  if (preferencias.filtro === 'todas' || categoriaExiste(preferencias.filtro)) {
    filtroAtual = preferencias.filtro;
  }

  if (categoriaExiste(preferencias.categoriaFormulario)) {
    campoCategoria.value = preferencias.categoriaFormulario;
  }

  if (typeof preferencias.busca === 'string' && preferencias.busca !== '') {
    campoBusca.value = preferencias.busca;
    textoBusca = preferencias.busca;
    botaoLimparBusca.hidden = false;
    buscaAtalho.hidden = true;
  }
}

// ===== Ações (alteram o estado → salvam → renderizam) =====

function adicionarTarefa(texto, categoria) {
  const novaTarefa = {
    id: Date.now(),
    texto: texto,
    categoria: categoria,
    concluida: false
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

    const validas = normalizarListaDeTarefas(lista);
    if (validas.length === 0) {
      mostrarAviso('O arquivo não tem nenhuma tarefa válida.', { erro: true });
      return;
    }

    tarefasParaImportar = validas;

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
  const tarefasAnteriores = tarefas.slice(); // cópia, para poder desfazer
  let mensagem;

  if (modo === 'substituir') {
    tarefas = tarefasParaImportar;
    const n = tarefas.length;
    mensagem = n === 1 ? '1 tarefa importada.' : `${n} tarefas importadas.`;
  } else {
    // Não duplica tarefas que já estão na lista (mesmo id)
    const idsAtuais = new Set(tarefas.map((tarefa) => tarefa.id));
    const novas = tarefasParaImportar.filter((tarefa) => !idsAtuais.has(tarefa.id));

    if (novas.length === 0) {
      tarefasParaImportar = [];
      painelImportar.hidden = true;
      mostrarAviso('Nenhuma tarefa nova: todas já estavam na lista.');
      return;
    }

    tarefas = [...tarefas, ...novas];
    const repetidas = tarefasParaImportar.length - novas.length;
    mensagem = novas.length === 1 ? '1 tarefa adicionada' : `${novas.length} tarefas adicionadas`;
    if (repetidas > 0) {
      mensagem += ` (${repetidas} já estava${repetidas === 1 ? '' : 'm'} na lista)`;
    }
    mensagem += '.';
  }

  tarefasParaImportar = [];
  painelImportar.hidden = true;

  // Mostra tudo, para as tarefas importadas não ficarem escondidas por filtro ou busca
  filtroAtual = 'todas';
  campoBusca.value = '';
  textoBusca = '';
  botaoLimparBusca.hidden = true;
  buscaAtalho.hidden = false;
  salvarPreferencias();

  atualizar();
  mostrarAviso(mensagem, {
    desfazer: () => {
      tarefas = tarefasAnteriores;
      esconderAviso();
      atualizar();
    }
  });
}

function cancelarImportacao() {
  tarefasParaImportar = [];
  painelImportar.hidden = true;
}

function mudarFiltro(novoFiltro) {
  filtroAtual = novoFiltro;
  salvarPreferencias();
  renderizar();
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

// Devolve só as tarefas que passam no filtro de categoria E na busca
function obterTarefasVisiveis() {
  const busca = normalizar(textoBusca.trim());

  return tarefas.filter((tarefa) => {
    const passaNaCategoria = filtroAtual === 'todas' || tarefa.categoria === filtroAtual;
    const passaNaBusca = busca === '' || normalizar(tarefa.texto).includes(busca);
    return passaNaCategoria && passaNaBusca;
  });
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

  const categoria = CATEGORIAS.find((c) => c.id === filtroAtual);
  const nomeFiltro = categoria ? categoria.nome : 'Todas as categorias';

  const infoBusca = textoBusca.trim() !== '' ? ` · Busca: "${textoBusca.trim()}"` : '';
  infoImpressao.textContent = `${nomeFiltro}${infoBusca} · Exportado em ${dataFormatada} às ${horaFormatada}`;

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
  renderizarLista();
  renderizarContador();

  // As animações já foram aplicadas; limpa para não repetirem
  idAnimarEntrada = null;
  idAnimarConclusao = null;
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
  const opcoes = [{ id: 'todas', nome: 'Todas' }, ...CATEGORIAS];

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
      const ponto = document.createElement('span');
      ponto.className = 'ponto';
      botao.append(ponto);
    }

    botao.append(`${opcao.nome} (${quantidade})`);
    botao.addEventListener('click', () => mudarFiltro(opcao.id));
    elementoFiltros.append(botao);
  });
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
  const item = document.createElement('li');
  item.className = 'tarefa';
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

  // Etiqueta de categoria
  const categoria = CATEGORIAS.find((c) => c.id === tarefa.categoria);
  const etiqueta = document.createElement('span');
  etiqueta.className = `etiqueta cat-${tarefa.categoria}`;
  etiqueta.textContent = categoria ? categoria.nome : tarefa.categoria;

  // Botão excluir
  const botaoExcluir = document.createElement('button');
  botaoExcluir.type = 'button';
  botaoExcluir.className = 'botao-excluir';
  botaoExcluir.textContent = '✕';
  botaoExcluir.setAttribute('aria-label', `Excluir "${tarefa.texto}"`);
  botaoExcluir.addEventListener('click', () => {
    // Primeiro anima a saída, depois remove de verdade
    item.classList.add('saindo');
    item.addEventListener('animationend', () => excluirTarefa(tarefa.id), { once: true });
  });

  item.append(check, texto, etiqueta, botaoExcluir);
  return item;
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

  adicionarTarefa(texto, campoCategoria.value);
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

// Se o app estiver aberto em duas abas, mantém as duas sincronizadas:
// o evento "storage" avisa quando OUTRA aba alterou o localStorage.
window.addEventListener('storage', (evento) => {
  if (evento.key === CHAVE_ARMAZENAMENTO) {
    tarefas = carregarTarefas();
    renderizar();
  }
});

// ===== Início =====
aplicarPreferencias();
renderizarDataHoje();
renderizar();
