import { CircleCheck, Package, Wrench } from "lucide-react";
import { interpolate, useCurrentFrame } from "remotion";
import { marca } from "../../marca";
import { Cartao, Ilustracao } from "../Painel";
import { chegada, entra, q } from "../tempo";

// "e ela calcula o lucro dos seus produtos e serviços em minutos."
// Receitas e despesas se fundem na linha do lucro; produtos e serviços ganham ✓; cronômetro em "em minutos".
const Linha: React.FC<{ rotulo: string; sinal: string; y: number; opacidade: number; destaque?: boolean }> = ({
  rotulo,
  sinal,
  y,
  opacidade,
  destaque,
}) => (
  <Cartao
    style={{
      left: 140,
      width: 760,
      top: y,
      height: 104,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 40px",
      opacity: opacidade,
      border: destaque ? `3px solid ${marca.ciano}` : undefined,
      boxShadow: destaque ? `0 0 40px rgba(92,225,230,0.45)` : undefined,
    }}
  >
    <span style={{ fontWeight: 800, fontSize: 44, letterSpacing: 2 }}>
      <span style={{ color: marca.ciano, marginRight: 18 }}>{sinal}</span>
      {rotulo}
    </span>
    <span style={{ fontWeight: 700, fontSize: 44, opacity: 0.85 }}>R$ ••••</span>
  </Cartao>
);

const CartaoItem: React.FC<{ x: number; rotulo: string; icone: React.ReactNode; p: number; ok: number; dim: number }> = ({
  x,
  rotulo,
  icone,
  p,
  ok,
  dim,
}) => (
  <Cartao
    style={{
      left: x,
      top: 335,
      width: 360,
      height: 230,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 18,
      ...chegada(p, 40),
      opacity: p * dim,
    }}
  >
    {icone}
    <span style={{ fontWeight: 800, fontSize: 38, letterSpacing: 3 }}>{rotulo}</span>
    <div
      style={{
        position: "absolute",
        top: -22,
        right: -22,
        transform: `scale(${ok})`,
        background: marca.azulNoite,
        borderRadius: 999,
      }}
    >
      <CircleCheck size={64} color={marca.ciano} strokeWidth={2.5} />
    </div>
  </Cartao>
);

export const Cena5Lucro: React.FC = () => {
  const frame = useCurrentFrame();
  const inicio = q("e", 2);
  const fusao = entra(frame, q("lucro") - 4, 14);
  const sobe = entra(frame, q("produtos") - 8, 14);
  const pProd = entra(frame, q("produtos") - 4);
  const pServ = entra(frame, q("serviços") - 4);
  const okProd = entra(frame, q("produtos") + 8, 10);
  const okServ = entra(frame, q("serviços") + 8, 10);
  const relogio = entra(frame, q("em", 1) - 4, 12);
  const dim = 1 - 0.65 * relogio;
  const entrada = entra(frame, inicio - 4, 12);
  const yLucro = interpolate(sobe, [0, 1], [290, 200]);
  const giro = interpolate(frame, [q("em", 1) - 4, q("Com")], [0, 360], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      <div style={{ opacity: entrada }}>
        <Linha rotulo="RECEITAS" sinal="+" y={interpolate(fusao, [0, 1], [230, 290])} opacidade={1 - fusao} />
        <Linha rotulo="DESPESAS" sinal="−" y={interpolate(fusao, [0, 1], [350, 290])} opacidade={1 - fusao} />
      </div>
      <Linha rotulo="LUCRO" sinal="=" y={yLucro} opacidade={fusao * dim} destaque />
      <CartaoItem
        x={140}
        rotulo="PRODUTOS"
        icone={<Package size={96} color={marca.ciano} strokeWidth={1.8} />}
        p={pProd}
        ok={okProd}
        dim={dim}
      />
      <CartaoItem
        x={540}
        rotulo="SERVIÇOS"
        icone={<Wrench size={96} color={marca.ciano} strokeWidth={1.8} />}
        p={pServ}
        ok={okServ}
        dim={dim}
      />
      {relogio > 0 ? (
        <svg
          width={280}
          height={280}
          viewBox="-150 -150 300 300"
          style={{ position: "absolute", left: 380, top: 310, ...chegada(relogio, 20) }}
        >
          <rect x={-22} y={-150} width={44} height={26} rx={8} fill={marca.ciano} />
          <circle r={118} fill={marca.azulNoite} stroke={marca.ciano} strokeWidth={12} />
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={i}
              x1={0}
              y1={-96}
              x2={0}
              y2={i % 3 === 0 ? -76 : -86}
              stroke={marca.branco}
              strokeWidth={i % 3 === 0 ? 7 : 4}
              strokeLinecap="round"
              transform={`rotate(${i * 30})`}
            />
          ))}
          <path
            d={`M 0 -88 A 88 88 0 ${giro > 180 ? 1 : 0} 1 ${88 * Math.sin((giro * Math.PI) / 180)} ${-88 * Math.cos((giro * Math.PI) / 180)}`}
            fill="none"
            stroke="rgba(92,225,230,0.35)"
            strokeWidth={22}
          />
          <line x1={0} y1={0} x2={0} y2={-84} stroke={marca.ciano} strokeWidth={8} strokeLinecap="round" transform={`rotate(${giro})`} />
          <circle r={12} fill={marca.ciano} />
        </svg>
      ) : null}
      <Ilustracao />
    </>
  );
};
