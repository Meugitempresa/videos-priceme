"""Rastreia o contorno externo do celular na 2ª cena da câmera (quadros 556–748 do vídeo do estádio).
Cada lado é medido por varreduras perpendiculares (de fora para dentro até a carcaça escura), só nos trechos
que ficam à vista (a base e a lateral direita ficam em parte sob os dedos); retas robustas -> cantos.
Partida: cantos medidos à mão no quadro 556. Suavização temporal no fim.
Saída: src/estadio/celular-cantos.json {quadro: [[x,y] sup-esq, sup-dir, inf-dir, inf-esq]}
Uso: python scripts/estadio-rastrear-tela.py <pasta com 0556.png ... 0748.png>"""
import json, sys
import cv2, numpy as np

D = sys.argv[1]
A, B = 556, 748
Q0 = np.array([[695, 730], [932, 760], [838, 1280], [617, 1250]], float)
# trechos visíveis de cada lado (lado i: canto i -> i+1) e se o lado está em parte coberto
TRECHOS = [(0.15, 0.85), (0.08, 0.42), (0.62, 0.90), (0.40, 0.92)]
ESCURO = 70
MOLDURA = 0.045  # moldura lateral (borda externa -> tela), fração da largura do aparelho

def reta(p):
    m = np.ones(len(p), bool)
    for _ in range(8):
        c = p[m].mean(0); _, _, vt = np.linalg.svd(p[m] - c); nrm = vt[1]; d = nrm @ c
        r = np.abs(p @ nrm - d); lim = max(1.2, np.percentile(r[m], 50) * 2.5); m = r < lim
    return nrm, d, m.mean()

def mede(v, q):
    """v: canal de brilho; q: quadrilátero previsto. Devolve as 4 retas medidas (ou None)."""
    c = q.mean(0); res = []
    for i in range(4):
        a, b = q[i], q[(i + 1) % 4]; L = np.linalg.norm(b - a); u = (b - a) / L
        out = np.array([u[1], -u[0]])
        if out @ (a - c) < 0: out = -out
        t0, t1 = TRECHOS[i]; pts = []
        for t in np.linspace(t0, t1, 60):
            p = a + (b - a) * t
            # varre de 0,10·L fora até 0,10·L dentro (de fora para dentro)
            s = np.arange(-0.10 * L - 8, 0.10 * L + 8, 0.5)[::-1]
            xy = p[None] + out[None] * s[:, None]
            xi = np.clip(xy[:, 0].round().astype(int), 0, v.shape[1] - 1); yi = np.clip(xy[:, 1].round().astype(int), 0, v.shape[0] - 1)
            val = v[yi, xi]
            esc = val < ESCURO
            if i == 1:
                # lateral direita: atrás dela há torcida escura; mede de dentro (visor claro) para fora a borda
                # da tela (primeiro trecho escuro = moldura); a borda externa vem depois, somando a moldura
                e = esc[::-1]; xs = xy[::-1]
                ini = np.where(np.convolve(e.astype(int), np.ones(4, int), "full")[3:] >= 4)[0]
                if len(ini) and ini[0] > 0: pts.append(xs[ini[0]])
                continue
            # primeiro ponto (de fora para dentro) que começa um trecho escuro de pelo menos 6 px
            run = np.convolve(esc.astype(int), np.ones(12, int), "full")[11:]
            k = np.where(run >= 12)[0]
            if len(k): pts.append(xy[k[0]])
        if len(pts) < 15: res.append(None); continue
        nrm, d, frac = reta(np.array(pts))
        res.append((nrm, d) if frac > 0.45 else None)
    return res

def cruza(l1, l2): return np.linalg.solve(np.array([l1[0], l2[0]]), np.array([l1[1], l2[1]]))

def linha_de(q, i):
    a, b = q[i], q[(i + 1) % 4]; u = (b - a) / np.linalg.norm(b - a); nrm = np.array([-u[1], u[0]]); return nrm, nrm @ a

q = Q0.copy(); res = {}; perdas = 0
prevg = None
for n in range(A, B + 1):
    im = cv2.imread(f"{D}/{n:04d}.png"); g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    v = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)[..., 2]
    if prevg is not None:  # previsão pelo movimento médio (fluxo óptico da região do aparelho)
        pts = q[None].astype(np.float32)
        nq, st, _ = cv2.calcOpticalFlowPyrLK(prevg, g, pts, None, winSize=(41, 41), maxLevel=4)
        if st.all(): q = nq[0].astype(float)
    for _ in range(2):
        ls = mede(v, q)
        if ls[1] is not None:  # borda da tela -> borda externa: desloca para fora pela espessura da moldura
            nrm, d = ls[1]; cq = q.mean(0)
            if nrm @ cq > d: nrm, d = -nrm, -d  # normal apontando para fora
            ls[1] = (nrm, d + MOLDURA * np.linalg.norm(q[1] - q[0]))
        lin = [ls[i] if ls[i] is not None else linha_de(q, i) for i in range(4)]
        perdas += sum(l is None for l in ls)
        q = np.array([cruza(lin[3], lin[0]), cruza(lin[0], lin[1]), cruza(lin[1], lin[2]), cruza(lin[2], lin[3])])
    res[n] = q.copy(); prevg = g
print("lados sem medida (soma):", perdas)
ks = np.array(sorted(res)); arr = np.stack([res[k] for k in ks])
# suavização: mediana móvel de 5 quadros + gaussiana sigma 1,5
med = np.stack([np.median(arr[max(0, i - 2):i + 3], axis=0) for i in range(len(arr))])
gk = np.exp(-0.5 * (np.arange(-4, 5) / 1.5) ** 2); gk /= gk.sum()
pad = np.concatenate([med[:1].repeat(4, 0), med, med[-1:].repeat(4, 0)])
sm = np.stack([np.tensordot(gk, pad[i:i + 9], axes=(0, 0)) for i in range(len(arr))])
json.dump({int(k): sm[i].round(2).tolist() for i, k in enumerate(ks)}, open("src/estadio/celular-cantos.json", "w"))
for k in [556, 600, 640, 680, 720, 748]: print(k, sm[k - A].round(0).tolist())
