// Confere todos os links e arquivos locais das páginas (href, src, srcset e âncoras #).
// Aceita os endereços amigáveis (/download → download.html), como na Cloudflare.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', 'public');
const pages = fs.readdirSync(root).filter((f) => f.endsWith('.html'));
let checked = 0;
const errors = [];

function resolveTarget(value) {
  const clean = value.split('#')[0].split('?')[0];
  if (clean === '' ) return null; // mesma página
  const rel = clean.replace(/^\.\//, '').replace(/^\//, '');
  let target = path.resolve(root, rel);
  if (rel === '' || rel === '.' || clean.endsWith('/')) target = path.join(target, 'index.html');
  if (!path.extname(target) && fs.existsSync(`${target}.html`)) target = `${target}.html`;
  return target;
}

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8').replace(/<base\b[^>]*>/, '');
  const values = [];
  for (const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) values.push(m[1]);
  for (const m of html.matchAll(/\bsrcset="([^"]+)"/g)) m[1].split(',').forEach((part) => values.push(part.trim().split(/\s+/)[0]));
  for (const value of values) {
    if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(value)) continue;
    checked += 1;
    const [, fragment] = value.split('#');
    const target = resolveTarget(value) || path.join(root, page);
    if (!target.startsWith(root) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
      errors.push(`${page}: ${value}`);
      continue;
    }
    if (fragment && target.endsWith('.html')) {
      const targetHtml = fs.readFileSync(target, 'utf8');
      if (!targetHtml.includes(`id="${decodeURIComponent(fragment)}"`)) errors.push(`${page}: âncora ${value}`);
    }
  }
}

errors.forEach((e) => console.error(e));
console.log(`${checked} referências locais em ${pages.length} páginas; ${errors.length} com problema.`);
if (errors.length) process.exitCode = 1;
