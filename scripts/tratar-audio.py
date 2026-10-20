"""Trata a voz do take: corta as pausas da EDL com crossfade, preenche o silêncio
digital da emenda de 8 s, iguala o volume entre os blocos gerados e normaliza.
Uso: python scripts/tratar-audio.py public/take.mp4 src/edicao/edl.json public/voz-tratada.wav
Requer numpy e soundfile (pip install numpy soundfile)."""
import json, subprocess, sys, tempfile, os
import numpy as np, soundfile as sf

entrada, edl_path, saida = sys.argv[1:4]
edl = json.load(open(edl_path))
fps = edl["fps"]
tmp = tempfile.mkdtemp()
wav = os.path.join(tmp, "orig.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", entrada, "-vn", "-ar", "48000", wav], check=True)
x, sr = sf.read(wav, dtype="float64")
if x.ndim == 1:
    x = x[:, None]

def nivel_db(seg):
    hop = sr // 100
    n = len(seg) // hop
    r = np.array([np.sqrt(np.mean(seg[i*hop:(i+1)*hop] ** 2)) + 1e-12 for i in range(n)])
    db = 20 * np.log10(r)
    return float(np.mean(db[db > -40]))

# 1) Silêncio digital na emenda de 8 s: preenche com ruído ambiente de uma pausa real
mono = x.mean(axis=1)
a, b = int(7.95 * sr), int(8.06 * sr)
zeros = np.where(np.abs(mono[a:b]) < 1e-6)[0]
if len(zeros):
    z0, z1 = a + zeros[0], a + zeros[-1] + 1
    ruido = x[int(8.95 * sr): int(8.95 * sr) + (z1 - z0)]
    x[z0:z1] = ruido
    # ataque suave de 6 ms na volta da fala, sem cortar a sílaba
    f = int(0.006 * sr)
    x[z1:z1 + f] *= np.linspace(0.3, 1, f)[:, None]

# 2) Iguala o nível médio de fala de cada bloco gerado
limites = edl["blocosOriginais"]
niveis = [nivel_db(x[int(s*sr):int(e*sr)].mean(axis=1)) for s, e in zip(limites, limites[1:])]
alvo = float(np.mean(niveis))
ganho = np.ones(len(x))
for (s, e), n in zip(zip(limites, limites[1:]), niveis):
    ganho[int(s*sr):int(e*sr)] = 10 ** ((alvo - n) / 20)
rampa = int(0.02 * sr)  # suaviza a troca de ganho (as trocas caem em pausas)
ganho = np.convolve(ganho, np.ones(rampa) / rampa, mode="same")
x *= ganho[:, None]
print("níveis por bloco (dB):", [round(n, 1) for n in niveis], "-> alvo", round(alvo, 1))

# 3) Cortes da EDL com crossfade de 20 ms que preserva a duração (sincronia com a imagem)
xf = int(0.02 * sr); meio = xf // 2
partes = []
for t in edl["trechos"]:
    s, e = int(t["inicio"] / fps * sr), int(t["fim"] / fps * sr)
    partes.append((s, e))
saida_audio = []
for i, (s, e) in enumerate(partes):
    seg = x[s:e].copy()
    if i > 0:
        # início: mistura os 10 ms antes do corte do trecho anterior com o começo deste
        ps, pe = partes[i - 1]
        cauda = x[pe:pe + meio]
        cab = seg[:meio]
        w = np.sin(np.linspace(0, np.pi / 2, meio))[:, None]
        seg[:meio] = cab * w + cauda[:meio] * np.cos(np.linspace(0, np.pi / 2, meio))[:, None]
    if i < len(partes) - 1:
        ns, _ = partes[i + 1]
        fim = seg[-meio:]
        prox = x[ns - meio:ns]
        w = np.cos(np.linspace(0, np.pi / 2, meio))[:, None]
        seg[-meio:] = fim * w + prox * np.sin(np.linspace(0, np.pi / 2, meio))[:, None]
    saida_audio.append(seg)
y = np.concatenate(saida_audio)

# 4) Normaliza para -15 LUFS (como o original) com limitador só nos picos (teto -1 dBTP)
def medir(caminho):
    med = subprocess.run(["ffmpeg", "-hide_banner", "-i", caminho, "-af",
                          "ebur128=peak=true:framelog=quiet", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    resumo = med.split("Summary:")[-1]
    return (float(resumo.split("I:")[1].split("LUFS")[0]),
            float(resumo.split("Peak:")[1].split("dBFS")[0]))

bruto = os.path.join(tmp, "bruto.wav")
sf.write(bruto, y, sr, subtype="FLOAT")
lufs, pico = medir(bruto)
g = -15.0 - lufs
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", bruto, "-af",
                f"volume={g:.2f}dB,alimiter=limit=0.85:attack=3:release=60:level=false:asc=1",
                "-ar", str(sr), "-c:a", "pcm_s24le", saida], check=True)
lufs2, pico2 = medir(saida)
print(f"duração {len(y)/sr:.3f} s | antes {lufs:.1f} LUFS / {pico:.1f} dBTP"
      f" -> depois {lufs2:.1f} LUFS / {pico2:.1f} dBTP")
