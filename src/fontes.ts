// Fontes embutidas (npm @fontsource): o render não depende de baixar do Google Fonts
import "@fontsource/montserrat/latin-500.css";
import "@fontsource/montserrat/latin-700.css";
import "@fontsource/montserrat/latin-800.css";
import "@fontsource/montserrat/latin-900.css";
import { continueRender, delayRender } from "remotion";

const espera = delayRender("Carregando fontes");
Promise.all(
  ["500", "700", "800", "900"].map((peso) =>
    document.fonts.load(`${peso} 40px "Montserrat"`),
  ),
).then(() => continueRender(espera));
