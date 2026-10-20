import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { fonte, marca } from "../marca";
import { TOPO_APRESENTADORA } from "./Apresentadora";

// Fundo da parte de cima: azul da marca com grade discreta e leve movimento contínuo
// Em tela cheia (cheia = 1) o painel cobre a apresentadora e o conteúdo desce para o centro,
// sem ampliar (mantém as margens laterais de 90 px).
export const Painel: React.FC<{ children: React.ReactNode; cheia: number }> = ({ children, cheia }) => {
  const frame = useCurrentFrame();
  const deriva = interpolate(frame, [0, 1300], [0, -90]);
  const altura = TOPO_APRESENTADORA + (1920 - TOPO_APRESENTADORA) * cheia;
  return (
    <AbsoluteFill style={{ height: altura, overflow: "hidden" }}>
      <AbsoluteFill
        style={{ background: `linear-gradient(180deg, ${marca.azul} 0%, ${marca.azulEscuro} 70%, ${marca.azulNoite} 100%)` }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(92,225,230,0.09) 2px, transparent 2px), linear-gradient(90deg, rgba(92,225,230,0.09) 2px, transparent 2px)",
          backgroundSize: "90px 90px",
          backgroundPosition: `${deriva}px ${deriva / 2}px`,
        }}
      />
      <AbsoluteFill
        style={{
          height: TOPO_APRESENTADORA,
          transform: `translateY(${280 * cheia}px)`,
          transformOrigin: "540px 0px",
        }}
      >
        {children}
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 6,
          background: marca.ciano,
          boxShadow: `0 0 30px 4px rgba(92,225,230,0.6)`,
        }}
      />
    </AbsoluteFill>
  );
};

// Aviso nas cenas que mostram interfaces e valores apenas ilustrativos
export const Ilustracao: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 600,
      left: 90,
      fontFamily: fonte,
      fontWeight: 700,
      fontSize: 22,
      letterSpacing: 3,
      color: "rgba(255,255,255,0.7)",
    }}
  >
    ILUSTRAÇÃO
  </div>
);

// Cartão de vidro usado nas cenas
export const Cartao: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({
  style,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      borderRadius: 28,
      background: "rgba(6, 26, 74, 0.72)",
      border: "2px solid rgba(255,255,255,0.16)",
      boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
      fontFamily: fonte,
      color: marca.branco,
      ...style,
    }}
  >
    {children}
  </div>
);
