# Vídeos PriceMe

Reels verticais (1080×1920) da PriceMe feitos com [Remotion](https://www.remotion.dev) e a skill
**Bolo de Camadas** ([pcauhi/bolo-de-camadas](https://github.com/pcauhi/bolo-de-camadas), MIT), no estilo do nicho
**finanças**.

## Estrutura

- `.claude/skills/bolo-de-camadas/`: a skill (cópia do repositório original, com a licença MIT). O estilo usado é
  `nichos/financas.md`.
- `src/`: as composições do Remotion. `src/theme.ts` guarda as cores do nicho finanças.
- `public/`: coloque aqui o take (`public/take.mp4`) e as imagens.
- `out/`: os vídeos e quadros renderizados (fora do git).

## Requisitos

- Node.js 18 ou mais novo (testado com o 22)
- FFmpeg (opcional para o Remotion, que já traz o dele; usado para extrair quadros das referências)

## Comandos

```bash
npm install
npm run studio        # preview no navegador
npm run render:teste  # gera out/teste-priceme.mp4 (3 s, 1080×1920, 30 fps)
npm run still:teste   # gera um quadro de teste em PNG
```

As fontes (Inter e JetBrains Mono) vêm do npm (`@fontsource`), então o render não depende de internet.

## Licença do Remotion

O Remotion é gratuito para pessoas físicas e empresas de até 3 pessoas; acima disso precisa da licença de empresa
([remotion.dev/license](https://www.remotion.dev/license)).
