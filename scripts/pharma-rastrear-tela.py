"""Rastreia os 4 cantos da tela do celular (cena do laboratório, quadros 310–403) pelas bordas reais:
área azul do site antigo + faixa branca inferior; retas ajustadas com descarte de pontos cobertos pelos dedos.
Saída: src/pharma/tela-cantos.json  ([[x,y] x4] por quadro: sup-esq, sup-dir, inf-dir, inf-esq)
Uso: python scripts/pharma-rastrear-tela.py public/pharma/original.mp4"""
import json, subprocess, sys
import numpy as np

F = sys.argv[1]
A, B = 310, 404
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", F, "-vf", f"select='between(n,{A},{B-1})'", "-vsync", "0",
                      "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, 1920, 1080, 3).astype(np.int16)
X0, X1, Y0, Y1 = 380, 900, 760, 1420  # região do aparelho

def reta(xs, ys, iters=4):
    """ajusta x = a*y + b (ou y = a*x + b) descartando pontos fora (dedos, reflexos)"""
    xs, ys = np.asarray(xs, float), np.asarray(ys, float)
    m = np.ones(len(xs), bool)
    for _ in range(iters):
        a, b = np.polyfit(ys[m], xs[m], 1)
        r = np.abs(xs - (a * ys + b))
        lim = max(1.5, np.percentile(r[m], 70) * 2)
        m = r < lim
    return a, b

def cruza(v, h):
    """v: x = a*y + b ; h: y = c*x + d"""
    a, b = v; c, d = h
    y = (c * b + d) / (1 - c * a); return [a * y + b, y]

BORDA = 9  # espessura da moldura preta (px), entre o contorno do aparelho e a tela

def recua(q, d):
    """move cada canto do quadrilátero para dentro, d px na direção das duas arestas vizinhas"""
    q = np.asarray(q, float); c = q.mean(axis=0); out = []
    for i in range(4):
        p, a_, b_ = q[i], q[i - 1], q[(i + 1) % 4]
        u = (a_ - p) / np.linalg.norm(a_ - p); v = (b_ - p) / np.linalg.norm(b_ - p)
        out.append(p + (u + v) * d / np.sqrt(max(1e-6, 1 - (u @ v) ** 2)))
    return out

saida = []
for f in fr:
    reg = f[Y0:Y1, X0:X1]
    R, G, Bc = reg[..., 0], reg[..., 1], reg[..., 2]
    lum = (R + G + Bc) / 3
    azul = (Bc > 70) & (Bc > R + 25) & (Bc > G + 35)
    corpo = (lum < 75) | azul  # moldura preta + tela azul (o fundo do laboratório é claro)
    lin_y, esq, dir_ = [], [], []
    for y in range(110, 360):  # laterais acima das mãos
        xs = np.where(corpo[y])[0]
        if len(xs) > 80:
            lin_y.append(y); esq.append(xs[0]); dir_.append(xs[-1])
    ve = reta(esq, lin_y); vd = reta(dir_, lin_y)
    xm_e, xm_d = ve[0] * 150 + ve[1], vd[0] * 150 + vd[1]
    col_x, topo = [], []
    for x in range(int(xm_e) + 30, int(xm_d) - 30):
        ys = np.where(corpo[:, x])[0]
        if len(ys): col_x.append(x); topo.append(ys[0])
    ht = reta(topo, col_x)
    # base: último pixel escuro (moldura inferior) nas colunas da esquerda, fora da mão direita
    col2, base = [], []
    xb = ve[0] * 520 + ve[1]
    for x in range(int(xb) + 20, int(xb) + 130):
        ys = np.where(lum[420:640, x] < 75)[0]
        if len(ys): col2.append(x); base.append(420 + ys[-1])
    hb = reta(base, col2)
    externo = [cruza(ve, ht), cruza(vd, ht), cruza(vd, hb), cruza(ve, hb)]
    q = recua(externo, BORDA)
    saida.append([[p[0] + X0, p[1] + Y0] for p in q])

Q = np.array(saida)
# suavização temporal (média móvel de 7 quadros, com bordas preservadas)
k = 7; P = np.pad(Q, ((k // 2, k // 2), (0, 0), (0, 0)), mode="edge")
S = np.stack([P[i:i + k].mean(axis=0) for i in range(len(Q))])
json.dump({"inicio": A, "fim": B, "cantos": np.round(S, 2).tolist()}, open("src/pharma/tela-cantos.json", "w"))
for i in (0, 30, 60, 93):
    print(A + i, np.round(S[i], 1).tolist())
print("tremor bruto (desvio médio quadro a quadro, px):", round(float(np.abs(np.diff(Q, axis=0)).mean()), 2),
      "| após suavizar:", round(float(np.abs(np.diff(S, axis=0)).mean()), 2))
