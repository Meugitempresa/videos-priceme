// Gera docs/mensagens-do-bot.pdf: guia explicativo com todas as mensagens do bot, tiradas dos fluxos reais
// (typebot/*.json, executados pelo motor local), para a cliente conferir e aprovar.
// Uso: node scripts/gerar-pdf.mjs [--fontes PASTA_COM_MONTSERRAT_WOFF2]
// Requer o Playwright com Chromium (já instalado neste ambiente).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { criarSessao } from '../src/motor.js';
import { lerMenu, montarResumoHtml } from '../src/logica.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lerJson = (rel) => JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8'));
const args = process.argv.slice(2);
const pastaFontes = args.includes('--fontes') ? args[args.indexOf('--fontes') + 1] : null;
const saida = path.join(RAIZ, 'docs', 'mensagens-do-bot.pdf');

const textos = lerJson('config/textos.json');
const menu = lerJson('config/menu.json');
const dataUri = (arquivo, tipo) => 'data:' + tipo + ';base64,' + fs.readFileSync(arquivo).toString('base64');
const banner = dataUri(path.join(RAIZ, 'midia/banner-pharmaonline.jpg'), 'image/jpeg');

// ---------- respostas reais do fluxo do WhatsApp ----------
const tb = lerJson('typebot/atendimento.json');
const idBanner = tb.variables.find((v) => v.name === 'link_banner').id;
for (const g of tb.groups) for (const b of g.blocks) {
  if (b.type === 'Set variable' && b.options?.variableId === idBanner) b.options.expressionToEvaluate = 'BANNER';
}
const sessao = criarSessao(tb, { contato: { telefone: '5531900000000', nome: 'Cliente' } });
const saudacao = await sessao.iniciar();
const resp = {};
for (const [chave, msg] of [['app', '1'], ['whatsapp', '2'], ['financeiro', '3'], ['redes', '4'], ['contato', '5'],
  ['nao', 'qual o horário de vocês?'], ['obrigado', 'obrigada!'], ['menu', '0'], ['frase', 'orçamento pelo app']]) {
  resp[chave] = await sessao.responder(msg);
}

// ---------- formatação ----------
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const zap = (t) => esc(t)
  .replace(/\*([^*\n]+)\*/g, '<b>$1</b>')
  .replace(/(^|\s)_([^_\n]+)_(?=\s|$)/g, '$1<i>$2</i>')
  .replace(/(https?:\/\/[^\s<]+|(?:[a-z0-9-]+\.)+(?:com|app|br)\/[^\s<]*)/gi, '<span class="link">$1</span>')
  .replace(/\n/g, '<br>');
// No guia, o endereço provisório do formulário aparece como "(link do formulário)".
const semLinkProvisorio = (m) => m.replace(/https?:\/\/TYPEBOT-VIEWER\/\S+/g, '(link do formulário)');
const balao = (m) => (m === '[imagem: BANNER]'
  ? '<div class="balao img"><img src="' + banner + '" alt="Banner pHarma Online"></div>'
  : '<div class="balao">' + zap(semLinkProvisorio(m)) + '</div>');
const cliente = (t) => '<div class="linha-cliente"><div class="balao cli">' + esc(t) + '</div></div>';
const chat = (entrada, mensagens) =>
  '<div class="chat">' + (entrada ? cliente(entrada) : '') + mensagens.map(balao).join('') + '</div>';
const linhas = (lista, troca = {}) => lista.join('\n').replace(/\{\{(\w+)\}\}/g, (_, n) => troca[n] ?? '(' + n + ')');

const itensVisiveis = lerMenu(menu);
const site = menu.itens.find((i) => i.id === 'site');

const card = (num, titulo, quando, conteudo, depois) => `
  <section class="card">
    <div class="card-topo"><span class="num">${num}</span><h3>${titulo}</h3></div>
    <p class="quando"><b>Quando aparece:</b> ${quando}</p>
    ${conteudo}
    ${depois ? '<p class="depois"><b>O que acontece depois:</b> ' + depois + '</p>' : ''}
  </section>`;

const exForm = { nome: 'Maria da Silva', email: 'maria@exemplo.com', assunto: 'Administrativo/Financeiro' };
const formChat = (lista) => '<div class="chat web">' + lista.map((l) => '<div class="balao web-bot">' + zap(linhas(l, exForm)) + '</div>').join('') + '</div>';

const fonte = (peso) => pastaFontes
  ? `@font-face{font-family:Montserrat;font-weight:${peso};src:url(${dataUri(path.join(pastaFontes, 'montserrat-latin-' + peso + '-normal.woff2'), 'font/woff2')}) format('woff2');}`
  : '';

const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>
${fonte(400)}${fonte(600)}${fonte(700)}${fonte(800)}
@page { size: A4; margin: 16mm 14mm 16mm 14mm; }
:root { --azul:#2D4589; --rosa:#F49AC1; --texto:#1F2A44; --cinza:#6B7280; --claro:#F4F6FB; }
* { box-sizing: border-box; }
body { font-family: Montserrat, Arial, sans-serif; color: var(--texto); font-size: 10.5pt; line-height: 1.5; margin: 0; }
h1, h2, h3 { color: var(--azul); line-height: 1.2; }
h2 { font-size: 17pt; margin: 0 0 4mm; padding-bottom: 2mm; border-bottom: 3px solid var(--rosa); }
h3 { font-size: 12pt; margin: 0; }
p { margin: 0 0 2.5mm; }
.capa { height: 262mm; display: flex; flex-direction: column; justify-content: center; page-break-after: always; }
.capa img { width: 100%; border-radius: 10px; }
.capa h1 { font-size: 26pt; margin: 12mm 0 3mm; font-weight: 800; }
.capa .sub { font-size: 13pt; color: var(--cinza); margin-bottom: 10mm; }
.capa .faixa { height: 6px; width: 60mm; background: var(--rosa); border-radius: 3px; margin-bottom: 8mm; }
.capa .meta { font-size: 10pt; color: var(--cinza); }
.secao { page-break-before: always; }
.caixa { background: var(--claro); border-left: 5px solid var(--rosa); border-radius: 6px; padding: 4mm 5mm; margin: 3mm 0 5mm; }
ul { margin: 0 0 3mm; padding-left: 5mm; } li { margin-bottom: 1.5mm; }
table { width: 100%; border-collapse: collapse; margin: 2mm 0 5mm; font-size: 10pt; }
th { background: var(--azul); color: #fff; text-align: left; padding: 2.5mm 3mm; }
td { border-bottom: 1px solid #E3E7F2; padding: 2.2mm 3mm; vertical-align: top; }
td.n { font-weight: 800; color: var(--azul); width: 12mm; text-align: center; }
.card { border: 1px solid #E3E7F2; border-radius: 10px; padding: 3.5mm 4.5mm; margin: 0 0 4mm; break-inside: avoid; }
.card-topo { display: flex; align-items: center; gap: 3mm; margin-bottom: 2mm; }
.num { background: var(--azul); color: #fff; font-weight: 800; border-radius: 50%; width: 8mm; height: 8mm; display: inline-flex; align-items: center; justify-content: center; font-size: 10pt; flex: none; }
.quando, .depois { font-size: 9.5pt; color: #3B4663; }
.chat { background: #EFE7DE; border-radius: 8px; padding: 3mm; margin: 2mm 0 3mm; }
.chat.web { background: var(--azul); }
.balao { background: #fff; border-radius: 7px; padding: 2mm 3mm; margin: 0 0 1.8mm; max-width: 88%; font-size: 9.5pt; line-height: 1.42; box-shadow: 0 1px 0 rgba(0,0,0,.08); }
.balao:last-child { margin-bottom: 0; }
.balao.img { padding: 1.2mm; max-width: 70%; } .balao.img img { width: 100%; border-radius: 5px; display: block; }
.linha-cliente { display: flex; justify-content: flex-end; }
.balao.cli { background: #D9FDD3; }
.balao.web-bot { background: #fff; }
.link { color: #1A6FD1; text-decoration: underline; word-break: break-all; }
.dupla { display: flex; gap: 4mm; } .dupla > div { flex: 1; }
.email { margin: 2mm 0 3mm; font-size: 9.5pt; }
.etq { display: inline-block; background: var(--rosa); color: var(--texto); font-weight: 700; font-size: 8.5pt; border-radius: 4px; padding: .5mm 2mm; margin-left: 2mm; vertical-align: middle; }
.rodape { color: var(--cinza); font-size: 8.5pt; margin-top: 6mm; }
</style></head><body>

<div class="capa">
  <img src="${banner}" alt="pHarma Online">
  <h1>Bot de atendimento no WhatsApp</h1>
  <div class="faixa"></div>
  <div class="sub">Guia de todas as mensagens: o que o bot responde, quando e o que acontece em seguida.</div>
  <div class="meta">pHarma Online · versão para aprovação · ${hoje}</div>
</div>

<div class="secao">
<h2>Como o bot funciona</h2>
<p>O bot é um <b>assistente simples</b>: ele não conversa nem usa inteligência artificial. A função dele é <b>mostrar as opções</b> e <b>entregar a resposta certa</b> para cada uma, sozinho, 24 horas por dia.</p>
<div class="caixa">
<ul>
  <li><b>Primeira mensagem:</b> qualquer mensagem que o cliente mande abre a conversa e recebe o banner, a saudação e o menu.</li>
  <li><b>Escolher uma opção:</b> o cliente digita o <b>número</b> (por exemplo, "1") ou escreve o <b>nome da opção</b> (por exemplo, "orçamento pelo app"). As duas formas funcionam.</li>
  <li><b>Opção 0 em qualquer momento:</b> digitar <b>0</b> (ou "voltar", "menu") mostra o menu de novo, de qualquer ponto da conversa.</li>
  <li><b>Saudações</b> ("oi", "olá", "bom dia, tudo bem?") recebem de novo o banner, a saudação e o menu.</li>
  <li><b>Assunto fora do menu, áudio, figurinha ou foto:</b> o bot explica, em uma frase, que basta digitar o número da opção e mostra o menu. Ele não trava e não inventa respostas.</li>
  <li><b>Conversa parada:</b> depois de 12 horas sem mensagens, a próxima mensagem recomeça pelas boas-vindas.</li>
</ul>
</div>

<h2>O menu</h2>
<p>A numeração é automática: se uma opção for retirada ou mudar de lugar, as outras se reorganizam sozinhas, sem buracos.</p>
<table>
  <tr><th>Nº</th><th>Opção</th><th>O que faz</th></tr>
  <tr><td class="n">0</td><td>Voltar ao menu inicial</td><td>Mostra o menu de novo (sem o banner).</td></tr>
  ${itensVisiveis.map((i) => `<tr><td class="n">${i.numero}</td><td>${esc(i.nome)}</td><td>${({
    app: 'Envia o link do app para o orçamento em tempo real.',
    whatsapp: 'Encaminha para atendimento com uma pessoa da equipe, pelo WhatsApp.',
    financeiro: 'Envia o link do formulário; a resposta vai por e-mail.',
    redes: 'Envia os links do Instagram, Facebook, TikTok e YouTube.',
    contato: 'Informa o e-mail suporte.pharmaonline@gmail.com para o cliente escrever; a resposta vai por e-mail.',
    site: 'Envia o link do site.',
  })[i.id] ?? ''}</td></tr>`).join('')}
  ${site && site.oculto ? `<tr><td class="n">–</td><td>${esc(site.nome)} <span class="etq">oculta</span></td><td>Fica fora do menu até a loja da Nuvemshop ser publicada. Ao ativar, ela vira a opção 3 e as seguintes descem um número.</td></tr>` : ''}
</table>
</div>

<div class="secao">
<h2>Mensagens no WhatsApp</h2>
${card(1, 'Saudação (primeira mensagem)', 'no primeiro contato do cliente e sempre que ele mandar uma saudação ("oi", "olá", "bom dia"…). São três mensagens seguidas.', chat('Olá, boa tarde!', saudacao), 'o bot aguarda o cliente escolher uma opção.')}
${card(2, 'Opção 0: voltar ao menu', 'quando o cliente digita 0 (ou "voltar", "menu"), em qualquer momento da conversa.', chat('0', resp.menu), 'o bot aguarda a escolha de uma opção.')}
${card(3, 'Opção 1: Orçamento pelo app', 'quando o cliente digita 1 ou escreve o nome da opção (ex.: "orçamento pelo app", "orçamento em tempo real", "aplicativo").', chat('1', resp.app), 'o cliente abre o app pelo link. No WhatsApp, ele pode digitar 0 para ver o menu de novo.')}
${card(4, 'Opção 2: Orçamento pelo WhatsApp (ordem de pedido)', 'quando o cliente digita 2 ou escreve, por exemplo, "orçamento pelo WhatsApp" ou "ordem de pedido".', chat('2', resp.whatsapp), 'ao tocar no link, o WhatsApp do cliente abre uma conversa nova com o número de atendimento (31) 99921-1377, onde uma pessoa da equipe faz o orçamento.')}
${card(5, 'Opção 3: Administrativo/Financeiro', 'quando o cliente digita 3 ou escreve, por exemplo, "financeiro", "boleto", "nota fiscal" ou "pagamento".', chat('3', resp.financeiro), 'o cliente preenche o formulário (veja a seção "Formulário"). A equipe recebe tudo por e-mail e responde ao cliente por e-mail.')}
${card(6, 'Opção 4: Redes sociais', 'quando o cliente digita 4 ou escreve, por exemplo, "redes sociais", "instagram" ou "facebook".', chat('4', resp.redes), '')}
${card(7, 'Opção 5: Fale conosco', 'quando o cliente digita 5 ou escreve, por exemplo, "fale conosco", "contato" ou "falar com atendente".', chat('5', resp.contato), 'o cliente escreve para o e-mail suporte.pharmaonline@gmail.com e a equipe responde por e-mail. Não há formulário nesta opção.')}
${card(8, 'Mensagem não reconhecida', 'quando o cliente escreve algo fora do menu, digita um número que não existe, ou manda áudio, figurinha ou foto.', chat('qual o horário de vocês?', resp.nao), 'o bot aguarda o cliente escolher uma opção.')}
${card(9, 'Agradecimento', 'quando o cliente agradece ("obrigado", "obrigada", "valeu").', chat('obrigada!', resp.obrigado), '')}
${card(10, 'Acessar o site <span class="etq">oculta</span>', 'só depois de a opção ser ativada, quando a loja da Nuvemshop for publicada.', chat('', [linhas(textos.respostas.site, { link_site: '(link do site)' })]), '')}
${card(11, 'Opção "em breve"', 'só se alguma opção for marcada como indisponível. Hoje nenhuma está.', chat('', [linhas(textos.indisponivel, { item_nome: 'Nome da opção' })]), '')}
</div>

<div class="secao">
<h2>Formulário (opção 3)</h2>
<p>O formulário é uma página na internet, nas cores da pHarma Online (azul e rosa), que abre pelo link enviado no WhatsApp. Ele faz uma pergunta de cada vez. <b>Nome, telefone e e-mail são obrigatórios</b>; a mensagem tem um campo grande; as imagens são opcionais.</p>
${card(12, 'Abertura e perguntas', 'assim que o cliente abre o link enviado na opção 3. O assunto "Administrativo/Financeiro" aparece sozinho.', formChat([textos.formulario.abertura, textos.formulario.pergunta_nome, textos.formulario.pergunta_telefone, textos.formulario.pergunta_email, textos.formulario.pergunta_duvida, textos.formulario.pergunta_anexos]), 'se não tiver imagem, o cliente toca no botão "Não tenho imagens para enviar".')}
${card(13, 'Avisos de erro', 'quando o telefone ou o e-mail são digitados de forma errada. O formulário só avança com os dados corretos.', formChat([['Esse telefone não parece válido. Confira o DDD e o número, por favor.'], ['Esse e-mail não parece válido. Confira e digite novamente, por favor.']]), '')}
${card(14, 'Tela final do formulário', 'logo depois de o cliente enviar o formulário.', formChat([textos.formulario.final]), 'ao mesmo tempo, o bot envia a mensagem 15 no WhatsApp do cliente e o e-mail 16 para a equipe.')}
${card(15, 'Aviso no WhatsApp do cliente', 'logo depois de o cliente enviar o formulário (chega no mesmo WhatsApp em que ele conversou com o bot).', chat('', [linhas(textos.formulario.aviso_whatsapp, exForm)]), '')}
</div>

<div class="secao">
<h2>E-mail para a equipe</h2>
${card(16, 'Formulário preenchido', 'a cada formulário enviado. Chega em <b>suporte.pharmaonline@gmail.com</b>, com assunto "Novo atendimento: (assunto) – (nome)".', '<div class="email">' + montarResumoHtml({
  assunto: 'Administrativo/Financeiro', nome: 'Maria da Silva', telefone: '+5531988887777', email: 'maria@exemplo.com',
  whatsapp: '5531988887777', duvida: 'Gostaria da segunda via do boleto do meu último pedido.\nObrigada!',
  anexos: ['https://arquivos.pharmaonline/exemplo-foto.jpg'],
}, new Date('2026-11-19T17:30:00Z')) + '</div>', 'para responder, basta clicar em "Responder" no e-mail: a resposta vai direto para o e-mail do cliente. Todos os formulários também ficam guardados no painel do Typebot, em Resultados.')}

<h2 style="margin-top:2mm">Observações</h2>
<div class="caixa"><ul>
  <li><b>Banner:</b> aparece só na saudação. Ele passa a ser enviado depois que a imagem for colocada no servidor, na instalação; até lá, o bot começa direto pelo texto de boas-vindas.</li>
  <li><b>Opção do site:</b> está oculta. Quando a loja for publicada, basta informar o link e ativar a opção.</li>
  <li><b>Textos:</b> podem ser editados depois, direto no painel do Typebot. Nomes e e-mails de clientes neste guia são exemplos.</li>
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
