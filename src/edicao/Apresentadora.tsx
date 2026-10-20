import { AbsoluteFill, Freeze, interpolate, OffthreadVideo, Series, staticFile, useCurrentFrame } from "remotion";
import edl from "./edl.json";
import { easeInOut, q } from "./tempo";

// Topo da área da apresentadora e deslocamento do take (rosto por volta de y 870–1420)
export const TOPO_APRESENTADORA = 840;
const DESLOCAMENTO = 600;
// Take ampliado para 2160×3840 (lanczos, sem nitidez extra) para o render em 4K
const TAKE = staticFile("take-4k.mp4");

// Aproximações leves no rosto em palavras de ênfase: [palavra, ocorrência, quadros de duração]
const ENFASES: [string, number, number][] = [
  ["realmente", 1, 20],
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
  const zoom = 1 + 0.05 * zoomNoQuadro(frame);
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
          {edl.itens.map((item, i) => {
            if (item.tipo === "pausa") {
              // pausa inserida: imagem parada no último quadro (fica sob a tela cheia)
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
                <OffthreadVideo
                  src={TAKE}
                  trimBefore={item.inicio}
                  trimAfter={item.fim}
                  muted
                  style={{ width: 1080, height: 1920 }}
                />
              </Series.Sequence>
            );
          })}
        </Series>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
