#!/bin/sh
# Vídeo 2 (institucional pHarma Online): único acréscimo = card de passo a passo em 00:22,0–00:24,9
# (vidro fosco como os cards existentes, fade de 0,3 s). Áudio copiado; vídeo H.264 High CRF 18.
# Uso: sh scripts/pharma-video2.sh <copia_do_original.mp4> <pasta_com_pngs> <saida.mp4>
set -e
IN="$1"; P="$2"; OUT="$3"
ffmpeg -v error -y -i "$IN" -loop 1 -framerate 30 -i "$P/card-mascara.png" -loop 1 -framerate 30 -i "$P/card-texto.png" \
  -filter_complex "\
[0:v]split[base][c];\
[c]crop=670:280:250:154,gblur=sigma=18,lutrgb=r=val*0.14+219:g=val*0.14+219:b=val*0.14+219,format=rgba[cb];\
[1:v]format=gray[m];[cb][m]alphamerge,fade=t=in:st=22.0:d=0.3:alpha=1,fade=t=out:st=24.6:d=0.3:alpha=1[card];\
[2:v]format=rgba,fade=t=in:st=22.0:d=0.3:alpha=1,fade=t=out:st=24.6:d=0.3:alpha=1[txt];\
[base][card]overlay=250:154:enable='between(t,22.0,24.9)':eof_action=pass:shortest=1[v1];\
[v1][txt]overlay=250:154:enable='between(t,22.0,24.9)':shortest=1,format=yuv420p[v]" \
  -map "[v]" -map 0:a -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 18 -preset slow -r 30 \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a copy -movflags +faststart "$OUT"
