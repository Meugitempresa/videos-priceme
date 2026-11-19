// Gera docs/formulario-de-atendimento.pdf: guia explicativo do formulário das opções Administrativo/Financeiro
// e Fale conosco (passo a passo, regras, o que acontece depois e perguntas frequentes).
// Os textos vêm de config/textos.json; as telas são ilustrações no estilo do formulário (cores da marca).
// Uso: node scripts/gerar-pdf-formulario.mjs [--fontes PASTA_COM_MONTSERRAT_WOFF2]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { montarResumoHtml } from '../src/logica.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lerJson = (rel) => JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8'));
const args = process.argv.slice(2);
const pastaFontes = args.includes('--fontes') ? args[args.indexOf('--fontes') + 1] : null;
const saida = path.join(RAIZ, 'docs', 'formulario-de-atendimento.pdf');

const t = lerJson('config/textos.json').formulario;
const vars = fs.existsSync(path.join(RAIZ, 'config/variaveis.json')) ? lerJson('config/variaveis.json') : lerJson('config/variaveis.example.json');
const emailEquipe = vars.formulario.email_atendente;
const dataUri = (arquivo, tipo) => 'data:' + tipo + ';base64,' + fs.readFileSync(arquivo).toString('base64');
const banner = dataUri(path.join(RAIZ, 'midia/banner-pharmaonline.jpg'), 'image/jpeg');
const fonte = (peso) => pastaFontes
  ? `@font-face{font-family:Montserrat;font-weight:${peso};src:url(${dataUri(path.join(pastaFontes, 'montserrat-latin-' + peso + '-normal.woff2'), 'font/woff2')}) format('woff2');}`
  : '';

const ex = { nome: 'Maria da Silva', email: 'maria@exemplo.com', assunto: 'Fale conosco' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = (s) => esc(s).replace(/\*([^*\n]+)\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
const txt = (lista) => fmt(lista.join('\n').replace(/\{\{(\w+)\}\}/g, (_, n) => ex[n] ?? n));

// Peças da "tela" do formulário
const bot = (lista) => '<div class="b-bot">' + txt(lista) + '</div>';
const eu = (s) => '<div class="lado"><div class="b-eu">' + esc(s) + '</div></div>';
const campo = (ph, { grande = false, tel = false } = {}) =>
  '<div class="campo-linha"><div class="campo' + (grande ? ' grande' : '') + '">' + (tel ? '<span class="ddi">🇧🇷 ▾</span>' : '') +
  '<span class="ph">' + esc(ph) + '</span></div><div class="enviar">Enviar</div></div>';
const upload = () => '<div class="upload">☁️<br>Clique ou arraste as imagens aqui</div><div class="lado"><div class="pular">Não tenho imagens para enviar</div></div>';
const tela = (titulo, conteudo) => '<div class="tela"><div class="tela-topo">' + esc(titulo) + '</div><div class="tela-corpo">' + conteudo + '</div></div>';

const passo = (n, titulo, explicacao, telaHtml) => `
  <section class="passo">
    <div class="passo-txt">
      <div class="passo-topo"><span class="num">${n}</span><h3>${titulo}</h3></div>
      ${explicacao}
    </div>
    <div class="passo-tela">${telaHtml}</div>
  </section>`;

const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const emailHtml = montarResumoHtml({
  assunto: 'Fale conosco', nome: ex.nome, telefone: '+5531988887777', email: ex.email, whatsapp: '5531988887777',
  duvida: 'Gostaria de saber se vocês entregam no meu bairro.\nObrigada!', anexos: ['https://arquivos.pharmaonline/exemplo-foto.jpg'],
}, new Date('2026-11-19T17:30:00Z'));

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
${fonte(400)}${fonte(600)}${fonte(700)}${fonte(800)}
@page { size: A4; margin: 15mm 14mm; }
:root { --azul:#2D4589; --rosa:#F49AC1; --texto:#1F2A44; --cinza:#6B7280; --claro:#F4F6FB; }
* { box-sizing: border-box; }
body { font-family: Montserrat, Arial, sans-serif; color: var(--texto); font-size: 10.5pt; line-height: 1.5; margin: 0; }
h1, h2, h3 { color: var(--azul); line-height: 1.2; }
h2 { font-size: 17pt; margin: 0 0 4mm; padding-bottom: 2mm; border-bottom: 3px solid var(--rosa); }
h3 { font-size: 12pt; margin: 0; }
p { margin: 0 0 2.5mm; }
ul { margin: 0 0 3mm; padding-left: 5mm; } li { margin-bottom: 1.4mm; }
.capa { height: 265mm; display: flex; flex-direction: column; justify-content: center; page-break-after: always; }
.capa img { width: 100%; border-radius: 10px; }
.capa h1 { font-size: 26pt; margin: 12mm 0 3mm; font-weight: 800; }
.capa .faixa { height: 6px; width: 60mm; background: var(--rosa); border-radius: 3px; margin-bottom: 8mm; }
.capa .sub { font-size: 13pt; color: var(--cinza); margin-bottom: 10mm; }
.capa .meta { font-size: 10pt; color: var(--cinza); }
.secao { page-break-before: always; }
.caixa { background: var(--claro); border-left: 5px solid var(--rosa); border-radius: 6px; padding: 4mm 5mm; margin: 3mm 0 5mm; }
table { width: 100%; border-collapse: collapse; margin: 2mm 0 5mm; font-size: 9.8pt; }
th { background: var(--azul); color: #fff; text-align: left; padding: 2.5mm 3mm; }
td { border-bottom: 1px solid #E3E7F2; padding: 2.2mm 3mm; vertical-align: top; }
.sim { color: #0F7B3E; font-weight: 700; } .nao { color: var(--cinza); font-weight: 700; }
.fluxo { display: flex; align-items: stretch; gap: 2mm; margin: 3mm 0 5mm; }
.fluxo div.etapa { flex: 1; background: var(--claro); border-radius: 8px; padding: 3mm; font-size: 9pt; text-align: center; border-top: 4px solid var(--azul); }
.fluxo div.seta { align-self: center; color: var(--rosa); font-weight: 800; font-size: 14pt; }
.passo { display: flex; gap: 6mm; border: 1px solid #E3E7F2; border-radius: 10px; padding: 4mm; margin: 0 0 4.5mm; break-inside: avoid; }
.passo-txt { flex: 1.15; font-size: 10pt; } .passo-tela { flex: 1; }
.passo-topo { display: flex; align-items: center; gap: 3mm; margin-bottom: 2.5mm; }
.num { background: var(--azul); color: #fff; font-weight: 800; border-radius: 50%; width: 8mm; height: 8mm; display: inline-flex; align-items: center; justify-content: center; font-size: 10pt; flex: none; }
.tela { border: 2px solid #1B2A57; border-radius: 12px; overflow: hidden; font-size: 8.6pt; line-height: 1.38; }
.tela-topo { background: #1B2A57; color: #fff; font-size: 7.5pt; padding: 1.2mm 3mm; letter-spacing: .02em; }
.tela-corpo { background: var(--azul); padding: 3mm; }
.b-bot { background: #fff; color: var(--texto); border-radius: 6px; padding: 2mm 2.6mm; margin: 0 0 1.8mm; max-width: 92%; }
.lado { display: flex; justify-content: flex-end; }
.b-eu { background: var(--rosa); color: var(--texto); border-radius: 6px; padding: 2mm 2.6mm; margin: 0 0 1.8mm; max-width: 80%; }
.campo-linha { display: flex; gap: 1.5mm; align-items: stretch; margin-top: 1mm; }
.campo { flex: 1; background: #fff; border-radius: 6px; padding: 2mm 2.6mm; color: var(--cinza); display: flex; align-items: center; gap: 2mm; }
.campo.grande { min-height: 16mm; align-items: flex-start; }
.ddi { color: var(--texto); }
.enviar { background: var(--rosa); color: var(--texto); font-weight: 700; border-radius: 6px; padding: 2mm 3mm; display: flex; align-items: center; }
.upload { background: #C5CBDD; border: 1.5px dashed #8E98B8; border-radius: 6px; text-align: center; color: #4B5675; padding: 3.5mm; margin: 1mm 0 1.8mm; }
.pular { background: #C084B3; color: var(--texto); font-weight: 700; border-radius: 6px; padding: 2mm 3mm; }
.erro { background: #fff; border-left: 4px solid #D64545; }
.tela, .dupla, .zap { break-inside: avoid; }
.legenda { font-size: 8pt; color: var(--cinza); margin-top: 1.5mm; text-align: center; }
.email { font-size: 9pt; margin: 2mm 0 3mm; zoom: .82; }
.zap { background: #EFE7DE; border-radius: 8px; padding: 3mm; margin: 2mm 0 3mm; }
.zap .msg { background: #fff; border-radius: 7px; padding: 2.2mm 3mm; font-size: 9.5pt; max-width: 88%; }
.pergunta { font-weight: 700; color: var(--azul); margin: 3.5mm 0 1mm; }
</style></head><body>

<div class="capa">
  <img src="${banner}" alt="pHarma Online">
  <h1>Formulário de atendimento</h1>
  <div class="faixa"></div>
  <div class="sub">Como funciona o formulário das opções <b>Administrativo/Financeiro</b> e <b>Fale conosco</b> do WhatsApp: o que o cliente vê, o que ele precisa preencher e como a resposta chega até a equipe.</div>
  <div class="meta">pHarma Online · versão para aprovação · ${hoje}</div>
</div>

<div class="secao">
<h2>Para que serve</h2>
<p>O formulário reúne, de uma vez só e de forma organizada, tudo o que a equipe precisa para atender o cliente: quem ele é, como falar com ele e qual é a dúvida. Assim ninguém precisa ficar trocando várias mensagens para pedir dados.</p>
<div class="caixa"><ul>
  <li><b>Quando o cliente recebe:</b> ao escolher, no WhatsApp, a opção <b>3 – Administrativo/Financeiro</b> ou a opção <b>5 – Fale conosco</b>. O bot responde com o link do formulário.</li>
  <li><b>Onde abre:</b> no navegador do próprio celular (ou do computador). Não é preciso instalar nada nem criar conta.</li>
  <li><b>Visual:</b> página nas cores da pHarma Online (azul e rosa), em formato de conversa: uma pergunta de cada vez.</li>
  <li><b>Duração:</b> menos de um minuto.</li>
  <li><b>Assunto automático:</b> o formulário já sabe de qual opção o cliente veio e mostra "Administrativo/Financeiro" ou "Fale conosco". O cliente não precisa escolher.</li>
  <li><b>Resposta:</b> a equipe responde ao cliente <b>por e-mail</b>, no endereço que ele informar.</li>
</ul></div>

<h2>O caminho completo</h2>
<div class="fluxo">
  <div class="etapa"><b>1.</b> No WhatsApp, o cliente escolhe a opção 3 ou 5</div><div class="seta">›</div>
  <div class="etapa"><b>2.</b> Toca no link e abre o formulário</div><div class="seta">›</div>
  <div class="etapa"><b>3.</b> Responde às perguntas e envia</div><div class="seta">›</div>
  <div class="etapa"><b>4.</b> A equipe recebe tudo em um e-mail</div><div class="seta">›</div>
  <div class="etapa"><b>5.</b> A equipe responde o cliente por e-mail</div>
</div>

</div>
<div class="secao">
<h2>O que o cliente preenche</h2>
<table>
  <tr><th>Campo</th><th>Obrigatório?</th><th>Como funciona</th></tr>
  <tr><td><b>Nome completo</b></td><td class="sim">Sim</td><td>Texto livre. O formulário não avança se ficar em branco.</td></tr>
  <tr><td><b>Telefone com DDD</b></td><td class="sim">Sim</td><td>Já vem com a bandeira do Brasil (+55). Se o número estiver incompleto ou errado, o formulário pede para conferir.</td></tr>
  <tr><td><b>E-mail</b></td><td class="sim">Sim</td><td>É por ele que a equipe responde. Se o e-mail não estiver no formato correto (ex.: faltar o "@" ou o ".com"), o formulário pede para digitar de novo.</td></tr>
  <tr><td><b>Dúvida ou mensagem</b></td><td class="sim">Sim</td><td>Campo grande, para o cliente escrever com todos os detalhes. Aceita várias linhas.</td></tr>
  <tr><td><b>Imagens</b></td><td class="nao">Não</td><td>O cliente pode anexar uma ou várias imagens (fotos, prints). Se não tiver, toca em "Não tenho imagens para enviar".</td></tr>
</table>
</div>

<h2 style="margin-top:6mm">Passo a passo, tela por tela</h2>
<p style="font-size:9pt;color:var(--cinza)">As telas abaixo são ilustrações fiéis ao formulário (mesmos textos e cores); no celular do cliente o tamanho se ajusta à tela.</p>
${passo(1, 'Abertura e nome', `<p>Assim que o cliente abre o link, o formulário se apresenta, mostra o assunto e já pergunta o nome.</p><p>Os textos avisam que leva menos de um minuto e quais campos são obrigatórios.</p>`,
  tela('Formulário de atendimento', bot(t.abertura) + bot(t.pergunta_nome) + campo('Seu nome completo')))}
${passo(2, 'Telefone', `<p>O formulário agradece pelo nome e pede o telefone com DDD.</p><p>O campo já vem com a bandeira do Brasil. O cliente pode digitar o número com ou sem traços e parênteses.</p>`,
  tela('Formulário de atendimento', eu(ex.nome) + bot(t.pergunta_telefone) + campo('(11) 91234-5678', { tel: true })))}
${passo(3, 'E-mail', `<p>Depois, o e-mail. A pergunta já explica que é por ele que a equipe vai responder, para o cliente digitar com atenção.</p>`,
  tela('Formulário de atendimento', eu('+5531988887777') + bot(t.pergunta_email) + campo('seuemail@exemplo.com')))}
${passo(4, 'Dúvida ou mensagem', `<p>Um campo grande para o cliente explicar o que precisa, com todos os detalhes.</p><p>Ele pode escrever quantas linhas quiser antes de tocar em <b>Enviar</b>.</p>`,
  tela('Formulário de atendimento', eu(ex.email) + bot(t.pergunta_duvida) + campo('Escreva aqui a sua dúvida ou mensagem...', { grande: true })))}
${passo(5, 'Imagens (opcional)', `<p>Se quiser, o cliente anexa imagens que ajudem a entender o pedido: por exemplo, a foto de um boleto, de uma embalagem ou um print.</p><p>Se não tiver nada para enviar, basta tocar em <b>"Não tenho imagens para enviar"</b>.</p>`,
  tela('Formulário de atendimento', bot(t.pergunta_anexos) + upload()))}
${passo(6, 'Pronto!', `<p>Ao terminar, o cliente vê a confirmação na tela, com o e-mail que ele informou, e pode fechar a página.</p><p>Nesse mesmo momento, o formulário avisa o cliente no WhatsApp e envia tudo para a equipe por e-mail (próxima página).</p>`,
  tela('Formulário de atendimento', eu('Não tenho imagens para enviar') + bot(t.final)))}

<h2>Se algo for digitado errado</h2>
<p>O formulário só avança com os dados corretos. Nesses casos, ele mostra um aviso e deixa o cliente digitar de novo:</p>
<div class="dupla" style="display:flex;gap:4mm">
  <div style="flex:1">${tela('Telefone incorreto', eu('123') + '<div class="b-bot erro">Esse telefone não parece válido. Confira o DDD e o número, por favor.</div>')}</div>
  <div style="flex:1">${tela('E-mail incorreto', eu('maria@') + '<div class="b-bot erro">Esse e-mail não parece válido. Confira e digite novamente, por favor.</div>')}</div>
</div>
</div>

<div class="secao">
<h2>Depois que o cliente envia</h2>
<p>Três coisas acontecem ao mesmo tempo, automaticamente:</p>

<p class="pergunta">1. O cliente vê a confirmação na tela</p>
<p>A mensagem "Pronto, (nome)! Recebemos as suas informações", com o e-mail em que será atendido (passo 6).</p>

<p class="pergunta">2. O cliente recebe um aviso no WhatsApp</p>
<p>No mesmo WhatsApp em que ele falou com o bot, chega a confirmação de que o formulário foi recebido:</p>
<div class="zap"><div class="msg">${txt(t.aviso_whatsapp)}</div></div>

<p class="pergunta">3. A equipe recebe um e-mail organizado</p>
<p>Cada formulário chega em <b>${esc(emailEquipe)}</b>, com o assunto <b>"Novo atendimento: (assunto) – (nome)"</b> e todas as informações em uma única mensagem:</p>
<div class="email">${emailHtml}</div>
<div class="caixa"><ul>
  <li><b>Para responder:</b> basta clicar em <b>"Responder"</b> no e-mail. A resposta vai direto para o e-mail do cliente.</li>
  <li><b>Imagens:</b> aparecem como links no e-mail; é só clicar para abrir.</li>
  <li><b>WhatsApp de origem:</b> o número de onde o cliente veio aparece no e-mail e pode ser clicado, caso a equipe prefira chamar por lá.</li>
  <li><b>Cópia de segurança:</b> todos os formulários também ficam guardados no painel do Typebot, em <b>Resultados</b>, caso algum e-mail se perca.</li>
</ul></div>

<h2 style="margin-top:7mm">Perguntas frequentes</h2>
<p class="pergunta">E se o cliente fechar a página no meio?</p>
<p>O formulário não é enviado e a equipe não recebe e-mail. O cliente pode voltar ao WhatsApp, escolher a opção de novo e recomeçar.</p>
<p class="pergunta">E se o cliente digitar o e-mail errado (mas num formato válido)?</p>
<p>O formulário não tem como saber. Por isso o e-mail para a equipe traz também o <b>telefone</b> e o <b>WhatsApp de origem</b>: se a resposta por e-mail voltar, a equipe ainda consegue falar com o cliente.</p>
<p class="pergunta">O cliente pode enviar PDF ou documentos?</p>
<p>Hoje o formulário aceita <b>apenas imagens</b> (fotos e prints). Se for preciso aceitar PDF, dá para liberar depois.</p>
<p class="pergunta">O cliente precisa criar conta ou baixar algum aplicativo?</p>
<p>Não. O formulário abre direto no navegador, a partir do link enviado no WhatsApp.</p>
<p class="pergunta">Quem pode ver as respostas?</p>
<p>Quem recebe o e-mail (${esc(emailEquipe)}) e quem tem acesso ao painel do Typebot da pHarma Online.</p>
<p class="pergunta">Dá para mudar os textos, as perguntas ou o e-mail que recebe?</p>
<p>Sim. Os textos e o e-mail de destino podem ser alterados no painel do Typebot, sem programação. Novas perguntas também podem ser incluídas.</p>

<h2 style="margin-top:6mm">Resumo</h2>
<div class="caixa"><ul>
  <li>O cliente escolhe a opção <b>3</b> ou <b>5</b> no WhatsApp e recebe o link.</li>
  <li>Preenche <b>nome, telefone, e-mail e a dúvida</b> (imagens são opcionais), em menos de um minuto.</li>
  <li>A equipe recebe <b>um e-mail organizado</b> em ${esc(emailEquipe)} e <b>responde por e-mail</b>.</li>
  <li>O cliente é avisado na tela e no WhatsApp de que a resposta virá pelo e-mail informado.</li>
</ul></div>
</div>
</body></html>`;

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const navegador = await chromium.launch();
const pagina = await navegador.newPage();
await pagina.setContent(html, { waitUntil: 'load' });
await pagina.evaluate(() => document.fonts.ready);
await pagina.pdf({ path: saida, format: 'A4', printBackground: true, preferCSSPageSize: true });
await navegador.close();
console.log('Gerado ' + path.relative(RAIZ, saida));
