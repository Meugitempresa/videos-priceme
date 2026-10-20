import { Easing, interpolate } from "remotion";
import edl from "./edl.json";
import palavras from "./palavras.json";

export const FPS = edl.fps;
export const DURACAO = edl.itens.reduce(
  (n, it) => n + (it.tipo === "pausa" ? (it.quadros ?? 0) : (it.fim ?? 0) - (it.inicio ?? 0)),
  0,
);

const limpa = (s: string) =>
  s.toLowerCase().replace(/[,?!]/g, "").replace(/\.$/, "");

// Quadro em que a palavra começa a ser falada (n-ésima ocorrência)
export const q = (palavra: string, n = 1): number => {
  const alvo = limpa(palavra);
  const achadas = palavras.filter((p) => limpa(p.texto) === alvo);
  const p = achadas[n - 1];
  if (!p) throw new Error(`Palavra não encontrada na transcrição: ${palavra} (${n})`);
  return Math.round(p.inicio * FPS);
};

export const s = (segundos: number) => Math.round(segundos * FPS);

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

// 0 → 1 a partir de `inicio`, em `dur` quadros, com ease-out
export const entra = (frame: number, inicio: number, dur = 16, easing = easeOut) =>
  interpolate(frame, [inicio, inicio + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Chegada suave: sai de desfoque leve e de 94 % do tamanho
export const chegada = (p: number, dy = 30) => ({
  opacity: p,
  transform: `translateY(${(1 - p) * dy}px) scale(${0.94 + 0.06 * p})`,
  filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined,
});
