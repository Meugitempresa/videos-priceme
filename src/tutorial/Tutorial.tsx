import { AbsoluteFill, Audio, Freeze, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import "../fontes";
import legendasParte1 from "./legendas.json";
import { quadroDaTela as quadroParte1 } from "./sincronia";

export const DURACAO_TUTORIAL = 3586; // duração da gravação da Julia (119,53 s), sem cortes
const COR = { azul: "#2A4C92", azulEscuro: "#17305F", rosa: "#E8487F", branco: "#FFFFFF" };
const FONTE = "Montserrat, sans-serif";

type Legenda = { inicio: number; fim: number; texto: string; destaque: string | null };
// Tudo o que muda de uma parte do tutorial para outra; o layout é o mesmo
export type ConfigTutorial = {
  pasta: string; // em public/: julia.mp4, tela.mp4, voz.wav
  legendas: Legenda[];
  quadroDaTela: (f: number) => { quadro: number; inicioTrecho: number };
  rotulo?: string; // complemento da etiqueta "TUTORIAL · pHarmaOnline"
  ultimoQuadroJulia?: number; // a partir daí a janela mostra o último quadro (encerramento)
  entrada?: number; // quadros de entrada suave a partir do azul da marca (0 = corte seco)
  saida?: [number, number]; // quadros [início, fim] do esmaecimento final para o azul da marca
};

// Gravação de tela: elemento principal, inteira e proporcional (78 %), sem nada por cima
const ESC = 0.78, TW = 1080 * ESC, TH = 1920 * ESC, TX = (1080 - TW) / 2, TY = 16;
const QuadroTela: React.FC<{ src: string; q: number; opacidade?: number }> = ({ src, q, opacidade = 1 }) => (
  <AbsoluteFill style={{ opacity: opacidade }}>
    <Freeze frame={q}>
      <OffthreadVideo src={src} muted style={{ width: 1080, height: 1920, transform: `scale(${ESC})`, transformOrigin: "0 0" }} />
    </Freeze>
  </AbsoluteFill>
);

const Tela: React.FC<{ c: ConfigTutorial }> = ({ c }) => {
  const f = useCurrentFrame();
  const src = staticFile(`${c.pasta}/tela.mp4`);
  const { quadro, inicioTrecho } = c.quadroDaTela(f);
  const k = f - inicioTrecho;
  const anterior = inicioTrecho > 0 && k < 6 ? c.quadroDaTela(inicioTrecho - 1).quadro : null;
  return (
    <div style={{ position: "absolute", left: TX, top: TY, width: TW, height: TH, borderRadius: 24, overflow: "hidden",
      boxShadow: "0 14px 40px rgba(0,0,0,0.35)", background: "#fff" }}>
      {anterior !== null ? <QuadroTela src={src} q={anterior} /> : null}
      <QuadroTela src={src} q={quadro} opacidade={anterior !== null ? interpolate(k, [0, 6], [0, 1]) : 1} />
    </div>
  );
};

// Julia: janela de apresentadora (rosto e ombros), proporção preservada, na faixa inferior
const JX = 24, JY = TY + TH + 12, JW = 291, JH = 1920 - JY - 16;
const CROP = { x: 140, y: 110, w: 800 }; // área do quadro original mostrada na janela
const Julia: React.FC<{ c: ConfigTutorial }> = ({ c }) => {
  const f = useCurrentFrame();
  const s = JW / CROP.w;
  const nome = interpolate(f, [8, 20, 230, 250], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const video = (
    <OffthreadVideo src={staticFile(`${c.pasta}/julia.mp4`)} muted
      style={{ position: "absolute", width: 1080, height: 1920, transformOrigin: "0 0",
        transform: `translate(${-CROP.x * s}px, ${-CROP.y * s}px) scale(${s})` }} />
  );
  const parada = c.ultimoQuadroJulia !== undefined && f > c.ultimoQuadroJulia;
  return (
    <>
      <div style={{ position: "absolute", left: JX, top: JY, width: JW, height: JH, borderRadius: 22, overflow: "hidden",
        border: "3px solid rgba(255,255,255,0.92)", boxShadow: "0 12px 32px rgba(0,0,0,0.35)", background: "#000" }}>
        {parada ? <Freeze frame={c.ultimoQuadroJulia!}>{video}</Freeze> : video}
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
const Legendas: React.FC<{ c: ConfigTutorial }> = ({ c }) => {
  const f = useCurrentFrame();
  const t = f / 30;
  const b = c.legendas.find((l) => t >= l.inicio && t < l.fim);
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
        {c.rotulo ? <> · <span style={{ color: COR.rosa }}>{c.rotulo}</span></> : null}
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

// Entrada e saída suaves a partir do azul da marca (começo e encerramento próprios)
const Cortina: React.FC<{ c: ConfigTutorial }> = ({ c }) => {
  const f = useCurrentFrame();
  const ent = c.entrada ? interpolate(f, [0, c.entrada], [1, 0], { extrapolateRight: "clamp" }) : 0;
  const sai = c.saida ? interpolate(f, c.saida, [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const v = Math.max(ent, sai);
  if (v <= 0) return null;
  return <AbsoluteFill style={{ background: `linear-gradient(180deg, ${COR.azul} 0%, ${COR.azulEscuro} 100%)`, opacity: v }} />;
};

export const TutorialLayout: React.FC<{ c: ConfigTutorial }> = ({ c }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, ${COR.azul} 0%, ${COR.azulEscuro} 100%)` }}>
    <Tela c={c} />
    <Julia c={c} />
    <Legendas c={c} />
    <Cortina c={c} />
    <Audio src={staticFile(`${c.pasta}/voz.wav`)} />
  </AbsoluteFill>
);

// Parte 1 (mesma configuração de antes)
export const Tutorial: React.FC = () => (
  <TutorialLayout c={{ pasta: "tutorial", legendas: legendasParte1, quadroDaTela: quadroParte1 }} />
);
