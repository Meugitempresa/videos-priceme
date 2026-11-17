// Simulador no terminal: converse com o bot antes de ter servidor.
//   npm run simular                                  -> conversa interativa (WhatsApp)
//   npm run simular -- --roteiro "oi|1|asdf|0|5"      -> roteiro pronto, mensagens separadas por |
//   npm run simular -- --formulario --roteiro "Maria Silva|11912345678|maria@exemplo.com|Minha dúvida|pular"
// Como na Evolution API, a primeira mensagem abre a conversa e recebe as boas-vindas com o menu.
// No formulário, os envios à Evolution são mostrados na tela (nada é enviado de verdade).
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { criarSessao } from '../src/motor.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const ehFormulario = args.includes('--formulario');
const iRoteiro = args.indexOf('--roteiro');
const roteiro = iRoteiro >= 0 ? String(args[iRoteiro + 1] ?? '').split('|') : null;

const arquivo = path.join(RAIZ, 'typebot', ehFormulario ? 'formulario.json' : 'atendimento.json');
const typebot = JSON.parse(fs.readFileSync(arquivo, 'utf8'));

const fetchFalso = async (url, init) => {
  console.log('\n   ↪ [envio para a Evolution] POST ' + url);
  const corpo = JSON.parse(init.body);
  console.log('     para: ' + corpo.number);
  console.log((corpo.text ?? JSON.stringify(corpo.components, null, 2)).split('\n').map((l) => '     │ ' + l).join('\n'));
  return { status: 201 };
};

const sessao = criarSessao(typebot, {
  preenchidas: ehFormulario
    ? { assunto: 'Fale conosco', whatsapp: '5511988887777' }
    : { remoteJid: '5511988887777@s.whatsapp.net', pushName: 'Cliente Teste' },
  fetch: fetchFalso,
  log: (tipo, dados) => {
    if (tipo !== 'email') return;
    console.log('\n   ✉ [e-mail para o atendente] para: ' + dados.para.join(', ') + ' | responder para: ' + dados.responderPara);
    console.log('     assunto: ' + dados.assunto);
    const texto = String(dados.html ?? dados.texto ?? '').replace(/<br>/g, '\n').replace(/<\/(tr|p|div|li)>/g, '\n').replace(/<[^>]+>/g, ' ')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
      .split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
    console.log(texto.map((l) => '     │ ' + l).join('\n'));
  },
});

const mostrar = (mensagens) => {
  for (const m of mensagens) {
    console.log('\n🤖 ' + m.split('\n').join('\n   '));
  }
};

let iniciou = false;
async function enviar(texto) {
  console.log('\n👤 ' + texto);
  if (!iniciou) {
    iniciou = true;
    mostrar(await sessao.iniciar());
    if (!ehFormulario) return; // a 1ª mensagem do WhatsApp só abre a conversa
  }
  mostrar(await sessao.responder(texto));
}

if (ehFormulario) {
  iniciou = true;
  mostrar(await sessao.iniciar());
}

if (roteiro) {
  for (const msg of roteiro) await enviar(msg);
} else {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log(ehFormulario
    ? '(Formulário. Para anexos, cole links de imagem separados por espaço ou digite "pular". Ctrl+C para sair.)'
    : '(Digite como se fosse o cliente no WhatsApp. Ctrl+C para sair.)');
  for (;;) {
    if (sessao.terminou) { console.log('\n(fim do fluxo)'); break; }
    const texto = await rl.question('\nvocê> ');
    await enviar(texto);
  }
  rl.close();
}
