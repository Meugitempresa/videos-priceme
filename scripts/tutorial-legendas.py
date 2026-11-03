"""Legendas do tutorial: transcrição da Julia (Parakeet, conferida com o Whisper), grafia corrigida,
blocos curtos (até ~56 letras, quebra em pontuação) e destaque em rosa para um termo-chave por bloco.
Uso: python scripts/tutorial-legendas.py"""
import json, re

p = json.load(open("src/tutorial/palavras-parakeet.json"))
ATRASO = 0.08  # o Parakeet marca as palavras levemente antes da voz
w = [{"w": x["w"], "t": round(x["t"] + ATRASO, 2)} for x in p]
# marca e grafia
out = []
i = 0
while i < len(w):
    a = w[i]["w"]
    if a == "Farma" and i + 1 < len(w) and w[i + 1]["w"].startswith("Online"):
        out.append({"w": "pHarmaOnline" + w[i + 1]["w"][6:], "t": w[i]["t"]}); i += 2; continue
    out.append(dict(w[i])); i += 1
for k, x in enumerate(out):
    x["w"] = {"vindas": "boas-vindas"}.get(x["w"], x["w"])
    if x["w"] == "boas" and k + 1 < len(out) and out[k + 1]["w"] == "vindas":
        x["w"] = "boas-vindas"; out[k + 1]["w"] = ""
    x["w"] = x["w"].replace("PIX", "Pix").replace("farmacêuticas", "farmacêutica")
out = [x for x in out if x["w"]]
txt = " ".join(x["w"] for x in out)

# blocos: quebra em ponto/vírgula; blocos longos divididos perto do meio
blocos, atual = [], []
for x in out:
    atual.append(x)
    if re.search(r"[.?!]$", x["w"]) or (re.search(r",$", x["w"]) and len(" ".join(y["w"] for y in atual)) > 22):
        blocos.append(atual); atual = []
if atual: blocos.append(atual)
PROTEGIDOS = ["Criar Cadastro", "e-mail e senha", "Concluir a fórmula", "Ver o Resumo", "segunda triagem",
              "caixas de autorização", "termos obrigatórios", "forma de entrega", "forma de pagamento",
              "conferência e precificação", "gelatinosa comum", "prazo de liberação", "prazo normal", "boas-vindas",
              "tipo de cápsula", "forma farmacêutica", "novo orçamento", "botão rosa", "usar essa foto",
              "dados cadastrados", "logo depois"]
final = []
def tam(b): return len(" ".join(y["w"] for y in b))
CONECTIVOS = {"e", "para", "com", "onde", "como", "antes", "depois", "que", "de"}
def custo(c, j):
    """custo de quebrar o bloco c antes da palavra j: equilíbrio + preferência por vírgulas e conectivos,
    proibido dividir os termos da interface (lista PROTEGIDOS)"""
    esq = " ".join(y["w"] for y in c[:j]).lower(); dir_ = " ".join(y["w"] for y in c[j:]).lower()
    for t in PROTEGIDOS:
        t = t.lower()
        for k in range(1, len(t.split())):
            a_, b_ = " ".join(t.split()[:k]), " ".join(t.split()[k:])
            if esq.endswith(a_) and dir_.startswith(b_): return 1e9
    v = abs(tam(c[:j]) - tam(c) / 2)
    if c[j - 1]["w"].endswith(","): v -= 14
    if c[j]["w"].lower() in CONECTIVOS: v -= 8
    if c[j - 1]["w"].lower() in CONECTIVOS | {"a", "o", "as", "os", "da", "do", "em", "no", "na"}: v += 20
    return v
for b in blocos:
    fila = [b]
    while fila:
        c = fila.pop(0)
        if tam(c) <= 58: final.append(c); continue
        m = min(range(1, len(c)), key=lambda j: custo(c, j))
        fila[:0] = [c[:m], c[m:]]

CHAVE = ["pHarmaOnline", "Criar Cadastro", "e-mail e senha", "orçamento", "foto", "receita", "botão rosa",
         "fórmula", "forma farmacêutica", "cápsulas", "gelatinosa comum", "quantidade", "ativo", "miligramas",
         "Concluir a fórmula", "Ver o Resumo", "prazo normal", "prazo de liberação", "endereço de entrega",
         "conferência e precificação", "posologia", "modo de usar", "conferência inicial", "forma de entrega", "caixas de autorização",
         "autorizar a manipulação", "forma de pagamento", "Pix", "segunda triagem", "produção", "boas-vindas"]
res = []
for n, b in enumerate(final):
    texto = " ".join(y["w"] for y in b)
    ini = b[0]["t"] - 0.05
    prox = final[n + 1][0]["t"] if n + 1 < len(final) else b[-1]["t"] + 1.2
    fim = min(prox - 0.04, b[-1]["t"] + 0.9)
    destaque = next((c for c in sorted(CHAVE, key=len, reverse=True) if c.lower() in texto.lower()), None)
    res.append({"inicio": round(ini, 2), "fim": round(fim, 2), "texto": texto, "destaque": destaque,
                "palavras": [{"w": y["w"], "t": y["t"]} for y in b]})
json.dump(res, open("src/tutorial/legendas.json", "w"), ensure_ascii=False, indent=1)
for r in res: print(f'{r["inicio"]:6.2f}-{r["fim"]:6.2f} [{r["destaque"] or "-"}] {r["texto"]}')
