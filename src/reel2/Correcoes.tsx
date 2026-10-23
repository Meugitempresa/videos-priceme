import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { fonte, marca } from "../marca";
import { CARTAO_DO_PLANO_SAI, easeOut, INICIO_TELA_FINAL, q } from "./tempo";

// Azul de fundo da tela final do vídeo original (medido nos quadros)
export const AZUL_DO_FINAL = "#0E36A1";

// 42,8–47,0 s: o original traz uma legenda gravada que não corresponde à fala e fica na área da
// interface do Instagram. Uma faixa no azul da tela final sobe por baixo e a cobre, preparando a transição.
export const FaixaFinal: React.FC = () => {
  const frame = useCurrentFrame();
  const de = q("Quem", 2) + 6; // a legenda gravada entra em 42,77 s
  const p = interpolate(frame, [de - 8, de], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
  if (p <= 0 || frame >= INICIO_TELA_FINAL) return null;
  return (
    <AbsoluteFill
      style={{
        top: 1440 + (1 - p) * 480,
        background: `linear-gradient(180deg, rgba(14,54,161,0) 0px, ${AZUL_DO_FINAL} 48px, ${AZUL_DO_FINAL} 100%)`,
      }}
    />
  );
};

// Tela final: corrige só o bloco de texto (grafia "iOS", concordância e a frase final, que ficava
// alinhada à esquerda dentro da área da interface). Logo, busca e "Vem pra PriceMe!" seguem originais.
const LINHAS = ["Acesse o site pelo", "Google e depois", "instale o PWA no", "iOS ou no Android!"];
const FRASE = ["Cada", "centavo", "de", "lucro", "começa", "com", "uma", "decisão."];

export const TextoFinal: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < CARTAO_DO_PLANO_SAI) return null;
  const vis = interpolate(frame, [CARTAO_DO_PLANO_SAI, CARTAO_DO_PLANO_SAI + 10, 1620, 1634], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 830, height: 930, background: AZUL_DO_FINAL }} />
      <div
        style={{
          position: "absolute", left: 90, right: 90, top: 965, textAlign: "center", fontFamily: fonte,
          fontWeight: 800, fontSize: 58, lineHeight: 1.45, color: marca.branco, opacity: vis,
        }}
      >
        {LINHAS.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
      <div
        style={{
          position: "absolute", left: 130, right: 130, top: 1350, textAlign: "center", fontFamily: fonte,
          fontWeight: 700, fontSize: 44, lineHeight: 1.25, color: marca.branco, opacity: vis,
        }}
      >
        {FRASE.map((w, i) => {
          // palavra a palavra, como no original (51,0–52,3 s)
          const e = interpolate(frame, [1530 + i * 5, 1536 + i * 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <span key={w} style={{ opacity: e, color: w === "lucro" ? marca.ciano : marca.branco }}>
              {w}{" "}
            </span>
          );
        })}
      </div>
    </>
  );
};
