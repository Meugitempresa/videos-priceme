import { AbsoluteFill, interpolate, OffthreadVideo, Series, staticFile, useCurrentFrame } from "remotion";
import edl from "./edl.json";
import { easeInOut, q } from "./tempo";

// Topo da área da apresentadora e deslocamento do take (rosto por volta de y 870–1420)
export const TOPO_APRESENTADORA = 840;
const DESLOCAMENTO = 600;

// Aproximações leves no rosto nas palavras de ênfase: [palavra, ocorrência, quadros de duração]
const ENFASES: [string, number, number][] = [
  ["realmente", 1, 20],
  ["minutos", 1, 22],
  ["centavos", 1, 22],
  ["sempre", 1, 22],
  ["lucro", 2, 26],
];

const zoomNoQuadro = (frame: number) =>
  ENFASES.reduce((z, [palavra, n, dur]) => {
    const ini = q(palavra, n) - 3;
    const v = interpolate(frame, [ini, ini + 8, ini + 8 + dur, ini + 16 + dur], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeInOut,
    });
    return Math.max(z, v);
  }, 0);

export const Apresentadora: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = 1 + 0.06 * zoomNoQuadro(frame);
  return (
    <AbsoluteFill style={{ top: TOPO_APRESENTADORA, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          top: -TOPO_APRESENTADORA,
          transform: `translateY(${DESLOCAMENTO}px) scale(${zoom})`,
          transformOrigin: "540px 560px",
        }}
      >
        <Series>
          {edl.trechos.map((t) => (
            <Series.Sequence key={t.inicio} durationInFrames={t.fim - t.inicio}>
              <OffthreadVideo
                src={staticFile("take.mp4")}
                trimBefore={t.inicio}
                trimAfter={t.fim}
                muted
                style={{ width: 1080, height: 1920 }}
              />
            </Series.Sequence>
          ))}
        </Series>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
