"""Lista as pausas (< -45 dB por >= 150 ms) do áudio tratado em src/edicao/pausas.json.
Uso: python scripts/pausas.py public/voz-tratada.wav"""
import json, sys
import numpy as np, soundfile as sf
x, sr = sf.read(sys.argv[1]); m = x.mean(axis=1) if x.ndim > 1 else x
hop = sr // 100; n = len(m) // hop
db = np.array([20*np.log10(np.sqrt(np.mean(m[i*hop:(i+1)*hop]**2)) + 1e-12) for i in range(n)])
pausas = []; i = 0
while i < n:
    if db[i] < -45:
        j = i
        while j < n and db[j] < -45: j += 1
        if j - i >= 12: pausas.append([i / 100, j / 100])
        i = j
    else: i += 1
json.dump(pausas, open("src/edicao/pausas.json", "w"))
print(pausas)
