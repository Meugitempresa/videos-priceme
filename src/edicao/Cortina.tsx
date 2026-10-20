import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { marca } from "../marca";
import { TOPO_APRESENTADORA } from "./Apresentadora";
import { easeInOut, EMENDAS } from "./tempo";

// Cobre os saltos de imagem do take: o painel de cima desce sobre a apresentadora
// durante a pausa da emenda e sobe revelando o trecho seguinte.
const SALTOS = [...EMENDAS];

export const Cortina: React.FC = () => {
  const frame = useCurrentFrame();
  const cobertura = SALTOS.reduce((c, j) => {
    const v = interpolate(frame, [j - 7, j - 2, j + 2, j + 8], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeInOut,
    });
    return Math.max(c, v);
  }, 0);
  if (cobertura <= 0) return null;
  const altura = (1920 - TOPO_APRESENTADORA) * cobertura;
  return (
    <AbsoluteFill style={{ top: TOPO_APRESENTADORA, height: altura, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          height: 1920 - TOPO_APRESENTADORA,
          background: `linear-gradient(180deg, ${marca.azulEscuro}, ${marca.azulNoite})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 8,
          background: marca.ciano,
          boxShadow: `0 0 40px 8px ${marca.ciano}`,
        }}
      />
    </AbsoluteFill>
  );
};
