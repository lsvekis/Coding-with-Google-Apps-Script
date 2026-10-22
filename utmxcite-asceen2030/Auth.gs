/**
 * Pengesahan: log masuk e-mel + OTP, sesi berasaskan token, semakan peranan.
 * OTP dan sesi disimpan dalam CacheService (dalam bentuk hash); token tidak pernah disimpan dalam teks biasa.
 */

function normRole_(v) {
  var r = String(v === null || v === undefined ? '' : v).trim().toLowerCase();
  return r === 'admin' ? ROLES.ADMIN : r === 'pic' ? ROLES.PIC : '';
}

/**
 * Tab Pengguna boleh disunting terus dalam Sheet, jadi nilai dinormalkan (huruf besar/kecil, ruang kosong).
 * Peranan selain Admin/PIC dianggap tidak sah: pengguna tidak aktif dan tiada akses (tidak jatuh ke PIC secara lalai).
 */
function parseUser_(row) {
  var akses = String(row.kpi_akses || '').split(/[,;\s]+/).map(function (s) { return s.trim().toUpperCase(); }).filter(String);
  var role = normRole_(row.peranan);
  return {
    emel: normEmail_(row.emel),
    nama: String(row.nama || ''),
    peranan: role,
    fakulti: String(row.fakulti || '').trim(),
    kpiAkses: akses,
    aktif: /^ya$/i.test(String(row.aktif || '').trim()) && role !== '',
    _row: row._row
  };
}

function findUser_(email) {
  email = normEmail_(email);
  if (!email) return null;
  var rows = readTable_(SHEETS.USERS).rows;
  for (var i = 0; i < rows.length; i++) {
    if (normEmail_(rows[i].emel) === email) return parseUser_(rows[i]);
  }
  return null;
}

function publicUser_(u) {
  return { emel: u.emel, nama: u.nama, peranan: u.peranan, fakulti: u.fakulti, kpiAkses: u.kpiAkses };
}

function otpHash_(email, code) {
  return sha256Hex_(getSalt_() + '|' + email + '|' + code);
}

function requestOtp_(emailIn) {
  var email = normEmail_(emailIn);
  if (!isEmail_(email)) throw userError_('Alamat e-mel tidak sah.');

  var cache = CacheService.getScriptCache();
  var reqKey = 'otpreq:' + sha256Hex_(email);
  var count = parseInt(cache.get(reqKey) || '0', 10);
  if (count >= APP.OTP_MAX_REQUESTS) {
    throw userError_('Terlalu banyak permintaan OTP. Cuba lagi dalam satu jam.');
  }
  cache.put(reqKey, String(count + 1), 3600);

  var user = findUser_(email);
  if (user && user.aktif && emailDomainAllowed_(email)) {
    var code = randomDigits_(6);
    cache.put('otp:' + sha256Hex_(email), JSON.stringify({ h: otpHash_(email, code), a: 0 }), APP.OTP_TTL);
    try {
      MailApp.sendEmail({
        to: email,
        subject: '[' + APP.NAME + '] Kod OTP log masuk anda',
        name: APP.NAME,
        body: 'Salam ' + (user.nama || '') + ',\n\nKod OTP anda ialah: ' + code + '\n\n' +
          'Kod ini sah selama ' + Math.round(APP.OTP_TTL / 60) + ' minit dan hanya boleh digunakan sekali. ' +
          'Jika anda tidak membuat permintaan ini, abaikan e-mel ini.\n\n' + APP.NAME
      });
    } catch (e) {
      console.error('Gagal hantar e-mel OTP: ' + (e && e.message));
      throw userError_('E-mel OTP tidak dapat dihantar. Pentadbir: jalankan setup() dan luluskan kebenaran hantar e-mel (script.send_mail), atau semak kuota e-mel harian.');
    }
    audit_(user, 'OTP_DIMINTA', '', '', '');
  }
  // Mesej sama tanpa mengira sama ada e-mel berdaftar (elak penghitungan akaun).
  return { message: 'Jika e-mel itu berdaftar, kod OTP telah dihantar. Semak peti masuk anda.', ttl: APP.OTP_TTL };
}

function verifyOtp_(emailIn, codeIn) {
  var email = normEmail_(emailIn);
  var code = String(codeIn === null || codeIn === undefined ? '' : codeIn).replace(/\s+/g, '');
  var cache = CacheService.getScriptCache();
  var key = 'otp:' + sha256Hex_(email);
  var raw = cache.get(key);
  var bad = 'Kod OTP tidak sah atau telah tamat tempoh.';
  if (!raw || !/^\d{6}$/.test(code)) throw userError_(bad);
  var st = JSON.parse(raw);
  if (st.a >= APP.OTP_MAX_ATTEMPTS) { cache.remove(key); throw userError_('Terlalu banyak percubaan. Sila minta kod OTP baharu.'); }
  if (st.h !== otpHash_(email, code)) {
    st.a += 1;
    if (st.a >= APP.OTP_MAX_ATTEMPTS) cache.remove(key); else cache.put(key, JSON.stringify(st), APP.OTP_TTL);
    throw userError_(bad);
  }
  cache.remove(key);
  var user = findUser_(email);
  if (!user || !user.aktif) throw userError_(bad);

  var token = randomHex_(48), hash = sha256Hex_(token);
  persistSession_(email, hash);                       // kekal sehingga log keluar (tiada OTP baharu diperlukan)
  cache.put('sess:' + hash, email, APP.SESSION_TTL);
  audit_(user, 'LOG_MASUK', '', '', '');
  return { token: token, user: publicUser_(user) };
}

// ---------------------------------------------------------------------------
// Sesi berterusan: token kekal sah sehingga pengguna log keluar (atau akaun dinyahaktifkan / dipadam).
// Cache (6 jam) hanya mempercepat; sumber sebenar ialah tab Sesi.
// ---------------------------------------------------------------------------
function persistSession_(email, hash) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = getSheet_(SHEETS.SESSIONS), lr = sh.getLastRow(), mine = [];
    if (lr >= 2) {
      sh.getRange(2, 1, lr - 1, 3).getValues().forEach(function (r, i) {
        if (String(r[1]).toLowerCase() === email) mine.push({ row: i + 2, hash: String(r[0]), at: String(r[2]) });
      });
    }
    // had peranti: tamatkan sesi tertua supaya bilangan sesi seorang pengguna tidak melebihi had
    var over = mine.length - (APP.SESSION_MAX_PER_USER - 1);
    if (over > 0) {
      mine.sort(function (a, b) { return a.at < b.at ? -1 : a.at > b.at ? 1 : 0; });
      var drop = mine.slice(0, over).sort(function (a, b) { return b.row - a.row; });   // padam dari bawah
      var cache = CacheService.getScriptCache();
      drop.forEach(function (d) { cache.remove('sess:' + d.hash); sh.deleteRow(d.row); });
    }
    writeRow_(sh, null, { token_hash: hash, emel: email, dicipta_pada: nowIso_() });
  } finally {
    lock.releaseLock();
  }
}

function lookupSession_(hash) {
  var sh = null;
  try { sh = getSS_().getSheetByName(SHEETS.SESSIONS); } catch (e) { sh = null; }
  if (!sh) return '';
  var lr = sh.getLastRow();
  if (lr < 2) return '';
  var vals = sh.getRange(2, 1, lr - 1, 2).getValues();
  for (var i = 0; i < vals.length; i++) { if (String(vals[i][0]) === hash) return String(vals[i][1]).toLowerCase(); }
  return '';
}

/** Tamatkan satu sesi (cincang token) atau semua sesi seorang pengguna. */
function revokeSessionsOf_(email, onlyHash) {
  var sh = null;
  try { sh = getSS_().getSheetByName(SHEETS.SESSIONS); } catch (e) { sh = null; }
  if (!sh) return 0;
  var lr = sh.getLastRow(), cache = CacheService.getScriptCache(), drop = [];
  if (lr >= 2) {
    sh.getRange(2, 1, lr - 1, 2).getValues().forEach(function (r, i) {
      var mine = !email || String(r[1]).toLowerCase() === String(email).toLowerCase();
      if (mine && (!onlyHash || String(r[0]) === onlyHash)) drop.push({ row: i + 2, hash: String(r[0]) });
    });
  }
  drop.sort(function (a, b) { return b.row - a.row; }).forEach(function (d) { cache.remove('sess:' + d.hash); sh.deleteRow(d.row); });
  if (onlyHash) CacheService.getScriptCache().remove('sess:' + onlyHash);
  return drop.length;
}

function logout_(token) {
  if (!token) return true;
  var hash = sha256Hex_(String(token)), cache = CacheService.getScriptCache();
  var email = cache.get('sess:' + hash) || lookupSession_(hash);
  revokeSessionsOf_(email || '', hash);
  cache.remove('sess:' + hash);
  if (email) audit_({ emel: email }, 'LOG_KELUAR', '', '', '');
  return true;
}

/** Log keluar daripada semua peranti / pelayar pengguna ini. */
function logoutAll_(token) {
  var user = requireUser_(token);
  var n = revokeSessionsOf_(user.emel);
  audit_(user, 'LOG_KELUAR_SEMUA', '', '', n + ' sesi ditamatkan');
  return { sessions: n };
}

/** Pulangkan pengguna sah bagi token, atau lontar ralat pengesahan. Peranan dibaca semula daripada Sheet setiap kali. */
function requireUser_(token) {
  if (!token || typeof token !== 'string' || token.length < 32) throw authError_();
  var cache = CacheService.getScriptCache(), hash = sha256Hex_(token);
  var email = cache.get('sess:' + hash);
  if (!email) {
    if (cache.get('nosess:' + hash)) throw authError_();   // token tidak sah dicuba berulang: elak bacaan Sheet berulang
    email = lookupSession_(hash);
    if (!email) { cache.put('nosess:' + hash, '1', 300); throw authError_(); }
    cache.put('sess:' + hash, email, APP.SESSION_TTL);
  }
  var user = findUser_(email);
  if (!user || !user.aktif) throw authError_();
  return user;
}

function requireAdmin_(token) {
  var user = requireUser_(token);
  if (user.peranan !== ROLES.ADMIN) throw userError_('Akses ditolak. Fungsi ini untuk Admin sahaja.');
  return user;
}

function facultyAllowedForKpi_(kpi, fakulti) {
  return !kpi.facultyWhitelist || kpi.facultyWhitelist.indexOf(fakulti) >= 0;
}

function canAccessKpi_(user, kpi) {
  if (kpi.entry === 'auto') return false;   // dikira automatik daripada KPI lain; tiada borang
  if (user.peranan === ROLES.ADMIN) return true;
  return kpi.entry === 'faculty' && user.kpiAkses.indexOf(kpi.id) >= 0 && facultyAllowedForKpi_(kpi, user.fakulti);
}

function accessibleKpis_(user) {
  return KPIS.filter(function (k) { return canAccessKpi_(user, k); });
}
