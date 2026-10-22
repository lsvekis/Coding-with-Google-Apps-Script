/** Operasi rekod KPI: senarai, simpan (tambah/kemas kini), padam. Semua semakan akses dibuat di sini (pelayan). */

function kpiSchema_(kpi) {
  return {
    id: kpi.id, title: kpi.title, short: kpi.short, group: kpi.group, level: kpi.level, teras: kpi.teras || null, student: kpi.student ? { matrik: kpi.student.matrik, nama: kpi.student.map.nama_pelajar } : null, fungsi: kpi.fungsi || null, unit: kpi.unit, entry: kpi.entry,
    listColumns: kpi.listColumns, statusField: kpi.statusField, filter2: kpi.filter2 || null, facultyWhitelist: kpi.facultyWhitelist || null,
    fields: kpi.fields
  };
}

function sessionInfo_(token) {
  var user = requireUser_(token);
  return {
    user: publicUser_(user),
    faculties: listFaculties_(),
    bangsa: BANGSA_OPTIONS,
    bidang_pengajian: BIDANG_PENGAJIAN,
    levels: LEVELS,
    teras: TERAS,
    functions: FUNCTIONS,
    kpis: accessibleKpis_(user).map(kpiSchema_)
  };
}

function stripRow_(r) {
  var o = {};
  for (var k in r) { if (r.hasOwnProperty(k) && k !== '_row' && !/_pautan$/.test(k)) o[k] = r[k]; }
  return o;
}

function listRecords_(token, kpiId, filters) {
  var user = requireUser_(token);
  var kpi = getKpi_(String(kpiId));
  if (!canAccessKpi_(user, kpi)) throw userError_('Akses ditolak bagi KPI ini.');
  filters = filters || {};
  var rows = readTable_(kpi.sheet, typesFor_(kpi)).rows;

  if (user.peranan !== ROLES.ADMIN && kpi.entry === 'faculty') {
    rows = rows.filter(function (r) { return r.fakulti === user.fakulti; });
  }
  if (filters.fakulti && kpi.entry === 'faculty') rows = rows.filter(function (r) { return r.fakulti === String(filters.fakulti); });
  if (filters.status && kpi.statusField) rows = rows.filter(function (r) { return r[kpi.statusField] === String(filters.status); });
  if (filters.status2 && kpi.filter2) rows = rows.filter(function (r) { return r[kpi.filter2] === String(filters.status2); });
  if (filters.q) {
    var q = String(filters.q).toLowerCase();
    rows = rows.filter(function (r) {
      for (var k in r) { if (k !== '_row' && !/_pautan$/.test(k) && String(r[k]).toLowerCase().indexOf(q) >= 0) return true; }
      return false;
    });
  }
  rows.sort(function (a, b) { return String(b.dikemas_kini_pada).localeCompare(String(a.dikemas_kini_pada)); });
  return { rows: rows.map(stripRow_), canEdit: true, canDelete: user.peranan === ROLES.ADMIN };
}

// ---------------------------------------------------------------------------
// Data asas pelajar (tab PELAJAR)
// ---------------------------------------------------------------------------
var STUDENT_MEMO_ = null;

function normMatrik_(v) { return String(v === null || v === undefined ? '' : v).replace(/^'/, '').replace(/\s+/g, '').toUpperCase(); }
function normKp_(v) {
  var kp = String(v === null || v === undefined ? '' : v).replace(/^'/, '').replace(/\s+/g, '').toUpperCase();
  if (/^\d{6}-?\d{2}-?\d{4}$/.test(kp)) kp = kp.replace(/-/g, '');
  return kp;
}
function validKp_(kp) { return /^[A-Z0-9-]{6,20}$/.test(kp); }
function validPhone_(t) { return /^[0-9+\-\s()]{7,20}$/.test(String(t)); }

/** Baca tab PELAJAR sekali bagi setiap panggilan. Nama lajur tidak peka huruf besar/kecil. */
function studentIndex_() {
  if (STUDENT_MEMO_) return STUDENT_MEMO_;
  if (!getSS_().getSheetByName(SHEETS.STUDENTS)) throw userError_('Tab "' + SHEETS.STUDENTS + '" tiada. Pentadbir perlu menjalankan fungsi setup().');
  var t = readTable_(SHEETS.STUDENTS), idx = {};
  t.rows.forEach(function (r) {
    var o = { _row: r._row };
    for (var k in r) { if (k !== '_row' && r.hasOwnProperty(k)) o[String(k).trim().toLowerCase()] = String(r[k] === null || r[k] === undefined ? '' : r[k]).replace(/^'/, '').trim(); }
    var key = normMatrik_(o.no_matrik);
    if (key && !idx[key]) idx[key] = o;
  });
  STUDENT_MEMO_ = idx;
  return idx;
}

/** Medan pelajar yang masih kosong / tidak sah (need = tambahan wajib bagi KPI, contoh emel dan telefon). */
function studentGaps_(s, need) {
  var gaps = [], codes = listFaculties_().map(function (f) { return f.kod; });
  if (!s) return ['nama_pelajar', 'no_kp', 'fakulti'];
  if (!s.nama_pelajar) gaps.push('nama_pelajar');
  if (!validKp_(normKp_(s.no_kp))) gaps.push('no_kp');
  if (codes.indexOf(s.fakulti) < 0) gaps.push('fakulti');
  (need || []).forEach(function (k) {
    if (k === 'emel' && !isEmail_(String(s.emel || '').toLowerCase())) gaps.push('emel');
    if (k === 'telefon' && !validPhone_(s.telefon || '')) gaps.push('telefon');
  });
  return gaps;
}
function studentNeeds_(kpi) {
  var need = [];
  if (!kpi.student) return need;
  kpi.fields.forEach(function (f) {
    if (f.derivedRequired && (f.key === 'emel' || f.key === 'telefon')) need.push(f.key);
  });
  return need;
}

/** Ringkasan awam bagi klien: tiada no. KP, e-mel atau telefon kepada pengguna bukan Admin. */
function studentView_(user, matrik, s, need) {
  var gaps = studentGaps_(s, need);
  var out = { no_matrik: matrik, found: !!s, complete: !!s && !gaps.length, gaps: gaps, nama_pelajar: s ? s.nama_pelajar : '', fakulti: s ? s.fakulti : '', jantina: s ? s.jantina || '' : '', bangsa: s ? s.bangsa || '' : '', bidang_pengajian: s ? s.bidang_pengajian || '' : '' };
  if (s && user.peranan === ROLES.ADMIN) { out.no_kp = s.no_kp; out.emel = s.emel; out.telefon = s.telefon; }
  else if (s && s.no_kp) out.kp_mask = '••••••••' + normKp_(s.no_kp).slice(-4);   // bukan Admin: no. KP disamarkan
  return out;
}

/** Semak status beberapa no. matrik (untuk borang). */
function lookupStudents_(token, kpiId, list) {
  var user = requireUser_(token);
  var kpi = kpiId ? getKpi_(String(kpiId)) : null;
  if (kpi && !canAccessKpi_(user, kpi)) throw userError_('Akses ditolak bagi KPI ini.');
  if (!Array.isArray(list) || list.length > 50) throw userError_('Senarai no. matrik tidak sah.');
  var idx = studentIndex_(), need = kpi ? studentNeeds_(kpi) : [];
  return list.map(function (m) { var key = normMatrik_(m); return studentView_(user, key, idx[key] || null, need); });
}

/**
 * Sebelum simpan: gantikan nama, no. KP, e-mel, telefon (dan fakulti bagi KPI Admin) dengan data tab PELAJAR berdasarkan no. matrik.
 * Jika pelajar tiada atau maklumat tidak lengkap, lontar ralat dengan `missing` supaya klien membuka tetingkap melengkapkan data.
 */
function applyStudents_(user, kpi, input) {
  var need = studentNeeds_(kpi), refs = [], seen = {};
  function ref(m) { var k = normMatrik_(m); if (k && !seen[k]) { seen[k] = 1; refs.push(k); } return k; }
  var single = kpi.student ? ref(input[kpi.student.matrik]) : '';
  var peopleFields = kpi.fields.filter(function (f) { return f.type === 'people'; });
  var lists = {};
  peopleFields.forEach(function (f) {
    var v = input[f.key], arr = Array.isArray(v) ? v : parseJson_(String(v || ''), []);
    lists[f.key] = Array.isArray(arr) ? arr : [];
    lists[f.key].forEach(function (p) { ref(p && p.matrik); });
  });
  if (!refs.length) return;
  var idx = studentIndex_(), missing = [];
  refs.forEach(function (m) {
    var s = idx[m] || null;
    if (!s || studentGaps_(s, m === single ? need : []).length) missing.push(studentView_(user, m, s, m === single ? need : []));
  });
  if (missing.length) {
    throw userError_('Maklumat pelajar belum lengkap dalam sheet PELAJAR: ' + missing.map(function (x) { return x.no_matrik; }).join(', ') + '.', { missing: missing });
  }
  if (single) {
    var s1 = idx[single];
    // KPI fakulti yang mengambil fakulti daripada PELAJAR (contoh CKAI 1): PIC hanya boleh merekod pelajar fakultinya sendiri.
    if (kpi.entry === 'faculty' && kpi.student.map.fakulti === 'fakulti' && user.peranan !== ROLES.ADMIN && s1.fakulti !== user.fakulti) {
      var ef = {}; ef[kpi.student.matrik] = 'Pelajar ini bukan daripada fakulti anda (' + user.fakulti + ').';
      throw userError_('Sila betulkan medan yang bertanda.', { fields: ef });
    }
    input[kpi.student.matrik] = s1.no_matrik;
    for (var col in kpi.student.map) {
      if (!kpi.student.map.hasOwnProperty(col)) continue;
      input[kpi.student.map[col]] = col === 'no_kp' ? normKp_(s1.no_kp) : s1[col];
    }
  }
  peopleFields.forEach(function (f) {
    input[f.key] = lists[f.key].filter(function (p) { return p && normMatrik_(p.matrik); }).map(function (p) {
      var s2 = idx[normMatrik_(p.matrik)];
      return { nama: s2.nama_pelajar, matrik: s2.no_matrik, nokp: normKp_(s2.no_kp), fakulti: s2.fakulti };
    });
  });
}

/**
 * Simpan / lengkapkan maklumat pelajar dalam tab PELAJAR. Admin boleh mengubah semua medan; pengguna lain hanya
 * mengisi medan yang kosong atau tidak sah (data sah sedia ada tidak diubah).
 */
function saveStudents_(token, list) {
  return saveStudentsAs_(requireUser_(token), list, false);
}
function saveStudentsAs_(user, list, silent) {
  if (!Array.isArray(list) || !list.length || list.length > 50) throw userError_('Senarai pelajar tidak sah.');
  var faculties = listFaculties_().map(function (f) { return f.kod; });
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    STUDENT_MEMO_ = null;
    var idx = studentIndex_(), sh = getSheet_(SHEETS.STUDENTS), isAdmin = user.peranan === ROLES.ADMIN, results = [], hdrCache = null;
    list.forEach(function (raw) {
      var errs = {}, matrik = normMatrik_(raw && raw.no_matrik), cur = idx[matrik] || null;
      if (!matrik || matrik.length > 30) errs.no_matrik = 'No. matrik tidak sah.';
      var nama = sanitizeText_(String(raw && raw.nama_pelajar || '').trim().slice(0, 120));
      var kp = normKp_(raw && raw.no_kp);
      var emel = String(raw && raw.emel || '').trim().toLowerCase();
      var tel = String(raw && raw.telefon || '').trim();
      var fak = String(raw && raw.fakulti || '').trim();
      var jan = String(raw && raw.jantina || '').trim(), bgs = String(raw && raw.bangsa || '').trim().slice(0, 40), bdg = String(raw && raw.bidang_pengajian || '').trim();
      var keepOk = function (curVal, validNow) { return !isAdmin && cur && curVal && validNow; };
      var out = {
        nama_pelajar: keepOk(cur && cur.nama_pelajar, true) ? cur.nama_pelajar : nama,
        no_kp: keepOk(cur && cur.no_kp, cur && validKp_(normKp_(cur.no_kp))) ? normKp_(cur.no_kp) : kp,
        emel: keepOk(cur && cur.emel, cur && isEmail_(String(cur.emel).toLowerCase())) ? cur.emel : emel,
        telefon: keepOk(cur && cur.telefon, cur && validPhone_(cur.telefon)) ? cur.telefon : tel,
        fakulti: keepOk(cur && cur.fakulti, cur && faculties.indexOf(cur.fakulti) >= 0) ? cur.fakulti : fak,
        jantina: keepOk(cur && cur.jantina, true) ? cur.jantina : jan,
        bangsa: keepOk(cur && cur.bangsa, true) ? cur.bangsa : bgs,
        bidang_pengajian: keepOk(cur && cur.bidang_pengajian, true) ? cur.bidang_pengajian : bdg
      };
      if (!out.nama_pelajar) errs.nama_pelajar = 'Nama wajib diisi.';
      if (!validKp_(out.no_kp)) errs.no_kp = 'No. KP / pasport tidak sah.';
      if (faculties.indexOf(out.fakulti) < 0) errs.fakulti = 'Pilih fakulti.';
      if (out.jantina && ['Lelaki', 'Perempuan'].indexOf(out.jantina) < 0) errs.jantina = 'Pilih Lelaki atau Perempuan.';
      if (out.bidang_pengajian && BIDANG_PENGAJIAN.indexOf(out.bidang_pengajian) < 0 && (isAdmin || !cur || cur.bidang_pengajian !== out.bidang_pengajian)) errs.bidang_pengajian = 'Pilih bidang pengajian daripada senarai.';
      if (out.emel && !isEmail_(out.emel)) errs.emel = 'E-mel tidak sah.';
      if (out.telefon && !validPhone_(out.telefon)) errs.telefon = 'Nombor telefon tidak sah.';
      if (Object.keys(errs).length) { results.push({ no_matrik: matrik, ok: false, fields: errs }); return; }
      var obj = { no_matrik: cur ? cur.no_matrik : matrik, no_kp: out.no_kp, nama_pelajar: out.nama_pelajar, emel: out.emel, telefon: out.telefon, fakulti: out.fakulti, jantina: out.jantina, bangsa: out.bangsa, bidang_pengajian: out.bidang_pengajian, dikemas_kini_pada: nowIso_(), dikemas_kini_oleh: user.emel };
      var headers = hdrCache || (hdrCache = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String));
      // padankan nama lajur tanpa mengira huruf besar/kecil
      var o2 = {};
      headers.forEach(function (h) { var lk = h.trim().toLowerCase(); if (obj.hasOwnProperty(lk)) o2[h] = obj[lk]; });
      writeRow_(sh, cur ? cur._row : null, o2);
      if (!silent) audit_(user, cur ? 'PELAJAR_KEMAS_KINI' : 'PELAJAR_TAMBAH', '', '', 'no_matrik=' + obj.no_matrik);
      idx[matrik] = { _row: cur ? cur._row : -1, no_matrik: obj.no_matrik, no_kp: out.no_kp, nama_pelajar: out.nama_pelajar, emel: out.emel, telefon: out.telefon, fakulti: out.fakulti, jantina: out.jantina, bangsa: out.bangsa, bidang_pengajian: out.bidang_pengajian };
      results.push({ no_matrik: matrik, ok: true });
    });
    STUDENT_MEMO_ = null;
    return { results: results };
  } finally {
    lock.releaseLock();
  }
}

function validateRecord_(kpi, rec, faculties, user, existing, rows, opts) {
  var errors = {}, clean = {};
  var facCodes = faculties.map(function (f) { return f.kod; });

  kpi.fields.forEach(function (f) {
    var raw = rec[f.key];
    var v = raw === null || raw === undefined ? '' : (typeof raw === 'string' ? raw.trim() : raw);
    if (Array.isArray(v) && !v.length) v = '';
    if (v && typeof v === 'object' && !Array.isArray(v) && f.type === 'file' && !v.id) v = '';
    if (v === '') {
      if (f.required) errors[f.key] = 'Medan ini wajib diisi.';
      clean[f.key] = '';
      return;
    }
    switch (f.type) {
      case 'number':
        var n = Number(v);
        if (!isFinite(n)) { errors[f.key] = 'Mesti nombor.'; break; }
        if (f.min !== undefined && n < f.min) { errors[f.key] = 'Nilai minimum ialah ' + f.min + '.'; break; }
        if (f.max !== undefined && n > f.max) { errors[f.key] = 'Nilai maksimum ialah ' + f.max + '.'; break; }
        clean[f.key] = n;
        break;
      case 'date':
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(new Date(v + 'T00:00:00Z').getTime()) ||
            new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) !== v) { errors[f.key] = 'Tarikh tidak sah (YYYY-MM-DD).'; break; }
        clean[f.key] = v;
        break;
      case 'month':
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(v))) { errors[f.key] = 'Bulan tidak sah (YYYY-MM).'; break; }
        clean[f.key] = String(v);
        break;
      case 'time':
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v))) { errors[f.key] = 'Masa tidak sah (HH:MM).'; break; }
        clean[f.key] = String(v);
        break;
      case 'people':
        var list = Array.isArray(v) ? v : parseJson_(String(v), null);
        var noun = f.noun || 'pelajar', maxN = f.max || 30;
        if (!Array.isArray(list) || !list.length) { errors[f.key] = 'Tambah sekurang-kurangnya seorang ' + noun + '.'; break; }
        if (list.length > maxN) { errors[f.key] = 'Maksimum ' + maxN + ' ' + noun + ' bagi satu rekod.'; break; }
        var people = [], bad = [];
        list.forEach(function (p, i) {
          var nama = String(p && p.nama || '').trim(), matrik = String(p && p.matrik || '').trim(), kp = String(p && p.nokp || '').replace(/\s+/g, '').toUpperCase();
          if (/^\d{6}-?\d{2}-?\d{4}$/.test(kp)) kp = kp.replace(/-/g, ''); // No. KP 12 digit disimpan tanpa sengkang
          var miss = [];
          if (!nama || nama.length > 120) miss.push('nama');
          if (!matrik || matrik.length > 30) miss.push('no. matrik');
          if (f.kp === false) kp = ''; // medan no. KP tidak digunakan bagi KPI ini
          else if (!/^[A-Z0-9-]{6,20}$/.test(kp)) miss.push('no. KP / pasport');
          if (miss.length) bad.push(noun.charAt(0).toUpperCase() + noun.slice(1) + ' ' + (i + 1) + ': ' + miss.join(', ') + ' tidak sah'); else people.push({ nama: nama, matrik: matrik, nokp: kp, fakulti: facCodes.indexOf(String(p && p.fakulti || '')) >= 0 ? String(p.fakulti) : '' });
        });
        if (bad.length) { errors[f.key] = bad.join('; ') + '.'; break; }
        // format 'numbered': teks "1. NAMA (NO. MATRIK)" setiap baris (contoh nama ahli kumpulan KAI 6); selainnya JSON.
        clean[f.key] = f.format === 'numbered'
          ? people.map(function (p, i) { return (i + 1) + '. ' + String(p.nama).toUpperCase() + ' (' + p.matrik + ')'; }).join('\n')
          : JSON.stringify(people);
        break;
      case 'file':
        var fv = typeof v === 'string' ? parseJson_(v, null) : v;
        if (!fv || typeof fv.id !== 'string' || !/^[A-Za-z0-9_-]{10,100}$/.test(fv.id)) { errors[f.key] = 'Muat naik fail PDF.'; break; }
        if (opts && opts.trustFiles) { clean[f.key] = JSON.stringify({ id: fv.id, name: String(fv.name || 'borang.pdf').slice(0, 100) }); break; }
        var keep = existing ? parseJson_(existing[f.key], {}) : {};
        if (keep && keep.id === fv.id) { clean[f.key] = JSON.stringify({ id: keep.id, name: String(keep.name || 'sijil.pdf').slice(0, 100) }); break; }
        // Fail baharu mesti baru dimuat naik oleh pengguna ini melalui aplikasi (elak merujuk fail Drive sembarangan).
        var up = parseJson_(CacheService.getScriptCache().get('up:' + fv.id), null);
        if (!up || up.e !== user.emel || up.k !== kpi.id) { errors[f.key] = 'Fail tidak sah atau tamat tempoh. Sila muat naik semula.'; break; }
        clean[f.key] = JSON.stringify({ id: fv.id, name: String(up.n || 'sijil.pdf').slice(0, 100) });
        break;
      case 'select':
        if (f.options.indexOf(String(v)) < 0) { errors[f.key] = 'Pilihan tidak sah.'; break; }
        clean[f.key] = String(v);
        break;
      case 'yesno':
        if (YES_NO.indexOf(String(v)) < 0) { errors[f.key] = 'Pilih Ya atau Tidak.'; break; }
        clean[f.key] = String(v);
        break;
      case 'faculty':
        if (facCodes.indexOf(String(v)) < 0 && (f.extra || []).indexOf(String(v)) < 0) { errors[f.key] = 'Fakulti tidak sah.'; break; }
        if (f.key === 'fakulti' && (f.extra || []).indexOf(String(v)) < 0 && !facultyAllowedForKpi_(kpi, String(v))) { errors[f.key] = 'Fakulti ini tidak termasuk dalam KPI ini.'; break; }
        clean[f.key] = String(v);
        break;
      case 'email':
        v = String(v).toLowerCase();
        if (!isEmail_(v)) { errors[f.key] = 'E-mel tidak sah.'; break; }
        clean[f.key] = v;
        break;
      case 'url':
        if (!/^https?:\/\/[^\s]+$/i.test(String(v)) || String(v).length > 500) { errors[f.key] = 'Pautan mesti bermula dengan http:// atau https://.'; break; }
        clean[f.key] = String(v);
        break;
      case 'textarea':
        if (String(v).length > 2000) { errors[f.key] = 'Maksimum 2000 aksara.'; break; }
        clean[f.key] = sanitizeText_(v);
        break;
      default:
        if (String(v).length > 300) { errors[f.key] = 'Maksimum 300 aksara.'; break; }
        clean[f.key] = sanitizeText_(v);
    }
  });

  (kpi.rules || []).forEach(function (rule) {
    if (rule.when.in.indexOf(String(clean[rule.when.field])) >= 0) {
      rule.require.forEach(function (key) {
        if ((clean[key] === '' || clean[key] === undefined) && !errors[key]) {
          errors[key] = 'Wajib diisi apabila ' + labelOf_(kpi, rule.when.field) + ' = ' + clean[rule.when.field] + '.';
        }
      });
    }
  });
  if (kpi.validate) kpi.validate(clean, errors, rows || [], existing || null);
  return { clean: clean, errors: errors };
}

function labelOf_(kpi, key) {
  for (var i = 0; i < kpi.fields.length; i++) { if (kpi.fields[i].key === key) return kpi.fields[i].label; }
  return key;
}

function nextId_(kpi, rows) {
  var max = 0, re = new RegExp('^' + kpi.prefix + '-(\\d+)$');
  rows.forEach(function (r) { var m = re.exec(String(r.id)); if (m) max = Math.max(max, parseInt(m[1], 10)); });
  return kpi.prefix + '-' + ('000' + (max + 1)).slice(-3);
}

function saveRecord_(token, kpiId, rec) {
  var user = requireUser_(token);
  var kpi = getKpi_(String(kpiId));
  if (!canAccessKpi_(user, kpi)) throw userError_('Akses ditolak bagi KPI ini.');
  return saveRecordAs_(user, kpi, rec, null);
}

/** Simpan rekod bagi pengguna yang sudah disahkan. opts.trustFiles = lampiran {id,name} daripada sumber dipercayai (import) diterima tanpa semakan muat naik. */
function saveRecordAs_(user, kpi, rec, opts) {
  if (!rec || typeof rec !== 'object') throw userError_('Data tidak sah.');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var isPic = user.peranan !== ROLES.ADMIN;
    var input = {};
    for (var k in rec) { if (rec.hasOwnProperty(k)) input[k] = rec[k]; }
    // PIC hanya boleh merekod bagi fakulti sendiri.
    if (isPic && kpi.entry === 'faculty') input.fakulti = user.fakulti;

    // opts.ctx = jadual dibaca sekali dan dikongsi antara banyak rekod (segerak / import); opts.silent = pemanggil merekod audit dan membatalkan cache sekali sahaja
    var ctx = opts && opts.ctx, table, sh;
    if (ctx && ctx.table) { table = ctx.table; sh = ctx.sh; }
    else {
      table = readTable_(kpi.sheet, typesFor_(kpi));
      var missingCols = kpiColumns_(kpi).filter(function (c) { return table.headers.indexOf(c) < 0; });
      if (missingCols.length) throw userError_('Skema Sheet belum dikemas kini. Pentadbir perlu menjalankan setup() semula.');
      sh = getSheet_(kpi.sheet);
      if (ctx) { ctx.table = table; ctx.sh = sh; }
    }
    var now = nowIso_();
    var id = String(rec.id || '');
    var existing = null;
    if (id) {
      table.rows.forEach(function (r) { if (r.id === id) existing = r; });
      if (!existing) throw userError_('Rekod tidak dijumpai.');
      if (isPic && kpi.entry === 'faculty' && existing.fakulti !== user.fakulti) throw userError_('Akses ditolak: rekod ini milik fakulti lain.');
    }

    applyStudents_(user, kpi, input);
    var v = validateRecord_(kpi, input, listFaculties_(), user, existing, table.rows, opts);
    if (Object.keys(v.errors).length) throw userError_('Sila betulkan medan yang bertanda.', { fields: v.errors });

    // Medan unik (contoh: satu profil bagi setiap no. matrik).
    (kpi.unique || []).forEach(function (key) {
      var val = String(v.clean[key] === undefined ? '' : v.clean[key]).replace(/^'/, '').toLowerCase();
      if (!val) return;
      var dup = table.rows.filter(function (r) { return r.id !== id && String(r[key]).replace(/^'/, '').toLowerCase() === val; })[0];
      if (dup) {
        var dupFields = {};
        // ID rekod hanya didedahkan kepada Admin atau PIC fakulti yang sama (elak mendedahkan rekod fakulti lain).
        var sameScope = !isPic || dup.fakulti === undefined || dup.fakulti === user.fakulti;
        var dupFd = kpi.fields.filter(function (f) { return f.key === key; })[0];
        dupFields[(dupFd && dupFd.errorOn) || key] = 'Sudah didaftarkan' + (sameScope ? ' (' + dup.id + ')' : '') + '.';
        throw userError_('Sila betulkan medan yang bertanda.', { fields: dupFields });
      }
    });

    var obj, action, summary;
    if (existing) {
      var changed = [];
      kpi.fields.forEach(function (f) { if (String(existing[f.key]) !== String(v.clean[f.key])) changed.push(f.key); });
      obj = { id: id, dicipta_pada: existing.dicipta_pada, dicipta_oleh: existing.dicipta_oleh, dikemas_kini_pada: now, dikemas_kini_oleh: user.emel };
      for (var a in v.clean) { if (v.clean.hasOwnProperty(a)) obj[a] = v.clean[a]; }
      setFileLinks_(kpi, v.clean, obj);
      writeRow_(sh, existing._row, obj);
      // Fail lampiran yang diganti dibuang ke tong sampah Drive.
      kpi.fields.forEach(function (f) {
        if (f.type !== 'file') return;
        var oldId = (parseJson_(existing[f.key], {}) || {}).id, newId = (parseJson_(v.clean[f.key], {}) || {}).id;
        if (oldId && oldId !== newId) trashFile_(oldId);
      });
      action = 'KEMAS_KINI'; summary = 'Medan diubah: ' + (changed.join(', ') || '(tiada)');
    } else {
      id = nextId_(kpi, table.rows);
      obj = { id: id, dicipta_pada: now, dicipta_oleh: user.emel, dikemas_kini_pada: now, dikemas_kini_oleh: user.emel };
      for (var b in v.clean) { if (v.clean.hasOwnProperty(b)) obj[b] = v.clean[b]; }
      setFileLinks_(kpi, v.clean, obj);
      writeRow_(sh, null, obj);
      if (ctx) { var cp = {}; for (var ck in obj) { if (obj.hasOwnProperty(ck)) cp[ck] = obj[ck]; } table.rows.push(cp); }
      action = 'TAMBAH'; summary = 'Rekod baharu' + (kpi.entry === 'faculty' ? ' (' + obj.fakulti + ')' : '');
    }
    if (!(opts && opts.silent)) { audit_(user, action, kpi.id, id, summary); clearDashCache_(); }
    return stripRow_(obj);
  } finally {
    lock.releaseLock();
  }
}


/**
 * Muat naik pukal (CSV): setiap baris melalui pengesahan dan pemeriksaan unik yang sama seperti borang tunggal (saveRecord_).
 * Baris yang gagal dilaporkan dengan nombor baris; baris yang sah disimpan. Rekod sedia ada tidak boleh diubah melalui pukal.
 */
var BULK_MAX_PER_CALL = 40;
function bulkSave_(token, kpiId, rows) {
  var user = requireUser_(token);
  var kpi = getKpi_(String(kpiId));
  if (!canAccessKpi_(user, kpi)) throw userError_('Akses ditolak bagi KPI ini.');
  if (!Array.isArray(rows) || !rows.length) throw userError_('Tiada baris untuk dimuat naik.');
  if (rows.length > BULK_MAX_PER_CALL) throw userError_('Terlalu banyak baris dalam satu panggilan (maksimum ' + BULK_MAX_PER_CALL + ').');
  var out = [], okCount = 0;
  rows.forEach(function (item) {
    var n = item && item.n, rec = {};
    try {
      var src = (item && item.rec) || {};
      kpi.fields.forEach(function (f) {
        if (f.type === 'file' || f.hidden) return;   // lampiran dimuat naik melalui Edit rekod
        if (src[f.key] !== undefined) rec[f.key] = src[f.key];
      });
      var saved = saveRecord_(token, kpi.id, rec);
      okCount++;
      out.push({ n: n, ok: true, id: saved.id });
    } catch (e) {
      if (!(e && e.user)) throw e;
      if (e.auth) throw e;
      out.push({ n: n, ok: false, error: e.message, fields: e.fields || null, missing: e.missing ? e.missing.map(function (m) { return m.no_matrik; }) : null });
    }
  });
  audit_(user, 'MUAT_NAIK_PUKAL', kpi.id, '', okCount + ' berjaya, ' + (rows.length - okCount) + ' gagal');
  return { results: out, saved: okCount };
}

/** Ringkasan rekod untuk log audit: tiada nama pelajar, no. KP atau lampiran. */
function auditSummary_(kpi, row) {
  var parts = [];
  kpi.listColumns.forEach(function (c) {
    var f = kpi.fields.filter(function (x) { return x.key === c; })[0];
    if (c === 'id' || (f && (f.type === 'people' || f.type === 'file'))) return;
    if (row[c] !== '' && row[c] !== undefined) parts.push(c + '=' + row[c]);
  });
  return parts.join(', ').slice(0, 300);
}

function deleteRecord_(token, kpiId, id) {
  var user = requireAdmin_(token);
  var kpi = getKpi_(String(kpiId));
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var table = readTable_(kpi.sheet, typesFor_(kpi));
    var existing = null;
    table.rows.forEach(function (r) { if (r.id === String(id)) existing = r; });
    if (!existing) throw userError_('Rekod tidak dijumpai.');
    getSheet_(kpi.sheet).deleteRow(existing._row);
    kpi.fields.forEach(function (f) { if (f.type === 'file') trashFile_((parseJson_(existing[f.key], {}) || {}).id); });
    audit_(user, 'PADAM', kpi.id, existing.id, 'Rekod dipadam: ' + auditSummary_(kpi, existing));
    clearDashCache_();
    return true;
  } finally {
    lock.releaseLock();
  }
}
