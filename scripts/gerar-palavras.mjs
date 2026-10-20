// Converte a transcrição (tempos do take original) para a linha do tempo editada (EDL)
// e aplica as correções conferidas com o Whisper. Gera src/edicao/palavras.json.
// Uso: node scripts/gerar-palavras.mjs out/palavras-parakeet.json
import { readFileSync, writeFileSync } from "node:fs";

const [entrada = "out/palavras-parakeet.json"] = process.argv.slice(2);
const edl = JSON.parse(readFileSync("src/edicao/edl.json", "utf8"));
const brutas = JSON.parse(readFileSync(entrada, "utf8"));

const correcoes = {
  Pricem: "PriceMe",
  Priceme: "PriceMe",
  despes: "despesas",
  cenos: "centavos",
  "Priceme.com.br": "priceme.com.br",
};
// "saber" não veio no Parakeet; o Whisper confirmou "consegue saber até centavos"
const insercoes = [{ depoisDe: "consegue", w: "saber", t: 19.45 }];

const palavras = [];
for (const p of brutas) {
  palavras.push({ w: correcoes[p.w] ?? p.w, t: p.t });
  const ins = insercoes.find((i) => i.depoisDe === p.w);
  if (ins) palavras.push({ w: ins.w, t: ins.t });
}

// tempo original (s) -> tempo editado (s); pausas inseridas empurram o que vem depois
const paraEditado = (t) => {
  let acumulado = 0;
  for (const item of edl.itens) {
    if (item.tipo === "pausa") {
      acumulado += item.quadros / edl.fps;
      continue;
    }
    const a = item.inicio / edl.fps, b = item.fim / edl.fps;
    if (t < a) return acumulado;
    if (t < b) return acumulado + (t - a);
    acumulado += b - a;
  }
  return acumulado;
};

// O Parakeet adianta um pouco a palavra que vem depois de uma pausa:
// se o início cair dentro de uma pausa do áudio tratado, vai para o fim dela.
const pausas = JSON.parse(readFileSync("src/edicao/pausas.json", "utf8"));
const ajustar = (t) => {
  const pausa = pausas.find(([a, b]) => t >= a && t < b);
  return pausa ? pausa[1] : t;
};

const inicios = palavras.map((p) => ajustar(paraEditado(p.t)));
const saida = palavras.map((p, i) => {
  const proxima = inicios[i + 1] ?? inicios[i] + 0.8;
  // termina no começo da próxima palavra ou no início de uma pausa, o que vier antes
  const pausa = pausas.find(([a]) => a > inicios[i] && a < proxima);
  const fim = Math.min(pausa ? pausa[0] : proxima, inicios[i] + 0.9);
  return {
    texto: p.w,
    inicio: Number(inicios[i].toFixed(3)),
    fim: Number(fim.toFixed(3)),
  };
});
writeFileSync("src/edicao/palavras.json", JSON.stringify(saida, null, 1));
console.log(saida.map((p) => `${p.inicio.toFixed(2)} ${p.texto}`).join("  "));
