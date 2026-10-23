import { ArrowRight, CircleCheck, Eye, Timer } from "lucide-react";
import { useCurrentFrame } from "remotion";
import { fonte, marca } from "../marca";
import { brl, pct, produto } from "./numeros";
import { entra, janela, q } from "./tempo";

const tinta = "#0B1F4D";
const apagado = "#5B6B8C";

const Cartao: React.FC<{ p: number; top: number; children: React.ReactNode; largura?: number }> = ({
  p, top, children, largura = 820,
}) => (
  <div
    style={{
      position: "absolute", left: (1080 - largura) / 2 - 20, width: largura, top, padding: "24px 32px",
      borderRadius: 28, background: "rgba(255,255,255,0.95)", fontFamily: fonte, color: tinta,
      boxShadow: "0 16px 44px rgba(6,26,74,0.28)", opacity: p,
      transform: `translateY(${(1 - p) * 26}px) scale(${0.97 + 0.03 * p})`,
    }}
  >
    {children}
  </div>
);

const Etiqueta: React.FC<{ texto?: string }> = ({ texto = "SIMULAÇÃO · VALORES HIPOTÉTICOS" }) => (
  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 2, color: marca.azul, marginBottom: 10 }}>{texto}</div>
);

// "seu esforço precisa aparecer no lucro também" — a relação esforço → lucro
export const EsforcoLucro: React.FC = () => {
  const frame = useCurrentFrame();
  const p = janela(frame, q("esforço") - 4, q("Quero") - 4);
  if (p <= 0) return null;
  const seta = entra(frame, q("aparecer") - 3, 12);
  const lucro = entra(frame, q("lucro") - 3, 10);
  const pilula = (texto: string, ativo: number, destaque: boolean) => (
    <div
      style={{
        padding: "18px 34px", borderRadius: 999, fontFamily: fonte, fontWeight: 800, fontSize: 44,
        background: destaque ? marca.azul : "rgba(255,255,255,0.95)", color: destaque ? marca.ciano : marca.azul,
        opacity: ativo, transform: `scale(${0.9 + 0.1 * ativo})`, boxShadow: "0 12px 32px rgba(6,26,74,0.28)",
      }}
    >
      {texto}
    </div>
  );
  return (
    <div style={{ position: "absolute", top: 1050, left: 0, right: 40, display: "flex", justifyContent: "center", alignItems: "center", gap: 22, opacity: p }}>
      {pilula("Esforço", 1, false)}
      <div style={{ width: 90 * seta, overflow: "hidden" }}>
        <ArrowRight size={90} color={marca.branco} strokeWidth={2.6} />
      </div>
      {pilula("Lucro", lucro, true)}
    </div>
  );
};

// "Quero fazer o cálculo reverso dos meus produtos e saber meu lucro exato, em centavos."
export const CalculoReverso: React.FC = () => {
  const frame = useCurrentFrame();
  const p = janela(frame, q("cálculo") - 4, q("Em", 2) - 6); // sai antes de "Em minutos" (corte de plano em 24,67 s)
  if (p <= 0) return null;
  const linhas = [
    { rotulo: "Preço de venda", v: produto.preco, sinal: "", em: q("produtos") - 3 },
    { rotulo: "Custo do produto", v: produto.custo, sinal: "− ", em: q("e", 1) - 1 },
    { rotulo: "Despesas variáveis", v: produto.despesasVariaveis, sinal: "− ", em: q("saber") - 1 },
    { rotulo: "Tributos sobre a venda", v: produto.tributos, sinal: "− ", em: q("meu", 1) - 1 },
  ];
  const res = entra(frame, q("exato") - 3, 12);
  const cent = entra(frame, q("centavos") - 3, 10);
  const valor = (v: number, sinal: string, tam: number, cor: string) => {
    const [inteiro, centavos] = brl(v).split(",");
    return (
      <span style={{ fontWeight: 800, fontSize: tam, color: cor, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
        {sinal}
        {inteiro},
        <span style={{ borderBottom: `${5 * cent}px solid ${marca.ciano}` }}>{centavos}</span>
      </span>
    );
  };
  return (
    <Cartao p={p} top={878}>
      <Etiqueta />
      <div style={{ fontWeight: 900, fontSize: 38, color: marca.azul, marginBottom: 8 }}>Do preço ao que sobra, por unidade</div>
      {linhas.map((l) => {
        const e = entra(frame, l.em, 8);
        return (
          <div key={l.rotulo} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", height: 46, opacity: e, transform: `translateX(${(1 - e) * 20}px)` }}>
            <span style={{ fontWeight: 600, fontSize: 30, color: apagado }}>{l.rotulo}</span>
            {valor(l.v, l.sinal, 36, tinta)}
          </div>
        );
      })}
      <div
        style={{
          marginTop: 8, padding: "10px 20px", borderRadius: 18, background: marca.azul, display: "flex",
          justifyContent: "space-between", alignItems: "center", opacity: res, transform: `scale(${0.96 + 0.04 * res})`,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 28, color: marca.branco, lineHeight: 1.15 }}>
          Margem de contribuição
          <br />
          <span style={{ fontWeight: 600, fontSize: 22, opacity: 0.85 }}>antes das despesas fixas</span>
        </span>
        <span style={{ textAlign: "right" }}>
          {valor(produto.margem, "= ", 42, marca.ciano)}
          <div style={{ fontWeight: 700, fontSize: 24, color: marca.branco }}>{pct(produto.margemPct)} do preço</div>
        </span>
      </div>
    </Cartao>
  );
};

// "Em minutos você tem a resposta. É só alimentar o sistema."
export const AlimentarSistema: React.FC = () => {
  const frame = useCurrentFrame();
  const p = janela(frame, q("minutos") - 4, q("Mas", 2) - 4);
  if (p <= 0) return null;
  const dados = [
    { rotulo: "Custo do produto", em: q("alimentar") - 2 },
    { rotulo: "Despesas variáveis", em: q("alimentar") + 5 },
    { rotulo: "Tributos sobre a venda", em: q("sistema") - 3 },
  ];
  const resposta = entra(frame, q("resposta") - 3, 10);
  return (
    <Cartao p={p} top={880}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <Timer size={44} color={marca.azul} strokeWidth={2.4} />
        <span style={{ fontWeight: 900, fontSize: 38, color: marca.azul }}>Em minutos</span>
      </div>
      <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          {dados.map((d) => {
            const e = entra(frame, d.em, 8);
            return (
              <div key={d.rotulo} style={{ display: "flex", alignItems: "center", gap: 10, height: 48, opacity: 0.25 + 0.75 * e }}>
                <CircleCheck size={30} color={e > 0.5 ? marca.azul : apagado} strokeWidth={2.4} />
                <span style={{ fontWeight: 700, fontSize: 28, color: tinta }}>{d.rotulo}</span>
              </div>
            );
          })}
        </div>
        <div style={{ width: 250, padding: "16px 18px", borderRadius: 20, background: marca.azul, opacity: resposta, textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 24, color: marca.branco }}>Resposta</div>
          <div style={{ fontWeight: 900, fontSize: 40, color: marca.ciano }}>{brl(produto.margem)}</div>
          <div style={{ fontWeight: 600, fontSize: 20, color: marca.branco }}>por unidade</div>
        </div>
      </div>
    </Cartao>
  );
};

// "Quem trabalha tanto merece enxergar o lucro." — retoma o resultado do mesmo exemplo:
// cartão azul da marca, valor em ciano e um anel que mostra a fatia do preço (44,89%)
export const EnxergarLucro: React.FC = () => {
  const frame = useCurrentFrame();
  const ini = q("enxergar") - 4;
  const p = janela(frame, ini, q("Agradeça") - 2);
  if (p <= 0) return null;
  const anel = entra(frame, ini + 2, 16) * (produto.margemPct / 100);
  const valor = entra(frame, ini + 3, 9);
  const R = 62;
  const C = 2 * Math.PI * R;
  return (
    <div
      style={{
        position: "absolute", left: 160, width: 720, top: 1000, padding: "22px 28px", borderRadius: 30,
        background: marca.azul, fontFamily: fonte, display: "flex", alignItems: "center", gap: 26,
        boxShadow: "0 16px 44px rgba(6,26,74,0.35)", border: "2px solid rgba(92,225,230,0.45)",
        opacity: p, transform: `translateY(${(1 - p) * 26}px) scale(${0.97 + 0.03 * p})`,
      }}
    >
      <div style={{ position: "relative", width: 150, height: 150, flexShrink: 0 }}>
        <svg width={150} height={150} viewBox="0 0 150 150" style={{ transform: "rotate(-90deg)" }}>
          <circle cx={75} cy={75} r={R} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={16} />
          <circle
            cx={75} cy={75} r={R} fill="none" stroke={marca.ciano} strokeWidth={16} strokeLinecap="round"
            strokeDasharray={`${C * anel} ${C}`}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Eye size={54} color={marca.branco} strokeWidth={2.2} />
        </div>
      </div>
      <div style={{ opacity: valor, transform: `translateX(${(1 - valor) * 16}px)` }}>
        <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: 2, color: marca.ciano }}>SIMULAÇÃO</div>
        <div style={{ fontWeight: 700, fontSize: 28, color: marca.branco, lineHeight: 1.2 }}>Margem de contribuição por unidade</div>
        <div style={{ fontWeight: 900, fontSize: 60, color: marca.ciano, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
          {brl(produto.margem)}
        </div>
        <div style={{ fontWeight: 700, fontSize: 26, color: marca.branco }}>{pct(produto.margemPct)} do preço de venda</div>
      </div>
    </div>
  );
};
