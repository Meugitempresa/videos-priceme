import { Crown, Package, Search } from "lucide-react";
import { interpolate, useCurrentFrame } from "remotion";
import { fonte, marca } from "../../marca";
import { Cartao, Ilustracao } from "../Painel";
import { chegada, entra, q, s } from "../tempo";

// "Com isso, você consegue saber até centavos de qual produto é mais rentável"
// Lupa sobre um valor oculto destaca os centavos; o valor vira três produtos e um ganha o selo.
export const Cena6Centavos: React.FC = () => {
  const frame = useCurrentFrame();
  const inicio = s(17.3) - 2;
  const pValor = entra(frame, inicio, 12);
  const lupa = entra(frame, q("saber") - 4, 22);
  const cents = entra(frame, q("centavos") - 4, 10);
  const vira = entra(frame, q("de", 3) - 4, 16);
  const rent = entra(frame, q("rentável") - 4, 14);

  const lupaX = interpolate(lupa, [0, 1], [40, 560]);
  const produtos = ["A", "B", "C"];
  const xs = [150, 415, 680];

  return (
    <>
      {/* Valor oculto com os centavos em destaque */}
      {vira < 1 ? (
        <Cartao
          style={{
            left: 140,
            top: 240,
            width: 760,
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...chegada(pValor),
            opacity: pValor * (1 - vira),
            transform: `${chegada(pValor).transform} scale(${interpolate(vira, [0, 1], [1, 0.4])})`,
          }}
        >
          <span style={{ fontWeight: 900, fontSize: 130, letterSpacing: 4 }}>
            R$ ••
            <span
              style={{
                display: "inline-block",
                marginLeft: 6,
                padding: "0 14px",
                borderRadius: 18,
                color: cents > 0.5 ? marca.azul : marca.branco,
                background: `rgba(92,225,230,${cents})`,
                transform: `scale(${1 + 0.08 * cents})`,
              }}
            >
              ,••
            </span>
          </span>
        </Cartao>
      ) : null}
      {vira < 1 ? (
        <div
          style={{
            position: "absolute",
            left: lupaX,
            top: 300,
            opacity: lupa * (1 - vira),
            transform: `rotate(${interpolate(lupa, [0, 1], [-20, 0])}deg) scale(${1 + 0.15 * cents})`,
            filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.45))",
          }}
        >
          <Search size={210} color={marca.ciano} strokeWidth={2.4} />
        </div>
      ) : null}

      {/* Três produtos; um sobe com o selo de mais rentável */}
      {produtos.map((nome, i) => {
        const centro = i === 1;
        const x = interpolate(vira, [0, 1], [415, xs[i]]);
        const ganhou = centro ? rent : 0;
        return (
          <Cartao
            key={nome}
            style={{
              left: x,
              top: 290 - 30 * ganhou,
              width: 230,
              height: 240,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              opacity: vira * (centro ? 1 : 1 - 0.55 * rent),
              transform: `scale(${(0.85 + 0.15 * vira) * (1 + 0.06 * ganhou)})`,
              border: centro && rent > 0 ? `4px solid rgba(92,225,230,${rent})` : undefined,
              boxShadow: centro && rent > 0 ? `0 0 ${50 * rent}px rgba(92,225,230,0.5)` : undefined,
            }}
          >
            <Package size={84} color={marca.ciano} strokeWidth={1.8} />
            <span style={{ fontWeight: 800, fontSize: 30, letterSpacing: 2, textAlign: "center" }}>
              PRODUTO
              <br />
              {nome}
            </span>
          </Cartao>
        );
      })}
      {rent > 0 ? (
        <>
          <div style={{ position: "absolute", left: 480, top: 170, ...chegada(rent, -30) }}>
            <Crown size={100} color={marca.ciano} fill="rgba(92,225,230,0.25)" strokeWidth={2.2} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 380,
              top: 520,
              width: 300,
              textAlign: "center",
              padding: "10px 0",
              borderRadius: 999,
              background: marca.ciano,
              color: marca.azul,
              fontFamily: fonte,
              fontWeight: 900,
              fontSize: 30,
              letterSpacing: 2,
              ...chegada(rent, 20),
            }}
          >
            MAIS RENTÁVEL
          </div>
        </>
      ) : null}
      <Ilustracao />
    </>
  );
};
