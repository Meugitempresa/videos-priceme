import { TutorialLayout } from "../tutorial/Tutorial";
import legendas from "./legendas.json";
import { quadroDaTela } from "./sincronia";

// Parte 2: mesmo layout da Parte 1; a gravação da Julia (591 quadros) segue inteira, e o vídeo ganha
// uma entrada suave e um encerramento próprio (a janela da Julia fica no último quadro enquanto tudo esmaece).
export const DURACAO_TUTORIAL2 = 609; // 591 quadros da Julia + 18 de encerramento
export const Tutorial2: React.FC = () => (
  <TutorialLayout
    c={{
      pasta: "tutorial2",
      legendas,
      quadroDaTela,
      rotulo: "PARTE 2",
      ultimoQuadroJulia: 590,
      entrada: 8,
      saida: [588, 608],
    }}
  />
);
