// Jana Logos.gs (data URI WebP kecil) daripada tools/assets/logo-utm.png dan logo-utmxcite.png.
// Guna: NODE_PATH=$(npm root -g) node tools/make_slide_logos.js
// Logo ini hanya dimuat apabila "Cetak slide" ditekan (api_slideLogos), jadi saiz halaman tidak bertambah.
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => {
  const dir = path.join(__dirname, 'assets'), b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const p = await b.newPage();
  const conv = async (file, maxW) => p.evaluate(async ({ src, maxW }) => {
    const im = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    const s = Math.min(1, maxW / im.naturalWidth), c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); return c.toDataURL('image/webp', 0.92);
  }, { src: 'data:image/png;base64,' + fs.readFileSync(path.join(dir, file)).toString('base64'), maxW });
  const utm = await conv('logo-utm.png', 240), xc = await conv('logo-utmxcite.png', 480);
  fs.writeFileSync(path.join(__dirname, '..', 'Logos.gs'), '/** Logo kulit slaid (dijana oleh tools/make_slide_logos.js). Dimuat hanya apabila "Cetak slide" ditekan. */\nvar SLIDE_LOGOS = {\n  utm: "' + utm + '",\n  xcite: "' + xc + '"\n};\n');
  console.log('Logos.gs ditulis:', Math.round((utm.length + xc.length) / 1024), 'KB'); await b.close();
})();
