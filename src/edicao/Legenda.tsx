import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fonte, marca } from "../marca";
import palavras from "./palavras.json";
import { entra, FPS } from "./tempo";

type Palavra = (typeof palavras)[number];

// Agrupa 1 a 3 palavras por vez, quebrando em pontuação, pausas e frases longas
const blocos: Palavra[][] = [];
for (const p of palavras) {
  const atual = blocos.at(-1);
  const ultima = atual?.at(-1);
  const letras = (atual ?? []).reduce((n, x) => n + x.texto.length + 1, 0) + p.texto.length;
  const quebra =
    !atual ||
    !ultima ||
    atual.length >= 3 ||
    letras > 17 ||
    /[.,?!]$/.test(ultima.texto) ||
    p.inicio - ultima.fim > 0.25;
  if (quebra) blocos.push([p]);
  else atual.push(p);
}

export const Legenda: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const i = blocos.findIndex((b, k) => {
    // sai quando a fala do bloco termina; só emenda no próximo se ele começar logo em seguida
    const fimFala = b.at(-1)!.fim;
    const proximo = blocos[k + 1]?.[0].inicio ?? Infinity;
    const fim = proximo - fimFala < 0.2 ? proximo - 0.05 : fimFala + 0.1;
    return t >= b[0].inicio - 0.05 && t < fim;
  });
  if (i < 0) return null;
  const bloco = blocos[i];
  const p = entra(frame, Math.round((bloco[0].inicio - 0.05) * FPS), 5);
  return (
    <AbsoluteFill style={{ top: 1415, height: 110, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          gap: 18,
          padding: "14px 28px",
          maxWidth: 860,
          marginRight: 40,
          borderRadius: 18,
          background: "rgba(6, 26, 74, 0.82)",
          border: `2px solid rgba(92, 225, 230, 0.35)`,
          fontFamily: fonte,
          fontWeight: 900,
          fontSize: 58,
          letterSpacing: 1,
          textTransform: "uppercase",
          opacity: p,
          transform: `scale(${0.92 + 0.08 * p})`,
        }}
      >
        {bloco.map((w) => {
          const ativa = t >= w.inicio - 0.03;
          // a marca e o endereço mantêm a grafia oficial (PriceMe, priceme.com.br)
          const marcaRegistrada = /priceme/i.test(w.texto);
          return (
            <span
              key={w.inicio}
              style={{
                color: ativa ? marca.ciano : marca.branco,
                textTransform: marcaRegistrada ? "none" : undefined,
              }}
            >
              {w.texto.replace(/[.,]$/, "")}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
