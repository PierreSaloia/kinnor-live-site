// Gere o QR Code Pix sem valor fixo. Para um ensaio, passe --chave, --nome, --cidade e --saida.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const site = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const arg = name => { const i = args.indexOf(name); return i < 0 ? '' : args[i + 1] || ''; };
const testMode = ['--chave', '--nome', '--cidade'].some(a => args.includes(a));

async function main() {
  const configPath = path.join(site, 'public', 'assets', 'js', 'config.js');
  const { KINNOR } = await import(pathToFileURL(configPath).href);
  const pix = testMode ? { chave: arg('--chave'), nome: arg('--nome'), cidade: arg('--cidade') } : KINNOR.doacao.pix;
  if (!pix.chave || !pix.nome || !pix.cidade) throw new Error('Preencha chave, nome e cidade do Pix no config.js.');
  const { pixCode } = await import(pathToFileURL(path.join(site, 'public', 'assets', 'js', 'pix.js')).href);
  const qrcode = require(path.resolve(site, '..', 'desktop', 'node_modules', 'qrcode'));
  const code = pixCode({ key: pix.chave, name: pix.nome, city: pix.cidade, amount: 0 });
  const svg = await qrcode.toString(code, { type: 'svg', width: 320, margin: 2, color: { dark: '#071326', light: '#ffffffff' }, errorCorrectionLevel: 'M' });
  const output = arg('--saida') ? path.resolve(arg('--saida')) : path.join(site, 'public', 'assets', 'img', 'pix-qr.svg');
  if (testMode && !arg('--saida')) throw new Error('Use --saida para não substituir o QR oficial durante um ensaio.');
  fs.writeFileSync(output, svg, 'utf8');
  console.log(`QR Code Pix criado: ${output}`);
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
