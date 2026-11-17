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

async function conversa(mensagens, preenchidas = { remoteJid: '5511988887777@s.whatsapp.net' }) {
  const s = criarSessao(ler('atendimento.json'), { preenchidas });
  const respostas = [(await s.iniciar()).join('\n---\n')];
  for (const m of mensagens) respostas.push((await s.responder(m)).join('\n---\n'));
  return { s, respostas };
}

test('WhatsApp: primeira mensagem recebe boas-vindas com o menu completo', async () => {
  const { respostas, s } = await conversa([]);
  assert.match(respostas[0], /^(Bom dia|Boa tarde|Boa noite)! Seja bem-vindo\(a\) à \*pHarmaOnline\*/);
  for (const linha of ['*0* - Voltar ao menu inicial', '*1* - Orçamento pelo app', '*2* - Orçamento pelo WhatsApp (ordem de pedido)', '*3* - Acessar o site', '*4* - Administrativo/Financeiro', '*5* - Redes sociais', '*6* - Fale conosco']) {
    assert.ok(respostas[0].includes(linha), linha);
  }
  assert.equal(s.aguardando, 'text input');
});

test('WhatsApp: cada opção, o 0 e as frases, sem nunca encerrar a conversa', async () => {
  const { respostas, s } = await conversa(['1', 'Orçamento pelo app', '2', '3', '4', '5', '6', '0', 'xyz', 'oi', 'obrigado', 'redes sociais']);
  const [, r1, r1f, r2, r3, r4, r5, r6, r0, rx, roi, robg, rredes] = respostas;
  assert.match(r1, /^\*Orçamento pelo app\*/);
  assert.match(r1, /https:\/\/LINK-DOWNLOAD-DO-APP/);
  assert.match(r1, /https:\/\/LINK-PARA-ABRIR-O-APP/);
  assert.equal(r1f, r1);
  assert.match(r2, /estará disponível em breve/);
  assert.match(r3, /https:\/\/LINK-DO-SITE/);
  assert.match(r4, /pharma-formulario\?assunto=Administrativo%2FFinanceiro&whatsapp=5511988887777/);
  assert.match(r5, /instagram\.com\/pharmaonlineplus[\s\S]*facebook[\s\S]*tiktok[\s\S]*youtube/);
  assert.match(r6, /pharma-formulario\?assunto=Fale%20conosco&whatsapp=5511988887777/);
  assert.equal(r0, respostas[0]);
  assert.match(rx, /^Desculpe, não consegui identificar[\s\S]*\*6\* - Fale conosco/);
  assert.equal(roi, respostas[0]);
  assert.match(robg, /agradecemos/);
  assert.match(rredes, /^\*Redes sociais\*/);
  for (const r of [r1, r3, r4, r5, r6]) assert.match(r, /digite \*0\*/);
  assert.equal(s.terminou, false);
  assert.equal(s.aguardando, 'text input');
});

test('WhatsApp: sem remoteJid (teste no painel do Typebot) o link do formulário sai sem o número', async () => {
  const { respostas } = await conversa(['4'], {});
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
  const trocar = { evolution_url: url + '/', evolution_apikey: 'chave-teste', numero_atendente: '55 11 97777-6666', ...extras };
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
    assert.match(final, /Pronto, Maria da Silva! Recebemos as suas informações/);
    assert.equal(s.terminou, true);

    assert.equal(recebidas.length, 2);
    const [atendente, cliente] = recebidas;
    assert.equal(atendente.url, '/message/sendText/pharmaonline');
    assert.equal(atendente.headers.apikey, 'chave-teste');
    assert.equal(atendente.corpo.number, '5511977776666');
    const texto = atendente.corpo.text;
    assert.match(texto, /^📋 \*Novo atendimento: Administrativo\/Financeiro\*/);
    assert.match(texto, /\*Nome:\* Maria da Silva/);
    assert.match(texto, /\*Telefone:\* \+5511912345678/);
    assert.match(texto, /\*E-mail:\* maria@exemplo\.com/);
    assert.match(texto, /\*WhatsApp de origem:\* \+5511988887777/);
    assert.match(texto, /Preciso da segunda via do boleto\.\nVenceu ontem "hoje"\./);
    assert.match(texto, /\*Anexos \(2\):\*\n1\. https:\/\/s3\.exemplo\/a\.png\n2\. https:\/\/s3\.exemplo\/b\.png/);

    assert.equal(cliente.url, '/message/sendText/pharmaonline');
    assert.equal(cliente.corpo.number, '5511988887777');
    assert.match(cliente.corpo.text, /^Olá, Maria da Silva! Recebemos o seu formulário de \*Administrativo\/Financeiro\*/);
    assert.match(cliente.corpo.text, /Em breve, uma pessoa da nossa equipe entrará em contato/);
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
    assert.equal(atendente.url, '/message/sendTemplate/pharmaonline');
    assert.equal(atendente.corpo.name, 'novo_atendimento');
    assert.deepEqual(atendente.corpo.components[0].parameters.map((p) => p.text),
      ['Fale conosco', 'João', '+5521998765432', 'joao@exemplo.com.br', 'Quero falar com vocês.', 'nenhum']);
    assert.equal(cliente.corpo.number, '5521998765432'); // sem WhatsApp no link: usa o telefone digitado
  } finally {
    srv.close();
  }
});
