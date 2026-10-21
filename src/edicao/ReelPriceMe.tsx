import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import "../fontes";
import { marca } from "../marca";
import { DemoMes, DemoProdutos, Encerramento } from "../v2/Demos";
import { Legenda } from "../v2/Legenda";
import { ProtagonistaCheia, ProtagonistaJanela } from "../v2/Protagonista";
import { CartaoResultado, Gancho, LogoNoAlto, Recado } from "../v2/Sobreposicoes";
import { cobertura, DEMOS } from "../v2/tempos";
import { DURACAO_TOTAL } from "./tempo";

// Montagem: a apresentadora em tela cheia é a base; demonstrações financeiras entram por cima
// (com ela numa janela) e cobrem os saltos de imagem do take; um único encerramento no fim.
export const ReelPriceMe: React.FC = () => {
  const frame = useCurrentFrame();
  const c = cobertura(frame);
  const Demo =
    frame >= DEMOS.final.de ? Encerramento : frame >= DEMOS.precisao.de - 1 ? DemoProdutos : DemoMes;
  return (
    <AbsoluteFill style={{ background: marca.azulNoite }}>
      <ProtagonistaCheia />
      {c < 1 ? (
        <>
          <Gancho />
          <LogoNoAlto />
          <CartaoResultado />
          <Recado />
        </>
      ) : null}
      {c > 0 ? (
        <AbsoluteFill style={{ clipPath: `inset(${(1 - c) * 100}% 0 0 0)` }}>
          <Demo />
        </AbsoluteFill>
      ) : null}
      <ProtagonistaJanela />
      <Legenda />
      <Audio src={staticFile("voz-tratada.wav")} />
    </AbsoluteFill>
  );
};

export const DURACAO_REEL = DURACAO_TOTAL;
