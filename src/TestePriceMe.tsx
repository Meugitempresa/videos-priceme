// Fontes embutidas (npm @fontsource): o render não depende de baixar do Google Fonts
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-800.css";
import "@fontsource/jetbrains-mono/latin-700.css";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { cores } from "./theme";

const inter = "Inter, sans-serif";
const mono = "'JetBrains Mono', monospace";

// Segura o render até as fontes estarem carregadas
const esperaFontes = delayRender("Carregando fontes");
Promise.all([
  document.fonts.load('400 40px "Inter"'),
  document.fonts.load('800 40px "Inter"'),
  document.fonts.load('700 40px "JetBrains Mono"'),
]).then(() => continueRender(esperaFontes));

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

// Chegada suave: ease-out ~0,6 s, saindo de desfoque e de 94 % do tamanho
const chegada = (frame: number, inicio: number) => {
  const p = interpolate(frame, [inicio, inicio + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  return {
    opacity: p,
    transform: `translateY(${(1 - p) * 40}px) scale(${0.94 + p * 0.06})`,
    filter: `blur(${(1 - p) * 8}px)`,
  };
};

const palavras = ["Seu", "esforço", "precisa", "aparecer", "no", "lucro"];

export const TestePriceMe: React.FC = () => {
  const frame = useCurrentFrame();
  // Leve aproximação contínua da câmera para nada ficar parado
  const zoom = interpolate(frame, [0, 90], [1, 1.04]);
  const linha = interpolate(frame, [20, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  const destaque = interpolate(frame, [55, 70], [1, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${cores.azulTopo} 0%, ${cores.azulFundo} 100%)`,
        color: cores.branco,
        fontFamily: inter,
      }}
    >
      {/* Grade azul discreta */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(80,140,220,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(80,140,220,0.08) 1px, transparent 1px)",
          backgroundSize: "90px 90px",
        }}
      />
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        {/* Título visível inteiro já no quadro 1 (capa) */}
        <div
          style={{
            position: "absolute",
            top: 300,
            left: 90,
            right: 130,
            fontFamily: mono,
            fontSize: 120,
            fontWeight: 700,
            letterSpacing: -2,
          }}
        >
          Price<span style={{ color: cores.verde }}>Me</span>
        </div>
        <div
          style={{
            position: "absolute",
            top: 480,
            left: 90,
            width: 860 * linha,
            height: 6,
            background: cores.verde,
            boxShadow: `0 0 24px ${cores.verde}`,
            borderRadius: 3,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 560,
            left: 90,
            right: 130,
            padding: "48px 56px",
            background: cores.vidro,
            border: "1px solid rgba(234,242,255,0.14)",
            borderRadius: 32,
            fontSize: 92,
            fontWeight: 800,
            lineHeight: 1.12,
          }}
        >
          {palavras.map((p) => (
            <span
              key={p}
              style={{
                display: "inline-block",
                marginRight: 24,
                color: p === "lucro" ? cores.verde : cores.branco,
                // A palavra de ênfase cresce de leve quando a linha termina
                transform: p === "lucro" ? `scale(${destaque})` : undefined,
                transformOrigin: "left bottom",
              }}
            >
              {p}
            </span>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            top: 1180,
            left: 90,
            fontFamily: mono,
            fontSize: 34,
            color: cores.ouro,
            ...chegada(frame, 40),
          }}
        >
          TESTE DE RENDER · 1080×1920 · 3 s
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
