import { Scale } from "lucide-react";
import { useCurrentFrame } from "remotion";
import { marca } from "../../marca";
import { Cartao, Ilustracao } from "../Painel";
import { chegada, entra, q } from "../tempo";

// "Ou seja, você trabalha no positivo sempre."
// Elemento neutro de análise: receitas, despesas e resultado lado a lado, sem valores nem tendência.
const LINHAS: { rotulo: string; palavra: [string, number] }[] = [
  { rotulo: "RECEITAS", palavra: ["Ou", 1] },
  { rotulo: "DESPESAS", palavra: ["trabalha", 2] },
  { rotulo: "RESULTADO", palavra: ["positivo", 1] },
];

export const Cena8Analise: React.FC = () => {
  const frame = useCurrentFrame();
  const p = entra(frame, q("Ou") - 4, 12);
  const foco = entra(frame, q("sempre") - 4, 12);
  return (
    <>
      <Cartao style={{ left: 140, top: 200, width: 760, height: 380, padding: "28px 40px", ...chegada(p) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 18 }}>
          <Scale size={56} color={marca.ciano} strokeWidth={2} />
          <span style={{ fontWeight: 900, fontSize: 36, letterSpacing: 3 }}>ANÁLISE DE RESULTADOS</span>
        </div>
        {LINHAS.map(({ rotulo, palavra }) => {
          const e = entra(frame, q(palavra[0], palavra[1]) - 4, 12);
          const destaque = rotulo === "RESULTADO" ? foco : 0;
          return (
            <div
              key={rotulo}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                height: 80,
                marginTop: 12,
                padding: "0 28px",
                borderRadius: 18,
                background: "rgba(16,65,173,0.55)",
                border: `3px solid rgba(92,225,230,${0.15 + 0.85 * destaque})`,
                fontWeight: 800,
                fontSize: 38,
                letterSpacing: 2,
                ...chegada(e, 20),
              }}
            >
              <span>{rotulo}</span>
              <span style={{ opacity: 0.85 }}>R$ ••••</span>
            </div>
          );
        })}
      </Cartao>
      <Ilustracao />
    </>
  );
};
