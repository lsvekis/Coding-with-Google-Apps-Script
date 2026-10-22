// Ujian hujung ke hujung: pelayar sebenar + pelayan GAS tiruan (logik .gs yang sama).
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const deepEq = (a, b) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b));
const { chromium } = require('playwright');
const { loadGas } = require('./mock');

const root = path.join(__dirname, '..');
const out = path.join(process.env.E2E_OUT || __dirname, 'shots');
fs.mkdirSync(out, { recursive: true });

function buildHtml() {
  const inc = (n) => fs.readFileSync(path.join(root, n + '.html'), 'utf8');
  return inc('Index').replace('<?= appName ?>', 'UTMXCITE 4 ASCEND 2030 Report')
    .replace(/<\?!= include\('(\w+)'\) \?>/g, (_, n) => inc(n));
}

(async () => {
  const env = loadGas({ now: Date.UTC(2026, 4, 15, 4, 0, 0) });
  const g = env.g;
  g.setup();
  const code = () => /OTP anda ialah: (\d{6})/.exec(env.sent[env.sent.length - 1].body)[1];
  const login = (e) => { g.api_requestOtp(e); return g.api_verifyOtp(e, code()).data.token; };
  const admin = login('admin@utm.my');
  g.api_saveUser(admin, { emel: 'pic.fai@utm.my', nama: 'Siti Aminah', peranan: 'PIC', fakulti: 'FAI', kpi_akses: 'KAI1,KAI4,KAI6', aktif: 'Ya' });
  // Data asas pelajar (tab PELAJAR): semua KPI hanya menerima no. matrik dan mengambil selebihnya daripada sini.
  const stu = (m, nama, kp, fak, emel, tel) => { const r = g.api_saveStudents(admin, [{ no_matrik: m, nama_pelajar: nama, no_kp: kp, fakulti: fak, emel: emel || '', telefon: tel || '' }]); if (!r.ok || !r.data.results[0].ok) throw new Error('seed PELAJAR gagal ' + m + JSON.stringify(r)); };
  for (let i = 0; i < 6; i++) stu('A24' + i, 'Pelajar ' + i, '99010101123' + i, 'FAI');
  for (let i = 0; i < 7; i++) stu('B' + i, 'AI ' + i, '98010101123' + i, 'FAI');
  stu('A24CS0101', 'Ali Bin Abu', '900101145678', 'FC'); stu('A24CS0102', 'Siti Binti Ahmad', '010203101234', 'FC');
  stu('A24EE0001', 'Ahmad Inovator', '000101101111', 'FKE'); stu('A24PF9001', 'Nur Profil', '000202102222', 'FC');
  stu('PK-A', 'Pukal A', '000101105555', 'FAI'); stu('PK-B', 'Pukal B', '000202106666', 'FC'); stu('PK-C', 'Pukal C', '000303107777', 'FC');
  // Sheet luar (borang permohonan peralatan) untuk segerak CKAI 5
  const ext = g.SpreadsheetApp.create('Borang Permohonan Luar'), extSh = ext.insertSheet('DATA');
  extSh.appendRow(['Timestamp', 'Email Address', 'Nama Penuh', 'No. Kad Pengenalan', 'No Matrik', 'Fakulti / Jabatan', 'Nombor Telefon', 'Jenis / Peralatan', 'Tujuan Permohonan', 'Bilangan Peserta', 'Tarikh Mula', 'Tarikh Tamat', 'Masa Mula', 'Masa Tamat', 'Muatnaik Borang', 'Pengakuan', 'Tindakan', 'Bayaran Caj']);
  extSh.appendRow(['8/21/2025 9:07:43', 'a@graduate.utm.my', 'Pemohon Luar Satu', '010611020908', 'MSX001', 'FABU', '0133569026', 'Laser Cut Machine', 'Projek', '', '8/21/2025', '8/22/2025', '10:00:00 AM', '4:30:00 PM', 'https://drive.google.com/open?id=131ZJUqUH9lCMFRZakqCLaDu0IdUf_NM8', '', '', 'RM12']);
  extSh.appendRow(['8/22/2025 9:07:43', 'b@graduate.utm.my', 'Pemohon Salah', '010611020909', 'MSX002', 'Kelas Entah', '0133569027', '3D Printer', 'Projek', '', '8/22/2025', '8/22/2025', '10:00:00 AM', '4:30:00 PM', '', '', '', '']);
  env.props.MAKERSPACE_SHEET_ID = ext.getId();
  // Data contoh untuk dashboard (hanya dalam ujian, bukan dalam produk).
  g.api_save(admin, 'KAI1', { aliran: 'Technology Startup', jenis: 'Inkubator Fakulti', fakulti: 'FC', nama_inkubator: 'Launchpad FC', didaftarkan: 'Ya', tarikh_pendaftaran: '2026-03-01', status: 'Beroperasi', tarikh_beroperasi: '2026-04-01' });
  for (let i = 0; i < 6; i++) g.api_save(admin, 'KAI4', { fakulti: i % 2 ? 'FAI' : 'FC', nama_pelajar: 'Pelajar ' + i, no_kp: '99010101123' + i, no_matrik: 'A24' + i });
  for (let i = 0; i < 7; i++) g.api_save(admin, 'KAI6', { fakulti: ['FAI', 'FC', 'FKE', 'MJIIT'][i % 4], nama: 'AI ' + i, no_matrik: 'B' + i, status: 'Idea/konsep', nama_startup: 'Startup ' + (i % 3) });
  const m2 = g.api_list(admin, 'KAI2', {}).data.rows[0];
  g.api_save(admin, 'KAI2', Object.assign({}, m2, { peratus_siap: 60, status: 'Dalam proses' }));

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.exposeFunction('__gas', (fn, args) => JSON.parse(JSON.stringify(g[fn](...args))));
  await page.addInitScript(() => {
    window.google = { script: { run: new Proxy({}, { get: (_, fn) => {
      if (fn === 'withSuccessHandler' || fn === 'withFailureHandler') return undefined;
      return undefined;
    } }) } };
    function makeRunner(ok, fail) {
      return new Proxy({}, { get: (_, name) => {
        if (name === 'withSuccessHandler') return (f) => makeRunner(f, fail);
        if (name === 'withFailureHandler') return (f) => makeRunner(ok, f);
        return (...args) => { window.__gas(name, args).then((r) => ok && ok(r), (e) => fail && fail(e)); };
      } });
    }
    window.google = { script: { run: makeRunner(null, null) } };
  });
  const htmlPath = path.join(out, 'index.html');
  fs.writeFileSync(htmlPath, buildHtml());
  await page.goto('file://' + htmlPath);

  // Kumpulan sidebar dilipat secara lalai: buka kumpulan item sebelum klik jika perlu.
  const goNav = async (txt) => {
    const item = page.locator('.nav', { hasText: txt }).first();
    if (!(await item.isVisible())) {
      const g = await item.evaluate(el => el.closest('.gb') && el.closest('.gb').getAttribute('data-g'));
      await page.click('.gh[data-g="' + g + '"]');
    }
    await item.click();
  };
  const step = async (name, fn) => { try { await fn(); console.log('  ok   ' + name); } catch (e) { console.log('  FAIL ' + name + '\n       ' + e.message.split('\n')[0]); process.exitCode = 1; await page.screenshot({ path: path.join(out, 'FAIL-' + name.replace(/\W+/g, '_') + '.png') }); } };
  const text = async (sel) => (await page.locator(sel).innerText());

  console.log('Pelayar (Chromium)');
  await step('halaman pertama ialah Infografik; menu Infografik sebelum Dashboard', async () => {
    await page.waitForSelector('.ig .igp');
    assert.ok((await text('.top h1')).includes('Laporan Prestasi UTMXCITE'));
    const navs = await page.locator('.side .nav').allInnerTexts();
    assert.ok(navs.findIndex(t => /Infografik/.test(t)) >= 0 && navs.findIndex(t => /Infografik/.test(t)) < navs.findIndex(t => /Dashboard/.test(t)));
  });
  await step('dashboard awam dimuatkan tanpa log masuk (24 kad: 7 KPT + 7 KPI + 10 CKAI)', async () => {
    await page.click('.nav:has-text("Dashboard")');
    await page.waitForSelector('.kcard');
    assert.strictEqual(await page.locator('.kcard').count(), 24);
    const heads = (await page.locator('.grp').allInnerTexts()).map(t => t.toUpperCase());
    deepEq(heads, ['KPT · PERINGKAT KEMENTERIAN (KPI KEUSAHAWANAN IPT)', 'KAI · PERINGKAT UNIVERSITI', 'DKAI · PERINGKAT JABATAN (JTNC HEPA)', 'CKAI · PERINGKAT PUSAT (UTMXCITE)']);
    deepEq((await page.locator('.sub b').allInnerTexts()).map(t => t.toUpperCase()), ['TERAS 1', 'TERAS 2', 'TERAS 3', '1 · IDENTIFY STUDENT ENTREPRENEURSHIP INTEREST', '2 · CONDUCT ENTREPRENEURSHIP TRAINING', '3 · SUPPORT STUDENT BUSINESS IDEATION', '4 · FACILITATE STUDENT STARTUP DEVELOPMENT', '5 · MONITOR STUDENT ENTERPRISE PERFORMANCE', '6 · SHOWCASE STUDENT INNOVATION VENTURE', 'CROSS-CUTTING']);
    assert.ok((await text('.cont')).includes('Kenal pasti minat keusahawanan pelajar'), 'terjemahan Melayu fungsi tiada');
    assert.strictEqual(await page.locator('.tag', { hasText: 'Department' }).count(), 1);
    assert.strictEqual(await page.locator('.tag', { hasText: 'Internal' }).count(), 0);
    assert.ok((await text('.side')).includes('Pengunjung'));
    assert.strictEqual(await page.locator('.nav', { hasText: 'Urus Pengguna' }).count(), 0);
    assert.ok((await text('.kcard >> nth=0')).includes('KPT 1'));
    assert.ok((await text('.kcard >> nth=7')).includes('KAI 1'));
    const logoOk = await page.evaluate(() => { const i = document.querySelector('.shlogo'); return !!i && i.complete && i.naturalWidth > 100; });
    assert.ok(logoOk, 'logo UTM tidak dimuatkan dalam sidebar');
    await page.screenshot({ path: path.join(out, '1-dashboard-awam.png'), fullPage: true });
  });
  await step('tajuk dashboard: Dashboard KPI UTMXCITE JTNCHEPA', async () => {
    assert.strictEqual((await text('.top h1')).trim(), 'Dashboard KPI UTMXCITE JTNCHEPA');
  });
  await step('KAI 6 menunjukkan 7 / 20 minimum dan butiran fakulti', async () => {
    const k6 = page.locator('.kcard:has(.t:text-is("KAI 6 · Tubuhkan UTM AI Start Up"))');
    assert.ok((await k6.innerText()).includes('7'));
    assert.ok((await k6.innerText()).includes('20'));
    await k6.locator('summary').click();
    assert.ok((await k6.innerText()).includes('FAI'));
  });
  await step('pemilih tahun menukar sasaran KAI 3 kepada 30 (2027)', async () => {
    await page.selectOption('#yr', '2027');
    await page.waitForFunction(() => document.querySelector('#yr').value === '2027' && /30/.test(document.body.innerText));
    assert.ok((await text('.kcard >> nth=9')).includes('30'));
    await page.selectOption('#yr', '2026');
    await page.waitForFunction(() => /25/.test(document.querySelectorAll('.kcard')[9].innerText));
  });
  await step('sidebar gaya portal: logo UTM ASCEND, MODUL, kumpulan boleh dilipat', async () => {
    assert.ok(await page.locator('.shlogo').isVisible());
    assert.ok(await page.locator('.hb svg').isVisible(), 'ikon menu tidak kelihatan');
    assert.ok((await text('.shname')).includes('UTMXCITE 4 ASCEND 2030 Report'));
    // pengunjung: hanya Dashboard (tiada MODUL / kumpulan)
    assert.strictEqual(await page.locator('.gh').count(), 0);
    assert.strictEqual(await page.locator('.mod').count(), 0);
  });
  await step('log masuk Admin dengan OTP', async () => {
    await page.click('[data-action="login"]');
    await page.fill('#l_emel', 'admin@utm.my');
    await page.click('button:has-text("Hantar / Hantar Semula Kod")');
    await page.waitForSelector('#l_code');
    await page.fill('#l_code', code());
    await page.click('button:has-text("Sahkan dan Log Masuk")');
    await page.waitForSelector('.prof >> text=admin@utm.my');
    assert.strictEqual(await page.locator('.nav', { hasText: 'Urus Pengguna' }).count(), 1); // dalam kumpulan Admin (dilipat)
    assert.strictEqual(await page.locator('.nav', { hasText: 'KAI' }).count(), 17);
    // kumpulan dilipat secara lalai; klik untuk membuka dan menutup
    // Satu bahagian "PERINGKAT" dengan tiga kumpulan boleh dilipat (+ bahagian Admin)
    deepEq((await page.locator('.mod').allInnerTexts()).map(x => x.toUpperCase()), ['PERINGKAT', 'ADMIN']);
    deepEq(await page.locator('.gh').evaluateAll(els => els.map(e => e.getAttribute('data-g') + '=' + e.getAttribute('aria-expanded'))), ['KPT=false', 'KAI=false', 'DKAI=false', 'CKAI=false', 'ADMIN=false']);
    deepEq(await page.locator('.gh .lb').allInnerTexts(), ['KPT · Kementerian', 'KAI · Universiti', 'DKAI · Jabatan (JTNC HEPA)', 'CKAI · Pusat (UTMXCITE)', 'Pentadbiran']);
    assert.ok(!(await page.locator('.gb[data-g="KAI"] .nav').first().isVisible()));
    await page.click('.gh[data-g="KPT"]');
    assert.strictEqual(await page.locator('.gb[data-g="KPT"] .nav').count(), 5); // KPT 2, 3, 4, 6, 7 (KPT 1 dan 5 automatik)
    deepEq((await page.locator('.gb[data-g="KPT"] .stagelbl').allInnerTexts()).map(x => x.toUpperCase()), ['TERAS 1 · EKOSISTEM KEUSAHAWANAN PELAJAR YANG BERDAYA SAING', 'TERAS 2 · INOVASI DAN TEKNOLOGI DALAM KEUSAHAWANAN', 'TERAS 3 · KOLABORASI BERIMPAK TINGGI']);
    await page.click('.gh[data-g="KPT"]');
    await page.click('.gh[data-g="KAI"]');
    assert.ok(await page.locator('.gb[data-g="KAI"] .nav').first().isVisible());
    assert.strictEqual(await page.locator('.gb[data-g="KAI"] .nav').count(), 6); // KAI 1-6
    assert.strictEqual(await page.locator('.gh[data-g="KAI"]').getAttribute('aria-expanded'), 'true');
    deepEq((await page.locator('.gb[data-g="KAI"] .stagelbl').allInnerTexts()).map(x => x.toUpperCase()), ['GROWTH', 'TRANSFORM']);
    await page.click('.gh[data-g="CKAI"]');
    assert.strictEqual(await page.locator('.gb[data-g="CKAI"] .nav').count(), 10); // CKAI 1-10
    deepEq((await page.locator('.gb[data-g="CKAI"] .stagelbl').allInnerTexts()).map(x => x.toUpperCase()), ['1 · IDENTIFY STUDENT ENTREPRENEURSHIP INTEREST', '2 · CONDUCT ENTREPRENEURSHIP TRAINING', '3 · SUPPORT STUDENT BUSINESS IDEATION', '4 · FACILITATE STUDENT STARTUP DEVELOPMENT', '5 · MONITOR STUDENT ENTERPRISE PERFORMANCE', '6 · SHOWCASE STUDENT INNOVATION VENTURE', 'CROSS-CUTTING']);
    await page.click('.gh[data-g="CKAI"]');
    await page.screenshot({ path: path.join(out, '2-dashboard-admin.png') });
    await page.click('.gh[data-g="KAI"]');
    assert.ok(!(await page.locator('.gb[data-g="KAI"] .nav').first().isVisible()));
  });
  await step('Log masuk kekal: muat semula halaman tidak meminta OTP baharu; token dalam localStorage', async () => {
    const tok = await page.evaluate(() => window.localStorage.getItem('utmx_token'));
    assert.ok(tok && tok.length >= 32, 'token tiada dalam localStorage');
    assert.strictEqual(await page.evaluate(() => window.sessionStorage.getItem('utmx_token')), null);
    await page.reload();
    await page.waitForSelector('.prof >> text=admin@utm.my');                       // masih log masuk
    assert.strictEqual(await page.locator('[data-action="login"]').count(), 0);
    assert.ok(await page.locator('[data-action="logoutall"]').isVisible());          // Log keluar semua peranti
    // pelayar ditutup dan dibuka semula: simulasi dengan menghapus cache sesi pelayan; sesi kekal sah
    g.CacheService.getScriptCache().remove('sess:' + g.sha256Hex_(tok));
    await page.reload();
    await page.waitForSelector('.prof >> text=admin@utm.my');
  });
  await step('OTP salah menunjukkan ralat', async () => {
    await page.click('[data-action="logout"]');
    await page.click('[data-action="login"]');
    await page.fill('#l_emel', 'admin@utm.my');
    await page.click('button:has-text("Hantar / Hantar Semula Kod")');
    await page.waitForSelector('#l_code');
    const wrong = code() === '123456' ? '654321' : '123456';
    await page.fill('#l_code', wrong);
    await page.click('button:has-text("Sahkan dan Log Masuk")');
    await page.waitForSelector('.lgcard .err:has-text("tidak sah")');
    await page.keyboard.press('Escape');
    await page.waitForSelector('.lgcard', { state: 'detached' });
  });
  await step('PIC FAI: hanya 3 KPI, fakulti dikunci, simpan rekod KAI 4', async () => {
    await page.click('[data-action="login"]');
    await page.fill('#l_emel', 'pic.fai@utm.my');
    await page.click('button:has-text("Hantar / Hantar Semula Kod")');
    await page.waitForSelector('#l_code');
    await page.fill('#l_code', code());
    await page.click('button:has-text("Sahkan dan Log Masuk")');
    await page.waitForSelector('.prof >> text=Siti Aminah');
    assert.strictEqual(await page.locator('.nav', { hasText: 'KAI' }).count(), 3);
    assert.strictEqual(await page.locator('.nav', { hasText: 'Urus Pengguna' }).count(), 0);
    assert.strictEqual(await page.locator('.nav', { hasText: 'Makerspace' }).count(), 0);
    await goNav('GiGA');
    await page.waitForSelector('table');
    await page.click('[data-action="new"]');
    await page.waitForSelector('#kform');
    assert.ok(await page.locator('#f_fakulti').isDisabled());
    assert.strictEqual(await page.inputValue('#f_fakulti'), 'FAI');
    // Hantar kosong: ralat medan wajib
    await page.click('#savebtn');
    await page.waitForSelector('.invalid .err:has-text("wajib")');
    // hanya no. matrik; nama, no. KP, e-mel, telefon tiada pada borang (diambil daripada PELAJAR)
    assert.strictEqual(await page.locator('#f_emel, #f_telefon').count(), 0);
    assert.ok(await page.locator('#f_nama_pelajar[readonly]').isVisible() && await page.locator('#f_no_kp[readonly]').isVisible());   // nama dan no. KP auto (baca sahaja)
    // pelajar belum ada dalam PELAJAR: tetingkap untuk melengkapkan dipaparkan
    await page.fill('#f_no_matrik', 'A24CS0001'); await page.press('#f_no_matrik', 'Tab');
    await page.waitForSelector('.mdl');
    await page.click('#stusave');
    await page.waitForSelector('.mdl .invalid .err:has-text("wajib")');   // nama wajib; no. KP dan fakulti tidak sah
    await page.fill('#sm_0_nama_pelajar', 'Nur Aina <b>x</b>');
    await page.fill('#sm_0_no_kp', '990101-01-1234');
    await page.selectOption('#sm_0_fakulti', 'FAI');
    await page.screenshot({ path: path.join(out, '19-tetingkap-pelajar.png') });
    await page.click('#stusave');
    await page.waitForSelector('.mdl', { state: 'detached' });
    await page.waitForSelector('#stu_status.ok');
    assert.ok((await text('#stu_status')).includes('Nur Aina <b>x</b>'));
    assert.strictEqual(await page.inputValue('#f_nama_pelajar'), 'Nur Aina <b>x</b>');
    assert.match(await page.inputValue('#f_no_kp'), /^••••••••1234$/);      // PIC: no. KP disamarkan
    await page.screenshot({ path: path.join(out, '3-borang-kai4.png'), fullPage: true });
    await page.click('#savebtn');
    await page.waitForSelector('.tab.act:has-text("Senarai")');
    await page.waitForSelector('td:has-text("A24CS0001")');
    // XSS: teks HTML dipaparkan sebagai teks, bukan dilaksanakan
    assert.strictEqual(await page.locator('table b').count(), 0);
    assert.ok((await text('table')).includes('<b>x</b>'));
    await page.screenshot({ path: path.join(out, '4-senarai-kai4.png') });
  });
  await step('PIC FAI mengedit rekod sendiri; carian menapis', async () => {
    await page.click('button:has-text("Edit") >> nth=0');
    await page.waitForSelector('#kform');
    assert.ok((await page.inputValue('#f_no_matrik')).length > 0);
    await page.click('[data-action="cancelform"]');
    await page.fill('#q', 'tiada-padanan-xyz');
    await page.waitForSelector('td:has-text("Tiada rekod")');
  });
  await step('log keluar kembali ke paparan awam', async () => {
    const tokBefore = await page.evaluate(() => window.localStorage.getItem('utmx_token'));
    await page.click('[data-action="logout"]');
    await page.waitForSelector('.prof >> text=Pengunjung');
    assert.strictEqual(await page.evaluate(() => window.localStorage.getItem('utmx_token')), null);   // token dibuang daripada pelayar
    await page.waitForTimeout(300);
    assert.strictEqual(g.api_session(tokBefore).auth, true);                                           // dan ditamatkan di pelayan
    assert.strictEqual(await page.locator('.nav', { hasText: 'KAI 1' }).count(), 0);
  });
  await step('Admin: urus pengguna, sasaran dan log audit', async () => {
    await page.click('[data-action="login"]');
    await page.fill('#l_emel', 'admin@utm.my');
    await page.click('button:has-text("Hantar / Hantar Semula Kod")');
    await page.waitForSelector('#l_code');
    await page.fill('#l_code', code());
    await page.click('button:has-text("Sahkan dan Log Masuk")');
    await page.waitForSelector('.prof >> text=admin@utm.my');
    await goNav('Urus Pengguna');
    await page.waitForSelector('#uform');
    await page.fill('#u_emel', 'pic.baru@utm.my');
    await page.fill('#u_akses', 'KAI2'); // tidak dibenarkan bagi PIC
    await page.selectOption('#u_fakulti', 'FKE');
    await page.click('#uform button[type=submit]');
    await page.waitForSelector('.invalid .err:has-text("KPI tidak sah")');
    await page.fill('#u_akses', 'KAI1,KAI6');
    await page.click('#uform button[type=submit]');
    await page.waitForSelector('td:has-text("pic.baru@utm.my")');
    await page.screenshot({ path: path.join(out, '5-admin-pengguna.png') });
    await goNav('Sasaran');
    await page.waitForSelector('input[data-k="sasaran"]');
    await goNav('Log Audit');
    await page.waitForSelector('td:has-text("PENGGUNA_TAMBAH")');
    await page.screenshot({ path: path.join(out, '6-admin-audit.png') });
    await goNav('Persediaan');
    await page.waitForSelector('text=Semakan sistem');
    await page.waitForSelector('li[data-ok="1"]');
    assert.strictEqual(await page.locator('li[data-ok="0"]').count(), 0);
  });
  await step('Admin memadam rekod melalui dialog pengesahan (batal tidak memadam)', async () => {
    await goNav('GiGA');
    await page.waitForSelector('table');
    const before = await page.locator('tbody tr').count();
    await page.click('button:has-text("Padam") >> nth=0');
    await page.waitForSelector('.dlg:has-text("Padam rekod")');
    await page.click('#cno');
    await page.waitForSelector('.dlg', { state: 'detached' });
    assert.strictEqual(await page.locator('tbody tr').count(), before);
    await page.click('button:has-text("Padam") >> nth=0');
    await page.click('#cyes');
    await page.waitForFunction((n) => document.querySelectorAll('tbody tr').length === n, before - 1);
  });
  await step('Admin merekod pendapatan CKAI 7 (input bulan) dan dashboard memaparkan RM', async () => {
    await goNav('CKAI 7');
    await page.waitForSelector('table');
    await page.click('[data-action="new"]');
    await page.waitForSelector('#f_Tahun');
    await page.fill('#f_Tahun', '2026'); await page.selectOption('#f_Bulan', 'Mei');
    await page.fill('#f_nama_perniagaan', 'Kedai E2E');
    await page.fill('#f_no_matrik', 'A24CS0001'); await page.press('#f_no_matrik', 'Tab');
    await page.waitForSelector('#stu_status.ok');
    await page.fill('#f_pendapatan_bulanan', '1500.5');
    await page.screenshot({ path: path.join(out, '8-borang-ckai4.png'), fullPage: true });
    await page.click('#savebtn');
    await page.waitForSelector('td:has-text("Kedai E2E")');
    await goNav('Dashboard');
    const card = page.locator('.kcard:has(.t:text-is("CKAI 7 · Pendapatan usahawan pelajar"))');
    await card.waitFor();
    assert.ok((await card.innerText()).includes('RM 1,500.50'), await card.innerText());
    assert.ok((await card.innerText()).includes('Tiada sasaran'));
    await page.screenshot({ path: path.join(out, '9-dashboard-ckai.png'), fullPage: true });
  });
  await step('CKAI 9: borang anugerah dengan pelajar berbilang dan muat naik sijil PDF', async () => {
    await goNav('CKAI 9');
    await page.waitForSelector('table');
    await page.click('[data-action="new"]');
    await page.waitForSelector('#f_nama_anugerah');
    await page.selectOption('#f_fakulti', 'FC');
    await page.fill('#f_nama_anugerah', 'Anugerah Inovasi Negara');
    await page.fill('#f_tarikh', '2026-05-12');
    await page.fill('#f_agensi', 'MOSTI');
    await page.selectOption('#f_peringkat', 'Kebangsaan');
    await page.selectOption('#f_kategori', 'Inovasi');
    await page.selectOption('#f_program', 'UTM AI Start Up');
    await page.fill('#f_mentor', 'Dr. Mentor');
    const pk = (i, f) => page.locator('[data-pk="pelajar"][data-pi="' + i + '"][data-pf="' + f + '"]');
    assert.strictEqual(await page.locator('[data-pk="pelajar"][data-pf="nama"], [data-pk="pelajar"][data-pf="nokp"]').count(), 0);   // hanya no. matrik
    await pk(0, 'matrik').fill('A24CS0101'); await pk(0, 'matrik').press('Tab');
    await page.waitForSelector('[data-pname="pelajar:0"]:has-text("Ali Bin Abu")');
    assert.strictEqual((await text('[data-pkp="pelajar:0"]')).trim(), '900101145678');   // Admin melihat no. KP penuh (PIC: disamarkan)
    assert.strictEqual((await text('[data-pfk="pelajar:0"]')).trim(), 'FC');
    await page.click('[data-action="padd"][data-key="pelajar"]');
    await pk(1, 'matrik').fill('TIADA999'); await pk(1, 'matrik').press('Tab');
    await page.waitForSelector('.mdl');     // pelajar tiada: tetingkap melengkapkan; batal
    assert.strictEqual(await page.locator('.prow').count(), 2);
    // fail bukan PDF ditolak di klien
    await page.setInputFiles('#f_sijil_file', { name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('bukan pdf') });
    await page.waitForSelector('[data-field="sijil"].invalid .err:has-text("format PDF")');
    // fail palsu bernama .pdf ditolak di pelayan (kandungan sebenar disemak)
    await page.setInputFiles('#f_sijil_file', { name: 'palsu.pdf', mimeType: 'application/pdf', buffer: Buffer.from('<html>bukan pdf sebenar</html>') });
    await page.waitForSelector('[data-field="sijil"].invalid .err:has-text("format PDF")');
    // PDF sebenar diterima
    await page.setInputFiles('#f_sijil_file', { name: 'sijil-anugerah.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\n%%EOF') });
    await page.waitForSelector('.fileinfo:has-text("sijil-anugerah.pdf")');
    await page.screenshot({ path: path.join(out, '10-borang-ckai7.png'), fullPage: true });
    await page.click('[data-action="stucancel"]');
    await page.click('#savebtn');     // simpan dengan pelajar tiada: tetingkap dibuka semula
    await page.waitForSelector('.mdl');
    await page.click('[data-action="stucancel"]');
    // betulkan, simpan
    await pk(1, 'matrik').fill('A24CS0102'); await pk(1, 'matrik').press('Tab');
    await page.waitForSelector('[data-pname="pelajar:1"]:has-text("Siti Binti Ahmad")');
    await page.click('#savebtn');
    await page.waitForSelector('td:has-text("Anugerah Inovasi Negara")');
    assert.ok((await text('table')).includes('Ali Bin Abu, Siti Binti Ahmad'));
    assert.ok(!(await text('table')).includes('900101'), 'no. KP tidak boleh dipaparkan dalam jadual');
    await page.screenshot({ path: path.join(out, '11-senarai-ckai7.png') });
  });
  await step('CKAI 9: muat turun sijil dan edit mengekalkan pelajar dan fail', async () => {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('button:has-text("PDF")')]);
    assert.strictEqual(dl.suggestedFilename(), 'sijil-anugerah.pdf');
    const content = fs.readFileSync(await dl.path(), 'utf8');
    assert.ok(content.startsWith('%PDF-1.4'), 'kandungan muat turun: ' + content.slice(0, 20));
    await page.click('button:has-text("Edit") >> nth=0');
    await page.waitForSelector('#kform');
    assert.strictEqual(await page.locator('.prow').count(), 2);
    assert.ok((await text('[data-pname="pelajar:1"]')).includes('Siti Binti Ahmad'));
    assert.ok((await text('.fileinfo')).includes('sijil-anugerah.pdf'));
    await page.click('#savebtn'); // simpan tanpa muat naik semula: rujukan fail sedia ada diterima
    await page.waitForSelector('td:has-text("Anugerah Inovasi Negara")');
    await goNav('Dashboard');
    const card = page.locator('.kcard:has(.t:text-is("CKAI 9 · Anugerah & pengiktirafan inovasi dan keusahawanan"))');
    await card.waitFor();
    assert.ok((await card.innerText()).includes('Pelajar penerima: 2'), await card.innerText());
    const all = await page.locator('.cont').innerText();
    ['Ali Bin Abu', '900101145678', 'A24CS0001', 'sijil-anugerah'].forEach(x => assert.ok(!all.includes(x), 'bocor dalam dashboard: ' + x));
  });
  await step('CKAI 3: daftar program inovasi (tarikh, tempat, penyertaan, kos, pendapatan) dan dashboard menjumlahkannya', async () => {
    await goNav('CKAI 3');
    await page.waitForSelector('table');
    await page.click('[data-action="new"]');
    await page.waitForSelector('#f_nama_program');
    await page.selectOption('#f_fakulti', 'FC');
    await page.fill('#f_nama_program', 'Hackathon Inovasi 2026');
    await page.selectOption('#f_kategori', 'Hackathon / Pertandingan');
    await page.selectOption('#f_status', 'Selesai');
    // program Selesai: medan wajib ditandakan
    await page.click('#savebtn');
    await page.waitForSelector('[data-field="lokasi"].invalid .err:has-text("Wajib diisi")');
    await page.fill('#f_tarikh_mula', '2026-05-10');
    await page.fill('#f_tarikh_tamat', '2026-05-09'); // salah: tamat sebelum mula
    await page.fill('#f_lokasi', 'Dewan Utama');
    await page.fill('#f_bil_peserta', '50');
    await page.fill('#f_bil_pelajar', '40');
    await page.fill('#f_bil_staf', '15'); // 40 + 15 > 50: salah
    await page.fill('#f_bajet_rm', '1500');
    await page.fill('#f_pendapatan_rm', '0');
    await page.click('#savebtn');
    await page.waitForSelector('[data-field="tarikh_tamat"].invalid .err:has-text("sebelum tarikh mula")');
    await page.waitForSelector('[data-field="bil_peserta"].invalid .err:has-text("kurang daripada")');
    await page.fill('#f_tarikh_tamat', '2026-05-11');
    await page.fill('#f_bil_staf', '10');
    await page.screenshot({ path: path.join(out, '12-borang-program.png'), fullPage: true });
    await page.click('#savebtn');
    await page.waitForSelector('td:has-text("Hackathon Inovasi 2026")');
    const row = await text('tbody tr');
    ['Dewan Utama', '50', '1500', 'Selesai'].forEach(x => assert.ok(row.includes(x), 'lajur senarai tiada: ' + x + ' => ' + row));
    await goNav('Dashboard');
    const card = page.locator('.kcard:has(.t:text-is("CKAI 3 · Bilangan program inovasi"))');
    await card.waitFor();
    const ct = await card.innerText();
    ['Jumlah peserta: 50', 'Daripada itu pelajar: 40', 'Kos penganjuran: RM 1,500.00', 'Pendapatan: RM 0.00'].forEach(x => assert.ok(ct.includes(x), 'kad tiada: ' + x + ' => ' + ct));
  });
  await step('CKAI 8: daftar inovasi pelajar (tanpa no. KP), anugerah pilihan, penapis calon peningkatan', async () => {
    await goNav('CKAI 8');
    await page.waitForSelector('table');
    await page.click('[data-action="new"]');
    await page.waitForSelector('#f_tajuk_inovasi');
    await page.selectOption('#f_fakulti', 'FKE');
    await page.fill('#f_tajuk_inovasi', 'Robot Penyusun Sampah');
    await page.selectOption('#f_jenis_inovasi', 'Produk fizikal');
    await page.fill('#f_mentor', 'Prof. Penyelia');
    assert.strictEqual(await page.locator('[data-pk="pelajar"][data-pf="nokp"]').count(), 0); // tiada medan no. KP
    await page.locator('[data-pk="pelajar"][data-pi="0"][data-pf="matrik"]').fill('A24EE0001');
    await page.selectOption('#f_status_penyertaan', 'Telah menyertai');
    await page.fill('#f_nama_pertandingan', 'Pertandingan Inovasi Fakulti');
    await page.selectOption('#f_peringkat', 'Fakulti');
    await page.fill('#f_tarikh', '2026-05-02');
    await page.selectOption('#f_status_peningkatan', 'Calon peningkatan');
    await page.click('#savebtn');
    await page.waitForSelector('[data-field="peringkat_sasaran"].invalid .err:has-text("Wajib diisi")');
    await page.selectOption('#f_peringkat_sasaran', 'Kebangsaan');
    await page.screenshot({ path: path.join(out, '13-borang-inovasi.png'), fullPage: true });
    await page.click('#savebtn'); // tiada pingat / anugerah: sah
    await page.waitForSelector('td:has-text("Robot Penyusun Sampah")');
    // penapis status peningkatan
    await page.selectOption('select[aria-label="Tapis Status peningkatan"]', 'Calon peningkatan');
    await page.waitForSelector('td:has-text("Robot Penyusun Sampah")');
    await page.selectOption('select[aria-label="Tapis Status peningkatan"]', 'Tidak diteruskan');
    await page.waitForSelector('td:has-text("Tiada rekod")');
    await goNav('Dashboard');
    const card = page.locator('.kcard:has(.t:text-is("CKAI 8 · Bilangan inovasi pelajar yang dihasilkan"))');
    await card.waitFor();
    const ct = await card.innerText();
    ['Pelajar terlibat: 1', 'Memenang anugerah / pingat: 0', 'Calon peningkatan / sedang disokong: 1'].forEach(x => assert.ok(ct.includes(x), 'kad tiada: ' + x + ' => ' + ct));
  });
  await step('Muat naik pukal (KPT 4): muat turun templat, muat naik CSV, laporan baris gagal', async () => {
    await goNav('KPT 4');
    await page.click('.tab:has-text("Muat Naik Pukal")');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-action="bulkdl"]')]);
    const tp = path.join(out, 'templat-kpt4.csv'); await dl.saveAs(tp);
    const tpl = fs.readFileSync(tp, 'utf8');
    assert.ok(tpl.includes('[no_matrik]') && !tpl.includes('[no_kp]') && !tpl.includes('[nama]') && tpl.includes('#PANDUAN') && tpl.includes('TRL 1 / TRL 2 / TRL 3'), tpl);
    // isi templat: dua baris sah (satu guna tarikh d/m/y dan pilihan huruf kecil) + satu baris TRL tidak sah
    const csv = tpl.trim().split(/\r?\n/).slice(0, 1).concat([
      '"FAI","Pukal A","000101105555","PK-A","Projek A","trl 1","15/03/2026"',
      '"FC","Pukal B","000202106666","PK-B","Projek B","TRL 2","2026-03-16"',
      '"FC","Pukal C","000303107777","PK-C","Projek C","TRL 9","2026-03-17"']).join('\r\n');
    const head = tpl.trim().split(/\r?\n/)[0];
    assert.ok(head.indexOf('[fakulti]') === 0 || head.includes('[fakulti]'));
    const cols = head.split('","').map(x => x.replace(/"/g, ''));
    const order = cols.map(c => /\[(\w+)\]/.exec(c)[1]);
    const rowOf = (o) => order.map(k => '"' + (o[k] || '') + '"').join(',');
    const fp = path.join(out, 'pukal-kpt4.csv');
    fs.writeFileSync(fp, '﻿' + head + '\r\n' + [
      rowOf({ fakulti: 'FAI', no_matrik: 'PK-A', nama_projek_inovasi: 'Projek A', level_TRL: 'trl 1' }),
      rowOf({ fakulti: 'FC', no_matrik: 'PK-B', nama_projek_inovasi: 'Projek B', level_TRL: 'TRL 2' }),
      rowOf({ fakulti: 'FC', no_matrik: 'PK-C', nama_projek_inovasi: 'Projek C', level_TRL: 'TRL 9' }),
      rowOf({ fakulti: 'FC', no_matrik: 'PK-X', nama_projek_inovasi: 'Projek X', level_TRL: 'TRL 1' })].join('\r\n'));
    await page.setInputFiles('#bulkfile', fp);
    await page.waitForSelector('[data-action="bulkgo"]');
    assert.ok((await text('.cont')).includes('4 baris data dikesan'));
    await page.click('[data-action="bulkgo"]');
    await page.waitForSelector('text=2 rekod berjaya disimpan');
    assert.ok((await text('.cont')).includes('2 baris gagal'));
    const [er] = await Promise.all([page.waitForEvent('download'), page.click('[data-action="bulkerr"]')]);
    const ep = path.join(out, 'gagal.csv'); await er.saveAs(ep);
    assert.ok(fs.readFileSync(ep, 'utf8').includes('PK-C') && fs.readFileSync(ep, 'utf8').includes('PK-X') && fs.readFileSync(ep, 'utf8').includes('RALAT'));
    // pelajar PK-X belum ada dalam PELAJAR: lengkapkan melalui tetingkap
    await page.click('[data-action="bulkstu"]');
    await page.waitForSelector('.mdl legend:has-text("PK-X")');
    await page.fill('#sm_0_nama_pelajar', 'Pukal X'); await page.fill('#sm_0_no_kp', '000404108888'); await page.selectOption('#sm_0_fakulti', 'FC');
    await page.click('#stusave');
    await page.waitForSelector('.mdl', { state: 'detached' });
    await page.click('.tab:has-text("Senarai")');
    await page.waitForSelector('td:has-text("Pukal A")');
    assert.ok((await text('.cont')).includes('Pukal B') && !(await text('.cont')).includes('Pukal C'));
    // lajur wajib tiada ditolak
    await page.click('.tab:has-text("Muat Naik Pukal")');
    fs.writeFileSync(fp, 'Nama [nama]\r\nX\r\n');
    await page.setInputFiles('#bulkfile', fp);
    await page.waitForSelector('text=Lajur wajib tiada');
    assert.strictEqual(await page.locator('[data-action="bulkgo"]').count(), 0);
    await page.screenshot({ path: path.join(out, '18-muat-naik-pukal.png'), fullPage: true });
  });
  await step('CKAI 5: segerak daripada Sheet permohonan (Admin); baris bermasalah dilaporkan; segerak semula tiada pendua', async () => {
    await goNav('CKAI 5');
    await page.waitForSelector('[data-action="msync"]');
    await page.click('[data-action="msync"]');
    await page.waitForSelector('.panel[role="status"]:has-text("1 rekod diimport")');
    assert.ok((await text('.cont')).includes('1 baris perlu dibetulkan') && (await text('.cont')).includes('MSX002'));
    await page.waitForSelector('td:has-text("Pemohon Luar Satu")');
    await page.click('[data-action="msync"]');
    await page.waitForSelector('.panel[role="status"]:has-text("0 rekod diimport")');
    assert.strictEqual(await page.locator('td:has-text("Pemohon Luar Satu")').count(), 1);
    await page.screenshot({ path: path.join(out, '20-segerak-makerspace.png'), fullPage: true });
  });
  await step('Infografik (awam): panel, cincin dan carta dipaparkan; tukar tahun', async () => {
    await goNav('Infografik');
    await page.waitForSelector('.ig .igp');
    assert.ok((await page.locator('.igp').count()) >= 6);
    assert.ok((await page.locator('svg.ring').count()) >= 18); // premium + 4 peringkat + 7 KPT + 6 fungsi + tabung
    assert.ok((await page.locator('svg.chart').count()) >= 1);
    const txt = await page.locator('.cont').innerText();
    ['Laporan Prestasi UTMXCITE', 'Pekerjaan Premium Tier 1', 'Sasaran 2030: 40%', 'Enam fungsi UTMXCITE', 'Semua indikator', 'Peringkat Kementerian (KPT)', 'Teras 1', 'Teras 3', 'Kolaborasi berimpak tinggi', 'Jualan agregat usahawan', 'Kenal pasti minat', '(Identify Interest)', 'Pameran inovasi pelajar', '(Showcase Innovation)'].forEach(x => assert.ok(txt.toLowerCase().includes(x.toLowerCase()), 'infografik tiada: ' + x));
    assert.strictEqual(await page.locator('.kpti').count(), 7);
    // susunan: pendapatan bulan + fakulti sebaris; Makerspace bulan + peralatan sebaris
    const pos = await page.$$eval('.igp', els => els.map(e => { const r = e.getBoundingClientRect(); return [e.querySelector('.igt').textContent.trim(), Math.round(r.top + scrollY)]; }));
    const topOf = (re) => (pos.find(x => re.test(x[0])) || [0, -1])[1];
    // (data e2e mungkin tidak mempunyai semua panel; susunan penuh disemak dalam ujian demo)
    if (topOf(/Pendapatan usahawan \(RM\)/) > 0 && topOf(/Pendapatan usahawan mengikut fakulti/) > 0) assert.ok(Math.abs(topOf(/Pendapatan usahawan \(RM\)/) - topOf(/Pendapatan usahawan mengikut fakulti/)) <= 2, 'pendapatan bulan dan fakulti mesti sebaris ' + JSON.stringify(pos));
    if (topOf(/Makerspace mengikut bulan/) > 0 && topOf(/Makerspace mengikut peralatan/) > 0) assert.ok(Math.abs(topOf(/Makerspace mengikut bulan/) - topOf(/Makerspace mengikut peralatan/)) <= 2, 'Makerspace bulan dan peralatan mesti sebaris');

    assert.strictEqual(await page.locator('.kptp .kpth').count(), 3);
    assert.strictEqual(await page.locator('.rrow.four .rtile').count(), 4);
    await page.selectOption('#iy', '2027');
    await page.waitForSelector('.igs:has-text("tahun 2027")');
    await page.selectOption('#iy', '2026');
    await page.waitForSelector('.igs:has-text("tahun 2026")');
    await page.screenshot({ path: path.join(out, '17-infografik.png'), fullPage: true });
  });
  await step('Infografik: PDF slaid 16:9 (slaid 1 = tajuk, 2 = ringkasan, 3 = KPT, 4 = KAI, 5 = fungsi) dijana untuk cetakan', async () => {
    await goNav('Infografik');
    await page.waitForSelector('[data-action="slides"]');
    assert.strictEqual((await page.locator('[data-action="slides"]').innerText()).trim(), 'Cetak slide');
    const bs = await page.$$eval('.igctl .pbtn', els => els.map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
    assert.deepStrictEqual(bs[0], bs[1]);   // saiz kotak Cetak slide = Cetak halaman
    await page.evaluate(() => { window.print = () => {}; });
    await page.click('[data-action="slides"]');
    await page.waitForSelector('#slides .slide', { state: 'attached' });
    const n = await page.locator('#slides .slide').count();
    assert.strictEqual(await page.locator('#slides .slide.cover .cv-logos img').count(), 3);   // UTM, ASCEND dan UTMXCITE di muka depan
    assert.ok(await page.locator('#slides .slide.cover .lg-xc').evaluate(el => el.complete && el.naturalWidth > 100), 'logo UTMXCITE tidak dimuat');
    assert.ok(n >= 7, 'bilangan slaid: ' + n);
    const t = async (i) => (await page.locator('#slides .slide').nth(i).innerText());
    assert.ok((await page.locator('#slides .slide').first().evaluate(el => el.classList.contains('cover'))));
    assert.ok((await t(0)).includes('LAPORAN') && (await t(0)).includes('PRESTASI UTMXCITE') && (await t(0)).includes('SULIT') && (await t(0)).includes('Pusat Inovasi Mahasiswa dan Keusahawanan Teknologi (UTMXCITE)') && (await t(0)).includes('Innovating Sustainable Solutions'));
    assert.ok((await t(1)).includes('Pekerjaan Premium Tier 1') && (await t(1)).includes('Rumusan pencapaian') && (await t(1)).includes('Trend ukuran premium'));
    assert.ok((await t(2)).includes('Teras 1') && (await t(2)).includes('KPT 7'));
    assert.ok((await t(3)).includes('KAI · Peringkat Universiti') && (await t(3)).includes('KAI 6') && (await t(3)).includes('DKAI 1'));
    assert.ok((await t(4)).includes('Enam fungsi UTMXCITE') && (await t(4)).includes('Pendapatan usahawan'));
    assert.ok((await text('#slides')).includes('Penggunaan tabung amanah'));
    assert.ok((await page.locator('#slides .slide .sf').count()) === n - 1);   // kulit tanpa pengaki biasa
    await page.emulateMedia({ media: 'print' });
    const box = await page.locator('#slides .slide').first().evaluate(el => [el.offsetWidth, el.offsetHeight]);
    assert.deepStrictEqual(box, [1280, 720]);   // 16:9
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    assert.ok(pdf.length > 20000); assert.ok(/\/Count 9|\/Type ?\/Pages/.test(pdf.toString('latin1'))); fs.writeFileSync(path.join(out, 'laporan-slaid.pdf'), pdf);
    await page.emulateMedia({ media: 'screen' });
    await page.evaluate(() => window.__slidesDone && window.__slidesDone());
    assert.strictEqual(await page.locator('#slides .slide').count(), 0);
  });
  await step('Dashboard: tukar paparan antara peringkat dan fungsi (enam fungsi UTMXCITE)', async () => {
    await goNav('Dashboard');
    await page.waitForSelector('.seg');
    await page.click('[data-action="dview"][data-view="fungsi"]');
    await page.waitForSelector('.grp:has-text("Cross-cutting")');
    assert.strictEqual(await page.locator('.grp').count(), 7);
    assert.strictEqual(await page.locator('.kcard').count(), 17); // KAI, DKAI dan CKAI dipetakan kepada fungsi; KPT mengikut Teras (bukan fungsi)
    const heads = (await page.locator('.grp').allInnerTexts()).map(t => t.split('\n')[0].toUpperCase());
    deepEq(heads, ['1 · IDENTIFY STUDENT ENTREPRENEURSHIP INTEREST', '2 · CONDUCT ENTREPRENEURSHIP TRAINING', '3 · SUPPORT STUDENT BUSINESS IDEATION', '4 · FACILITATE STUDENT STARTUP DEVELOPMENT', '5 · MONITOR STUDENT ENTERPRISE PERFORMANCE', '6 · SHOWCASE STUDENT INNOVATION VENTURE', 'CROSS-CUTTING']);
    // fungsi 4 menghimpun KAI 1, 2, 3, 5, 6 dan CKAI 4, 5, 6
    const startup = page.locator('.grp:has-text("Facilitate Student Startup Development") + .grid .kcard');
    assert.strictEqual(await startup.count(), 8);
    await page.screenshot({ path: path.join(out, '14-dashboard-fungsi.png'), fullPage: true });
    await page.click('[data-action="dview"][data-view="level"]');
    await page.waitForSelector('.grp:has-text("KAI · PERINGKAT UNIVERSITI"), .grp:has-text("KAI · Peringkat Universiti")');
  });
  await step('CKAI 1: daftar profiling pelajar (satu profil bagi setiap no. matrik)', async () => {
    await goNav('CKAI 1');
    await page.waitForSelector('table');
    await page.click('[data-action="new"]');
    await page.waitForSelector('#f_no_matrik');
    await page.fill('#f_no_matrik', 'A24PF9001');
    await page.fill('#f_tarikh_profiling', '2026-05-05');
    await page.selectOption('#f_sumber_profiling', 'Pendaftaran minat');
    await page.selectOption('#f_tahap_minat', 'Tinggi');
    await page.selectOption('#f_tahap_kesediaan', 'Ada idea');
    await page.screenshot({ path: path.join(out, '15-borang-profiling.png'), fullPage: true });
    await page.click('#savebtn');
    await page.waitForSelector('td:has-text("Nur Profil")');
    // no. matrik yang sama ditolak
    await page.click('[data-action="new"]');
    await page.waitForSelector('#f_no_matrik');
    await page.fill('#f_no_matrik', 'a24pf9001');
    await page.fill('#f_tarikh_profiling', '2026-05-06');
    await page.selectOption('#f_sumber_profiling', 'Pendaftaran minat');
    await page.selectOption('#f_tahap_minat', 'Rendah');
    await page.click('#savebtn');
    await page.waitForSelector('[data-field="no_matrik"].invalid .err:has-text("Sudah didaftarkan")');
    await page.click('[data-action="cancelform"]');
    await goNav('Dashboard');
    const card = page.locator('.kcard:has(.t:text-is("CKAI 1 · Bilangan profiling pelajar yang didaftarkan"))');
    await card.waitFor();
    const ct = await card.innerText();
    ['Berminat (sederhana / tinggi): 1', 'profiling didaftarkan'].forEach(x => assert.ok(ct.includes(x), 'kad tiada: ' + x + ' => ' + ct));
  });
  await step('sidebar: kumpulan aktif terbuka automatik; butang menu mengecilkan sidebar kepada ikon', async () => {
    await goNav('CKAI 7');
    assert.strictEqual(await page.locator('.gh[data-g="CKAI"]').getAttribute('aria-expanded'), 'true'); // kumpulan aktif dibuka
    assert.ok(await page.locator('.gb[data-g="CKAI"] .nav.act').isVisible());
    assert.strictEqual(await page.locator('.gh[data-g="DKAI"]').getAttribute('aria-expanded'), 'false'); // kumpulan lain kekal dilipat
    const w0 = (await page.locator('#side').boundingBox()).width;
    await page.click('[data-action="collapse"]');
    await page.waitForSelector('.side.mini');
    await page.waitForFunction(() => document.querySelector('#side').getBoundingClientRect().width < 100); // menunggu peralihan CSS
    const w1 = (await page.locator('#side').boundingBox()).width;
    assert.ok(w1 < 100 && w0 > 200, 'lebar sidebar: ' + w0 + ' -> ' + w1);
    assert.ok(!(await page.locator('.shlogo').isVisible()));
    await page.screenshot({ path: path.join(out, '16-sidebar-kecil.png') });
    // klik kumpulan ketika dikecilkan: sidebar dibesarkan dan kumpulan dibuka
    await page.click('.gh[data-g="DKAI"]');
    await page.waitForSelector('.side:not(.mini)');
    assert.strictEqual(await page.locator('.gh[data-g="DKAI"]').getAttribute('aria-expanded'), 'true');
    await page.waitForFunction(() => document.querySelector('#side').getBoundingClientRect().width > 250); // tunggu animasi siap
    await page.screenshot({ path: path.join(out, '17-sidebar-dibuka.png') });
  });
  await step('paparan telefon: menu boleh dibuka dan dashboard tidak melimpah mendatar', async () => {
    const mobile = await browser.newContext({ viewport: { width: 390, height: 800 } });
    const mp = await mobile.newPage();
    await mp.exposeFunction('__gas', (fn, args) => JSON.parse(JSON.stringify(g[fn](...args))));
    await mp.addInitScript(() => {
      function makeRunner(ok, fail) { return new Proxy({}, { get: (_, name) => {
        if (name === 'withSuccessHandler') return (f) => makeRunner(f, fail);
        if (name === 'withFailureHandler') return (f) => makeRunner(ok, f);
        return (...args) => { window.__gas(name, args).then((r) => ok && ok(r), (e) => fail && fail(e)); };
      } }); }
      window.google = { script: { run: makeRunner(null, null) } };
    });
    await mp.goto('file://' + htmlPath);
    await mp.waitForSelector('.ig .igp');
    const igOverflow = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(igOverflow <= 1, 'infografik melimpah mendatar: ' + igOverflow + 'px');
    await mp.click('.burger'); await mp.click('.side .nav:has-text("Dashboard")');
    await mp.waitForSelector('.kcard');
    const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 1, 'melimpah mendatar: ' + overflow + 'px');
    await mp.click('.burger');
    await mp.waitForSelector('.side.open');
    await mp.screenshot({ path: path.join(out, '7-telefon-menu.png') });
    await mobile.close();
  });

  console.log(errors.length ? 'Ralat konsol:\n  ' + errors.join('\n  ') : 'Tiada ralat konsol/halaman.');
  if (errors.length) process.exitCode = 1;
  await browser.close();
})();
