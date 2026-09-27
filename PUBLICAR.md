# Publicar o site Kinnor Live

## Como o site está hospedado

| Parte | Onde fica |
|---|---|
| Páginas do site | **Cloudflare** (Workers com arquivos estáticos), projeto `kinnor-live` — configuração em `wrangler.jsonc` |
| Instaladores (.exe, .apk, .ipa) | **GitHub Releases** do repositório público `PierreSaloia/kinnor-live-site`. Os botões do site baixam direto, sem abrir o GitHub. (A Cloudflare não aceita arquivos acima de 25 MB.) |
| Código do site | GitHub, repositório `PierreSaloia/kinnor-live-site` |

## Publicar

Dois cliques em **`PUBLICAR.bat`**. Ele:
1. sincroniza as páginas com o `config.js` e confere todos os links;
2. guarda as mudanças no GitHub;
3. se a versão é nova, cria a Release com os instaladores da pasta `instaladores\`;
4. publica a pasta `public\` na Cloudflare.

Precisa, neste computador: Git, GitHub CLI (`gh`, já logado) e o wrangler da Cloudflare (já logado).
Em outro computador: `gh auth login` e `npx wrangler@4 login`.

## Ligar o domínio próprio (ex.: kinnorlive.com.br)

1. Registre o domínio (Registro.br para `.com.br`) e adicione-o à Cloudflare (dash.cloudflare.com › Adicionar domínio).
   No Registro.br, troque os servidores DNS pelos que a Cloudflare mostrar.
2. Na Cloudflare: **Workers e Pages › kinnor-live › Configurações › Domínios e rotas › Adicionar › Domínio personalizado**:
   `www.kinnorlive.com.br` (e também `kinnorlive.com.br`).
3. Faça o endereço sem `www` levar ao com `www` (ou o contrário): **Regras › Regras de redirecionamento** › redirecionamento
   301 de `kinnorlive.com.br/*` para `https://www.kinnorlive.com.br/${1}` (modelo “Redirect from root to www”).
4. No `config.js`, troque `site.url` para `https://www.kinnorlive.com.br` e rode `PUBLICAR.bat`.
   Isso atualiza canonical, sitemap, dados do Google e **desliga o endereço provisório** `*.workers.dev`
   (o Google passa a ver só o domínio oficial).

## Google Search Console (aparecer no Google)

1. Entre em https://search.google.com/search-console e adicione a propriedade.
   - Com domínio próprio na Cloudflare, prefira **Domínio** (verificação por DNS: a Cloudflare adiciona o registro TXT).
   - Ou **Prefixo do URL** com a opção **Tag HTML**: copie só o código do `content="..."` para
     `google.searchConsole` no `config.js` e rode `PUBLICAR.bat`.
2. Em **Sitemaps**, envie `sitemap.xml`.
3. Em **Inspeção de URL**, peça a indexação da página inicial e das páginas de solução.
4. Bing: https://www.bing.com/webmasters › “Importar do Google Search Console”.

## Google Analytics 4

1. Em https://analytics.google.com crie uma propriedade e um fluxo **Web** com o endereço do site.
2. Copie o **ID da métricas** (`G-XXXXXXX`) para `google.analytics` no `config.js` e rode `PUBLICAR.bat`.
3. O site mostra um aviso de cookies (LGPD): o Analytics só carrega se o visitante aceitar.
   A política de privacidade já explica isso. Downloads e cliques em “Ofertar” viram eventos
   (`file_download`, `begin_checkout`).

## O que já está feito para o SEO

- Endereços amigáveis (`/camera-para-igreja`), redirecionamentos 301 (`public\_redirects`) e 404 própria.
- Título, descrição, canonical, Open Graph e Twitter Card únicos por página.
- Dados estruturados: Organization, WebSite, SoftwareApplication, MobileApplication, BreadcrumbList,
  FAQPage (gerado das perguntas de cada página) e HowTo (no guia).
- `sitemap.xml` com data de atualização, `robots.txt`, `lang="pt-BR"`, conteúdo 100% no HTML (sem depender de JavaScript).
- Imagens WebP com tamanhos por tela, carregamento sob demanda, fontes locais, cache longo com versão nos arquivos (`public\_headers`).
- Páginas de solução para as buscas das igrejas: câmera para igreja grátis, stories com o som da mesa,
  transmissão ao vivo, retorno no celular e o guia “como transmitir o culto com celular”.
