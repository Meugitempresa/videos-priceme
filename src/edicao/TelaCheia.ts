import { interpolate } from "remotion";
import { easeInOut, q } from "./tempo";

// Momentos em que a ilustração ocupa a tela inteira. Cada um explica um trecho da fala e,
// de quebra, cobre um salto de imagem da apresentadora (a voz continua sem interrupção).
// [início da expansão, início do recolhimento] em quadros da linha editada.
export const JANELAS: { de: number; ate: number; motivo: string }[] = [
  { de: q("verdade") - 2, ate: q("você", 2), motivo: "emenda de 8,0 s e pausa inserida" },
  { de: q("em", 1) - 4, ate: q("Com") - 2, motivo: "emenda 'minutos. | Com isso'" },
  { de: q("de", 3) - 9, ate: q("e", 4) - 2, motivo: "salto de cabeça em 'qual' (21,2 s)" },
  { de: q("investir") - 4, ate: q("você", 5) - 2, motivo: "emenda 'investir. | Ou seja'" },
  { de: q("Enfim") - 4, ate: q("precisa") - 2, motivo: "salto de cabeça no fim de 'Enfim' (30,6 s)" },
  { de: q("mesmo") - 2, ate: q("e", 5) - 2, motivo: "emenda 'mesmo? | Acesse' e chamada para o site" },
];

const TRANSICAO = 8;

export const telaCheia = (frame: number) =>
  JANELAS.reduce((c, j) => {
    const v = interpolate(frame, [j.de, j.de + TRANSICAO, j.ate, j.ate + TRANSICAO], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeInOut,
    });
    return Math.max(c, v);
  }, 0);
