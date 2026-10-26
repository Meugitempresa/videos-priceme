"""Substitui a tela do celular na cena do laboratório (quadros 310–403) pela captura do site
(public/pharma/tela-site.png), usada sem alterações: ajustada pela largura, projetada na perspectiva
da tela rastreada (src/pharma/tela-cantos.json), cantos arredondados e com os dedos mantidos por cima.
Uso: python scripts/pharma-tela.py public/pharma/original.mp4 public/pharma/base.mp4 [quadros de teste...]"""
import json, subprocess, sys
import numpy as np
from PIL import Image

orig, saida = sys.argv[1:3]
teste = [int(x) for x in sys.argv[3:]]
W, H = 1080, 1920
dados = json.load(open("src/pharma/tela-cantos.json"))
A, B = dados["inicio"], dados["fim"]

# textura da tela: captura original no topo; abaixo, a cor de fundo da própria página (sem conteúdo novo)
cap = np.asarray(Image.open("public/pharma/tela-site.png").convert("RGB")).astype(np.float32)
ch, cw = cap.shape[:2]
fundo = np.median(cap[-6:, 40:cw - 80].reshape(-1, 3), axis=0)  # faixa inferior da página
q0 = np.array(dados["cantos"][0])
asp = np.linalg.norm(q0[1] - q0[0]) / np.linalg.norm(q0[3] - q0[0])  # largura/altura da tela
TH = int(round(cw / asp))
tex = np.empty((TH, cw, 3), np.float32); tex[:] = fundo; tex[:ch] = cap
RAIO = 26 * cw / np.linalg.norm(q0[1] - q0[0])  # raio dos cantos do aparelho, em pixels da textura

def homografia(src, dst):
    M = []
    for (x, y), (u, v) in zip(src, dst):
        M += [[x, y, 1, 0, 0, 0, -u * x, -u * y, -u], [0, 0, 0, x, y, 1, -v * x, -v * y, -v]]
    _, _, vt = np.linalg.svd(np.array(M, float)); h = vt[-1].reshape(3, 3); return h / h[2, 2]

def compor(frame, q):
    q = np.array(q)
    x0, y0 = np.floor(q.min(axis=0)).astype(int) - 3; x1, y1 = np.ceil(q.max(axis=0)).astype(int) + 3
    Hm = homografia(q, [[0, 0], [cw, 0], [cw, TH], [0, TH]])  # tela -> textura
    ys, xs = np.mgrid[y0:y1, x0:x1].astype(np.float64)
    den = Hm[2, 0] * xs + Hm[2, 1] * ys + Hm[2, 2]
    u = (Hm[0, 0] * xs + Hm[0, 1] * ys + Hm[0, 2]) / den
    v = (Hm[1, 0] * xs + Hm[1, 1] * ys + Hm[1, 2]) / den
    # cobertura com borda suave e cantos arredondados (em pixels da textura)
    esc = cw / np.linalg.norm(q[1] - q[0])
    du = np.minimum(u, cw - u); dv = np.minimum(v, TH - v)
    cx = np.clip(RAIO - du, 0, None); cy = np.clip(RAIO - dv, 0, None)
    dist_canto = RAIO - np.sqrt(cx ** 2 + cy ** 2)
    d = np.where((cx > 0) & (cy > 0), dist_canto, np.minimum(du, dv))
    alfa = np.clip(d / esc + 0.5, 0, 1)
    # amostragem bilinear da textura
    uc = np.clip(u - 0.5, 0, cw - 1.001); vc = np.clip(v - 0.5, 0, TH - 1.001)
    i0, j0 = vc.astype(int), uc.astype(int); fy, fx = (vc - i0)[..., None], (uc - j0)[..., None]
    cor = (tex[i0, j0] * (1 - fx) * (1 - fy) + tex[i0, j0 + 1] * fx * (1 - fy) +
           tex[i0 + 1, j0] * (1 - fx) * fy + tex[i0 + 1, j0 + 1] * fx * fy)
    reg = frame[y0:y1, x0:x1].astype(np.float32)
    # dedos por cima da tela: tons de pele, só junto às bordas laterais e na metade de baixo
    R, G, Bc = reg[..., 0], reg[..., 1], reg[..., 2]
    mx, mn = reg.max(axis=2), reg.min(axis=2)
    sat = (mx - mn) / np.maximum(mx, 1)
    pele = (R > 110) & (R > G) & (G > Bc) & (R - G > 10) & (R - Bc > 30) & (sat > 0.15) & (sat < 0.6)
    perto_borda = (np.minimum(u, cw - u) < 95) & (v > TH * 0.38)
    pele = pele & perto_borda
    # recorte da câmera (preto) no topo do aparelho continua original
    lum = reg.mean(axis=2)
    pele = pele | ((lum < 45) & (v < TH * 0.035) & (u > cw * 0.3) & (u < cw * 0.7))
    # suaviza a máscara dos dedos (1 px)
    p = pele.astype(np.float32)
    p = (p + np.roll(p, 1, 0) + np.roll(p, -1, 0) + np.roll(p, 1, 1) + np.roll(p, -1, 1)) / 5
    a = (alfa * (1 - np.clip(p * 1.6, 0, 1)))[..., None]
    out = frame.copy()
    out[y0:y1, x0:x1] = np.clip(reg * (1 - a) + cor * a, 0, 255).astype(np.uint8)
    return out

def ler(a, b):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", orig, "-vf", f"select='between(n,{a},{b-1})'", "-vsync", "0",
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)

if teste:
    for n in teste:
        Image.fromarray(compor(ler(n, n + 1)[0], dados["cantos"][n - A])).save(f"{saida}-{n}.png")
    sys.exit()

enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", "30",
                        "-i", "-", "-i", orig, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-crf", "12",
                        "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy", saida], stdin=subprocess.PIPE)
total = int(subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries",
                            "stream=nb_read_frames", "-of", "csv=p=0", orig], capture_output=True, text=True).stdout)
for x in ler(0, A): enc.stdin.write(x.tobytes())
for i, x in enumerate(ler(A, B)): enc.stdin.write(compor(x, dados["cantos"][i]).tobytes())
for x in ler(B, total): enc.stdin.write(x.tobytes())
enc.stdin.close(); enc.wait()
print("quadros:", total, "| substituídos:", B - A)
