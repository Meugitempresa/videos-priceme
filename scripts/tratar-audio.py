"""Trata a voz do take seguindo a EDL (src/edicao/edl.json), sem alterar timbre nem velocidade:
- iguala o volume médio de fala entre os blocos gerados (ganho fixo por bloco, trocado só nas emendas);
- em cada corte, cruza 70 ms do fim do trecho anterior com o início do seguinte, só em silêncio
  (nada de palavra sobreposta, eco ou duplicação) e sem mudar a duração (sincronia com a imagem);
- nas pausas inseridas, usa ambiente real do take, em laço suave;
- normaliza para -15 LUFS (como o original) com limitador só nos picos (teto -1 dBTP).
Uso: python scripts/tratar-audio.py public/take.mp4 src/edicao/edl.json public/voz-tratada.wav"""
import json, os, subprocess, sys, tempfile
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
amostra = lambda t: int(round(t * sr))

def nivel_db(seg):
    hop = sr // 100
    r = np.array([np.sqrt(np.mean(seg[i*hop:(i+1)*hop] ** 2)) + 1e-12 for i in range(len(seg) // hop)])
    db = 20 * np.log10(r)
    return float(np.mean(db[db > -40]))

# 1) Ganho fixo por bloco gerado (as trocas caem dentro de emendas, nunca no meio de uma fala)
lim = edl["blocosOriginais"]
niveis = [nivel_db(x[amostra(a):amostra(b)].mean(axis=1)) for a, b in zip(lim, lim[1:])]
alvo = float(np.mean(niveis))
for (a, b), n in zip(zip(lim, lim[1:]), niveis):
    x[amostra(a):amostra(b)] *= 10 ** ((alvo - n) / 20)
print("fala por bloco (dB):", [round(n, 1) for n in niveis], "-> alvo", round(alvo, 1))

def ambiente(de, ate, dur):
    """Ambiente real do take (de..ate s) em laço com cruzamentos de 40 ms até `dur` s."""
    base = x[amostra(de):amostra(ate)]
    xf = amostra(0.04)
    out = base.copy()
    while len(out) < amostra(dur) + xf:
        w = np.linspace(0, 1, xf)[:, None]
        out[-xf:] = out[-xf:] * np.cos(w * np.pi / 2) + base[:xf] * np.sin(w * np.pi / 2)
        out = np.concatenate([out, base[xf:]])
    return out[:amostra(dur)]

xf = amostra(edl["cruzamento"])
partes = []          # (áudio, origem_fim_em_amostras ou None)
itens = edl["itens"]
for k, it in enumerate(itens):
    if it["tipo"] == "trecho":
        a, b = amostra(it["inicio"] / fps), amostra(it["fim"] / fps)
        seg = x[a:b].copy()
        ant = itens[k - 1] if k else None
        if ant and ant["tipo"] == "pausa":
            # o começo deste trecho (fim da fala anterior / silêncio digital) já foi coberto pelo ambiente
            n = amostra(ant["substituiInicioDoProximo"])
            seg[:n] = 0
            f = amostra(0.005)  # ataque de 5 ms na volta da fala, sem comer a sílaba
            seg[n:n + f] *= np.linspace(0, 1, f)[:, None]
        elif ant and ant["tipo"] == "trecho":
            # cruzamento depois do ponto de corte: fim do anterior (em silêncio) some enquanto este entra
            pa = amostra(ant["fim"] / fps)
            w = np.linspace(0, 1, xf)[:, None]
            seg[:xf] = x[pa:pa + xf] * np.cos(w * np.pi / 2) + seg[:xf] * np.sin(w * np.pi / 2)
        partes.append(seg)
    else:
        dur = it["quadros"] / fps
        extra = it["substituiInicioDoProximo"]
        tom = ambiente(it["tomDe"], it["tomAte"], dur + extra + 0.05)
        # 50 ms de cruzamento com o decaimento final do trecho anterior
        c = amostra(0.05)
        w = np.linspace(0, 1, c)[:, None]
        anterior = partes[-1]
        anterior[-c:] = anterior[-c:] * np.cos(w * np.pi / 2) + tom[:c] * np.sin(w * np.pi / 2)
        tom = tom[c:]
        partes.append(tom[:amostra(dur)])
        # o restante do ambiente entra por baixo do início do próximo trecho (silêncio digital do take)
        partes.append(("sobrepor", tom[amostra(dur):amostra(dur) + amostra(extra)]))

saida_audio = []
pendente = None
for p in partes:
    if isinstance(p, tuple):
        pendente = p[1]
        continue
    if pendente is not None:
        p = p.copy()
        p[:len(pendente)] += pendente
        pendente = None
    saida_audio.append(p)
y = np.concatenate(saida_audio)
quadros = sum((it["fim"] - it["inicio"]) if it["tipo"] == "trecho" else it["quadros"] for it in itens)
assert abs(len(y) / sr - quadros / fps) < 1 / sr * 2, (len(y) / sr, quadros / fps)

def medir(caminho):
    med = subprocess.run(["ffmpeg", "-hide_banner", "-i", caminho, "-af", "ebur128=peak=true:framelog=quiet",
                          "-f", "null", "-"], capture_output=True, text=True).stderr.split("Summary:")[-1]
    return float(med.split("I:")[1].split("LUFS")[0]), float(med.split("Peak:")[1].split("dBFS")[0])

bruto = os.path.join(tmp, "bruto.wav")
sf.write(bruto, y, sr, subtype="FLOAT")
lufs, pico = medir(bruto)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", bruto, "-af",
                f"volume={-15.0 - lufs:.2f}dB,alimiter=limit=0.85:attack=3:release=60:level=false:asc=1",
                "-ar", str(sr), "-c:a", "pcm_s24le", saida], check=True)
lufs2, pico2 = medir(saida)
print(f"duração {len(y)/sr:.3f} s ({quadros} quadros) | {lufs:.1f} LUFS/{pico:.1f} dBTP -> {lufs2:.1f} LUFS/{pico2:.1f} dBTP")
