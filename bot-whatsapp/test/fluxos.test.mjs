// Executa os fluxos gerados (typebot/*.json) no motor local, como o Typebot faria.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import http from 'node:http';
import { carregarConfig, gerarAtendimento, gerarFormulario } from '../scripts/gerar-typebot.mjs';
import { criarSessao } from '../src/motor.js';

const ler = (nome) => JSON.parse(fs.readFileSync(new URL('../typebot/' + nome, import.meta.url), 'utf8'));

test('os arquivos em typebot/ estão atualizados com a configuração (rode `npm run gerar`)', () => {
  const cfg = carregarConfig();
  assert.deepEqual(ler('atendimento.json'), JSON.parse(JSON.stringify(gerarAtendimento(cfg))));
  assert.deepEqual(ler('formulario.json'), JSON.parse(JSON.stringify(gerarFormulario(cfg))));
});

test('estrutura: arestas e variáveis apontam para coisas que existem', () => {
  for (const tb of [ler('atendimento.json'), ler('formulario.json')]) {
    const grupos = new Set(tb.groups.map((g) => g.id));
    const blocos = new Set(tb.groups.flatMap((g) => g.blocks.map((b) => b.id)));
    const vars = new Set(tb.variables.map((v) => v.id));
    for (const e of tb.edges) {
      assert.ok(grupos.has(e.to.groupId), 'destino ' + e.id);
      assert.ok(e.from.eventId || blocos.has(e.from.blockId), 'origem ' + e.id);
    }
    for (const g of tb.groups) for (const b of g.blocks) {
      if (b.options?.variableId) assert.ok(vars.has(b.options.variableId), b.id);
    }
    const ids = [...grupos, ...blocos, ...tb.edges.map((e) => e.id), ...vars];
    assert.equal(new Set(ids).size, ids.length, 'ids únicos');
  }
});

async function conversa(mensagens, contato = { telefone: '5511988887777', nome: 'Cliente' }) {
  const s = criarSessao(ler('atendimento.json'), { contato });
  const respostas = [(await s.iniciar()).join('\n---\n')];
  for (const m of mensagens) respostas.push((await s.responder(m)).join('\n---\n'));
  return { s, respostas };
}

test('WhatsApp: primeira mensagem recebe boas-vindas com o menu (site oculto, números em sequência)', async () => {
  const { respostas, s } = await conversa([]);
  assert.match(respostas[0], /^Olá! Seja bem-vindo\(a\) à \*pHarmaOnline\*! 💊💜\n---\nDigite o \*número\* da opção desejada:/);
  assert.doesNotMatch(respostas[0], /\[imagem/); // sem link_banner configurado, a imagem é pulada
  assert.doesNotMatch(respostas[0], /Bom dia|Boa tarde|Boa noite/);
  assert.match(respostas[0], /\*0\* - Voltar ao menu inicial\n\*1\* - Orçamento pelo app\n\*2\* - Orçamento pelo WhatsApp \(ordem de pedido\)\n\*3\* - Administrativo\/Financeiro\n\*4\* - Redes sociais\n\*5\* - Fale conosco$/);
  assert.doesNotMatch(respostas[0], /site/i);
  assert.equal(s.aguardando, 'text input');
});

test('WhatsApp: cada opção, o 0 e as frases, sem nunca encerrar a conversa', async () => {
  const { respostas, s } = await conversa(['1', 'Orçamento pelo app', '2', '3', '4', '5', '6', 'acessar o site', '0', 'xyz', 'oi', 'obrigado', 'redes sociais']);
  const [, r1, r1f, r2, r3, r4, r5, r6, rsite, r0, rx, roi, robg, rredes] = respostas;
  assert.match(r1, /^\*Orçamento pelo app\*/);
  assert.match(r1, /https:\/\/orcpharm\.app\/pharmaonline\//);
  assert.equal(r1f, r1);
  assert.match(r2, /^\*Orçamento pelo WhatsApp\* 💬/);
  assert.match(r2, /Uma pessoa da nossa equipe vai atender você/);
  assert.doesNotMatch(r2, /receita/i);
  assert.match(r2, /\(31\) 99921-1377/);
  assert.match(r2, /https:\/\/wa\.me\/5531999211377\n/);
  assert.match(r3, /📧 A resposta chegará pelo e-mail informado no formulário\./);
  assert.match(r5, /📧 A resposta chegará pelo e-mail informado no formulário\./);
  assert.doesNotMatch(r5, /Ficamos felizes/);
  assert.match(r3, /pharma-formulario\?assunto=Administrativo%2FFinanceiro&whatsapp=5511988887777/);
  assert.match(r4, /instagram\.com\/pharmaonlineplus[\s\S]*facebook\.com\/pharmaonlineplus[\s\S]*tiktok[\s\S]*youtube/);
  assert.match(r5, /pharma-formulario\?assunto=Fale%20conosco&whatsapp=5511988887777/);
  assert.match(r6, /^Desculpe, não entendi\./); // não existe opção 6 com o site oculto
  assert.match(rsite, /^Desculpe, não entendi\./); // site oculto não é reconhecido
  assert.equal(r0, respostas[0]);
  assert.match(rx, /^Desculpe, não entendi\.[\s\S]*\*5\* - Fale conosco/);
  assert.equal(roi, respostas[0]);
  assert.match(robg, /agradecemos/);
  assert.match(robg, /\*pHarmaOnline\*, conectando confiança à sua conveniência! 💜$/);
  assert.match(rredes, /^\*Redes sociais\*/);
  for (const r of [r1, r2, r3, r4, r5]) assert.match(r, /digite \*0\*/);
  assert.equal(s.terminou, false);
  assert.equal(s.aguardando, 'text input');
});

test('WhatsApp: com link_banner configurado, a primeira mensagem (e o 0) começa pelo banner', async () => {
  const tb = ler('atendimento.json');
  const idBanner = tb.variables.find((v) => v.name === 'link_banner').id;
  for (const g of tb.groups) for (const b of g.blocks) {
    if (b.type === 'Set variable' && b.options?.variableId === idBanner) b.options.expressionToEvaluate = 'https://arquivos.exemplo/banner-pharmaonline.jpg';
  }
  const s = criarSessao(tb, { contato: { telefone: '5511988887777' } });
  const inicio = await s.iniciar();
  assert.equal(inicio.length, 3);
  assert.equal(inicio[0], '[imagem: https://arquivos.exemplo/banner-pharmaonline.jpg]');
  assert.match(inicio[1], /^Olá! Seja bem-vindo\(a\) à \*pHarmaOnline\*! 💊💜$/);
  assert.match(inicio[2], /^Digite o \*número\*/);
  assert.deepEqual(await s.responder('0'), inicio);
});

test('WhatsApp: sem número do contato (teste no painel do Typebot) o link do formulário sai sem o número', async () => {
  const { respostas } = await conversa(['3'], null);
  assert.match(respostas[1], /pharma-formulario\?assunto=Administrativo%2FFinanceiro\n/);
});

function servidorFalso() {
  const recebidas = [];
  const srv = http.createServer((req, res) => {
    let corpo = '';
    req.on('data', (c) => { corpo += c; });
    req.on('end', () => {
      recebidas.push({ url: req.url, method: req.method, headers: req.headers, corpo: JSON.parse(corpo) });
      res.writeHead(201, { 'content-type': 'application/json' });
      res.end('{"key":{"id":"ok"}}');
    });
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok({ srv, recebidas, url: 'http://127.0.0.1:' + srv.address().port })));
}

function formularioCom(url, extras = {}) {
  const tb = ler('formulario.json');
  const trocar = { meta_api_url: url + '/', meta_id_numero: '123456789', meta_token: 'token-teste', numero_atendente: '55 11 97777-6666', ...extras };
  for (const g of tb.groups) for (const b of g.blocks) {
    const nome = tb.variables.find((v) => v.id === b.options?.variableId)?.name;
    if (b.type === 'Set variable' && nome in trocar) b.options.expressionToEvaluate = trocar[nome];
  }
  return tb;
}

test('formulário: campos obrigatórios, uma mensagem para o atendente e o aviso para o cliente', async () => {
  const { srv, recebidas, url } = await servidorFalso();
  try {
    const s = criarSessao(formularioCom(url), { preenchidas: { assunto: 'Administrativo/Financeiro', whatsapp: '5511988887777' } });
    const abertura = (await s.iniciar()).join('\n');
    assert.match(abertura, /Assunto: \*Administrativo\/Financeiro\*/);
    assert.deepEqual(await s.responder('   '), []); // nome vazio não passa
    await s.responder('Maria da Silva');
    assert.match((await s.responder('12')).join(), /telefone não parece válido/);
    await s.responder('(11) 91234-5678');
    assert.match((await s.responder('maria@')).join(), /e-mail não parece válido/);
    await s.responder('maria@exemplo.com');
    await s.responder('Preciso da segunda via do boleto.\nVenceu ontem "hoje".');
    const final = (await s.responder('https://s3.exemplo/a.png https://s3.exemplo/b.png')).join('\n');
    assert.match(final, /Pronto, Maria da Silva! ✅/);
    assert.match(final, /Responderemos em breve pelo e-mail \*maria@exemplo\.com\*/);
    assert.equal(s.terminou, true);

    assert.equal(s.emails.length, 1);
    const [email] = s.emails;
    assert.deepEqual(email.para, ['suporte.pharmaonline@gmail.com']);
    assert.equal(email.responderPara, 'maria@exemplo.com');
    assert.equal(email.assunto, 'Novo atendimento: Administrativo/Financeiro – Maria da Silva');
    assert.match(email.html, /Maria da Silva/);
    assert.match(email.html, /Preciso da segunda via do boleto\.<br>Venceu ontem &quot;hoje&quot;\./);
    assert.match(email.html, /href="https:\/\/s3\.exemplo\/b\.png"/);

    assert.equal(recebidas.length, 2);
    const [atendente, cliente] = recebidas;
    assert.equal(atendente.url, '/v21.0/123456789/messages');
    assert.equal(atendente.headers.authorization, 'Bearer token-teste');
    assert.equal(atendente.corpo.messaging_product, 'whatsapp');
    assert.equal(atendente.corpo.to, '5511977776666');
    assert.equal(atendente.corpo.type, 'text');
    const texto = atendente.corpo.text.body;
    assert.match(texto, /^📋 \*Novo atendimento: Administrativo\/Financeiro\*/);
    assert.match(texto, /\*Nome:\* Maria da Silva/);
    assert.match(texto, /\*Telefone:\* \+5511912345678/);
    assert.match(texto, /\*E-mail:\* maria@exemplo\.com/);
    assert.match(texto, /\*WhatsApp de origem:\* \+5511988887777/);
    assert.match(texto, /Preciso da segunda via do boleto\.\nVenceu ontem "hoje"\./);
    assert.match(texto, /\*Anexos \(2\):\*\n1\. https:\/\/s3\.exemplo\/a\.png\n2\. https:\/\/s3\.exemplo\/b\.png/);

    assert.equal(cliente.url, '/v21.0/123456789/messages');
    assert.equal(cliente.headers.authorization, 'Bearer token-teste');
    assert.equal(cliente.corpo.to, '5511988887777');
    assert.match(cliente.corpo.text.body, /^Olá, Maria da Silva! Recebemos seu formulário de \*Administrativo\/Financeiro\*/);
    assert.match(cliente.corpo.text.body, /Responderemos em breve pelo e-mail \*maria@exemplo\.com\*/);
  } finally {
    srv.close();
  }
});

test('formulário: sem anexos, sem assunto no link e com modelo da Meta para o atendente', async () => {
  const { srv, recebidas, url } = await servidorFalso();
  try {
    const s = criarSessao(formularioCom(url, { template_atendente: 'novo_atendimento' }), { preenchidas: {} });
    assert.match((await s.iniciar()).join(), /Assunto: \*Fale conosco\*/);
    for (const r of ['João', '+55 21 99876-5432', 'joao@exemplo.com.br', 'Quero falar com vocês.']) await s.responder(r);
    await s.responder('pular');
    assert.equal(recebidas.length, 2);
    const [atendente, cliente] = recebidas;
    assert.equal(atendente.url, '/v21.0/123456789/messages');
    assert.equal(atendente.corpo.type, 'template');
    assert.equal(atendente.corpo.template.name, 'novo_atendimento');
    assert.deepEqual(atendente.corpo.template.language, { code: 'pt_BR' });
    assert.deepEqual(atendente.corpo.template.components[0].parameters.map((p) => p.text),
      ['Fale conosco', 'João', '+5521998765432', 'joao@exemplo.com.br', 'Quero falar com vocês.', 'nenhum']);
    assert.equal(cliente.corpo.to, '5521998765432'); // sem WhatsApp no link: usa o telefone digitado
  } finally {
    srv.close();
  }
});

test('formulário (configuração atual): resumo só por e-mail, sem número de atendente no WhatsApp', async () => {
  const { srv, recebidas, url } = await servidorFalso();
  try {
    const s = criarSessao(formularioCom(url, { numero_atendente: '' }), { preenchidas: { assunto: 'Fale conosco', whatsapp: '5511988887777' } });
    await s.iniciar();
    for (const r of ['Ana', '31 99999-0000', 'ana@exemplo.com', 'Dúvida <script>alert(1)</script>']) await s.responder(r);
    await s.responder('pular');
    assert.equal(s.emails.length, 1);
    assert.doesNotMatch(s.emails[0].html, /<script>/);
    assert.match(s.emails[0].html, /&lt;script&gt;/);
    assert.equal(recebidas.length, 1, 'só o aviso ao cliente vai pela API da Meta');
    assert.equal(recebidas[0].corpo.to, '5511988887777');
    assert.equal(s.terminou, true);
  } finally {
    srv.close();
  }
});

test('formulário: sem e-mail e sem número de atendente, ainda avisa o cliente e encerra', async () => {
  const { srv, recebidas, url } = await servidorFalso();
  try {
    const s = criarSessao(formularioCom(url, { numero_atendente: '', email_atendente: '' }), { preenchidas: {} });
    await s.iniciar();
    for (const r of ['Ana', '31 99999-0000', 'ana@exemplo.com', 'Oi', 'pular']) await s.responder(r);
    assert.equal(s.emails.length, 0);
    assert.equal(recebidas.length, 1);
    assert.equal(s.terminou, true);
  } finally {
    srv.close();
  }
});
