// Conversa com um Typebot de verdade (viewer publicado) pela API e compara cada resposta com o simulador local.
// Uso:
//   TYPEBOT_VIEWER_URL=https://seu-viewer node scripts/testar-typebot-real.mjs pharma-atendimento
// (pharma-atendimento = "ID público" com que o fluxo de atendimento foi publicado no Typebot.)
// As mensagens são convertidas como a Evolution faz para o WhatsApp: negrito -> *x*, itálico -> _x_.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarSessao } from '../src/motor.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viewer = String(process.env.TYPEBOT_VIEWER_URL ?? 'http://localhost:8081').replace(/\/+$/, '');
const publicId = process.argv[2] ?? 'pharma-atendimento';
const roteiro = (process.argv[3] ?? [
  '1', 'Orçamento em tempo real pelo app', '2', '3', '4', '5', '6', '0', 'asdf', 'Oi, bom dia!',
  'obrigado', 'quero falar com atendente', '1️⃣', 'Opção 3', '7', '😀',
].join('|')).split('|');
const remoteJid = '5511988887777@s.whatsapp.net';

const paraWhatsApp = (richText) => richText.map((p) => (p.children ?? []).map((c) => {
  let t = c.text ?? '';
  if (!t) return t;
  if (c.bold) t = '*' + t + '*';
  if (c.italic) t = '_' + t + '_';
  return t;
}).join('')).join('\n');

const post = async (url, corpo) => {
  const r = await fetch(viewer + url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo) });
  if (!r.ok) throw new Error(url + ' -> HTTP ' + r.status + ': ' + (await r.text()).slice(0, 300));
  return r.json();
};
const textos = (resp) => (resp.messages ?? []).filter((m) => m.type === 'text').map((m) => paraWhatsApp(m.content.richText));

const typebot = JSON.parse(fs.readFileSync(path.join(RAIZ, 'typebot/atendimento.json'), 'utf8'));
const local = criarSessao(typebot, { preenchidas: { remoteJid } });

const inicio = await post('/api/v1/typebots/' + publicId + '/startChat', { prefilledVariables: { remoteJid, pushName: 'Teste' } });
const sessionId = inicio.sessionId;
let diferencas = 0;
const comparar = (rotulo, real, simulado) => {
  const igual = JSON.stringify(real) === JSON.stringify(simulado);
  if (!igual) diferencas++;
  console.log('\n👤 ' + rotulo + (igual ? '   ✔ igual ao simulador' : '   ✘ DIFERENTE do simulador'));
  for (const m of real) console.log('🤖 ' + m.split('\n').join('\n   '));
  if (!igual) for (const m of simulado) console.log('🧪 ' + m.split('\n').join('\n   '));
};
comparar('(primeira mensagem)', textos(inicio), await local.iniciar());
for (const msg of roteiro) {
  const real = await post('/api/v1/sessions/' + sessionId + '/continueChat', { message: msg });
  comparar(msg, textos(real), await local.responder(msg));
}
console.log('\n' + (diferencas ? diferencas + ' resposta(s) diferente(s).' : 'Todas as respostas do Typebot real são iguais às do simulador.'));
process.exit(diferencas ? 1 : 0);
