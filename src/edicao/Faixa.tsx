import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fonte, marca } from "../marca";
import { DURACAO, entra, q, s } from "./tempo";

// Títulos de cada cena. Entre asteriscos: destaque em ciano.
const TITULOS: { de: number; linhas: string[] }[] = [
  { de: 0, linhas: ["QUANTO DO SEU DINHEIRO", "*FICA* COM VOCÊ?"] },
  { de: q("mas"), linhas: ["QUANTO *REALMENTE* FICA?"] },
  { de: q("A"), linhas: ["ENTENDA *DE VERDADE*"] },
  { de: q("Na"), linhas: ["LANCE *RECEITAS*", "E *DESPESAS*"] },
  { de: q("e", 2), linhas: ["LUCRO POR PRODUTO", "E SERVIÇO *EM MINUTOS*"] },
  { de: s(17.3), linhas: ["SAIBA *ATÉ OS CENTAVOS*"] },
  { de: q("de", 3), linhas: ["QUAL PRODUTO É", "*MAIS RENTÁVEL*"] },
  { de: q("e", 4), linhas: ["SAIBA *ONDE INVESTIR*"] },
  { de: s(26.0), linhas: ["TRABALHE", "*NO POSITIVO*"] },
  { de: q("Enfim"), linhas: ["SEU ESFORÇO PRECISA", "APARECER NO *LUCRO*"] },
  { de: s(34.47), linhas: ["DESCUBRA O QUE ESTÁ", "*FICANDO PARA VOCÊ*"] },
];

const Linha: React.FC<{ texto: string; frame: number; inicio: number; base: number }> = ({
  texto,
  frame,
  inicio,
  base,
}) => {
  const partes = texto.split(/(\*[^*]+\*)/).filter(Boolean);
  let k = base;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 16px" }}>
      {partes.flatMap((parte) => {
        const destaque = parte.startsWith("*");
        return parte
          .replace(/\*/g, "")
          .trim()
          .split(" ")
          .filter(Boolean)
          .map((palavra) => {
            const p = inicio === 0 ? 1 : entra(frame, inicio + 2 * k++, 10);
            return (
              <span
                key={palavra + k}
                style={{
                  display: "inline-block",
                  color: destaque ? marca.ciano : marca.branco,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 24}px)`,
                }}
              >
                {palavra}
              </span>
            );
          });
      })}
    </div>
  );
};

export const Faixa: React.FC = () => {
  const frame = useCurrentFrame();
  const i = TITULOS.findLastIndex((t) => frame >= t.de - 4);
  const titulo = TITULOS[i];
  const fim = TITULOS[i + 1]?.de ?? DURACAO;
  const inicio = titulo.de === 0 ? 0 : titulo.de - 4;
  const saida = 1 - entra(frame, fim - 8, 4);
  const caixa = inicio === 0 ? 1 : entra(frame, inicio, 8);
  return (
    <AbsoluteFill style={{ top: 640, height: 180, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          width: 900,
          marginRight: 40,
          padding: "18px 24px",
          borderRadius: 20,
          background: marca.azul,
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
          borderBottom: `5px solid ${marca.ciano}`,
          fontFamily: fonte,
          fontWeight: 900,
          fontSize: titulo.linhas.length > 1 ? 54 : 60,
          lineHeight: 1.12,
          textAlign: "center",
          opacity: saida * caixa,
          transform: `scale(${0.96 + 0.04 * caixa})`,
        }}
      >
        {titulo.linhas.map((l, n) => (
          <Linha key={l} texto={l} frame={frame} inicio={inicio} base={n * 3} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
