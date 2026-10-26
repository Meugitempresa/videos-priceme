#!/bin/sh
# Mixagem: nova locução + música original (sem a voz antiga, estendida), com ducking suave e limitador.
# Uso: sh scripts/pharma-mix.sh public/pharma/locucao.mp3 public/pharma/musica-estendida.wav public/pharma/mix.wav
set -e
ffmpeg -v error -y -i "$1" -i "$2" -filter_complex "
[0:a]aresample=48000,aformat=channel_layouts=stereo,volume=3.6dB,apad=whole_dur=37.9,asplit=2[voz][sc];
[1:a]aresample=48000,aformat=channel_layouts=stereo,volume=-2.0dB[mus];
[mus][sc]sidechaincompress=threshold=0.05:ratio=2.5:attack=40:release=450:makeup=1[musd];
[voz][musd]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.89:attack=3:release=60:level=false[out]" \
  -map "[out]" -t 37.9 -c:a pcm_s24le "$3"
