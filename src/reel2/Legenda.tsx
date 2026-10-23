import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fonte, marca } from "../marca";
import legendas from "./legendas.json";
import { entra, FPS, INICIO_TELA_FINAL } from "./tempo";

// Palavras de valor comercial ganham ciano quando faladas
const DESTAQUE = /^(pricemes?|lucro|esforço|cálculo|reverso|centavos|minutos|resposta|empresa)$/i;
const limpa = (s: string) => s.replace(/[.,?!…]/g, "");

export const Legenda: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const b = legendas.find((l) => t >= l.inicio && t < l.fim && frame < INICIO_TELA_FINAL);
  if (!b) return null;
  const p = entra(frame, Math.round(b.inicio * FPS), 5);
  return (
    <AbsoluteFill style={{ top: 1300, height: 190, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          maxWidth: 840,
          marginRight: 40,
          padding: "14px 28px",
          borderRadius: 20,
          background: "rgba(6, 26, 74, 0.8)",
          fontFamily: fonte,
          fontWeight: 700,
          fontSize: 50,
          lineHeight: 1.22,
          textAlign: "center",
          color: marca.branco,
          opacity: p,
          transform: `translateY(${(1 - p) * 10}px)`,
        }}
      >
        {b.palavras.map((w, k) => {
          const falada = t >= w.t - 0.03;
          const cor = !falada ? "rgba(255,255,255,0.5)" : DESTAQUE.test(limpa(w.texto)) ? marca.ciano : marca.branco;
          return (
            <span key={w.t} style={{ color: cor }}>
              {w.texto}
              {k < b.palavras.length - 1 ? " " : ""}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
