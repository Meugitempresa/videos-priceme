import { AbsoluteFill, Audio, Freeze, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import "../fontes";
import legendas from "./legendas.json";
import { quadroDaTela } from "./sincronia";

export const DURACAO_TUTORIAL = 3586; // duração da gravação da Julia (119,53 s), sem cortes
const COR = { azul: "#2A4C92", azulEscuro: "#17305F", rosa: "#E8487F", branco: "#FFFFFF" };
const FONTE = "Montserrat, sans-serif";

// Gravação de tela: elemento principal, inteira e proporcional (78 %), sem nada por cima
const ESC = 0.78, TW = 1080 * ESC, TH = 1920 * ESC, TX = (1080 - TW) / 2, TY = 16;
const TELA = staticFile("tutorial/tela.mp4");
const QuadroTela: React.FC<{ q: number; opacidade?: number }> = ({ q, opacidade = 1 }) => (
  <AbsoluteFill style={{ opacity: opacidade }}>
    <Freeze frame={q}>
      <OffthreadVideo src={TELA} muted style={{ width: 1080, height: 1920, transform: `scale(${ESC})`, transformOrigin: "0 0" }} />
    </Freeze>
  </AbsoluteFill>
);

const Tela: React.FC = () => {
  const f = useCurrentFrame();
  const { quadro, inicioTrecho } = quadroDaTela(f);
  const k = f - inicioTrecho;
  const anterior = inicioTrecho > 0 && k < 6 ? quadroDaTela(inicioTrecho - 1).quadro : null;
  return (
    <div style={{ position: "absolute", left: TX, top: TY, width: TW, height: TH, borderRadius: 24, overflow: "hidden",
      boxShadow: "0 14px 40px rgba(0,0,0,0.35)", background: "#fff" }}>
      {anterior !== null ? <QuadroTela q={anterior} /> : null}
      <QuadroTela q={quadro} opacidade={anterior !== null ? interpolate(k, [0, 6], [0, 1]) : 1} />
    </div>
  );
};

// Julia: janela de apresentadora (rosto e ombros), proporção preservada, na faixa inferior
const JX = 24, JY = TY + TH + 12, JW = 291, JH = 1920 - JY - 16;
const CROP = { x: 140, y: 110, w: 800 }; // área do quadro original mostrada na janela
const Julia: React.FC = () => {
  const f = useCurrentFrame();
  const s = JW / CROP.w;
  const nome = interpolate(f, [8, 20, 230, 250], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <div style={{ position: "absolute", left: JX, top: JY, width: JW, height: JH, borderRadius: 22, overflow: "hidden",
        border: "3px solid rgba(255,255,255,0.92)", boxShadow: "0 12px 32px rgba(0,0,0,0.35)", background: "#000" }}>
        <OffthreadVideo src={staticFile("tutorial/julia.mp4")} muted
          style={{ position: "absolute", width: 1080, height: 1920, transformOrigin: "0 0",
            transform: `translate(${-CROP.x * s}px, ${-CROP.y * s}px) scale(${s})` }} />
      </div>
      {nome > 0 ? (
        <div style={{ position: "absolute", left: JX + 14, top: JY + JH - 58, padding: "6px 16px", borderRadius: 999,
          background: COR.rosa, color: COR.branco, fontFamily: FONTE, fontWeight: 800, fontSize: 26, letterSpacing: 3,
          opacity: nome, boxShadow: "0 6px 16px rgba(0,0,0,0.3)" }}>
          JULIA
        </div>
      ) : null}
    </>
  );
};

// Legendas na faixa inferior, à direita da Julia (não cobrem a interface nem o rosto)
const LX = JX + JW + 22, LW = 1080 - LX - 24;
const Legenda: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const b = legendas.find((l) => t >= l.inicio && t < l.fim);
  const partes: { texto: string; rosa: boolean }[] = [];
  if (b) {
    const i = b.destaque ? b.texto.toLowerCase().indexOf(b.destaque.toLowerCase()) : -1;
    if (i >= 0 && b.destaque) {
      partes.push({ texto: b.texto.slice(0, i), rosa: false });
      partes.push({ texto: b.texto.slice(i, i + b.destaque.length), rosa: true });
      partes.push({ texto: b.texto.slice(i + b.destaque.length), rosa: false });
    } else partes.push({ texto: b.texto, rosa: false });
  }
  const p = b ? interpolate(t, [b.inicio, b.inicio + 0.12], [0, 1], { extrapolateRight: "clamp" }) : 0;
  return (
    <div style={{ position: "absolute", left: LX, top: JY, width: LW, height: JH, display: "flex", flexDirection: "column",
      justifyContent: "center", gap: 14 }}>
      <div style={{ fontFamily: FONTE, fontWeight: 700, fontSize: 22, letterSpacing: 2, color: "rgba(255,255,255,0.75)" }}>
        TUTORIAL · <span style={{ color: COR.branco }}>pHarmaOnline</span>
      </div>
      <div style={{ minHeight: 150, padding: "18px 22px", borderRadius: 20, background: "rgba(10, 22, 52, 0.55)",
        fontFamily: FONTE, fontWeight: 700, fontSize: 40, lineHeight: 1.24, color: COR.branco,
        textShadow: "0 2px 6px rgba(0,0,0,0.35)", opacity: b ? p : 0 }}>
        {partes.map((x, i) => (
          <span key={i} style={{ color: x.rosa ? COR.rosa : COR.branco }}>{x.texto}</span>
        ))}
      </div>
    </div>
  );
};

export const Tutorial: React.FC = () => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, ${COR.azul} 0%, ${COR.azulEscuro} 100%)` }}>
    <Tela />
    <Julia />
    <Legenda />
    <Audio src={staticFile("tutorial/voz.wav")} />
  </AbsoluteFill>
);
