// Nova versão do Kinnor Live: copie os instaladores para instaladores/
// (KinnorLive-Setup-X.Y.Z.exe e KinnorLive-Android-X.Y.Z.apk) e rode ATUALIZAR-VERSAO.bat.
// Este script atualiza versão, data, nomes e tamanhos no config.js e depois sincroniza as páginas.
// Opcional: --data AAAA-MM-DD (padrão: hoje).
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const downloads = path.join(root, 'instaladores');
const configPath = path.join(root, 'public', 'assets', 'js', 'config.js');

const files = fs.existsSync(downloads) ? fs.readdirSync(downloads) : [];
function newest(pattern, label) {
  const found = files.map((file) => ({ file, match: file.match(pattern) })).filter((x) => x.match);
  if (!found.length) throw new Error(`Instalador de ${label} não encontrado em public\\downloads.`);
  found.sort((a, b) => b.match[1].localeCompare(a.match[1], undefined, { numeric: true }));
  return { file: found[0].file, version: found[0].match[1] };
}

const win = newest(/^KinnorLive-Setup-(\d+\.\d+\.\d+)\.exe$/, 'Windows');
const apk = newest(/^KinnorLive-Android-(\d+\.\d+\.\d+)\.apk$/, 'Android');
if (win.version !== apk.version) {
  throw new Error(`Versões diferentes: Windows ${win.version} e Android ${apk.version}. Confira os nomes dos arquivos.`);
}

// App do iPhone de teste (opcional): KinnorLive-iPhone-X.Y.Z-sem-assinatura.ipa
const ipa = files.map((file) => ({ file, match: file.match(/^KinnorLive-iPhone-(\d+\.\d+\.\d+).*\.ipa$/) }))
  .filter((x) => x.match && x.match[1] === win.version)[0];

const argData = process.argv.indexOf('--data');
const data = argData > 0 ? process.argv[argData + 1] : new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) throw new Error('Use --data AAAA-MM-DD.');

const size = (file) => fs.statSync(path.join(downloads, file)).size;
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(path.join(downloads, file))).digest('hex').toUpperCase();

let config = fs.readFileSync(configPath, 'utf8');
function set(pattern, value, label) {
  if (!pattern.test(config)) throw new Error(`Campo ${label} não encontrado no config.js.`);
  config = config.replace(pattern, (_, prefix) => prefix + value);
}
set(/(versao: )'[^']*'/, `'${win.version}'`, 'versao');
set(/(dataVersao: )'[^']*'/, `'${data}'`, 'dataVersao');
set(/(windows: \{[\s\S]*?arquivo: )'[^']*'/, `'${win.file}'`, 'windows.arquivo');
set(/(windows: \{[\s\S]*?tamanhoBytes: )\d+/, size(win.file), 'windows.tamanhoBytes');
set(/(android: \{[\s\S]*?apk: )'[^']*'/, `'${apk.file}'`, 'android.apk');
set(/(android: \{[\s\S]*?tamanhoBytes: )\d+/, size(apk.file), 'android.tamanhoBytes');
if (ipa && /ipa: '/.test(config)) {
  set(/(ios: \{[\s\S]*?ipa: )'[^']*'/, `'${ipa.file}'`, 'ios.ipa');
  set(/(ios: \{[\s\S]*?tamanhoBytes: )\d+/, size(ipa.file), 'ios.tamanhoBytes');
}
fs.writeFileSync(configPath, config, 'utf8');

console.log(`config.js atualizado para a versão ${win.version} (${data}).`);
console.log(`  ${win.file}  SHA-256 ${sha256(win.file)}`);
console.log(`  ${apk.file}  SHA-256 ${sha256(apk.file)}`);
if (ipa) console.log(`  ${ipa.file}  SHA-256 ${sha256(ipa.file)}`);
console.log('');
execFileSync(process.execPath, [path.join(__dirname, 'sincronizar.js')], { stdio: 'inherit' });
console.log('');
console.log('Lembre de colocar o texto das novidades desta versão em public\\download.html.');
console.log('Para publicar (site + instaladores no GitHub), dê dois cliques em PUBLICAR.bat.');
