# Relatório — video_2 (institucional pHarma Online) → `saida/video_2_v2.mp4`

## 1. O que foi alterado

**Um único acréscimo: card A de passo a passo, de 00:22,0 a 00:24,9** (janela sem card; três mulheres na rua).

- Texto: "Envie a **foto** da receita / Receba o **orçamento** / Receba sua **fórmula**" (palavras em negrito = magenta).
  O processo confere com os tutoriais da pHarmaOnline (envio da foto da receita → orçamento → entrega ou retirada).
- Posição e tamanho iguais aos do card de topo de 00:26 ("Sua fórmula, nosso compromisso."): x 250–920, y 154–434
  (670×280 px), cantos de raio 26 px.
- Estilo dos cards existentes: vidro fosco branco (fundo desfocado + véu branco a 86 %), texto `#1F1391`,
  destaque `#EB1EE1`, cores amostradas do próprio vídeo.
- Fonte: **Plus Jakarta Sans** (500 no texto, 700 nos destaques) — a mais próxima disponível, comparada com
  Montserrat e Inter. Corpo de 42 px (os cards de 2 linhas usam ~48 px) para que 3 linhas caibam na mesma caixa
  sem descer até os rostos.
- Fade de 0,3 s na entrada (22,0–22,3) e na saída (24,6–24,9). O card não cobre rostos nem as mãos com o celular;
  encosta só no alto do cabelo de duas mulheres no início da janela.
- Arquivos: `scripts/pharma-video2-card.py` (texto e máscara) e `scripts/pharma-video2.sh` (ffmpeg).

**Não aplicado: selo B "EM BREVE" (00:06–00:10).** Não colide com cards, mas no canto superior direito da zona
segura ele cobriria a cabeça da farmacêutica (6–7,5 s; x 660–1020 a partir de y ≈ 300), e subir para fugir dela
o poria nos 14 % superiores. A única janela livre (8–10 s) já fica depois da fala "está chegando" (7,0–7,6 s).

Técnica: reencode do vídeo (H.264 High, yuv420p, 30 fps, CRF 18, preset slow, BT.709), áudio copiado
(`-c:a copy`), `-movflags +faststart`. Trabalhou-se na cópia `saida/trabalho/video_2/video_2.mp4`.

## 2. O que foi verificado e o resultado

| Verificação | Original | v2 | Resultado |
|---|---|---|---|
| Vídeo | H.264 High, yuv420p, 1080×1920, 30 fps, 1137 quadros | igual | ✅ |
| Duração | 37,909 s (vídeo 37,900 s) | 37,909 s (vídeo 37,900 s) | ✅ diferença 0,000 s |
| MD5 do stream de áudio | `4d5f0e7e79ec062e6188fbf3bf192671` | `4d5f0e7e79ec062e6188fbf3bf192671` | ✅ idêntico |
| Decodificação completa | — | sem erros | ✅ |
| Fidelidade fora do card (PSNR Y quadro a quadro) | — | mínimo 43,6 dB | ✅ sem perda perceptível |
| Janela do card | — | muda só os quadros 660–746 (22,00–24,87 s) | ✅ |
| Quadros 00:21, 00:22, 00:23, 00:25 | — | `saida/quadros_video_2/` | ✅ (em 00:22,0 o card está no início do fade, ainda invisível; ver também 00:22,4) |

Volume (loudnorm, **só medido**): −10,1 LUFS integrado, pico verdadeiro **+0,3 dBTP**, LRA 2,5 LU. É bem alto:
as plataformas tendem a abaixar, e o pico acima de 0 dBTP pode distorcer na conversão. Não corrigido.

## 3. O que foi encontrado e NÃO foi alterado

- **Cards vazios** no topo em ~00:07 (sobre o letreiro da parede) e ~00:15. Em ~00:10 o card "Precisão em cada
  fórmula." aparece pela metade ("Precisão em") por causa da animação de digitação.
- **Tela do app no começo (00:00–00:02):** "Dermocosméticos de alta performance", "Comprar agora", "Suplementos e
  vitaminas" — confirmar se é a tela real do app (parece loja de dermocosméticos, não envio de receita).
- **Zona de interface:** cards de topo dentro dos 14 % superiores (é o padrão do vídeo); cards de base
  ("Atendimento próximo e conectado!", "Tudo com mais facilidade") nos 35 % inferiores; logo no alto da tela de redes.
- **Grafia:** nos quadros li "pHarmaOnline" (p estilizado), não "pPharmaOnline" — vale conferir no arquivo-fonte das telas.
  A narração pronuncia "Farma Online".
- **00:17–00:25:** fala abstrata ("essa conexão vai além, aproxima pessoas, compartilha informação e fortalece uma
  comunidade que cuida junto"). O card A (passo a passo) fala de outra coisa que a voz nessa janela.
- **Mensagem:** "está chegando" / "Em breve" contra o app já mostrado em uso nas cenas.
