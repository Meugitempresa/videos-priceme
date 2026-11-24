import { AbsoluteFill, Audio, Freeze, interpolate, Easing, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import "../fontes";
import { marca } from "../marca";
import { Logo } from "../edicao/Logo";
import { LEGENDAS } from "./legendas";
import { DESFOQUES, DESTAQUES, DURACAO_INSTALACAO, FIM_NARRACAO, Fonte, quadroDaTela } from "./roteiro";

export { DURACAO_INSTALACAO };
const FONTE = "Montserrat, sans-serif";
const VIDEO: Record<Fonte, string> = { chrome: "instalacao/gravacao-chrome.mp4", app: "instalacao/gravacao-app.mp4" };

// Tela do celular: barra de status (0–64 px: hora, bateria, gravação) recortada; o resto inteiro, proporcional
const CORTE = 64, S = 1.25, W = 576 * S, H = (1280 - CORTE) * S, PX = (1080 - W) / 2, PY = 44;
const px = (x: number) => x * S;
const py = (y: number) => (y - CORTE) * S;
const suave = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });

const Quadro: React.FC<{ fonte: Fonte; q: number; t: number; opacidade?: number }> = ({ fonte, q, t, opacidade = 1 }) => {
  const src = staticFile(VIDEO[fonte]);
  const tela = q / 30;
  const video = (extra?: React.CSSProperties) => (
    <Freeze frame={q}>
      <OffthreadVideo src={src} muted style={{ position: "absolute", left: 0, top: -CORTE * S, width: 576 * S, height: 1280 * S, ...extra }} />
    </Freeze>
  );
  return (
    <AbsoluteFill style={{ opacity: opacidade }}>
      {video()}
      {DESFOQUES.filter((d) => d.fonte === fonte && tela >= d.de && tela < d.ate).map((d, i) => (
        <div key={i} style={{ position: "absolute", left: px(d.x), top: py(d.y), width: px(d.w), height: d.h * S, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: -px(d.x), top: -py(d.y), width: W, height: H }}>
            {video({ filter: "blur(22px) brightness(0.9)" })}
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

const Destaques: React.FC<{ t: number }> = ({ t }) => (
  <>
    {DESTAQUES.filter((d) => t >= d.de - 0.3 && t < d.ate + 0.3).map((d, i) => {
      const a = suave(t, d.de - 0.2, d.de + 0.1) * (1 - suave(t, d.ate - 0.1, d.ate + 0.2));
      const pulso = 1 + 0.04 * Math.sin((t - d.de) * 7);
      const cx = px(d.x), cy = py(d.y), w = px(d.w), h = d.h * S, m = d.margem ?? 8;
      const k = d.toque !== undefined ? (t - d.toque) / 0.5 : -1;
      return (
        <div key={i}>
          <div style={{ position: "absolute", left: cx - w / 2 - m, top: cy - h / 2 - m, width: w + 2 * m, height: h + 2 * m,
            borderRadius: (d.raio ?? 16) + m, border: `5px solid ${marca.ciano}`, opacity: a,
            boxShadow: `0 0 0 4px rgba(6,26,74,0.35), 0 0 26px ${marca.ciano}`, transform: `scale(${pulso})` }} />
          {d.seta ? <Seta lado={d.seta} x={cx} y={cy} w={w} h={h} a={a} t={t} /> : null}
          {k >= 0 && k <= 1 ? (
            <>
              <div style={{ position: "absolute", left: cx - 34, top: cy - 34, width: 68, height: 68, borderRadius: 99,
                background: "rgba(255,255,255,0.75)", opacity: 1 - k, transform: `scale(${0.6 + 0.3 * k})` }} />
              <div style={{ position: "absolute", left: cx - 50, top: cy - 50, width: 100, height: 100, borderRadius: 99,
                border: `6px solid ${marca.ciano}`, opacity: 1 - k, transform: `scale(${0.5 + 1.3 * k})` }} />
            </>
          ) : null}
        </div>
      );
    })}
  </>
);

// Seta discreta apontando para o alvo, com leve vaivém
const Seta: React.FC<{ lado: "cima" | "baixo" | "esquerda"; x: number; y: number; w: number; h: number; a: number; t: number }> = (
  { lado, x, y, w, h, a, t }) => {
  const v = 10 * Math.sin(t * 8);
  const rot = { cima: 0, baixo: 180, esquerda: -90 }[lado];
  // posição: abaixo do alvo (seta para cima), acima (para baixo) ou à esquerda (aponta para a direita)
  const pos = lado === "cima" ? { left: x - 28, top: y + h / 2 + 22 + v }
    : lado === "baixo" ? { left: x - 28, top: y - h / 2 - 90 - v }
    : { left: x - w / 2 - 100 - v, top: y - 28 };
  return (
    <svg width={56} height={64} viewBox="0 0 56 64" style={{ position: "absolute", ...pos, opacity: a,
      transform: `rotate(${lado === "esquerda" ? 90 : rot}deg)`, filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.5))" }}>
      <path d="M28 2 L54 32 L38 32 L38 62 L18 62 L18 32 L2 32 Z" fill={marca.ciano} stroke="#fff" strokeWidth={3} strokeLinejoin="round" />
    </svg>
  );
};

// Zoom suave no alvo enquanto ele está destacado (a origem no alvo o mantém sempre visível)
const zoomEm = (t: number) => {
  for (const d of DESTAQUES) {
    if (!d.zoom || d.zoom === 1) continue;
    const z = suave(t, d.de - 0.35, d.de + 0.25) * (1 - suave(t, d.ate - 0.1, d.ate + 0.4));
    if (z > 0) return { z: 1 + (d.zoom - 1) * z, ox: px(d.x), oy: py(d.y) };
  }
  return { z: 1, ox: W / 2, oy: H / 2 };
};

const Celular: React.FC<{ t: number }> = ({ t }) => {
  const atual = quadroDaTela(t);
  const k = t - atual.inicio;
  // troca de gravação (do Chrome para a tela inicial): dissolve curto
  const anterior = atual.i > 0 && k < 0.2 && quadroDaTela(atual.inicio - 0.001).fonte !== atual.fonte
    ? quadroDaTela(atual.inicio - 0.001) : null;
  const { z, ox, oy } = zoomEm(t);
  return (
    <div style={{ position: "absolute", left: PX - 10, top: PY - 10, width: W + 20, height: H + 20, borderRadius: 52,
      background: "#05112E", boxShadow: "0 24px 60px rgba(0,0,0,0.45), inset 0 0 0 2px rgba(255,255,255,0.18)" }}>
      <div style={{ position: "absolute", left: 10, top: 10, width: W, height: H, borderRadius: 42, overflow: "hidden", background: "#000" }}>
        <div style={{ position: "absolute", width: W, height: H, transform: `scale(${z})`, transformOrigin: `${ox}px ${oy}px` }}>
          {anterior ? <Quadro fonte={anterior.fonte} q={anterior.quadro} t={t} /> : null}
          <Quadro fonte={atual.fonte} q={atual.quadro} t={t} opacidade={anterior ? interpolate(k, [0, 0.2], [0, 1]) : 1} />
          <Destaques t={t} />
        </div>
      </div>
    </div>
  );
};

const Legenda: React.FC<{ t: number }> = ({ t }) => {
  const b = LEGENDAS.find((l) => t >= l.inicio && t < l.fim);
  if (!b) return null;
  const a = suave(t, b.inicio, b.inicio + 0.15) * (1 - suave(t, b.fim - 0.1, b.fim));
  const y = interpolate(a, [0, 1], [12, 0]);
  const partes = b.texto.split(/(\[[^\]]+\])/).filter(Boolean);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: PY + H + 34, height: 1920 - (PY + H + 34) - 40,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ opacity: a, transform: `translateY(${y}px)`, padding: "20px 30px", borderRadius: 26,
        background: "rgba(6,26,74,0.82)", border: "2px solid rgba(92,225,230,0.35)", textAlign: "center",
        fontFamily: FONTE, fontWeight: 800, fontSize: 50, lineHeight: 1.22, color: marca.branco, maxWidth: 1000 }}>
        {partes.map((p, i) => p.startsWith("[")
          ? <span key={i} style={{ color: marca.ciano }}>{p.slice(1, -1)}</span>
          : <span key={i}>{p}</span>)}
      </div>
    </div>
  );
};

const Encerramento: React.FC<{ t: number }> = ({ t }) => {
  const a = suave(t, FIM_NARRACAO - 0.2, FIM_NARRACAO + 0.35);
  if (a <= 0) return null;
  const s = interpolate(a, [0, 1], [0.94, 1]);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${marca.azul} 0%, ${marca.azulEscuro} 100%)`, opacity: a,
      alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: 640, height: 640 * 0.53, transform: `scale(${s})` }}>
        <Logo largura={640} semSombra />
      </div>
      <div style={{ marginTop: 46, fontFamily: FONTE, fontWeight: 800, fontSize: 58, color: marca.branco, letterSpacing: 1 }}>
        priceme.com.br
      </div>
    </AbsoluteFill>
  );
};

export const Instalacao: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const entrada = interpolate(f, [0, 6], [1, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${marca.azul} 0%, ${marca.azulNoite} 100%)` }}>
      <Celular t={t} />
      <Legenda t={t} />
      <Encerramento t={t} />
      <AbsoluteFill style={{ background: marca.azul, opacity: entrada }} />
      {/* narração mono: o Remotion a espalha nos 2 canais a −3 dB; o ganho √2 devolve o nível original */}
      <Audio src={staticFile("instalacao/narracao.mp3")} volume={Math.SQRT2} />
    </AbsoluteFill>
  );
};
