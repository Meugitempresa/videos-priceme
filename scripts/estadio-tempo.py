"""Mapa de tempo da gravação de tela (VÍDEO 2, 200 quadros) na 2ª cena do celular (quadros 556–748 do VÍDEO 1).
Ordem original, nada repetido nem inventado. Só os trechos PARADOS da gravação (quadros idênticos) mudam de
duração; as rolagens passam a ~1x. Âncoras na narração:
  - resumo "A farmacêutica conferiu: veja os valores" (parado até 2,27 s) durante "A farmacêutica recebe, analisa..."
  - primeira rolagem até os Valores começa em 21,90 s; Valores/Total na tela durante "e o orçamento chega" (até 23,15 s)
  - o resto da gravação (rolagens até a Entrega) termina junto com a cena (24,93 s), sem tela congelada
Saída: src/estadio/tela-tempo.json {quadro do vídeo 1: quadro do vídeo 2}
Uso: python scripts/estadio-tempo.py <video2.mp4>"""
import json, subprocess, sys
import numpy as np

raw = subprocess.run(["ffmpeg", "-v", "error", "-i", sys.argv[1], "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True).stdout
f = np.frombuffer(raw, np.uint8).reshape(-1, 650, 424).astype(np.int16)
N = len(f)
move = np.array([False] + [np.abs(f[i] - f[i - 1]).mean() > 1.0 for i in range(1, N)])
A, B = 556, 748
# âncoras: (quadro do vídeo 2, tempo no vídeo 1)
ANC = [(0, A / 30), (68, 21.90), (86, 23.15), (N, (B + 1) / 30)]
dur = np.zeros(N)
for (q0, t0), (q1, t1) in zip(ANC, ANC[1:]):
    seg = np.arange(q0, q1); m = move[seg]; total = t1 - t0
    nm = m.sum(); ns = len(seg) - nm
    vel = max(1.0, (nm / 30) / (total * 0.92)) if ns else (nm / 30) / total  # rolagem a ~1x; acelera só o necessário
    dm = 1 / 30 / vel
    ds = (total - nm * dm) / ns if ns else 0
    dur[seg] = np.where(m, dm, ds)
    print(f"v2 {q0/30:4.2f}-{q1/30:4.2f}s -> v1 {t0:5.2f}-{t1:5.2f}s  rolagem {vel:.2f}x  parado {ds*30:.2f} quadro/quadro")
ini = np.concatenate([[A / 30], A / 30 + np.cumsum(dur)[:-1]])
mapa = {}
for n in range(A, B + 1):
    t = n / 30 + 1 / 60  # centro do quadro
    mapa[n] = int(min(N - 1, np.searchsorted(ini, t, side="right") - 1))
json.dump(mapa, open("src/estadio/tela-tempo.json", "w"))
print("primeiro/último:", mapa[A], mapa[B], "quadros distintos usados:", len(set(mapa.values())), "de", N)
