// Textos de tela do vídeo original, com o mesmo conteúdo e os mesmos destaques (entre *asteriscos*).
// caixa: área do texto antigo (px do vídeo) que o painel precisa cobrir; de/ate: quadros em que ele aparece.
export const TEXTOS: { linhas: string[]; caixa: [number, number, number, number]; de: number; ate: number }[] = [
  { linhas: ["Seu *manipulado*", "pelo celular?"], caixa: [110, 130, 750, 530], de: 0, ate: 84 },
  { linhas: ["Atendimento", "*próximo e conectado!*"], caixa: [275, 1595, 840, 1830], de: 96, ate: 190 },
  { linhas: ["*Confiança*", "em cada etapa"], caixa: [345, 175, 800, 415], de: 194, ate: 239 },
  { linhas: ["*Precisão*", "em cada fórmula."], caixa: [330, 130, 760, 400], de: 256, ate: 309 },
  { linhas: ["Tudo com mais", "*facilidade*"], caixa: [245, 1670, 925, 1820], de: 327, ate: 397 },
  { linhas: ["Cuidado *especialmente*", "para você"], caixa: [225, 160, 920, 400], de: 404, ate: 477 },
  { linhas: ["Preparado e", "*conferido*"], caixa: [305, 190, 895, 355], de: 485, ate: 551 },
  { linhas: ["Sua *fórmula*,", "nosso *compromisso*."], caixa: [275, 180, 895, 410], de: 653, ate: 722 },
];

export const COR = { roxo: "#1F0F88", roxoEscuro: "#15006C", magenta: "#D900DB" };
