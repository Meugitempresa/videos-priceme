import { interpolate } from "remotion";
import { DURACAO, DURACAO_TOTAL, easeInOut, q } from "../edicao/tempo";

// Linha do tempo da nova montagem, ancorada nas palavras reais da fala (q = quadro em que a palavra começa).
// Saltos de imagem do take (quadros da edição): 240 (+ pausa até 249), 532, 637, 798, 918, 1058.

// Demonstrações que cobrem a tela (a apresentadora segue numa janela quando não há salto)
export const DEMOS = {
  marcaEDados: { de: q("verdade") - 6, ate: q("serviços") + 19 }, // 215–489: logo e lançamento do mês
  precisao: { de: q("minutos") + 23, ate: q("Ou") - 2 }, // 526–806: unidade, comparação e decisão
  final: { de: q("mesmo") + 15, ate: DURACAO_TOTAL + 30 }, // 1053–fim: encerramento único (não sai)
};

// Janela da apresentadora durante as demonstrações (fora dos saltos)
export const JANELAS = [
  { de: q("Na") + 7, ate: DEMOS.marcaEDados.ate - 7, onde: "demo" as const },
  { de: q("Com") - 1, ate: q("de", 3) - 5, onde: "demo" as const },
  { de: q("produto", 1) + 2, ate: q("investir") + 13, onde: "demo" as const },
  { de: q("Acesse") + 0, ate: DURACAO, onde: "final" as const }, // sai antes do fim do take
];

export const TRANSICAO = 10;

// 0 = apresentadora livre, 1 = demonstração cobrindo a tela (cortina de baixo para cima)
export const cobertura = (frame: number) =>
  Math.max(
    ...Object.values(DEMOS).map((d) =>
      interpolate(frame, [d.de, d.de + TRANSICAO, d.ate - TRANSICAO, d.ate], [0, 1, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: easeInOut,
      }),
    ),
  );

export const janela = (frame: number) => {
  for (const j of JANELAS) {
    const v = interpolate(frame, [j.de, j.de + 8, j.ate - 8, j.ate], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeInOut,
    });
    if (v > 0) return { v, onde: j.onde };
  }
  return { v: 0, onde: "demo" as const };
};

// Enquadramento da apresentadora em tela cheia: leve aproximação contínua na abertura,
// plano mais fechado depois de "serviços" e no recado final (o corte de 30,6 s vira mudança de plano).
export const enquadramento = (frame: number) => {
  if (frame < DEMOS.marcaEDados.de) return interpolate(frame, [0, DEMOS.marcaEDados.de], [1, 1.05]);
  if (frame < DEMOS.precisao.de) return 1.08;
  if (frame < 918) return 1.0;
  return 1.14;
};

// Legenda escondida quando o texto principal na tela já é a própria fala
export const SEM_LEGENDA: [number, number][] = [
  [q("seu") - 3, q("não", 1) - 4],
  [q("Acesse") - 3, DURACAO_TOTAL + 1],
];
