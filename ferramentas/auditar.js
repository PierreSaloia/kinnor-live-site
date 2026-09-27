// Auditoria independente do site (supervisor): links locais, recursos externos, palavras proibidas, peso por página.
const fs = require('fs');
const path = require('path');
const root = process.argv[2] || 'E:/Baixados/Midi igreja/site/public';

const all = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p); else all.push(p);
  }
})(root);

const rel = (p) => path.relative(root, p).replace(/\\/g, '/');
const textFiles = all.filter((f) => /\.(html|css|js|mjs|json|webmanifest|xml|txt|svg|htaccess)$|_headers$|\.htaccess$/i.test(f));
const problems = [];

// 1) palavras proibidas
for (const f of textFiles) {
  const t = fs.readFileSync(f, 'utf8');
  if (/\bOBS\b/.test(t)) problems.push(`palavra OBS em ${rel(f)}`);
  if (/lorem ipsum/i.test(t)) problems.push(`lorem ipsum em ${rel(f)}`);
  if (/(\d[\.,]\d\s*★|estrelas|avalia[çc][õo]es de usu)/i.test(t)) problems.push(`possível nota/avaliação em ${rel(f)}`);
}

// 2) referências locais e externas em HTML/CSS
const refRe = /(?:href|src|srcset|poster|content)\s*=\s*"([^"]+)"|url\(\s*['"]?([^'")]+)['"]?\s*\)|import\s+[^'"]*['"]([^'"]+)['"]/g;
for (const f of textFiles.filter((x) => /\.(html|css|js)$/.test(x))) {
  const t = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = refRe.exec(t))) {
    let raw = m[1] || m[2] || m[3];
    if (!raw) continue;
    for (let u of raw.split(',').map((s) => s.trim().split(/\s+/)[0])) {
      if (!u || u.startsWith('#') || u.startsWith('data:') || u.startsWith('mailto:') || u.startsWith('tel:') || u.startsWith('javascript:') || u.includes('${')) continue;
      if (/^https?:\/\//.test(u)) {
        const allowed = /kinnorlive\.com\.br|workers\.dev|pages\.dev|github\.com\/PierreSaloia\/kinnor-live-site\/releases|mercadopago\.com\.br|apple\.com|cdn-apple\.com|altstore\.io|sideloadly\.io|schema\.org|w3\.org/;
        if (!allowed.test(u) && /^(href|src)/.test(m[0])) problems.push(`externo em ${rel(f)}: ${u}`);
        if (/^src|url\(/.test(m[0]) && /^https?:/.test(u)) problems.push(`recurso externo carregado em ${rel(f)}: ${u}`);
        continue;
      }
      if (/^[a-z]+:/i.test(u)) continue;
      if (m[0].startsWith('content') && !/\.(png|jpg|webp|svg|ico)$/.test(u)) continue;
      const clean = u.split('#')[0].split('?')[0];
      if (!clean) continue;
      const target = clean.startsWith('/') ? path.join(root, clean) : path.join(path.dirname(f), clean);
      let ok = fs.existsSync(target) || (!path.extname(target) && fs.existsSync(`${target}.html`));
      if (ok && fs.existsSync(target) && fs.statSync(target).isDirectory()) ok = fs.existsSync(path.join(target, 'index.html'));
      if (!ok) problems.push(`quebrado em ${rel(f)}: ${u}`);
    }
  }
}

// 3) peso das páginas (html + css + js + imagens não-lazy referenciadas diretamente)
const size = (p) => { try { return fs.statSync(p).size; } catch { return 0; } };
const kb = (n) => (n / 1024).toFixed(0) + ' KB';
console.log('Arquivos:', all.length, '| Total sem downloads:', kb(all.filter((f) => !f.includes('downloads')).reduce((a, f) => a + size(f), 0)));
const big = all.filter((f) => !f.includes('downloads') && size(f) > 300 * 1024).map((f) => `${rel(f)} ${kb(size(f))}`);
if (big.length) console.log('Arquivos > 300 KB:\n  ' + big.join('\n  '));
console.log(problems.length ? 'PROBLEMAS:\n  ' + [...new Set(problems)].join('\n  ') : 'Nenhum problema encontrado.');
