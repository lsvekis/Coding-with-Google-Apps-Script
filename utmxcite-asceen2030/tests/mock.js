// Tiruan ringkas API Google Apps Script supaya logik pelayan boleh diuji dengan Node.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadGas(opts = {}) {
  const sent = [];
  const quota = { n: 100 };
  const props = {};
  const cacheStore = {};
  const sheetsByName = {};
  let ssCounter = 0;
  const spreadsheets = {};

  class Range {
    constructor(sh, r, c, nr, nc) { Object.assign(this, { sh, r, c, nr, nc }); }
    getValues() {
      const out = [];
      for (let i = 0; i < this.nr; i++) {
        const row = [];
        for (let j = 0; j < this.nc; j++) {
          const v = (this.sh.data[this.r - 1 + i] || [])[this.c - 1 + j];
          row.push(v === undefined ? '' : v);
        }
        out.push(row);
      }
      return out;
    }
    setValues(vals) {
      vals.forEach((row, i) => row.forEach((v, j) => this.sh._set(this.r + i, this.c + j, v)));
      return this;
    }
    setValue(v) { this.sh._set(this.r, this.c, v); return this; }
    getValue() { return this.getValues()[0][0]; }
    setNumberFormat(f) { for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) this.sh.formats[(this.r + i) + ':' + (this.c + j)] = f; return this; }
    setDataValidation(r) { this.sh.validations = this.sh.validations || {}; this.sh.validations[this.c] = r; return this; }
    setFontWeight() { return this; } setBackground() { return this; } setFontColor() { return this; }
  }
  class Sheet {
    constructor(name) { this.name = name; this.data = []; this.formats = {}; }
    _set(r, c, v) {
      while (this.data.length < r) this.data.push([]);
      const row = this.data[r - 1];
      while (row.length < c) row.push('');
      row[c - 1] = v;
    }
    getName() { return this.name; }
    getLastRow() { let last = 0; this.data.forEach((row, i) => { if (row.some(v => v !== '' && v !== undefined)) last = i + 1; }); return last; }
    getLastColumn() { let last = 0; this.data.forEach(row => { row.forEach((v, j) => { if (v !== '' && v !== undefined) last = Math.max(last, j + 1); }); }); return last; }
    getMaxRows() { return Math.max(1000, this.data.length); }
    getRange(r, c, nr = 1, nc = 1) { return new Range(this, r, c, nr, nc); }
    appendRow(arr) { const r = this.getLastRow() + 1; arr.forEach((v, j) => this._set(r, j + 1, v)); }
    deleteRow(n) { this.data.splice(n - 1, 1); }
    deleteColumn(n) { this.data.forEach(row => { if (row.length >= n) row.splice(n - 1, 1); }); }
    setFrozenRows() {}
    clear() { this.data = []; this.formats = {}; return this; }
    setColumnWidth() { return this; }
  }
  class Spreadsheet {
    constructor(name) { this.name = name; this.id = 'SS' + (++ssCounter); this.sheets = []; this.sheets.push(new Sheet('Sheet1')); spreadsheets[this.id] = this; }
    getId() { return this.id; }
    getUrl() { return 'https://docs.google.com/spreadsheets/d/' + this.id; }
    getName() { return this.name; }
    getSheetByName(n) { return this.sheets.find(s => s.name === n) || null; }
    insertSheet(n) { const s = new Sheet(n); this.sheets.push(s); return s; }
    getSheets() { return this.sheets; }
    deleteSheet(s) { this.sheets = this.sheets.filter(x => x !== s); }
  }

  const clock = { now: opts.now || Date.now() };
  const kl = (d) => new Date(d.getTime() + 8 * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, '0');

  const sandbox = {
    console,
    Math, JSON, Date, Object, Array, String, Number, isFinite, isNaN, parseInt, RegExp, Error,
    Utilities: {
      getUuid: () => crypto.randomUUID(),
      DigestAlgorithm: { SHA_256: 'sha256' },
      Charset: { UTF_8: 'utf8' },
      base64Decode: (str) => Array.from(Buffer.from(str, 'base64')).map(b => (b > 127 ? b - 256 : b)),
      base64Encode: (bytes) => Buffer.from(bytes.map(b => b & 0xff)).toString('base64'),
      newBlob: (bytes, mime, name) => ({ getBytes: () => bytes, getName: () => name, getContentType: () => mime }),
      computeDigest: (alg, s) => Array.from(crypto.createHash('sha256').update(s, 'utf8').digest()).map(b => (b > 127 ? b - 256 : b)),
      formatDate: (d, tz, fmt) => {
        const k = kl(d);
        const map = { yyyy: k.getUTCFullYear(), MM: pad(k.getUTCMonth() + 1), dd: pad(k.getUTCDate()), HH: pad(k.getUTCHours()), mm: pad(k.getUTCMinutes()), ss: pad(k.getUTCSeconds()), M: k.getUTCMonth() + 1 };
        return fmt.replace(/'T'/g, 'T').replace(/yyyy|MM|dd|HH|mm|ss|M/g, t => map[t]);
      }
    },
    DriveApp: (() => {
      const files = {}, folders = {};
      let n = 0;
      const mkBlob = (bytes, mime, name) => ({ getBytes: () => bytes, getName: () => name, getContentType: () => mime });
      class File {
        constructor(blob, folder) { this.id = 'FILE' + (++n) + 'abcdefghijklmn'; this.name = blob.getName(); this.bytes = blob.getBytes(); this.trashed = false; this.folder = folder; files[this.id] = this; }
        getId() { return this.id; }
        getName() { return this.name; }
        getBlob() { return mkBlob(this.bytes, 'application/pdf', this.name); }
        setTrashed(t) { this.trashed = t; }
        getParents() { const arr = [this.folder]; let i = 0; return { hasNext: () => i < arr.length, next: () => arr[i++] }; }
      }
      class Folder {
        constructor(name) { this.name = name; this.id = 'FOLDER' + (++n) + 'abcdefghij'; folders[this.id] = this; }
        getId() { return this.id; }
        getName() { return this.name; }
        getUrl() { return 'https://drive.google.com/drive/folders/' + this.id; }
        createFile(blob) { return new File(blob, this); }
      }
      const outside = new Folder('Folder lain (bukan lampiran)');
      return {
        _files: files, _outside: outside,
        createFolder: (name) => new Folder(name),
        getFolderById: (id) => { if (!folders[id]) throw new Error('folder tiada'); return folders[id]; },
        getFileById: (id) => { if (!files[id]) throw new Error('fail tiada'); return files[id]; }
      };
    })(),
    SpreadsheetApp: {
      create: (n) => new Spreadsheet(n),
      openById: (id) => spreadsheets[id],
      getActiveSpreadsheet: () => null,
      getUi: () => ({ createMenu: (n) => { const m = { name: n, items: [], addItem(l, f) { m.items.push([l, f]); return m; }, addToUi() { opts.menus = opts.menus || []; opts.menus.push(m); return m; } }; return m; }, showModalDialog: (o, t) => { opts.dialog = { html: o.html, title: t }; } }),
      newDataValidation: () => { const v = { list: null }; const b = { requireValueInList: (l) => { v.list = l; return b; }, setAllowInvalid: () => b, build: () => v }; return b; }
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = v; } }) },
    CacheService: {
      getScriptCache: () => ({
        get: k => (k in cacheStore ? cacheStore[k] : null),
        put: (k, v) => { cacheStore[k] = String(v); },
        remove: k => { delete cacheStore[k]; }
      })
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    MailApp: { sendEmail: (m) => { sent.push(m); quota.n--; }, getRemainingDailyQuota: () => quota.n },
    ScriptApp: { getScriptId: () => 'SCRIPTID1234567890', getService: () => ({ getUrl: () => opts.webAppUrl === undefined ? 'https://script.google.com/macros/s/AKfycbxDEPLOY/exec' : opts.webAppUrl }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => opts.owner || 'admin@utm.my' }) },
    HtmlService: { createHtmlOutput: (h) => { const o = { html: h, setWidth: () => o, setHeight: () => o }; return o; } }
  };
  // Date palsu supaya "hari ini" boleh dikawal dalam ujian.
  const RealDate = Date;
  sandbox.Date = class extends RealDate {
    constructor(...a) { if (a.length) super(...a); else super(clock.now); }
    static now() { return clock.now; }
  };
  vm.createContext(sandbox);
  const dir = path.join(__dirname, '..');
  ['Config', 'Util', 'Setup', 'Auth', 'Data', 'Files', 'Metrics', 'Admin', 'Logos', 'Code'].forEach(f => {
    vm.runInContext(fs.readFileSync(path.join(dir, f + '.gs'), 'utf8'), sandbox, { filename: f + '.gs' });
  });
  return { g: sandbox, sent, props, cacheStore, spreadsheets, clock, opts };
}

module.exports = { loadGas };
