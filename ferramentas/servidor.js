// Servidor local sem dependências para ver a pasta public no navegador.
// Uso: node ferramentas/servidor.js [--abrir]   (porta livre escolhida sozinha; PORT=xxxx para fixar)
// Aceita também o caminho do site publicado (ex.: /kinnor-live-site/…), como no GitHub Pages.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');

const root = path.resolve(__dirname, '..', 'public');
const port = Number(process.env.PORT || 0);
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.exe': 'application/vnd.microsoft.portable-executable',
  '.apk': 'application/vnd.android.package-archive',
};

// Subpasta do endereço público (lida do config.js), para a página 404 funcionar igual ao site no ar.
let base = '/';
try {
  const config = fs.readFileSync(path.join(root, 'assets', 'js', 'config.js'), 'utf8');
  const url = config.match(/site:\s*\{\s*url:\s*'([^']+)'/);
  if (url) base = new URL(url[1]).pathname.replace(/\/?$/, '/');
} catch { /* usa a raiz */ }

http.createServer((req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (base !== '/' && pathname.startsWith(base)) pathname = '/' + pathname.slice(base.length);
  const file = path.resolve(root, '.' + pathname, pathname.endsWith('/') ? 'index.html' : '');
  if (!file.startsWith(root + path.sep) && file !== root) {
    res.writeHead(403);
    res.end();
    return;
  }
  // /download serve download.html, como na Cloudflare.
  const page = !path.extname(file) && fs.existsSync(`${file}.html`) ? `${file}.html` : file;
  fs.stat(page, (error, stat) => {
    const missing = error || !stat.isFile();
    const target = missing ? path.join(root, '404.html') : page;
    res.writeHead(missing ? 404 : 200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(target).pipe(res);
  });
}).listen(port, '127.0.0.1', function () {
  const url = `http://127.0.0.1:${this.address().port}/`;
  console.log(`Site disponível em ${url}`);
  console.log('Deixe esta janela aberta enquanto olha o site. Para parar, feche a janela.');
  if (process.argv.includes('--abrir')) {
    execFile('cmd.exe', ['/c', 'start', '', url], { windowsHide: true }, (error) => {
      if (error) console.log(`Abra ${url} no navegador.`);
    });
  }
});
