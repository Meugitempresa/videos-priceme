import { AbsoluteFill, useCurrentFrame } from "remotion";
import palavras from "../edicao/palavras.json";
import { entra, FPS } from "../edicao/tempo";
import { fonte, marca } from "../marca";
import { SEM_LEGENDA } from "./tempos";

type P = (typeof palavras)[number];

// Blocos definidos pelos pontos naturais da fala (no máximo duas linhas cada).
// Cada item é a palavra (e a ocorrência) que abre um novo bloco.
const ABRE: [string, number][] = [
  ["vê", 1], ["mas", 1], ["A", 1], ["Na", 1], ["de", 2], ["e", 2], ["dos", 1], ["Com", 1], ["até", 1],
  ["e", 4], ["verdadeiramente", 1], ["Ou", 1], ["Enfim", 1], ["não", 1], ["Acesse", 1], ["e", 5],
];
const limpa = (s: string) => s.toLowerCase().replace(/[,?!]/g, "").replace(/\.$/, "");
const inicios = new Set(
  ABRE.map(([w, n]) => palavras.findIndex((p, i) => limpa(p.texto) === limpa(w) &&
    palavras.slice(0, i + 1).filter((x) => limpa(x.texto) === limpa(w)).length === n)),
);
const blocos: P[][] = [];
palavras.forEach((p, i) => {
  if (i === 0 || inicios.has(i)) blocos.push([]);
  blocos.at(-1)!.push(p);
});

export const Legenda: React.FC = () => {
  const frame = useCurrentFrame();
  if (SEM_LEGENDA.some(([a, b]) => frame >= a && frame < b)) return null;
  const t = frame / FPS;
  const i = blocos.findIndex((b, k) => {
    const fim = b.at(-1)!.fim;
    const prox = blocos[k + 1]?.[0].inicio ?? Infinity;
    return t >= b[0].inicio - 0.05 && t < (prox - fim < 0.25 ? prox - 0.05 : fim + 0.15);
  });
  if (i < 0) return null;
  const b = blocos[i];
  const p = entra(frame, Math.round((b[0].inicio - 0.05) * FPS), 6);
  return (
    <AbsoluteFill style={{ top: 1310, height: 200, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          maxWidth: 820,
          marginRight: 40,
          padding: "14px 26px",
          borderRadius: 20,
          background: "rgba(6, 26, 74, 0.78)",
          fontFamily: fonte,
          fontWeight: 700,
          fontSize: 50,
          lineHeight: 1.22,
          textAlign: "center",
          color: marca.branco,
          opacity: p,
          transform: `translateY(${(1 - p) * 12}px)`,
        }}
      >
        {b.map((w, k) => (
          <span key={w.inicio} style={{ color: t >= w.inicio - 0.03 ? marca.branco : "rgba(255,255,255,0.55)" }}>
            {w.texto}
            {k < b.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
