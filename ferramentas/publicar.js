// PUBLICAR.bat — coloca o site no ar.
//   1. sincroniza as páginas com o config.js e confere os links;
//   2. guarda as mudanças no GitHub (repositório do site);
//   3. se a versão do config.js ainda não tem Release no GitHub, cria a Release com os
//      instaladores da pasta instaladores\ — são esses arquivos que os botões do site baixam;
//   4. publica a pasta public\ na Cloudflare Pages.
// Precisa do Git, do GitHub CLI (gh) e do wrangler da Cloudflare já logados nesta máquina.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');

const CLOUDFLARE_PROJECT = 'kinnor-live';

const root = path.resolve(__dirname, '..');
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8', shell: process.platform === 'win32', ...opts });
const quiet = (cmd, args) => {
  try { return run(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] }); } catch { return null; }
};

(async () => {
  console.log('1/4 Sincronizando as páginas...');
  execFileSync(process.execPath, [path.join(__dirname, 'sincronizar.js')], { stdio: 'inherit' });
  execFileSync(process.execPath, [path.join(__dirname, 'verificar-links.js')], { stdio: 'inherit' });

  const { KINNOR } = await import(`${pathToFileURL(path.join(root, 'public', 'assets', 'js', 'config.js')).href}?t=${Date.now()}`);
  const versao = KINNOR.versao;

  console.log('\n2/4 Guardando no GitHub...');
  run('git', ['add', '-A']);
  const pending = quiet('git', ['diff', '--cached', '--name-only']);
  if (pending && pending.trim()) run('git', ['commit', '-m', `"Atualiza o site (versão ${versao})"`], { stdio: 'inherit' });
  else console.log('Nenhuma mudança desde a última publicação.');
  run('git', ['push'], { stdio: 'inherit' });

  console.log('\n3/4 Instaladores...');
  const repo = (KINNOR.downloads || '').match(/github\.com\/([^/]+\/[^/]+)\/releases\/download\//);
  if (!repo) {
    console.log('config.downloads não aponta para o GitHub: envie os instaladores para a hospedagem manualmente.');
  } else if (quiet('gh', ['release', 'view', `v${versao}`, '--repo', repo[1]])) {
    console.log(`A Release v${versao} já existe no GitHub: instaladores mantidos.`);
  } else {
    const folder = path.join(root, 'instaladores');
    const assets = [KINNOR.windows.arquivo, KINNOR.android.apk, KINNOR.ios && KINNOR.ios.ipa]
      .filter(Boolean).map((f) => path.join(folder, f));
    const missing = assets.filter((f) => !fs.existsSync(f));
    if (missing.length) throw new Error(`Faltam na pasta instaladores: ${missing.map((f) => path.basename(f)).join(', ')}`);
    console.log(`Criando a Release v${versao} e enviando os instaladores (pode levar alguns minutos)...`);
    run('gh', ['release', 'create', `v${versao}`, ...assets.map((a) => `"${a}"`), '--repo', repo[1],
      '--title', `"Kinnor Live ${versao}"`, '--notes', `"Instaladores do Kinnor Live ${versao}. Baixe pelo site: ${KINNOR.site.url}/download"`],
    { stdio: 'inherit' });
  }

  console.log('\n4/4 Publicando na Cloudflare...');
  run('npx', ['--yes', 'wrangler@4', 'pages', 'deploy', 'public', '--project-name', CLOUDFLARE_PROJECT, '--branch', 'main', '--commit-dirty=true'], { stdio: 'inherit' });

  console.log(`\nPronto! Site no ar: ${KINNOR.site.url}/`);
})().catch((error) => {
  console.error(`\nErro: ${error.message}`);
  process.exitCode = 1;
});
