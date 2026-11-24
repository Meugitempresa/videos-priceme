// Garantias contra "alucinação": o bot só pode enviar textos fixos e links fornecidos pela cliente.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { reconhecer } from '../src/logica.js';
import { criarSessao } from '../src/motor.js';

const lerJson = (rel) => JSON.parse(fs.readFileSync(new URL('../' + rel, import.meta.url), 'utf8'));
const textos = lerJson('config/textos.json');
const menu = lerJson('config/menu.json');
const vars = lerJson('config/variaveis.example.json');
const atendimento = lerJson('typebot/atendimento.json');
const formulario = lerJson('typebot/formulario.json');

// Links exatamente como a cliente enviou (não alterar sem ela fornecer um novo).
const LINKS_FORNECIDOS = {
  link_app: 'https://orcpharm.app/pharmaonline/',
  link_instagram: 'https://www.instagram.com/pharmaonlineplus/',
  link_facebook: 'https://www.facebook.com/pharmaonlineplus/',
  link_tiktok: 'https://www.tiktok.com/@pharmaonlineplus',
  link_youtube: 'https://www.youtube.com/@pharmaonlineplus',
  link_atendimento: 'https://wa.me/5531999211377', // montado do número (31) 99921-1377 e aprovado pela cliente em 24/11
};
const EMAIL_FORNECIDO = 'suporte.pharmaonline@gmail.com';
// Links que ainda dependem da cliente (provisórios ou aguardando aprovação).
const LINKS_PENDENTES = ['link_banner', 'link_site', 'link_formulario'];

const URL_RE = /\b(?:https?:\/\/|www\.)[^\s*]+|\b[a-z0-9-]+\.(?:com|app|br|net|org)(?:\.br)?\/[^\s*]*/gi;

test('os links fornecidos pela cliente estão na configuração exatamente como ela enviou', () => {
  for (const [nome, url] of Object.entries(LINKS_FORNECIDOS)) assert.equal(vars.atendimento[nome], url, nome);
  for (const nome of Object.keys(vars.atendimento)) {
    if (!nome.startsWith('link_')) continue;
    assert.ok(nome in LINKS_FORNECIDOS || LINKS_PENDENTES.includes(nome), 'link sem origem conhecida: ' + nome);
  }
});

test('o e-mail de contato e o de destino dos formulários são os fornecidos pela cliente', () => {
  assert.equal(vars.atendimento.email_contato, EMAIL_FORNECIDO);
  assert.equal(vars.formulario.email_atendente, EMAIL_FORNECIDO);
  assert.doesNotMatch(JSON.stringify(textos), /[\w.+-]+@[\w-]+\.[\w.]+/); // e-mail nunca escrito à mão nos textos
});

test('nenhum texto tem link escrito à mão: todo link vem de uma variável da configuração', () => {
  const todos = JSON.stringify({ ...textos, _ajuda: undefined });
  assert.deepEqual(todos.match(URL_RE) ?? [], []);
});

test('o fluxo não tem nenhum bloco de IA nem blocos fora da lista permitida', () => {
  const permitidos = ['text', 'image', 'text input', 'email input', 'phone number input', 'file input', 'choice input',
    'Set variable', 'Condition', 'Jump', 'Webhook', 'Email'];
  for (const tb of [atendimento, formulario]) {
    for (const g of tb.groups) for (const b of g.blocks) assert.ok(permitidos.includes(b.type), 'bloco não permitido: ' + b.type);
  }
  const bruto = JSON.stringify([atendimento, formulario]).toLowerCase();
  for (const proibido of ['openai', 'anthropic', 'mistral', 'gpt', 'temperature', 'chatgpt']) assert.ok(!bruto.includes('"' + proibido), proibido);
});

test('todas as respostas do WhatsApp usam só os links da configuração, sem alterar nenhum', async () => {
  const s = criarSessao(atendimento, { contato: { telefone: '5531988887777' } });
  const mensagens = [...await s.iniciar()];
  for (const m of ['1', '2', '3', '4', '5', 'obrigado', '0', 'xyz', 'redes sociais', 'fale conosco']) mensagens.push(...await s.responder(m));
  const permitidos = new Set(Object.values(vars.atendimento).filter((v) => /^https?:\/\//.test(v)));
  for (const m of mensagens) {
    for (const url of m.match(URL_RE) ?? []) {
      if (url.startsWith(vars.atendimento.link_formulario + '?')) continue; // link do formulário (assunto e número do cliente no final)
      assert.ok(permitidos.has(url), 'link fora da configuração: ' + url);
    }
  }
});

test('mensagens que o menu não cobre recebem só o pedido para escolher um número do menu', async () => {
  const fora = ['qual o horário de vocês?', 'vocês vendem dipirona?', 'quanto custa?', 'me passa o site da loja',
    'quero falar sobre outra coisa', 'asdfgh', '???', '12345', 'https://site-qualquer.com', 'me manda um link',
    'qual o endereço?', 'vcs abrem domingo', '😀😀', 'ok', 'sim', 'não', 'pode me ajudar?', 'preciso de remédio'];
  const s = criarSessao(atendimento, { contato: { telefone: '5531988887777' } });
  await s.iniciar();
  const esperado = (await s.responder('xyz')).join('\n');
  assert.match(esperado, /^Desculpe, não consegui identificar a sua solicitação\.[\s\S]*digite apenas o \*número\*/);
  for (const t of fora) {
    assert.equal(reconhecer(t, menu).acao, 'desconhecido', t);
    assert.equal((await s.responder(t)).join('\n'), esperado, t);
  }
});

test('para qualquer texto, a ação é sempre uma das previstas (nunca algo inventado)', () => {
  const previstas = new Set(['menu', 'saudacao', 'agradecimento', 'desconhecido', 'indisponivel', ...menu.itens.map((i) => i.id)]);
  let semente = 42;
  const aleatorio = () => (semente = (semente * 1103515245 + 12345) % 2147483648) / 2147483648;
  const pedacos = ['oi', 'app', 'site', '0', '7', 'link', 'boleto', 'quero', 'não', 'obrigado', '😀', 'www', '.com', 'pharma', 'online', 'whatsapp', 'receita', '?', '!'];
  for (let i = 0; i < 2000; i++) {
    const t = Array.from({ length: 1 + Math.floor(aleatorio() * 5) }, () => pedacos[Math.floor(aleatorio() * pedacos.length)]).join(' ');
    assert.ok(previstas.has(reconhecer(t, menu).acao), t);
  }
});
