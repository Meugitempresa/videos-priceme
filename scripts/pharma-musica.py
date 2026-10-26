"""Estende a música de fundo original (já sem a voz antiga) repetindo compassos inteiros, cortados nas batidas,
sem esticar nem mudar o andamento. Uso: python scripts/pharma-musica.py entrada.wav saida.wav"""
import sys
import numpy as np, soundfile as sf

ent, sai = sys.argv[1:3]
x, sr = sf.read(ent, dtype="float64")
BATIDA, FASE = 0.705, 0.34          # medido: ~84,5 BPM, primeira batida em 0,34 s
COMPASSOS = 2                        # +5,64 s
P = FASE + BATIDA * 27               # ponto de inserção numa batida (~19,38 s): emendas mais suaves medidas
L = COMPASSOS * 4 * BATIDA
a, b = int(round((P - L) * sr)), int(round(P * sr))
xf = int(0.03 * sr)                  # cruzamentos curtos nas emendas, sobre a batida
w = np.linspace(0, 1, xf)[:, None]
bloco = x[a:b].copy()
antes, depois = x[:b].copy(), x[b:].copy()
# emenda 1: fim do trecho original -> início da repetição
bloco[:xf] = antes[-xf:] * np.cos(w * np.pi / 2) + bloco[:xf] * np.sin(w * np.pi / 2)
antes = antes[:-xf]
# emenda 2: fim da repetição -> continuação original
depois[:xf] = bloco[-xf:] * np.cos(w * np.pi / 2) + depois[:xf] * np.sin(w * np.pi / 2)
bloco = bloco[:-xf]
y = np.concatenate([antes, bloco, depois])
sf.write(sai, y, sr, subtype="PCM_24")
print(f"inserção em {P:.3f} s, {L:.2f} s repetidos | duração {len(x)/sr:.2f} -> {len(y)/sr:.2f} s")
# continuidade nas emendas: diferença espectral entre 100 ms antes e depois de cada emenda
def esp(seg): return np.log(np.abs(np.fft.rfft(seg.mean(axis=1) * np.hanning(len(seg)))) + 1e-6)
for t in (P - xf / sr, P + L - 2 * xf / sr):
    k = int(t * sr); n = int(0.1 * sr)
    print(f"  emenda em {t:.2f} s: diferença espectral {np.mean(np.abs(esp(y[k-n:k]) - esp(y[k:k+n]))):.2f}"
          f" (referência no meio da música: {np.mean(np.abs(esp(x[int(12*sr)-n:int(12*sr)]) - esp(x[int(12*sr):int(12*sr)+n]))):.2f})")
