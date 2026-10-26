import "@fontsource/plus-jakarta-sans/latin-600.css";
import "@fontsource/plus-jakarta-sans/latin-800.css";
import { AbsoluteFill, Audio, continueRender, delayRender, Easing, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import ritmo from "./ritmo.json";
import { COR, TEXTOS } from "./textos";

const espera = delayRender("Carregando fontes");
Promise.all(["600", "800"].map((p) => document.fonts.load(`${p} 40px "Plus Jakarta Sans"`))).then(() => continueRender(espera));

const ease = Easing.bezier(0.16, 1, 0.3, 1);

// Converte um quadro do vídeo original para a nova linha do tempo (mesmas âncoras do reamostrador)
export const DURACAO = ritmo.quadrosNovos;
const novo = (q: number) => {
  const t = q / 30;
  const a = ritmo.ancoras;
  for (let i = 0; i < a.length - 1; i++) {
    const [o0, n0] = a[i], [o1, n1] = a[i + 1];
    if (t <= o1) return Math.round((n0 + ((t - o0) / (o1 - o0)) * (n1 - n0)) * 30);
  }
  return DURACAO;
};
const PAD = 26;

// Painel de vidro branco (como os cartões do site) que cobre o texto antigo; título com a nova tipografia
const Painel: React.FC<(typeof TEXTOS)[number]> = ({ linhas, caixa, de: deOrig, ate: ateOrig }) => {
  const frame = useCurrentFrame();
  const de = deOrig === 0 ? 0 : novo(deOrig);
  const ate = novo(ateOrig);
  const ini = Math.max(0, de - 6);
  const fim = ate + 4;
  const v = de === 0 ? interpolate(frame, [fim, fim + 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : interpolate(frame, [ini, ini + 6, fim, fim + 8], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  if (v <= 0) return null;
  const [x0, y0, x1, y1] = caixa;
  const w = x1 - x0 + PAD * 2, h = y1 - y0 + PAD * 2;
  // tamanho pela altura e pela largura (a linha mais longa precisa caber com folga)
  const letras = Math.max(...linhas.map((l) => l.replace(/\*/g, "").length));
  const tam = Math.min(68, (h - 40) / (linhas.length * 1.18), (w - 70) / (letras * 0.6));
  let k = 0;
  return (
    <div
      style={{
        position: "absolute", left: x0 - PAD, top: y0 - PAD, width: w, height: h, borderRadius: 34,
        background: "rgba(255,255,255,0.86)", backdropFilter: "blur(26px) saturate(1.1)",
        border: "1.5px solid rgba(255,255,255,0.9)", boxShadow: "0 18px 50px rgba(21,0,108,0.22)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        opacity: v, transform: `scale(${0.97 + 0.03 * v})`,
        fontFamily: "'Plus Jakarta Sans', sans-serif", color: COR.roxo, letterSpacing: -0.5, lineHeight: 1.12,
      }}
    >
      {linhas.map((linha) => (
        <div key={linha} style={{ fontSize: tam, textAlign: "center", whiteSpace: "nowrap" }}>
          {linha.split(/(\*[^*]+\*)/).filter(Boolean).map((parte) => {
            const destaque = parte.startsWith("*");
            return parte.replace(/\*/g, "").split(" ").filter(Boolean).map((p, i, arr) => {
              const e = de === 0 ? 1 : interpolate(frame, [ini + 3 + 2 * k, ini + 11 + 2 * k++], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
              return (
                <span key={p + k} style={{ display: "inline-block", fontWeight: destaque ? 800 : 600, color: destaque ? COR.magenta : COR.roxo, opacity: e, transform: `translateY(${(1 - e) * 14}px)`, marginRight: i < arr.length - 1 || !destaque ? "0.26em" : 0 }}>
                  {p}
                </span>
              );
            });
          })}
        </div>
      ))}
    </div>
  );
};

export const PharmaOnline: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <OffthreadVideo src={staticFile("pharma/base-ritmo.mp4")} muted style={{ width: 1080, height: 1920 }} />
    <Audio src={staticFile("pharma/mix.wav")} />
    {TEXTOS.map((t) => (
      <Painel key={t.de} {...t} />
    ))}
  </AbsoluteFill>
);
