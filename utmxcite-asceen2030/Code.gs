/** Titik masuk web app dan fungsi API yang dipanggil klien (google.script.run). */

function doGet() {
  var t = HtmlService.createTemplateFromFile('Index');
  t.appName = APP.NAME;
  return t.evaluate()
    .setTitle(APP.NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

/** Bungkus panggilan: tangkap ralat, pulangkan mesej mesra pengguna, jangan dedahkan butiran dalaman. */
function wrap_(fn) {
  STUDENT_MEMO_ = null;   // cache data pelajar hanya sah dalam satu panggilan
  SS_MEMO_ = null; DASH_MEMO_ = null; FAC_MEMO_ = null;
  try {
    return { ok: true, data: fn() };
  } catch (e) {
    if (e && e.user) return { ok: false, error: e.message, fields: e.fields || null, missing: e.missing || null, auth: !!e.auth };
    console.error(e && e.stack ? e.stack : e);
    return { ok: false, error: 'Ralat dalaman. Sila cuba lagi atau hubungi pentadbir.' };
  }
}

function str_(v, max) { return String(v === null || v === undefined ? '' : v).slice(0, max || 300); }

// --- Awam ---------------------------------------------------------------
function api_slideLogos() { return wrap_(function () { return SLIDE_LOGOS; }); }
function api_infografik(year) { return wrap_(function () { return getInfografik_(year); }); }
function api_trend() { return wrap_(function () { return getTrend_(); }); }
function api_dashboard(year) { return wrap_(function () { return getDashboard_(year); }); }
function api_requestOtp(email) { return wrap_(function () { return requestOtp_(str_(email, 254)); }); }
function api_verifyOtp(email, code) { return wrap_(function () { return verifyOtp_(str_(email, 254), str_(code, 20)); }); }

// --- Perlu log masuk ----------------------------------------------------
function api_logout(token) { return wrap_(function () { return logout_(str_(token, 200)); }); }
function api_logoutAll(token) { return wrap_(function () { return logoutAll_(str_(token, 200)); }); }
function api_session(token) { return wrap_(function () { return sessionInfo_(str_(token, 200)); }); }
function api_list(token, kpiId, filters) { return wrap_(function () { return listRecords_(str_(token, 200), str_(kpiId, 20), filters); }); }
function api_save(token, kpiId, rec) { return wrap_(function () { return saveRecord_(str_(token, 200), str_(kpiId, 20), rec); }); }
function api_lookupStudents(token, kpiId, list) { return wrap_(function () { return lookupStudents_(str_(token, 200), str_(kpiId, 20), list); }); }
function api_saveStudents(token, list) { return wrap_(function () { return saveStudents_(str_(token, 200), list); }); }
function api_bulkSave(token, kpiId, rows) { return wrap_(function () { return bulkSave_(str_(token, 200), str_(kpiId, 20), rows); }); }
function api_uploadFile(token, kpiId, fieldKey, payload) { return wrap_(function () { return uploadFile_(str_(token, 200), str_(kpiId, 20), str_(fieldKey, 60), payload); }); }
function api_downloadFile(token, kpiId, recordId, fieldKey) { return wrap_(function () { return downloadFile_(str_(token, 200), str_(kpiId, 20), str_(recordId, 40), str_(fieldKey, 60)); }); }
function api_delete(token, kpiId, id) { return wrap_(function () { return deleteRecord_(str_(token, 200), str_(kpiId, 20), str_(id, 40)); }); }

// --- Admin --------------------------------------------------------------
function api_listUsers(token) { return wrap_(function () { return listUsers_(str_(token, 200)); }); }
function api_saveUser(token, input) { return wrap_(function () { return saveUser_(str_(token, 200), input); }); }
function api_deleteUser(token, email) { return wrap_(function () { return deleteUser_(str_(token, 200), str_(email, 254)); }); }
function api_listTargets(token) { return wrap_(function () { return listTargetsAdmin_(str_(token, 200)); }); }
function api_saveTarget(token, input) { return wrap_(function () { return saveTarget_(str_(token, 200), input); }); }
function api_setupInfo(token) { return wrap_(function () { return getSetupInfo_(str_(token, 200)); }); }
function api_runSetup(token) { return wrap_(function () { return runSetupFromApp_(str_(token, 200)); }); }
function api_testMail(token) { return wrap_(function () { return sendTestMail_(str_(token, 200)); }); }
function api_syncMakerspace(token, startRow) { return wrap_(function () { return syncMakerspaceApi_(str_(token, 200), startRow); }); }
function api_listAudit(token, limit) { return wrap_(function () { return listAudit_(str_(token, 200), limit); }); }
