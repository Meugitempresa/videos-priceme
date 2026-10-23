"""Gera as legendas do reel 2 (src/reel2/legendas.json) a partir da transcrição do Parakeet
(conferida com o Whisper) e dos trechos de voz medidos no áudio original.
Uso: python scripts/reel2-legendas.py"""
import json

palavras = json.load(open("src/reel2/fonte/palavras-parakeet.json"))
voz = json.load(open("src/reel2/fonte/trechos-de-voz.json"))
ATRASO = 0.12  # o Parakeet marca o início das palavras um pouco antes da voz

# Correções conferidas com o Whisper: marca junta, pontuação da fala real
w = [{"w": p["w"], "t": round(p["t"] + ATRASO, 2)} for p in palavras]
out = []
i = 0
while i < len(w):
    p = w[i]
    if p["w"] == "Price" and i + 1 < len(w) and w[i + 1]["w"].startswith("Me"):
        out.append({"w": "PriceMe" + w[i + 1]["w"][2:], "t": p["t"]}); i += 2; continue
    out.append(p); i += 1
for p in out:
    if p["w"] == "mas.": p["w"] = "mas"          # "A correria tá grande, mas vim falar da PriceMe."
    if p["w"] == "Vim": p["w"] = "vim"
    if p["w"] == "caro.": p["w"] = "caro?"       # pergunta, com hesitação depois de "Mas"
for k, p in enumerate(out):
    if p["w"] == "Mas" and out[k + 1]["w"] == "isso": p["w"] = "Mas…"

# Blocos: cada um começa na palavra indicada (ordem da fala)
ABRE = ["Bom", "Bom", "A", "Obrigado.", "Bom", "Bom", "Até", "A", "mas", "Que", "Quero", "e", "Em", "É",
        "Mas…", "Quem", "merece", "Já", "Bom,", "Pode", "Quem", "Obrigado,", "Agradeça"]
blocos, k = [], 0
for idx, p in enumerate(out):
    if k < len(ABRE) and p["w"] == ABRE[k] and (k == 0 or idx > blocos[-1]["inicio_idx"]):
        if not (ABRE[k] == "e" and out[idx - 1]["w"] != "produtos") and not (ABRE[k] == "merece" and out[idx - 1]["w"] != "empresa"):
            blocos.append({"inicio_idx": idx, "palavras": []}); k += 1
    blocos[-1]["palavras"].append(p)
assert k == len(ABRE), f"blocos encontrados {k} de {len(ABRE)}"

def fim_da_voz(t):
    """fim da última palavra: o trecho de voz que a contém, emendando pausas curtas.
    Finais falados mais baixo podem ficar abaixo do limiar; nesse caso a palavra dura ao menos 0,5 s."""
    dentro = [v for v in voz if v[0] - 0.3 <= t <= v[1]]
    if not dentro:
        return t + 0.5
    a, b = dentro[0]
    for c, d in voz:
        if c > b and c - b <= 0.2: b = d
    return max(b, t + 0.45)

res = []
for n, b in enumerate(blocos):
    ps = b["palavras"]
    ini = ps[0]["t"] - 0.05
    fim = fim_da_voz(ps[-1]["t"]) + 0.12
    if n + 1 < len(blocos):
        fim = min(fim, blocos[n + 1]["palavras"][0]["t"] - 0.05)
    res.append({"inicio": round(ini, 2), "fim": round(fim, 2),
                "palavras": [{"texto": p["w"], "t": p["t"]} for p in ps]})
json.dump(res, open("src/reel2/legendas.json", "w"), ensure_ascii=False, indent=1)
for r in res:
    print(f'{r["inicio"]:6.2f}-{r["fim"]:6.2f}  {" ".join(p["texto"] for p in r["palavras"])}')
