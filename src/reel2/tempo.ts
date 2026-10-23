import { Easing, interpolate } from "remotion";
import legendas from "./legendas.json";

export const FPS = 30;
export const DURACAO = 1636; // 54,53 s do vídeo original, sem cortes
export const INICIO_TELA_FINAL = 1409; // 46,97 s: corte para a tela da marca (já com a logo)
export const CARTAO_DO_PLANO_SAI = 1521; // quadro em que o cartão do plano some no original

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

// Quadro em que a palavra começa (n-ésima ocorrência na fala)
const limpa = (s: string) => s.toLowerCase().replace(/[.,?!…]/g, "");
const todas = legendas.flatMap((b) => b.palavras);
export const q = (palavra: string, n = 1) => {
  const p = todas.filter((w) => limpa(w.texto) === limpa(palavra))[n - 1];
  if (!p) throw new Error(`Palavra não encontrada: ${palavra} (${n})`);
  return Math.round(p.t * FPS);
};

// Entrada e saída suaves: 0 → 1 → 0
export const janela = (frame: number, de: number, ate: number, dur = 9) =>
  interpolate(frame, [de, de + dur, ate - dur, ate], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });

export const entra = (frame: number, de: number, dur = 10) =>
  interpolate(frame, [de, de + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
