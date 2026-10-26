"""Suaviza os planos do reel 2 que vieram de 24 fps com quadros duplicados (pulldown para 30 fps):
remove os duplicados e reconstrói 30 fps por interpolação de movimento (FFmpeg minterpolate).
Cada plano mantém exatamente o mesmo número de quadros, então áudio e sincronia não mudam.
Uso: python scripts/reel2-suavizar.py public/reel2/original.mp4 public/reel2/original-suavizado.mp4"""
import subprocess, sys
import numpy as np

orig, saida = sys.argv[1:3]
W, H = 1080, 1920
PLANOS = [(113, 181), (864, 977), (1093, 1169)]  # [início, fim) em quadros

def ler(a, b):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", orig, "-vf", f"select='between(n,{a},{b-1})'",
                          "-vsync", "0", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)

total = int(subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries",
                            "stream=nb_read_frames", "-of", "csv=p=0", orig], capture_output=True, text=True).stdout)
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                        "-r", "30", "-i", "-", "-i", orig, "-map", "0:v", "-map", "1:a", "-c:v", "libx264",
                        "-crf", "12", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy", saida],
                       stdin=subprocess.PIPE)
pos = 0
for a, b in PLANOS + [(total, total)]:
    if pos < a:  # trecho sem alteração
        for q in ler(pos, a): enc.stdin.write(q.tobytes())
    if a == b: break
    q = ler(a, b)
    peq = np.stack([x[::8, ::8].astype(np.int16) for x in q])
    d = np.abs(np.diff(peq, axis=0)).mean(axis=(1, 2, 3))
    manter = [0] + [i + 1 for i, v in enumerate(d) if v >= 0.12 * np.median(d)]
    unicos = q[manter]
    n = b - a
    # taxa real do plano: quadros únicos distribuídos no mesmo tempo (cerca de 24 a 27 fps)
    taxa = len(unicos) * 30 / n
    # desvio de tempo: posição de cada quadro único após a reamostragem uniforme x posição original
    desvio = max(abs(j * n / len(unicos) - m) for j, m in enumerate(manter))
    interp = subprocess.run(
        ["ffmpeg", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", f"{taxa:.6f}", "-i", "-",
         "-vf", "minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1",
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        input=unicos.tobytes(), capture_output=True).stdout
    novo = np.frombuffer(interp, np.uint8).reshape(-1, H, W, 3)
    if len(novo) < n:  # completa com o último quadro, se faltar
        print(f"  aviso: faltaram {n - len(novo)} quadros na interpolação")
        novo = np.concatenate([novo, np.repeat(novo[-1:], n - len(novo), axis=0)])
    if len(novo) > n + 1:
        print(f"  aviso: sobraram {len(novo) - n} quadros na interpolação")
    novo = novo[:n]
    print(f"plano {a}-{b}: {n} quadros, {n - len(manter)} duplicados, {len(unicos)} únicos ({taxa:.2f} fps) -> "
          f"{len(novo)} quadros; desvio máx de tempo {desvio:.2f} quadro")
    for x in novo: enc.stdin.write(x.tobytes())
    pos = b
enc.stdin.close(); enc.wait()
print("total de quadros:", total)
