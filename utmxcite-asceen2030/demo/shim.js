/**
 * Prototaip pra-demo: simulasi API Google Apps Script dalam pelayar supaya KOD SISTEM SEBENAR
 * (Config, Auth, Data, Files, Metrics, Admin dan UI) berjalan tanpa Google. Keadaan disimpan dalam localStorage.
 * Bukan untuk pengeluaran.
 */
(function () {
  'use strict';
  var STATE_KEY = 'utmx_demo_state_v1';
  var TZ_OFFSET_MS = 8 * 3600 * 1000; // Asia/Kuala_Lumpur

  // ---------- SHA-256 segerak (computeDigest dalam GAS adalah segerak)
  var K = new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
  function sha256(bytes) {
    var l = bytes.length, bitLen = l * 8;
    var padded = new Uint8Array(((l + 9 + 63) >> 6) << 6);
    padded.set(bytes); padded[l] = 0x80;
    var dv = new DataView(padded.buffer);
    dv.setUint32(padded.length - 8, Math.floor(bitLen / 4294967296)); dv.setUint32(padded.length - 4, bitLen >>> 0);
    var h = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
    var w = new Uint32Array(64);
    function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
    for (var off = 0; off < padded.length; off += 64) {
      for (var i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
      for (i = 16; i < 64; i++) {
        var s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        var s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (i = 0; i < 64; i++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25), ch = (e & f) ^ (~e & g);
        var t1 = (hh + S1 + ch + K[i] + w[i]) | 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22), maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
      h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
    }
    var out = new Uint8Array(32), odv = new DataView(out.buffer);
    for (i = 0; i < 8; i++) odv.setUint32(i * 4, h[i]);
    return out;
  }
  var enc = new TextEncoder();

  // ---------- Utilities
  var pad = function (n) { return String(n).padStart(2, '0'); };
  window.Utilities = {
    getUuid: function () { return crypto.randomUUID(); },
    DigestAlgorithm: { SHA_256: 'sha256' },
    Charset: { UTF_8: 'utf8' },
    computeDigest: function (alg, s) { return Array.prototype.map.call(sha256(enc.encode(String(s))), function (b) { return b > 127 ? b - 256 : b; }); },
    base64Decode: function (str) { var bin = atob(str), a = new Array(bin.length); for (var i = 0; i < bin.length; i++) { var c = bin.charCodeAt(i); a[i] = c > 127 ? c - 256 : c; } return a; },
    base64Encode: function (bytes) { var s = ''; for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i] & 0xff); return btoa(s); },
    newBlob: function (bytes, mime, name) { return { getBytes: function () { return bytes; }, getName: function () { return name; }, getContentType: function () { return mime; } }; },
    formatDate: function (d, tz, fmt) {
      var k = new Date(d.getTime() + TZ_OFFSET_MS);
      var map = { yyyy: k.getUTCFullYear(), MM: pad(k.getUTCMonth() + 1), dd: pad(k.getUTCDate()), HH: pad(k.getUTCHours()), mm: pad(k.getUTCMinutes()), ss: pad(k.getUTCSeconds()), M: k.getUTCMonth() + 1 };
      return fmt.replace(/'T'/g, 'T').replace(/yyyy|MM|dd|HH|mm|ss|M/g, function (t) { return map[t]; });
    }
  };

  // ---------- Keadaan (disimpan dalam localStorage)
  var spreadsheets = {}, ssCounter = 0, props = {}, cacheStore = {}, drive = { files: {}, folders: {}, n: 0 };
  var persistTimer = null;
  function persistNow() {
    try {
      var state = { v: 1, ssCounter: ssCounter, props: props, cache: cacheStore,
        sheets: Object.keys(spreadsheets).map(function (id) { var s = spreadsheets[id]; return { id: id, name: s.name, sheets: s.sheets.map(function (sh) { return { name: sh.name, data: sh.data, formats: sh.formats }; }) }; }),
        drive: { n: drive.n, folders: drive.folders, files: Object.keys(drive.files).reduce(function (o, id) { var f = drive.files[id]; o[id] = { id: id, name: f.name, b64: f.b64, trashed: f.trashed, folder: f.folder }; return o; }, {}) } };
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (e) { console.warn('Demo: gagal menyimpan keadaan', e); }
  }
  function persist() { clearTimeout(persistTimer); persistTimer = setTimeout(persistNow, 40); }
  window.__demoPersistNow = persistNow;

  // ---------- Spreadsheet dalam memori
  function Range(sh, r, c, nr, nc) { this.sh = sh; this.r = r; this.c = c; this.nr = nr; this.nc = nc; }
  Range.prototype.getValues = function () {
    var out = [];
    for (var i = 0; i < this.nr; i++) { var row = []; for (var j = 0; j < this.nc; j++) { var v = (this.sh.data[this.r - 1 + i] || [])[this.c - 1 + j]; row.push(v === undefined ? '' : v); } out.push(row); }
    return out;
  };
  Range.prototype.setValues = function (vals) { var self = this; vals.forEach(function (row, i) { row.forEach(function (v, j) { self.sh._set(self.r + i, self.c + j, v); }); }); persist(); return this; };
  Range.prototype.setValue = function (v) { this.sh._set(this.r, this.c, v); persist(); return this; };
  Range.prototype.getValue = function () { return this.getValues()[0][0]; };
  ['setNumberFormat', 'setFontWeight', 'setBackground', 'setFontColor', 'setDataValidation'].forEach(function (m) { Range.prototype[m] = function () { return this; }; });
  function Sheet(name) { this.name = name; this.data = []; this.formats = {}; }
  Sheet.prototype._set = function (r, c, v) { while (this.data.length < r) this.data.push([]); var row = this.data[r - 1]; while (row.length < c) row.push(''); row[c - 1] = v; };
  Sheet.prototype.getName = function () { return this.name; };
  Sheet.prototype.getLastRow = function () { var last = 0; this.data.forEach(function (row, i) { if (row.some(function (v) { return v !== '' && v !== undefined; })) last = i + 1; }); return last; };
  Sheet.prototype.getLastColumn = function () { var last = 0; this.data.forEach(function (row) { row.forEach(function (v, j) { if (v !== '' && v !== undefined) last = Math.max(last, j + 1); }); }); return last; };
  Sheet.prototype.getMaxRows = function () { return Math.max(1000, this.data.length); };
  Sheet.prototype.getRange = function (r, c, nr, nc) { return new Range(this, r, c, nr || 1, nc || 1); };
  Sheet.prototype.appendRow = function (arr) { var r = this.getLastRow() + 1, self = this; arr.forEach(function (v, j) { self._set(r, j + 1, v); }); persist(); };
  Sheet.prototype.deleteRow = function (n) { this.data.splice(n - 1, 1); persist(); };
  Sheet.prototype.deleteColumn = function (n) { this.data.forEach(function (row) { if (row.length >= n) row.splice(n - 1, 1); }); persist(); };
  Sheet.prototype.setFrozenRows = function () {};
  Sheet.prototype.setColumnWidth = function () { return this; };
  Sheet.prototype.clear = function () { this.data = []; this.formats = {}; persist(); return this; };
  function Spreadsheet(name, id) { this.name = name; this.id = id || ('DEMO' + (++ssCounter)); this.sheets = [new Sheet('Sheet1')]; spreadsheets[this.id] = this; }
  Spreadsheet.prototype.getId = function () { return this.id; };
  Spreadsheet.prototype.getName = function () { return this.name; };
  Spreadsheet.prototype.getUrl = function () { return '#demo-sheet-' + this.id; };
  Spreadsheet.prototype.getSheetByName = function (n) { return this.sheets.filter(function (s) { return s.name === n; })[0] || null; };
  Spreadsheet.prototype.insertSheet = function (n) { var s = new Sheet(n); this.sheets.push(s); persist(); return s; };
  Spreadsheet.prototype.getSheets = function () { return this.sheets; };
  Spreadsheet.prototype.deleteSheet = function (s) { this.sheets = this.sheets.filter(function (x) { return x !== s; }); persist(); };
  window.SpreadsheetApp = {
    create: function (n) { return new Spreadsheet(n); },
    openById: function (id) { return spreadsheets[id]; },
    getActiveSpreadsheet: function () { return null; },
    newDataValidation: function () { var v = { list: null }, b = { requireValueInList: function (l) { v.list = l; return b; }, setAllowInvalid: function () { return b; }, build: function () { return v; } }; return b; }
  };

  // ---------- Properties, Cache, Lock, Session
  window.PropertiesService = { getScriptProperties: function () { return { getProperty: function (k) { return k in props ? props[k] : null; }, setProperty: function (k, v) { props[k] = v; persist(); } }; } };
  window.CacheService = { getScriptCache: function () { return {
    get: function (k) { var e = cacheStore[k]; if (!e) return null; if (e[1] && e[1] < Date.now()) { delete cacheStore[k]; return null; } return e[0]; },
    put: function (k, v, ttl) { cacheStore[k] = [String(v), ttl ? Date.now() + ttl * 1000 : 0]; persist(); },
    remove: function (k) { delete cacheStore[k]; persist(); }
  }; } };
  window.LockService = { getScriptLock: function () { return { waitLock: function () {}, releaseLock: function () {} }; } };
  window.Session = { getEffectiveUser: function () { return { getEmail: function () { return 'admin.demo@utm.my'; } }; } };

  // ---------- Mel (disimulasikan: dipaparkan pada skrin demo)
  window.MailApp = { sendEmail: function (m) { if (window.__demoMail) window.__demoMail(m); }, getRemainingDailyQuota: function () { return 100; } };
  window.ScriptApp = { getScriptId: function () { return 'DEMO-SCRIPT-ID'; }, getService: function () { return { getUrl: function () { return 'https://script.google.com/macros/s/DEMO/exec'; } }; } };

  // ---------- Drive dalam memori (fail kecil disimpan dalam localStorage)
  function DFile(id, name, b64, folder, trashed) { this.id = id; this.name = name; this.b64 = b64; this.folder = folder; this.trashed = !!trashed; }
  DFile.prototype.getId = function () { return this.id; };
  DFile.prototype.getName = function () { return this.name; };
  DFile.prototype.getBlob = function () { return Utilities.newBlob(Utilities.base64Decode(this.b64), 'application/pdf', this.name); };
  DFile.prototype.setTrashed = function (t) { this.trashed = t; persist(); };
  DFile.prototype.getParents = function () { var arr = [{ getId: function () { return this._f; }, _f: this.folder }], i = 0; return { hasNext: function () { return i < arr.length; }, next: function () { return arr[i++]; } }; };
  function DFolder(id, name) { this.id = id; this.name = name; }
  DFolder.prototype.getId = function () { return this.id; };
  DFolder.prototype.getName = function () { return this.name; };
  DFolder.prototype.getUrl = function () { return '#demo-folder-' + this.id; };
  DFolder.prototype.createFile = function (blob) {
    var id = 'DEMOFILE' + (++drive.n) + 'abcdefghij', f = new DFile(id, blob.getName(), Utilities.base64Encode(blob.getBytes()), this.id);
    drive.files[id] = f; persist(); return f;
  };
  window.DriveApp = {
    createFolder: function (name) { var id = 'DEMOFOLDER' + (++drive.n) + 'abcdefghij', f = new DFolder(id, name); drive.folders[id] = f; persist(); return f; },
    getFolderById: function (id) { if (!drive.folders[id]) throw new Error('folder tiada'); return drive.folders[id]; },
    getFileById: function (id) { if (!drive.files[id]) throw new Error('fail tiada'); return drive.files[id]; }
  };

  // ---------- Pulih keadaan tersimpan
  window.__demoRestore = function () {
    var raw = null;
    try { raw = localStorage.getItem(STATE_KEY); } catch (e) { return false; }
    if (!raw) return false;
    try {
      var st = JSON.parse(raw);
      ssCounter = st.ssCounter || 0; props = st.props || {}; cacheStore = st.cache || {};
      (st.sheets || []).forEach(function (s) {
        var ss = new Spreadsheet(s.name, s.id); ss.sheets = s.sheets.map(function (x) { var sh = new Sheet(x.name); sh.data = x.data; sh.formats = x.formats || {}; return sh; });
      });
      ssCounter = st.ssCounter;
      drive.n = (st.drive && st.drive.n) || 0;
      Object.keys((st.drive && st.drive.folders) || {}).forEach(function (id) { var f = st.drive.folders[id]; drive.folders[id] = new DFolder(f.id, f.name); });
      Object.keys((st.drive && st.drive.files) || {}).forEach(function (id) { var f = st.drive.files[id]; drive.files[id] = new DFile(f.id, f.name, f.b64, f.folder, f.trashed); });
      return true;
    } catch (e) { console.warn('Demo: keadaan rosak, dimulakan semula', e); return false; }
  };
  window.__demoReset = function () { try { localStorage.removeItem(STATE_KEY); localStorage.removeItem('utmx_token'); sessionStorage.removeItem('utmx_token'); } catch (e) { /* abaikan */ } };
  window.__demoSha256Hex = function (s) { return Array.prototype.map.call(sha256(enc.encode(s)), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); };

  // ---------- google.script.run (tak segerak, dengan kelewatan kecil seperti pelayan sebenar)
  function makeRunner(ok, fail) {
    return new Proxy({}, { get: function (_, name) {
      if (name === 'withSuccessHandler') return function (f) { return makeRunner(f, fail); };
      if (name === 'withFailureHandler') return function (f) { return makeRunner(ok, f); };
      return function () {
        var args = Array.prototype.slice.call(arguments);
        setTimeout(function () {
          var r;
          try {
            if (typeof window[name] !== 'function') throw new Error('Fungsi tiada: ' + name);
            r = window[name].apply(null, args);
            r = r === undefined ? null : JSON.parse(JSON.stringify(r));
          } catch (e) { if (fail) fail({ message: String(e && e.message || e) }); return; }
          if (ok) ok(r);
        }, 50 + Math.random() * 90);
      };
    } });
  }
  window.google = { script: { run: makeRunner(null, null) } };
})();
