/** Fungsi Admin: pengurusan pengguna (PIC), sasaran dan paparan log audit. */

function listUsers_(token) {
  requireAdmin_(token);
  return readTable_(SHEETS.USERS).rows.map(function (r) {
    return { emel: r.emel, nama: r.nama, peranan: r.peranan, fakulti: r.fakulti, kpi_akses: r.kpi_akses, aktif: r.aktif };
  });
}

function saveUser_(token, input) {
  var admin = requireAdmin_(token);
  if (!input || typeof input !== 'object') throw userError_('Data tidak sah.');
  var email = normEmail_(input.emel);
  if (!isEmail_(email)) throw userError_('Alamat e-mel tidak sah.', { fields: { emel: 'E-mel tidak sah.' } });
  if (!emailDomainAllowed_(email)) throw userError_('Domain e-mel tidak dibenarkan.', { fields: { emel: 'Domain tidak dibenarkan.' } });
  var role = String(input.peranan || '');
  if ([ROLES.ADMIN, ROLES.PIC].indexOf(role) < 0) throw userError_('Peranan tidak sah.', { fields: { peranan: 'Pilih Admin atau PIC.' } });
  var fakulti = String(input.fakulti || '');
  var faculties = listFaculties_().map(function (f) { return f.kod; });
  if (faculties.indexOf(fakulti) < 0) throw userError_('Fakulti tidak sah.', { fields: { fakulti: 'Fakulti tidak sah.' } });
  var facultyKpis = KPIS.filter(function (k) { return k.entry === 'faculty'; }).map(function (k) { return k.id; });
  var akses = String(input.kpi_akses || '').split(/[,;\s]+/).map(function (s) { return s.trim().toUpperCase(); }).filter(String);
  for (var i = 0; i < akses.length; i++) {
    if (facultyKpis.indexOf(akses[i]) < 0) throw userError_('KPI akses tidak sah: ' + akses[i] + '. PIC hanya boleh diberi ' + facultyKpis.join(', ') + '.', { fields: { kpi_akses: 'KPI tidak sah.' } });
  }
  var aktif = String(input.aktif || 'Ya');
  if (YES_NO.indexOf(aktif) < 0) throw userError_('Status aktif tidak sah.');
  var nama = sanitizeText_(String(input.nama || '').slice(0, 120));

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var table = readTable_(SHEETS.USERS);
    var existing = null;
    table.rows.forEach(function (r) { if (normEmail_(r.emel) === email) existing = r; });
    if (existing && parseUser_(existing).peranan === ROLES.ADMIN && (role !== ROLES.ADMIN || aktif !== 'Ya')) {
      var otherAdmins = table.rows.map(parseUser_).filter(function (u) { return u.peranan === ROLES.ADMIN && u.aktif && u.emel !== email; });
      if (!otherAdmins.length) throw userError_('Mesti ada sekurang-kurangnya seorang Admin aktif.');
    }
    var obj = { emel: email, nama: nama, peranan: role, fakulti: fakulti, kpi_akses: akses.join(','), aktif: aktif };
    if (!existing) obj.dicipta_pada = nowIso_();
    writeRow_(getSheet_(SHEETS.USERS), existing ? existing._row : null, obj);
    audit_(admin, existing ? 'PENGGUNA_KEMAS_KINI' : 'PENGGUNA_TAMBAH', '', email, role + ' / ' + fakulti + ' / ' + akses.join(',') + ' / aktif=' + aktif);
    if (aktif !== 'Ya') revokeSessionsOf_(email);   // akaun dinyahaktifkan: tamatkan semua sesi
    return true;
  } finally {
    lock.releaseLock();
  }
}

function deleteUser_(token, emailIn) {
  var admin = requireAdmin_(token);
  var email = normEmail_(emailIn);
  if (email === admin.emel) throw userError_('Anda tidak boleh memadam akaun sendiri.');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var table = readTable_(SHEETS.USERS);
    var existing = null;
    table.rows.forEach(function (r) { if (normEmail_(r.emel) === email) existing = r; });
    if (!existing) throw userError_('Pengguna tidak dijumpai.');
    getSheet_(SHEETS.USERS).deleteRow(existing._row);
    revokeSessionsOf_(email);   // tamatkan semua sesi pengguna yang dipadam
    audit_(admin, 'PENGGUNA_PADAM', '', email, '');
    return true;
  } finally {
    lock.releaseLock();
  }
}

function listTargetsAdmin_(token) {
  requireAdmin_(token);
  return readTable_(SHEETS.TARGETS, { tahun: 'number', sasaran: 'number', q1: 'number', q2: 'number', q3: 'number', q4: 'number', bajet_rm: 'number' }).rows
    .map(stripRow_);
}

function saveTarget_(token, input) {
  var admin = requireAdmin_(token);
  var kpi = getKpi_(String(input && input.kpi));
  var year = parseInt(input.tahun, 10);
  if (APP.YEARS.indexOf(year) < 0) throw userError_('Tahun tidak sah.');
  function numOrBlank(v, name) {
    if (v === '' || v === null || v === undefined) return '';
    var n = Number(v);
    if (!isFinite(n) || n < 0) throw userError_('Nilai ' + name + ' tidak sah.');
    return n;
  }
  var sasaran = numOrBlank(input.sasaran, 'sasaran');
  if (sasaran === '') throw userError_('Sasaran tahunan wajib diisi.');
  if ((kpi.jenis === 'kemajuan' || kpi.jenis === 'penggunaan') && sasaran > 100) throw userError_('Sasaran peratus tidak boleh melebihi 100%.');
  var q = [numOrBlank(input.q1, 'Q1'), numOrBlank(input.q2, 'Q2'), numOrBlank(input.q3, 'Q3'), numOrBlank(input.q4, 'Q4')];
  var obj = { kpi: kpi.id, tahun: year, sasaran: sasaran, q1: q[0], q2: q[1], q3: q[2], q4: q[3], jenis: kpi.jenis, bajet_rm: numOrBlank(input.bajet_rm, 'bajet'), catatan: sanitizeText_(String(input.catatan || '').slice(0, 500)) };

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var table = readTable_(SHEETS.TARGETS, { tahun: 'number' });
    var existing = null;
    table.rows.forEach(function (r) { if (r.kpi === kpi.id && r.tahun === year) existing = r; });
    writeRow_(getSheet_(SHEETS.TARGETS), existing ? existing._row : null, obj);
    audit_(admin, 'SASARAN_KEMAS_KINI', kpi.id, String(year), 'sasaran=' + sasaran);
    clearDashCache_();
    return true;
  } finally {
    lock.releaseLock();
  }
}

function listAudit_(token, limit) {
  requireAdmin_(token);
  var rows = readTable_(SHEETS.AUDIT).rows.map(stripRow_);
  rows.reverse();
  return rows.slice(0, Math.min(parseInt(limit, 10) || 200, 500));
}

// ---------------------------------------------------------------------------
// Tab Persediaan (Admin): pautan, ID dan semakan kesihatan sistem
// ---------------------------------------------------------------------------
function safe_(fn, fallback) { try { var v = fn(); return v === undefined ? fallback : v; } catch (e) { return fallback; } }

function getSetupInfo_(token) {
  requireAdmin_(token);
  var ss = safe_(function () { return getSS_(); }, null);
  var info = {
    appName: APP.NAME, timeZone: APP.TZ,
    owner: safe_(function () { return normEmail_(Session.getEffectiveUser().getEmail()); }, ''),
    scriptId: safe_(function () { return ScriptApp.getScriptId(); }, ''),
    webAppUrl: safe_(function () { return ScriptApp.getService().getUrl(); }, ''),
    sheet: ss ? { id: ss.getId(), url: ss.getUrl(), name: safe_(function () { return ss.getName ? ss.getName() : ''; }, '') } : null,
    folder: null, mailQuota: safe_(function () { return MailApp.getRemainingDailyQuota(); }, null),
    checks: [], counts: {}
  };
  info.isDevUrl = /\/dev$/.test(info.webAppUrl || '');
  var folderId = getProp_('FOLDER_ID');
  if (folderId) {
    var f = safe_(function () { return DriveApp.getFolderById(folderId); }, null);
    info.folder = f ? { id: folderId, url: safe_(function () { return f.getUrl(); }, ''), ok: true } : { id: folderId, url: '', ok: false };
  }

  function check(label, ok, detail) { info.checks.push({ label: label, ok: ok, detail: detail || '' }); }
  check('Google Sheet laporan dijumpai', !!ss, ss ? '' : 'Jalankan setup() daripada editor Apps Script atau tekan "Jalankan persediaan".');
  if (ss) {
    var missingTabs = [], missingCols = [];
    var specs = [[SHEETS.USERS, USER_COLS], [SHEETS.FACULTIES, FACULTY_COLS], [SHEETS.TARGETS, TARGET_COLS], [SHEETS.RISKS, RISK_COLS], [SHEETS.AUDIT, AUDIT_COLS], [SHEETS.STUDENTS, STUDENT_COLS], [SHEETS.SESSIONS, SESSION_COLS], [SHEETS.KPT2_DEN, DEN_COLS]]
      .concat(KPIS.filter(function (k) { return k.sheet; }).map(function (k) { return [k.sheet, kpiColumns_(k)]; }));
    specs.forEach(function (sp) {
      var sh = ss.getSheetByName(sp[0]);
      if (!sh) { missingTabs.push(sp[0]); return; }
      var lc = sh.getLastColumn();
      var hdr = lc ? sh.getRange(1, 1, 1, lc).getValues()[0].map(String) : [];
      var miss = sp[1].filter(function (c) { return hdr.indexOf(c) < 0; });
      if (miss.length) missingCols.push(sp[0] + ' (' + miss.join(', ') + ')');
    });
    check('Semua tab wujud (' + specs.length + ' tab)', !missingTabs.length, missingTabs.length ? 'Tab tiada: ' + missingTabs.join(', ') : '');
    check('Semua lajur wajib wujud', !missingCols.length, missingCols.length ? 'Lajur tiada: ' + missingCols.join('; ') : '');
    var users = safe_(function () { return readTable_(SHEETS.USERS).rows.map(parseUser_); }, []);
    var admins = users.filter(function (u) { return u.peranan === ROLES.ADMIN && u.aktif; });
    info.counts = { admin: admins.length, pic: users.filter(function (u) { return u.peranan === ROLES.PIC && u.aktif; }).length, fakulti: safe_(function () { return listFaculties_().length; }, 0),
      sasaran: safe_(function () { return readTable_(SHEETS.TARGETS).rows.length; }, 0) };
    check('Sekurang-kurangnya seorang Admin aktif', admins.length > 0, admins.length + ' Admin aktif');
    check('Senarai fakulti ada isi', info.counts.fakulti > 0, info.counts.fakulti + ' fakulti dalam tab Fakulti');
    check('Baris sasaran wujud', info.counts.sasaran > 0, info.counts.sasaran + ' baris dalam tab Sasaran');
  }
  check('Kunci OTP (salt) wujud', !!getProp_('OTP_SALT'), '');
  check('Folder lampiran Drive', folderId ? !!(info.folder && info.folder.ok) : null, folderId ? (info.folder && info.folder.ok ? '' : 'Folder tidak dapat dicapai. Ia akan dicipta semula pada muat naik seterusnya.') : 'Belum dicipta (dicipta secara automatik semasa muat naik PDF pertama).');
  check('Pautan web app dikesan', !!info.webAppUrl, info.webAppUrl ? '' : 'Belum deploy sebagai Web app. Gunakan Deploy > New deployment > Web app.');
  if (info.webAppUrl) check('Pautan web app ialah pautan /exec (bukan /dev)', !info.isDevUrl, info.isDevUrl ? 'Anda berada dalam mod ujian (/dev). Kongsi pautan /exec daripada Deploy > Manage deployments.' : '');
  check('Kuota e-mel harian mencukupi', info.mailQuota === null ? null : info.mailQuota >= 20, info.mailQuota === null ? '' : info.mailQuota + ' e-mel berbaki hari ini');
  return info;
}

function runSetupFromApp_(token) {
  var admin = requireAdmin_(token);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var r = setup();
    audit_(admin, 'SETUP', '', '', 'Persediaan dijalankan semula daripada tab Persediaan');
    clearDashCache_();
    return { ok: true, url: r && r.url };
  } finally {
    lock.releaseLock();
  }
}

function sendTestMail_(token) {
  var admin = requireAdmin_(token);
  var cache = CacheService.getScriptCache();
  var key = 'testmail:' + sha256Hex_(admin.emel);
  var n = parseInt(cache.get(key) || '0', 10);
  if (n >= 3) throw userError_('Had 3 e-mel ujian sejam dicapai. Cuba lagi kemudian.');
  cache.put(key, String(n + 1), 3600);
  MailApp.sendEmail({ to: admin.emel, name: APP.NAME, subject: '[' + APP.NAME + '] Ujian e-mel', body: 'Ini e-mel ujian daripada tab Persediaan. Jika anda menerimanya, penghantaran OTP berfungsi.\n\n' + APP.NAME });
  audit_(admin, 'UJIAN_EMEL', '', '', '');
  return { to: admin.emel, remaining: safe_(function () { return MailApp.getRemainingDailyQuota(); }, null) };
}


// ---------------------------------------------------------------------------
// Segerak CKAI 5 (Penggunaan Makerspace) daripada Sheet luar (borang permohonan, tab DATA)
// ---------------------------------------------------------------------------
var MS_COLS = {
  ts: /^timestamp/i, emel: /^email/i, nama: /^nama penuh/i, kp: /kad pengenalan|paspot|passport/i, matrik: /^no\.? ?matrik/i,
  fak: /^fakulti/i, tel: /telefon|phone/i, jenis: /^jenis/i, tujuan: /^tujuan/i, bil: /^bilangan/i,
  mula: /^tarikh mula/i, tamat: /^tarikh tamat/i, masaM: /^masa mula/i, masaT: /^masa tamat/i, borang: /^muatnaik|^upload/i, caj: /^bayaran caj|^bayaran/i
};

function openMakerspaceSource_() {
  var id = getProp_('MAKERSPACE_SHEET_ID') || MAKERSPACE_SRC.id;
  var ss;
  try { ss = SpreadsheetApp.openById(id); }
  catch (e) { console.error('Gagal buka Sheet sumber ' + id + ': ' + (e && e.message)); throw userError_('Sheet permohonan tidak dapat dibuka. Kongsi Sheet itu (Viewer) dengan akaun penerbit aplikasi.'); }
  if (!ss) throw userError_('Sheet permohonan tidak dapat dibuka. Semak MAKERSPACE_SHEET_ID dan kebenaran akaun penerbit.');
  var sh = ss.getSheetByName(MAKERSPACE_SRC.tab);
  if (!sh) throw userError_('Tab "' + MAKERSPACE_SRC.tab + '" tiada dalam Sheet permohonan.');
  var tz = APP.TZ;
  try { if (ss.getSpreadsheetTimeZone) tz = ss.getSpreadsheetTimeZone() || APP.TZ; } catch (e) { tz = APP.TZ; }
  return { sh: sh, tz: tz };
}

function srcDate_(v, tz) {
  if (Object.prototype.toString.call(v) === '[object Date]') return isNaN(v.getTime()) ? '' : Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  var t = String(v === null || v === undefined ? '' : v).trim(), m;
  if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t))) return m[3] + '-' + ('0' + m[1]).slice(-2) + '-' + ('0' + m[2]).slice(-2);   // M/D/YYYY (format Google Form)
  if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t))) return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
  return '';
}
function srcTime_(v, tz) {
  if (Object.prototype.toString.call(v) === '[object Date]') return isNaN(v.getTime()) ? '' : Utilities.formatDate(v, tz, 'HH:mm');
  var t = String(v === null || v === undefined ? '' : v).trim(), m = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i.exec(t);
  if (!m) return '';
  var h = parseInt(m[1], 10);
  if (m[3]) { var pm = /pm/i.test(m[3]); if (pm && h < 12) h += 12; if (!pm && h === 12) h = 0; }
  return ('0' + h).slice(-2) + ':' + m[2];
}
function srcEquipment_(raw) {
  var t = String(raw || '').toLowerCase();
  if (/laser/.test(t)) return { p: 'Laser Cutter Machine' };
  if (/3d/.test(t)) return { p: '3D Printer' };
  if (/sewaan|space rental/.test(t)) return { p: 'Sewaan Ruang (Space Rental)' };
  if (/tangan|tools/.test(t)) return { p: 'Peralatan Tangan (Tools)' };
  return { p: 'Lain-lain (Other)', lain: String(raw || '').trim().slice(0, 100) || 'Tidak dinyatakan' };
}
function srcFaculty_(raw, codes) {
  var t = String(raw || '').trim().toUpperCase();
  if (codes.indexOf(t) >= 0) return t;
  var first = t.split(/[\s\/,-]+/)[0];
  return codes.indexOf(first) >= 0 ? first : '';
}
function srcFileId_(link) {
  var m = /[?&]id=([A-Za-z0-9_-]{10,100})/.exec(String(link || '')) || /\/d\/([A-Za-z0-9_-]{10,100})/.exec(String(link || ''));
  return m ? m[1] : '';
}

/**
 * Import baris baharu daripada Sheet permohonan ke CKAI 5. Idempotent: kunci sumber (cap masa + no. matrik) mengelak pendua.
 * startRow = indeks baris sumber (0 = baris tajuk). Berhenti selepas maxNew baris baharu atau lewat tempoh; pulangkan nextRow.
 * Pelajar yang belum ada / belum lengkap dalam PELAJAR didaftar daripada data borang (data sah sedia ada tidak ditimpa).
 */
function syncMakerspace_(user, startRow, maxNew, deadline) {
  var kpi = getKpi_('CKAI5'), src = openMakerspaceSource_(), sh = src.sh, tz = src.tz;
  var lr = sh.getLastRow(), lc = sh.getLastColumn();
  var out = { imported: 0, skipped: 0, failed: [], students: 0, nextRow: startRow, done: true, total: Math.max(0, lr - 1) };
  if (lr < 2) return out;
  var vals = sh.getRange(1, 1, lr, lc).getValues(), hdr = vals[0].map(function (h) { return String(h || '').replace(/\s+/g, ' ').trim(); });
  var col = {};
  Object.keys(MS_COLS).forEach(function (k) { for (var i = 0; i < hdr.length; i++) { if (MS_COLS[k].test(hdr[i])) { col[k] = i; break; } } });
  ['ts', 'nama', 'kp', 'matrik', 'jenis', 'mula', 'tamat'].forEach(function (k) { if (col[k] === undefined) throw userError_('Lajur "' + k + '" tidak dijumpai dalam tab DATA. Semak tajuk lajur sumber.'); });
  var ctx = { table: null, sh: null }, faculties = listFaculties_().map(function (f) { return f.kod; });
  var tbl = readTable_(kpi.sheet, typesFor_(kpi)), existing = {};
  tbl.rows.forEach(function (r) { if (r.sumber_kunci) existing[String(r.sumber_kunci)] = 1; });
  ctx.table = tbl; ctx.sh = getSheet_(kpi.sheet);
  var cell = function (row, k) { return col[k] === undefined ? '' : row[col[k]]; };

  // Fasa A: kumpulkan baris baharu (tanpa menulis apa-apa)
  var cands = [], i = Math.max(1, startRow || 1), tried = 0;
  for (; i < vals.length; i++) {
    if (tried >= maxNew || (deadline && new Date().getTime() > deadline)) { out.done = false; break; }
    var row = vals[i], matrik = normMatrik_(cell(row, 'matrik'));
    if (!matrik && !String(cell(row, 'nama')).trim()) continue;
    var tsv = cell(row, 'ts'), tsKey = Object.prototype.toString.call(tsv) === '[object Date]' ? Utilities.formatDate(tsv, tz, 'yyyy-MM-dd HH:mm:ss') : String(tsv).trim();
    var key = 'ms|' + tsKey + '|' + matrik;
    if (existing[key]) { out.skipped++; continue; }
    tried++;
    cands.push({ rowNum: i + 1, row: row, matrik: matrik, key: key });
  }
  out.nextRow = i;
  if (i >= vals.length) out.done = true;
  if (!cands.length) return out;

  // Fasa B: daftar / lengkapkan pelajar yang perlu dalam satu panggilan (data sah sedia ada tidak ditimpa)
  var need = studentNeeds_(kpi), idx = studentIndex_(), toSave = [], seen = {}, bad = {};
  cands.forEach(function (c) {
    var cur = idx[c.matrik] || null;
    if ((!cur || studentGaps_(cur, need).length) && !seen[c.matrik]) {
      seen[c.matrik] = 1;
      toSave.push({ no_matrik: c.matrik, nama_pelajar: String(cell(c.row, 'nama')).trim(), no_kp: cell(c.row, 'kp'), emel: String(cell(c.row, 'emel')).trim(), telefon: String(cell(c.row, 'tel')).trim(), fakulti: srcFaculty_(cell(c.row, 'fak'), faculties) });
    }
  });
  if (toSave.length) {
    var sres = saveStudentsAs_({ emel: user.emel, peranan: ROLES.PIC }, toSave, true).results;
    sres.forEach(function (r) { if (r.ok) out.students++; else bad[r.no_matrik] = r.fields || {}; });
    if (out.students) audit_(user, 'PELAJAR_TAMBAH', '', '', out.students + ' pelajar didaftar / dilengkapkan daripada borang makerspace');
    STUDENT_MEMO_ = null;
  }

  // Fasa C: simpan rekod CKAI 5 (jadual dikongsi; audit dan cache sekali)
  cands.forEach(function (c) {
    var fail = function (msg, fields) { out.failed.push({ row: c.rowNum, no_matrik: c.matrik, error: msg, fields: fields || null }); };
    if (bad[c.matrik]) { fail('Maklumat pelajar tidak lengkap / tidak sah dalam borang: ' + Object.keys(bad[c.matrik]).join(', ') + '.', bad[c.matrik]); return; }
    try {
      var row = c.row, eq = srcEquipment_(cell(row, 'jenis')), caj = String(cell(row, 'caj')), amt = /([\d.]+)/.exec(caj.replace(/,/g, ''));
      var fid = srcFileId_(cell(row, 'borang')), paid = !!amt && /rm|\d/i.test(caj);
      var rec = {
        no_matrik: c.matrik, kelas: String(cell(row, 'fak')).trim().slice(0, 120), peralatan: eq.p, peralatan_lain: eq.lain || '',
        tujuan: String(cell(row, 'tujuan')).trim().slice(0, 2000) || 'Tidak dinyatakan', bil_peserta: parseInt(cell(row, 'bil'), 10) || 1,
        tarikh_mula: srcDate_(cell(row, 'mula'), tz), tarikh_tamat: srcDate_(cell(row, 'tamat'), tz),
        masa_mula: srcTime_(cell(row, 'masaM'), tz), masa_tamat: srcTime_(cell(row, 'masaT'), tz),
        status_bayaran: paid ? 'Bayar' : 'Belum Dibayar', bayaran_rm: paid ? Number(amt[1]) : 0,
        sumber_kunci: c.key
      };
      if (fid) rec.borang = { id: fid, name: 'borang-permohonan' };
      saveRecordAs_(user, kpi, rec, { trustFiles: true, ctx: ctx, silent: true });
      existing[c.key] = 1; out.imported++;
    } catch (e) {
      if (!(e && e.user)) throw e;
      if (e.fields && e.fields.sumber_kunci) { out.skipped++; return; }
      fail(e.message, e.fields || null);
    }
  });
  if (out.imported) clearDashCache_();
  return out;
}

function syncMakerspaceApi_(token, startRow) {
  var user = requireAdmin_(token);
  var r = syncMakerspace_(user, parseInt(startRow, 10) || 1, 20, new Date().getTime() + 150000);
  audit_(user, 'SEGERAK_MAKERSPACE', 'CKAI5', '', r.imported + ' diimport, ' + r.skipped + ' sedia ada, ' + r.failed.length + ' gagal');
  return r;
}

/** Untuk pencetus berjadual (Triggers > Time-driven): segerak sehingga selesai dalam had masa. */
function segerakMakerspace() {
  var admin = { emel: 'segerak@sistem', nama: 'Segerak Makerspace', peranan: ROLES.ADMIN, fakulti: 'UTMXCITE', kpiAkses: [] };
  var deadline = new Date().getTime() + 270000, row = 1, tot = { imported: 0, skipped: 0, failed: 0 }, r;
  do {
    r = syncMakerspace_(admin, row, 25, deadline);
    tot.imported += r.imported; tot.skipped += r.skipped; tot.failed += r.failed.length; row = r.nextRow;
  } while (!r.done && new Date().getTime() < deadline);
  audit_(admin, 'SEGERAK_MAKERSPACE', 'CKAI5', '', tot.imported + ' diimport, ' + tot.skipped + ' sedia ada, ' + tot.failed + ' gagal' + (r.done ? '' : ' (belum selesai)'));
  console.log(JSON.stringify(tot) + (r.done ? '' : ' belum selesai; jalankan semula'));
  return tot;
}
