// Captura páginas inteiras com o Edge headless via CDP (sem dependências; Node 22+ tem WebSocket).
// Uso: node capturar.js <saida> <largura> <url1> [url2 ...]
// Gera <saida>/<pagina>-<largura>-NN.png (fatias de 1800 px de altura) e imprime erros de console,
// rolagem horizontal e elementos que passam da largura da tela.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const [outDir, widthArg, ...urls] = process.argv.slice(2);
const width = Number(widthArg);
const mobile = width < 700;
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
fs.mkdirSync(outDir, { recursive: true });

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cdp-'));
const port = 9300 + Math.floor(Math.random() * 500);
const edge = spawn(EDGE, [`--remote-debugging-port=${port}`, '--headless=new', `--user-data-dir=${profile}`, '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function target() {
  for (let i = 0; i < 50; i += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* ainda subindo */ }
    await sleep(200);
  }
  throw new Error('Edge não abriu');
}

(async () => {
  const ws = new WebSocket(await target());
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const pending = new Map();
  const logs = [];
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(msg.params.type)) logs.push(`console.${msg.params.type}: ${msg.params.args.map((a) => a.value || a.description).join(' ')}`);
    if (msg.method === 'Runtime.exceptionThrown') logs.push('EXCEÇÃO: ' + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text));
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') logs.push('log: ' + msg.params.entry.text + ' ' + (msg.params.entry.url || ''));
  });
  const send = (method, params = {}) => new Promise((r) => { id += 1; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });

  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height: mobile ? 844 : 900, deviceScaleFactor: 1, mobile });
  if (mobile) await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36' });

  for (const url of urls) {
    logs.length = 0;
    await send('Page.navigate', { url });
    await sleep(2500);
    // rola até o fim para disparar animações de entrada e lazy-loading
    const h0 = (await send('Runtime.evaluate', { expression: 'document.documentElement.scrollHeight', returnByValue: true })).result.result.value;
    for (let y = 0; y < h0; y += 500) { await send('Runtime.evaluate', { expression: `window.scrollTo({ top: ${y}, behavior: 'instant' })` }); await sleep(120); }
    await send('Runtime.evaluate', { expression: "window.scrollTo({ top: 0, behavior: 'instant' })" });
    await sleep(1200);
    const info = (await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const W = document.documentElement.clientWidth;
        const over = [];
        document.querySelectorAll('body *').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width && (r.right > W + 1 || r.left < -1)) {
            const cs = getComputedStyle(el);
            let p = el.parentElement, clipped = false;
            while (p) { const s = getComputedStyle(p); if (/(hidden|clip|auto|scroll)/.test(s.overflowX)) { clipped = true; break; } p = p.parentElement; }
            if (!clipped && cs.position !== 'fixed') over.push(el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').join('.') : '') + ' ' + Math.round(r.left) + '→' + Math.round(r.right));
          }
        });
        return { h: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, W, over: over.slice(0, 12), title: document.title };
      })()`,
    })).result.result.value;
    const name = (new URL(url).pathname.replace(/\//g, '') || 'index').replace('.html', '') + '-' + width;
    const slice = 1800;
    const n = Math.ceil(info.h / slice);
    await send('Emulation.setDeviceMetricsOverride', { width, height: mobile ? 844 : 900, deviceScaleFactor: 1, mobile });
    for (let i = 0; i < n; i += 1) {
      const y = i * slice;
      const hh = Math.min(slice, info.h - y);
      const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y, width, height: hh, scale: 1 } });
      fs.writeFileSync(path.join(outDir, `${name}-${String(i + 1).padStart(2, '0')}.png`), Buffer.from(shot.result.data, 'base64'));
    }
    console.log(`\n== ${url} (${width}px) — "${info.title}" altura ${info.h}px, ${n} fatias`);
    console.log(info.sw > info.W ? `ROLAGEM HORIZONTAL: scrollWidth ${info.sw} > ${info.W}` : 'sem rolagem horizontal');
    if (info.over.length) console.log('Elementos além da tela:\n  ' + info.over.join('\n  '));
    console.log(logs.length ? 'Console:\n  ' + [...new Set(logs)].join('\n  ') : 'console limpo');
  }
  ws.close();
  edge.kill();
  setTimeout(() => { try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* ok */ } process.exit(0); }, 500);
})().catch((e) => { console.error(e); edge.kill(); process.exit(1); });
