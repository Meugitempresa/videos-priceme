import { AbsoluteFill, Freeze, OffthreadVideo, Series, staticFile, useCurrentFrame } from "remotion";
import edl from "../edicao/edl.json";
import { marca } from "../marca";
import { cobertura, enquadramento, janela } from "./tempos";

const TAKE = staticFile("take.mp4");
// Em tela cheia o take desce 180 px: a cabeça fica abaixo da área de título e da interface do Instagram
const DESCIDA = 180;
const ROSTO = { x: 540, y: 545 }; // centro do rosto no take original

// O take editado (mesma montagem de quadros do áudio tratado), sem som
const Take: React.FC = () => (
  <Series>
    {edl.itens.map((item, i) => {
      if (item.tipo === "pausa") {
        const anterior = edl.itens[i - 1];
        const ultimo = anterior.tipo === "trecho" ? (anterior.fim ?? 1) - 1 : 0;
        return (
          <Series.Sequence key={`p${i}`} durationInFrames={item.quadros ?? 1}>
            <Freeze frame={0}>
              <OffthreadVideo src={TAKE} trimBefore={ultimo} muted style={{ width: 1080, height: 1920 }} />
            </Freeze>
          </Series.Sequence>
        );
      }
      return (
        <Series.Sequence key={item.inicio} durationInFrames={(item.fim ?? 0) - (item.inicio ?? 0)}>
          <OffthreadVideo src={TAKE} trimBefore={item.inicio} trimAfter={item.fim} muted style={{ width: 1080, height: 1920 }} />
        </Series.Sequence>
      );
    })}
  </Series>
);

// Apresentadora em tela cheia (fica por baixo das demonstrações)
export const ProtagonistaCheia: React.FC = () => {
  const frame = useCurrentFrame();
  if (cobertura(frame) >= 1) return null;
  const z = enquadramento(frame);
  return (
    <AbsoluteFill style={{ background: marca.azulNoite }}>
      <AbsoluteFill
        style={{
          transform: `translateY(${DESCIDA}px) scale(${z})`,
          transformOrigin: `${ROSTO.x}px ${ROSTO.y}px`,
        }}
      >
        <Take />
      </AbsoluteFill>
      {/* faixa superior: o topo do take se funde ao azul da marca, onde entram os títulos */}
      <AbsoluteFill
        style={{
          height: 620,
          background: `linear-gradient(180deg, ${marca.azulNoite} 0%, ${marca.azulNoite} 26%, rgba(6,26,74,0.55) 62%, rgba(6,26,74,0) 100%)`,
        }}
      />
      {/* base mais escura para a legenda ficar legível sobre o figurino claro */}
      <AbsoluteFill
        style={{
          top: 1200,
          background: "linear-gradient(180deg, rgba(6,26,74,0) 0%, rgba(6,26,74,0.55) 55%, rgba(6,26,74,0.7) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// Janelas: nas demonstrações (canto superior direito) e no encerramento (centro)
const RETANGULOS = {
  demo: { x: 640, y: 150, w: 300, h: 384, r: 28 },
  final: { x: 400, y: 1060, w: 280, h: 280, r: 140 },
};

export const ProtagonistaJanela: React.FC = () => {
  const frame = useCurrentFrame();
  const { v, onde } = janela(frame);
  if (v <= 0) return null;
  const R = RETANGULOS[onde];
  const s = R.w / 540; // mostra uma área de 540 px de largura em volta do rosto
  return (
    <div
      style={{
        position: "absolute",
        left: R.x,
        top: R.y,
        width: R.w,
        height: R.h,
        borderRadius: R.r,
        overflow: "hidden",
        opacity: v,
        transform: `scale(${0.92 + 0.08 * v})`,
        border: `4px solid ${marca.branco}`,
        boxShadow: "0 14px 40px rgba(6,26,74,0.35)",
        background: marca.azulNoite,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 1080,
          height: 1920,
          transformOrigin: "0 0",
          transform: `translate(${R.w / 2 - ROSTO.x * s}px, ${R.h / 2 - (ROSTO.y + 40) * s}px) scale(${s})`,
        }}
      >
        <Take />
      </div>
    </div>
  );
};
