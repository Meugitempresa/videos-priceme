// Roteiro do tutorial de instalação: a narração (27,9 s) é intocada e manda no tempo; as gravações
// de tela são reeditadas por trechos. Tempos de fala ancorados nas palavras (Parakeet + 0,1 s).
// gravações: "chrome" = WhatsApp 14.39.01 (instalação no Chrome); "app" = WhatsApp 14.52.09 (ícone e abertura)
// coordenadas em pixels da gravação original (576×1280)
export type Fonte = "chrome" | "app";
export type Trecho = { fala: [number, number]; fonte: Fonte; tela: [number, number]; etapa: string };

export const TRECHOS: Trecho[] = [
  { fala: [0, 2.7], fonte: "chrome", tela: [0, 2.2], etapa: "endereço priceme.com.br digitado no navegador" },
  // 2,2–3,4 s da gravação (página do Google com notícias) fica de fora
  { fala: [2.7, 4.45], fonte: "chrome", tela: [3.4, 5.0], etapa: "página carregando" },
  { fala: [4.45, 7.0], fonte: "chrome", tela: [5.0, 6.5], etapa: "página carregada; toque nos três pontinhos" },
  { fala: [7.0, 7.5], fonte: "chrome", tela: [6.5, 7.0], etapa: "menu abrindo" },
  { fala: [7.5, 9.75], fonte: "chrome", tela: [7.0, 7.0], etapa: "menu aberto" },
  { fala: [9.75, 11.6], fonte: "chrome", tela: [7.0, 9.2], etapa: "rolagem do menu" },
  { fala: [11.6, 12.3], fonte: "chrome", tela: [9.2, 9.45], etapa: "toque em Instalar e criar atalho" },
  { fala: [12.3, 13.75], fonte: "chrome", tela: [9.45, 10.9], etapa: "opções Instalar / Criar atalho" },
  { fala: [13.75, 15.15], fonte: "chrome", tela: [10.9, 11.3], etapa: "toque em Instalar" },
  { fala: [15.15, 16.25], fonte: "chrome", tela: [11.3, 12.5], etapa: "confirmação: Instalar aplicativo" },
  { fala: [16.25, 18.1], fonte: "chrome", tela: [12.5, 14.6], etapa: "Instalando PriceMe..." },
  { fala: [18.1, 22.45], fonte: "app", tela: [1.3, 3.3], etapa: "ícone PriceMe na tela inicial" },
  { fala: [22.45, 23.7], fonte: "app", tela: [3.3, 5.0], etapa: "toque no ícone; app abrindo" },
  { fala: [23.7, 27.9], fonte: "app", tela: [5.0, 5.9], etapa: "app aberto na tela de entrada" },
];

export const FIM_NARRACAO = 27.9;
export const DURACAO_INSTALACAO = 870; // 29,0 s: narração + 1,1 s de encerramento com a logo

export const quadroDaTela = (t: number) => {
  let i = TRECHOS.findIndex((s) => t < s.fala[1]);
  if (i === -1) i = TRECHOS.length - 1;
  const s = TRECHOS[i];
  const p = Math.min(Math.max((t - s.fala[0]) / (s.fala[1] - s.fala[0]), 0), 1);
  const ts = Math.min(s.tela[0] + p * (s.tela[1] - s.tela[0]), s.tela[1] === s.tela[0] ? s.tela[0] : s.tela[1] - 1 / 30);
  return { i, fonte: s.fonte, quadro: Math.round(ts * 30), inicio: s.fala[0] };
};

// Destaques: contorno do alvo (de..ate) e efeito de toque (toque) no instante do toque real da gravação
export type Destaque = {
  de: number; ate: number; toque?: number; x: number; y: number; w: number; h: number;
  raio?: number; margem?: number; seta?: "cima" | "baixo" | "esquerda"; zoom?: number;
};
export const DESTAQUES: Destaque[] = [
  { de: 1.9, ate: 2.75, x: 290, y: 97, w: 548, h: 50, raio: 26, margem: 0, zoom: 1.1 }, // campo de endereço
  { de: 6.15, ate: 7.3, toque: 6.95, x: 541, y: 97, w: 52, h: 56, raio: 26, margem: 2, seta: "cima", zoom: 1.15 }, // três pontinhos
  { de: 10.8, ate: 12.4, toque: 12.12, x: 378, y: 1121, w: 390, h: 62, raio: 16, seta: "cima", zoom: 1.18 }, // Instalar e criar atalho
  { de: 14.25, ate: 15.35, toque: 15.1, x: 288, y: 1076, w: 520, h: 84, raio: 18, seta: "cima", zoom: 1.12 }, // Instalar
  { de: 15.6, ate: 16.4, toque: 16.2, x: 482, y: 810, w: 120, h: 62, raio: 16, seta: "cima", zoom: 1.12 }, // confirmação Instalar
  { de: 19.6, ate: 22.6, toque: 22.42, x: 353, y: 640, w: 110, h: 132, raio: 30, seta: "esquerda", zoom: 1.2 }, // ícone PriceMe
  { de: 23.75, ate: 25.2, x: 288, y: 806, w: 532, h: 776, raio: 22, zoom: 1.0 }, // área de entrada na conta
];

// Áreas com informações pessoais ou alheias ao tutorial, desfocadas (barra de status já fica recortada)
export const DESFOQUES: { fonte: Fonte; de: number; ate: number; x: number; y: number; w: number; h: number }[] = [
  { fonte: "chrome", de: 0, ate: 2.2, x: 0, y: 214, w: 576, h: 620 }, // histórico de buscas sob o endereço
  { fonte: "app", de: 0, ate: 3.4, x: 0, y: 105, w: 576, h: 290 }, // relógio, data e clima na tela inicial
];
