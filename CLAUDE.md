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
- Layout (v2, `src/v2`): apresentadora em tela cheia como base; demonstrações financeiras em fundo claro entram
  por cima (com ela numa janela) e cobrem os saltos do take; um único encerramento com logo e priceme.com.br.
  Legenda por frases completas em y ≈ 1310–1510. Tempos ancorados nas palavras (`q()` em `src/edicao/tempo.ts`).
- Números só como simulação identificada (`src/v2/numeros.ts`, contas conferidas no código).
- Mostrar a tabela de cenas e uma prévia antes de exportar a versão final.

## Fluxo

1. `public/take.mp4` (fora do git) → cortes de pausas em `src/edicao/edl.json`.
2. `python scripts/tratar-audio.py public/take.mp4 src/edicao/edl.json public/voz-tratada.wav`
3. `python scripts/pausas.py public/voz-tratada.wav` e `node scripts/gerar-palavras.mjs out/palavras-parakeet.json`
4. Prévia: `npx remotion render src/index.ts ReelPriceMe out/previa-v2-540.mp4 --scale=0.5 --crf=20`
5. Final: `npx remotion render src/index.ts ReelPriceMe out/reel-priceme-v2.mp4 --codec=h264 --crf=17 --x264-preset=medium --audio-codec=aac --audio-bitrate=320k`

Transcrição: neste ambiente de nuvem `huggingface.co` é bloqueado; os modelos do sherpa-onnx
(Whisper medium e Parakeet v3) vêm das releases do GitHub e rodam localmente.

## Reel 2 (diálogo Marcelo e Vera) — `src/reel2`

- Base: `public/reel2/original.mp4` (fora do git), usado inteiro, sem cortes; o áudio é o original.
- Legendas: `python scripts/reel2-legendas.py` gera `src/reel2/legendas.json` a partir de `src/reel2/fonte/`
  (transcrição do Parakeet conferida com o Whisper + trechos de voz medidos no áudio).
- Exemplo numérico hipotético em `src/reel2/numeros.ts` (contas conferidas em centavos).
- Correções do original: faixa azul cobre a legenda gravada que não corresponde à fala (42,8–47,0 s);
  na tela final só o bloco de texto é refeito ("iOS", concordância, frase final na área segura). A logo não é duplicada.
- Prévia: `npx remotion render src/index.ts ReelPriceMe2 out/reel2-previa-540.mp4 --scale=0.5 --crf=20`
- Final: `npx remotion render src/index.ts ReelPriceMe2 out/reel-priceme2-final.mp4 --codec=h264 --crf=17 --x264-preset=medium --audio-codec=aac --audio-bitrate=320k`
