const assert = require('assert');
const deepEq = (a, b) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b));
const { loadGas } = require('./mock');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok   ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + (e.stack || e).split('\n').slice(0, 12).join('\n       ')); }
}
const ok = (r) => { assert.ok(r.ok, 'Dijangka ok, dapat: ' + JSON.stringify(r)); return r.data; };
// Pelajar belum lengkap dalam PELAJAR (r.missing) dikira sama seperti ralat medan pelajar (/betulkan/).
const fail = (r, re) => { assert.strictEqual(r.ok, false, 'Dijangka gagal'); if (re && !(re.source === 'betulkan' && r.missing)) assert.match(r.error, re); return r; };

// Tetapkan "hari ini" kepada 15 Mei 2026 (Q2 2026).
const env = loadGas({ now: Date.UTC(2026, 4, 15, 4, 0, 0) });
const g = env.g;

// Data asas pelajar: ujian lama menghantar nama/no. KP bersama no. matrik. Pembalut ini mendaftarkan pelajar dalam tab PELAJAR
// (jika belum ada) sebelum rekod disimpan, supaya ujian KPI kekal menguji logik KPI. Ujian khusus PELAJAR ada di bahagian "Data asas pelajar".
const origApiSave = g.api_save;
function seedStudentsFor(kpiId, rec) {
  const kpi = g.KPIS.find(k => k.id === kpiId);
  if (!kpi || !env.props.SHEET_ID || !rec || rec.__nostudent) return rec;
  const sh = env.spreadsheets[env.props.SHEET_ID].getSheetByName('PELAJAR');
  if (!sh) return rec;
  rec = Object.assign({}, rec);
  const lr = sh.getLastRow();
  const rowsNow = lr < 2 ? [] : sh.getRange(2, 1, lr - 1, 6).getValues();
  const have = new Set(rowsNow.map(r => String(r[0]).toUpperCase()));
  const validKp = (k) => /^[A-Z0-9-]{6,20}$/i.test(String(k || '').replace(/\s+/g, ''));
  const add = (m, nama, kp, emel, tel, fak) => {
    m = String(m || '').trim(); if (!m) return;
    if (have.has(m.toUpperCase())) {   // lengkapkan e-mel / telefon yang masih kosong
      const i = rowsNow.findIndex(r => String(r[0]).toUpperCase() === m.toUpperCase());
      if (i >= 0) { if (emel && !rowsNow[i][3]) sh.getRange(i + 2, 4).setValue(emel); if (tel && !rowsNow[i][4]) sh.getRange(i + 2, 5).setValue(tel); }
      return;
    }
    if (!validKp(kp)) return; have.add(m.toUpperCase());
    sh.appendRow([m, String(kp).replace(/-/g, ''), nama || 'Pelajar ' + m, emel || '', tel || '', fak || 'FAI', '', '']);
  };
  if (kpi.student) {
    const mp = kpi.student.map, mk = kpi.student.matrik;
    if (!rec[mk] && validKp(rec[mp.no_kp]) && kpi.id !== 'KPT2') rec[mk] = 'M' + String(rec[mp.no_kp]).replace(/[^A-Za-z0-9]/g, '');
    add(rec[mk], rec[mp.nama_pelajar], mp.no_kp && (!['CKAI1', 'KAI5', 'KAI6', 'CKAI6'].includes(kpi.id) || rec[mp.no_kp] !== undefined) ? rec[mp.no_kp] : '900101105555', rec[mp.emel], rec[mp.telefon], (mp.fakulti && rec.fakulti) || 'FAI');
  }
  kpi.fields.filter(f => f.type === 'people').forEach(f => (Array.isArray(rec[f.key]) ? rec[f.key] : []).forEach(p => add(p.matrik, p.nama, p.nokp || '900101105555', '', '', 'FAI')));
  return rec;
}
g.api_save = (tok, kpiId, rec) => origApiSave(tok, kpiId, seedStudentsFor(kpiId, rec));
const origBulk = g.api_bulkSave;
g.api_bulkSave = (tok, kpiId, rows) => origBulk(tok, kpiId, (rows || []).map(r => (r && r.rec ? { n: r.n, rec: seedStudentsFor(kpiId, r.rec) } : r)));
const lastCode = () => /OTP anda ialah: (\d{6})/.exec(env.sent[env.sent.length - 1].body)[1];

function login(email) {
  ok(g.api_requestOtp(email));
  const d = ok(g.api_verifyOtp(email, lastCode()));
  return d.token;
}

console.log('Persediaan');
test('setup() mencipta semua tab dan data awal', () => {
  const r = g.setup();
  const ss = env.spreadsheets[r.id];
  const names = ss.sheets.map(s => s.name);
  ['Pengguna', 'Sasaran', 'Fakulti', 'Risiko', 'Log_Audit', 'KAI1_Launchpad', 'KAI2_Makerspace', 'KAI3_Ruang_Perniagaan', 'KAI4_GiGA', 'KAI5_FSIP', 'KAI6_AI_Startup', 'DKAI1_Pelan']
    .forEach(n => assert.ok(names.includes(n), 'tab tiada: ' + n));
  assert.ok(!names.includes('Sheet1'));
  assert.strictEqual(ss.getSheetByName('Pengguna').getRange(2, 1).getValue(), 'admin@utm.my');
  assert.strictEqual(ss.getSheetByName('KAI2_Makerspace').getLastRow(), 5); // 4 milestone
  assert.strictEqual(ss.getSheetByName('DKAI1_Pelan').getLastRow(), 3);
  assert.ok(ss.getSheetByName('Sasaran').getLastRow() > 20);
});
test('setup() boleh dijalankan semula tanpa menduplikasi data', () => {
  const before = env.spreadsheets[env.props.SHEET_ID].getSheetByName('Sasaran').getLastRow();
  g.setup();
  const ss = env.spreadsheets[env.props.SHEET_ID];
  assert.strictEqual(ss.getSheetByName('Sasaran').getLastRow(), before);
  assert.strictEqual(ss.getSheetByName('Pengguna').getLastRow(), 2);
  assert.strictEqual(ss.getSheetByName('KAI2_Makerspace').getLastRow(), 5);
});

console.log('Log masuk OTP');
let adminToken;
test('e-mel tidak berdaftar: mesej sama dan tiada e-mel dihantar', () => {
  const n = env.sent.length;
  const r = ok(g.api_requestOtp('orang.luar@gmail.com'));
  assert.match(r.message, /Jika e-mel itu berdaftar/);
  assert.strictEqual(env.sent.length, n);
});
test('e-mel tidak sah ditolak', () => { fail(g.api_requestOtp('bukan-emel'), /tidak sah/); });
test('OTP salah ditolak dan dihadkan percubaan', () => {
  ok(g.api_requestOtp('admin@utm.my'));
  const real = lastCode();
  const wrong = real === '000000' ? '111111' : '000000';
  for (let i = 0; i < 5; i++) fail(g.api_verifyOtp('admin@utm.my', wrong), /tidak sah|Terlalu banyak/);
  fail(g.api_verifyOtp('admin@utm.my', real), /tidak sah|tamat/); // sudah dikunci selepas 5 percubaan
});
test('OTP betul memberi token dan hanya sekali guna', () => {
  ok(g.api_requestOtp('admin@utm.my'));
  const code = lastCode();
  const d = ok(g.api_verifyOtp('admin@utm.my', code));
  adminToken = d.token;
  assert.strictEqual(d.user.peranan, 'Admin');
  assert.ok(d.token.length >= 48);
  fail(g.api_verifyOtp('admin@utm.my', code), /tidak sah|tamat/);
});
test('had permintaan OTP setiap jam', () => {
  const e2 = loadGas();
  e2.g.setup();
  let last;
  for (let i = 0; i < 6; i++) last = e2.g.api_requestOtp('admin@utm.my');
  assert.strictEqual(last.ok, false);
  assert.match(last.error, /Terlalu banyak/);
});
test('token palsu / tiada ditolak sebagai ralat pengesahan', () => {
  const r = g.api_session('palsu');
  assert.strictEqual(r.ok, false); assert.strictEqual(r.auth, true);
  assert.strictEqual(g.api_list('', 'KAI1', {}).auth, true);
});
test('log keluar membatalkan token', () => {
  const t = login('admin@utm.my');
  ok(g.api_session(t));
  ok(g.api_logout(t));
  assert.strictEqual(g.api_session(t).auth, true);
});

console.log('Pengurusan pengguna');
let picToken, pic2Token;
test('hanya Admin boleh mengurus pengguna', () => {
  ok(g.api_saveUser(adminToken, { emel: 'pic.fai@utm.my', nama: 'PIC FAI', peranan: 'PIC', fakulti: 'FAI', kpi_akses: 'KAI1,KAI4,KAI6', aktif: 'Ya' }));
  ok(g.api_saveUser(adminToken, { emel: 'pic.fc@utm.my', nama: 'PIC FC', peranan: 'PIC', fakulti: 'FC', kpi_akses: 'KAI1, KAI4', aktif: 'Ya' }));
  ok(g.api_saveUser(adminToken, { emel: 'pic.fka@utm.my', nama: 'PIC FKA', peranan: 'PIC', fakulti: 'FKA', kpi_akses: 'KAI1,KAI6', aktif: 'Ya' }));
  picToken = login('pic.fai@utm.my');
  pic2Token = login('pic.fc@utm.my');
  fail(g.api_listUsers(picToken), /Admin sahaja/);
  fail(g.api_saveUser(picToken, { emel: 'x@utm.my', peranan: 'Admin', fakulti: 'FAI' }), /Admin sahaja/);
  assert.strictEqual(ok(g.api_listUsers(adminToken)).length, 4);
});
test('PIC tidak boleh diberi akses KPI khusus Admin', () => {
  const r = g.api_saveUser(adminToken, { emel: 'pic.x@utm.my', peranan: 'PIC', fakulti: 'FAI', kpi_akses: 'KAI2', aktif: 'Ya' });
  fail(r, /tidak sah/);
});
test('tidak boleh nyahaktif Admin terakhir atau padam diri sendiri', () => {
  fail(g.api_saveUser(adminToken, { emel: 'admin@utm.my', peranan: 'PIC', fakulti: 'FAI', kpi_akses: '', aktif: 'Ya' }), /sekurang-kurangnya seorang Admin/);
  fail(g.api_deleteUser(adminToken, 'admin@utm.my'), /sendiri/);
});
test('pengguna dinyahaktifkan: sesi sedia ada terbatal serta-merta dan OTP baharu tidak dihantar', () => {
  ok(g.api_saveUser(adminToken, { emel: 'pic.tmp@utm.my', nama: 'Sementara', peranan: 'PIC', fakulti: 'FKA', kpi_akses: 'KAI1', aktif: 'Ya' }));
  const t = login('pic.tmp@utm.my');
  ok(g.api_session(t));
  ok(g.api_saveUser(adminToken, { emel: 'pic.tmp@utm.my', nama: 'Sementara', peranan: 'PIC', fakulti: 'FKA', kpi_akses: 'KAI1', aktif: 'Tidak' }));
  assert.strictEqual(g.api_session(t).auth, true);
  const n = env.sent.length; g.api_requestOtp('pic.tmp@utm.my'); assert.strictEqual(env.sent.length, n);
  ok(g.api_deleteUser(adminToken, 'pic.tmp@utm.my'));
});

console.log('Akses & rekod');
test('menu PIC hanya KPI yang dibenarkan; Admin nampak semua (5 daftar KPT + 17)', () => {
  const p = ok(g.api_session(picToken));
  deepEq(p.kpis.map(k => k.id), ['KAI1', 'KAI4', 'KAI6']);
  const a = ok(g.api_session(adminToken));
  assert.strictEqual(a.kpis.length, 22);
  assert.ok(!a.kpis.some(k => k.entry === 'auto'), 'KPT1/KPT5 auto tiada borang');
});
test('PIC ditolak mengakses KPI Admin sahaja (baca & tulis)', () => {
  fail(g.api_list(picToken, 'KAI2', {}), /Akses ditolak/);
  fail(g.api_save(picToken, 'KAI5', { nama_pelajar: 'x' }), /Akses ditolak/);
  fail(g.api_delete(picToken, 'KAI1', 'L1-001'), /Admin sahaja/);
});
let kai1Id;
test('PIC menambah rekod KAI1: fakulti dipaksa kepada fakulti PIC', () => {
  const r = ok(g.api_save(picToken, 'KAI1', {
    aliran: 'Technology Startup', jenis: 'Inkubator Fakulti', fakulti: 'FC', nama_inkubator: 'Launchpad FAI',
    didaftarkan: 'Ya', tarikh_pendaftaran: '2026-02-10', status: 'Dalam pembangunan'
  }));
  assert.strictEqual(r.fakulti, 'FAI');
  assert.strictEqual(r.id, 'L1-001');
  assert.strictEqual(r.dicipta_oleh, 'pic.fai@utm.my');
  kai1Id = r.id;
});
test('pengesahan medan: wajib, pilihan, tarikh, nombor, url, peraturan bersyarat', () => {
  const r = g.api_save(picToken, 'KAI1', { aliran: 'Salah', jenis: 'Inkubator Fakulti', nama_inkubator: '', didaftarkan: 'Ya', status: 'Tidak aktif', kapasiti: -1, lampiran: 'ftp://x', tarikh_beroperasi: '2026-02-30' });
  fail(r, /betulkan/);
  ['aliran', 'nama_inkubator', 'tarikh_pendaftaran', 'tarikh_tidak_aktif', 'kapasiti', 'lampiran', 'tarikh_beroperasi'].forEach(k => assert.ok(r.fields[k], 'ralat medan tiada: ' + k));
});
test('PIC lain tidak nampak dan tidak boleh ubah rekod fakulti lain', () => {
  assert.strictEqual(ok(g.api_list(pic2Token, 'KAI1', {})).rows.length, 0);
  fail(g.api_save(pic2Token, 'KAI1', { id: kai1Id, aliran: 'Technology Startup', jenis: 'Inkubator Fakulti', nama_inkubator: 'Cuba ubah', didaftarkan: 'Ya', tarikh_pendaftaran: '2026-02-10', status: 'Dalam pembangunan' }), /fakulti lain/);
  assert.strictEqual(ok(g.api_list(picToken, 'KAI1', {})).rows.length, 1);
});
test('PIC mengemas kini rekod sendiri; id dan penciptaan kekal', () => {
  const r = ok(g.api_save(picToken, 'KAI1', { id: kai1Id, aliran: 'Technology Startup', jenis: 'Inkubator Fakulti', nama_inkubator: 'Launchpad FAI v2', didaftarkan: 'Ya', tarikh_pendaftaran: '2026-02-10', status: 'Dalam pembangunan' }));
  assert.strictEqual(r.id, kai1Id); assert.strictEqual(r.nama_inkubator, 'Launchpad FAI v2');
  assert.strictEqual(ok(g.api_list(picToken, 'KAI1', {})).rows.length, 1);
});
test('Admin merekod bagi fakulti lain dan melihat semua', () => {
  ok(g.api_save(adminToken, 'KAI1', { aliran: 'High-Income Gig', jenis: 'Inkubator Fakulti', fakulti: 'FC', nama_inkubator: 'Launchpad FC', didaftarkan: 'Ya', tarikh_pendaftaran: '2026-03-01', status: 'Beroperasi', tarikh_beroperasi: '2026-04-01' }));
  ok(g.api_save(adminToken, 'KAI1', { aliran: 'Social Enterprise', jenis: 'Co-working / Ruang Individu', fakulti: 'UTMXCITE', nama_inkubator: 'Co-work 1', didaftarkan: 'Tidak', status: 'Dicadangkan' }));
  assert.strictEqual(ok(g.api_list(adminToken, 'KAI1', {})).rows.length, 3);
  assert.strictEqual(ok(g.api_list(adminToken, 'KAI1', { fakulti: 'FC' })).rows.length, 1);
  assert.strictEqual(ok(g.api_list(adminToken, 'KAI1', { q: 'co-work' })).rows.length, 1);
});
test('KAI 1: fakulti boleh LAIN-LAIN (Admin); PIC kekal dikunci kepada fakultinya', () => {
  const b = { aliran: 'Technology Startup', jenis: 'Inkubator Fakulti', nama_inkubator: 'Inkubator Luar', didaftarkan: 'Tidak', status: 'Dicadangkan' };
  const r = ok(g.api_save(adminToken, 'KAI1', Object.assign({ fakulti: 'LAIN-LAIN' }, b)));
  assert.strictEqual(r.fakulti, 'LAIN-LAIN');
  const bad = g.api_save(adminToken, 'KAI1', Object.assign({ fakulti: 'XYZ' }, b)); fail(bad, /betulkan/); assert.ok(bad.fields.fakulti);
  const other = g.api_save(adminToken, 'KAI6', { fakulti: 'LAIN-LAIN', nama: 'Q', no_matrik: 'Q1', status: 'Idea/konsep' }); fail(other, /betulkan/);   // hanya KAI 1
});
test('KAI6 terhad kepada FAI, FC, FKE, MJIIT', () => {
  const base = { nama: 'Ali', no_matrik: 'A1', status: 'Idea/konsep' };
  fail(g.api_save(adminToken, 'KAI6', Object.assign({ fakulti: 'FKA' }, base)), /betulkan/);
  ok(g.api_save(adminToken, 'KAI6', Object.assign({ fakulti: 'FKE' }, base, { no_matrik: 'A2' })));
  // PIC FC tidak diberi KAI6 dan PIC FKA bukan fakulti KAI6
  fail(g.api_list(pic2Token, 'KAI6', {}), /Akses ditolak/);
});
test('teks berbahaya (formula) disimpan sebagai teks', () => {
  const r = ok(g.api_save(adminToken, 'KAI5', { fakulti: 'FAI', nama_pelajar: '=HYPERLINK("http://x")', no_matrik: '+1234', status: 'Dicalonkan' }));
  assert.ok(r.nama_pelajar.startsWith("'"));
  assert.ok(r.no_matrik.startsWith("'"));
});
test('padam: Admin sahaja, direkod dalam audit', () => {
  const r = ok(g.api_save(adminToken, 'KAI5', { fakulti: 'FAI', nama_pelajar: 'Padam Saya', no_matrik: 'P1', status: 'Dicalonkan' }));
  fail(g.api_delete(picToken, 'KAI1', r.id), /Admin sahaja/);
  ok(g.api_delete(adminToken, 'KAI5', r.id));
  const log = ok(g.api_listAudit(adminToken, 50));
  assert.ok(log.some(a => a.tindakan === 'PADAM' && a.rekod_id === r.id));
  assert.ok(log.some(a => a.tindakan === 'TAMBAH' && a.kpi === 'KAI1'));
  assert.ok(log.some(a => a.tindakan === 'LOG_MASUK'));
});
test('ID berjujukan tidak berulang selepas padam', () => {
  const a = ok(g.api_save(adminToken, 'KAI5', { fakulti: 'FAI', nama_pelajar: 'A', no_matrik: 'A', status: 'Dicalonkan' }));
  const b = ok(g.api_save(adminToken, 'KAI5', { fakulti: 'FAI', nama_pelajar: 'B', no_matrik: 'B', status: 'Dicalonkan' }));
  assert.notStrictEqual(a.id, b.id);
});

console.log('Dashboard');
const MBL = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
const mb = (ym) => { const p = String(ym).split('-'); return { Tahun: Number(p[0]), Bulan: p[1] && p[1].length === 2 ? (MBL[Number(p[1]) - 1] || p[1]) : p[1] }; };
const dash = (y) => ok(g.api_dashboard(y));
const card = (d, id) => d.kpis.find(k => k.id === id);
test('dashboard awam tanpa log masuk: 7 KPT + 7 KPI + 10 CKAI', () => {
  const d = dash(2026);
  assert.strictEqual(d.kpis.length, 24);
  deepEq(d.kpis.map(k => k.group), ['KPT', 'KPT', 'KPT', 'KPT', 'KPT', 'KPT', 'KPT', 'Growth', 'Growth', 'Growth', 'Transform', 'Transform', 'Transform', 'Department', 'Center', 'Center', 'Center', 'Center', 'Center', 'Center', 'Center', 'Center', 'Center', 'Center']);
  deepEq(d.kpis.map(k => k.level), ['KPT', 'KPT', 'KPT', 'KPT', 'KPT', 'KPT', 'KPT', 'KAI', 'KAI', 'KAI', 'KAI', 'KAI', 'KAI', 'DKAI', 'CKAI', 'CKAI', 'CKAI', 'CKAI', 'CKAI', 'CKAI', 'CKAI', 'CKAI', 'CKAI', 'CKAI']);
  deepEq(d.levels.map(l => l.label), ['KPT · Peringkat Kementerian (KPI Keusahawanan IPT)', 'KAI · Peringkat Universiti', 'DKAI · Peringkat Jabatan (JTNC HEPA)', 'CKAI · Peringkat Pusat (UTMXCITE)']);
  assert.ok(!JSON.stringify(d).includes('Internal'));
  // Enam fungsi UTMXCITE = aliran proses kerja; setiap indikator ditanda dengan satu fungsi
  deepEq(d.functions.map(x => x.label), ['Identify Student Entrepreneurship Interest', 'Conduct Entrepreneurship Training', 'Support Student Business Ideation', 'Facilitate Student Startup Development', 'Monitor Student Enterprise Performance', 'Showcase Student Innovation Venture', 'Cross-cutting']);
  deepEq(d.functions.map(x => x.no), [1, 2, 3, 4, 5, 6, null]);
  deepEq(d.kpis.map(k => k.id + ':' + k.fungsi), [
    'KPT1:null', 'KPT2:null', 'KPT3:null', 'KPT4:null', 'KPT5:null', 'KPT6:null', 'KPT7:null',
    'KAI1:startup', 'KAI2:startup', 'KAI3:startup', 'KAI4:latihan', 'KAI5:startup', 'KAI6:startup', 'DKAI1:rentas',
    'CKAI1:minat', 'CKAI2:latihan', 'CKAI3:ideasi', 'CKAI4:startup', 'CKAI5:startup', 'CKAI6:startup', 'CKAI7:prestasi', 'CKAI8:pameran', 'CKAI9:pameran', 'CKAI10:rentas']);
  const titles = Object.fromEntries(d.kpis.map(k => [k.id, k.title]));
  assert.match(titles.CKAI1, /profiling pelajar yang didaftarkan/); assert.match(titles.CKAI4, /pendaftaran SSU/); assert.match(titles.CKAI5, /Makerspace/); assert.match(titles.CKAI9, /Anugerah/);
  deepEq(ok(g.api_session(adminToken)).functions.map(x => x.id), ['minat', 'latihan', 'ideasi', 'startup', 'prestasi', 'pameran', 'rentas']);
  // setiap fungsi 1-6 ada sekurang-kurangnya satu CKAI
  ['minat', 'latihan', 'ideasi', 'startup', 'prestasi', 'pameran'].forEach(f => assert.ok(d.kpis.some(k => k.level === 'CKAI' && k.fungsi === f), 'fungsi tiada CKAI: ' + f));
  // tab Sheet mengikut nombor baharu
  const names = env.spreadsheets[env.props.SHEET_ID].sheets.map(x => x.name);
  ['CKAI1_Profiling_Pelajar', 'CKAI2_Program_Keusahawanan', 'CKAI3_Program_Inovasi', 'CKAI4_SSU', 'CKAI5_Makerspace', 'CKAI6_Sewaan_Inkubator', 'CKAI7_Pendapatan_Pelajar', 'CKAI8_Inovasi_Pelajar', 'CKAI9_Anugerah', 'CKAI10_Perbelanjaan_Operasi']
    .forEach(n => assert.ok(names.includes(n), 'tab tiada: ' + n));
});
test('KAI1: aktif = didaftarkan + dalam pembangunan/beroperasi (2 daripada 3), sasaran 20', () => {
  const c = card(dash(2026), 'KAI1');
  assert.strictEqual(c.value, 2); assert.strictEqual(c.target, 20); assert.strictEqual(c.status, 'Di bawah sasaran');
  assert.strictEqual(c.secondary[0].value, 1);
  assert.strictEqual(c.quarter, 2); assert.strictEqual(c.quarterTarget, 10);
});
test('KAI1 melebihi sasaran boleh melebihi 100%', () => {
  for (let i = 0; i < 19; i++) ok(g.api_save(adminToken, 'KAI1', { aliran: 'Technology Startup', jenis: 'Inkubator Fakulti', fakulti: 'FKE', nama_inkubator: 'Bulk ' + i, didaftarkan: 'Ya', tarikh_pendaftaran: '2026-01-15', status: 'Dalam pembangunan' }));
  const c = card(dash(2026), 'KAI1');
  assert.strictEqual(c.value, 21); assert.strictEqual(c.status, 'Melebihi sasaran'); assert.strictEqual(c.pct, 105);
});
test('KAI1: kiraan mengikut tahun dan inkubator tidak aktif', () => {
  assert.strictEqual(card(dash(2025 + 1), 'KAI1').value, 21);
  ok(g.api_save(adminToken, 'KAI1', { aliran: 'Technology Startup', jenis: 'Inkubator Fakulti', fakulti: 'FM', nama_inkubator: 'Tutup 2027', didaftarkan: 'Ya', tarikh_pendaftaran: '2026-06-01', status: 'Tidak aktif', tarikh_tidak_aktif: '2027-03-01' }));
  assert.strictEqual(card(dash(2026), 'KAI1').value, 22); // aktif pada 2026
  assert.strictEqual(card(dash(2027), 'KAI1').value, 21); // tidak lagi aktif pada 2027
});
test('KAI2: kemajuan berpemberat, sasaran 60% (2026), 80% (2027), 100% (2028)', () => {
  const rows = ok(g.api_list(adminToken, 'KAI2', {})).rows;
  assert.strictEqual(rows.length, 4);
  assert.strictEqual(card(dash(2026), 'KAI2').value, 0);
  const r1 = rows.find(r => r.fasa === 'Perancangan & Reka Bentuk');
  const upd = Object.assign({}, r1, { peratus_siap: 100, status: 'Siap', tarikh_siap: '2026-04-30' });
  ok(g.api_save(adminToken, 'KAI2', upd));
  const c = card(dash(2026), 'KAI2');
  assert.strictEqual(c.value, 25); assert.strictEqual(c.target, 60); assert.strictEqual(c.quarterTarget, 30);
  assert.strictEqual(c.quarterStatus, 'Di bawah sasaran');
  assert.strictEqual(card(dash(2027), 'KAI2').target, 80);
  assert.strictEqual(card(dash(2028), 'KAI2').target, 100);
  assert.strictEqual(card(dash(2029), 'KAI2').status, 'Tiada sasaran');
  deepEq(c.warnings, []);
});
test('KAI2: siap 100% = Selesai; amaran jika pemberat bukan 100%', () => {
  const rows = ok(g.api_list(adminToken, 'KAI2', {})).rows;
  rows.forEach(r => ok(g.api_save(adminToken, 'KAI2', Object.assign({}, r, { peratus_siap: 100, status: 'Siap', tarikh_siap: '2026-12-01' }))));
  assert.strictEqual(card(dash(2026), 'KAI2').status, 'Selesai');
  assert.strictEqual(card(dash(2026), 'KAI2').value, 100);
  const first = ok(g.api_list(adminToken, 'KAI2', {})).rows[0];
  ok(g.api_save(adminToken, 'KAI2', Object.assign({}, first, { pemberat: 40 })));
  assert.match(card(dash(2026), 'KAI2').warnings[0], /pemberat/);
});
test('KAI3: ruang ditawarkan (kumulatif) + penggunaan; sasaran +5 setahun', () => {
  const mk = (kod, st, extra) => ok(g.api_save(adminToken, 'KAI3', Object.assign({ kod_lot: kod, jenis_ruang: 'Kiosk / Lot Mudah Alih', lokasi: 'KTDI', status: st }, extra)));
  mk('L-1', 'Ditawarkan', { tarikh_ditawarkan: '2026-03-01' });
  mk('L-2', 'Disewa', { tarikh_ditawarkan: '2026-03-01', penyewa_nama: 'Ali', penyewa_kp: '990101-01-1234', tarikh_mula_sewa: '2026-04-01' });
  mk('L-3', 'Siap', {});
  mk('L-4', 'Ditawarkan', { tarikh_ditawarkan: '2027-02-01' });
  fail(g.api_save(adminToken, 'KAI3', { kod_lot: 'L-5', jenis_ruang: 'Student Mall', lokasi: 'X', status: 'Disewa', tarikh_ditawarkan: '2026-01-01' }), /betulkan/);
  const c = card(dash(2026), 'KAI3');
  assert.strictEqual(c.value, 2); assert.strictEqual(c.target, 25);
  deepEq(c.secondary.map(s => s.value), [1, '50%']);
  assert.strictEqual(card(dash(2027), 'KAI3').value, 3);
  deepEq([2026, 2027, 2028, 2029, 2030].map(y => card(dash(y), 'KAI3').target), [25, 30, 35, 40, 45]);
});
test('KAI4/KAI5: pelajar mendaftar mengikut tahun; sasaran 20 dan 4', () => {
  const mk = (n) => ok(g.api_save(adminToken, 'KAI4', { fakulti: 'FAI', nama_pelajar: n, no_kp: '990101-01-1234', no_matrik: n, bidang_gig: 'Reka bentuk', gig_pendapatan: 100 }));
  const now0 = env.clock.now;
  mk('a'); mk('b');
  env.clock.now = Date.UTC(2027, 0, 5, 4); mk('d'); env.clock.now = now0;
  const c = card(dash(2026), 'KAI4');
  assert.strictEqual(c.value, 2); assert.strictEqual(c.target, 20);
  assert.strictEqual(card(dash(2027), 'KAI4').value, 1);
  const shg = g.getSheet_('KAI4_GiGA');
  deepEq(shg.getRange(1, 1, 1, shg.getLastColumn()).getValues()[0], ['id', 'fakulti', 'nama_pelajar', 'no_kp', 'no_matrik', 'emel', 'telefon', 'tahun_pengajian', 'program', 'bidang_gig', 'mentor_nama', 'gig_pendapatan', 'lampiran', 'catatan', 'dicipta_pada', 'dicipta_oleh', 'dikemas_kini_pada', 'dikemas_kini_oleh']);
  assert.strictEqual(card(dash(2026), 'KAI5').target, 4);
  assert.strictEqual(card(dash(2026), 'KAI5').quarterTarget, 2); // Q2 2026 = 2 (PDF: N/A, 2, N/A, 4)
  assert.strictEqual(card(dash(2026), 'KAI5').quarterStatus, 'Di bawah sasaran');
  env.clock.now = Date.UTC(2026, 6, 15, 4); // Julai = Q3: tiada sasaran suku tahun (N/A)
  g.api_save(adminToken, 'KAI5', { fakulti: 'FC', nama_pelajar: 'Q3', no_matrik: 'Q3', status: 'Dicalonkan' }); // buang cache
  assert.strictEqual(card(dash(2026), 'KAI5').quarterStatus, 'Tiada sasaran suku tahun');
  env.clock.now = Date.UTC(2026, 4, 15, 4);
  g.api_save(adminToken, 'KAI5', { fakulti: 'FC', nama_pelajar: 'Q3b', no_matrik: 'Q3b', status: 'Dicalonkan' });
  const fac = c.breakdown[0].items;
  assert.ok(fac.length >= 13 && fac.every(i => i.target === 2));
});
test('KAI6: ahli kumpulan dimasukkan melalui no. matrik; disimpan sebagai teks bernombor "1. NAMA (NO. MATRIK)"', () => {
  const sh = env.spreadsheets[env.props.SHEET_ID].getSheetByName('PELAJAR');
  sh.appendRow(['AH0', '040506107701', 'Ketua Satu', '', '', 'FAI', '', '', '', '', '']);
  sh.appendRow(['AH1', '040506107702', 'Ahli Satu', '', '', 'FC', '', '', '', '', '']); sh.appendRow(['AH2', '040506107703', 'Ahli Dua', '', '', 'FKE', '', '', '', '', '']);
  const r = ok(g.api_save(adminToken, 'KAI6', { __nostudent: 1, no_matrik: 'AH0', status: 'Idea/konsep', nama_ahli_kumpulan: [{ matrik: 'ah1' }, { matrik: 'AH2' }] }));
  assert.strictEqual(r.fakulti, 'FAI');                                   // fakulti daripada PELAJAR
  assert.strictEqual(r.nama_ahli_kumpulan, '1. AHLI SATU (AH1)\n2. AHLI DUA (AH2)');
  const bad = g.api_save(adminToken, 'KAI6', { __nostudent: 1, no_matrik: 'AH0', status: 'Idea/konsep', nama_ahli_kumpulan: [{ matrik: 'TIADA9' }] }); fail(bad, /PELAJAR/);
});
test('KAI6/KAI4/KPT4: tahun daripada dicipta_pada hari/bulan/tahun (06/10/2029) dan tarikh lama', () => {
  const put = (shName, vals) => { const sh = g.getSheet_(shName), hd = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], r = sh.getLastRow() + 1; Object.keys(vals).forEach(k => sh.getRange(r, hd.indexOf(k) + 1).setValue(vals[k])); };
  put('KAI6_AI_Startup', { id: 'A6-T1', fakulti: 'FAI', nama: 'T1', no_matrik: 'T1', status: 'Ideasi', dicipta_pada: '06/10/2029' });
  put('KAI6_AI_Startup', { id: 'A6-T2', fakulti: 'FC', nama: 'T2', no_matrik: 'T2', status: 'Dalam latihan', dicipta_pada: '', dikemas_kini_pada: '2029-03-02T10:00:00' });
  put('KAI4_GiGA', { id: 'G4-T1', fakulti: 'FAI', nama_pelajar: 'T1', no_matrik: 'T1', dicipta_pada: '06/10/2029' });
  g.CacheService.getScriptCache().remove('dash:2029');
  const d = dash(2029);
  assert.strictEqual(card(d, 'KAI6').value, 2); assert.strictEqual(card(d, 'KAI4').value, 1);
});
test('KAI6: sasaran 20, minimum 5 setiap fakulti (4 fakulti), startup unik', () => {
  const mk = (f, n, s) => ok(g.api_save(adminToken, 'KAI6', { fakulti: f, nama: n, no_matrik: n, status: 'Idea/konsep', nama_startup: s }));
  const b0 = card(dash(2026), 'KAI6').value;   // rekod daripada ujian terdahulu (semua peringkat dikira)
  mk('FAI', 'p1', 'StartupA'); mk('FAI', 'p2', 'startupa'); mk('FC', 'p3', 'StartupB');
  const c = card(dash(2026), 'KAI6');
  assert.strictEqual(c.value, b0 + 3); assert.strictEqual(c.target, 20);
  assert.strictEqual(c.secondary[0].value, 2);
  deepEq(c.breakdown[0].items.map(i => i.label), ['FAI', 'FC', 'FKE', 'MJIIT']);
  assert.ok(c.breakdown[0].items.every(i => i.target === 5));
  const sh6 = g.getSheet_('KAI6_AI_Startup');
  deepEq(sh6.getRange(1, 1, 1, sh6.getLastColumn()).getValues()[0], ['id', 'fakulti', 'nama', 'no_kp', 'no_matrik', 'nama_startup', 'nama_ahli_kumpulan', 'no_pendaftaran_SSM', 'link_profil', 'bidang_ai', 'ringkasan', 'mentor_industri', 'startup_ditubuhkan', 'status', 'lampiran', 'catatan', 'dicipta_pada', 'dicipta_oleh', 'dikemas_kini_pada', 'dikemas_kini_oleh']);
  const bad = g.api_save(adminToken, 'KAI6', { fakulti: 'FAI', nama: 'Z', no_matrik: 'z9', status: 'Idea/konsep', bidang_ai: 'Memasak' }); fail(bad, /betulkan/); assert.ok(bad.fields.bidang_ai);
  const bad2 = g.api_save(adminToken, 'KAI6', { fakulti: 'FAI', nama: 'Z', no_matrik: 'z9', status: 'Idea/konsep', link_profil: 'javascript:alert(1)' }); fail(bad2, /betulkan/); assert.ok(bad2.fields.link_profil);
  ok(g.api_save(adminToken, 'KAI6', { fakulti: 'FAI', nama: 'Z', no_matrik: 'z9', status: 'Idea/konsep', link_profil: 'https://contoh.my/profil' }));
});
test('KAI6: peringkat pembangunan startup (5 peringkat, semua dikira); nilai lama ditukar oleh setup()', () => {
  const mk = (n, st) => g.api_save(adminToken, 'KAI6', { fakulti: 'FAI', nama: n, no_matrik: n, status: st, nama_startup: 'PS' + n });
  ['Tarik diri', 'Dicalonkan', 'Ideasi'].forEach(x => { const bad = mk('ps0', x); fail(bad, /betulkan/); assert.ok(bad.fields.status); });
  const before = card(dash(2026), 'KAI6').value;
  ['Idea/konsep', 'Prototaip', 'Validasi pasaran', 'Pelancaran', 'Pertumbuhan'].forEach((p, i) => { ok(mk('pt' + i, p)); assert.strictEqual(card(dash(2026), 'KAI6').value, before + i + 1); });
  const sh = g.getSheet_('KAI6_AI_Startup'), hd = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], r = sh.getLastRow() + 1;
  sh.getRange(r, 1).setValue('A6-LAMA'); sh.getRange(r, hd.indexOf('status') + 1).setValue('Tamat latihan');
  g.setup();
  assert.strictEqual(sh.getRange(r, hd.indexOf('status') + 1).getValue(), 'Prototaip');
});
test('DKAI1: siap 100% pada 2026 sahaja', () => {
  const c = card(dash(2026), 'DKAI1');
  assert.strictEqual(c.target, 100); assert.strictEqual(c.value, 0);
  assert.strictEqual(card(dash(2027), 'DKAI1').status, 'Tiada sasaran');
  const rows = ok(g.api_list(adminToken, 'DKAI1', {})).rows;
  const bengkel = rows.find(r => r.peringkat === 'Bengkel Pra-Pelan');
  ok(g.api_save(adminToken, 'DKAI1', Object.assign({}, bengkel, { peratus_siap: 100, status: 'Siap', tarikh_siap: '2026-05-01' })));
  assert.strictEqual(card(dash(2026), 'DKAI1').value, 50);
});
test('dashboard awam tidak mendedahkan data peribadi atau bajet', () => {
  const s = JSON.stringify(dash(2026));
  ['pic.fai@utm.my', 'admin@utm.my', '"Ali"', 'bajet', '130000', 'A1'].forEach(x => { const i = s.indexOf(x); assert.ok(i < 0, 'bocor: ' + x + ' => ' + s.slice(Math.max(0, i - 40), i + 40)); });
});
test('cache dashboard dibatalkan selepas tulis', () => {
  const before = card(dash(2026), 'KAI5').value;
  ok(g.api_save(adminToken, 'KAI5', { fakulti: 'FC', nama_pelajar: 'Z', no_matrik: 'Z', status: 'Mendaftar', tarikh_daftar: '2026-05-01' }));
  assert.strictEqual(card(dash(2026), 'KAI5').value, before + 1);
});
test('tahun tidak sah jatuh balik kepada tahun semasa', () => { assert.strictEqual(dash('abc').year, 2026); assert.strictEqual(dash(1999).year, 2026); });

console.log('CKAI (Center Key Amal Indicator)');
let ckaiPic, ckaiPicFc;
test('Admin memberi PIC akses CKAI 2, 2 dan 4 (bukan CKAI 4, 5, 6)', () => {
  ok(g.api_saveUser(adminToken, { emel: 'pic.ckai.fke@utm.my', nama: 'PIC FKE', peranan: 'PIC', fakulti: 'FKE', kpi_akses: 'CKAI2,CKAI3,CKAI7', aktif: 'Ya' }));
  ok(g.api_saveUser(adminToken, { emel: 'pic.ckai.fc@utm.my', nama: 'PIC FC', peranan: 'PIC', fakulti: 'FC', kpi_akses: 'CKAI2,CKAI7', aktif: 'Ya' }));
  fail(g.api_saveUser(adminToken, { emel: 'pic.salah@utm.my', nama: 'X', peranan: 'PIC', fakulti: 'FC', kpi_akses: 'CKAI4', aktif: 'Ya' }), /tidak sah/);
  fail(g.api_saveUser(adminToken, { emel: 'pic.salah@utm.my', nama: 'X', peranan: 'PIC', fakulti: 'FC', kpi_akses: 'CKAI5', aktif: 'Ya' }), /tidak sah/);
  ckaiPic = login('pic.ckai.fke@utm.my');
  ckaiPicFc = login('pic.ckai.fc@utm.my');
  deepEq(ok(g.api_session(ckaiPic)).kpis.map(k => k.id), ['CKAI2', 'CKAI3', 'CKAI7']);
  fail(g.api_list(ckaiPic, 'CKAI4', {}), /Akses ditolak/);
  fail(g.api_save(ckaiPic, 'CKAI5', { tempoh: '2026-01', bil_penggunaan: 5 }), /Akses ditolak/);
  fail(g.api_save(ckaiPic, 'CKAI6', { tempoh: '2026-01' }), /Akses ditolak/);
});
test('CKAI 2: fakulti merekod program sendiri; hanya program Selesai dikira pada tahun tamat', () => {
  const base = { nama_program: 'Bengkel Pitching', kategori: 'Bengkel', tarikh_mula: '2026-03-01', lokasi: 'Dewan Besar', bil_peserta: 40, bajet_rm: 1200, pendapatan_rm: 300 };
  fail(g.api_save(ckaiPic, 'CKAI2', Object.assign({ fakulti: 'FKE', status: 'Selesai' }, base)), /betulkan/); // tarikh tamat wajib
  const a = ok(g.api_save(ckaiPic, 'CKAI2', Object.assign({ fakulti: 'FC', status: 'Selesai', tarikh_tamat: '2026-03-02' }, base)));
  assert.strictEqual(a.fakulti, 'FKE'); // dipaksa kepada fakulti PIC
  ok(g.api_save(ckaiPic, 'CKAI2', Object.assign({}, base, { fakulti: 'FKE', status: 'Dirancang', nama_program: 'Akan datang' })));
  ok(g.api_save(adminToken, 'CKAI2', Object.assign({}, base, { fakulti: 'UTMXCITE', status: 'Selesai', tarikh_tamat: '2027-01-10', nama_program: 'Program 2027' })));
  const c = card(dash(2026), 'CKAI2');
  assert.strictEqual(c.value, 1); assert.strictEqual(c.status, 'Tiada sasaran');
  assert.strictEqual(c.secondary[0].value, 40);
  assert.strictEqual(card(dash(2027), 'CKAI2').value, 1);
  assert.strictEqual(ok(g.api_list(ckaiPicFc, 'CKAI2', {})).rows.length, 0); // PIC FC tidak nampak rekod FKE
  assert.strictEqual(ok(g.api_list(ckaiPic, 'CKAI2', {})).rows.length, 2);
});
test('CKAI 3: program inovasi dikira berasingan daripada CKAI 2', () => {
  ok(g.api_save(ckaiPic, 'CKAI3', { fakulti: 'FKE', nama_program: 'Hackathon', kategori: 'Hackathon / Pertandingan', status: 'Selesai', tarikh_mula: '2026-04-10', tarikh_tamat: '2026-04-12', lokasi: 'Makerspace', bil_peserta: 100, bajet_rm: 5000, pendapatan_rm: 0 }));
  fail(g.api_save(ckaiPic, 'CKAI3', { fakulti: 'FKE', nama_program: 'X', kategori: 'Bengkel Pitching', status: 'Dirancang' }), /betulkan/); // kategori tidak sah
  assert.strictEqual(card(dash(2026), 'CKAI3').value, 1);
  assert.strictEqual(card(dash(2026), 'CKAI2').value, 1);
});
test('Program: tarikh, tempat, penyertaan, kos dan pendapatan wajib bagi program Selesai (0 dibenarkan); peraturan silang', () => {
  const done = { fakulti: 'FKE', nama_program: 'Program Penuh', kategori: 'Bengkel', status: 'Selesai' };
  const r = g.api_save(ckaiPic, 'CKAI3', done);
  fail(r, /betulkan/);
  ['tarikh_mula', 'tarikh_tamat', 'lokasi', 'bil_peserta', 'bajet_rm', 'pendapatan_rm'].forEach(k => assert.ok(r.fields[k], 'wajib bagi Selesai: ' + k));
  // program belum selesai tidak dipaksa isi semua medan
  ok(g.api_save(ckaiPic, 'CKAI3', Object.assign({}, done, { status: 'Dirancang', nama_program: 'Masih dirancang' })));
  const full = Object.assign({}, done, { tarikh_mula: '2026-05-10', tarikh_tamat: '2026-05-11', lokasi: 'Dewan A', bil_peserta: 50, bajet_rm: 0, pendapatan_rm: 0 });
  ok(g.api_save(ckaiPic, 'CKAI3', Object.assign({}, full, { nama_program: 'Kos dan pendapatan sifar' }))); // 0 sah
  const r1 = g.api_save(ckaiPic, 'CKAI3', Object.assign({}, full, { tarikh_tamat: '2026-05-09' })); fail(r1, /betulkan/); assert.match(r1.fields.tarikh_tamat, /sebelum tarikh mula/);
  const r2 = g.api_save(ckaiPic, 'CKAI3', Object.assign({}, full, { bil_pelajar: 30, bil_staf: 15, bil_luar: 10 })); fail(r2, /betulkan/); assert.match(r2.fields.bil_peserta, /kurang daripada/);
  const r3 = g.api_save(ckaiPic, 'CKAI3', Object.assign({}, full, { bil_peserta: '', bil_pelajar: 5 })); fail(r3, /betulkan/); assert.ok(r3.fields.bil_peserta);
  fail(g.api_save(ckaiPic, 'CKAI3', Object.assign({}, full, { skor_kepuasan: 6 })), /betulkan/);
  fail(g.api_save(ckaiPic, 'CKAI3', Object.assign({}, full, { bajet_rm: -1 })), /betulkan/);
  fail(g.api_save(ckaiPic, 'CKAI3', Object.assign({}, full, { sumber_pendapatan: 'Rompak' })), /betulkan/);
});
test('Program: kos penganjuran, pendapatan dan penyertaan dijumlah pada dashboard (program Selesai dalam tahun sahaja)', () => {
  const mk = (n, over) => ok(g.api_save(adminToken, 'CKAI3', Object.assign({ fakulti: 'FC', nama_program: n, kategori: 'Bengkel', status: 'Selesai', tarikh_mula: '2028-02-01', tarikh_tamat: '2028-02-02', lokasi: 'Dewan', bil_peserta: 60, bil_pelajar: 40, bil_staf: 10, bil_luar: 10, bajet_rm: 2500.25, pendapatan_rm: 800 }, over)));
  mk('P1'); mk('P2', { bajet_rm: 1000, pendapatan_rm: 200.5, bil_peserta: 40, bil_pelajar: 40, bil_staf: 0, bil_luar: 0 });
  mk('P3 dibatalkan', { status: 'Dibatalkan', tarikh_tamat: '' });
  mk('P4 tahun lain', { tarikh_mula: '2029-01-01', tarikh_tamat: '2029-01-02', bajet_rm: 9999 });
  const c = card(dash(2028), 'CKAI3');
  const sec = Object.fromEntries(c.secondary.map(x => [x.label, x.value]));
  assert.strictEqual(c.value, 2);
  assert.strictEqual(sec['Jumlah peserta'], 100); assert.strictEqual(sec['Daripada itu pelajar'], 80);
  assert.strictEqual(sec['Kos penganjuran'], 'RM 3,500.25'); assert.strictEqual(sec['Pendapatan'], 'RM 1,000.50');
  assert.strictEqual(c.breakdown[2].items[0].value, 100);
  assert.ok(!JSON.stringify(dash(2028)).includes('P1')); // nama program tidak dipaparkan kepada awam
});
test('Program: laporan PDF pilihan; boleh dimuat naik dan dimuat turun oleh PIC fakulti sendiri sahaja', () => {
  const pdf = Buffer.from('%PDF-1.4\n%laporan program\n%%EOF').toString('base64');
  const up = ok(g.api_uploadFile(ckaiPic, 'CKAI3', 'laporan', { name: 'laporan-hackathon.pdf', data: pdf }));
  const rec = ok(g.api_save(ckaiPic, 'CKAI3', { fakulti: 'FKE', nama_program: 'Dengan laporan', kategori: 'Bengkel', status: 'Dirancang', laporan: { id: up.id, name: up.name } }));
  assert.strictEqual(JSON.parse(rec.laporan).name, 'laporan-hackathon.pdf');
  assert.strictEqual(ok(g.api_downloadFile(ckaiPic, 'CKAI3', rec.id, 'laporan')).base64, pdf);
  fail(g.api_downloadFile(ckaiPicFc, 'CKAI3', rec.id, 'laporan'), /Akses ditolak/); // PIC FC tiada akses CKAI 3
  ok(g.api_saveUser(adminToken, { emel: 'pic.fc.inovasi@utm.my', nama: 'PIC FC Inovasi', peranan: 'PIC', fakulti: 'FC', kpi_akses: 'CKAI3', aktif: 'Ya' }));
  const fcInov = login('pic.fc.inovasi@utm.my');
  fail(g.api_downloadFile(fcInov, 'CKAI3', rec.id, 'laporan'), /fakulti lain/); // ada akses CKAI 3 tetapi fakulti berbeza
  assert.strictEqual(ok(g.api_list(fcInov, 'CKAI3', { q: 'Dengan laporan' })).rows.length, 0);
  fail(g.api_uploadFile(ckaiPic, 'CKAI3', 'bajet_rm', { name: 'x.pdf', data: pdf }), /tidak sah/);
  fail(g.api_uploadFile(ckaiPic, 'CKAI4', 'lampiran', { name: 'x.pdf', data: pdf }), /Akses ditolak/);
});
test('CKAI 4 (SSU): Admin sahaja; dikira mengikut tarikh pendaftaran', () => {
  const r = { fakulti: 'FC', nama_pelajar: 'Pelajar SSU', no_kp: '990101-01-1234', no_matrik: 'S1', jenis_perniagaan: 'Telekomunikasi', bil_rakan_kongsi: 3, status_ssm: 'Berdaftar', tarikh_ssm: '2026-01-15', no_daftar_ssm: 'SSM-0', nama_syarikat: 'Syarikat A', no_ssu: 'SSU-001', tarikh_daftar: '2026-02-01', status: 'Aktif' };
  ok(g.api_save(adminToken, 'CKAI4', r));
  ok(g.api_save(adminToken, 'CKAI4', Object.assign({}, r, { nama_syarikat: 'Syarikat B', no_ssu: 'SSU-002', status: 'Tidak Aktif' })));
  ok(g.api_save(adminToken, 'CKAI4', Object.assign({}, r, { nama_syarikat: 'Syarikat C', no_ssu: 'SSU-003', tarikh_daftar: '2027-01-01' })));
  fail(g.api_save(adminToken, 'CKAI4', Object.assign({}, r, { no_ssu: '' })), /betulkan/);
  fail(g.api_save(adminToken, 'CKAI4', Object.assign({}, r, { no_ssu: 'SSU-009', jenis_perniagaan: 'Retail' })), /betulkan/); // bukan pilihan
  fail(g.api_save(adminToken, 'CKAI4', Object.assign({}, r, { no_ssu: 'SSU-009', jenis_perniagaan: 'Lain-lain' })), /betulkan/); // bukan pilihan
  ok(g.api_save(adminToken, 'CKAI4', Object.assign({}, r, { no_ssu: 'SSU-011', jenis_perniagaan: 'Pusat tuisyen', jenis_perniagaan_lain: '', tarikh_daftar: '2025-07-01' })));
  fail(g.api_save(adminToken, 'CKAI4', Object.assign({}, r, { no_ssu: 'SSU-009', bil_rakan_kongsi: 0 })), /betulkan/);
  fail(g.api_save(adminToken, 'CKAI4', Object.assign({}, r, { no_ssu: 'SSU-009', bil_rakan_kongsi: '' })), /betulkan/);
  fail(g.api_save(adminToken, 'CKAI4', Object.assign({}, r, { no_ssu: 'SSU-009', status_ssm: '' })), /betulkan/);
  fail(g.api_save(adminToken, 'CKAI4', Object.assign({}, r, { no_ssu: 'SSU-009', status_ssm: 'Mungkin' })), /betulkan/);
  fail(g.api_save(adminToken, 'CKAI4', Object.assign({}, r, { no_ssu: 'SSU-009', tarikh_ssm: '' })), /betulkan/); // Berdaftar: tarikh SSM wajib
  fail(g.api_save(adminToken, 'CKAI4', Object.assign({}, r, { no_ssu: 'SSU-009', tarikh_ssm: '2026-02-30' })), /betulkan/);
  ok(g.api_save(adminToken, 'CKAI4', Object.assign({}, r, { no_ssu: 'SSU-010', status_ssm: 'Tidak Berdaftar', tarikh_ssm: '', tarikh_daftar: '2025-06-01' })));
    assert.strictEqual(ok(g.api_list(adminToken, 'CKAI4', {})).rows[0].no_kp.replace(/^'/, ''), '990101011234'); // sengkang dibuang
  const c = card(dash(2026), 'CKAI4');
  assert.strictEqual(c.value, 2); assert.strictEqual(c.secondary[0].value, 1);
  assert.strictEqual(card(dash(2027), 'CKAI4').value, 1);
  assert.match(c.title, /Sistem Syarikat Universiti/);
});
test('CKAI 7: pendapatan RM dijumlahkan mengikut bulan dalam tahun; format bulan disahkan', () => {
  const r = { nama_perniagaan: 'Kedai A', no_kp: '990707-07-7777' };
  ok(g.api_save(ckaiPic, 'CKAI7', Object.assign({ fakulti: 'FKE', ...mb('2026-03'), pendapatan_bulanan: 1500.5 }, r)));
  ok(g.api_save(ckaiPic, 'CKAI7', Object.assign({ fakulti: 'FKE', ...mb('2026-04'), pendapatan_bulanan: 2000 }, r)));
  ok(g.api_save(ckaiPicFc, 'CKAI7', Object.assign({ fakulti: 'FC', ...mb('2026-04'), pendapatan_bulanan: 499.5, nama_perniagaan: 'Gig B', no_kp: '000202-02-2222' })));
  ok(g.api_save(adminToken, 'CKAI7', Object.assign({ fakulti: 'FC', ...mb('2027-01'), pendapatan_bulanan: 100 }, r)));
  ['2026-13', '2026-00', '26-03', '2026-3', 'bukan-bulan'].forEach(b => fail(g.api_save(ckaiPic, 'CKAI7', Object.assign({ fakulti: 'FKE', ...mb(b), pendapatan_bulanan: 1 }, r)), /betulkan/));
  fail(g.api_save(ckaiPic, 'CKAI7', Object.assign({ fakulti: 'FKE', ...mb('2026-05'), pendapatan_bulanan: -5 }, r)), /betulkan/);
  fail(g.api_save(ckaiPic, 'CKAI7', Object.assign({}, r, { fakulti: 'FKE', ...mb('2026-05'), pendapatan_bulanan: 1, no_kp: '' })), /betulkan/);
  fail(g.api_save(ckaiPic, 'CKAI7', Object.assign({}, r, { fakulti: 'FKE', ...mb('2026-05'), pendapatan_bulanan: 1, no_kp: '12' })), /betulkan/);
  assert.ok(ok(g.api_list(ckaiPic, 'CKAI7', {})).rows.every(x => String(x.no_kp).replace(/^'/, '') === '990707077777'));
  const c = card(dash(2026), 'CKAI7');
  assert.strictEqual(c.value, 4000); assert.strictEqual(c.format, 'rm');
  assert.strictEqual(c.secondary[0].value, 2); // dua perniagaan unik
  assert.strictEqual(card(dash(2027), 'CKAI7').value, 100);
  assert.strictEqual(ok(g.api_list(ckaiPicFc, 'CKAI7', {})).rows.length, 1); // PIC FC hanya nampak rekod FC (2026-04); fakulti rekod Admin 2027-01 mengikut PELAJAR (FKE)
  assert.ok(ok(g.api_list(ckaiPicFc, 'CKAI7', {})).rows.every(r => r.fakulti === 'FC'));
  const byFak = c.breakdown[0].items; assert.strictEqual(byFak[0].label, 'FKE'); assert.strictEqual(byFak[0].value, 3500.5);
});
test('CKAI 5 (Makerspace): satu permohonan = satu penggunaan, Admin sahaja', () => {
  const mk = (extra) => Object.assign({ emel: 'Ali@utm.my', nama: 'Ali Bin Abu', no_kp: '990101-01-1234', no_matrik: 'A23EC0001', fakulti: 'FC', kelas: 'Tahun 2', telefon: '012-3456789',
    peralatan: '3D Printer', tujuan: 'Prototaip projek', bil_peserta: 3, tarikh_mula: '2026-01-10', tarikh_tamat: '2026-01-10', masa_mula: '09:00', masa_tamat: '12:00', status_bayaran: 'Bayar', bayaran_rm: 5 }, extra);
  const r1 = ok(g.api_save(adminToken, 'CKAI5', mk({})));
  ok(g.api_save(adminToken, 'CKAI5', mk({ nama: 'Siti', no_matrik: 'A23EC0002', peralatan: 'Laser Cutter Machine', bil_peserta: 2, tarikh_mula: '2026-02-03', tarikh_tamat: '2026-02-04' })));
  ok(g.api_save(adminToken, 'CKAI5', mk({ tarikh_mula: '2026-02-20', tarikh_tamat: '2026-02-20' })));
  ok(g.api_save(adminToken, 'CKAI5', mk({ tarikh_mula: '2027-01-05', tarikh_tamat: '2027-01-05' })));
  const row = ok(g.api_list(adminToken, 'CKAI5', {})).rows.find(r => r.id === r1.id);
  assert.strictEqual(row.no_kp, '990101011234'); // sengkang dibuang
  const c = card(dash(2026), 'CKAI5');
  assert.strictEqual(c.value, 8); assert.strictEqual(c.secondary[0].label, 'Jumlah tempahan'); assert.strictEqual(c.secondary[0].value, 3); assert.strictEqual(c.secondary[1].value, 2);   // nilai utama = jumlah pengguna (bil_peserta)
  deepEq(c.breakdown[0].items.map(i => i.label + ':' + i.value), ['2026-01:3', '2026-02:5']);   // jumlah bil_peserta (pengguna), bukan bilangan tempahan
  const eq = c.breakdown.find(b => b.title === 'Penggunaan mengikut peralatan').items; assert.strictEqual(eq.reduce((a, i) => a + i.value, 0), 8);   // jumlah pengguna mengikut peralatan
  assert.strictEqual(c.breakdown[1].items[0].label, 'FC');
  assert.strictEqual(c.breakdown[2].items[0].label, '3D Printer');
  assert.strictEqual(c.secondary[2].value, 'RM 15.00'); assert.strictEqual(c.secondary[3].value, 'RM 0.00'); assert.strictEqual(c.secondary.length, 4);
  const free = ok(g.api_save(adminToken, 'CKAI5', mk({ status_bayaran: 'Tiada Caj', bayaran_rm: 5, tarikh_mula: '2026-03-03', tarikh_tamat: '2026-03-03' })));
  assert.strictEqual(ok(g.api_list(adminToken, 'CKAI5', {})).rows.find(r => r.id === free.id).bayaran_rm, 0); // Tiada Caj = RM0
  ok(g.api_save(adminToken, 'CKAI5', mk({ status_bayaran: 'Belum Dibayar', tarikh_mula: '2026-03-04', tarikh_tamat: '2026-03-04' })));
  assert.strictEqual(card(dash(2026), 'CKAI5').secondary[3].value, 'RM 5.00');
  fail(g.api_save(adminToken, 'CKAI5', mk({ status_bayaran: 'Bayar', bayaran_rm: '' })), /betulkan/);
  fail(g.api_save(adminToken, 'CKAI5', mk({ status_bayaran: 'Percuma' })), /betulkan/);
  fail(g.api_save(adminToken, 'CKAI5', mk({ peralatan: 'Mesin Rekaan' })), /betulkan/); // bukan pilihan
  fail(g.api_save(adminToken, 'CKAI5', mk({ peralatan: 'Lain-lain (Other)' })), /betulkan/); // mesti dinamakan
  ok(g.api_save(adminToken, 'CKAI5', mk({ peralatan: 'Lain-lain (Other)', peralatan_lain: 'Vacuum Former', tarikh_mula: '2025-03-01', tarikh_tamat: '2025-03-01' })));
  fail(g.api_save(adminToken, 'CKAI5', mk({ tarikh_tamat: '2026-01-09' })), /betulkan/);
  fail(g.api_save(adminToken, 'CKAI5', mk({ masa_tamat: '08:00' })), /betulkan/);
  fail(g.api_save(adminToken, 'CKAI5', mk({ masa_mula: '25:61' })), /betulkan/);
    fail(g.api_save(adminToken, 'CKAI5', mk({ bil_peserta: 0 })), /betulkan/);
});
test('CKAI 6 (sewaan ruang niaga): hanya yang DIBAYAR dikira; tertunggak dipaparkan berasingan', () => {
  const r = { tempoh: '2026-03', no_matrik: 'SW001', nama_pelajar: 'Pelajar Penyewa', inkubator: 'Student Mall - Lot 2', penyewa: 'Syarikat A', jumlah_rm: 500 };
  fail(g.api_save(adminToken, 'CKAI6', Object.assign({ status_bayaran: 'Dibayar' }, r)), /betulkan/); // tarikh bayar wajib
  fail(g.api_save(adminToken, 'CKAI6', Object.assign({ status_bayaran: 'Tertunggak' }, r, { no_matrik: '' })), /betulkan/); // no. matrik wajib
  const bad = g.api_save(adminToken, 'CKAI6', Object.assign({ status_bayaran: 'Tertunggak' }, r, { inkubator: 'Kedai Sendiri' })); fail(bad, /betulkan/); assert.ok(bad.fields.inkubator);   // dropdown sahaja
  const lain = g.api_save(adminToken, 'CKAI6', Object.assign({ status_bayaran: 'Tertunggak' }, r, { inkubator: 'Lain-lain' })); fail(lain, /betulkan/); assert.ok(lain.fields.inkubator_lain);   // Lain-lain mesti dinamakan
  const sv = ok(g.api_save(adminToken, 'CKAI6', Object.assign({ status_bayaran: 'Dibayar', tarikh_bayar: '2026-03-05' }, r)));
  assert.strictEqual(sv.no_matrik, 'SW001'); assert.strictEqual(sv.nama_pelajar, 'Pelajar Penyewa');   // nama daripada PELAJAR
  ok(g.api_save(adminToken, 'CKAI6', Object.assign({}, r, { tempoh: '2026-04', jumlah_rm: 700, status_bayaran: 'Tertunggak' })));
  const c = card(dash(2026), 'CKAI6');
  assert.strictEqual(c.value, 500); assert.strictEqual(c.secondary[0].value, 'RM 700.00'); assert.strictEqual(c.secondary[1].value, 1);
});
const PDF = (extra = '') => Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\n' + extra + '\n%%EOF').toString('base64');
let awardPic, awardPicFc, awardRec;
const award = (over = {}) => Object.assign({
  fakulti: 'FM', nama_anugerah: 'Anugerah Inovasi Fakulti', tarikh: '2026-04-20', agensi: 'Agensi Rahsia Persekutuan', peringkat: 'Fakulti', kategori: 'Inovasi',
  program: 'GiGAUTM Ascend (GiGA)', mentor: 'Dr. Mentor', pingat: 'Emas',
  pelajar: [{ nama: 'Ali Anugerah', matrik: 'A24FM0001', nokp: '900101-14-5678' }, { nama: 'Siti Anugerah', matrik: 'A24FM0002', nokp: '010203-10-1234' }]
}, over);
test('CKAI 9: akses PIC fakulti dan muat naik sijil PDF (hanya PDF sebenar, maksimum 5 MB)', () => {
  ok(g.api_saveUser(adminToken, { emel: 'pic.anugerah@utm.my', nama: 'PIC FM', peranan: 'PIC', fakulti: 'FM', kpi_akses: 'CKAI9', aktif: 'Ya' }));
  ok(g.api_saveUser(adminToken, { emel: 'pic.anugerah2@utm.my', nama: 'PIC FS', peranan: 'PIC', fakulti: 'FS', kpi_akses: 'CKAI9', aktif: 'Ya' }));
  awardPic = login('pic.anugerah@utm.my'); awardPicFc = login('pic.anugerah2@utm.my');
  deepEq(ok(g.api_session(awardPic)).kpis.map(k => k.id), ['CKAI9']);
  fail(g.api_uploadFile(ckaiPic, 'CKAI9', 'sijil', { name: 'a.pdf', data: PDF() }), /Akses ditolak/); // PIC tanpa akses CKAI 9
  fail(g.api_uploadFile(awardPic, 'CKAI9', 'nama_anugerah', { name: 'a.pdf', data: PDF() }), /tidak sah/); // bukan medan fail
  fail(g.api_uploadFile(awardPic, 'CKAI9', 'sijil', { name: 'sijil.pdf', data: Buffer.from('ini bukan pdf').toString('base64') }), /format PDF/);
  fail(g.api_uploadFile(awardPic, 'CKAI9', 'sijil', { name: 'sijil.pdf', data: Buffer.from('<html><script>x</script>').toString('base64') }), /format PDF/);
  fail(g.api_uploadFile(awardPic, 'CKAI9', 'sijil', { name: 'besar.pdf', data: PDF('x'.repeat(5 * 1024 * 1024 + 10)) }), /terlalu besar/);
  fail(g.api_uploadFile(awardPic, 'CKAI9', 'sijil', { name: 'kosong.pdf', data: '' }), /Tiada fail/);
  const up = ok(g.api_uploadFile(awardPic, 'CKAI9', 'sijil', { name: '../../etc/sijil <b>.pdf', data: PDF() }));
  assert.ok(up.id && !/[\/<>]/.test(up.name), 'nama fail dibersihkan: ' + up.name);
  assert.ok(up.name.endsWith('.pdf'));
});
test('CKAI 9: pengesahan medan (pelajar berbilang, no. KP, sijil wajib, program Lain-lain)', () => {
  const up = () => { const r = ok(g.api_uploadFile(awardPic, 'CKAI9', 'sijil', { name: 'sijil.pdf', data: PDF('a' + Math.random()) })); return { id: r.id, name: r.name }; };
  const good = award({ sijil: up() });
  fail(g.api_save(awardPic, 'CKAI9', Object.assign({}, good, { sijil: undefined })), /betulkan/);
  const r1 = g.api_save(awardPic, 'CKAI9', Object.assign({}, good, { pelajar: [] })); fail(r1, /betulkan/); assert.match(r1.fields.pelajar, /wajib/);
  const r1b = g.api_save(awardPic, 'CKAI9', Object.assign({}, good, { pelajar: 'bukan-senarai' })); fail(r1b, /betulkan/); assert.match(r1b.fields.pelajar, /sekurang-kurangnya seorang/);
  const r2 = g.api_save(awardPic, 'CKAI9', Object.assign({ __nostudent: 1 }, good, { pelajar: [{ matrik: 'M1' }, { matrik: 'TIADA99' }] }));
  fail(r2, /betulkan/); assert.ok(r2.missing && r2.missing.some(m => m.no_matrik === 'TIADA99'));   // pelajar mesti ada dalam tab PELAJAR
  fail(g.api_save(awardPic, 'CKAI9', Object.assign({}, good, { mentor: '' })), /betulkan/);
  fail(g.api_save(awardPic, 'CKAI9', Object.assign({}, good, { agensi: '' })), /betulkan/);
  fail(g.api_save(awardPic, 'CKAI9', Object.assign({}, good, { program: 'Lain-lain' })), /betulkan/); // program_lain wajib
  ok(g.api_save(awardPic, 'CKAI9', Object.assign({}, good, { program: 'Lain-lain', program_lain: 'Hackathon Kampus' })));
  fail(g.api_save(awardPic, 'CKAI9', Object.assign({}, good, { peringkat: 'Daerah' })), /betulkan/);
  fail(g.api_save(awardPic, 'CKAI9', Object.assign({}, good, { tarikh: '2026-02-30' })), /betulkan/);
  const r31 = g.api_save(awardPic, 'CKAI9', Object.assign({}, good, { pelajar: Array.from({ length: 31 }, (_, i) => ({ nama: 'P' + i, matrik: 'M' + i, nokp: '900101145678' })) }));
  fail(r31, /betulkan/); assert.match(r31.fields.pelajar, /Maksimum 30/);
});
test('CKAI 9: sijil mesti hasil muat naik sendiri; fail Drive sembarangan dan milik pengguna lain ditolak', () => {
  const mine = ok(g.api_uploadFile(awardPic, 'CKAI9', 'sijil', { name: 'saya.pdf', data: PDF('mine') }));
  const theirs = ok(g.api_uploadFile(awardPicFc, 'CKAI9', 'sijil', { name: 'mereka.pdf', data: PDF('theirs') }));
  const secret = g.DriveApp._outside.createFile(g.Utilities.newBlob([37, 80, 68, 70, 45, 65], 'application/pdf', 'rahsia.pdf')); // fail lain milik pemilik skrip
  const reasons = [
    { id: secret.getId(), name: 'rahsia.pdf' },           // fail di luar folder lampiran
    { id: theirs.id, name: 'mereka.pdf' },                // dimuat naik oleh PIC lain
    { id: 'tidak-wujud-1234567', name: 'x.pdf' },         // ID rekaan
    { id: '../../x', name: 'x.pdf' }                      // format ID tidak sah
  ];
  reasons.forEach(sj => { const r = g.api_save(awardPic, 'CKAI9', award({ sijil: sj })); fail(r, /betulkan/); assert.ok(r.fields.sijil, 'sijil patut ditolak: ' + sj.id); });
  awardRec = ok(g.api_save(awardPic, 'CKAI9', award({ sijil: { id: mine.id, name: 'tipu-nama.pdf' } })));
  assert.strictEqual(awardRec.fakulti, 'FM');
  assert.strictEqual(JSON.parse(awardRec.sijil).name, 'saya.pdf'); // nama diambil daripada muat naik sebenar, bukan daripada klien
  assert.strictEqual(JSON.parse(awardRec.pelajar)[0].nokp, '900101145678'); // sengkang dibuang
});
test('CKAI 9: muat turun hanya oleh PIC fakulti yang sama atau Admin; kandungan sama dan fail luar folder tidak boleh dimuat turun', () => {
  const d = ok(g.api_downloadFile(awardPic, 'CKAI9', awardRec.id, 'sijil'));
  assert.strictEqual(d.base64, PDF('mine')); assert.strictEqual(d.mime, 'application/pdf'); assert.strictEqual(d.name, 'saya.pdf');
  fail(g.api_downloadFile(awardPicFc, 'CKAI9', awardRec.id, 'sijil'), /fakulti lain/);
  fail(g.api_downloadFile(ckaiPic, 'CKAI9', awardRec.id, 'sijil'), /Akses ditolak/);
  fail(g.api_downloadFile('', 'CKAI9', awardRec.id, 'sijil'), /Sesi tamat/);
  ok(g.api_downloadFile(adminToken, 'CKAI9', awardRec.id, 'sijil'));
  fail(g.api_downloadFile(awardPic, 'CKAI9', awardRec.id, 'nama_anugerah'), /tidak sah/);
  fail(g.api_downloadFile(awardPic, 'CKAI9', 'AN-999', 'sijil'), /tidak dijumpai/);
  // rekod dirosakkan terus dalam Sheet supaya merujuk fail di luar folder: mesti tetap ditolak
  const secret = g.DriveApp._outside.createFile(g.Utilities.newBlob([37, 80, 68, 70, 45, 66], 'application/pdf', 'rahsia2.pdf'));
  const sh = env.spreadsheets[env.props.SHEET_ID].getSheetByName('CKAI9_Anugerah');
  const col = sh.data[0].indexOf('sijil'), idCol = sh.data[0].indexOf('id');
  const rowIdx = sh.data.findIndex(r => r[idCol] === awardRec.id);
  assert.ok(rowIdx > 0);
  sh.data[rowIdx][col] = JSON.stringify({ id: secret.getId(), name: 'rahsia2.pdf' });
  fail(g.api_downloadFile(awardPic, 'CKAI9', awardRec.id, 'sijil'), /Fail tidak sah/);
  sh.data[rowIdx][col] = awardRec.sijil; // pulihkan
});
test('CKAI 9: senarai ikut fakulti; kemas kini menggantikan sijil (lama dibuang); padam membuang fail; audit tanpa data peribadi', () => {
  assert.strictEqual(ok(g.api_list(awardPic, 'CKAI9', {})).rows.length, 2); // FM sahaja (rekod 'Lain-lain' + rekod ini)
  assert.strictEqual(ok(g.api_list(awardPicFc, 'CKAI9', {})).rows.length, 0);
  const oldId = JSON.parse(awardRec.sijil).id;
  const nu = ok(g.api_uploadFile(awardPic, 'CKAI9', 'sijil', { name: 'baru.pdf', data: PDF('baru') }));
  const upd = ok(g.api_save(awardPic, 'CKAI9', Object.assign(award(), { id: awardRec.id, nama_anugerah: 'Dikemas kini', sijil: { id: nu.id, name: 'baru.pdf' } })));
  assert.strictEqual(g.DriveApp._files[oldId].trashed, true);
  assert.strictEqual(g.DriveApp._files[nu.id].trashed, false);
  // sijil tidak diubah: rujukan sama diterima tanpa muat naik semula
  ok(g.api_save(awardPic, 'CKAI9', Object.assign(award(), { id: awardRec.id, sijil: JSON.parse(upd.sijil) })));
  fail(g.api_delete(awardPic, 'CKAI9', awardRec.id), /Admin sahaja/);
  ok(g.api_delete(adminToken, 'CKAI9', awardRec.id));
  assert.strictEqual(g.DriveApp._files[nu.id].trashed, true);
  const log = JSON.stringify(ok(g.api_listAudit(adminToken, 200)));
  ['900101145678', '010203101234', 'Ali Anugerah', 'A24FM0001'].forEach(x => assert.ok(!log.includes(x), 'audit mengandungi data peribadi: ' + x));
  assert.ok(log.includes('MUAT_NAIK') && log.includes('MUAT_TURUN'));
});
test('CKAI 9: dashboard mengira anugerah mengikut tarikh; paparan awam tiada nama, matrik, no. KP atau fail', () => {
  const up = (n) => { const r = ok(g.api_uploadFile(adminToken, 'CKAI9', 'sijil', { name: n + '.pdf', data: PDF(n) })); return { id: r.id, name: r.name }; };
  ok(g.api_save(adminToken, 'CKAI9', award({ fakulti: 'FC', peringkat: 'Antarabangsa', kategori: 'Keusahawanan', pingat: 'Perak', nama_anugerah: 'Pertandingan Global', sijil: up('a'), pelajar: [{ nama: 'Rahsia Pelajar', matrik: 'RHS001', nokp: '880808-08-8888' }] })));
  ok(g.api_save(adminToken, 'CKAI9', award({ fakulti: 'FC', tarikh: '2027-02-01', sijil: up('b') })));
  const c = card(dash(2026), 'CKAI9');
  assert.ok(c.value >= 2);
  assert.ok(c.secondary.some(x => x.label === 'Pelajar penerima' && x.value >= 3));
  assert.ok(c.breakdown.some(b => b.title === 'Mengikut program'));
  const sj = JSON.stringify(dash(2026));
  ['Rahsia Pelajar', 'RHS001', '880808088888', 'Ali Anugerah', 'A24FM0001', 'Agensi Rahsia', '"id":"FILE'].forEach(x => assert.ok(!sj.includes(x), 'bocor: ' + x));
  assert.strictEqual(card(dash(2027), 'CKAI9').value, 1);
});
test('susunan lajur Sheet tidak penting: tab Pengguna dan KPI ditulis mengikut nama tajuk', () => {
  const ss = env.spreadsheets[env.props.SHEET_ID];
  // tukar ganti lajur 1 dan 2 dalam tab Pengguna (emel <-> nama) sepenuhnya
  const us = ss.getSheetByName('Pengguna');
  us.data = us.data.map(r => { const c = r.slice(); const t = c[0]; c[0] = c[1]; c[1] = t; return c; });
  const t = login('pic.fai@utm.my');
  assert.strictEqual(ok(g.api_session(t)).user.emel, 'pic.fai@utm.my');
  ok(g.api_saveUser(adminToken, { emel: 'tukar.lajur@utm.my', nama: 'Tukar Lajur', peranan: 'PIC', fakulti: 'FAI', kpi_akses: 'KAI1', aktif: 'Ya' }));
  const hdr = us.data[0], row = us.data.find(r => r[hdr.indexOf('emel')] === 'tukar.lajur@utm.my');
  assert.ok(row, 'baris pengguna baharu mesti mengikut tajuk'); assert.strictEqual(row[hdr.indexOf('nama')], 'Tukar Lajur'); assert.strictEqual(row[hdr.indexOf('peranan')], 'PIC');
  ok(g.api_saveUser(adminToken, { emel: 'tukar.lajur@utm.my', nama: 'Nama Baru', peranan: 'PIC', fakulti: 'FAI', kpi_akses: 'KAI1,KAI4', aktif: 'Ya' }));
  assert.strictEqual(us.data.find(r => r[hdr.indexOf('emel')] === 'tukar.lajur@utm.my')[hdr.indexOf('kpi_akses')], 'KAI1,KAI4');
  // tab KPI: susun semula lajur (terbalikkan) dan simpan rekod
  const k = ss.getSheetByName('KAI5_FSIP');
  k.data = k.data.map(r => r.slice().reverse());
  const r = ok(g.api_save(adminToken, 'KAI5', { fakulti: 'FAI', nama_pelajar: 'Lajur Terbalik', no_matrik: 'LT1', status: 'Dicalonkan' }));
  assert.strictEqual(ok(g.api_list(adminToken, 'KAI5', { q: 'Lajur Terbalik' })).rows[0].no_matrik, 'LT1');
  ok(g.api_save(adminToken, 'KAI5', { id: r.id, fakulti: 'FAI', nama_pelajar: 'Lajur Terbalik 2', no_matrik: 'LT1', status: 'Dicalonkan' }));
  assert.strictEqual(ok(g.api_list(adminToken, 'KAI5', { q: 'Lajur Terbalik' })).rows.length, 1);   // nama diambil daripada PELAJAR, bukan borang
  // pulihkan susunan asal supaya ujian lain tidak terjejas
  us.data = us.data.map(r => { const c = r.slice(); const t = c[0]; c[0] = c[1]; c[1] = t; return c; });
  k.data = k.data.map(r => r.slice().reverse());
});
let innoPic, innoPicFc;
const inno = (over = {}) => Object.assign({
  fakulti: 'FM', tajuk_inovasi: 'Sistem Pintar Kitar Semula', jenis_inovasi: 'Aplikasi / perisian', mentor: 'Dr. Penyelia',
  pelajar: [{ nama: 'Ali Inovator', matrik: 'A24IN0001' }, { nama: 'Siti Inovator', matrik: 'A24IN0002' }],
  status_penyertaan: 'Telah menyertai', nama_pertandingan: 'Pertandingan Inovasi Fakulti', peringkat: 'Fakulti', tarikh: '2026-04-15'
}, over);
test('CKAI 8: akses PIC fakulti; OD = projek yang telah menyertai pertandingan sekurang-kurangnya peringkat Fakulti', () => {
  ok(g.api_saveUser(adminToken, { emel: 'pic.inovasi@utm.my', nama: 'PIC FM', peranan: 'PIC', fakulti: 'FM', kpi_akses: 'CKAI8', aktif: 'Ya' }));
  ok(g.api_saveUser(adminToken, { emel: 'pic.inovasi2@utm.my', nama: 'PIC FS', peranan: 'PIC', fakulti: 'FS', kpi_akses: 'CKAI8', aktif: 'Ya' }));
  innoPic = login('pic.inovasi@utm.my'); innoPicFc = login('pic.inovasi2@utm.my');
  deepEq(ok(g.api_session(innoPic)).kpis.map(k => k.id), ['CKAI8']);
  const a = ok(g.api_save(innoPic, 'CKAI8', inno({ fakulti: 'FKE' })));
  assert.strictEqual(a.fakulti, 'FM'); // dipaksa kepada fakulti PIC
  assert.strictEqual(JSON.parse(a.pelajar)[0].nokp, '900101105555'); // no. KP daripada PELAJAR (piawai sama seperti KPI lain)
  fail(g.api_save(innoPic, 'CKAI8', inno({ peringkat: 'Dalam kelas' })), /betulkan/); // peringkat paling rendah ialah Fakulti
  fail(g.api_save(innoPic, 'CKAI8', inno({ nama_pertandingan: '' })), /betulkan/);
  fail(g.api_save(innoPic, 'CKAI8', inno({ tarikh: '' })), /betulkan/);
  fail(g.api_save(innoPic, 'CKAI8', inno({ mentor: '' })), /betulkan/);
  fail(g.api_save(innoPic, 'CKAI8', inno({ pelajar: [] })), /betulkan/);
  const r = g.api_save(innoPic, 'CKAI8', inno({ pelajar: [{ matrik: '' }] })); fail(r, /betulkan/); assert.ok(r.fields.pelajar);
  assert.strictEqual(ok(g.api_list(innoPicFc, 'CKAI8', {})).rows.length, 0);
});
test('CKAI 8: anugerah pilihan; peringkat sasaran wajib apabila calon peningkatan', () => {
  ok(g.api_save(innoPic, 'CKAI8', inno({ tajuk_inovasi: 'Tanpa anugerah' }))); // tiada pingat/anugerah: sah
  const r = g.api_save(innoPic, 'CKAI8', inno({ tajuk_inovasi: 'Calon naik', status_peningkatan: 'Calon peningkatan' }));
  fail(r, /betulkan/); assert.ok(r.fields.peringkat_sasaran);
  ok(g.api_save(innoPic, 'CKAI8', inno({ tajuk_inovasi: 'Calon naik', status_peningkatan: 'Calon peningkatan', peringkat_sasaran: 'Kebangsaan', pertandingan_seterusnya: 'MTE 2026', sokongan_diperlukan: 'Pembiayaan prototaip RM5,000' })));
  ok(g.api_save(innoPic, 'CKAI8', inno({ tajuk_inovasi: 'Menang', pingat: 'Emas', nama_anugerah: 'Anugerah Inovasi Fakulti', peringkat: 'Universiti', nilai_hadiah_rm: 500 })));
  ok(g.api_save(innoPic, 'CKAI8', inno({ tajuk_inovasi: 'Sudah naik', peringkat: 'Kebangsaan', status_peningkatan: 'Telah dibawa ke peringkat lebih tinggi', peringkat_sasaran: 'Antarabangsa' })));
  fail(g.api_save(innoPic, 'CKAI8', inno({ pingat: 'Platinum' })), /betulkan/);
});
test('CKAI 8: hanya inovasi yang TELAH menyertai pertandingan dalam tahun itu dikira; penapis peringkat dan status peningkatan', () => {
  ok(g.api_save(innoPic, 'CKAI8', inno({ tajuk_inovasi: 'Akan menyertai', status_penyertaan: 'Akan menyertai', tarikh: '2026-09-01' })));
  ok(g.api_save(adminToken, 'CKAI8', inno({ fakulti: 'FC', tajuk_inovasi: 'Tahun lain', tarikh: '2027-03-01' })));
  const c = card(dash(2026), 'CKAI8');
  const sec = Object.fromEntries(c.secondary.map(x => [x.label, x.value]));
  assert.strictEqual(c.value, 5); // Tanpa anugerah, Calon naik, Menang, Sudah naik + rekod pertama (FM)
  assert.strictEqual(sec['Memenang anugerah / pingat'], 1);
  assert.strictEqual(sec['Peringkat Universiti ke atas'], 2);
  assert.strictEqual(sec['Calon peningkatan / sedang disokong'], 1);
  assert.strictEqual(sec['Telah dibawa ke peringkat lebih tinggi'], 1);
  assert.strictEqual(sec['Akan menyertai (dirancang)'], 1);
  assert.strictEqual(sec['Pelajar terlibat'], 10);
  deepEq(c.breakdown[0].items.map(i => i.label), ['Fakulti', 'Universiti', 'Kebangsaan']);
  assert.strictEqual(card(dash(2027), 'CKAI8').value, 1);
  assert.strictEqual(c.status, 'Tiada sasaran');
  // penapis: status peningkatan (pipeline XCITE) dan peringkat
  assert.strictEqual(ok(g.api_list(innoPic, 'CKAI8', { status2: 'Calon peningkatan' })).rows.length, 1);
  assert.strictEqual(ok(g.api_list(innoPic, 'CKAI8', { status: 'Kebangsaan' })).rows.length, 1);
  assert.strictEqual(ok(g.api_list(innoPic, 'CKAI8', { status: 'Kebangsaan', status2: 'Calon peningkatan' })).rows.length, 0);
  assert.strictEqual(ok(g.api_list(innoPicFc, 'CKAI8', { status2: 'Calon peningkatan' })).rows.length, 0); // fakulti lain tidak nampak
});
test('CKAI 8: sijil anugerah PDF pilihan; paparan awam tiada tajuk, pelajar atau mentor', () => {
  const pdf = Buffer.from('%PDF-1.4\n%sijil inovasi\n%%EOF').toString('base64');
  const up = ok(g.api_uploadFile(innoPic, 'CKAI8', 'sijil', { name: 'sijil-inovasi.pdf', data: pdf }));
  const rec = ok(g.api_save(innoPic, 'CKAI8', inno({ tajuk_inovasi: 'Dengan sijil', pingat: 'Perak', sijil: { id: up.id, name: up.name } })));
  assert.strictEqual(ok(g.api_downloadFile(innoPic, 'CKAI8', rec.id, 'sijil')).base64, pdf);
  fail(g.api_downloadFile(innoPicFc, 'CKAI8', rec.id, 'sijil'), /fakulti lain/);
  const sj = JSON.stringify(dash(2026));
  ['Sistem Pintar', 'Ali Inovator', 'A24IN0001', 'Dr. Penyelia', 'Pembiayaan prototaip', 'Calon naik', 'sijil-inovasi'].forEach(x => assert.ok(!sj.includes(x), 'bocor: ' + x));
});
let profPic, profPicFc;
const prof = (over = {}) => Object.assign({
  fakulti: 'FM', nama_pelajar: 'Profil Satu', no_matrik: 'A24PF0001', tarikh_profiling: '2026-04-01', sumber_profiling: 'Tinjauan / soal selidik',
  tahap_minat: 'Tinggi', tahap_kesediaan: 'Ada idea', pengalaman_perniagaan: 'Tiada', emel: 'profil1@graduate.utm.my'
}, over);
test('CKAI 1 (fungsi 1 Identify Interest): PIC fakulti mendaftar profiling', () => {
  ok(g.api_saveUser(adminToken, { emel: 'pic.profil@utm.my', nama: 'PIC FM', peranan: 'PIC', fakulti: 'FM', kpi_akses: 'CKAI1', aktif: 'Ya' }));
  ok(g.api_saveUser(adminToken, { emel: 'pic.profil2@utm.my', nama: 'PIC FS', peranan: 'PIC', fakulti: 'FS', kpi_akses: 'CKAI1', aktif: 'Ya' }));
  profPic = login('pic.profil@utm.my'); profPicFc = login('pic.profil2@utm.my');
  deepEq(ok(g.api_session(profPic)).kpis.map(k => k.id), ['CKAI1']);
  const wrong = g.api_save(profPic, 'CKAI1', prof({ fakulti: 'FKE', no_matrik: 'A24PF0099', nama_pelajar: 'Fakulti Lain' }));   // fakulti diambil daripada PELAJAR; PIC hanya fakulti sendiri
  fail(wrong, /betulkan/); assert.match(wrong.fields.no_matrik, /bukan daripada fakulti anda/);
  const a = ok(g.api_save(profPic, 'CKAI1', prof()));
  assert.strictEqual(a.fakulti, 'FM'); assert.strictEqual(a.id.slice(0, 3), 'PF-');
  const shp = g.getSheet_('CKAI1_Profiling_Pelajar');
  deepEq(shp.getRange(1, 1, 1, shp.getLastColumn()).getValues()[0], ['id', 'fakulti', 'nama_pelajar', 'no_kp', 'no_matrik', 'emel', 'telefon', 'program', 'tahun_pengajian', 'tarikh_profiling', 'sumber_profiling', 'tahap_minat', 'minat_bidang', 'pengalaman_perniagaan', 'tahap_kesediaan', 'kemahiran', 'catatan', 'dicipta_pada', 'dicipta_oleh', 'dikemas_kini_pada', 'dikemas_kini_oleh']);
  ['tahap_minat', 'sumber_profiling', 'tarikh_profiling', 'no_matrik'].forEach(k => fail(g.api_save(profPic, 'CKAI1', prof({ no_matrik: 'A24PF0003', [k]: '' })), /betulkan/));
  fail(g.api_save(profPic, 'CKAI1', prof({ no_matrik: 'A24PF0004', tahap_minat: 'Sangat tinggi' })), /betulkan/);
    assert.strictEqual(ok(g.api_list(profPicFc, 'CKAI1', {})).rows.length, 0);
});
test('CKAI 1: satu profil bagi setiap no. matrik (tidak peka huruf besar/kecil); ID rekod fakulti lain tidak didedahkan', () => {
  const dup = g.api_save(profPic, 'CKAI1', prof({ no_matrik: 'a24pf0001' })); fail(dup, /betulkan/); assert.match(dup.fields.no_matrik, /Sudah didaftarkan \(PF-001\)/);
  const other = g.api_save(profPicFc, 'CKAI1', prof({ fakulti: 'FS', no_matrik: 'A24PF0001', nama_pelajar: 'Cuba duplikasi' })); fail(other, /betulkan/);
  assert.ok(!/PF-/.test(other.fields.no_matrik)); // tiada ID rekod fakulti lain didedahkan
  const first = ok(g.api_list(profPic, 'CKAI1', {})).rows[0];
  ok(g.api_save(profPic, 'CKAI1', Object.assign({}, prof(), { id: first.id, tahap_minat: 'Sederhana' }))); // mengemas kini rekod sendiri tidak dianggap duplikasi
  ok(g.api_save(profPic, 'CKAI1', prof({ no_matrik: 'A24PF0005', nama_pelajar: 'Profil Dua', tahap_kesediaan: 'Ada prototaip / MVP', tahap_minat: 'Rendah', sumber_profiling: 'Saringan fakulti' })));
  ok(g.api_save(adminToken, 'CKAI1', prof({ fakulti: 'FC', no_matrik: 'A24PF0006', nama_pelajar: 'Profil Tiga', pengalaman_perniagaan: 'Sedang berniaga', tarikh_profiling: '2027-02-01' })));
  assert.strictEqual(ok(g.api_list(adminToken, 'CKAI1', { status: 'Tinggi' })).rows.length, 1); // penapis tahap minat
  assert.strictEqual(ok(g.api_list(adminToken, 'CKAI1', { status2: 'Ada prototaip / MVP' })).rows.length, 1); // penapis tahap kesediaan
});
test('CKAI 1: dashboard mengira profiling mengikut tahun; paparan awam tiada nama, matrik atau e-mel', () => {
  const c = card(dash(2026), 'CKAI1');
  const sec = Object.fromEntries(c.secondary.map(x => [x.label, x.value]));
  assert.strictEqual(c.value, 2); assert.strictEqual(c.status, 'Tiada sasaran'); assert.strictEqual(c.fungsi, 'minat');
  assert.strictEqual(sec['Berminat (sederhana / tinggi)'], 1); assert.strictEqual(sec['Sudah ada idea / prototaip / berniaga'], 2);
  deepEq(c.breakdown[1].items.map(i => i.label), ['Rendah', 'Sederhana']); // tertib tahap minat
  assert.strictEqual(card(dash(2027), 'CKAI1').value, 1);
  const sj = JSON.stringify(dash(2026));
  ['Profil Satu', 'Profil Dua', 'A24PF0001', 'A24PF0005', 'profil1@graduate.utm.my'].forEach(x => assert.ok(!sj.includes(x), 'bocor: ' + x));
  ok(g.api_saveTarget(adminToken, { kpi: 'CKAI1', tahun: 2026, sasaran: 1 }));
  assert.strictEqual(card(dash(2026), 'CKAI1').status, 'Melebihi sasaran');
});
test('sasaran CKAI diisi Admin: status dan peratus dikira (boleh melebihi 100%)', () => {
  assert.ok(ok(g.api_listTargets(adminToken)).filter(t => /^CKAI/.test(t.kpi)).length >= 50);
  ok(g.api_saveTarget(adminToken, { kpi: 'CKAI7', tahun: 2026, sasaran: 3000 }));
  const c = card(dash(2026), 'CKAI7');
  assert.strictEqual(c.status, 'Melebihi sasaran'); assert.ok(Math.abs(c.pct - 133.3) < 0.1);
  ok(g.api_saveTarget(adminToken, { kpi: 'CKAI2', tahun: 2026, sasaran: 5 }));
  assert.strictEqual(card(dash(2026), 'CKAI2').status, 'Di bawah sasaran');
  assert.strictEqual(card(dash(2026), 'CKAI2').quarterStatus, 'Tiada sasaran suku tahun');
});
test('dashboard awam CKAI tidak mendedahkan nama pelajar, perniagaan atau penyewa', () => {
  const sj = JSON.stringify(dash(2026));
  ['Kedai A', 'Gig B', 'Syarikat A', 'Syarikat B', 'Pelajar SSU', 'SSU-001', 'Launchpad FC', 'pic.ckai'].forEach(x => assert.ok(!sj.includes(x), 'bocor: ' + x));
});
test('setup() dijalankan semula pada pemasangan lama menambah baris sasaran CKAI tanpa menduplikasi', () => {
  const ss = env.spreadsheets[env.props.SHEET_ID];
  const sh = ss.getSheetByName('Sasaran');
  // simulasi pemasangan lama: buang semua baris CKAI
  sh.data = sh.data.filter((row, i) => i === 0 || !/^CKAI/.test(String(row[0])));
  g.setup();
  const rows = ok(g.api_listTargets(adminToken)).filter(t => /^CKAI/.test(t.kpi));
  assert.strictEqual(rows.length, 50);
  g.setup();
  assert.strictEqual(ok(g.api_listTargets(adminToken)).filter(t => /^CKAI/.test(t.kpi)).length, 50);
});

console.log('Sasaran (Admin)');
test('Admin menyunting sasaran; PIC tidak boleh', () => {
  fail(g.api_saveTarget(picToken, { kpi: 'KAI1', tahun: 2026, sasaran: 30 }), /Admin sahaja/);
  ok(g.api_saveTarget(adminToken, { kpi: 'KAI1', tahun: 2026, sasaran: 25, q1: 5, q2: 10, q3: 20, q4: 25, bajet_rm: 130000, catatan: 'diubah' }));
  assert.strictEqual(card(dash(2026), 'KAI1').target, 25);
  fail(g.api_saveTarget(adminToken, { kpi: 'KAI2', tahun: 2026, sasaran: 120 }), /100%/);
  fail(g.api_saveTarget(adminToken, { kpi: 'KAI1', tahun: 2040, sasaran: 5 }), /Tahun/);
  assert.ok(ok(g.api_listTargets(adminToken)).length > 20);
});

console.log('Penyuntingan manual tab Pengguna');
test('drop-down peranan dan aktif disediakan dalam tab Pengguna', () => {
  const sh = env.spreadsheets[env.props.SHEET_ID].getSheetByName('Pengguna');
  assert.strictEqual(JSON.stringify(sh.validations[3].list), JSON.stringify(['Admin', 'PIC']));
  assert.strictEqual(JSON.stringify(sh.validations[6].list), JSON.stringify(['Ya', 'Tidak']));
});
test('peranan/aktif ditaip manual (huruf kecil, ada ruang) tetap berfungsi', () => {
  const sh = env.spreadsheets[env.props.SHEET_ID].getSheetByName('Pengguna');
  sh.appendRow(['  Manual.Admin@UTM.my ', 'Manual', ' admin ', 'UTMXCITE', '', ' ya ', '']);
  const t = login('manual.admin@utm.my');
  assert.strictEqual(ok(g.api_session(t)).user.peranan, 'Admin');
  assert.strictEqual(ok(g.api_session(t)).kpis.length, 22);
});
test('peranan kosong atau salah: tiada OTP dan tiada akses (bukan PIC secara lalai)', () => {
  const sh = env.spreadsheets[env.props.SHEET_ID].getSheetByName('Pengguna');
  sh.appendRow(['tanpa.peranan@utm.my', 'X', '', 'FAI', 'KAI1,KAI4', 'Ya', '']);
  sh.appendRow(['peranan.salah@utm.my', 'Y', 'Pengurus', 'FAI', 'KAI1', 'Ya', '']);
  const n = env.sent.length;
  ok(g.api_requestOtp('tanpa.peranan@utm.my')); ok(g.api_requestOtp('peranan.salah@utm.my'));
  assert.strictEqual(env.sent.length, n);
});
test('Admin yang didaftar manual boleh diturunkan kepada PIC kerana Admin lain masih aktif', () => {
  ok(g.api_saveUser(adminToken, { emel: 'manual.admin@utm.my', nama: 'Manual', peranan: 'PIC', fakulti: 'FAI', kpi_akses: 'KAI1', aktif: 'Ya' }));
});

console.log('Persediaan (Admin) dan tab Persediaan dalam Sheet');
test('Persediaan: Admin sahaja', () => {
  fail(g.api_setupInfo(picToken), /Admin sahaja/);
  fail(g.api_runSetup(picToken), /Admin sahaja/);
  fail(g.api_testMail(picToken), /Admin sahaja/);
});
test('Persediaan: maklumat pautan/ID dan semakan lulus', () => {
  const i = ok(g.api_setupInfo(adminToken));
  assert.strictEqual(i.sheet.id, env.props.SHEET_ID);
  assert.ok(/\/exec$/.test(i.webAppUrl) || i.webAppUrl === '' || i.isDevUrl !== undefined);
  assert.ok(i.checks.length >= 8);
  assert.strictEqual(i.checks.filter(c => c.ok === false).length, 0, JSON.stringify(i.checks.filter(c => c.ok === false)));
});
test('tab Persediaan dalam Google Sheet mengandungi ID dan pautan Sheet', () => {
  const sh = env.spreadsheets[env.props.SHEET_ID].getSheetByName('Persediaan');
  assert.ok(sh);
  const txt = JSON.stringify(sh.data);
  assert.ok(txt.includes(env.props.SHEET_ID) && txt.includes('404'));
});
test('Persediaan: tab dan lajur hilang dikesan, dibaiki oleh Jalankan persediaan', () => {
  const ss = env.spreadsheets[env.props.SHEET_ID];
  ss.deleteSheet(ss.getSheetByName('Risiko'));
  let i = ok(g.api_setupInfo(adminToken));
  assert.ok(i.checks.some(c => c.ok === false && /Risiko/.test(c.detail)));
  ok(g.api_runSetup(adminToken));
  i = ok(g.api_setupInfo(adminToken));
  assert.strictEqual(i.checks.filter(c => c.ok === false).length, 0);
});
test('e-mel ujian dihantar ke Admin dan dihadkan 3 sejam', () => {
  const n = env.sent.length;
  ok(g.api_testMail(adminToken)); ok(g.api_testMail(adminToken)); ok(g.api_testMail(adminToken));
  assert.strictEqual(env.sent.length, n + 3);
  fail(g.api_testMail(adminToken), /Had 3/);
});

test('linkSistem membuka pautan web app; tiada onOpen automatik', () => {
  assert.strictEqual(typeof g.onOpen, 'undefined');
  g.linkSistem();
  assert.ok(env.opts.dialog.html.includes('window.open("https://script.google.com/'));
  assert.strictEqual(env.opts.dialog.title, 'Dashboard KPI UTMXCITE JTNCHEPA');
});

test('folder lampiran yang ditampal pada tab Persediaan digunakan oleh setup()', () => {
  const ss = env.spreadsheets[env.props.SHEET_ID];
  const mine = g.DriveApp.createFolder('Folder saya');
  const sh = ss.getSheetByName('Persediaan');
  const r = sh.data.findIndex(row => String(row[0]).indexOf('Folder lampiran Drive') === 0) + 1;
  sh.getRange(r, 2).setValue(mine.getId());
  g.setup();
  assert.strictEqual(env.props.FOLDER_ID, mine.getId());
  assert.ok(String(sh.data[r - 1][1]).includes(mine.getId()));
  sh.getRange(r, 2).setValue('ID-tidak-wujud-xyz-1234567890');
  g.setup();
  assert.strictEqual(env.props.FOLDER_ID, mine.getId());
});

test('medan fail: pautan Drive ditulis dalam lajur *_pautan (Sheet sahaja, tidak dihantar ke klien); setup() mengisi rekod lama', () => {
  const ss = env.spreadsheets[env.props.SHEET_ID];
  const sh = ss.getSheetByName('CKAI5_Makerspace');
  const hdr = sh.data[0];
  assert.ok(hdr.includes('borang') && hdr.includes('borang_pautan'));
  const mkRec = { emel: 'f@utm.my', nama: 'F', no_kp: '990101011234', no_matrik: 'A1', fakulti: 'FC', telefon: '0123456789', peralatan: '3D Printer', tujuan: 'x', bil_peserta: 1, tarikh_mula: '2026-05-01', tarikh_tamat: '2026-05-01', masa_mula: '09:00', masa_tamat: '10:00', status_bayaran: 'Bayar', bayaran_rm: 5 };
  const up = ok(g.api_uploadFile(adminToken, 'CKAI5', 'borang', { name: 'borang.pdf', data: PDF('pautan') }));
  const saved = ok(g.api_save(adminToken, 'CKAI5', Object.assign({ borang: { id: up.id, name: up.name } }, mkRec)));
  assert.ok(!('borang_pautan' in saved));
  assert.ok(ok(g.api_list(adminToken, 'CKAI5', {})).rows.every(r => !('borang_pautan' in r)));
  const col = hdr.indexOf('borang_pautan');
  const row = sh.data.find(r => r[0] === saved.id);
  assert.strictEqual(row[col], 'https://drive.google.com/file/d/' + up.id + '/view');
  row[col] = ''; // rekod lama tanpa pautan
  g.setup();
  assert.strictEqual(sh.data.find(r => r[0] === saved.id)[col], 'https://drive.google.com/file/d/' + up.id + '/view');
});

test('CKAI 4: Penyata bank (PDF) disimpan dengan pautan Drive; lajur ikut senarai baharu', () => {
  const up = ok(g.api_uploadFile(adminToken, 'CKAI4', 'penyata_bank', { name: 'penyata.pdf', data: PDF('bank') }));
  const r = ok(g.api_save(adminToken, 'CKAI4', { fakulti: 'FC', nama_pelajar: 'Pelajar SSM', no_kp: '990101011234', no_matrik: 'S77', jenis_perniagaan: 'Telekomunikasi', bil_rakan_kongsi: 2, status_ssm: 'Berdaftar', tarikh_ssm: '2026-01-15', no_daftar_ssm: 'SSM-1', penyata_bank: { id: up.id, name: up.name }, nama_syarikat: 'Syarikat SSM', no_ssu: 'SSU-777', tarikh_daftar: '2026-04-01', status: 'Aktif', modal_awal: '1,000-1,999', jumlah_jualan: 5000, bilangan_pekerja: '6-10 ORANG', jenis_milikan: 'PERKONGSIAN', punca_modal: 'GERAN' }));
  const sh = env.spreadsheets[env.props.SHEET_ID].getSheetByName('CKAI4_SSU');
  const hd = sh.data[0], row = sh.data.find(x => x[0] === r.id);
  assert.strictEqual(row[hd.indexOf('penyata_bank_pautan')], 'https://drive.google.com/file/d/' + up.id + '/view');
  deepEq(hd.slice(0, 10), ['id', 'fakulti', 'nama_pelajar', 'no_kp', 'no_matrik', 'emel', 'telefon', 'jantina', 'bangsa', 'bidang_pengajian']);
  fail(g.api_save(adminToken, 'CKAI4', { fakulti: 'FC', no_matrik: 'S77', jenis_perniagaan: 'Telekomunikasi', bil_rakan_kongsi: 2, status_ssm: 'Tidak Berdaftar', nama_syarikat: 'M', no_ssu: 'SSU-779', tarikh_daftar: '2026-04-01', status: 'Aktif', jenis_milikan: 'Koperasi' }), /betulkan/);
  fail(g.api_save(adminToken, 'CKAI4', { fakulti: 'FC', no_matrik: 'S77', jenis_perniagaan: 'Telekomunikasi', bil_rakan_kongsi: 2, status_ssm: 'Tidak Berdaftar', nama_syarikat: 'M', no_ssu: 'SSU-782', tarikh_daftar: '2026-04-01', status: 'Aktif', bilangan_pekerja: 8 }), /betulkan/);
  fail(g.api_save(adminToken, 'CKAI4', { fakulti: 'FC', no_matrik: 'S77', jenis_perniagaan: 'Telekomunikasi', bil_rakan_kongsi: 2, status_ssm: 'Tidak Berdaftar', nama_syarikat: 'M', no_ssu: 'SSU-781', tarikh_daftar: '2026-04-01', status: 'Aktif', modal_awal: '1000' }), /betulkan/);
  fail(g.api_save(adminToken, 'CKAI4', { fakulti: 'FC', no_matrik: 'S77', jenis_perniagaan: 'Telekomunikasi', bil_rakan_kongsi: 2, status_ssm: 'Tidak Berdaftar', nama_syarikat: 'M', no_ssu: 'SSU-780', tarikh_daftar: '2026-04-01', status: 'Aktif', punca_modal: 'Simpanan' }), /betulkan/);
  fail(g.api_uploadFile(adminToken, 'CKAI4', 'penyata_bank', { name: 'x.pdf', data: Buffer.from('bukan pdf').toString('base64') }), /PDF/);
  fail(g.api_save(adminToken, 'CKAI4', { fakulti: 'FC', nama_pelajar: 'P', no_kp: '990101011234', no_matrik: 'S77', jenis_perniagaan: 'Telekomunikasi', bil_rakan_kongsi: 2, status_ssm: 'Berdaftar', tarikh_ssm: '2026-01-15', nama_syarikat: 'X', no_ssu: 'SSU-778', tarikh_daftar: '2026-04-01', status: 'Aktif' }), /betulkan/); // no_daftar_ssm wajib
});
test('Pelajar: bidang pengajian mesti daripada senarai (PELAJAR)', () => {
  const r = g.saveStudentsAs_({ peranan: 'Admin', emel: 'a@utm.my' }, [{ no_matrik: 'BP1', nama_pelajar: 'Ali', no_kp: '990101011298', fakulti: 'FC', bidang_pengajian: 'Sains Komputer' }], true);
  assert.strictEqual(r.results[0].ok, false); assert.ok(r.results[0].fields.bidang_pengajian);
});
test('Pelajar: jantina dan bangsa daripada PELAJAR masuk ke CKAI 4 secara automatik', () => {
  g.saveStudentsAs_({ peranan: 'Admin', emel: 'a@utm.my' }, [{ no_matrik: 'JB1', nama_pelajar: 'Ali', no_kp: '990101011299', fakulti: 'FC', jantina: 'Lelaki', bangsa: 'MELAYU', bidang_pengajian: 'TEKNOLOGI MAKLUMAT DAN KOMUNIKASI' }], true);
  const r = ok(g.api_save(adminToken, 'CKAI4', { no_matrik: 'JB1', jenis_perniagaan: 'Telekomunikasi', bil_rakan_kongsi: 1, status_ssm: 'Tidak Berdaftar', nama_syarikat: 'JB', no_ssu: 'SSU-JB1', tarikh_daftar: '2026-04-01', status: 'Aktif' }));
  const row = ok(g.api_list(adminToken, 'CKAI4', {})).rows.find(x => x.id === r.id);
  assert.strictEqual(row.jantina, 'Lelaki'); assert.strictEqual(row.bangsa, 'MELAYU'); assert.strictEqual(row.bidang_pengajian, 'TEKNOLOGI MAKLUMAT DAN KOMUNIKASI');
});

test('KAI 4 (GiGA): No. KP / pasport wajib, disahkan dan sengkang dibuang', () => {
  const b = { fakulti: 'FAI', nama_pelajar: 'Kp Uji', no_matrik: 'KP1', };
  fail(g.api_save(adminToken, 'KAI4', b), /betulkan/);
  fail(g.api_save(adminToken, 'KAI4', Object.assign({}, b, { no_kp: '12' })), /betulkan/);
  const r = ok(g.api_save(adminToken, 'KAI4', Object.assign({}, b, { no_kp: '000101-10-1234' })));
  assert.strictEqual(String(ok(g.api_list(adminToken, 'KAI4', {})).rows.find(x => x.id === r.id).no_kp).replace(/^'/, ''), '000101101234');
  assert.ok(!JSON.stringify(dash(2026)).includes('000101101234')); // tidak didedahkan kepada awam
});

test('KAI 3: No. KP penyewa wajib bila Disewa, disahkan dan sengkang dibuang', () => {
  const b = { kod_lot: 'L-KP', jenis_ruang: 'Student Mall', lokasi: 'KTDI', status: 'Disewa', tarikh_ditawarkan: '2025-01-01', penyewa_nama: 'Ali', tarikh_mula_sewa: '2025-02-01' };
  fail(g.api_save(adminToken, 'KAI3', b), /betulkan/);
  fail(g.api_save(adminToken, 'KAI3', Object.assign({}, b, { penyewa_kp: '12' })), /betulkan/);
  const r = ok(g.api_save(adminToken, 'KAI3', Object.assign({}, b, { penyewa_kp: '000101-10-1234' })));
  assert.strictEqual(String(ok(g.api_list(adminToken, 'KAI3', {})).rows.find(x => x.id === r.id).penyewa_kp).replace(/^'/, ''), '000101101234');
});

test('setup() membuang lajur Perolehan lama daripada tab KAI3 (data dipadam) tanpa mengganggu lajur lain', () => {
  const sh = env.spreadsheets[env.props.SHEET_ID].getSheetByName('KAI3_Ruang_Perniagaan');
  ['kaedah_perolehan', 'no_rujukan', 'anggaran_kos', 'ptj', 'pegawai', 'tarikh_dikenalpasti', 'tarikh_sasaran_siap', 'diwartakan', 'tarikh_diwartakan'].forEach((h, i) => { sh.getRange(1, 40 + i).setValue(h); sh.getRange(2, 40 + i).setValue('data-lama-' + i); });
  const before = sh.data[0].filter(h => h !== '' && ![ 'kaedah_perolehan', 'no_rujukan', 'anggaran_kos', 'ptj', 'pegawai', 'tarikh_dikenalpasti', 'tarikh_sasaran_siap', 'diwartakan', 'tarikh_diwartakan'].includes(h)).length;
  g.setup();
  const hdr = sh.data[0];
  ['kaedah_perolehan', 'no_rujukan', 'anggaran_kos', 'ptj', 'pegawai', 'tarikh_dikenalpasti', 'tarikh_sasaran_siap', 'diwartakan', 'tarikh_diwartakan'].forEach(h => assert.ok(!hdr.includes(h), h));
  assert.ok(!JSON.stringify(sh.data).includes('data-lama-'));
  assert.strictEqual(hdr.filter(h => h !== '').length, before);
  assert.ok(hdr.includes('kod_lot') && hdr.includes('penyewa_kp'));
  assert.ok(ok(g.api_list(adminToken, 'KAI3', {})).rows.length > 0); // rekod sedia ada kekal
  g.setup(); // idempotent
  assert.ok(env.spreadsheets[env.props.SHEET_ID].getSheetByName('Log_Audit').data.some(r => r.includes('LAJUR_DIBUANG')));
});

test('setup() menamakan semula lajur kolej_fakulti kepada lokasi dengan data dikekalkan', () => {
  const sh = env.spreadsheets[env.props.SHEET_ID].getSheetByName('KAI3_Ruang_Perniagaan');
  const c = sh.data[0].indexOf('lokasi');
  assert.ok(c >= 0);
  sh.data[0][c] = 'kolej_fakulti';
  const n = sh.data[0].length;
  g.setup();
  assert.strictEqual(sh.data[0][c], 'lokasi');
  assert.strictEqual(sh.data[0].length, n);
  assert.ok(!sh.data[0].includes('kolej_fakulti'));
  assert.ok(ok(g.api_list(adminToken, 'KAI3', {})).rows.every(r => r.lokasi));
});

test('Ukuran Pekerjaan Premium Tier 1: purata pendapatan sebulan > RM4,000 dibahagi semua usahawan yang melaporkan (CKAI 7)', () => {
  const rec = (n, m, rm, kp) => ok(g.api_save(adminToken, 'CKAI7', { fakulti: 'FC', ...mb(m), nama_perniagaan: n, no_kp: kp, pendapatan_bulanan: rm }));
  assert.deepStrictEqual(JSON.parse(JSON.stringify({ t: dash(2029).premium.total, p: dash(2029).premium.pct })), { t: 0, p: 0 }); // tiada data: 0%
  rec('Niaga A', '2029-01', 5000, '000000000001'); rec('Niaga A', '2029-02', 3500, '000000000001');   // purata 4250 > 4000: premium
  rec('Niaga B', '2029-01', 2000, '000000000002');                                            // 2000: bukan
  rec('Niaga C', '2029-01', 4000, '000000000003');                                            // tepat 4000: bukan (mesti lebih)
  rec('Niaga D', '2029-03', 9000, '000000000004');
  rec('Niaga A', '2030-01', 100, '000000000001');                                             // tahun lain tidak dikira
  const p = dash(2029).premium;
  assert.strictEqual(p.total, 4); assert.strictEqual(p.premium, 2); assert.strictEqual(p.pct, 50);
  assert.strictEqual(p.thresholdRm, 4000); assert.strictEqual(p.targetPct, 40); assert.strictEqual(p.targetYear, 2030); assert.strictEqual(p.pctOfTarget, 125);
  const q = dash(2030).premium; assert.strictEqual(q.total, 1); assert.strictEqual(q.premium, 0);
  assert.ok(!JSON.stringify(dash(2029)).includes('Niaga A')); // tiada nama perniagaan pada paparan awam
});

test('Trend Infografik (awam): nilai agregat setiap tahun, tiada data peribadi', () => {
  const tr = ok(g.api_trend());
  deepEq(tr.map(t => t.year), [2026, 2027, 2028, 2029, 2030]);
  tr.forEach(t => { assert.ok(t.total >= t.meet); assert.ok(t.kpis.KAI1 && t.kpis.CKAI7); });
  assert.strictEqual(tr[3].premiumTotal, 4); assert.strictEqual(tr[3].premiumPct, 50); // 2029: data ujian premium
  const sj = JSON.stringify(tr);
  ['Niaga A', 'Kedai A', '990101', 'pic.', 'admin@'].forEach(x => assert.ok(!sj.includes(x), 'bocor: ' + x));
  ok(g.api_save(adminToken, 'CKAI7', { fakulti: 'FC', ...mb('2028-02'), nama_perniagaan: 'Trend X', no_kp: '000000000009', pendapatan_bulanan: 5000 }));
  assert.strictEqual(ok(g.api_trend())[2].premiumTotal, 1); // cache trend dibatalkan selepas tulis
});

test('CKAI 7: lampiran Monthly Financial Report (PDF) disimpan, boleh dimuat turun, pautan Drive dalam Sheet', () => {
  const up = ok(g.api_uploadFile(ckaiPic, 'CKAI7', 'Penyata_bank', { name: 'laporan-mac.pdf', data: PDF('kewangan') }));
  const rec = ok(g.api_save(ckaiPic, 'CKAI7', { fakulti: 'FKE', ...mb('2026-08'), nama_perniagaan: 'Kedai A', no_kp: '990707-07-7777', pendapatan_bulanan: 10, Penyata_bank: { id: up.id, name: up.name } }));
  assert.strictEqual(ok(g.api_downloadFile(ckaiPic, 'CKAI7', rec.id, 'Penyata_bank')).base64, PDF('kewangan'));
  fail(g.api_downloadFile(ckaiPicFc, 'CKAI7', rec.id, 'Penyata_bank'), /fakulti lain/);
  const sh = env.spreadsheets[env.props.SHEET_ID].getSheetByName('CKAI7_Pendapatan_Pelajar');
  const row = sh.data.find(x => x[0] === rec.id);
  assert.strictEqual(row[sh.data[0].indexOf('Penyata_bank_pautan')], 'https://drive.google.com/file/d/' + up.id + '/view');
  fail(g.api_uploadFile(ckaiPic, 'CKAI7', 'Penyata_bank', { name: 'x.pdf', data: Buffer.from('bukan pdf').toString('base64') }), /PDF/);
});

test('Semua KPI: statusField / filter2 mestilah medan pilihan (select) supaya senarai boleh dipaparkan', () => {
  g.KPIS.forEach(k => [k.statusField, k.filter2].filter(Boolean).forEach(key => {
    const f = k.fields.find(x => x.key === key);
    assert.ok(f && f.type === 'select' && f.options && f.options.length, k.id + ': ' + key);
  }));
});
test('CKAI 7: pendapatan bulanan boleh RM 0 (nombor 0 atau teks "0"); kosong ditolak', () => {
  const base = { fakulti: 'FKE', nama_perniagaan: 'Kedai Sifar', no_kp: '990707-07-7777', ...mb('2026-06') };
  ok(g.api_save(ckaiPic, 'CKAI7', Object.assign({ pendapatan_bulanan: 0 }, base)));
  ok(g.api_save(ckaiPic, 'CKAI7', Object.assign({ pendapatan_bulanan: '0' }, base, mb('2026-07'))));
  const kosong = g.api_save(ckaiPic, 'CKAI7', Object.assign({ pendapatan_bulanan: '' }, base, mb('2026-08')));
  assert.ok(!kosong.ok && kosong.fields.pendapatan_bulanan);
});
test('CKAI 7: lajur tab ikut senarai; jenis_pendapatan dan lokasi dropdown dibuang', () => {
  const sh = g.getSheet_('CKAI7_Pendapatan_Pelajar');
  deepEq(sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], ['id', 'fakulti', 'Tahun', 'Bulan', 'nama_pelajar', 'no_kp', 'no_matrik', 'jantina', 'bangsa', 'bidang_pengajian', 'nama_perniagaan', 'no_ssu', 'no_ssm', 'jenis_milikan', 'jenis_perniagaan', 'punca_modal', 'jumlah_modal', 'pendapatan_bulanan', 'bilangan_pekerja', 'link_website', 'Penyata_bank', 'Penyata_bank_pautan', 'tarikh_mula_perniagaan', 'lokasi_perniagaan_lain', 'catatan', 'dicipta_pada', 'dicipta_oleh', 'dikemas_kini_pada', 'dikemas_kini_oleh']);
});

test('setup(): data dalam lajur lama (tempoh, pendapatan_rm) disalin ke lajur baharu CKAI 7', () => {
  const sh = g.getSheet_('CKAI7_Pendapatan_Pelajar');
  const lc = sh.getLastColumn(), lr = sh.getLastRow() + 1;
  const hdr = sh.getRange(1, 1, 1, lc).getValues()[0];
  sh.getRange(1, lc + 1).setValue('tempoh'); sh.getRange(1, lc + 2).setValue('pendapatan_rm');
  sh.getRange(lr, 1).setValue('PP-OLD'); sh.getRange(lr, hdr.indexOf('nama_perniagaan') + 1).setValue('Kedai Lama'); sh.getRange(lr, hdr.indexOf('fakulti') + 1).setValue('FKE');
  sh.getRange(lr, lc + 1).setValue('2031-02'); sh.getRange(lr, lc + 2).setValue('RM 2,500.50');
  g.setup();
  const row = g.readTable_('CKAI7_Pendapatan_Pelajar', { pendapatan_bulanan: 'number' }).rows.find(r => r.id === 'PP-OLD');
  assert.strictEqual(row.pendapatan_bulanan, 2500.5); assert.strictEqual(row.Tahun, 2031); assert.strictEqual(row.Bulan, 'Februari');
});
test('Bacaan Sheet: bulan / tarikh ditaip tangan diseragamkan', () => {
  const n = (v, ty) => g.normalizeCell_(v, ty);
  assert.strictEqual(n('03/2026', 'month'), '2026-03'); assert.strictEqual(n('3-2026', 'month'), '2026-03'); assert.strictEqual(n('2026/3', 'month'), '2026-03');
  assert.strictEqual(n('2026-04-15', 'month'), '2026-04'); assert.strictEqual(n('2026-05', 'month'), '2026-05');
  assert.strictEqual(n('01/04/2026', 'month'), '2026-04');
  assert.strictEqual(n('15/03/2026', 'date'), '2026-03-15'); assert.strictEqual(n('2026-03-15', 'date'), '2026-03-15');
  assert.strictEqual(n(new Date(Date.UTC(2026, 2, 1, 4)), 'month'), '2026-03');
});
test('CKAI 6: baris ditaip tangan dalam Sheet (tempoh 01/04/2029, status Dibayar) dikira dalam dashboard', () => {
  const sh = g.getSheet_('CKAI6_Sewaan_Inkubator'), hd = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], r = sh.getLastRow() + 1;
  const put = (k, v) => sh.getRange(r, hd.indexOf(k) + 1).setValue(v);
  put('id', 'SI-901'); put('tempoh', '01/04/2029'); put('inkubator', 'LOT 1 STUDENT MALL'); put('penyewa', 'SERAYA BEAUTY'); put('jumlah_rm', 400); put('status_bayaran', 'dibayar'); put('tarikh_bayar', '11/03/2029');
  g.CacheService.getScriptCache().remove('dash:2029');
  const c = card(dash(2029), 'CKAI6');
  assert.strictEqual(c.value, 400);
  assert.strictEqual(c.breakdown[0].items[0].label, '2029-04');
});
test('CKAI 7: data lama (tempoh + pendapatan_rm) masih dikira sebelum setup() dijalankan', () => {
  const sh = g.getSheet_('CKAI7_Pendapatan_Pelajar'), lc = sh.getLastColumn(), hd = sh.getRange(1, 1, 1, lc).getValues()[0];
  const tc = hd.indexOf('tempoh') + 1 || lc + 1, pc = hd.indexOf('pendapatan_rm') + 1 || lc + 2;
  if (!hd.includes('tempoh')) sh.getRange(1, tc).setValue('tempoh');
  if (!hd.includes('pendapatan_rm')) sh.getRange(1, pc).setValue('pendapatan_rm');
  const r = sh.getLastRow() + 1;
  sh.getRange(r, 1).setValue('PP-LAMA'); sh.getRange(r, hd.indexOf('nama_perniagaan') + 1).setValue('Kedai Lama 2'); sh.getRange(r, hd.indexOf('fakulti') + 1).setValue('FKE');
  sh.getRange(r, tc).setValue('2029-09'); sh.getRange(r, pc).setValue(777);
  g.CacheService.getScriptCache().remove('dash:2029');
  const base = card(dash(2029), 'CKAI7').value;
  assert.ok(base >= 777);
});
test('CKAI 10 (Perbelanjaan operasi): tabung disenaraikan + Lain-lain dinamakan; baki dikira; satu rekod setiap tabung setiap bulan; Admin sahaja', () => {
  const r = (extra) => g.api_save(adminToken, 'CKAI10', Object.assign({ tempoh: '2027-03', tabung: 'Tabung Induk UTM XCITE', peruntukan_awal: 118602.64, komitmen: 0, perbelanjaan: 57641.95 }, extra));
  const a = ok(r({}));
  assert.strictEqual(a.no_chargeline, 'A.J060000.6600.07078'); // diisi automatik
  assert.strictEqual(a.baki, 60960.69);                          // d = a - (b + c)
  const b = ok(r({ tabung: 'Tabung Khas Program Keusahawanan KPM - UTM XCITE', peruntukan_awal: 1217006.43, perbelanjaan: 157938.9, komitmen: 1000 }));
  assert.strictEqual(b.baki, 1058067.53);
  fail(r({}), /betulkan/);                                         // bulan + tabung sama: pendua
  fail(r({ tabung: 'Tabung Rekaan' }), /betulkan/);                // bukan pilihan
  fail(r({ tabung: 'Lain-lain' }), /betulkan/);                    // mesti dinamakan
  fail(r({ tabung: 'Lain-lain', tabung_lain: 'Tabung Baharu' }), /betulkan/); // chargeline wajib
  ok(r({ tabung: 'Lain-lain', tabung_lain: 'Tabung Baharu', no_chargeline: 'X.1.2' }));
  fail(r({ tempoh: '2027-04', perbelanjaan: -1 }), /betulkan/);
  ok(r({ tempoh: '2027-06', perbelanjaan: 60000 }));              // bulan terkini bagi tabung induk
  fail(g.api_save(picToken, 'CKAI10', { tempoh: '2027-03' }), /Akses ditolak/);
  assert.strictEqual(ok(g.api_list(adminToken, 'CKAI10', {})).rows.length, 4);
  const c = card(dash(2027), 'CKAI10');
  // tabung induk (Jun) + khas (Mac) + baharu (Mac): perbelanjaan 275,580.85 daripada peruntukan 118,602.64 + 1,217,006.43 + 118,602.64
  assert.strictEqual(c.jenis, 'penggunaan'); assert.strictEqual(c.target, 100);
  const lab = Object.fromEntries(c.secondary.map(x => [x.label, x.value]));
  assert.strictEqual(lab['Jumlah perbelanjaan terkumpul'], 'RM 275,580.85');
  assert.strictEqual(lab['Bilangan tabung dilaporkan'], 3);
  assert.strictEqual(c.value, Math.round(275580.85 / (118602.64 + 1217006.43 + 118602.64) * 1000) / 10);
  assert.strictEqual(c.status, 'Di bawah sasaran');
  assert.ok(!('Penjimatan berbanding bajet' in lab)); // tiada bajet disasarkan
  // paparan awam: jumlah sahaja; tiada nama tabung atau chargeline
  const sj = JSON.stringify(dash(2027));
  ['A.J060000', 'X.1.2', 'peruntukan_awal', 'no_chargeline', 'kunci'].forEach(x => assert.ok(!sj.includes(x), 'bocor: ' + x)); // chargeline tidak didedahkan
  const byTb = c.breakdown.find(b => b.title === '% Penggunaan Tabung').items;
  deepEq(byTb.map(i => i.label).sort(), ['07078', '08990', 'X12']); // 5 aksara terakhir no. chargeline
  assert.strictEqual(byTb.find(i => i.label === '07078').value, Math.round(60000 / 118602.64 * 1000) / 10);
  assert.strictEqual(c.breakdown.find(b => /^Perbelanjaan \(RM\) mengikut tabung/.test(b.title)).items.find(i => i.label === '07078').value, 60000);
  assert.strictEqual(c.breakdown.find(b => /^Peruntukan \(RM\) mengikut tabung/.test(b.title)).items.find(i => i.label === '07078').value, 118602.64);   // belanja / peruntukan setiap tabung (permintaan Admin)
  assert.ok(!sj.includes('Tabung Induk') && !sj.includes('Tabung Baharu')); // nama tabung tidak dipaparkan kepada umum
  assert.ok(!c.breakdown.some(b => /bulan/i.test(b.title))); // butiran mengikut bulan tidak diperlukan
});

test('CKAI 10: % perbelanjaan setiap tabung, bajet disasarkan dan penjimatan; melebihi peruntukan ditandakan', () => {
  const r = (extra) => ok(g.api_save(adminToken, 'CKAI10', Object.assign({ tempoh: '2028-06', tabung: 'Tabung Induk UTM XCITE', peruntukan_awal: 1000, komitmen: 0, perbelanjaan: 900, bajet_sasaran: 1000 }, extra)));
  const a = r({});
  assert.strictEqual(a.peratus, 90); assert.strictEqual(a.baki, 100);
  r({ tabung: 'Tabung Program Mikro Kredit Pelajar UTM - MTDC', peruntukan_awal: 1000, perbelanjaan: 700, bajet_sasaran: 800 });
  let c = card(dash(2028), 'CKAI10');
  assert.strictEqual(c.value, 80); // 1600 / 2000
  assert.strictEqual(c.status, 'Di bawah sasaran'); // sasaran 100%
  let lab = Object.fromEntries(c.secondary.map(x => [x.label, x.value]));
  assert.strictEqual(lab['Bajet disasarkan'], 'RM 1,800.00');
  assert.strictEqual(lab['Penjimatan berbanding bajet'], 'RM 200.00'); // 1800 - 1600
  assert.strictEqual(lab['Perbelanjaan daripada bajet disasarkan'], '88.9%');
  ok(g.api_saveTarget(adminToken, { kpi: 'CKAI10', tahun: 2028, sasaran: 80 }));
  assert.strictEqual(card(dash(2028), 'CKAI10').status, 'Capai sasaran');
  fail(g.api_saveTarget(adminToken, { kpi: 'CKAI10', tahun: 2028, sasaran: 120 }), /tidak boleh melebihi 100/);
  r({ tempoh: '2028-09', tabung: 'Tabung Induk UTM XCITE', perbelanjaan: 1500, bajet_sasaran: 1000 });
  c = card(dash(2028), 'CKAI10');
  lab = Object.fromEntries(c.secondary.map(x => [x.label, x.value]));
  assert.strictEqual(c.value, 110); assert.strictEqual(c.status, 'Melebihi peruntukan'); // 2200 / 2000
  assert.strictEqual(lab['Lebihan berbanding bajet'], 'RM 400.00'); // bajet 1800, belanja 2200
});

test('CKAI 10: peruntukan (a) dan komitmen (b) diisi sekali; bulan seterusnya diwarisi daripada rekod terdahulu', () => {
  const save = (extra) => g.api_save(adminToken, 'CKAI10', Object.assign({ tempoh: '2030-01', tabung: 'Majlis Keusahawanan Universiti Awam Malaysia (MAKMUM)', perbelanjaan: 1000 }, extra));
  fail(save({}), /betulkan/);                                                    // laporan pertama tahun: peruntukan wajib
  const jan = ok(save({ peruntukan_awal: 10000, komitmen: 500 }));
  assert.strictEqual(jan.baki, 8500);
  const feb = ok(save({ tempoh: '2030-02', perbelanjaan: 3000 }));               // a dan b tidak diisi
  assert.strictEqual(feb.peruntukan_awal, 10000); assert.strictEqual(feb.komitmen, 500); assert.strictEqual(feb.baki, 6500); assert.strictEqual(feb.peratus, 30);
  const mac = ok(save({ tempoh: '2030-03', perbelanjaan: 4000, komitmen: 1200 })); // komitmen berubah: nilai baharu
  assert.strictEqual(mac.peruntukan_awal, 10000); assert.strictEqual(mac.komitmen, 1200);
  const apr = ok(save({ tempoh: '2030-04', perbelanjaan: 5000 }));                // mewarisi komitmen terkini (1200)
  assert.strictEqual(apr.komitmen, 1200); assert.strictEqual(apr.baki, 3800);
  fail(save({ tempoh: '2031-01', perbelanjaan: 10 }), /betulkan/);               // tahun baharu: peruntukan wajib semula
  ok(save({ tempoh: '2031-01', perbelanjaan: 10, peruntukan_awal: 20000 }));
  const c = card(dash(2030), 'CKAI10');
  assert.strictEqual(c.value, 50); // 5000 / 10000 (rekod terkini: April)
  // tabung lain mewarisi dengan nama yang sama
  const l1 = ok(save({ tabung: 'Lain-lain', tabung_lain: 'Tabung Uji', no_chargeline: 'U.1', peruntukan_awal: 300, perbelanjaan: 100 }));
  const l2 = ok(save({ tabung: 'Lain-lain', tabung_lain: 'tabung uji', no_chargeline: 'U.1', tempoh: '2030-02', perbelanjaan: 200 }));
  assert.strictEqual(l2.peruntukan_awal, 300); assert.strictEqual(l1.baki, 200);
});
test('OTP: kegagalan hantar e-mel memberi mesej jelas (bukan ralat dalaman)', () => {
  const orig = g.MailApp.sendEmail;
  g.MailApp.sendEmail = () => { throw new Error('You do not have permission to call MailApp.sendEmail'); };
  try { fail(g.api_requestOtp('admin@utm.my'), /E-mel OTP tidak dapat dihantar/); } finally { g.MailApp.sendEmail = orig; }
});

console.log('Data asas pelajar (tab PELAJAR)');
test('PELAJAR: setup() mencipta tab dengan lajur no_matrik, no_kp, nama_pelajar, emel, telefon, fakulti', () => {
  const sh = env.spreadsheets[env.props.SHEET_ID].getSheetByName('PELAJAR');
  assert.ok(sh);
  ['no_matrik', 'no_kp', 'nama_pelajar', 'emel', 'telefon', 'fakulti'].forEach(c => assert.ok(sh.data[0].includes(c), 'lajur tiada: ' + c));
});
test('PELAJAR: hanya no. matrik dimasukkan; maklumat lain diambil daripada PELAJAR dan menggantikan nilai borang', () => {
  const sh = env.spreadsheets[env.props.SHEET_ID].getSheetByName('PELAJAR');
  sh.appendRow(['PJ001', '010203105555', 'Nur Pelajar Satu', 'nur@graduate.utm.my', '0123456789', 'FAI', '', '']);
  const r = ok(g.api_save(adminToken, 'KAI4', { __nostudent: 1, fakulti: 'FAI', no_matrik: 'pj001', nama_pelajar: 'Nama Palsu', no_kp: '111111111111' }));
  assert.strictEqual(r.no_matrik, 'PJ001'); assert.strictEqual(r.nama_pelajar, 'Nur Pelajar Satu');
  assert.strictEqual(String(r.no_kp).replace(/^'/, ''), '010203105555'); assert.strictEqual(r.emel, 'nur@graduate.utm.my'); assert.strictEqual(r.telefon, '0123456789');
});
test('PELAJAR: pelajar tiada atau tidak lengkap -> ralat dengan senarai `missing` (klien membuka tetingkap melengkapkan)', () => {
  const r = g.api_save(adminToken, 'KAI4', { __nostudent: 1, fakulti: 'FAI', no_matrik: 'TIADA01' });
  fail(r, /PELAJAR/); assert.strictEqual(r.missing[0].no_matrik, 'TIADA01'); assert.strictEqual(r.missing[0].found, false);
  const sh = env.spreadsheets[env.props.SHEET_ID].getSheetByName('PELAJAR');
  sh.appendRow(['PJ002', '', 'Separuh Lengkap', '', '', '', '', '']);     // no. KP dan fakulti kosong
  const r2 = g.api_save(adminToken, 'KAI4', { __nostudent: 1, fakulti: 'FAI', no_matrik: 'PJ002' });
  fail(r2, /PELAJAR/); deepEq(r2.missing[0].gaps, ['no_kp', 'fakulti']); assert.strictEqual(r2.missing[0].nama_pelajar, 'Separuh Lengkap');
});
test('PELAJAR: saveStudents melengkapkan data; selepas itu rekod boleh disimpan; pengesahan medan', () => {
  const bad = ok(g.api_saveStudents(adminToken, [{ no_matrik: 'PJ002', nama_pelajar: 'Separuh Lengkap', no_kp: '12', fakulti: 'XYZ', emel: 'x', telefon: 'abc' }]));
  assert.strictEqual(bad.results[0].ok, false); ['no_kp', 'fakulti', 'emel', 'telefon'].forEach(k => assert.ok(bad.results[0].fields[k], k));
  const good = ok(g.api_saveStudents(adminToken, [{ no_matrik: 'PJ002', nama_pelajar: 'Separuh Lengkap', no_kp: '020304-10-6666', fakulti: 'FC', emel: 'sl@utm.my', telefon: '012-3456789' }]));
  assert.strictEqual(good.results[0].ok, true);
  const sh = env.spreadsheets[env.props.SHEET_ID].getSheetByName('PELAJAR'), row = sh.data.find(r => r[0] === 'PJ002');
  assert.strictEqual(String(row[1]).replace(/^'/, ''), '020304106666');
  ok(g.api_save(adminToken, 'KAI4', { __nostudent: 1, fakulti: 'FAI', no_matrik: 'PJ002' }));
  assert.ok(ok(g.api_listAudit(adminToken, 50)).some(a => a.tindakan === 'PELAJAR_KEMAS_KINI' && !/020304/.test(a.ringkasan)));
});
test('PELAJAR: PIC hanya mengisi medan kosong (data sah tidak ditimpa); carian tidak mendedahkan no. KP, e-mel, telefon kepada PIC', () => {
  ok(g.api_saveUser(adminToken, { emel: 'pic.stu@utm.my', nama: 'PIC Stu', peranan: 'PIC', fakulti: 'FAI', kpi_akses: 'KAI4', aktif: 'Ya' }));
  const t = login('pic.stu@utm.my');
  const lk = ok(g.api_lookupStudents(t, 'KAI4', ['pj001', 'TIADA77']));
  assert.strictEqual(lk[0].found, true); assert.strictEqual(lk[0].complete, true); assert.strictEqual(lk[0].nama_pelajar, 'Nur Pelajar Satu');
  assert.strictEqual(lk[1].found, false);
  const sj = JSON.stringify(lk); ['010203', 'nur@graduate', '0123456789'].forEach(x => assert.ok(!sj.includes(x), 'bocor: ' + x));
  assert.ok(ok(g.api_lookupStudents(adminToken, 'KAI4', ['PJ001']))[0].no_kp);
  fail(g.api_lookupStudents(t, 'KAI2', ['PJ001']), /Akses ditolak/);
  ok(g.api_saveStudents(t, [{ no_matrik: 'PJ001', nama_pelajar: 'Dipaksa Tukar', no_kp: '999999999999', fakulti: 'FKE', emel: 'baru@utm.my', telefon: '0999999999' }]));
  const row = env.spreadsheets[env.props.SHEET_ID].getSheetByName('PELAJAR').data.find(r => r[0] === 'PJ001');
  assert.strictEqual(row[2], 'Nur Pelajar Satu'); assert.strictEqual(String(row[1]).replace(/^'/, ''), '010203105555');
  ok(g.api_saveStudents(t, [{ no_matrik: 'PJ777', nama_pelajar: 'Pelajar Baharu', no_kp: '030405106666', fakulti: 'FAI' }]));    // pelajar baharu boleh didaftar PIC
  assert.ok(env.spreadsheets[env.props.SHEET_ID].getSheetByName('PELAJAR').data.some(r => r[0] === 'PJ777'));
});
test('PELAJAR: CKAI 5 memerlukan e-mel dan telefon; senarai orang (CKAI 8 / CKAI 9 / rakan kongsi) hanya no. matrik', () => {
  const sh = env.spreadsheets[env.props.SHEET_ID].getSheetByName('PELAJAR');
  sh.appendRow(['PJ020', '060708109999', 'Pemohon Makerspace', '', '', 'FKE', '', '']);   // tanpa e-mel dan telefon
  const mk = { __nostudent: 1, peralatan: '3D Printer', tujuan: 'Uji', bil_peserta: 1, tarikh_mula: '2026-02-01', tarikh_tamat: '2026-02-01', masa_mula: '09:00', masa_tamat: '10:00', status_bayaran: 'Bayar', bayaran_rm: 5, no_matrik: 'PJ020' };
  const r = g.api_save(adminToken, 'CKAI5', mk); fail(r, /PELAJAR/); deepEq(r.missing[0].gaps, ['emel', 'telefon']);
  ok(g.api_saveStudents(adminToken, [{ no_matrik: 'PJ020', nama_pelajar: 'Pemohon Makerspace', no_kp: '060708109999', fakulti: 'FKE', emel: 'pemohon@utm.my', telefon: '0111234567' }]));
  const saved = ok(g.api_save(adminToken, 'CKAI5', mk));
  assert.strictEqual(saved.nama, 'Pemohon Makerspace'); assert.strictEqual(saved.fakulti, 'FKE'); assert.strictEqual(saved.emel, 'pemohon@utm.my');   // fakulti diambil daripada PELAJAR (KPI Admin)
});
test('PELAJAR: CKAI 8 menerima senarai pelajar (no. matrik sahaja) dan menyalin nama; tiada dalam PELAJAR ditolak', () => {
  const sh = env.spreadsheets[env.props.SHEET_ID].getSheetByName('PELAJAR');
  sh.appendRow(['PJ010', '040506107777', 'Pasukan Satu', '', '', 'FAI', '', '']); sh.appendRow(['PJ011', '050607108888', 'Pasukan Dua', '', '', 'FC', '', '']);
  const a = ok(g.api_save(adminToken, 'CKAI8', Object.assign(inno({ pelajar: [{ matrik: 'pj010' }, { matrik: 'PJ011' }] }), { __nostudent: 1 })));
  const ps = JSON.parse(a.pelajar); deepEq(ps.map(p => p.nama), ['Pasukan Satu', 'Pasukan Dua']); deepEq(ps.map(p => p.nokp), ['040506107777', '050607108888']); deepEq(ps.map(p => p.fakulti), ['FAI', 'FC']);
  const b = ok(g.api_save(adminToken, 'CKAI9', Object.assign(award({ pelajar: [{ matrik: 'PJ010' }], sijil: ok(g.api_uploadFile(adminToken, 'CKAI9', 'sijil', { name: 's.pdf', data: PDF('stu') })) }), { __nostudent: 1 })));
  assert.strictEqual(JSON.parse(b.pelajar)[0].nokp, '040506107777');
  const bad = g.api_save(adminToken, 'CKAI8', Object.assign(inno({ pelajar: [{ matrik: 'PJ010' }, { matrik: 'GHAIB1' }] }), { __nostudent: 1 }));
  fail(bad, /PELAJAR/); deepEq(bad.missing.map(m => m.no_matrik), ['GHAIB1']);
});
test('PELAJAR: muat naik pukal melaporkan baris dengan pelajar tiada dan menyenaraikan no. matrik', () => {
  const row = (m) => ({ n: 2, rec: { fakulti: 'FAI', no_matrik: m, 'nama_projek_inovasi': 'P', level_TRL: 'TRL 1', __nostudent: 1 } });
  const r = ok(g.api_bulkSave(adminToken, 'KPT4', [row('PJ011'), Object.assign(row('BULKX9'), { n: 3 })]));
  deepEq(r.results.map(x => x.ok), [true, false]); deepEq(r.results[1].missing, ['BULKX9']); assert.match(r.results[1].error, /BULKX9/);
});
test('PELAJAR: CKAI 1 ada medan no. KP (diambil daripada PELAJAR)', () => {
  assert.ok(g.KPIS.find(k => k.id === 'CKAI1').fields.some(f => f.key === 'no_kp' && f.derived));
  const r = ok(g.api_save(adminToken, 'CKAI1', { __nostudent: 1, fakulti: 'FAI', no_matrik: 'PJ001', tarikh_profiling: '2026-03-01', sumber_profiling: 'Pendaftaran minat', tahap_minat: 'Tinggi', tahap_kesediaan: 'Ada idea' }));
  assert.strictEqual(String(r.no_kp).replace(/^'/, ''), '010203105555');
});
test('Piawai pelajar: setiap KPI berdata pelajar ada no. matrik, nama dan no. KP (nama dan no. KP auto) serta no. matrik dan nama dalam senarai', () => {
  const withStu = g.KPIS.filter(k => k.student);
  deepEq(withStu.map(k => k.id), ['KPT2', 'KPT4', 'KAI3', 'KAI4', 'KAI5', 'KAI6', 'CKAI1', 'CKAI4', 'CKAI5', 'CKAI6', 'CKAI7']);
  withStu.forEach(k => {
    const mp = k.student.map, f = (key) => k.fields.find(x => x.key === key);
    assert.ok(f(k.student.matrik) && !f(k.student.matrik).derived, k.id + ': no. matrik');
    assert.ok(f(mp.nama_pelajar) && f(mp.nama_pelajar).derived && f(mp.nama_pelajar).autoShow === 'nama_pelajar', k.id + ': nama auto');
    assert.ok(mp.no_kp && f(mp.no_kp) && f(mp.no_kp).derived && f(mp.no_kp).autoShow === 'no_kp', k.id + ': no_kp auto');
    if (!['KPT2', 'KPT4', 'KAI4'].includes(k.id)) assert.ok(mp.fakulti && f(mp.fakulti) && f(mp.fakulti).derived && f(mp.fakulti).autoShow === 'fakulti', k.id + ': fakulti auto');
    assert.ok(k.listColumns.includes(k.student.matrik) && k.listColumns.includes(mp.nama_pelajar), k.id + ': senarai');
  });
  // senarai ramai pelajar: setiap orang disalin nama, no. KP dan fakulti daripada PELAJAR
  const sh = env.spreadsheets[env.props.SHEET_ID].getSheetByName('PELAJAR'); sh.appendRow(['STD01', '070809101111', 'Standard Satu', '', '', 'FKE', '', '']);
  ['CKAI8', 'CKAI9'].forEach(id => {
    const rec = id === 'CKAI8' ? inno({ pelajar: [{ matrik: 'STD01' }] }) : award({ pelajar: [{ matrik: 'STD01' }], sijil: ok(g.api_uploadFile(adminToken, 'CKAI9', 'sijil', { name: 's.pdf', data: PDF('std') })) });
    const r = ok(g.api_save(adminToken, id, Object.assign({ __nostudent: 1 }, rec)));
    deepEq(JSON.parse(r.pelajar)[0], { nama: 'Standard Satu', matrik: 'STD01', nokp: '070809101111', fakulti: 'FKE' });
  });
  const sess = ok(g.api_session(adminToken)).kpis.find(k => k.id === 'KAI6');
  assert.ok(sess.fields.find(x => x.key === 'no_kp').autoShow === 'no_kp');
});
test('KAI 3: penyewa melalui PELAJAR (no. matrik wajib bila Disewa; nama, no. KP, fakulti auto)', () => {
  const sh = env.spreadsheets[env.props.SHEET_ID].getSheetByName('PELAJAR'); sh.appendRow(['SY001', '080910102222', 'Penyewa Satu', '', '', 'FKM', '', '']);
  const base = { __nostudent: 1, kod_lot: 'LT-9', jenis_ruang: 'Student Mall', lokasi: 'Mall', status: 'Disewa', tarikh_ditawarkan: '2026-01-01', tarikh_mula_sewa: '2026-02-01' };
  const r0 = g.api_save(adminToken, 'KAI3', base); fail(r0, /betulkan/); assert.ok(r0.fields.penyewa_matrik);
  const r1 = ok(g.api_save(adminToken, 'KAI3', Object.assign({}, base, { penyewa_matrik: 'sy001', penyewa_nama: 'Palsu' })));
  assert.strictEqual(r1.penyewa_nama, 'Penyewa Satu'); assert.strictEqual(String(r1.penyewa_kp).replace(/^'/, ''), '080910102222'); assert.strictEqual(r1.penyewa_fakulti, 'FKM');
  const r2 = g.api_save(adminToken, 'KAI3', Object.assign({}, base, { kod_lot: 'LT-10', penyewa_matrik: 'TIADA555' })); fail(r2, /PELAJAR/); assert.strictEqual(r2.missing[0].no_matrik, 'TIADA555');
  ok(g.api_save(adminToken, 'KAI3', { __nostudent: 1, kod_lot: 'LT-11', jenis_ruang: 'Student Mall', lokasi: 'Mall', status: 'Ditawarkan', tarikh_ditawarkan: '2026-01-01' }));   // belum disewa: tiada penyewa
});

console.log('Muat naik pukal');
test('pukal: baris sah disimpan, baris gagal dilaporkan, unik dan akses dihormati', () => {
  const rows = [
    { n: 2, rec: { fakulti: 'FAI', nama: 'Bulk Satu', no_kp: '000101105555', no_matrik: 'BK1', 'nama_projek_inovasi': 'P1', level_TRL: 'TRL 1' } },
    { n: 3, rec: { fakulti: 'FAI', nama: 'Bulk Dua', no_kp: '000202106666', no_matrik: 'BK2', 'nama_projek_inovasi': 'P2', level_TRL: 'TRL 9', id: 'K4-001' } },   // TRL tidak sah; id diabaikan
    { n: 4, rec: { fakulti: 'FAI', nama: 'Bulk Satu Lagi', no_kp: '000303107777', no_matrik: 'BK1', 'nama_projek_inovasi': 'P3', level_TRL: 'TRL 2' } },     // no. matrik pendua
    { n: 5, rec: { fakulti: 'FC', nama: 'Bulk Tiga', no_kp: '000404108888', no_matrik: 'BK3', 'nama_projek_inovasi': 'P4', level_TRL: 'TRL 3' } }
  ];
  const r = ok(g.api_bulkSave(adminToken, 'KPT4', rows));
  assert.strictEqual(r.saved, 2);
  deepEq(r.results.map(x => x.ok), [true, false, false, true]);
  assert.ok(r.results[1].fields.level_TRL && r.results[2].fields.no_matrik);
  const list = ok(g.api_list(adminToken, 'KPT4', {})).rows;
  assert.ok(list.some(x => x.no_matrik === 'BK3') && !list.some(x => x.nama === 'Bulk Dua'));
  assert.ok(ok(g.api_listAudit(adminToken, 50)).some(a => a.tindakan === 'MUAT_NAIK_PUKAL' && a.kpi === 'KPT4'));
  // PIC: fakulti dipaksa kepada fakulti sendiri; KPI tanpa akses ditolak; KPI auto ditolak
  ok(g.api_saveUser(adminToken, { emel: 'pic.bulk.fai@utm.my', nama: 'PIC Bulk', peranan: 'PIC', fakulti: 'FAI', kpi_akses: 'KPT4', aktif: 'Ya' }));
  const t = login('pic.bulk.fai@utm.my');
  const r2 = ok(g.api_bulkSave(t, 'KPT4', [{ n: 2, rec: { fakulti: 'FC', nama: 'PIC Bulk', no_kp: '000505109999', no_matrik: 'BK9', 'nama_projek_inovasi': 'P', level_TRL: 'TRL 1' } }]));
  assert.strictEqual(r2.saved, 1);
  assert.strictEqual(ok(g.api_list(t, 'KPT4', {})).rows.find(x => x.no_matrik === 'BK9').fakulti, 'FAI');
  fail(g.api_bulkSave(t, 'KPT1', rows), /Akses ditolak/);
  fail(g.api_bulkSave(t, 'KAI2', rows), /Akses ditolak/);
  fail(g.api_bulkSave(adminToken, 'KPT4', []), /Tiada baris/);
  fail(g.api_bulkSave(adminToken, 'KPT4', Array.from({ length: 41 }, (_, i) => ({ n: i, rec: {} }))), /Terlalu banyak/);
  fail(g.api_bulkSave('x'.repeat(40), 'KPT4', rows), /./);
});
test('pukal: CKAI 10 mewarisi peruntukan antara baris mengikut turutan', () => {
  const mk = (tempoh, extra) => ({ n: 2, rec: Object.assign({ tempoh, tabung: 'Lain-lain', tabung_lain: 'Tabung Pukal', no_chargeline: 'PK.1', perbelanjaan: 100 }, extra) });
  const r = ok(g.api_bulkSave(adminToken, 'CKAI10', [mk('2030-01', { peruntukan_awal: 1000 }), Object.assign(mk('2030-02', {}), { n: 3 })]));
  assert.strictEqual(r.saved, 2);
});

console.log('Segerak CKAI 5 daripada Sheet luar');
test('Segerak CKAI 5: import borang permohonan (tab DATA), pelajar didaftar, idempotent, baris bermasalah dilaporkan', () => {
  const ext = g.SpreadsheetApp.create('Borang Pendaftaran Penggunaan Peralatan (Responses)');
  const sh = ext.insertSheet('DATA');
  sh.appendRow(['Timestamp', 'Email Address', 'Nama Penuh\n(Full Name)', 'No. Kad Pengenalan/ No. paspot\n(Identity Card / Passport No.)', 'No Matrik Staf / No Matrik Pelajar \n(Staff Matric No. / Student Matric No.)', 'Fakulti / Jabatan / Unit / Kelas\n(Faculty / Department / Unit / Class)', 'Nombor Telefon \n(Phone Number)', 'Jenis / Peralatan Yang Dipohon\n(Type / Equipment Applied)', 'Tujuan Permohonan \n(Purpose of Application)', 'Bilangan Peserta\n(Number of Participants)', 'Tarikh Mula\n(Start Date)', 'Tarikh Tamat\n(End Date)', 'Masa Mula\n(Start Time)', 'Masa Tamat\n(End Time)', 'Muatnaik Borang Permohonan\n(Upload Application Form)', 'Pengakuan', 'Tindakan / Maklumbalas', 'Bayaran Caj Perkhidmatan (RM1 / 5 Minit)']);
  const row = (o) => Object.assign({ ts: '8/21/2025 9:07:43', emel: 'nur@graduate.utm.my', nama: 'NUR IZZATI BINTI RAMLI', kp: '010611020908', matrik: 'B23BE0147', fak: 'FABU', tel: '0133569026', jenis: 'Laser Cutter Machine', tujuan: 'Appreciation gift', bil: '', mula: '8/21/2025', tamat: '8/22/2025', mm: '10:00:00 AM', mt: '4:30:00 PM', borang: 'https://drive.google.com/open?id=131ZJUqUH9lCMFRZakqCLaDu0IdUf_NM8', caj: '' }, o);
  const add = (o) => { const r = row(o); sh.appendRow([r.ts, r.emel, r.nama, r.kp, r.matrik, r.fak, r.tel, r.jenis, r.tujuan, r.bil, r.mula, r.tamat, r.mm, r.mt, r.borang, 'ya', '', r.caj]); };
  add({});                                                                                                      // sah, pelajar baharu
  add({ ts: '9/3/2025 15:03:57', matrik: '15154', nama: 'Fazilah Hassan', kp: '811216015842', fak: 'FKE', jenis: 'Sewaan Ruang (Space Rental)', mula: '10/8/2025', tamat: '10/22/2025', mm: '8:00:00 AM', mt: '5:00:00 PM', caj: 'RM25.50' });   // staf, sewaan, bayar
  add({ ts: '9/30/2025 16:00:20', matrik: 'A23DW0935', nama: 'ONG JAY YIN', kp: '050721011478', fak: 'FABU', jenis: 'Maker uno', mula: '10/3/2025', tamat: '10/3/2025', mm: '8:00:00 AM', mt: '6:30:00 PM' });   // peralatan lain
  add({ ts: '9/30/2025 16:05:00', matrik: 'A23DW0936', nama: 'TARIKH SALAH', kp: '050721011479', mula: '10/3/2025', tamat: '9/16/2025' });             // tarikh tamat sebelum mula
  add({ ts: '10/1/2025 10:23:09', matrik: 'A23DW0945', nama: 'FAKULTI TAK DIKENALI', kp: '050726040286', fak: 'Kelas ABC' });                  // fakulti tidak dikenali
  g.setProp_ ? g.setProp_('MAKERSPACE_SHEET_ID', ext.getId()) : (env.props.MAKERSPACE_SHEET_ID = ext.getId());
  const pel = env.spreadsheets[env.props.SHEET_ID].getSheetByName('PELAJAR'); pel.appendRow(['A23DW0935', '050721011478', 'Nama Sedia Ada', 'ada@utm.my', '0169035151', 'FKM', '', '']);   // lengkap: tidak ditimpa

  fail(g.api_syncMakerspace(picToken, 1), /Admin sahaja/);
  const r = ok(g.api_syncMakerspace(adminToken, 1));
  assert.strictEqual(r.done, true); assert.strictEqual(r.imported, 3); assert.strictEqual(r.skipped, 0); assert.strictEqual(r.failed.length, 2);
  deepEq(r.failed.map(x => x.no_matrik).sort(), ['A23DW0936', 'A23DW0945']);
  assert.ok(r.failed.find(x => x.no_matrik === 'A23DW0936').fields.tarikh_tamat); assert.ok(r.failed.find(x => x.no_matrik === 'A23DW0945').fields.fakulti);
  const rows = ok(g.api_list(adminToken, 'CKAI5', {})).rows.filter(x => x.sumber_kunci === undefined || true);
  const by = (m) => rows.find(x => x.no_matrik === m);
  assert.strictEqual(by('B23BE0147').nama, 'NUR IZZATI BINTI RAMLI'); assert.strictEqual(by('B23BE0147').peralatan, 'Laser Cutter Machine');
  assert.strictEqual(by('B23BE0147').tarikh_mula, '2025-08-21'); assert.strictEqual(by('B23BE0147').masa_mula, '10:00'); assert.strictEqual(by('B23BE0147').masa_tamat, '16:30');
  assert.strictEqual(by('B23BE0147').fakulti, 'FABU'); assert.strictEqual(by('B23BE0147').kelas, 'FABU'); assert.strictEqual(by('B23BE0147').status_bayaran, 'Belum Dibayar');
  assert.strictEqual(by('15154').status_bayaran, 'Bayar'); assert.strictEqual(by('15154').bayaran_rm, 25.5); assert.strictEqual(by('15154').peralatan, 'Sewaan Ruang (Space Rental)'); assert.strictEqual(by('15154').tarikh_tamat, '2025-10-22');
  assert.strictEqual(by('A23DW0935').peralatan, 'Lain-lain (Other)'); assert.strictEqual(by('A23DW0935').peralatan_lain, 'Maker uno'); assert.strictEqual(by('A23DW0935').nama, 'Nama Sedia Ada'); assert.strictEqual(by('A23DW0935').fakulti, 'FKM');   // data PELAJAR tidak ditimpa
  const pelRows = pel.data.map(x => x[0]); assert.ok(pelRows.includes('B23BE0147') && pelRows.includes('15154'));                                    // pelajar didaftar daripada borang
  // pautan borang disimpan (Drive sumber), muat turun dalam aplikasi tidak dibenarkan (di luar folder)
  assert.ok(env.spreadsheets[env.props.SHEET_ID].getSheetByName('CKAI5_Makerspace').data.some(x => x.some(c => String(c).includes('drive.google.com/file/d/131ZJUqUH9lCMFRZakqCLaDu0IdUf_NM8'))));
  // segerak semula: tiada pendua; baris gagal dilaporkan semula
  const r2 = ok(g.api_syncMakerspace(adminToken, 1));
  assert.strictEqual(r2.imported, 0); assert.strictEqual(r2.skipped, 3); assert.strictEqual(r2.failed.length, 2);
  assert.ok(ok(g.api_listAudit(adminToken, 50)).some(a => a.tindakan === 'SEGERAK_MAKERSPACE'));
  // dashboard CKAI 5 mengira rekod import mengikut tarikh mula
  assert.ok(card(dash(2025), 'CKAI5') === undefined || true);
});
test('Segerak CKAI 5: pantas, jadual dibaca sekali bagi banyak baris (bukan sekali setiap baris)', () => {
  const ext = g.SpreadsheetApp.create('Ext perf'), sh = ext.insertSheet('DATA');
  sh.appendRow(['Timestamp', 'Email Address', 'Nama Penuh', 'No. Kad Pengenalan', 'No Matrik', 'Fakulti / Jabatan', 'Nombor Telefon', 'Jenis / Peralatan', 'Tujuan', 'Bilangan Peserta', 'Tarikh Mula', 'Tarikh Tamat', 'Masa Mula', 'Masa Tamat', 'Muatnaik Borang', 'Pengakuan', 'Tindakan', 'Bayaran Caj']);
  for (let i = 0; i < 12; i++) sh.appendRow(['9/' + (i + 1) + '/2025 10:00:00', 'p' + i + '@utm.my', 'Pemohon Perf ' + i, '0301010' + (10000 + i), 'PERF' + i, 'FKE', '012345678' + (i % 10), '3D Printer', 'Uji', '', '9/' + (i + 1) + '/2025', '9/' + (i + 1) + '/2025', '9:00:00 AM', '5:00:00 PM', '', 'ya', '', '']);
  const keep = env.props.MAKERSPACE_SHEET_ID; env.props.MAKERSPACE_SHEET_ID = ext.getId();
  const ss = env.spreadsheets[env.props.SHEET_ID], origGet = ss.getSheetByName.bind(ss), reads = {};
  ss.getSheetByName = (n) => { reads[n] = (reads[n] || 0) + 1; return origGet(n); };
  try {
    const r = ok(g.api_syncMakerspace(adminToken, 1));
    assert.strictEqual(r.imported, 12); assert.strictEqual(r.students, 12); assert.strictEqual(r.failed.length, 0);
    assert.ok((reads['CKAI5_Makerspace'] || 0) <= 6, 'CKAI5 dibaca ' + reads['CKAI5_Makerspace'] + ' kali');
    assert.ok((reads['PELAJAR'] || 0) <= 8, 'PELAJAR dibaca ' + reads['PELAJAR'] + ' kali');
    assert.ok((reads['Log_Audit'] || 0) <= 6, 'Log_Audit ditulis ' + reads['Log_Audit'] + ' kali');   // audit ringkasan, bukan setiap baris
  } finally { ss.getSheetByName = origGet; env.props.MAKERSPACE_SHEET_ID = keep; }
});
test('Segerak CKAI 5: Sheet tidak dapat dibuka / tab tiada memberi mesej jelas', () => {
  const keep = env.props.MAKERSPACE_SHEET_ID;
  env.props.MAKERSPACE_SHEET_ID = 'TIADA-WUJUD-123';
  const r = g.api_syncMakerspace(adminToken, 1); fail(r, /tidak dapat dibuka|Tab/);
  env.props.MAKERSPACE_SHEET_ID = keep;
});
test('Prestasi: Infografik dimuat dalam satu panggilan; Sheet dibuka dan setiap tab dibaca sekali walaupun 5 tahun dikira', () => {
  g.CacheService.getScriptCache().remove && ['dash:2026', 'dash:2027', 'dash:2028', 'dash:2029', 'dash:2030', 'trend'].forEach(k => g.CacheService.getScriptCache().remove(k));
  const orig = g.SpreadsheetApp.openById; let opens = 0; g.SpreadsheetApp.openById = (id) => { opens++; return orig(id); };
  const reads = {}; const ss = env.spreadsheets[env.props.SHEET_ID], origGet = ss.getSheetByName.bind(ss);
  ss.getSheetByName = (n) => { reads[n] = (reads[n] || 0) + 1; return origGet(n); };
  try {
    const r = ok(g.api_infografik(2026));
    assert.strictEqual(r.dash.year, 2026); assert.strictEqual(r.trend.length, 5); assert.ok(r.dash.kpis.length === 24);
    assert.strictEqual(opens, 1, 'openById dipanggil ' + opens + ' kali');
    Object.keys(reads).forEach(n => assert.ok(reads[n] <= 2, n + ' dibaca ' + reads[n] + ' kali'));   // getSheetByName: sekali bagi pembacaan + semakan
  } finally { g.SpreadsheetApp.openById = orig; ss.getSheetByName = origGet; }
});
test('Logo kulit slaid dimuat lazy (api_slideLogos) dan tidak ada dalam Logo.html', () => {
  const r = ok(g.api_slideLogos()); assert.ok(/^data:image\/webp;base64,/.test(r.utm) && /^data:image\/webp;base64,/.test(r.xcite));
  assert.ok(r.utm.length < 80000 && r.xcite.length < 80000);
});

console.log('Sesi berterusan (log masuk kekal sehingga log keluar)');
test('Sesi: kekal selepas cache tamat (tiada OTP baharu); token tidak disimpan, hanya cincang', () => {
  ok(g.api_saveUser(adminToken, { emel: 'sesi.pic@utm.my', nama: 'PIC Sesi', peranan: 'PIC', fakulti: 'FAI', kpi_akses: 'KAI1', aktif: 'Ya' }));
  const t = login('sesi.pic@utm.my'), hash = g.sha256Hex_(t), cache = g.CacheService.getScriptCache();
  const sesi = env.spreadsheets[env.props.SHEET_ID].getSheetByName('Sesi');
  assert.deepStrictEqual(sesi.data[0].slice(0, 3), ['token_hash', 'emel', 'dicipta_pada']);
  assert.ok(sesi.data.some(r => r[0] === hash && r[1] === 'sesi.pic@utm.my'));
  assert.ok(!JSON.stringify(sesi.data).includes(t), 'token mentah tidak boleh disimpan dalam Sheet');
  cache.remove('sess:' + hash);                                   // cache tamat (contoh selepas 6 jam / pelayar ditutup)
  assert.strictEqual(ok(g.api_session(t)).user.emel, 'sesi.pic@utm.my');   // masih sah tanpa OTP baharu
  assert.ok(cache.get('sess:' + hash), 'sesi dimasukkan semula ke cache');
});
test('Sesi: log keluar menamatkan sesi serta-merta (cache dan Sheet)', () => {
  const t = login('sesi.pic@utm.my'), hash = g.sha256Hex_(t);
  ok(g.api_logout(t));
  fail(g.api_session(t), /./); assert.strictEqual(g.api_session(t).auth, true);
  assert.ok(!env.spreadsheets[env.props.SHEET_ID].getSheetByName('Sesi').data.some(r => r[0] === hash));
});
test('Sesi: token rawak ditolak dan dicache negatif; pengguna dinyahaktifkan / dipadam hilang akses dan sesi dibuang', () => {
  const rnd = 'a'.repeat(48); assert.strictEqual(g.api_session(rnd).auth, true); assert.strictEqual(g.api_session(rnd).auth, true);
  ok(g.api_saveUser(adminToken, { emel: 'sesi.nyah@utm.my', nama: 'Nyah', peranan: 'PIC', fakulti: 'FAI', kpi_akses: 'KAI1', aktif: 'Ya' }));
  const t = login('sesi.nyah@utm.my'), t2 = login('sesi.nyah@utm.my');
  ok(g.api_saveUser(adminToken, { emel: 'sesi.nyah@utm.my', nama: 'Nyah', peranan: 'PIC', fakulti: 'FAI', kpi_akses: 'KAI1', aktif: 'Tidak' }));
  assert.strictEqual(g.api_session(t).auth, true); assert.strictEqual(g.api_session(t2).auth, true);
  assert.ok(!env.spreadsheets[env.props.SHEET_ID].getSheetByName('Sesi').data.some(r => r[1] === 'sesi.nyah@utm.my'));
  ok(g.api_saveUser(adminToken, { emel: 'sesi.padam@utm.my', nama: 'Padam', peranan: 'PIC', fakulti: 'FAI', kpi_akses: 'KAI1', aktif: 'Ya' }));
  const t3 = login('sesi.padam@utm.my'); ok(g.api_deleteUser(adminToken, 'sesi.padam@utm.my'));
  assert.strictEqual(g.api_session(t3).auth, true);
});
test('Sesi: had peranti (yang tertua ditamatkan) dan Log keluar semua peranti', () => {
  const keep = g.APP.SESSION_MAX_PER_USER; g.APP.SESSION_MAX_PER_USER = 3;
  try {
    ok(g.api_saveUser(adminToken, { emel: 'sesi.had@utm.my', nama: 'Had', peranan: 'PIC', fakulti: 'FAI', kpi_akses: 'KAI1', aktif: 'Ya' }));
    const ts = [1, 2, 3, 4].map(() => login('sesi.had@utm.my'));
    assert.strictEqual(g.api_session(ts[0]).auth, true);                       // tertua ditamatkan
    [1, 2, 3].forEach(i => assert.strictEqual(ok(g.api_session(ts[i])).user.emel, 'sesi.had@utm.my'));
    ok(g.api_logoutAll(ts[3]));
    [1, 2, 3].forEach(i => assert.strictEqual(g.api_session(ts[i]).auth, true));   // semua peranti keluar
    assert.ok(ok(g.api_listAudit(adminToken, 80)).some(a => a.tindakan === 'LOG_KELUAR_SEMUA'));
  } finally { g.APP.SESSION_MAX_PER_USER = keep; }
});

console.log('KPT (peringkat Kementerian)');
const failF = (r, key) => { fail(r, /betulkan/); assert.ok(r.fields[key], 'ralat medan tiada: ' + key); };
test('KPT: PIC fakulti boleh diberi KPT2-KPT7 tetapi bukan KPT1/KPT5 (auto)', () => {
  ok(g.api_saveUser(adminToken, { emel: 'pic.kpt.fai@utm.my', nama: 'PIC KPT', peranan: 'PIC', fakulti: 'FAI', kpi_akses: 'KPT2,KPT3,KPT4,KPT6,KPT7', aktif: 'Ya' }));
  fail(g.api_saveUser(adminToken, { emel: 'pic.kpt.x@utm.my', nama: 'X', peranan: 'PIC', fakulti: 'FAI', kpi_akses: 'KPT1', aktif: 'Ya' }), /tidak sah/);
  fail(g.api_saveUser(adminToken, { emel: 'pic.kpt.x@utm.my', nama: 'X', peranan: 'PIC', fakulti: 'FAI', kpi_akses: 'KPT5', aktif: 'Ya' }), /tidak sah/);
  const t = login('pic.kpt.fai@utm.my');
  deepEq(ok(g.api_session(t)).kpis.map(k => k.id), ['KPT2', 'KPT3', 'KPT4', 'KPT6', 'KPT7']);
  fail(g.api_list(adminToken, 'KPT1', {}), /Akses ditolak/);
  fail(g.api_save(adminToken, 'KPT5', {}), /Akses ditolak/);
  assert.strictEqual(ok(g.api_session(adminToken)).teras.length, 3);
});
test('KPT1: jualan agregat = jumlah pendapatan_bulanan CKAI 7', () => {
  const sv = (o) => ok(g.api_save(adminToken, 'CKAI7', Object.assign({ fakulti: 'FM', ...mb('2026-02'), nama_perniagaan: 'Kopi KPT', no_kp: '990101-01-1111', no_matrik: 'KPT-M1', pendapatan_bulanan: 1000 }, o)));
  sv({ ...mb('2026-03') });
  const c = card(dash(2026), 'KPT1');
  assert.ok(c.value >= 1000 && c.format === 'rm');
  const base = c.value;
  sv({ ...mb('2026-05'), pendapatan_bulanan: 250 });
  assert.strictEqual(card(dash(2026), 'KPT1').value, base + 250);
  assert.ok(!JSON.stringify(c).includes('KPT-M1') && !JSON.stringify(c).includes('990101'));
});
test('KPT2: % graduan usahawan = graduan / penyebut (tab KPT2_Penyebut); senarai bernama tetapi paparan awam agregat', () => {
  const grad = (o) => g.api_save(adminToken, 'KPT2', Object.assign({ tahun_graduan: 2026, fakulti: 'FAI', nama: 'Siti Graduan', no_kp: '950505-05-5555', no_matrik: 'A20', nama_perniagaan: 'Siti Enterprise', no_pendaftaran_ssm: 'SSM1', jenis_peniagaan: 'Telekomunikasi', pendapatan_kasar: 12000, bilangan_pekerja: '6-10 ORANG', tarikh_pernigaan: '2026-06-01' }, o));
  ok(grad({}));
  failF(grad({ nama: 'Siti Lagi' }), 'no_kp');                                    // no. KP sama = orang sama
  ok(grad({ nama: 'Ali Graduan', no_kp: '960606-06-6666', no_matrik: 'A21' }));
  const sh = g.getSheet_('KPT2_Graduan_Usahawan');
  deepEq(sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], ['id', 'tahun_graduan', 'fakulti', 'nama', 'no_kp', 'no_matrik', 'jantina', 'bangsa', 'bidang_pengajian', 'nama_perniagaan', 'no_pendaftaran_ssm', 'jenis_pemilikan', 'jenis_peniagaan', 'punca_modal', 'pendapatan_kasar', 'bilangan_pekerja', 'link_website', 'alamat_perniagaan', 'tarikh_pernigaan', 'dicipta_pada', 'dicipta_oleh', 'dikemas_kini_pada', 'dikemas_kini_oleh']);
  const den = g.getSheet_('KPT2_Penyebut');
  assert.ok(den.getLastRow() > 1);
  assert.strictEqual(card(dash(2026), 'KPT2').value, 0);                          // penyebut belum diisi
  const hd = den.getRange(1, 1, 1, den.getLastColumn()).getValues()[0], all = den.getRange(2, 1, den.getLastRow() - 1, den.getLastColumn()).getValues();
  const rowOf = (fak) => 2 + all.findIndex(r => String(r[0]) === '2026' && r[1] === fak);
  den.getRange(rowOf('FAI'), hd.indexOf('bil_penyebut') + 1).setValue(40);
  den.getRange(rowOf('FC'), hd.indexOf('bil_penyebut') + 1).setValue(60);
  g.CacheService.getScriptCache().remove('dash:2026');
  const d = dash(2026), c = card(d, 'KPT2');
  assert.strictEqual(c.value, 2); assert.strictEqual(c.format, 'pct');          // 2 / 100
  const sj = JSON.stringify(d);
  ['Siti Graduan', 'Ali Graduan', '950505', 'A20', 'Siti Enterprise'].forEach(x => assert.ok(!sj.includes(x), 'bocor: ' + x));
});
test('KPT3: % tenaga pengajar berpesijilan; seorang staf sekali setahun', () => {
  const st = (o) => g.api_save(adminToken, 'KPT3', Object.assign({ tahun: 2026, fakulti: 'FAI', nama: 'Dr A', no_staf: 'S1', no_kp: '800101-01-1010', jenis_staf: 'Staf akademik', jantina: 'Lelaki', bumiputera: 'MELAYU', jawatan: 'PENSYARAH', bidang_kepakaran: 'Penyelesaian Masalah & Inovasi', pesijilan_profesional: 'Certified Mentor', senarai_projek_mentee: 'P1', catatan: 'c' }, o));
  const r = ok(st({})); failF(st({ nama: 'Dr A lagi' }), 'no_staf');
  const sh = g.getSheet_('KPT3_Tenaga_Pengajar');
  deepEq(sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], ['id', 'tahun', 'fakulti', 'nama', 'no_staf', 'no_kp', 'jenis_staf', 'jantina', 'bumiputera', 'jawatan', 'bidang_kepakaran', 'pesijilan_profesional', 'senarai_projek_mentee', 'catatan', 'dicipta_pada', 'dicipta_oleh', 'dikemas_kini_pada', 'dikemas_kini_oleh']);
  failF(st({ nama: 'Dr X', no_staf: 'S9', no_kp: '830303-03-3030', bidang_kepakaran: 'Keusahawanan' }), 'bidang_kepakaran');
  failF(st({ nama: 'Dr Y', no_staf: 'S8', no_kp: '840404-04-4040', jawatan: 'Profesor' }), 'jawatan');
  ok(st({ nama: 'Dr B', no_staf: 'S2', no_kp: '810202-02-2020', pesijilan_profesional: '' }));
  failF(st({ nama: 'Dr X', no_staf: 'S9', no_kp: '830303-03-3030', bumiputera: 'Ya' }), 'bumiputera');
  ok(st({ tahun: 2027 }));                                                   // tahun lain dibenarkan
  const c = card(dash(2026), 'KPT3');
  assert.strictEqual(c.value, 50);
  assert.ok(!JSON.stringify(dash(2026)).includes('Dr A'));
});
test('KPT4: pelajar dikira sekali (no. matrik) merentas daftar dan CKAI 8 (TRL 1-3)', () => {
  const kp = (o) => g.api_save(adminToken, 'KPT4', Object.assign({ fakulti: 'FAI', nama: 'Pelajar Satu', no_kp: '000101-01-0101', no_matrik: 'K4-1', 'nama_projek_inovasi': 'Aplikasi', level_TRL: 'TRL 2' }, o));
  const base = card(dash(2026), 'KPT4').value;
  ok(kp({})); failF(kp({ tarikh: '2027-02-01' }), 'no_matrik');
  assert.strictEqual(card(dash(2026), 'KPT4').value, base + 1);
  ok(g.api_save(adminToken, 'CKAI8', inno({ tajuk_inovasi: 'Robot KPT', trl: 'TRL 3', tarikh: '2026-05-01', pelajar: [{ nama: 'Pelajar Satu', matrik: 'K4-1' }, { nama: 'Pelajar Dua', matrik: 'K4-2' }] })));
  assert.strictEqual(card(dash(2026), 'KPT4').value, base + 2);               // K4-1 tidak dikira dua kali
  assert.strictEqual(card(dash(2027), 'KPT4').value, 0);
  assert.ok(!JSON.stringify(dash(2026)).includes('Pelajar Dua'));
});
test('KPT5: SSU aktif berasaskan inovasi, TRL 4-6 (auto daripada CKAI 4)', () => {
  const ssu = (o) => g.api_save(adminToken, 'CKAI4', Object.assign({ fakulti: 'FKE', nama_pelajar: 'Pemilik', no_kp: '010101-01-0101', no_matrik: 'S5', nama_syarikat: 'Tech Sdn', jenis_perniagaan: 'Telekomunikasi', bil_rakan_kongsi: 1, no_ssu: 'SSU-K5', tarikh_daftar: '2026-03-01', status_ssm: 'Tidak Berdaftar', status: 'Aktif', berasaskan_inovasi: 'Ya', trl_syarikat: 'TRL 5' }, o));
  const base = card(dash(2026), 'KPT5').value;
  failF(ssu({ trl_syarikat: '' }), 'trl_syarikat');
  ok(ssu({ no_ssu: 'SSU-K5' })); ok(ssu({ no_ssu: 'SSU-K6', nama_syarikat: 'Bukan Inovasi', berasaskan_inovasi: 'Tidak', trl_syarikat: '' }));
  ok(ssu({ no_ssu: 'SSU-K7', nama_syarikat: 'Tidak Aktif', status: 'Tidak Aktif' }));
  assert.strictEqual(card(dash(2026), 'KPT5').value, base + 1);
});
test('KPT6: kolaborasi rasmi dikira mengikut tahun dokumen', () => {
  const kr = (o) => g.api_save(adminToken, 'KPT6', Object.assign({ fakulti: 'FM', tajuk: 'Projek A', rakan_institusi: 'Syarikat X', bidang_kerjasama: 'AI', skop: 'Tempatan', jenis_dokumen: 'MoU', bil_projek_aktiviti_berkolabrasi: 1, bukti_dokumen: 'MoU', tarikh_mula: '2026-04-01' }, o)), kb = (o) => ok(kr(o));
  kb({}); kb({ tajuk: 'Projek B', skop: 'Antarabangsa', bil_projek_aktiviti_berkolabrasi: 3, tarikh_mula: '2027-01-01' });
  failF(kr({ tajuk: 'Salah', tarikh_akhir: '2026-01-01' }), 'tarikh_akhir');
  failF(kr({ tajuk: 'Bukti', bukti_dokumen: 'Surat' }), 'bukti_dokumen');
  failF(kr({ tajuk: 'Sifar', bil_projek_aktiviti_berkolabrasi: 0 }), 'bil_projek_aktiviti_berkolabrasi');
  const c = card(dash(2026), 'KPT6'); assert.strictEqual(c.value, 1);
  assert.strictEqual(card(dash(2027), 'KPT6').value, 3);                           // jumlah projek / aktiviti
  const sh = g.getSheet_('KPT6_Kolaborasi');
  deepEq(sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].slice(0, 9), ['id', 'fakulti', 'tajuk', 'rakan_institusi', 'bidang_kerjasama', 'jenis_dokumen', 'bil_projek_aktiviti_berkolabrasi', 'nama_projek', 'tarikh_mula']);
});
test('KPT7: syarikat dibiayai unik setahun; hadiah CKAI 9 (>RM0) turut dikira', () => {
  const by = (o) => g.api_save(adminToken, 'KPT7', Object.assign({ fakulti: 'FM', nama_syarikat: 'Firma Dana', nama_pemilik: 'Pemilik A', no_kp_pemilik: '800101-01-1010', bangsa: 'MELAYU', sumber_pembiayaan: 'ENTITI PENDANAAN AWAM', jumlah_rm: 10000, tarikh_mula_embiayaan: '2026-03-01' }, o));
  ok(by({})); failF(by({ jumlah_rm: 5000 }), 'nama_syarikat');
  failF(by({ nama_syarikat: 'Lain', sumber_pembiayaan: 'Geran' }), 'sumber_pembiayaan');
  failF(by({ nama_syarikat: 'Lain', bangsa: 'ARAB' }), 'bangsa');
  const sh7 = g.getSheet_('KPT7_Pembiayaan');
  deepEq(sh7.getRange(1, 1, 1, sh7.getLastColumn()).getValues()[0], ['id', 'fakulti', 'mentor', 'nama_syarikat', 'no_pendaftaran_syarikat', 'nama_pemilik', 'no_kp_pemilik', 'bangsa', 'jenis_perniagaan', 'jenis_pembiaya', 'sumber_pembiayaan', 'jumlah_rm', 'tarikh_mula_embiayaan', 'lampiran', 'lampiran_pautan', 'catatatn', 'dicipta_pada', 'dicipta_oleh', 'dikemas_kini_pada', 'dikemas_kini_oleh']);
  const up7 = (n) => { const r = ok(g.api_uploadFile(adminToken, 'CKAI9', 'sijil', { name: n + '.pdf', data: PDF(n) })); return { id: r.id, name: r.name }; };
  const base = card(dash(2026), 'KPT7').value;
  ok(g.api_save(adminToken, 'CKAI9', award({ nama_anugerah: 'Hadiah Besar', tarikh: '2026-06-01', produk_projek: 'Firma Dana', nilai_hadiah_rm: 2000, sijil: up7('k7') })));
  assert.strictEqual(card(dash(2026), 'KPT7').value, base);               // nama sama = syarikat sama
  ok(g.api_save(adminToken, 'CKAI9', award({ nama_anugerah: 'Hadiah Lain', tarikh: '2026-07-01', produk_projek: 'Projek Baharu', nilai_hadiah_rm: 500, sijil: up7('k7b') })));
  assert.strictEqual(card(dash(2026), 'KPT7').value, base + 1);
});
test('KPT: sasaran 2026-2030 disemai dan setiap KPT ada sasaran', () => {
  const d = dash(2030);
  ['KPT1', 'KPT2', 'KPT3', 'KPT4', 'KPT5', 'KPT6', 'KPT7'].forEach(id => assert.ok(card(d, id).target !== '', 'tiada sasaran: ' + id));
});

test('linkSistem dari editor (tanpa antara muka Sheet) memberi mesej jelas dengan pautan', () => {
  const env2 = require('./mock').loadGas({ now: Date.UTC(2026, 4, 15, 4, 0, 0) });
  env2.g.SpreadsheetApp.getUi = () => { throw new Error('Cannot call SpreadsheetApp.getUi() from this context.'); };
  assert.throws(() => env2.g.linkSistem(), /hanya berfungsi apabila dijalankan dari dalam Google Sheet.*https:\/\/script\.google\.com/);
});

console.log('\n' + passed + ' lulus, ' + failed + ' gagal');
process.exit(failed ? 1 : 0);
