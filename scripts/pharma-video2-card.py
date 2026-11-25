"""Vídeo 2 (institucional pHarma Online): gera o texto e a máscara do card de 00:22–00:24,9.
Estilo copiado do card de 00:26 (670×280 em x=250, y=154; cores amostradas do vídeo; Plus Jakarta Sans 500/700).
Uso: python scripts/pharma-video2-card.py <pasta_saida>"""
import sys
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont

out = sys.argv[1]
W, H, RAIO = 670, 280, 26
AZUL, MAGENTA = "#1F1391", "#EB1EE1"
def fonte(peso, tam):
    src = f"node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-{peso}-normal.woff"
    t = TTFont(src); t.flavor = None; dst = f"{out}/pjs-{peso}.ttf"; t.save(dst)
    return ImageFont.truetype(dst, tam)
R, B = fonte(500, 42), fonte(700, 42)
LINHAS = [[("Envie a ", 0), ("foto", 1), (" da receita", 0)],
          [("Receba o ", 0), ("orçamento", 1)],
          [("Receba sua ", 0), ("fórmula", 1)]]
txt = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(txt)
lh = 54; y = H // 2 - lh
for ln in LINHAS:
    w = sum(d.textlength(s, font=B if k else R) for s, k in ln); x = W / 2 - w / 2
    for s, k in ln:
        f = B if k else R
        d.text((x, y), s, font=f, fill=MAGENTA if k else AZUL, anchor="lm"); x += d.textlength(s, font=f)
    y += lh
txt.save(f"{out}/card-texto.png")
m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, W - 1, H - 1), RAIO, fill=255)
m.save(f"{out}/card-mascara.png")
