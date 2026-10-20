import { existsSync } from "node:fs";
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");

// No ambiente de nuvem do Claude Code já existe um Chromium headless instalado;
// usá-lo evita baixar outro navegador. No seu computador, o Remotion baixa o dele.
const chromiumNuvem =
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
if (existsSync(chromiumNuvem)) {
  Config.setBrowserExecutable(chromiumNuvem);
}
