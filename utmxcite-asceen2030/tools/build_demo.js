#!/usr/bin/env node
/**
 * Bina prototaip pra-demo: SATU fail HTML (demo/utmxcite-demo.html) yang boleh dibuka terus dalam pelayar.
 * Ia menggabungkan kod sistem sebenar (.gs + UI) dengan simulasi Google (demo/shim.js) dan data contoh (demo/seed.js).
 *   node tools/build_demo.js
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const rd = (f) => fs.readFileSync(path.join(root, f), 'utf8');

const gs = ['Config', 'Util', 'Setup', 'Auth', 'Data', 'Files', 'Metrics', 'Admin', 'Logos', 'Code'].map((n) => '/* ' + n + '.gs */\n' + rd(n + '.gs')).join('\n;\n');
const parts = { gs, shim: rd('demo/shim.js'), seed: rd('demo/seed.js'), ui: rd('demo/demo-ui.js') };
Object.keys(parts).forEach((k) => { if (/<\/script/i.test(parts[k])) throw new Error('"</script" ditemui dalam ' + k + ': tidak selamat untuk disisip'); });

const html = `<!DOCTYPE html>
<html lang="ms">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>UTMXCITE ASCEND 2030 · Prototaip pra-demo</title>
${rd('Styles.html')}
</head>
<body>
<div id="app"><p class="boot">Memuatkan prototaip…</p></div>
<div id="toast" role="status" aria-live="polite"></div>
<script>/* Simulasi Google (demo/shim.js) */
${parts.shim}</script>
<script>/* Kod pelayar sebenar sistem: logik pelayan (.gs) */
${parts.gs}</script>
<script>/* Data contoh (demo/seed.js) */
${parts.seed}
/* Mulakan: pulih keadaan tersimpan atau sediakan sheet + data contoh */
(function () { if (!window.__demoRestore()) { var log = console.log; console.log = function () {}; setup(); console.log = log; window.__demoSeed(); window.__demoPersistNow(); } })();</script>
${rd('Logo.html')}
${rd('App.html')}
<script>/* Kawalan demo (demo/demo-ui.js) */
${parts.ui}</script>
</body>
</html>
`;
const out = path.join(root, 'demo', 'utmxcite-demo.html');
fs.writeFileSync(out, html);
console.log('Ditulis ' + path.relative(root, out) + ' (' + Math.round(html.length / 1024) + ' KB)');
