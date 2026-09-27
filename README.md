# Site do Kinnor Live

Site oficial do **Kinnor Live — Sua igreja ao vivo**: programa gratuito para igrejas que transforma os
celulares da equipe em câmeras sem fio, leva o som da mesa para os fones e para os stories e transmite
o culto ao vivo para várias redes ao mesmo tempo.

- Site: https://kinnor-live.pages.dev
- Downloads: https://kinnor-live.pages.dev/download (os instaladores ficam nas [Releases](../../releases))

## Estrutura

| Pasta | O que é |
|---|---|
| `public/` | o site publicado (HTML, CSS e JS puros, sem etapa de build) |
| `public/assets/js/config.js` | versão, links de download, lojas, doação, contato e Google — tudo o que muda |
| `ferramentas/` | scripts Node: sincronizar páginas, nova versão, publicar, conferir links, capturas |
| `_material/` | material de referência (marca, telas do programa, fotos) |

## Uso

| Arquivo | Para quê |
|---|---|
| `VER-SITE.bat` | abre o site no navegador, no próprio computador |
| `ATUALIZAR-SITE.bat` | aplica o `config.js` em todas as páginas (SEO, links, versão) |
| `ATUALIZAR-VERSAO.bat` | nova versão: lê os instaladores da pasta `instaladores/` |
| `PUBLICAR.bat` | GitHub + Release dos instaladores + Cloudflare Pages |

Detalhes em [LEIA-ME.md](LEIA-ME.md) e [PUBLICAR.md](PUBLICAR.md).
