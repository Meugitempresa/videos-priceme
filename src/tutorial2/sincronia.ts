// Parte 2 — mapa de sincronia: [início, fim] na fala da Julia (s) -> [início, fim] na gravação de tela (s).
// A Julia corre contínua; a gravação de tela é reeditada para mostrar o que ela explica.
// Tela mais curta que a fala: toca em velocidade normal e fica parada no último quadro;
// tela mais longa: levemente acelerada (no máximo ~1,25x).
export const SINCRONIA: { fala: [number, number]; tela: [number, number]; etapa: string }[] = [
  { fala: [0.0, 3.2], tela: [0.5, 4.4], etapa: "A farmacêutica confere o orçamento (checagem da fórmula)" },
  { fala: [3.2, 7.6], tela: [4.4, 6.5], etapa: "Confirmar 2ª triagem e linha do tempo: 'Em produção'" },
  { fala: [7.6, 9.4], tela: [6.5, 7.75], etapa: "Etapa produtiva concluída: 'Concluir (dar baixa)'" },
  { fala: [9.4, 12.3], tela: [7.8, 11.4], etapa: "Disponível para retirada ou delivery: 'Retirado'" },
  { fala: [12.3, 15.15], tela: [11.5, 13.25], etapa: "Pedido finalizado: 'Sua fórmula foi retirada!'" },
  { fala: [15.15, 21.0], tela: [13.35, 15.2], etapa: "Dúvidas: botão 'Fale conosco' na tela inicial" },
];

export const quadroDaTela = (f: number) => {
  const t = f / 30;
  let i = SINCRONIA.findIndex((s) => t < s.fala[1]);
  if (i === -1) i = SINCRONIA.length - 1;
  const s = SINCRONIA[i];
  const dFala = s.fala[1] - s.fala[0], dTela = s.tela[1] - s.tela[0];
  const vel = dTela > dFala ? dTela / dFala : 1;
  const ts = Math.min(s.tela[0] + (t - s.fala[0]) * vel, s.tela[1] - 1 / 30);
  return { quadro: Math.round(ts * 30), trecho: i, inicioTrecho: Math.round(s.fala[0] * 30) };
};
