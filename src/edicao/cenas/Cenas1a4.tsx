import { Banknote, Briefcase, CircleHelp, PenLine, PiggyBank, ShoppingBag } from "lucide-react";
import { interpolate, useCurrentFrame } from "remotion";
import { fonte, marca } from "../../marca";
import { Logo } from "../Logo";
import { Cartao, Ilustracao } from "../Painel";
import { chegada, entra, q } from "../tempo";

const Icone: React.FC<{ x: number; p: number; rotulo: string; children: React.ReactNode }> = ({ x, p, rotulo, children }) => (
  <Cartao
    style={{
      left: x, top: 250, width: 230, height: 250, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 18, ...chegada(p, 40),
    }}
  >
    {children}
    <span style={{ fontWeight: 800, fontSize: 30, letterSpacing: 2 }}>{rotulo}</span>
  </Cartao>
);

// "Você trabalha, vende, vê o dinheiro entrar,"
export const Cena1Trabalho: React.FC = () => {
  const frame = useCurrentFrame();
  const voa = entra(frame, q("dinheiro") - 4, 20);
  return (
    <>
      <Icone x={150} p={entra(frame, q("trabalha") - 4)} rotulo="TRABALHA">
        <Briefcase size={96} color={marca.ciano} strokeWidth={1.8} />
      </Icone>
      <Icone x={415} p={entra(frame, q("vende") - 4)} rotulo="VENDE">
        <ShoppingBag size={96} color={marca.ciano} strokeWidth={1.8} />
      </Icone>
      <Icone x={680} p={entra(frame, q("dinheiro") - 8)} rotulo="ENTRA">
        <PiggyBank size={96} color={marca.ciano} strokeWidth={1.8} />
      </Icone>
      {voa > 0 && voa < 1 ? (
        <div
          style={{
            position: "absolute",
            left: interpolate(voa, [0, 1], [520, 750]),
            top: interpolate(voa, [0, 0.5, 1], [180, 140, 300]),
            opacity: interpolate(voa, [0, 0.15, 0.85, 1], [0, 1, 1, 0]),
          }}
        >
          <Banknote size={90} color={marca.branco} strokeWidth={1.8} />
        </div>
      ) : null}
    </>
  );
};

// "mas sabe quanto realmente fica?" — barras conceituais, sem valores
export const Cena2QuantoFica: React.FC = () => {
  const frame = useCurrentFrame();
  const p = entra(frame, q("mas") - 4, 14);
  const ficou = entra(frame, q("fica") - 4, 10);
  const pulso = 1 + 0.06 * Math.sin((frame - q("fica")) / 3) * ficou;
  const Barra = ({ y, rotulo, largura }: { y: number; rotulo: string; largura: number }) => (
    <div style={{ position: "absolute", left: 140, top: y, width: 760, fontFamily: fonte, color: marca.branco }}>
      <div style={{ fontWeight: 800, fontSize: 34, letterSpacing: 3, marginBottom: 10 }}>{rotulo}</div>
      <div style={{ height: 70, borderRadius: 18, background: "rgba(6,26,74,0.72)", border: "2px solid rgba(255,255,255,0.16)" }}>
        <div style={{ width: `${largura * 100}%`, height: "100%", borderRadius: 18, background: marca.ciano }} />
      </div>
    </div>
  );
  return (
    <div style={{ opacity: p }}>
      <Barra y={230} rotulo="O QUE ENTROU" largura={p} />
      <Barra y={390} rotulo="O QUE FICOU" largura={0} />
      <div style={{ position: "absolute", left: 470, top: 470, transform: `scale(${ficou * pulso})` }}>
        <CircleHelp size={110} color={marca.ciano} fill={marca.azulNoite} strokeWidth={2.2} />
      </div>
    </div>
  );
};

// "A PriceMe te ajuda a entender de verdade." — logo oficial
export const Cena3Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const p = entra(frame, q("PriceMe") - 6, 16);
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
      <Logo largura={680} style={{ left: 200, top: 210 }} />
    </div>
  );
};

// "Na PriceMe você lança os dados de despesas e receitas"
export const Cena4Dados: React.FC = () => {
  const frame = useCurrentFrame();
  const p = entra(frame, q("Na") - 4, 14);
  const desp = entra(frame, q("despesas") - 4);
  const rec = entra(frame, q("receitas") - 4);
  const Linha = ({ y, sinal, rotulo, e }: { y: number; sinal: string; rotulo: string; e: number }) => (
    <Cartao
      style={{
        left: 140, top: y, width: 760, height: 104, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 40px", ...chegada(e, 30),
      }}
    >
      <span style={{ fontWeight: 800, fontSize: 44, letterSpacing: 2 }}>
        <span style={{ color: marca.ciano, marginRight: 18 }}>{sinal}</span>
        {rotulo}
      </span>
      <span style={{ fontWeight: 700, fontSize: 44, opacity: 0.85 }}>R$ ••••</span>
    </Cartao>
  );
  return (
    <>
      <div
        style={{
          position: "absolute", left: 140, top: 168, display: "flex", alignItems: "center", gap: 16,
          fontFamily: fonte, fontWeight: 800, fontSize: 34, letterSpacing: 3, color: marca.branco, ...chegada(p, 20),
        }}
      >
        <PenLine size={48} color={marca.ciano} strokeWidth={2.2} />
        LANÇAMENTO DOS DADOS
      </div>
      <Linha y={230} sinal="+" rotulo="RECEITAS" e={rec} />
      <Linha y={350} sinal="−" rotulo="DESPESAS" e={desp} />
      <Ilustracao />
    </>
  );
};
