import { useCurrentFrame } from "remotion";
import palavras from "../edicao/palavras.json";
import { entra, FPS, q } from "../edicao/tempo";
import { Logo } from "../edicao/Logo";
import { fonte, marca } from "../marca";
import { brl, mes } from "./numeros";
import { DEMOS } from "./tempos";

const Titulo: React.FC<{ p: number; children: React.ReactNode; top?: number }> = ({ p, children, top = 190 }) => (
  <div
    style={{
      position: "absolute", left: 90, right: 130, top, fontFamily: fonte, fontWeight: 800, fontSize: 70,
      lineHeight: 1.1, color: marca.branco, opacity: p, transform: `translateY(${(1 - p) * 24}px)`,
      textShadow: "0 4px 24px rgba(6,26,74,0.6)",
    }}
  >
    {children}
  </div>
);

// Abertura (já inteira no primeiro quadro, que serve de capa)
export const Gancho: React.FC = () => {
  const frame = useCurrentFrame();
  const sai = 1 - entra(frame, q("A") - 10, 8);
  if (sai <= 0) return null;
  return (
    <Titulo p={sai}>
      Faturar não é o mesmo que <span style={{ color: marca.ciano }}>lucrar</span>.
    </Titulo>
  );
};

// "A PriceMe te ajuda..." — logo oficial no alto, acima da cabeça
export const LogoNoAlto: React.FC = () => {
  const frame = useCurrentFrame();
  const p = entra(frame, q("PriceMe") - 6, 12);
  // a logo do alto só vive até a cortina da demonstração cobrir a tela
  if (p <= 0 || frame > DEMOS.marcaEDados.de + 12) return null;
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>
      <Logo largura={520} style={{ left: 280, top: 150 }} />
    </div>
  );
};

// "Ou seja, você trabalha no positivo sempre." — retoma o resultado da simulação do mês
export const CartaoResultado: React.FC = () => {
  const frame = useCurrentFrame();
  const p = entra(frame, q("trabalha", 2) - 3, 12) * (1 - entra(frame, q("Enfim") - 8, 8));
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: "absolute", left: 240, width: 560, top: 1080, padding: "22px 30px", borderRadius: 26,
        background: "rgba(255,255,255,0.94)", fontFamily: fonte, textAlign: "center",
        opacity: p, transform: `translateY(${(1 - p) * 30}px)`, boxShadow: "0 14px 40px rgba(6,26,74,0.3)",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 26, letterSpacing: 1, color: "#5B6B8C" }}>
        SIMULAÇÃO · RESULTADO DO MÊS
      </div>
      <div style={{ fontWeight: 900, fontSize: 64, color: marca.azul }}>+ {brl(mes.resultado)}</div>
    </div>
  );
};

// Recado central, no ritmo da fala (substitui a legenda enquanto está na tela)
const RECADO = ["Seu", "esforço", "precisa", "aparecer", "no", "lucro."];
export const Recado: React.FC = () => {
  const frame = useCurrentFrame();
  const ini = q("seu") - 3;
  const sai = 1 - entra(frame, q("mesmo") + 10, 8);
  if (frame < ini || sai <= 0) return null;
  const tempos = [q("seu"), q("esforço"), q("precisa"), q("aparecer"), q("no", 2), q("lucro", 2)];
  return (
    <Titulo p={sai} top={175}>
      {RECADO.map((w, i) => {
        const e = entra(frame, tempos[i] - 3, 8);
        return (
          <span
            key={w}
            style={{
              display: "inline-block", marginRight: 18, opacity: 0.25 + 0.75 * e,
              color: w.startsWith("lucro") ? marca.ciano : marca.branco,
            }}
          >
            {w}
          </span>
        );
      })}
    </Titulo>
  );
};

export const fimDaFala = (texto: string) => Math.round((palavras.find((w) => w.texto === texto)?.fim ?? 0) * FPS);
