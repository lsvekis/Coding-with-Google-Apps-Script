/**
 * Lampiran PDF (sijil). Fail disimpan dalam satu folder Drive peribadi milik pemilik skrip dan TIDAK dikongsi.
 * Muat turun hanya melalui aplikasi selepas semakan akses (PIC: fakulti sendiri; Admin: semua).
 */
var UPLOAD_MAX_BYTES = 5 * 1024 * 1024;   // 5 MB
var UPLOAD_MAX_PER_HOUR = 20;

function safeFileName_(name) {
  var n = String(name || 'sijil.pdf').split(/[\\/]/).pop().replace(/[^A-Za-z0-9._ -]/g, '_').replace(/\s+/g, ' ').trim();
  if (!/\.pdf$/i.test(n)) n += '.pdf';
  return n.slice(-100);
}

function uploadFile_(token, kpiId, fieldKey, payload) {
  var user = requireUser_(token);
  var kpi = getKpi_(String(kpiId));
  if (!canAccessKpi_(user, kpi)) throw userError_('Akses ditolak bagi KPI ini.');
  var field = kpi.fields.filter(function (f) { return f.key === fieldKey && f.type === 'file'; })[0];
  if (!field) throw userError_('Medan fail tidak sah.');
  if (!payload || typeof payload.data !== 'string' || !payload.data.length) throw userError_('Tiada fail diterima.');
  if (payload.data.length > Math.ceil(UPLOAD_MAX_BYTES * 4 / 3) + 8) throw userError_('Fail terlalu besar. Maksimum 5 MB.');

  var cache = CacheService.getScriptCache();
  var rateKey = 'uprate:' + sha256Hex_(user.emel);
  var n = parseInt(cache.get(rateKey) || '0', 10);
  if (n >= UPLOAD_MAX_PER_HOUR) throw userError_('Terlalu banyak muat naik. Cuba lagi dalam satu jam.');
  cache.put(rateKey, String(n + 1), 3600);

  var bytes;
  try { bytes = Utilities.base64Decode(payload.data); } catch (e) { throw userError_('Fail rosak atau tidak sah.'); }
  if (bytes.length > UPLOAD_MAX_BYTES) throw userError_('Fail terlalu besar. Maksimum 5 MB.');
  // Pengesahan kandungan sebenar: PDF bermula dengan "%PDF-" (bukan sekadar nama fail).
  var magic = [0x25, 0x50, 0x44, 0x46, 0x2d];
  for (var i = 0; i < magic.length; i++) { if ((bytes[i] & 0xff) !== magic[i]) throw userError_('Fail mesti dalam format PDF.'); }

  var name = safeFileName_(payload.name);
  var stored = kpi.id + '_' + Utilities.formatDate(new Date(), APP.TZ, 'yyyyMMdd-HHmmss') + '_' + randomHex_(6) + '.pdf';
  var file = getAttachFolder_().createFile(Utilities.newBlob(bytes, 'application/pdf', stored));
  cache.put('up:' + file.getId(), JSON.stringify({ e: user.emel, k: kpi.id, n: name }), 3600);
  audit_(user, 'MUAT_NAIK', kpi.id, '', name + ' (' + bytes.length + ' bait)');
  return { id: file.getId(), name: name, size: bytes.length };
}

function downloadFile_(token, kpiId, recordId, fieldKey) {
  var user = requireUser_(token);
  var kpi = getKpi_(String(kpiId));
  if (!canAccessKpi_(user, kpi)) throw userError_('Akses ditolak bagi KPI ini.');
  var field = kpi.fields.filter(function (f) { return f.key === fieldKey && f.type === 'file'; })[0];
  if (!field) throw userError_('Medan fail tidak sah.');
  var row = null;
  readTable_(kpi.sheet, typesFor_(kpi)).rows.forEach(function (r) { if (r.id === String(recordId)) row = r; });
  if (!row) throw userError_('Rekod tidak dijumpai.');
  if (user.peranan !== ROLES.ADMIN && kpi.entry === 'faculty' && row.fakulti !== user.fakulti) throw userError_('Akses ditolak: rekod ini milik fakulti lain.');
  var ref = parseJson_(row[fieldKey], null);
  if (!ref || !ref.id) throw userError_('Tiada fail pada rekod ini.');
  var file = DriveApp.getFileById(ref.id);
  if (!fileInFolder_(file)) throw userError_('Fail tidak sah.');
  var blob = file.getBlob();
  audit_(user, 'MUAT_TURUN', kpi.id, row.id, ref.name || '');
  return { name: ref.name || 'sijil.pdf', mime: 'application/pdf', base64: Utilities.base64Encode(blob.getBytes()) };
}
