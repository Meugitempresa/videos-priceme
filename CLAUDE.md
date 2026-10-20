# Vídeos PriceMe

Reels verticais 1080×1920 da PriceMe com Remotion e a skill `bolo-de-camadas` (`.claude/skills/bolo-de-camadas`).

## Marca PriceMe (obrigatório)

- Logo oficial: `public/marca/logo-priceme.png` (945×945, fundo azul opaco). Use exatamente como está:
  sem redesenhar, desfocar, recortar o desenho, mudar cores ou distorcer proporções. Coloque-a sobre um
  fundo `#1041AD` para que o quadrado da logo se funda ao painel.
- Cores medidas na logo: azul `#1041AD`, ciano `#5CE1E6`, branco `#FFFFFF` (ver `src/marca.ts`).
  Tons mais escuros do mesmo azul só para profundidade.
- Fonte: Montserrat (via `@fontsource`, sem depender de internet).
- Slogan da logo: "O seu cérebro financeiro na palma da sua mão."

## Regras de edição combinadas com a cliente

- Preservar rosto, voz, timbre, entonação e todas as palavras originais. Sem música. Efeitos sonoros só se pedirem.
- Não inventar números, resultados ou telas da plataforma; valores ficam ocultos (`R$ ••••`) e telas genéricas
  levam o rótulo "Ilustração". Nada que sugira lucro garantido.
- Layout: painel com ilustração e faixa de título em cima (y 0–840), apresentadora embaixo, legenda em y ≈ 1415–1525.
- Mostrar a tabela de cenas e uma prévia antes de exportar a versão final.

## Fluxo

1. `public/take.mp4` (fora do git) → cortes de pausas em `src/edicao/edl.json`.
2. `python scripts/tratar-audio.py public/take.mp4 src/edicao/edl.json public/voz-tratada.wav`
3. `python scripts/pausas.py public/voz-tratada.wav` e `node scripts/gerar-palavras.mjs out/palavras-parakeet.json`
4. `npx remotion render src/index.ts ReelPriceMe out/reel-priceme.mp4`

Transcrição: neste ambiente de nuvem `huggingface.co` é bloqueado; os modelos do sherpa-onnx
(Whisper medium e Parakeet v3) vêm das releases do GitHub e rodam localmente.
