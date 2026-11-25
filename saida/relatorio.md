# Relatório — video_1 (vovó e neto, pHarma Online) → `saida/video_1_v2.mp4`

## 1. O que foi alterado

**Nada no conteúdo.** O único acréscimo permitido (selo com o logo e "EM BREVE", 00:08–00:16) **não foi colocado**,
por decisão da cliente (opção c): de 8 a 16 s não existe posição dentro da zona segura (x 65–1015, y 269–1248)
que não cubra rostos — a folga entre as cabeças da avó e do neto cai de ~170 px (8–10 s) para ~95 px (13–16 s).

O v2 é o original **remuxado sem reencode** (`ffmpeg -i video_1.mp4 -map 0 -c copy -movflags +faststart`):
mesmos quadros de vídeo e mesmo áudio, bit a bit; só o contêiner foi reorganizado (`+faststart`, índice no início
do arquivo para começar a tocar mais rápido na web). O original não foi tocado; trabalhou-se na cópia
`saida/trabalho/video_1.mp4`.

O logo enviado foi guardado em `public/pharma/logo-pharmaonline.png` (527×485, fundo azul opaco), sem uso neste vídeo.
Cores amostradas dele, para uso futuro: azul-escuro `#1E2782`, magenta `#F811EF`, branco `#FFFFFF`.

## 2. O que foi verificado e o resultado

| Verificação | Original | v2 | Resultado |
|---|---|---|---|
| Vídeo | H.264 High, yuv420p, 1080×1920, 30 fps, 1117 quadros | igual | ✅ |
| Áudio | AAC LC, 48 kHz, estéreo, 1749 pacotes | igual | ✅ |
| Duração (contêiner) | 37,255 s | 37,255 s | ✅ diferença 0,000 s |
| MD5 do stream de áudio | `a113f87cca0a16486d6efbcb56a79d47` | `a113f87cca0a16486d6efbcb56a79d47` | ✅ idêntico |
| MD5 do stream de vídeo | `ac492106115707c043c29f5c8cd3e8b7` | `ac492106115707c043c29f5c8cd3e8b7` | ✅ idêntico |
| Decodificação completa do v2 | — | sem erros | ✅ |
| Quadros 00:07, 00:08, 00:12, 00:16, 00:17 | — | `saida/quadros/` | ✅ iguais ao original (vídeo idêntico) |

Volume (loudnorm, **só medido, nada aplicado**): −16,4 LUFS integrado, pico verdadeiro **+0,1 dBTP**, LRA 6,3 LU,
limiar −26,8 LUFS. O pico passa levemente de 0 dBTP (possível clipe na conversão de algumas plataformas);
não foi corrigido porque o áudio tem de sair idêntico.

## 3. O que foi encontrado e NÃO foi alterado

- **Trechos sem legenda** (quadros de 1 s): 00:04, 00:07, 00:16, 00:28 e as telas finais (29–37 s).
  Em 00:00 já aparece "Vó," e em 00:10 "A senhora envia a foto da receita,"; os intervalos podem ser pausas da fala.
- **Elementos na zona de interface da Meta:**
  - legendas gravadas em y ≈ 1560–1660 (todas dentro dos 35 % inferiores);
  - balões de 00:20–00:23 em y ≈ 1200–1350, cruzando o limite dos 35 % inferiores (y 1248);
  - cabeçalho "pHarmaOnline" da tela de redes sociais (00:34–00:37) em y ≈ 160–245, dentro dos 14 % superiores;
  - a cabeça do neto fica nos 14 % superiores durante quase todo o trecho 00:00–00:16.
- **Quem fala "já chegou a pHarma Online"** (00:08–00:09) é o neto ("Calma vó, já chegou a pHarma Online."), não a avó;
  a legenda gravada já usa a grafia "pHarma Online".
- **Contradição de mensagem:** a fala "já chegou" contra o "EM BREVE" da tela de produto (00:30–00:33).
- **Cor de destaque das legendas:** lilás `#E1A8F0` (medida no quadro de 00:09), diferente do magenta da marca
  (`#F811EF` no logo) usado nos outros vídeos.
- **Roteiro × vídeo:** os balões aparecem na cena dos ovos (00:20–00:23), não na tela do celular; 00:29 é uma
  transição quase branca; a tela de produto vai de 00:30 a 00:33.
