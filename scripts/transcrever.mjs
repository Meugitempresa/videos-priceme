// Transcreve um take com tempos por palavra usando o whisper.cpp (local e gratuito).
// Uso: node scripts/transcrever.mjs public/take.mp4 out/transcricao.json
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
} from "@remotion/install-whisper-cpp";

const [entrada = "public/take.mp4", saida = "out/transcricao.json"] =
  process.argv.slice(2);
const whisperPath = path.resolve("whisper.cpp");
const modelo = "medium";

await installWhisperCpp({ to: whisperPath, version: "1.5.5" });
await downloadWhisperModel({ model: modelo, folder: whisperPath });

// O whisper.cpp precisa de WAV 16 kHz mono
const wav = path.resolve("out/take-16k.wav");
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", entrada, "-ar", "16000", "-ac", "1", wav]);

const resultado = await transcribe({
  inputPath: wav,
  whisperPath,
  model: modelo,
  language: "pt",
  tokenLevelTimestamps: true,
});
const { captions } = toCaptions({ whisperCppOutput: resultado });
writeFileSync(saida, JSON.stringify(captions, null, 2));
console.log(captions.map((c) => c.text).join(""));
