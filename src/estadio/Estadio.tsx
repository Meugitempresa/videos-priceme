import { AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import "../fontes";
import blocos from "./blocos.json";

// Vídeo do estádio: base = vídeo original com a gravação da plataforma dentro do celular (scripts/estadio-tela.py).
// Aqui só entram as legendas; o áudio final é o original, recolocado sem reencodar (ver CLAUDE.md).
export const DURACAO_ESTADIO = 1019; // 33,97 s, igual ao original
const FONTE = "Montserrat, sans-serif";

type Bloco = { texto: string; t: number[] };
const B = blocos as Bloco[];
// duração aproximada da última palavra falada: ~0,16 s por sílaba (vogais) + folga
const silabas = (w: string) => Math.max(1, (w.toLowerCase().match(/[aeiouáéíóúâêôãõà]+/g) || []).length);
const fimDoBloco = (i: number) => {
  const b = B[i];
  const ult = b.texto.split(" ").slice(-1)[0];
  const fala = b.t[b.t.length - 1] + silabas(ult) * 0.16 + 0.1;
  const prox = i + 1 < B.length ? B[i + 1].t[0] - 0.06 : 99;
  return Math.min(prox, fala + 0.35); // tempo de leitura curto depois da fala, sem invadir o bloco seguinte
};
// posição vertical (centro) por bloco: embaixo, fora do rosto e do celular; em 7,6–9,3 s o celular desce até a base
const Y_PADRAO = 1735;
const Y_BLOCO: Record<number, number> = { 4: 1215 };

export const Estadio: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const i = B.findIndex((b, k) => t >= b.t[0] - 0.04 && t < fimDoBloco(k));
  const b = i >= 0 ? B[i] : null;
  const sai = b ? interpolate(t, [fimDoBloco(i) - 0.12, fimDoBloco(i)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const palavras = b ? b.texto.split(" ") : [];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo src={staticFile("estadio/base.mp4")} />
      {b ? (
        <div style={{ position: "absolute", left: 60, right: 60, top: (Y_BLOCO[i] ?? Y_PADRAO) - 90, height: 180,
          display: "flex", alignItems: "center", justifyContent: "center", opacity: sai }}>
          <div style={{ textAlign: "center", fontFamily: FONTE, fontWeight: 800, fontSize: 66, lineHeight: 1.18,
            color: "#FFFFFF", maxWidth: 940, letterSpacing: 0.5,
            WebkitTextStroke: "9px rgba(0,0,0,0.88)", paintOrder: "stroke fill",
            textShadow: "0 4px 14px rgba(0,0,0,0.55)" }}>
            {palavras.map((w, k) => {
              const tk = b.t[Math.min(k, b.t.length - 1)];
              const a = interpolate(t, [tk - 0.05, tk + 0.05], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const y = interpolate(a, [0, 1], [10, 0]);
              return (
                <span key={k} style={{ display: "inline-block", opacity: a, transform: `translateY(${y}px)`, marginRight: 16 }}>
                  {w}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
