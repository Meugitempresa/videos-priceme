import { ArrowRight, Briefcase } from "lucide-react";
import { useCurrentFrame } from "remotion";
import { fonte, marca } from "../../marca";
import { Logo } from "../Logo";
import { Cartao, Ilustracao } from "../Painel";
import { chegada, entra, FPS, q } from "../tempo";
import palavras from "../palavras.json";

// "Enfim, seu esforço precisa aparecer no lucro, não é mesmo?"
export const Cena9Esforco: React.FC = () => {
  const frame = useCurrentFrame();
  const esf = entra(frame, q("esforço") - 4);
  const seta = entra(frame, q("aparecer") - 4, 12);
  const lucro = entra(frame, q("lucro", 2) - 4, 12);
  return (
    <>
      <Cartao style={{ left: 140, top: 260, width: 260, height: 250, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, ...chegada(esf, 40) }}>
        <Briefcase size={96} color={marca.ciano} strokeWidth={1.8} />
        <span style={{ fontWeight: 800, fontSize: 32, letterSpacing: 2 }}>ESFORÇO</span>
      </Cartao>
      <div style={{ position: "absolute", left: 425, top: 320, width: 190 * seta, height: 130, overflow: "hidden" }}>
        <ArrowRight size={130} color={marca.branco} strokeWidth={2.2} />
      </div>
      <Cartao
        style={{
          left: 640, top: 260, width: 260, height: 250, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 14, border: `4px solid rgba(92,225,230,${lucro})`,
          boxShadow: `0 0 ${50 * lucro}px rgba(92,225,230,0.5)`, ...chegada(lucro, 40),
        }}
      >
        <span style={{ fontWeight: 900, fontSize: 46, letterSpacing: 2, color: marca.ciano }}>LUCRO</span>
        <span style={{ fontWeight: 700, fontSize: 38, opacity: 0.85 }}>R$ ••••</span>
      </Cartao>
      <Ilustracao />
    </>
  );
};

const URL = "priceme.com.br";
const Endereco: React.FC<{ letras: number; top: number }> = ({ letras, top }) => (
  <div
    style={{
      position: "absolute", left: 140, top, width: 760, height: 100, borderRadius: 999, display: "flex",
      alignItems: "center", justifyContent: "center", background: marca.branco, color: marca.azul,
      fontFamily: fonte, fontWeight: 900, fontSize: 62, letterSpacing: 1, boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
    }}
  >
    {URL.slice(0, letras)}
    {letras < URL.length ? <span style={{ color: marca.ciano }}>|</span> : null}
  </div>
);

// "Acesse priceme.com.br" — logo e endereço digitado no ritmo da fala
export const Cena10Site: React.FC = () => {
  const frame = useCurrentFrame();
  const p = entra(frame, q("Acesse") - 4, 14);
  const ini = q("priceme.com.br");
  const fimFala = Math.round((palavras.find((w) => w.texto === URL)?.fim ?? 0) * FPS);
  const letras = Math.round(Math.min(1, Math.max(0, (frame - ini) / Math.max(1, fimFala - ini))) * URL.length);
  return (
    <div style={{ opacity: p }}>
      <Logo largura={640} style={{ left: 220, top: 180 }} />
      <Endereco letras={frame < ini ? 0 : letras} top={532} />
    </div>
  );
};

// "e descubra o que está ficando para você." + tela final para leitura
export const Cena11Final: React.FC = () => (
  <>
    <Logo largura={640} style={{ left: 220, top: 180 }} />
    <Endereco letras={URL.length} top={532} />
  </>
);
