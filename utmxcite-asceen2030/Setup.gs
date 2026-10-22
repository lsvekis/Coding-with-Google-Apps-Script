/**
 * Persediaan: cipta (atau gunakan semula) Google Sheet laporan dan semua tab.
 * Jalankan setup() SEKALI daripada editor Apps Script. Selamat dijalankan semula (idempotent).
 */
function setup() {
  var ss = null;
  var id = getProp_('SHEET_ID');
  if (id) {
    ss = SpreadsheetApp.openById(id);
  } else {
    try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) { ss = null; }
    if (!ss) ss = SpreadsheetApp.create('Laporan ASCEND 2030 - UTMXCITE');
    setProp_('SHEET_ID', ss.getId());
  }
  getSalt_();

  ensureSheet_(ss, SHEETS.USERS, USER_COLS, []);
  ensureSheet_(ss, SHEETS.FACULTIES, FACULTY_COLS, []);
  ensureSheet_(ss, SHEETS.TARGETS, TARGET_COLS, []);
  ensureSheet_(ss, SHEETS.RISKS, RISK_COLS, []);
  ensureSheet_(ss, SHEETS.AUDIT, AUDIT_COLS, []);
  ensureSheet_(ss, SHEETS.SESSIONS, SESSION_COLS, SESSION_COLS.map(function (k) { return { key: k, type: 'text' }; }));
  ensureSheet_(ss, SHEETS.STUDENTS, STUDENT_COLS, STUDENT_COLS.map(function (k) { return { key: k, type: 'text' }; }));
  ensureSheet_(ss, SHEETS.KPT2_DEN, DEN_COLS, DEN_COLS.map(function (k) { return { key: k, type: 'text' }; }));
  renameColumns_(ss);
  KPIS.forEach(function (kpi) {
    if (!kpi.sheet) return;
    ensureSheet_(ss, kpi.sheet, kpiColumns_(kpi), kpi.fields.concat([{ key: 'id', type: 'text' }].concat(SYS_COLS.map(function (k) { return { key: k, type: 'text' }; }))));
  });

  migrateColumns_(ss);

  listValidation_(ss.getSheetByName(SHEETS.USERS), 'peranan', [ROLES.ADMIN, ROLES.PIC]);
  listValidation_(ss.getSheetByName(SHEETS.USERS), 'aktif', YES_NO);

  seedIfEmpty_(ss, SHEETS.FACULTIES, FACULTY_COLS, FACULTY_SEED);
  seedIfEmpty_(ss, SHEETS.KPT2_DEN, DEN_COLS, APP.YEARS.reduce(function (a, y) { return a.concat(FACULTY_SEED.map(function (f) { return [y, f[0], '', '', '']; })); }, []));
  seedIfEmpty_(ss, SHEETS.TARGETS, TARGET_COLS, buildTargetSeed_());
  addMissingTargetRows_(ss);
  seedIfEmpty_(ss, SHEETS.RISKS, RISK_COLS, RISK_SEED.map(function (r) { return [r[0], r[1], r[2], r[3], 'Terbuka', nowIso_()]; }));
  seedAdmin_(ss);
  seedMilestones_(ss);
  backfillFileLinks_(ss);
  dropRetiredColumns_(ss);

  var first = ss.getSheetByName('Sheet1');
  if (first && ss.getSheets().length > 1 && first.getLastRow() === 0) { try { ss.deleteSheet(first); } catch (e) { /* abaikan */ } }

  adoptFolderFromTab_(ss);
  writeSetupTab_(ss);

  console.log('Setup selesai. Sheet: ' + ss.getUrl());
  return { id: ss.getId(), url: ss.getUrl() };
}

function ensureSheet_(ss, name, headers, fieldDefs) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0 || sh.getLastColumn() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    // tambah lajur baharu di hujung jika definisi bertambah
    var existing = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    var missing = headers.filter(function (h) { return existing.indexOf(h) < 0; });
    if (missing.length) sh.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
  }
  var hdr = sh.getRange(1, 1, 1, sh.getLastColumn());
  hdr.setFontWeight('bold').setBackground('#5c0f2a').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  // Lajur teks/tarikh disimpan sebagai teks supaya no. matrik/telefon tidak hilang sifar di hadapan.
  var all = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  var textTypes = { text: 1, textarea: 1, email: 1, url: 1, select: 1, faculty: 1, yesno: 1, date: 1, month: 1, time: 1, file: 1, people: 1 };
  var typeOf = {};
  (fieldDefs || []).forEach(function (f) { typeOf[f.key] = f.type; });
  all.forEach(function (h, i) {
    var plain = fieldDefs && fieldDefs.length ? textTypes[typeOf[h]] : (h !== 'tahun' && h !== 'sasaran' && h !== 'bajet_rm' && h !== 'q1' && h !== 'q2' && h !== 'q3' && h !== 'q4');
    if (plain) sh.getRange(2, i + 1, Math.max(sh.getMaxRows() - 1, 1), 1).setNumberFormat('@');
  });
}

/** Drop-down dalam Sheet supaya penyuntingan manual tab Pengguna kekal bersih. */
function listValidation_(sh, header, values) {
  var hdrs = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  var col = hdrs.indexOf(header) + 1;
  if (!col) return;
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).build();
  sh.getRange(2, col, Math.max(sh.getMaxRows() - 1, 1), 1).setDataValidation(rule);
}

function seedIfEmpty_(ss, name, cols, rows) {
  var sh = ss.getSheetByName(name);
  if (sh.getLastRow() > 1 || !rows.length) return;
  writeRows_(sh, cols, rows);
}

/**
 * Pemasangan sedia ada: tambah baris sasaran bagi KPI yang BELUM langsung ada dalam tab Sasaran (contoh CKAI yang baru ditambah).
 * KPI yang sudah ada tidak disentuh, jadi baris yang anda padam atau ubah tidak dihidupkan semula.
 */
function addMissingTargetRows_(ss) {
  var sh = ss.getSheetByName(SHEETS.TARGETS);
  if (sh.getLastRow() < 2) return;
  var present = {};
  readTable_(SHEETS.TARGETS).rows.forEach(function (r) { present[String(r.kpi)] = true; });
  var add = buildTargetSeed_().filter(function (r) { return !present[r[0]]; });
  writeRows_(sh, TARGET_COLS, add);
}

function seedAdmin_(ss) {
  var sh = ss.getSheetByName(SHEETS.USERS);
  if (sh.getLastRow() > 1) return;
  var email = '';
  try { email = Session.getEffectiveUser().getEmail(); } catch (e) { email = ''; }
  email = normEmail_(email);
  if (!email) {
    console.warn('E-mel pemilik skrip tidak dapat dikesan. Tambah pengguna Admin pertama secara manual dalam tab Pengguna.');
    return;
  }
  writeRow_(sh, null, { emel: email, nama: 'Pentadbir UTMXCITE', peranan: ROLES.ADMIN, fakulti: 'UTMXCITE', kpi_akses: '', aktif: 'Ya', dicipta_pada: nowIso_() });
}

function seedMilestones_(ss) {
  ['KAI2', 'DKAI1'].forEach(function (kid) {
    var kpi = getKpi_(kid);
    var sh = ss.getSheetByName(kpi.sheet);
    if (sh.getLastRow() > 1) return;
    var cols = kpiColumns_(kpi);
    var now = nowIso_();
    MILESTONE_SEED[kid].forEach(function (m, i) {
      var o = { id: kpi.prefix + '-' + ('00' + (i + 1)).slice(-3), dicipta_pada: now, dicipta_oleh: 'setup', dikemas_kini_pada: now, dikemas_kini_oleh: 'setup' };
      for (var k in m) { if (m.hasOwnProperty(k)) o[k] = m[k]; }
      writeRow_(sh, null, o);
    });
  });
}

/**
 * Tab "Persediaan" di dalam Google Sheet: ID dan pautan penting serta panduan jika paparan "404".
 * Ditulis semula setiap kali setup() dijalankan. Tab ini hanya maklumat (tiada data pengguna).
 */
function writeSetupTab_(ss) {
  var sh = ss.getSheetByName(SHEETS.SETUP) || ss.insertSheet(SHEETS.SETUP);
  var url = '', scriptId = '', owner = '', folder = null;
  try { url = ScriptApp.getService().getUrl() || ''; } catch (e) { url = ''; }
  try { scriptId = ScriptApp.getScriptId(); } catch (e) { scriptId = ''; }
  try { owner = Session.getEffectiveUser().getEmail(); } catch (e) { owner = ''; }
  var fid = getProp_('FOLDER_ID');
  if (fid) { try { folder = DriveApp.getFolderById(fid); } catch (e) { folder = null; } }
  var rows = [
    ['PERSEDIAAN & PAUTAN', '', ''],
    ['Item', 'Nilai', 'Catatan'],
    ['Nama aplikasi', APP.NAME, ''],
    ['Google Sheet - ID', ss.getId(), 'Disimpan dalam Script Properties (SHEET_ID).'],
    ['Google Sheet - Pautan', ss.getUrl(), 'Hadkan akses Sheet kepada Admin sahaja (ada no. KP pelajar).'],
    ['Web app - Pautan', url || '(belum deploy)', url ? (/\/dev$/.test(url) ? 'Ini pautan ujian /dev. Gunakan pautan /exec untuk orang ramai.' : 'Kongsi pautan ini kepada pengguna.') : 'Deploy > New deployment > Web app. Salin pautan berakhir /exec.'],
    ['Apps Script - Script ID', scriptId || '(tidak dikesan)', 'Untuk clasp (.clasp.json).'],
    ['Folder lampiran Drive - Pautan', folder ? folder.getUrl() : '(belum dicipta)', 'Dicipta automatik. Untuk guna folder sendiri, tampal ID atau pautan folder di sini, kemudian jalankan setup().'],
    ['Pemilik skrip (Execute as)', owner || '(tidak dikesan)', 'Admin pertama dalam tab Pengguna ialah pemilik ini.'],
    ['Dikemas kini', Utilities.formatDate(new Date(), APP.TZ, "yyyy-MM-dd HH:mm"), 'Jalankan setup() semula untuk menyegarkan.'],
    ['', '', ''],
    ['JIKA "404 - PAGE NOT FOUND"', '', ''],
    ['1', 'Guna pautan /exec daripada Deploy > Manage deployments (bukan /dev, bukan pautan editor).', ''],
    ['2', 'Deploy sebagai Web app: Execute as = Me, Who has access = Anyone.', ''],
    ['3', 'Selepas ubah kod: Deploy > Manage deployments > Edit > Version: New version > Deploy.', ''],
    ['4', 'Pautan dengan /u/1/ atau akaun Google berbeza boleh menyebabkan 404. Cuba tetingkap incognito.', ''],
    ['5', 'Semak dalam aplikasi: log masuk Admin > Pentadbiran > Persediaan.', '']
  ];
  sh.clear();
  sh.getRange(1, 1, rows.length, 3).setValues(rows);
  try {
    sh.getRange(1, 1, rows.length, 3).setNumberFormat('@');
    sh.getRange(1, 1).setFontWeight('bold');
    sh.getRange(2, 1, 1, 3).setFontWeight('bold').setBackground('#5c0f2a').setFontColor('#ffffff');
    sh.getRange(12, 1).setFontWeight('bold');
    sh.setColumnWidth(1, 230); sh.setColumnWidth(2, 520); sh.setColumnWidth(3, 420);
    sh.setFrozenRows(2);
  } catch (e) { /* pemformatan tidak kritikal */ }
}

function webUrl_() {
  var u = APP.WEB_URL || '';
  if (!u) { try { u = ScriptApp.getService().getUrl() || ''; } catch (e) { u = ''; } }
  return u;
}

/** Buka Dashboard KPI UTMXCITE JTNCHEPA dalam tab baharu. */
function linkSistem() {
  var url = webUrl_();
  if (!/^https:\/\/script\.google\.com\//.test(url)) throw new Error('Pautan web app belum ditetapkan (APP.WEB_URL dalam Config.gs).');
  var html = "<script>window.open(" + JSON.stringify(url) + ");google.script.host.close();<\/script>";
  var ui;
  try { ui = SpreadsheetApp.getUi(); } catch (e) { ui = null; }
  if (!ui) {   // dijalankan dari editor Apps Script (tiada antara muka Sheet)
    console.log('Pautan dashboard: ' + url);
    throw new Error('linkSistem() hanya berfungsi apabila dijalankan dari dalam Google Sheet (menu atau butang). Pautan: ' + url);
  }
  ui.showModalDialog(HtmlService.createHtmlOutput(html).setWidth(1).setHeight(1), 'Dashboard KPI UTMXCITE JTNCHEPA');
}

/** Jika ID/pautan folder lampiran ditampal pada tab Persediaan, gunakan folder itu (mesti boleh dicapai oleh pemilik skrip). */
function adoptFolderFromTab_(ss) {
  var sh = ss.getSheetByName(SHEETS.SETUP);
  if (!sh || sh.getLastRow() < 2) return;
  var rows = sh.getRange(1, 1, sh.getLastRow(), 2).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).indexOf('Folder lampiran Drive') !== 0) continue;
    var v = String(rows[i][1] || '').trim();
    var m = /\/folders\/([A-Za-z0-9_-]{10,})/.exec(v) || /^([A-Za-z0-9_-]{15,})$/.exec(v);
    if (!m || m[1] === getProp_('FOLDER_ID')) return;
    try { DriveApp.getFolderById(m[1]).getName(); } catch (e) { console.warn('Folder pada tab Persediaan tidak dapat dicapai: ' + m[1]); return; }
    setProp_('FOLDER_ID', m[1]);
    return;
  }
}

/** Isi lajur pautan Drive bagi rekod lama yang sudah ada fail lampiran tetapi belum ada pautan. */
function backfillFileLinks_(ss) {
  KPIS.forEach(function (kpi) {
    if (!kpi.sheet) return;
    var fileFields = kpi.fields.filter(function (f) { return f.type === 'file'; });
    var sh = ss.getSheetByName(kpi.sheet);
    if (!fileFields.length || !sh || sh.getLastRow() < 2) return;
    var hdr = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    var n = sh.getLastRow() - 1;
    fileFields.forEach(function (f) {
      var src = hdr.indexOf(f.key), dst = hdr.indexOf(fileLinkCol_(f.key));
      if (src < 0 || dst < 0) return;
      var from = sh.getRange(2, src + 1, n, 1).getValues(), to = sh.getRange(2, dst + 1, n, 1).getValues(), changed = false;
      for (var i = 0; i < n; i++) {
        var id = (parseJson_(from[i][0], {}) || {}).id;
        var want = driveFileUrl_(id);
        if (want && to[i][0] !== want) { to[i][0] = want; changed = true; }
      }
      if (changed) sh.getRange(2, dst + 1, n, 1).setValues(to);
    });
  });
}

/**
 * Buang lajur yang sudah tidak digunakan (KPI.retired) daripada tab. Data dalam lajur itu dipadam kekal.
 * Hanya lajur yang tiada dalam definisi semasa dibuang.
 */
function dropRetiredColumns_(ss) {
  KPIS.forEach(function (kpi) {
    if (!kpi.sheet || !kpi.retired || !kpi.retired.length) return;
    var sh = ss.getSheetByName(kpi.sheet);
    if (!sh || sh.getLastColumn() < 1) return;
    var current = kpiColumns_(kpi);
    var hdr = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    var removed = [];
    for (var i = hdr.length - 1; i >= 0; i--) {   // dari kanan supaya indeks tidak berubah
      if (kpi.retired.indexOf(hdr[i]) >= 0 && current.indexOf(hdr[i]) < 0) { sh.deleteColumn(i + 1); removed.push(hdr[i]); }
    }
    if (removed.length) audit_(null, 'LAJUR_DIBUANG', kpi.id, '', removed.reverse().join(', '));
  });
}

/** Namakan semula tajuk lajur lama (KPI.renamed: {lama: baharu}) supaya data dikekalkan. */
function renameColumns_(ss) {
  KPIS.forEach(function (kpi) {
    if (!kpi.sheet || !kpi.renamed) return;
    var sh = ss.getSheetByName(kpi.sheet);
    if (!sh || sh.getLastColumn() < 1) return;
    var hdr = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    for (var old in kpi.renamed) {
      if (!kpi.renamed.hasOwnProperty(old)) continue;
      var i = hdr.indexOf(old);
      if (i >= 0 && hdr.indexOf(kpi.renamed[old]) < 0) { sh.getRange(1, i + 1).setValue(kpi.renamed[old]); audit_(null, 'LAJUR_DINAMA_SEMULA', kpi.id, '', old + ' -> ' + kpi.renamed[old]); }
    }
  });
}

/**
 * Selepas setup() menambah lajur baharu, salin nilai lajur lama (KPI.renamed) ke lajur baharu yang KOSONG.
 * Lajur lama tidak dipadam. Selamat dijalankan berulang kali.
 */
function migrateColumns_(ss) {
  migrateCkai7Month_(ss);
  migrateValues_(ss, 'KAI6', 'status', { 'Ideasi': 'Idea/konsep', 'Dalam latihan': 'Idea/konsep', 'Prototaip / MVP': 'Prototaip', 'Tamat latihan': 'Prototaip' });
  KPIS.forEach(function (kpi) {
    if (!kpi.sheet || !kpi.renamed) return;
    var sh = ss.getSheetByName(kpi.sheet);
    if (!sh || sh.getLastColumn() < 1 || sh.getLastRow() < 2) return;
    var hdr = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String), n = sh.getLastRow() - 1;
    for (var old in kpi.renamed) {
      if (!kpi.renamed.hasOwnProperty(old)) continue;
      var oi = hdr.indexOf(old), ni = hdr.indexOf(kpi.renamed[old]);
      if (oi < 0 || ni < 0 || oi === ni) continue;
      var ov = sh.getRange(2, oi + 1, n, 1).getValues(), nv = sh.getRange(2, ni + 1, n, 1).getValues(), copied = 0;
      for (var r = 0; r < n; r++) {
        if ((nv[r][0] === '' || nv[r][0] === null) && ov[r][0] !== '' && ov[r][0] !== null) { nv[r][0] = ov[r][0]; copied++; }
      }
      if (copied) { sh.getRange(2, ni + 1, n, 1).setValues(nv); audit_(null, 'LAJUR_DISALIN', kpi.id, '', old + ' -> ' + kpi.renamed[old] + ' (' + copied + ' sel)'); }
    }
  });
}

/** CKAI 7: isi Tahun dan Bulan (nama) daripada lajur lama bulan_pendapatan / tempoh (YYYY-MM) bagi baris yang Tahun/Bulan masih kosong. */
function migrateCkai7Month_(ss) {
  var kpi = getKpi_('CKAI7'), sh = ss.getSheetByName(kpi.sheet);
  if (!sh || sh.getLastColumn() < 1 || sh.getLastRow() < 2) return;
  var hdr = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String), n = sh.getLastRow() - 1;
  var ti = hdr.indexOf('Tahun'), bi = hdr.indexOf('Bulan');
  var src = hdr.indexOf('bulan_pendapatan') >= 0 ? hdr.indexOf('bulan_pendapatan') : hdr.indexOf('tempoh');
  if (ti < 0 || bi < 0 || src < 0) return;
  var sv = sh.getRange(2, src + 1, n, 1).getValues(), tv = sh.getRange(2, ti + 1, n, 1).getValues(), bv = sh.getRange(2, bi + 1, n, 1).getValues(), changed = 0;
  for (var r = 0; r < n; r++) {
    if ((tv[r][0] !== '' && tv[r][0] !== null) || (bv[r][0] !== '' && bv[r][0] !== null)) continue;
    var v = sv[r][0], iso = normalizeCell_(v, 'month'), mm = /^(\d{4})-(\d{2})$/.exec(String(iso));
    if (!mm) continue;
    tv[r][0] = parseInt(mm[1], 10); bv[r][0] = BULAN_MS[parseInt(mm[2], 10) - 1]; changed++;
  }
  if (changed) {
    sh.getRange(2, ti + 1, n, 1).setValues(tv); sh.getRange(2, bi + 1, n, 1).setValues(bv);
    audit_(null, 'LAJUR_DISALIN', 'CKAI7', '', 'bulan -> Tahun + Bulan (' + changed + ' baris)');
  }
}

/** Tukar nilai lama dalam satu lajur kepada nilai baharu (peta {lama: baharu}). Nilai lain tidak disentuh. */
function migrateValues_(ss, kpiId, col, map) {
  var sh = ss.getSheetByName(getKpi_(kpiId).sheet);
  if (!sh || sh.getLastColumn() < 1 || sh.getLastRow() < 2) return;
  var hdr = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String), ci = hdr.indexOf(col), n = sh.getLastRow() - 1;
  if (ci < 0) return;
  var vals = sh.getRange(2, ci + 1, n, 1).getValues(), changed = 0;
  for (var r = 0; r < n; r++) { var v = String(vals[r][0]).trim(); if (map.hasOwnProperty(v)) { vals[r][0] = map[v]; changed++; } }
  if (changed) { sh.getRange(2, ci + 1, n, 1).setValues(vals); audit_(null, 'NILAI_DITUKAR', kpiId, '', col + ': ' + changed + ' baris'); }
}
