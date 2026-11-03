// Mapa de sincronia: [início, fim] na fala da Julia (s) -> [início, fim] na gravação de tela (s).
// A Julia corre contínua; a gravação de tela é reeditada para mostrar o que ela explica.
// Se o trecho de tela é mais curto que a fala, ele toca em velocidade normal e fica parado no último quadro;
// se é mais longo, é levemente acelerado (no máximo ~1,3x).
export const SINCRONIA: { fala: [number, number]; tela: [number, number]; etapa: string }[] = [
  { fala: [0.0, 7.8], tela: [0.0, 2.5], etapa: "Abertura (boas-vindas)" },
  { fala: [7.8, 12.2], tela: [2.55, 3.95], etapa: "Criar cadastro" },
  { fala: [12.2, 15.7], tela: [4.25, 6.15], etapa: "Entrar: e-mail e senha" },
  { fala: [15.7, 23.9], tela: [0.0, 2.5], etapa: "Mensagem da abertura e botões" },
  { fala: [23.9, 30.1], tela: [6.2, 11.75], etapa: "Tela principal e botão de orçamento" },
  { fala: [30.1, 38.0], tela: [11.85, 15.05], etapa: "Novo orçamento: tirar foto / escolher arquivo" },
  { fala: [38.0, 44.75], tela: [15.07, 18.6], etapa: "Escolha do arquivo e 'Usar esta foto'" },
  { fala: [44.75, 48.7], tela: [19.3, 20.8], etapa: "Aba da fórmula" },
  { fala: [48.7, 52.6], tela: [20.8, 22.3], etapa: "Forma farmacêutica: opções" },
  { fala: [52.6, 54.6], tela: [22.3, 24.0], etapa: "Cápsulas" },
  { fala: [54.6, 60.3], tela: [24.0, 29.5], etapa: "Tipo de cápsula e quantidade" },
  { fala: [60.3, 68.8], tela: [29.6, 39.7], etapa: "Ativo e dosagem em mg" },
  { fala: [68.8, 73.3], tela: [41.7, 46.2], etapa: "Concluir fórmula e Ver resumo" },
  { fala: [73.3, 78.8], tela: [48.0, 55.0], etapa: "Resumo e prazo de liberação" },
  { fala: [78.8, 81.4], tela: [55.0, 58.1], etapa: "Prazo normal" },
  { fala: [81.4, 85.4], tela: [58.1, 61.0], etapa: "Dados cadastrados e endereço" },
  { fala: [85.4, 89.8], tela: [61.0, 63.6], etapa: "Enviar para conferência e precificação" },
  { fala: [89.8, 92.3], tela: [63.7, 66.2], etapa: "Conferência inicial da farmacêutica" },
  { fala: [92.3, 95.1], tela: [71.5, 74.3], etapa: "Confirmar orçamento: campo de posologia" },
  { fala: [95.1, 100.45], tela: [74.3, 81.3], etapa: "Posologia: modo de usar" },
  { fala: [100.45, 102.35], tela: [86.0, 88.2], etapa: "Forma de entrega" },
  { fala: [102.35, 105.4], tela: [93.2, 97.0], etapa: "Caixas de autorização e termos" },
  { fala: [105.4, 107.95], tela: [97.0, 100.0], etapa: "Autorizar a manipulação" },
  { fala: [107.95, 111.0], tela: [103.3, 104.3], etapa: "Autorizado: forma de pagamento (seção Pagamento)" },
  { fala: [111.0, 113.15], tela: [104.3, 107.0], etapa: "Pix" },
  { fala: [113.15, 119.6], tela: [109.0, 115.4], etapa: "Segunda triagem da farmacêutica" },
];

// quadro da gravação de tela a exibir no quadro f do vídeo final (e o trecho a que ele pertence)
export const quadroDaTela = (f: number) => {
  const t = f / 30;
  const i = Math.max(0, SINCRONIA.findIndex((s) => t < s.fala[1]));
  const s = SINCRONIA[i === -1 ? SINCRONIA.length - 1 : i];
  const dFala = s.fala[1] - s.fala[0], dTela = s.tela[1] - s.tela[0];
  const vel = dTela > dFala ? dTela / dFala : 1;
  const ts = Math.min(s.tela[0] + (t - s.fala[0]) * vel, s.tela[1] - 1 / 30);
  return { quadro: Math.round(ts * 30), trecho: i, inicioTrecho: Math.round(s.fala[0] * 30) };
};
