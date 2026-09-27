# Kinnor Live — guia do site

Site oficial do Kinnor Live. Está no ar em **https://kinnor-live.servidor-doacoes.workers.dev**
(endereço provisório da Cloudflare, até ligar o domínio próprio).

## As pastas

| Pasta / arquivo | O que é |
|---|---|
| `public\` | o site que vai para a internet (páginas `.html`, estilos, scripts e imagens) |
| `public\assets\js\config.js` | **o único arquivo de configuração**: versão, links das lojas, doação, contato, Google |
| `instaladores\` | os instaladores (.exe, .apk, .ipa). Ficam só neste computador; vão para o GitHub pelo `PUBLICAR.bat` |
| `ferramentas\` | os programas que os `.bat` usam |
| `_material\` | material de referência (logo, fotos, telas do programa) |

## O dia a dia (dois cliques)

| Arquivo | Quando usar |
|---|---|
| `VER-SITE.bat` | ver o site no seu computador antes de publicar |
| `ATUALIZAR-SITE.bat` | depois de mudar o `config.js` ou alguma página: aplica as mudanças em todas as páginas |
| `ATUALIZAR-VERSAO.bat` | saiu versão nova do Kinnor Live (veja abaixo) |
| `PUBLICAR.bat` | colocar no ar: GitHub, instaladores e Cloudflare, tudo de uma vez |
| `GERAR-PIX.bat` | opcional: QR Code de Pix direto no site (se preencher `doacao.pix`) |

## Trocar informações

Abra `public\assets\js\config.js` no Bloco de Notas, mude e salve. Depois: `ATUALIZAR-SITE.bat` e `PUBLICAR.bat`.

- **Lojas:** quando o app sair na Google Play ou na App Store, cole o link em `android.playStore` / `ios.appStore`.
  Os selos passam a abrir a loja; enquanto estão vazios, mostram o aviso “Chegando à loja”.
- **Contato:** preencha `contato.email`, `contato.whatsapp` (ex.: `5511999999999`), `instagram`, `youtube`.
  Aparece no Suporte, na Privacidade e no rodapé. **As lojas exigem um contato na política de privacidade.**
- **Doação:** `doacao.pagina` já aponta para a página do Mercado Pago (Pix e cartão).
- **Google:** veja “Google Search Console e Analytics” em `PUBLICAR.md`.
- **Domínio próprio:** mude `site.url` (ex.: `https://www.kinnorlive.com.br`) e siga `PUBLICAR.md`.

## Nova versão do Kinnor Live

1. Copie os instaladores novos para a pasta `instaladores\`, com estes nomes:
   `KinnorLive-Setup-X.Y.Z.exe`, `KinnorLive-Android-X.Y.Z.apk` e (opcional) `KinnorLive-iPhone-X.Y.Z-sem-assinatura.ipa`.
2. Dois cliques em `ATUALIZAR-VERSAO.bat`: ele atualiza versão, data e tamanhos em todas as páginas.
3. Escreva as novidades em `public\download.html` (seção “O que mudou nesta versão”).
4. Dois cliques em `PUBLICAR.bat`: ele cria a Release no GitHub com os instaladores e publica o site.

## Editar textos

As páginas são arquivos `.html` comuns em `public\`, com comentários marcando cada seção.
O **cabeçalho e o rodapé** são editados só em `public\index.html`: o `ATUALIZAR-SITE.bat` copia para as outras páginas.
As **perguntas frequentes** de cada página viram dados para o Google automaticamente.

## Página da equipe (testes)

`https://kinnor-live.servidor-doacoes.workers.dev/equipe` — instaladores de Windows, Android e iPhone
com o passo a passo. Não aparece no Google nem no menu. Para tirar do ar: apague `public\equipe.html` e publique.
