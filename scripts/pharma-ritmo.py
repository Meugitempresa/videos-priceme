"""Redistribui o tempo do vídeo pelas âncoras de src/pharma/ritmo.json, sem engasgos: cada trecho é
reamostrado com interpolação compensada por movimento (FFmpeg minterpolate), trechos em paralelo.
Uso: python scripts/pharma-ritmo.py public/pharma/base.mp4 public/pharma/base-ritmo.mp4"""
import json, os, subprocess, sys, tempfile
from concurrent.futures import ProcessPoolExecutor
import numpy as np

ent, sai = sys.argv[1:3]
R = json.load(open("src/pharma/ritmo.json"))
W, H = 1080, 1920
anc = R["ancoras"]
seg = []
for (a0, a1), (b0, b1) in zip(anc, anc[1:]):
    fa, fb = round(a0 * 30), min(round(b0 * 30), R["quadrosOriginais"])
    na, nb = round(a1 * 30), min(round(b1 * 30), R["quadrosNovos"])
    seg.append((fa, fb, na, nb))
tmp = tempfile.mkdtemp()

def processa(i_s):
    i, (fa, fb, na, nb) = i_s
    n_in, n_out = fb - fa, nb - na
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", ent, "-vf", f"select='between(n,{fa},{fb-1})'", "-vsync", "0",
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    # os trechos terminam em cortes de cena: o "próximo quadro" que a interpolação precisa no final é o
    # último quadro repetido (nunca o primeiro da cena seguinte, para não misturar cenas)
    raw = raw + raw[-W * H * 3:] * 4
    taxa = n_in * 30 / n_out
    out = subprocess.run(["ffmpeg", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", f"{taxa:.6f}",
                          "-i", "-", "-vf", "minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1",
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], input=raw, capture_output=True).stdout
    q = np.frombuffer(out, np.uint8).reshape(-1, H, W, 3)
    if len(q) < n_out:
        print(f"  aviso: trecho {i} gerou {len(q)} de {n_out} quadros", flush=True)
        q = np.concatenate([q, np.repeat(q[-1:], n_out - len(q), axis=0)])
    q = q[:n_out]
    caminho = os.path.join(tmp, f"{i:02d}.raw"); q.tofile(caminho)
    return i, n_in, n_out, round(taxa, 2)

with ProcessPoolExecutor(4) as ex:
    for i, n_in, n_out, taxa in ex.map(processa, enumerate(seg)):
        print(f"trecho {i}: {n_in} -> {n_out} quadros (entrada a {taxa} fps, fator {n_out/n_in:.2f})", flush=True)
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", "30",
                        "-i", "-", "-c:v", "libx264", "-crf", "12", "-preset", "medium", "-pix_fmt", "yuv420p", sai],
                       stdin=subprocess.PIPE)
for i in range(len(seg)):
    with open(os.path.join(tmp, f"{i:02d}.raw"), "rb") as f: enc.stdin.write(f.read())
    os.remove(os.path.join(tmp, f"{i:02d}.raw"))
enc.stdin.close(); enc.wait()
print("total:", sum(s[3] - s[2] for s in seg), "quadros")
