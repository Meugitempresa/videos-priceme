"""Insere a gravação da plataforma (VÍDEO 2) na tela física do celular, quadros 556–748 do VÍDEO 1.
- cantos do aparelho: src/estadio/celular-cantos.json (scripts/estadio-rastrear-tela.py)
- tempo: src/estadio/tela-tempo.json (quadro do vídeo 1 -> quadro da gravação, na ordem original)
- tela = contorno externo recuado pela moldura, cantos arredondados; homografia por quadro
- dedos por cima: pele ligada à mão fora do aparelho, só na metade de baixo da tela
- acabamento: leve redução de brilho, desfoque de lente igual ao da câmera, reflexo suave no vidro
Uso: python scripts/estadio-tela.py <video1.mp4> <video2.mp4> <saida.mp4> [quadros de teste...]"""
import json, subprocess, sys
import cv2, numpy as np

V1, V2, OUT = sys.argv[1:4]
TESTE = [int(x) for x in sys.argv[4:]]
W, H = 1080, 1920
A, B = 556, 748
CANTOS = {int(k): np.array(v, np.float32) for k, v in json.load(open("src/estadio/celular-cantos.json")).items()}
TEMPO = {int(k): v for k, v in json.load(open("src/estadio/tela-tempo.json")).items()}
MU, MV, RAIO = 0.045, 0.021, 0.11  # moldura (fração da largura / altura do aparelho) e raio do canto (fração da largura)
SW, SH = 900, 1950  # resolução da tela virtual (proporção da tela física ~0,46)

def le(path, w, h):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", path, "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE)
    while True:
        b = p.stdout.read(w * h * 3)
        if len(b) < w * h * 3: break
        yield np.frombuffer(b, np.uint8).reshape(h, w, 3)

g2 = [f.copy() for f in le(V2, 424, 650)]
# fundo azul da própria página (margem esquerda da gravação, meio da altura) para completar acima e abaixo
FUNDO = np.median(np.stack([g[150:500, 1:4] for g in g2[80:]]).reshape(-1, 3), 0).astype(np.uint8)

def tela_virtual(f2):
    """gravação ajustada à largura da tela; acima e abaixo, a cor de fundo da própria página (borda da gravação)"""
    s = SW / f2.shape[1]; h = int(round(f2.shape[0] * s))
    im = cv2.resize(f2, (SW, h), interpolation=cv2.INTER_CUBIC)
    topo = np.median(f2[:3].reshape(-1, 3), 0); base = np.median(f2[-3:].reshape(-1, 3), 0)
    tela = np.empty((SH, SW, 3), np.uint8); y0 = (SH - h) // 2
    tela[:y0] = FUNDO; tela[y0 + h:] = FUNDO
    tela[y0:y0 + h] = im
    return tela

mascara_tela = np.zeros((SH, SW), np.uint8)
r = int(RAIO / (1 - 2 * MU) * SW)
cv2.rectangle(mascara_tela, (r, 0), (SW - r, SH), 255, -1); cv2.rectangle(mascara_tela, (0, r), (SW, SH - r), 255, -1)
for cx, cy in [(r, r), (SW - r, r), (r, SH - r), (SW - r, SH - r)]: cv2.circle(mascara_tela, (cx, cy), r, 255, -1, cv2.LINE_AA)
reflexo = np.tile(np.linspace(1.0, 0.0, SW, dtype=np.float32)[None], (SH, 1))
reflexo = (reflexo * np.linspace(1.0, 0.3, SH, dtype=np.float32)[:, None]) ** 2 * 18  # brilho suave no canto sup-esq

def quad_tela(q):
    Hq = cv2.getPerspectiveTransform(np.float32([[0, 0], [1, 0], [1, 1], [0, 1]]), q)
    u = np.float32([[[MU, MV], [1 - MU, MV], [1 - MU, 1 - MV], [MU, 1 - MV]]])
    return cv2.perspectiveTransform(u, Hq)[0]

DEDOS = json.load(open("src/estadio/dedos.json"))
def poligono(chaves, n):
    ks = sorted(int(k) for k in chaves)
    if n < ks[0]: return None
    if n >= ks[-1]: return np.array(chaves[str(ks[-1])], np.float32)
    j = max(i for i, k in enumerate(ks) if k <= n); a, b = ks[j], ks[j + 1]; t = (n - a) / (b - a)
    return (np.array(chaves[str(a)]) * (1 - t) + np.array(chaves[str(b)]) * t).astype(np.float32)

def compoe(f1, n):
    q = CANTOS[n]; d = quad_tela(q)
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [SW, 0], [SW, SH], [0, SH]]), d)
    tela = tela_virtual(g2[TEMPO[n]]).astype(np.float32)
    tela = tela * 0.93 + reflexo[..., None]  # tela acesa filmada: um pouco menos branca, reflexo leve
    larg = np.linalg.norm(d[1] - d[0])
    pre = cv2.resize(np.clip(tela, 0, 255).astype(np.uint8), (int(larg * 2), int(larg * 2 * SH / SW)), interpolation=cv2.INTER_AREA)
    Mp = cv2.getPerspectiveTransform(np.float32([[0, 0], [pre.shape[1], 0], [pre.shape[1], pre.shape[0]], [0, pre.shape[0]]]), d)
    warp = cv2.warpPerspective(pre, Mp, (W, H), flags=cv2.INTER_LINEAR)
    warp = cv2.GaussianBlur(warp, (0, 0), 0.7)
    a = cv2.warpPerspective(mascara_tela, M, (W, H), flags=cv2.INTER_LINEAR).astype(np.float32) / 255
    # dedos sobre a tela (polígonos medidos na tela retificada, interpolados entre quadros-chave)
    Hd = cv2.getPerspectiveTransform(np.float32([[0, 0], [1, 0], [1, 1], [0, 1]]), d)
    dedos = np.zeros((H, W), np.float32)
    lab = cv2.cvtColor(f1, cv2.COLOR_BGR2LAB).astype(np.float32)
    dmask = (a > 0.5).astype(np.uint8)
    for nome in ("polegar",):
        p = poligono(DEDOS[nome], n)
        if p is None: continue
        pts = cv2.perspectiveTransform(p[None], Hd)[0]
        P = np.zeros((H, W), np.uint8); cv2.fillPoly(P, [np.round(pts).astype(np.int32)], 1)
        roi = cv2.dilate(P, np.ones((15, 15), np.uint8)) & dmask        # onde decidir pixel a pixel
        pele = (P & (1 - dmask)) & (lab[..., 0] > 60).astype(np.uint8)   # parte do dedo fora da tela (com certeza pele)
        anel = (cv2.dilate(P, np.ones((61, 61), np.uint8)) - cv2.dilate(P, np.ones((17, 17), np.uint8))) & dmask
        if pele.sum() < 50 or anel.sum() < 50:
            dedos = np.maximum(dedos, P.astype(np.float32)); continue
        def gauss(m):
            x = lab[m.astype(bool)]; mu = x.mean(0); cov = np.cov(x.T) + np.eye(3) * 4; return mu, np.linalg.inv(cov), np.linalg.slogdet(cov)[1]
        def nll(g, x): d = x - g[0]; return 0.5 * np.einsum("ij,jk,ik->i", d, g[1], d) + 0.5 * g[2]
        gp, ga = gauss(pele), gauss(anel)
        ys, xs = np.nonzero(roi); x = lab[ys, xs]
        sel = nll(gp, x) < nll(ga, x)
        m = np.zeros((H, W), np.uint8); m[ys[sel], xs[sel]] = 1
        m |= pele
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
        k, lb = cv2.connectedComponents(m)  # só o que está ligado ao dedo de fora da tela
        ids = np.unique(lb[pele.astype(bool)]); ids = ids[ids > 0]
        dedos = np.maximum(dedos, np.isin(lb, ids).astype(np.float32))
    dedos = cv2.GaussianBlur(dedos, (0, 0), 1.2)
    a = a * (1 - np.clip(dedos, 0, 1))
    out = f1.astype(np.float32) * (1 - a[..., None]) + warp.astype(np.float32) * a[..., None]
    return np.clip(out, 0, 255).astype(np.uint8)

if TESTE:
    for n, f1 in enumerate(le(V1, W, H)):
        if n in TESTE: cv2.imwrite(OUT.replace(".mp4", f"_{n}.png"), compoe(f1, n))
        if n > max(TESTE): break
    sys.exit()
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", "30",
                        "-i", "-", "-i", V1, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-crf", "12", "-preset", "slow",
                        "-pix_fmt", "yuv420p", "-c:a", "copy", OUT], stdin=subprocess.PIPE)
for n, f1 in enumerate(le(V1, W, H)):
    enc.stdin.write((compoe(f1, n) if A <= n <= B else f1).tobytes())
enc.stdin.close(); enc.wait()
