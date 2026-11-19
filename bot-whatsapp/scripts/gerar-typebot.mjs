// Gera os dois fluxos prontos para importar no Typebot (Typebot > Criar > Importar arquivo):
//   typebot/atendimento.json  -> bot do WhatsApp (menu, reconhecimento e respostas)
//   typebot/formulario.json   -> formulário web das opções com "formulario": true
// Fontes: config/menu.json, config/textos.json, config/variaveis.json (ou variaveis.example.json)
// e a lógica de src/logica.js (copiada para dentro dos blocos de código do Typebot).
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as logica from '../src/logica.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lerJson = (rel) => JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8'));

export const CORES = { azul: '#2D4589', rosa: '#F49AC1', branco: '#FFFFFF', texto: '#1F2A44', cinza: '#6B7280' };

/** Acoes reservadas da lógica (não podem ser usadas como id de item). */
const ACOES_RESERVADAS = ['menu', 'saudacao', 'indisponivel', 'agradecimento', 'desconhecido'];

/** Código-fonte de todas as funções de src/logica.js, para colar nos blocos de código. */
const FONTE_LOGICA = Object.values(logica)
  .filter((f) => typeof f === 'function')
  .map((f) => f.toString())
  .join('\n\n');

function criarConstrutor(semente) {
  const usados = new Set();
  const id = (chave) => {
    const h = createHash('sha1').update(semente + ':' + chave).digest('hex');
    const valor = 'c' + BigInt('0x' + h.slice(0, 30)).toString(36).padStart(23, '0').slice(0, 23);
    if (usados.has(valor)) throw new Error('id repetido: ' + chave);
    usados.add(valor);
    return valor;
  };
  const variaveis = [];
  const v = (nome) => {
    let existente = variaveis.find((x) => x.name === nome);
    if (!existente) {
      existente = { id: 'v' + id('var:' + nome).slice(1), name: nome, isSessionVariable: true };
      variaveis.push(existente);
    }
    return existente.id;
  };
  const grupos = [];
  const arestas = [];
  const aresta = (chave, from, groupId) => {
    const e = { id: id('edge:' + chave), from, to: { groupId } };
    arestas.push(e);
    return e.id;
  };
  return { id, v, variaveis, grupos, arestas, aresta };
}

/** Linhas de texto -> richText do Typebot (cada linha um parágrafo; *x* vira negrito). */
export function richText(linhas) {
  return linhas.map((linha) => {
    const filhos = [];
    const partes = String(linha).split(/\*([^*\n]+)\*/);
    partes.forEach((parte, i) => {
      if (!parte && i % 2 === 0) return;
      filhos.push(i % 2 === 1 ? { text: parte, bold: true } : { text: parte });
    });
    if (!filhos.length) filhos.push({ text: '' });
    return { type: 'p', children: filhos };
  });
}

const blocoTexto = (b, chave, linhas) => ({ id: b.id('blk:' + chave), type: 'text', content: { richText: richText(linhas) } });

/** Set variable com valor simples (campo "Value" do Typebot). */
const blocoValor = (b, nome, valor) => ({
  id: b.id('blk:set:' + nome),
  type: 'Set variable',
  options: { variableId: b.v(nome), type: 'Custom', isCode: false, expressionToEvaluate: String(valor) },
});

/** Set variable com código JavaScript (roda no servidor do Typebot). */
const blocoCodigo = (b, nome, codigo, descricao, comLogica = true) => ({
  id: b.id('blk:code:' + nome),
  type: 'Set variable',
  options: {
    variableId: b.v(nome),
    type: 'Custom',
    isCode: true,
    expressionToEvaluate: comLogica
      ? '// ' + descricao + '\n// Lógica gerada a partir de bot-whatsapp/src/logica.js (não precisa editar).\n\n' +
        FONTE_LOGICA + '\n\n' + codigo
      : codigo,
    expressionDescription: descricao,
  },
});

/** Condition "se a variável tiver valor, vai para destino" (o caminho "senão" é ligado depois). */
function condicaoSeDefinida(b, chave, variavel, destino) {
  const bloco = { id: b.id('blk:se:' + chave), type: 'Condition', items: [] };
  const itemId = b.id('cond:' + chave);
  bloco.items.push({
    id: itemId,
    content: { logicalOperator: 'AND', comparisons: [{ id: b.id('cmp:' + chave), variableId: b.v(variavel), comparisonOperator: 'Is set' }] },
    outgoingEdgeId: b.aresta('se:' + chave, { blockId: bloco.id, itemId }, destino.id),
  });
  return bloco;
}

function grupo(b, chave, titulo, x, y, blocos) {
  const g = { id: b.id('grp:' + chave), title: titulo, graphCoordinates: { x, y }, blocks: blocos };
  b.grupos.push(g);
  return g;
}

function ligar(b, bloco, chave, grupoDestino) {
  bloco.outgoingEdgeId = b.aresta(chave, { blockId: bloco.id }, grupoDestino.id);
}

function montarTypebot(b, { id, nome, icone, theme, settings }) {
  const inicio = { id: b.id('evt:start'), type: 'start', graphCoordinates: { x: -400, y: 0 } };
  const primeiro = b.grupos[0];
  inicio.outgoingEdgeId = b.aresta('start', { eventId: inicio.id }, primeiro.id);
  const agora = '2026-11-17T12:00:00.000Z';
  return {
    version: '6.1',
    id,
    name: nome,
    events: [inicio],
    groups: b.grupos,
    edges: b.arestas,
    variables: b.variaveis,
    theme,
    selectedThemeTemplateId: null,
    settings,
    createdAt: agora,
    updatedAt: agora,
    icon: icone,
    folderId: null,
    publicId: null,
    customDomain: null,
    workspaceId: 'proWorkspace',
    resultsTablePreferences: null,
    isArchived: false,
    isClosed: false,
    whatsAppCredentialsId: null,
    riskLevel: null,
    spaceId: null,
  };
}

const tema = {
  general: {
    font: { type: 'Google', family: 'Montserrat' },
    background: { type: 'Color', content: CORES.azul },
  },
  chat: {
    hostAvatar: { isEnabled: false },
    hostBubbles: { backgroundColor: CORES.branco, color: CORES.texto },
    guestBubbles: { backgroundColor: CORES.rosa, color: CORES.texto },
    buttons: { backgroundColor: CORES.rosa, color: CORES.texto },
    inputs: { backgroundColor: CORES.branco, color: CORES.texto, placeholderColor: CORES.cinza },
  },
};

/** Fluxo do WhatsApp. */
export function gerarAtendimento({ menu, textos, vars }) {
  const itens = menu.itens;
  for (const item of itens) {
    if (ACOES_RESERVADAS.includes(item.id)) throw new Error('id reservado no menu: ' + item.id);
    if (!textos.respostas[item.id]) throw new Error('falta texto em respostas para o item: ' + item.id);
  }
  const b = criarConstrutor('pharma-atendimento');

  const comentarioMenu = [
    '// ⚙️ MENU — edite aqui.',
    '// A ordem da lista define os números (1, 2, 3...). Para excluir um item, apague o bloco { ... } dele;',
    '// para reordenar, mova o bloco: a numeração se ajusta sozinha.',
    '// id: NÃO altere (liga o item à resposta dele). nome: texto do menu.',
    '// apelidos: frases que também abrem o item. ativo: false = "disponível em breve".',
    '// oculto: true = o item some do menu (não aparece nem ganha número); false = volta a aparecer.',
    '// formulario: true = gera o link do formulário com o assunto igual ao nome.',
    '// Item novo: crie também um grupo de resposta e uma condição "acao = id" no bloco Condition.',
  ].join('\n');
  const itensCodigo = itens.map((i) => {
    const { id, nome, apelidos, ativo, formulario, oculto } = i;
    return { id, nome, apelidos, ativo, ...(formulario ? { formulario } : {}), ...(oculto !== undefined ? { oculto } : {}) };
  });

  const gCfg = grupo(b, 'cfg', '⚙️ Configuração (edite aqui)', 0, 0, [
    // Número de quem está conversando (recurso nativo do Typebot no WhatsApp)
    { id: b.id('blk:set:telefone_whatsapp'), type: 'Set variable', options: { variableId: b.v('telefone_whatsapp'), type: 'Phone number' } },
    ...Object.entries(vars.atendimento).map(([nome, valor]) => blocoValor(b, nome, valor)),
    blocoCodigo(b, 'menu_config',
      comentarioMenu + '\nreturn JSON.stringify(' + JSON.stringify(itensCodigo, null, 2) + ');',
      'Itens do menu', false),
  ]);

  // Primeira mensagem e saudações: banner (se link_banner tiver endereço) -> saudação -> menu.
  const gBoasTexto = grupo(b, 'boas-texto', '👋 Saudação e menu', 450, 300, [
    blocoTexto(b, 'saudacao', textos.saudacao),
    blocoTexto(b, 'boas', textos.boas_vindas),
  ]);
  const banner = { id: b.id('blk:banner'), type: 'image', content: { url: '{{link_banner}}' } };
  const gBanner = grupo(b, 'banner', '🖼️ Banner da pHarma Online', 450, -250, [banner]);
  ligar(b, banner, 'banner>texto', gBoasTexto);
  const seBanner = condicaoSeDefinida(b, 'banner', 'link_banner', gBanner);
  seBanner.outgoingEdgeId = b.aresta('senao:banner', { blockId: seBanner.id }, gBoasTexto.id);
  const gBoas = grupo(b, 'boas', '👋 Boas-vindas (primeiro contato e saudações)', 450, 0, [
    blocoCodigo(b, 'menu_texto', 'return montarMenu({{menu_config}});', 'Monta a lista numerada do menu'),
    seBanner,
  ]);
  ligar(b, gCfg.blocks.at(-1), 'cfg>boas', gBoas);

  const entrada = { id: b.id('blk:entrada'), type: 'text input', options: { variableId: b.v('entrada'), labels: { placeholder: 'Digite o número da opção...', button: 'Enviar' } } };
  const condicao = { id: b.id('blk:rotas'), type: 'Condition', items: [] };
  const gEspera = grupo(b, 'espera', '⌨️ Aguardar resposta', 900, 0, [
    entrada,
    blocoCodigo(b, 'resultado', 'return processarMensagem({{entrada}}, {{menu_config}}, {{telefone_whatsapp}}, {{link_formulario}});', 'Reconhece a mensagem (número, frase, saudação ou 0)'),
    blocoCodigo(b, 'acao', 'return JSON.parse({{resultado}}).acao;', 'Ação escolhida', false),
    blocoCodigo(b, 'item_nome', 'return JSON.parse({{resultado}}).item_nome;', 'Nome do item escolhido', false),
    blocoCodigo(b, 'link_form', 'return JSON.parse({{resultado}}).link_form;', 'Link do formulário (opções com formulário)', false),
    condicao,
  ]);
  ligar(b, gBoasTexto.blocks.at(-1), 'boas>espera', gEspera);

  const rota = (valor, destino) => {
    const itemId = b.id('cond:' + valor);
    condicao.items.push({
      id: itemId,
      blockId: condicao.id,
      content: { logicalOperator: 'AND', comparisons: [{ id: b.id('cmp:' + valor), variableId: b.v('acao'), comparisonOperator: 'Equal to', value: valor }] },
      outgoingEdgeId: b.aresta('rota:' + valor, { blockId: condicao.id, itemId }, destino.id),
    });
  };
  // Saudação (e o primeiro contato): banner + boas-vindas + menu. Opção 0: só o menu, sem banner.
  rota('saudacao', gBoas);
  const gMenu = grupo(b, 'menu', '📋 Menu (opção 0)', 1400, -300, [blocoTexto(b, 'menu', textos.boas_vindas)]);
  ligar(b, gMenu.blocks[0], 'menu>espera', gEspera);
  rota('menu', gMenu);

  const resposta = (chave, titulo, x, y, linhas) => {
    const g = grupo(b, chave, titulo, x, y, [blocoTexto(b, chave, linhas)]);
    ligar(b, g.blocks[0], chave + '>espera', gEspera);
    return g;
  };
  itens.forEach((item, i) => {
    const g = resposta('resp:' + item.id, '💬 ' + item.nome + ' (id: ' + item.id + ')', 1400, i * 260, textos.respostas[item.id]);
    rota(item.id, g);
  });
  rota('indisponivel', resposta('breve', '⏳ Opção disponível em breve', 1900, 0, textos.indisponivel));
  rota('agradecimento', resposta('obrigado', '🙏 Agradecimento', 1900, 260, textos.agradecimento));
  const gNao = resposta('nao', '❓ Mensagem não reconhecida', 1900, 520, textos.nao_entendi);
  condicao.outgoingEdgeId = b.aresta('rota:senao', { blockId: condicao.id }, gNao.id);

  return montarTypebot(b, {
    id: b.id('typebot'),
    nome: 'pHarma Online · Atendimento WhatsApp',
    icone: '💬',
    theme: tema,
    settings: {
      general: { isBrandingEnabled: false },
      metadata: { title: 'pHarma Online · Atendimento' },
      // Depois de 12 h sem mensagens a conversa recomeça pelas boas-vindas.
      whatsApp: { sessionExpiryTimeout: 12 },
    },
  });
}

/** Formulário web (opções 4 e 6). */
export function gerarFormulario({ textos, vars }) {
  const t = textos.formulario;
  const b = criarConstrutor('pharma-formulario');
  // Recebidas pela URL: ?assunto=...&whatsapp=...
  b.v('assunto');
  b.v('whatsapp');

  const gCfg = grupo(b, 'cfg', '⚙️ Configuração (edite aqui)', 0, 0, [
    ...Object.entries(vars.formulario).map(([nome, valor]) => blocoValor(b, nome, valor)),
    blocoCodigo(b, 'assunto', "return ({{assunto}} === undefined || {{assunto}} === null || String({{assunto}}).trim() === '') ? 'Fale conosco' : String({{assunto}});", 'Assunto vindo do link (padrão: Fale conosco)', false),
  ]);

  const entradaTexto = (nome, extra = {}) => ({ id: b.id('blk:in:' + nome), type: 'text input', options: { variableId: b.v(nome), ...extra } });
  const gForm = grupo(b, 'form', '📝 Formulário', 450, 0, [
    blocoTexto(b, 'abertura', t.abertura),
    blocoTexto(b, 'p-nome', t.pergunta_nome),
    entradaTexto('nome', { labels: { placeholder: 'Seu nome completo', button: 'Enviar' } }),
    blocoTexto(b, 'p-tel', t.pergunta_telefone),
    { id: b.id('blk:in:telefone'), type: 'phone number input', options: { variableId: b.v('telefone'), defaultCountryCode: 'BR', labels: { placeholder: '(11) 91234-5678', button: 'Enviar' }, retryMessageContent: 'Esse telefone não parece válido. Confira o DDD e o número, por favor.' } },
    blocoTexto(b, 'p-email', t.pergunta_email),
    { id: b.id('blk:in:email'), type: 'email input', options: { variableId: b.v('email'), labels: { placeholder: 'seuemail@exemplo.com', button: 'Enviar' }, retryMessageContent: 'Esse e-mail não parece válido. Confira e digite novamente, por favor.' } },
    blocoTexto(b, 'p-duvida', t.pergunta_duvida),
    entradaTexto('duvida', { isLong: true, labels: { placeholder: 'Escreva aqui a sua dúvida ou mensagem...', button: 'Enviar' } }),
    blocoTexto(b, 'p-anexos', t.pergunta_anexos),
    { id: b.id('blk:in:anexos'), type: 'file input', options: {
      variableId: b.v('anexos'), isRequired: false, isMultipleAllowed: true, visibility: 'Public',
      allowedFileTypes: { isEnabled: true, types: ['image/*'] },
      labels: { placeholder: 'Clique ou arraste as imagens aqui', button: 'Enviar imagens', clear: 'Limpar', skip: 'Não tenho imagens para enviar', success: { single: 'Imagem enviada', multiple: '{total} imagens enviadas' } },
    } },
  ]);
  ligar(b, gCfg.blocks.at(-1), 'cfg>form', gForm);

  const dadosJs = "{ assunto: {{assunto}}, nome: {{nome}}, telefone: {{telefone}}, email: {{email}}, duvida: {{duvida}}, anexos: {{anexos}}, whatsapp: {{whatsapp}} }";
  const http = (chave, url, corpo) => ({
    id: b.id('blk:http:' + chave),
    type: 'Webhook',
    options: {
      isCustomBody: true,
      isAdvancedConfig: true,
      webhook: {
        method: 'POST',
        url,
        headers: [
          { id: b.id('hdr:ct:' + chave), key: 'Content-Type', value: 'application/json' },
          { id: b.id('hdr:key:' + chave), key: 'Authorization', value: 'Bearer {{meta_token}}' },
        ],
        body: corpo,
      },
      responseVariableMapping: [{ id: b.id('map:' + chave), variableId: b.v('status_' + chave), bodyPath: 'statusCode' }],
    },
  });
  const condicaoSe = (chave, variavel, destino) => condicaoSeDefinida(b, chave, variavel, destino);

  // Ordem: prepara tudo -> e-mail ao atendente (se houver e-mail) -> WhatsApp ao atendente (se houver número)
  // -> aviso ao cliente no WhatsApp -> mensagem final na tela.
  const gCliente = grupo(b, 'cliente', '📲 Avisar o cliente no WhatsApp e encerrar', 1800, 0, [
    http('cliente', '{{url_meta}}', '{{corpo_cliente}}'),
    blocoTexto(b, 'final', t.final),
  ]);
  const gZap = grupo(b, 'zap', '💬 Resumo ao atendente por WhatsApp (só com numero_atendente preenchido)', 1350, 300, [
    http('atendente', '{{url_meta}}', '{{corpo_atendente}}'),
  ]);
  ligar(b, gZap.blocks[0], 'zap>cliente', gCliente);
  const seZap = condicaoSe('zap', 'numero_atendente', gZap);
  seZap.outgoingEdgeId = b.aresta('senao:zap', { blockId: seZap.id }, gCliente.id);
  const gChecaZap = grupo(b, 'checa-zap', '❔ Enviar também por WhatsApp?', 1350, 0, [seZap]);

  const email = {
    id: b.id('blk:email'),
    type: 'Email',
    options: {
      credentialsId: 'default',
      recipients: ['{{email_atendente}}'],
      subject: '{{email_assunto}}',
      body: '{{email_html}}',
      isCustomBody: true,
      isBodyCode: true,
      replyTo: '{{email}}',
    },
  };
  const gEmail = grupo(b, 'email', '📧 Resumo ao atendente por e-mail', 1350, -300, [email]);
  ligar(b, email, 'email>checa-zap', gChecaZap);
  const seEmail = condicaoSe('email', 'email_atendente', gEmail);
  seEmail.outgoingEdgeId = b.aresta('senao:email', { blockId: seEmail.id }, gChecaZap.id);

  const gEnvio = grupo(b, 'envio', '📤 Preparar o resumo e o aviso', 900, 0, [
    blocoValor(b, 'aviso_whatsapp', t.aviso_whatsapp.join('\n')),
    blocoCodigo(b, 'email_assunto', 'return assuntoEmail(' + dadosJs + ');', 'Assunto do e-mail ao atendente'),
    blocoCodigo(b, 'email_html', 'return montarResumoHtml(' + dadosJs + ', new Date());', 'E-mail organizado para o atendente'),
    blocoCodigo(b, 'url_meta', 'return urlMensagensMeta({{meta_api_url}}, {{meta_api_versao}}, {{meta_id_numero}});', 'Endereço da API da Meta para enviar mensagens'),
    blocoCodigo(b, 'corpo_atendente', 'return corpoAtendente(' + dadosJs + ', {{numero_atendente}}, {{template_atendente}}, {{template_idioma}}, new Date());', 'Mensagem única e organizada para o atendente (WhatsApp)'),
    blocoCodigo(b, 'corpo_cliente', 'return corpoCliente({{whatsapp}}, {{telefone}}, {{aviso_whatsapp}});', 'Aviso para o cliente no WhatsApp'),
    seEmail,
  ]);
  ligar(b, gForm.blocks.at(-1), 'form>envio', gEnvio);

  return montarTypebot(b, {
    id: b.id('typebot'),
    nome: 'pHarma Online · Formulário de atendimento',
    icone: '📝',
    theme: tema,
    settings: { general: { isBrandingEnabled: false }, metadata: { title: 'pHarma Online · Formulário de atendimento', description: 'Envie a sua dúvida para a equipe pHarma Online.' } },
  });
}

export function carregarConfig() {
  const varsPath = fs.existsSync(path.join(RAIZ, 'config/variaveis.json')) ? 'config/variaveis.json' : 'config/variaveis.example.json';
  const vars = lerJson(varsPath);
  return { menu: lerJson('config/menu.json'), textos: lerJson('config/textos.json'), vars, varsPath };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const cfg = carregarConfig();
  const saida = path.join(RAIZ, 'typebot');
  fs.mkdirSync(saida, { recursive: true });
  fs.writeFileSync(path.join(saida, 'atendimento.json'), JSON.stringify(gerarAtendimento(cfg), null, 2) + '\n');
  fs.writeFileSync(path.join(saida, 'formulario.json'), JSON.stringify(gerarFormulario(cfg), null, 2) + '\n');
  console.log('Gerados typebot/atendimento.json e typebot/formulario.json (dados de ' + cfg.varsPath + ').');
}
