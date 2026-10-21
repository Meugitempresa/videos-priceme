import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Logo } from "../edicao/Logo";
import { chegada, entra, q } from "../edicao/tempo";
import { fonte, marca } from "../marca";
import { brl, mes, produtos } from "./numeros";

const tinta = "#0B1F4D"; // texto escuro (azul da marca bem escurecido)
const apagado = "#5B6B8C";
const claro = "#F4F7FD";

const Etiqueta: React.FC = () => (
  <div
    style={{
      position: "absolute", left: 90, top: 170, padding: "8px 18px", borderRadius: 999,
      background: "rgba(16,65,173,0.1)", color: marca.azul, fontFamily: fonte, fontWeight: 800,
      fontSize: 24, letterSpacing: 2,
    }}
  >
    SIMULAÇÃO · VALORES FICTÍCIOS
  </div>
);

const Titulo: React.FC<{ p: number; children: React.ReactNode }> = ({ p, children }) => (
  <div
    style={{
      position: "absolute", left: 90, width: 520, top: 240, fontFamily: fonte, fontWeight: 800, fontSize: 54,
      lineHeight: 1.12, color: tinta, ...chegada(p, 24), filter: undefined,
    }}
  >
    {children}
  </div>
);

// Valor em reais; com `centavos` > 0 os centavos ganham um sublinhado ciano (precisão)
const Valor: React.FC<{ v: number; sinal?: string; tam?: number; cor?: string; centavos?: number }> = ({
  v, sinal = "", tam = 46, cor = tinta, centavos = 0,
}) => {
  const [inteiro, cent] = brl(v).split(",");
  return (
    <span style={{ fontWeight: 800, fontSize: tam, color: cor, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
      {sinal}
      {inteiro},
      <span style={{ borderBottom: `${6 * centavos}px solid ${marca.ciano}`, paddingBottom: 2 }}>{cent}</span>
    </span>
  );
};

const Linha: React.FC<{ rotulo: string; p: number; children?: React.ReactNode; top: number }> = ({ rotulo, p, children, top }) => (
  <div
    style={{
      position: "absolute", left: 90, width: 860, top, height: 100, display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 30px", borderRadius: 22, background: "#FFFFFF",
      boxShadow: "0 6px 20px rgba(11,31,77,0.06)", fontFamily: fonte, ...chegada(p, 24), filter: undefined,
    }}
  >
    <span style={{ fontWeight: 600, fontSize: 31, color: apagado, whiteSpace: "nowrap" }}>{rotulo}</span>
    {children}
  </div>
);

// 1) "A PriceMe te ajuda a entender de verdade. Na PriceMe você lança os dados de despesas e receitas
//     e ela calcula o lucro dos seus produtos e serviços..." — logo e o mês de uma loja fictícia
export const DemoMes: React.FC = () => {
  const frame = useCurrentFrame();
  const claroP = entra(frame, q("Na") - 4, 10);
  const linhas = entra(frame, q("lança") - 3, 12);
  const vDesp = entra(frame, q("despesas") - 3, 10);
  const vFix = entra(frame, q("despesas") + 5, 10);
  const vRec = entra(frame, q("receitas") - 3, 10);
  const conta = entra(frame, q("calcula") - 3, 12);
  const res = entra(frame, q("lucro") - 4, 12);
  const W = 860;
  const partes = [
    { v: mes.variaveis, cor: "#9FB3E0", rotulo: "Variáveis" },
    { v: mes.fixas, cor: "#C9D6F2", rotulo: "Fixas" },
    { v: mes.resultado, cor: marca.ciano, rotulo: "Resultado" },
  ];
  return (
    <>
      {/* marca: o azul da logo ocupa a tela enquanto ela diz "entender de verdade" */}
      <AbsoluteFill style={{ background: marca.azul, opacity: 1 - claroP }}>
        <Logo largura={820} semSombra style={{ left: 130, top: 700 }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: claro, opacity: claroP }}>
        <Etiqueta />
        <Titulo p={claroP}>O mês de uma loja fictícia</Titulo>
        <Linha rotulo="Receita do mês" p={linhas} top={600}>
          <span style={{ opacity: vRec }}><Valor v={mes.receita} /></span>
        </Linha>
        <Linha rotulo="Custos e despesas variáveis" p={linhas} top={715}>
          <span style={{ opacity: vDesp }}><Valor v={mes.variaveis} sinal="− " /></span>
        </Linha>
        <Linha rotulo="Custos e despesas fixas" p={linhas} top={830}>
          <span style={{ opacity: vFix }}><Valor v={mes.fixas} sinal="− " /></span>
        </Linha>
        <div style={{ position: "absolute", left: 90, top: 948, width: W * conta, height: 4, background: tinta, borderRadius: 2 }} />
        <Linha rotulo="Resultado operacional" p={res} top={970}>
          <Valor v={mes.resultado} sinal="= " cor={marca.azul} tam={50} />
        </Linha>
        {/* barra proporcional: a receita dividida entre custos, despesas e resultado */}
        <div style={{ position: "absolute", left: 90, top: 1100, width: W, height: 44, display: "flex", borderRadius: 12, overflow: "hidden", opacity: res }}>
          {partes.map((p) => (
            <div key={p.rotulo} style={{ width: (W * p.v) / mes.receita * res, background: p.cor }} />
          ))}
        </div>
        <div style={{ position: "absolute", left: 90, top: 1154, width: W, display: "flex", fontFamily: fonte, fontSize: 24, fontWeight: 600, color: apagado, opacity: res }}>
          {partes.map((p) => (
            <div key={p.rotulo} style={{ width: (W * p.v) / mes.receita }}>{p.rotulo}</div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 90, top: 1198, fontFamily: fonte, fontSize: 24, color: apagado, opacity: res }}>
          Simplificado: antes de impostos e de outros itens não incluídos.
        </div>
      </AbsoluteFill>
    </>
  );
};

// 2) "Com isso, você consegue saber até centavos de qual produto é mais rentável
//     e qual produto você verdadeiramente deve investir."
export const DemoProdutos: React.FC = () => {
  const frame = useCurrentFrame();
  const [A, B] = produtos;
  const troca = entra(frame, q("de", 3) - 4, 12); // unidade -> comparação
  const p1 = entra(frame, q("Com") - 3, 12);
  const r1 = entra(frame, q("Com") + 2, 10);
  const r2 = entra(frame, q("consegue") - 3, 10);
  const r3 = entra(frame, q("saber") - 3, 10);
  const cent = entra(frame, q("centavos") - 3, 10);
  const destaque = entra(frame, q("rentável") - 4, 12);
  const nota = entra(frame, q("investir") - 4, 12);
  const escala = 560 / A.contribuicao;

  const Coluna = ({ prod, x, foco }: { prod: typeof A; x: number; foco: number }) => (
    <div
      style={{
        position: "absolute", left: x, top: 600, width: 410, padding: "24px 28px", borderRadius: 26,
        background: "#FFFFFF", fontFamily: fonte, color: tinta,
        border: `5px solid rgba(92,225,230,${foco})`, boxShadow: "0 6px 20px rgba(11,31,77,0.06)",
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 40, marginBottom: 14 }}>{prod.nome}</div>
      {[
        ["Preço de venda", prod.preco, ""],
        ["Custos e despesas variáveis", prod.variaveis, "− "],
        ["Margem de contribuição", prod.contribuicao, "= "],
      ].map(([r, v, sinal]) => (
        <div key={r as string} style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 600, fontSize: 26, color: apagado }}>{r}</div>
          <Valor v={v as number} sinal={sinal as string} tam={40} cor={sinal === "= " ? marca.azul : tinta} />
        </div>
      ))}
    </div>
  );

  return (
    <AbsoluteFill style={{ background: claro }}>
      <Etiqueta />
      {/* unidade: o detalhe até os centavos */}
      <div style={{ opacity: 1 - troca }}>
        <Titulo p={p1}>Quanto sobra em cada unidade vendida</Titulo>
        <Linha rotulo={`${A.nome}: preço de venda`} p={r1} top={600}>
          <Valor v={A.preco} centavos={cent} />
        </Linha>
        <Linha rotulo="Custos e despesas variáveis" p={r2} top={715}>
          <Valor v={A.variaveis} sinal="− " centavos={cent} />
        </Linha>
        <div style={{ position: "absolute", left: 90, top: 833, width: 860 * r3, height: 4, background: tinta }} />
        <Linha rotulo="Margem de contribuição" p={r3} top={855}>
          <Valor v={A.contribuicao} sinal="= " cor={marca.azul} tam={50} centavos={cent} />
        </Linha>
        <div style={{ position: "absolute", left: 90, top: 985, fontFamily: fonte, fontSize: 30, fontWeight: 700, color: marca.azul, opacity: cent }}>
          Por unidade, até os centavos.
        </div>
      </div>
      {/* comparação entre dois produtos, sempre por unidade */}
      {troca > 0 ? (
        <div style={{ opacity: troca }}>
          <Titulo p={troca}>Qual contribui mais por unidade?</Titulo>
          <Coluna prod={A} x={90} foco={destaque} />
          <Coluna prod={B} x={540} foco={0} />
          <div style={{ position: "absolute", left: 90, top: 1010, fontFamily: fonte, fontSize: 26, fontWeight: 700, color: apagado }}>
            Margem de contribuição por unidade
          </div>
          {[A, B].map((p, i) => (
            <div key={p.nome} style={{ position: "absolute", left: 90, top: 1056 + i * 64, display: "flex", alignItems: "center", gap: 16, fontFamily: fonte }}>
              <div style={{ width: 40, fontWeight: 900, fontSize: 30, color: tinta }}>{p.nome.slice(-1)}</div>
              <div style={{ width: p.contribuicao * escala * troca, height: 44, borderRadius: 10, background: i === 0 ? marca.azul : "#9FB3E0" }} />
              <Valor v={p.contribuicao} tam={32} />
            </div>
          ))}
          <div
            style={{
              position: "absolute", left: 90, top: 1196, width: 860, fontFamily: fonte, fontSize: 26, fontWeight: 700,
              color: marca.azul, opacity: destaque * (1 - nota),
            }}
          >
            O Produto A deixa mais por unidade: {brl(A.contribuicao)} contra {brl(B.contribuicao)}.
          </div>
          <div style={{ position: "absolute", left: 90, top: 1196, width: 860, fontFamily: fonte, fontSize: 26, fontWeight: 700, color: apagado, opacity: nota }}>
            Para decidir onde investir, conta também o volume vendido e os custos fixos.
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// 3) Encerramento único: logo, endereço e a frase final da própria fala
export const Encerramento: React.FC = () => {
  const frame = useCurrentFrame();
  const logo = entra(frame, q("mesmo") + 15, 14);
  const url = entra(frame, q("Acesse") - 3, 12);
  const frase = entra(frame, q("descubra") - 4, 14);
  return (
    <AbsoluteFill style={{ background: marca.azul }}>
      <div style={{ opacity: logo, transform: `translateY(${interpolate(logo, [0, 1], [24, 0])}px)` }}>
        <Logo largura={820} semSombra style={{ left: 130, top: 190 }} />
      </div>
      <div
        style={{
          position: "absolute", left: 170, width: 740, top: 690, height: 110, borderRadius: 999,
          display: "flex", alignItems: "center", justifyContent: "center", background: marca.branco,
          color: marca.azul, fontFamily: fonte, fontWeight: 900, fontSize: 64, ...chegada(url, 20), filter: undefined,
        }}
      >
        priceme.com.br
      </div>
      <div
        style={{
          position: "absolute", left: 90, right: 90, top: 850, textAlign: "center", fontFamily: fonte,
          fontWeight: 700, fontSize: 48, lineHeight: 1.2, color: marca.branco, ...chegada(frase, 20), filter: undefined,
        }}
      >
        Descubra o que está ficando <span style={{ color: marca.ciano }}>para você</span>.
      </div>
    </AbsoluteFill>
  );
};
