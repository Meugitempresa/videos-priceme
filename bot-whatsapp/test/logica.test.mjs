import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import {
  normalizar, lerMenu, montarMenu, reconhecer, linkFormulario,
  montarResumo, montarResumoHtml, assuntoEmail, listaDeAnexos, dataHoraBrasilia,
} from '../src/logica.js';

const menuConfig = JSON.parse(fs.readFileSync(new URL('../config/menu.json', import.meta.url), 'utf8'));
// Os testes de reconhecimento usam o menu real com o site visível (na configuração atual ele está oculto até a
// loja ser publicada); assim os números de 1 a 6 continuam valendo nestes testes.
const menu = { itens: menuConfig.itens.map((i) => (i.id === 'site' ? { ...i, ativo: true, oculto: false } : i)) };
const acao = (texto, cfg = menu) => reconhecer(texto, cfg).acao;

test('normaliza acentos, pontuação, emojis e números com tecla', () => {
  assert.equal(normalizar('  Olá, BOM DIA!!! 😊 '), 'ola bom dia');
  assert.equal(normalizar('Orçamento pelo App'), 'orcamento pelo app');
  assert.equal(normalizar('1️⃣'), '1');
  assert.equal(normalizar(null), '');
  assert.equal(normalizar(3), '3');
});

test('menu numerado na ordem da configuração, com o 0 fixo', () => {
  assert.equal(montarMenu(menu).split('\n')[0], '**0** - Voltar ao menu inicial');
  assert.deepEqual(lerMenu(menu).map((i) => i.numero), [1, 2, 3, 4, 5, 6]);
  assert.match(montarMenu(menu), /\*\*6\*\* - Fale conosco$/);
});

test('0 e palavras de voltar levam ao menu inicial', () => {
  for (const t of ['0', ' 0 ', 'Opção 0', '0️⃣', 'voltar', 'Voltar ao menu inicial', 'MENU', 'início', 0]) {
    assert.equal(acao(t), 'menu', String(t));
  }
});

test('números de 1 a 6 abrem os itens', () => {
  assert.equal(acao('1'), 'app');
  assert.equal(acao(1), 'app');
  assert.equal(acao('opção 1'), 'app');
  assert.equal(acao('1.'), 'app');
  assert.equal(acao('1️⃣'), 'app');
  assert.equal(acao('nº 3'), 'site');
  assert.equal(acao('2'), 'whatsapp');
  assert.equal(reconhecer('2', menu).nome, 'Orçamento pelo WhatsApp (ordem de pedido)');
  assert.equal(acao('3'), 'site');
  assert.equal(acao('4'), 'financeiro');
  assert.equal(acao('5'), 'redes');
  assert.equal(acao('6'), 'contato');
});

test('configuração atual: site oculto até a loja ser publicada, sem buraco na numeração', () => {
  assert.deepEqual(lerMenu(menuConfig).map((i) => i.numero + ':' + i.id), ['1:app', '2:whatsapp', '3:financeiro', '4:redes', '5:contato']);
  assert.equal(acao('3', menuConfig), 'financeiro');
  assert.equal(acao('5', menuConfig), 'contato');
  assert.equal(acao('6', menuConfig), 'desconhecido');
  assert.equal(acao('acessar o site', menuConfig), 'desconhecido');
  assert.doesNotMatch(montarMenu(menuConfig), /site/i);
  // ao publicar a loja, basta oculto: false
  const publicado = { itens: menuConfig.itens.map((i) => (i.id === 'site' ? { ...i, oculto: false } : i)) };
  assert.equal(acao('3', publicado), 'site');
  assert.equal(acao('4', publicado), 'financeiro');
});

test('item com ativo: false responde "disponível em breve" (pelo número e pela frase)', () => {
  const comItemInativo = { itens: menu.itens.map((i) => (i.id === 'whatsapp' ? { ...i, ativo: false } : i)) };
  assert.equal(acao('2', comItemInativo), 'indisponivel');
  assert.equal(acao('ordem de pedido', comItemInativo), 'indisponivel');
  assert.equal(reconhecer('2', comItemInativo).nome, 'Orçamento pelo WhatsApp (ordem de pedido)');
});

test('número fora do menu não é aceito', () => {
  for (const t of ['7', '10', '99', '1,5', '12345']) assert.equal(acao(t), 'desconhecido', t);
});

test('frases e nomes das opções funcionam sem o número', () => {
  const casos = {
    'orçamento em tempo real pelo app': 'app',
    'Orçamento pelo app': 'app',
    'quero fazer orcamento pelo aplicativo': 'app',
    'Acessar o site': 'site',
    'qual o site de vocês?': 'site',
    'Administrativo/Financeiro': 'financeiro',
    'financeiro': 'financeiro',
    'preciso da segunda via do boleto': 'financeiro',
    'Redes sociais': 'redes',
    'vocês tem instagram?': 'redes',
    'Fale conosco': 'contato',
    'quero falar com atendente': 'contato',
    'orçamento pelo whatsapp': 'whatsapp',
    'Oi, quero ver o site': 'site',
  };
  for (const [texto, esperado] of Object.entries(casos)) assert.equal(acao(texto), esperado, texto);
});

test('saudações recebem as boas-vindas (com banner) e o menu', () => {
  for (const t of ['oi', 'Olá', 'olá!', 'Oi, bom dia!', 'boa tarde', 'Boa noite, tudo bem?', 'e aí', 'opa', 'oie', 'tudo bem?', 'Olá pessoal da pHarmaOnline', 'Oi, pHarma Online!']) {
    assert.equal(acao(t), 'saudacao', t);
  }
});

test('agradecimento recebe resposta educada', () => {
  for (const t of ['obrigado', 'Muito obrigada!', 'valeu', 'ok, obrigado']) assert.equal(acao(t), 'agradecimento', t);
});

test('mensagens fora do assunto, vazias ou de mídia não travam: viram "desconhecido"', () => {
  for (const t of ['asdf', 'qual a previsão do tempo?', '', '   ', '😀', '🎉🎉', 'ok', 'sim', 'orçamento', undefined, null, 'quanto custa dipirona?']) {
    assert.equal(acao(t), 'desconhecido', String(t));
  }
});

test('excluir e reordenar itens renumera sozinho, sem trocar as respostas', () => {
  const semSite = { itens: menu.itens.filter((i) => i.id !== 'site') };
  assert.deepEqual(lerMenu(semSite).map((i) => i.numero + ':' + i.id), ['1:app', '2:whatsapp', '3:financeiro', '4:redes', '5:contato']);
  assert.equal(acao('3', semSite), 'financeiro');
  assert.equal(acao('6', semSite), 'desconhecido');
  assert.equal(acao('acessar o site', semSite), 'desconhecido');

  const invertido = { itens: [...menu.itens].reverse() };
  assert.equal(acao('1', invertido), 'contato');
  assert.equal(acao('6', invertido), 'app');
  assert.match(montarMenu(invertido), /\*\*1\*\* - Fale conosco/);

  const renomeado = { itens: menu.itens.map((i) => (i.id === 'app' ? { ...i, nome: 'Orçamento em tempo real pelo app' } : i)) };
  assert.match(montarMenu(renomeado), /\*\*1\*\* - Orçamento em tempo real pelo app/);
  assert.equal(acao('1', renomeado), 'app');
});

test('aceita a configuração como texto JSON (como vem do Typebot) e ignora configuração inválida', () => {
  assert.equal(acao('5', JSON.stringify(menu.itens)), 'redes');
  assert.equal(acao('1', '{quebrado'), 'desconhecido');
  assert.equal(acao('0', '{quebrado'), 'menu');
});

test('link do formulário leva o assunto e o WhatsApp', () => {
  assert.equal(
    linkFormulario('https://f.exemplo/form', 'Administrativo/Financeiro', '5511988887777@s.whatsapp.net'),
    'https://f.exemplo/form?assunto=Administrativo%2FFinanceiro&whatsapp=5511988887777',
  );
  assert.equal(linkFormulario('https://f.exemplo/form?x=1', 'Fale conosco', ''), 'https://f.exemplo/form?x=1&assunto=Fale%20conosco');
  assert.equal(linkFormulario('', 'Fale conosco', ''), '');
});

const dados = {
  assunto: 'Fale conosco', nome: 'Maria da Silva', telefone: '+5511912345678', email: 'maria@exemplo.com',
  duvida: 'Linha 1\nLinha 2', anexos: ['https://s.exemplo/a.png', 'https://s.exemplo/b.png'], whatsapp: 5511988887777,
};
const quando = new Date('2026-11-17T17:05:00Z');

test('resumo único e organizado para o atendente', () => {
  const r = montarResumo(dados, quando);
  assert.equal(r, [
    '📋 *Novo atendimento: Fale conosco*',
    '',
    '*Nome:* Maria da Silva',
    '*Telefone:* +5511912345678',
    '*E-mail:* maria@exemplo.com',
    '*WhatsApp de origem:* +5511988887777',
    '',
    '*Dúvida/mensagem:*',
    'Linha 1\nLinha 2',
    '',
    '*Anexos (2):*',
    '1. https://s.exemplo/a.png',
    '2. https://s.exemplo/b.png',
    '',
    'Enviado em 17/11/2026 às 14:05',
  ].join('\n'));
  assert.match(montarResumo({ ...dados, anexos: undefined, whatsapp: undefined }, quando), /\*Anexos:\* nenhum/);
  assert.doesNotMatch(montarResumo({ ...dados, whatsapp: '' }, quando), /WhatsApp de origem/);
});

test('anexos como lista ou texto', () => {
  assert.deepEqual(listaDeAnexos('https://a/1.png, https://a/2.png'), ['https://a/1.png', 'https://a/2.png']);
  assert.deepEqual(listaDeAnexos('https://a/1.png'), ['https://a/1.png']);
  assert.deepEqual(listaDeAnexos(undefined), []);
  assert.equal(dataHoraBrasilia(new Date('2026-01-01T02:59:00Z')), '31/12/2025 às 23:59');
});

test('e-mail para o atendente: assunto, dados escapados e anexos como links', () => {
  assert.equal(assuntoEmail(dados), 'Novo atendimento: Fale conosco – Maria da Silva');
  assert.equal(assuntoEmail({}), 'Novo atendimento: Fale conosco');
  const html = montarResumoHtml({ ...dados, nome: 'Ana <b>&</b>', duvida: 'a\nb' }, quando);
  assert.match(html, /Ana &lt;b&gt;&amp;&lt;\/b&gt;/);
  assert.match(html, /a<br>b/);
  assert.match(html, /<a href="https:\/\/s\.exemplo\/a\.png"/);
  assert.match(html, /https:\/\/wa\.me\/5511988887777/);
  assert.match(html, /Enviado em 17\/11\/2026 às 14:05/);
  assert.match(html, /#2D4589/);
  assert.match(montarResumoHtml({ ...dados, anexos: [] }, quando), /Anexos \(0\)<\/p>nenhum/);
});
