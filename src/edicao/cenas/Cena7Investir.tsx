import { ArrowRight, Package, Target } from "lucide-react";
import { interpolate, useCurrentFrame } from "remotion";
import { fonte, marca } from "../../marca";
import { Cartao, Ilustracao } from "../Painel";
import { chegada, entra, q } from "../tempo";

// "e qual produto você verdadeiramente deve investir."
// O produto escolhido segue em destaque; em "investir" surge o alvo e a seta liga um ao outro.
export const Cena7Investir: React.FC = () => {
  const frame = useCurrentFrame();
  const inicio = q("e", 4) - 3;
  const p = entra(frame, inicio, 12);
  const alvo = entra(frame, q("investir") - 4, 14);
  const seta = entra(frame, q("investir") + 4, 12);
  const xCartao = interpolate(alvo, [0, 1], [415, 150]);

  return (
    <>
      <Cartao
        style={{
          left: xCartao,
          top: 260,
          width: 230,
          height: 260,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          border: `4px solid ${marca.ciano}`,
          boxShadow: "0 0 50px rgba(92,225,230,0.5)",
          opacity: p,
        }}
      >
        <Package size={84} color={marca.ciano} strokeWidth={1.8} />
        <span style={{ fontWeight: 800, fontSize: 30, letterSpacing: 2, textAlign: "center" }}>
          PRODUTO
          <br />B
        </span>
      </Cartao>
      {alvo > 0 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: 400,
              top: 345,
              width: 190 * seta,
              height: 90,
              overflow: "hidden",
            }}
          >
            <ArrowRight size={190} color={marca.branco} strokeWidth={2.2} style={{ marginTop: -50 }} />
          </div>
          <div style={{ position: "absolute", left: 620, top: 250, ...chegada(alvo, 20) }}>
            <Target size={280} color={marca.ciano} strokeWidth={1.6} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 600,
              top: 540,
              width: 320,
              textAlign: "center",
              padding: "10px 0",
              borderRadius: 999,
              background: marca.ciano,
              color: marca.azul,
              fontFamily: fonte,
              fontWeight: 900,
              fontSize: 30,
              letterSpacing: 2,
              ...chegada(seta, 20),
            }}
          >
            ONDE INVESTIR
          </div>
        </>
      ) : null}
      <Ilustracao />
    </>
  );
};
