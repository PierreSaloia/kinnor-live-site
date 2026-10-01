// ATUALIZAR-SITE.bat — aplica o config.js em todas as páginas de public/.
//   • cabeçalho e rodapé: copiados da página inicial (index.html) para as outras;
//   • versão, data, tamanhos, requisitos, links de download e das lojas;
//   • endereço do site: canonical, Open Graph, dados estruturados, sitemap, robots, 404;
//   • FAQ do Google (FAQPage) gerado a partir das perguntas de cada página;
//   • versão nos links do CSS/JS (o navegador baixa de novo só quando o arquivo muda);
//   • verificação do Google Search Console e _headers da Cloudflare.
// Rode depois de editar o config.js ou qualquer página.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..', 'public');
const stateFile = path.join(__dirname, 'sitemap-datas.json');

// Ordem e prioridade no sitemap (as demais páginas .html entram no fim).
const SITEMAP = [
  ['index.html', '1.0'],
  ['download.html', '0.9'],
  ['camera-para-igreja.html', '0.9'],
  ['stories-com-audio-da-mesa.html', '0.9'],
  ['transmissao-ao-vivo-para-igrejas.html', '0.9'],
  ['retorno-de-audio-no-celular.html', '0.8'],
  ['como-transmitir-culto-com-celular.html', '0.8'],
  ['suporte.html', '0.6'],
  ['privacidade.html', '0.3'],
  ['termos.html', '0.3'],
];

const mb = (bytes) => `${Math.round(bytes / 1048576)} MB`;
const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const stripTags = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const hashOf = (text) => crypto.createHash('sha256').update(text).digest('hex').slice(0, 10);
const slug = (page) => (page === 'index.html' ? '' : page.replace(/\.html$/, ''));

// Troca o texto de todo elemento marcado com o atributo (ex.: <span data-version>…</span>).
function setText(html, attr, value) {
  const re = new RegExp(`(<(\\w+)\\b[^>]*\\s${attr}(?=[\\s>=/])[^>]*>)([^<]*)(</\\2>)`, 'g');
  return html.replace(re, (_, open, _tag, _old, close) => `${open}${escapeHtml(value)}${close}`);
}

// Troca um atributo das tags marcadas com o atributo indicado.
function setAttr(html, marker, attr, value) {
  return html.replace(/<(?:a|link|meta|script)\b[^>]*>/g, (tag) => {
    if (!new RegExp(`\\s${marker}(?=[\\s>=/])`).test(tag)) return tag;
    return tag.replace(new RegExp(`\\b${attr}="[^"]*"`), `${attr}="${escapeHtml(value)}"`);
  });
}

// Links das lojas: o endereço real quando existir; senão, a seção da página de download.
function setStore(html, store, url, onDownloadPage) {
  const anchor = store === 'android' ? 'android' : 'iphone';
  const href = url || (onDownloadPage ? `#${anchor}` : `download#${anchor}`);
  return html.replace(/<a\b[^>]*>/g, (tag) =>
    tag.includes(`data-store="${store}"`) ? tag.replace(/\bhref="[^"]*"/, `href="${escapeHtml(href)}"`) : tag);
}

// Bloco entre <!-- NOME ... --> e <!-- /NOME -->.
const blockRe = (name) => new RegExp(`<!-- ${name}[^>]*-->[\\s\\S]*?<!-- \\/${name} -->`);
function getBlock(html, name) {
  const m = html.match(new RegExp(`<!-- ${name}[^>]*-->([\\s\\S]*?)<!-- \\/${name} -->`));
  if (!m) throw new Error(`Bloco ${name} não encontrado na página inicial.`);
  return m[1];
}

// FAQPage a partir de <div data-faq><details><summary>…</summary><p>…</p></details>…
function faqSchema(html) {
  const list = html.match(/<div[^>]*\sdata-faq[\s>][\s\S]*?<\/div>/);
  if (!list) return null;
  const items = [...list[0].matchAll(/<details>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)]
    .map(([, q, a]) => ({
      '@type': 'Question',
      name: decode(stripTags(q)),
      acceptedAnswer: { '@type': 'Answer', text: decode(stripTags(a)) },
    }));
  if (!items.length) return null;
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items };
}

(async () => {
  const configUrl = pathToFileURL(path.join(root, 'assets', 'js', 'config.js')).href;
  const { KINNOR, linkDownload } = await import(`${configUrl}?t=${Date.now()}`);

  const site = KINNOR.site.url.replace(/\/+$/, '');
  const siteUrl = new URL(site);
  if (siteUrl.protocol !== 'https:') throw new Error('site.url precisa começar com https://');
  const base = siteUrl.pathname.replace(/\/?$/, '/');
  const date = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${KINNOR.dataVersao}T12:00:00Z`));
  const winUrl = linkDownload(KINNOR.windows.arquivo);
  const apkUrl = linkDownload(KINNOR.android.apk);
  const gsc = ((KINNOR.google && KINNOR.google.searchConsole) || '').trim();

  const assetVersion = hashOf(
    fs.readFileSync(path.join(root, 'assets', 'css', 'site.css')) +
    fs.readFileSync(path.join(root, 'assets', 'js', 'main.js')) +
    fs.readFileSync(path.join(root, 'assets', 'js', 'config.js')),
  );

  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const header = getBlock(indexHtml, 'CABEÇALHO');
  const footer = getBlock(indexHtml, 'RODAPÉ');

  const pages = fs.readdirSync(root).filter((f) => f.endsWith('.html'));
  const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : {};
  const today = new Date().toISOString().slice(0, 10);
  const noindex = new Set();

  for (const page of pages) {
    const file = path.join(root, page);
    let html = fs.readFileSync(file, 'utf8');

    // Endereço antigo (descoberto pela imagem de compartilhamento) → endereço novo.
    const old = html.match(/content="(https?:\/\/[^"]+?)\/assets\/img\/og-kinnor-live\.png"/);
    if (old && old[1] !== site) html = html.split(old[1]).join(site);

    if (page !== 'index.html') {
      html = html.replace(blockRe('CABEÇALHO'), `<!-- CABEÇALHO -->${header}<!-- /CABEÇALHO -->`);
      html = html.replace(blockRe('RODAPÉ'), `<!-- RODAPÉ -->${footer}<!-- /RODAPÉ -->`);
    }

    html = setText(html, 'data-version', KINNOR.versao);
    html = setText(html, 'data-date', date);
    html = setText(html, 'data-win-size', mb(KINNOR.windows.tamanhoBytes));
    html = setText(html, 'data-apk-size', mb(KINNOR.android.tamanhoBytes));
    html = setText(html, 'data-win-requirements', KINNOR.windows.requisitos);
    html = setText(html, 'data-apk-requirements', KINNOR.android.requisitos);
    html = setAttr(html, 'data-win-download', 'href', winUrl);
    html = setAttr(html, 'data-smart-download', 'href', winUrl);
    html = setAttr(html, 'data-apk-download', 'href', apkUrl);
    if (KINNOR.ios && KINNOR.ios.ipa) {
      html = setAttr(html, 'data-ipa-download', 'href', linkDownload(KINNOR.ios.ipa));
      html = setText(html, 'data-ipa-size', mb(KINNOR.ios.tamanhoBytes));
      html = setText(html, 'data-ipa-requirements', KINNOR.ios.requisitos);
    }
    html = setStore(html, 'android', KINNOR.android.playStore, page === 'download.html');
    html = setStore(html, 'ios', KINNOR.ios.appStore, page === 'download.html');

    // URL amigável (sem .html): a Cloudflare serve /download a partir de download.html.
    const pageUrl = `${site}/${slug(page)}`;
    html = setAttr(html, 'data-canonical', 'href', pageUrl);
    html = setAttr(html, 'data-og-url', 'content', pageUrl);
    html = setAttr(html, 'data-og-image', 'content', `${site}/assets/img/og-kinnor-live.png`);

    // Versão dos arquivos para o cache.
    html = html.replace(/(<link\b[^>]*href=")assets\/css\/site\.css(?:\?v=[^"]*)?("[^>]*data-asset)/, `$1assets/css/site.css?v=${assetVersion}$2`);
    html = html.replace(/(<script\b[^>]*src=")assets\/js\/main\.js(?:\?v=[^"]*)?("[^>]*data-asset)/, `$1assets/js/main.js?v=${assetVersion}$2`);

    // Google Search Console.
    html = html.replace(/\n\s*<meta name="google-site-verification"[^>]*>/g, '');
    if (gsc && page !== '404.html') {
      html = html.replace(/(\n\s*<meta name="robots"[^>]*>)/, `$1\n    <meta name="google-site-verification" content="${escapeHtml(gsc)}" />`);
    }

    // Dados estruturados que dependem da versão.
    html = html.replace(/("softwareVersion":\s*")[^"]*(")/g, `$1${KINNOR.versao}$2`);
    html = html.replace(/("downloadUrl":\s*")[^"]*(")/g, `$1${winUrl}$2`);
    html = html.replace(/("fileSize":\s*")[^"]*(")/g, `$1${mb(KINNOR.windows.tamanhoBytes)}$2`);

    // FAQPage.
    const faq = faqSchema(html);
    html = html.replace(/(<script type="application\/ld\+json" data-faq-schema>)[\s\S]*?(<\/script>)/, (_, open, close) =>
      faq ? `${open}\n      ${JSON.stringify(faq)}\n    ${close}` : `${open}${close}`);

    if (page === '404.html') html = html.replace(/<base href="[^"]*"/, `<base href="${base}"`);

    fs.writeFileSync(file, html, 'utf8');

    // Páginas fora do Google (noindex) não entram no sitemap.
    if (/name="robots" content="noindex/.test(html)) noindex.add(page);
    // Data de atualização para o sitemap (muda só quando a página muda).
    const h = hashOf(html.replace(/\?v=[a-f0-9]+/g, ''));
    if (!state[page] || state[page].hash !== h) state[page] = { hash: h, data: today };
  }
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n', 'utf8');

  // sitemap.xml
  const listed = SITEMAP.filter(([p]) => pages.includes(p))
    .concat(pages.filter((p) => p !== '404.html' && !noindex.has(p) && !SITEMAP.some(([s]) => s === p)).map((p) => [p, '0.5']));
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...listed.map(([p, prio]) =>
      `  <url><loc>${site}/${slug(p)}</loc><lastmod>${state[p].data}</lastmod><priority>${prio}</priority></url>`),
    '</urlset>',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap, 'utf8');
  fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`, 'utf8');

  // _headers (Cloudflare Pages): segurança e cache.
  const provisional = /\.(workers|pages)\.dev$/.test(siteUrl.hostname);
  const headers = [
    '# Gerado pelo ATUALIZAR-SITE.bat (ferramentas/sincronizar.js). Não edite à mão.',
    '/*',
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  X-Frame-Options: SAMEORIGIN',
    '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()',
    '  Strict-Transport-Security: max-age=31536000; includeSubDomains',
    '',
    '/assets/img/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '/assets/fonts/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '/assets/css/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '/assets/js/*',
    '  Cache-Control: public, max-age=3600, stale-while-revalidate=86400',
    '/favicon.ico',
    '  Cache-Control: public, max-age=604800',
    '/site.webmanifest',
    '  Cache-Control: public, max-age=86400',
    '/sitemap.xml',
    '  Cache-Control: public, max-age=3600',
    // Instruções para o agente (texto com acentos) — fora do Google.
    '/agente-iphone.txt',
    '  Content-Type: text/plain; charset=utf-8',
    '  X-Robots-Tag: noindex',
    '',
  ];
  fs.writeFileSync(path.join(root, '_headers'), headers.join('\n'), 'utf8');

  // Com domínio próprio, o endereço provisório *.workers.dev é desligado (sem conteúdo duplicado no Google).
  const wranglerFile = path.resolve(root, '..', 'wrangler.jsonc');
  if (fs.existsSync(wranglerFile)) {
    const wrangler = fs.readFileSync(wranglerFile, 'utf8');
    fs.writeFileSync(wranglerFile, wrangler.replace(/"workers_dev":\s*(true|false)/, `"workers_dev": ${provisional}`), 'utf8');
  }

  console.log(`Site atualizado: ${site}/`);
  console.log(`Versão ${KINNOR.versao} (${date}) · ${pages.length} páginas · arquivos v=${assetVersion}`);
  console.log(`Windows: ${winUrl}`);
  console.log(`Android: ${apkUrl}`);
  if (!gsc) console.log('Google Search Console: sem código de verificação (campo google.searchConsole vazio).');
  if (!KINNOR.google || !KINNOR.google.analytics) console.log('Google Analytics: desligado (campo google.analytics vazio).');
})().catch((error) => {
  console.error(`Erro: ${error.message}`);
  process.exitCode = 1;
});
