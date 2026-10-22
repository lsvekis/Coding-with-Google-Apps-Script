// ===== Config.gs =====
/**
 * UTMXCITE 4 ASCEND 2030 Report
 * Konfigurasi: pemalar aplikasi, definisi 7 KPI (medan borang), sasaran awal dan data awal.
 * Sumber rujukan: Dokumen Pelan Tindakan UTMXCITE (DS 04 - Premium Employment).
 */
var APP = {
  NAME: 'UTMXCITE 4 ASCEND 2030 Report',
  WEB_URL: 'https://script.google.com/a/macros/utm.my/s/AKfycbza7zjSdub5fOgDbS6q8LFM11ByewnyUTlm8Ft4fq4l9F1MSYDsPWkkb7HTuh_rTjyi/exec', // pautan web app (menu Sheet); kosong = dikesan automatik
  TZ: 'Asia/Kuala_Lumpur',
  OTP_TTL: 300,            // saat
  OTP_MAX_ATTEMPTS: 5,
  OTP_MAX_REQUESTS: 5,     // setiap jam bagi satu e-mel
  SESSION_TTL: 21600,      // cache sesi 6 jam (had CacheService); sesi sebenar KEKAL dalam tab Sesi sehingga log keluar
  SESSION_MAX_PER_USER: 10, // had peranti / pelayar serentak bagi seorang pengguna (yang tertua ditamatkan)
  DASH_CACHE_TTL: 600,
  YEARS: [2026, 2027, 2028, 2029, 2030],
  PREMIUM_INCOME_RM: 4000, // ambang purata pendapatan sebulan bagi "pekerjaan premium" (lebih daripada)
  PREMIUM_TARGET_PCT: 40,  // sasaran 40% menjelang 2030
  PREMIUM_TARGET_YEAR: 2030,
  ALLOWED_EMAIL_DOMAINS: [] // contoh: ['utm.my']; kosong = semua domain
};

/** Data asas pelajar (tab PELAJAR). Semua KPI yang menyimpan data pelajar hanya meminta no. matrik; selebihnya diambil dari sini. */
var JENIS_MILIKAN = ['MILIKAN TUNGGAL', 'PERKONGSIAN', 'SYARIKAT SENDIRIAN BERHAD', 'LAIN-LAIN'];
var PUNCA_MODAL = ['MODAL SENDIRI', 'MODAL KELUARGA', 'GERAN', 'PINJAMAN', 'BANTUAN IPT', 'HADIAH PERTANDINGAN', 'AGENSI', 'NGO', 'LAIN-LAIN'];
var JUMLAH_MODAL = ['KURANG DARI 499', '500-699', '700-899', '900-999', '1,000-1,999', '2,000-2,999', '3,000-3,999', '4,000-4,999', '5,000 DAN KE ATAS'];
var BILANGAN_PEKERJA = ['KURANG DARI 5', '6-10 ORANG', '11-15 ORANG', '16-30 ORANG', '31-40 ORANG', '41-50 ORANG', '51-60 ORANG', '61-70 ORANG', '71-80 ORANG', '81-90 ORANG', '91-100 ORANG', '101 DAN KE ATAS'];
var BIDANG_KEPAKARAN = [
  'Pembangunan Model Perniagaan & Strategi Pasaran',
  'Pengurusan Kewangan & Literasi (merangkumi pengurusan aliran tunai, belanjawan, penetapan harga, dan analisis keuntungan)',
  'Pemasaran & Penjenamaan (Branding) termasuk pemasaran digital dan teknik komunikasi berkesan',
  'Operasi & Pengurusan Pasukan termasuk mengurus inventori dan pembekal',
  'Rangkaian (Networking) & Hubungan Industri',
  'Pembangunan Diri & Ketahanan Emosi (Resilience) bagi membina kekuatan mental untuk menghadapi cabaran perniagaan, pengurusan masa, dan penetapan matlamat',
  'Pengantarabangsaan (Export) khusus untuk membantu usahawan menembusi pasaran global, pematuhan standard perdagangan dan strategi eksport',
  'Penyelesaian Masalah & Inovasi'
];
var BIDANG_PENGAJIAN = [
  'PENDIDIKAN',
  'SASTERA DAN KEMANUSIAAN',
  'SAINS, SOSIAL, KEWARTAWANAN DAN MAKLUMAT',
  'PERNIAGAAN, PENTADBIRAN DAN PERUNDANGAN',
  'SAINS SEMULAJADI, MATEMATIK DAN STATISTIK',
  'TEKNOLOGI MAKLUMAT DAN KOMUNIKASI',
  'KEJURUTERAAN, PEMBUATAN DAN PEMBINAAN',
  'PERTANIAN, PERHUTANAN, PERIKANAN DAN VETERINAR',
  'KESIHATAN DAN KEBAJIKAN',
  'PERKHIDMATAN',
  'LAIN-LAIN'
];
var BULAN_MS = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
var PERINGKAT_STARTUP = ['Idea/konsep', 'Prototaip', 'Validasi pasaran', 'Pelancaran', 'Pertumbuhan'];   // KAI 6: semua peringkat dikira
var BANGSA_OPTIONS = ['MELAYU', 'CINA', 'INDIA', 'PRIBUMI SARAWAK', 'PRIBUMI SABAH', 'LAIN-LAIN'];
var STUDENT_COLS = ['no_matrik', 'no_kp', 'nama_pelajar', 'emel', 'telefon', 'fakulti', 'jantina', 'bangsa', 'bidang_pengajian', 'dikemas_kini_pada', 'dikemas_kini_oleh'];

/** Sheet luar bagi CKAI 5: borang permohonan penggunaan peralatan (tab DATA). ID boleh ditukar melalui Script Property MAKERSPACE_SHEET_ID. */
var MAKERSPACE_SRC = { id: '1meTCl-xyxqeLZhf3CeGjgT8oIfe62pNU7PSJFLaChdo', tab: 'DATA' };

/** Sesi log masuk berterusan: cincang token (SHA-256) dan e-mel; token sebenar hanya ada pada pelayar pengguna. */
var SESSION_COLS = ['token_hash', 'emel', 'dicipta_pada'];

var SHEETS = {
  USERS: 'Pengguna',
  TARGETS: 'Sasaran',
  FACULTIES: 'Fakulti',
  RISKS: 'Risiko',
  AUDIT: 'Log_Audit',
  STUDENTS: 'PELAJAR',
  SESSIONS: 'Sesi',
  KPT2_DEN: 'KPT2_Penyebut',
  SETUP: 'Persediaan'
};

var ROLES = { ADMIN: 'Admin', PIC: 'PIC' };

var SYS_COLS = ['dicipta_pada', 'dicipta_oleh', 'dikemas_kini_pada', 'dikemas_kini_oleh'];

var USER_COLS = ['emel', 'nama', 'peranan', 'fakulti', 'kpi_akses', 'aktif', 'dicipta_pada'];
var TARGET_COLS = ['kpi', 'tahun', 'sasaran', 'q1', 'q2', 'q3', 'q4', 'jenis', 'bajet_rm', 'catatan'];
var FACULTY_COLS = ['kod', 'nama'];
var DEN_COLS = ['tahun', 'fakulti', 'bil_penyebut', 'dikemas_kini_pada', 'dikemas_kini_oleh'];
var RISK_COLS = ['kpi', 'risiko', 'sumber', 'mitigasi', 'status', 'dikemas_kini_pada'];
var AUDIT_COLS = ['masa', 'emel', 'tindakan', 'kpi', 'rekod_id', 'ringkasan'];

/**
 * Senarai fakulti awal. SILA SEMAK dalam tab "Fakulti" selepas setup(); tab itu boleh disunting.
 * 'UTMXCITE' disertakan supaya Admin boleh merekod entiti pusat (contoh: ruang co-working).
 */
var FACULTY_SEED = [
  ['AHIBS', 'Azman Hashim International Business School'],
  ['FABU', 'Fakulti Alam Bina dan Ukur'],
  ['FAI', 'Fakulti Kecerdasan Buatan'],
  ['FC', 'Fakulti Komputeran'],
  ['FEST', 'Fakulti Sains Pendidikan dan Teknologi'],
  ['FKA', 'Fakulti Kejuruteraan Awam'],
  ['FKE', 'Fakulti Kejuruteraan Elektrik'],
  ['FKM', 'Fakulti Kejuruteraan Mekanikal'],
  ['FKT', 'Fakulti Kejuruteraan Kimia dan Tenaga'],
  ['FM', 'Fakulti Pengurusan'],
  ['FS', 'Fakulti Sains'],
  ['FSSK', 'Fakulti Sains Sosial dan Kemanusiaan'],
  ['MJIIT', 'Malaysia-Japan International Institute of Technology'],
  ['SPACE', 'UTM School of Professional and Continuing Education (UTMSPACE)'],
  ['UTMXCITE', 'UTMXCITE (Pusat)']
];

var YES_NO = ['Ya', 'Tidak'];

/** Tabung amanah UTMXCITE (laporan kedudukan kewangan). Tabung lain dipilih melalui "Lain-lain" dan dinamakan. */
var TABUNG_AMANAH = [
  { nama: 'Tabung Induk UTM XCITE', chargeline: 'A.J060000.6600.07078' },
  { nama: 'Tabung Khas Program Keusahawanan KPM - UTM XCITE', chargeline: 'A.J060000.6800.08990' },
  { nama: 'Majlis Keusahawanan Universiti Awam Malaysia (MAKMUM)', chargeline: 'A.J061100.6700.09641' },
  { nama: 'UMUM-Tabung Usahawan Urusetia HEP', chargeline: 'A.J060000.5700.08004' },
  { nama: 'Tabung Program Mikro Kredit Pelajar UTM - MTDC', chargeline: 'A.J060000.6700.08117' }
];

function tabungValidate_(c, errors, rows, existing) {
  var listed = TABUNG_AMANAH.filter(function (t) { return t.nama === c.tabung; })[0];
  var name = c.tabung === 'Lain-lain' ? String(c.tabung_lain || '').trim() : (listed ? listed.nama : '');
  if (listed) c.no_chargeline = listed.chargeline;                       // diisi automatik bagi tabung yang disenaraikan
  c.kunci = String(c.tempoh || '') + '|' + name.toLowerCase();           // satu rekod bagi setiap tabung setiap bulan

  // Peruntukan (a) dan komitmen (b) tidak perlu diisi setiap bulan: jika kosong, gunakan nilai rekod terdahulu bagi tabung yang sama dalam tahun yang sama.
  var prev = null;
  if (name && c.tempoh && !errors.tempoh) {
    (rows || []).forEach(function (r) {
      if (existing && r.id === existing.id) return;
      if (String(r.kunci).split('|')[1] !== name.toLowerCase()) return;
      if (String(r.tempoh).slice(0, 4) !== String(c.tempoh).slice(0, 4) || String(r.tempoh) >= String(c.tempoh)) return;
      if (!prev || String(r.tempoh) > String(prev.tempoh)) prev = r;
    });
  }
  var blank = function (v) { return v === '' || v === undefined || v === null; };
  if (blank(c.peruntukan_awal)) {
    if (prev) c.peruntukan_awal = Number(prev.peruntukan_awal) || 0;
    else if (!errors.peruntukan_awal) errors.peruntukan_awal = 'Wajib diisi pada laporan pertama tabung ini bagi tahun tersebut (bulan seterusnya diisi automatik).';
  }
  if (blank(c.komitmen)) c.komitmen = prev ? (Number(prev.komitmen) || 0) : 0;
  var a = Number(c.peruntukan_awal) || 0, b = Number(c.komitmen) || 0, p = Number(c.perbelanjaan) || 0;
  c.baki = Math.round((a - (b + p)) * 100) / 100;                       // d = a - (b + c)
  c.peratus = a ? Math.round(p / a * 1000) / 10 : 0;                    // % perbelanjaan daripada peruntukan
}

var LOKASI_PERNIAGAAN = ['SUB - Lot 1', 'SUB - Lot 2', 'SUB - Lot 3', 'SUB - Lot 4', 'SUB - Lot 5',
  'Student Mall - Lot 1', 'Student Mall - Lot 2', 'Student Mall - Lot 3', 'Student Mall - Lot 4', 'Student Mall - Lot 5',
  'Student Mall - Lot 6', 'Student Mall - Lot 7', 'Student Mall - Lot 8', 'Student Mall - Lot 9', 'Student Mall - Lot 10', 'Lain-lain'];

var JENIS_PERNIAGAAN = [
  'Aktiviti guaman',
  'Aktiviti infrastruktur pengkomputeran, pemprosesan data, pengehosan (hosting) dan yang berkaitan',
  'Aktiviti pemasangan elektrikal, paip dan pembinaan lain',
  'Aktiviti penerbitan buku, surat khabar, terbitan berkala dan penerbitan lain',
  'Aktiviti pengaturcaraan komputer lain (termasuk content creation, coding, business apps, MachineLearning, Artificial Intelligence, Cybersecurity, pangkalan data dan lama web)',
  'Aktiviti perakaunan, simpan kira dan audit; perundingan percukaian',
  'Aktiviti perkhidmatan minuman (termasuk Restoran, Kafeteria, Vendor Bergerak, Perkhidmatan minuman bergerak dan Kiosk)',
  'Aktiviti perkhidmatan perantaraan untuk aktiviti pos dan kurier (termasuk operasi platform dalam talian untuk membolehkan orang menempah penghantaran makanan selain perantara spt. Grab Food, Lalamove dan Shopee Food)',
  'Aktiviti perkhidmatan perantaraan untuk hartanah (termasuk aktiviti ejen dan broker hartanah untuk pembelian, penjualan dan penyewaan hartanah',
  'Aktiviti perkhidmatan teknologi maklumat dan komputer lain (termasuk perkhidmatan pemulihan kerosakan komputer, pemasangan (setting-up) komputer peribadi dan perkhidmatan pemasangan perisian)',
  'Aktiviti sokongan kepada aktiviti insurans/takaful dan tabungan pencen (termasuk Ejen insurans/takaful',
  'Dandanan rambut, rawatan kecantikan, spa harian dan aktiviti seumpamanya',
  'Infrastruktur pengkomputeran, pemprosesan data, pengehosan (hosting) dan aktiviti perkhidmatan maklumat lain',
  'Insurans/takaful',
  'Jualan komponen (termasuk alat ganti) dan aksesori kenderaan bermotor',
  'Pembaikan dan penyelenggaraan bagi kelengkapan elektrik (termasuk peralatan lampu elektrik dan peranti pendawaian pembawa arus dan peranti pendawaian bukan pembawa arus untuk pendawaian litar elektrik)',
  'Pembaikan dan penyelenggaraan kelengkapan isi rumah (termasuk peti sejuk, dapur, mesin basuh, pengering pakaian, pendingin udara bilik, dll.) dan peralatan rumah dan halaman',
  'Pembaikan dan penyelenggaraan kenderaan bermotor (termasuk Menyembur dan mengecat kenderaan bermotor, Mencuci dan menggilap (cuci kereta, dan pembaikan tayar dan tiub (pemasangan atau penggantian))',
  'Pembaikan dan penyelenggaraan komputer dan peralatan komunikasi',
  'Pembaikan dan penyelenggaraan peralatan elektronik pengguna',
  'Pembaikan dan penyelenggaraan produk logam fabrikasi, jentera dan kelengkapan',
  'Pembangunan permainan video, perisian permainan video dan peralatan perisian permainan video (termasuk e-sukan)',
  'Pembinaan bangunan kediaman dan bukan kediaman',
  'Pembuatan barang kemas, bijouterie dan artikel berkaitan',
  'Pembuatan barangan sukan',
  'Pembuatan instrumen dan bekalan perubatan dan pergigian',
  'Pembuatan instrumen muzik',
  'Pembuatan pakaian, kecuali pakaian bulu',
  'Pembuatan permainan dan mainan',
  'Pembuatan produk getah dan plastik',
  'Pencetakan dan aktiviti perkhidmatan berkaitan pencetakan',
  'Penerbitan perisian',
  'Pengaturcaraan komputer, perundingan dan aktiviti yang berkaitan',
  'Pengurusan konvensyen dan pameran perdagangan',
  'Peniaga jongkong emas',
  'Penyiapan dan kemasan bangunan',
  'Perikanan dan akuakultur (termasuk Ternakan ikan hiasan di laut dan air tawar)',
  'Pusat tuisyen',
  'Telekomunikasi'
];

/**
 * Enam fungsi UTMXCITE (mandat peringkat Universiti) = aliran proses kerja. Setiap indikator (KAI, DKAI, CKAI)
 * ditanda dengan satu `fungsi`. DKAI 1 ialah pelan merentas semua fungsi.
 */
var FUNCTIONS = [
  { id: 'minat', nama: 'Kenal pasti minat', no: 1, short: 'Identify Interest', label: 'Identify Student Entrepreneurship Interest', ms: 'Kenal pasti minat keusahawanan pelajar' },
  { id: 'latihan', nama: 'Latihan keusahawanan', no: 2, short: 'Entrepreneurship Training', label: 'Conduct Entrepreneurship Training', ms: 'Jalankan latihan keusahawanan' },
  { id: 'ideasi', nama: 'Sokong pengideaan perniagaan', no: 3, short: 'Business Ideation', label: 'Support Student Business Ideation', ms: 'Sokong pengideaan perniagaan pelajar' },
  { id: 'startup', nama: 'Bangunkan startup pelajar', no: 4, short: 'Startup Development', label: 'Facilitate Student Startup Development', ms: 'Fasilitasi pembangunan startup pelajar' },
  { id: 'prestasi', nama: 'Pantau prestasi usahawan', no: 5, short: 'Enterprise Performance', label: 'Monitor Student Enterprise Performance', ms: 'Pantau prestasi perusahaan pelajar' },
  { id: 'pameran', nama: 'Pameran inovasi pelajar', no: 6, short: 'Showcase Innovation', label: 'Showcase Student Innovation Venture', ms: 'Pamerkan inovasi dan venture pelajar' },
  { id: 'rentas', no: null, label: 'Cross-cutting', ms: 'Pelan dan tadbir urus merentas fungsi' }
];

/** Tiga peringkat penunjuk. Setiap KPI tergolong dalam satu peringkat mengikut awalan ID (KAI / DKAI / CKAI). */
/** Tiga teras Kamus KPI Keusahawanan IPT 2026-2030 (peringkat KPT). */
var TERAS = [
  { id: 't1', no: 1, label: 'Ekosistem keusahawanan pelajar yang berdaya saing' },
  { id: 't2', no: 2, label: 'Inovasi dan teknologi dalam keusahawanan' },
  { id: 't3', no: 3, label: 'Kolaborasi berimpak tinggi' }
];

var LEVELS = [
  { id: 'KPT', label: 'KPT · Peringkat Kementerian (KPI Keusahawanan IPT)', short: 'KPT · Kementerian', section: 'Peringkat Kementerian · KPT' },
  { id: 'KAI', label: 'KAI · Peringkat Universiti', short: 'KAI · Universiti', section: 'Peringkat Universiti · KAI' },
  { id: 'DKAI', label: 'DKAI · Peringkat Jabatan (JTNC HEPA)', short: 'DKAI · Jabatan (JTNC HEPA)', section: 'Peringkat Jabatan · DKAI (JTNC HEPA)' },
  { id: 'CKAI', label: 'CKAI · Peringkat Pusat (UTMXCITE)', short: 'CKAI · Pusat (UTMXCITE)', section: 'Peringkat Pusat · CKAI (UTMXCITE)' }
];

function F_(key, label, type, o) {
  var f = { key: key, label: label, type: type || 'text' };
  o = o || {};
  for (var k in o) { if (o.hasOwnProperty(k)) f[k] = o[k]; }
  return f;
}


/**
 * Medan program (CKAI 1 dan CKAI 2): satu rekod = satu program.
 * Medan wajib bagi program Selesai: tarikh mula/tamat, tempat, jumlah peserta, kos penganjuran dan pendapatan (boleh 0).
 */
function programFields_(kategori) {
  return [
    F_('fakulti', 'Fakulti / penganjur', 'faculty', { required: true, sec: 'Program' }),
    F_('nama_program', 'Nama program', 'text', { required: true }),
    F_('kategori', 'Kategori', 'select', { required: true, options: kategori }),
    F_('tahap', 'Peringkat', 'select', { options: ['Fakulti', 'Pusat (UTMXCITE)', 'Universiti', 'Kebangsaan', 'Antarabangsa'] }),
    F_('penganjur', 'Penganjur / rakan kerjasama', 'text'),
    F_('pegawai', 'Pegawai / pengarah program', 'text'),
    F_('objektif', 'Objektif program', 'textarea', { full: true }),
    F_('status', 'Status', 'select', { required: true, sec: 'Tarikh & tempat', options: ['Dirancang', 'Sedang berjalan', 'Selesai', 'Dibatalkan'] }),
    F_('tarikh_mula', 'Tarikh mula', 'date'),
    F_('tarikh_tamat', 'Tarikh tamat', 'date'),
    F_('lokasi', 'Tempat', 'text'),
    F_('bil_peserta', 'Jumlah peserta', 'number', { min: 0, sec: 'Penyertaan' }),
    F_('bil_pelajar', 'Daripada itu: pelajar', 'number', { min: 0 }),
    F_('bil_staf', 'Daripada itu: staf UTM', 'number', { min: 0 }),
    F_('bil_luar', 'Daripada itu: luar UTM (industri / komuniti / lain-lain)', 'number', { min: 0 }),
    F_('skor_kepuasan', 'Skor kepuasan peserta (0-5)', 'number', { min: 0, max: 5 }),
    F_('bajet_rm', 'Kos penganjuran (RM)', 'number', { min: 0, sec: 'Kewangan' }),
    F_('sumber_peruntukan', 'Sumber peruntukan', 'select', { options: ['Peruntukan fakulti', 'Peruntukan UTMXCITE (Pusat)', 'Penajaan / sponsor', 'Yuran penyertaan', 'Geran', 'Lain-lain'] }),
    F_('pendapatan_rm', 'Pendapatan (RM)', 'number', { min: 0 }),
    F_('sumber_pendapatan', 'Sumber pendapatan', 'select', { options: ['Yuran penyertaan', 'Penajaan / sponsor', 'Jualan produk / tiket', 'Geran', 'Lain-lain'] }),
    F_('bil_output', 'Bilangan hasil (projek / prototaip / idea / startup)', 'number', { min: 0, sec: 'Hasil & pengurusan' }),
    F_('laporan', 'Laporan program (PDF, maksimum 5 MB)', 'file', { full: true }),
    F_('lampiran', 'Pautan lampiran / berita', 'url'),
    F_('catatan', 'Catatan', 'textarea', { full: true })
  ];
}

/** Peraturan program: tarikh tamat tidak sebelum mula; pecahan peserta tidak melebihi jumlah. */
function programValidate_(c, errors) {
  if (c.tarikh_mula && c.tarikh_tamat && c.tarikh_tamat < c.tarikh_mula && !errors.tarikh_tamat) {
    errors.tarikh_tamat = 'Tarikh tamat tidak boleh sebelum tarikh mula.';
  }
  var parts = (Number(c.bil_pelajar) || 0) + (Number(c.bil_staf) || 0) + (Number(c.bil_luar) || 0);
  if (parts > 0 && c.bil_peserta === '' && !errors.bil_peserta) errors.bil_peserta = 'Isi jumlah peserta.';
  else if (c.bil_peserta !== '' && parts > c.bil_peserta && !errors.bil_peserta) {
    errors.bil_peserta = 'Jumlah peserta (' + c.bil_peserta + ') kurang daripada pelajar + staf + luar UTM (' + parts + ').';
  }
}

/** No. KP (12 digit, sengkang dibuang) atau no. pasport. */
function icValidate_(c, errors) {
  var kp = String(c.no_kp || '').replace(/\s+/g, '').toUpperCase();
  if (kp && !errors.no_kp) {
    if (/^\d{6}-?\d{2}-?\d{4}$/.test(kp)) kp = kp.replace(/-/g, '');
    if (!/^[A-Z0-9-]{6,20}$/.test(kp)) errors.no_kp = 'No. KP / pasport tidak sah.'; else c.no_kp = kp;
  }
}

function kai3Validate_(c, errors) {
  var kp = String(c.penyewa_kp || '').replace(/\s+/g, '').toUpperCase();
  if (kp && !errors.penyewa_kp) {
    if (/^\d{6}-?\d{2}-?\d{4}$/.test(kp)) kp = kp.replace(/-/g, '');
    if (!/^[A-Z0-9-]{6,20}$/.test(kp)) errors.penyewa_kp = 'No. KP / pasport tidak sah.'; else c.penyewa_kp = kp;
  }
}

function ssuValidate_(c, errors) {
  icValidate_(c, errors);
}

function makerspaceValidate_(c, errors) {
  icValidate_(c, errors);
  if (c.status_bayaran === 'Tiada Caj') c.bayaran_rm = 0;
  else if (c.status_bayaran && !errors.status_bayaran && (c.bayaran_rm === '' || c.bayaran_rm === undefined) && !errors.bayaran_rm) errors.bayaran_rm = 'Masukkan nilai bayaran (lalai RM5).';
  if (c.telefon && !errors.telefon && !/^[0-9+\-\s()]{7,20}$/.test(String(c.telefon))) errors.telefon = 'Nombor telefon tidak sah.';
  if (c.tarikh_mula && c.tarikh_tamat && !errors.tarikh_tamat && c.tarikh_tamat < c.tarikh_mula) errors.tarikh_tamat = 'Tarikh tamat mesti pada atau selepas tarikh mula.';
  if (c.tarikh_mula && c.tarikh_mula === c.tarikh_tamat && c.masa_mula && c.masa_tamat && !errors.masa_tamat && c.masa_tamat <= c.masa_mula) errors.masa_tamat = 'Masa tamat mesti selepas masa mula.';
}

function addMonthsIso_(iso, n) {
  var y = parseInt(iso.slice(0, 4), 10), m = parseInt(iso.slice(5, 7), 10) - 1 + n, d = iso.slice(8, 10);
  y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
  return y + '-' + ('0' + (m + 1)).slice(-2) + '-' + d;
}

/** KPT2: seorang graduan dikira sekali (no. KP). Penyebut (usahawan pelajar tahun akhir) dalam tab KPT2_Penyebut. */
function kpt2Validate_(c, errors, rows, existing) {
  icValidate_(c, errors);
  var kp = String(c.no_kp || '').toLowerCase();
  if (kp && !errors.no_kp) {
    var dup = (rows || []).filter(function (r) { return (!existing || r.id !== existing.id) && String(r.no_kp || '').replace(/^'/, '').toLowerCase() === kp; })[0];
    if (dup) errors.no_kp = 'Sudah didaftarkan (' + dup.id + ').';
  }
}

/** KPT3: satu rekod bagi setiap staf setiap tahun. */
function kpt3Validate_(c, errors, rows, existing) {
  icValidate_(c, errors);
  var staf = String(c.no_staf || '').trim().toLowerCase();
  if (!staf || !c.tahun) return;
  var dup = (rows || []).filter(function (r) { return (!existing || r.id !== existing.id) && String(r.tahun) === String(c.tahun) && String(r.no_staf || '').trim().toLowerCase() === staf; })[0];
  if (dup) errors.no_staf = 'Sudah didaftarkan (' + dup.id + ').';
}

/** KPT6: tarikh akhir tidak boleh sebelum tarikh mula. */
function kpt6Validate_(c, errors) {
  if (c.tarikh_mula && c.tarikh_akhir && c.tarikh_akhir < c.tarikh_mula && !errors.tarikh_akhir) errors.tarikh_akhir = 'Tarikh akhir tidak boleh sebelum tarikh mula.';
}

/** KPT7: satu syarikat/projek dikira sekali bagi setiap tahun pelaporan (tahun daripada tarikh_mula_embiayaan). */
function kpt7Validate_(c, errors, rows, existing) {
  var kp = String(c.no_kp_pemilik || '').replace(/\s+/g, '').toUpperCase();
  if (kp && !errors.no_kp_pemilik) {
    if (/^\d{6}-?\d{2}-?\d{4}$/.test(kp)) kp = kp.replace(/-/g, '');
    if (!/^[A-Z0-9-]{6,20}$/.test(kp)) errors.no_kp_pemilik = 'No. KP / pasport tidak sah.'; else c.no_kp_pemilik = kp;
  }
  var yr = String(c.tarikh_mula_embiayaan || '').slice(0, 4), nm = String(c.nama_syarikat || '').trim().toLowerCase();
  if (!yr || !nm || errors.nama_syarikat) return;
  var dup = (rows || []).filter(function (r) { return (!existing || r.id !== existing.id) && String(r.tarikh_mula_embiayaan || '').slice(0, 4) === yr && String(r.nama_syarikat || '').trim().toLowerCase() === nm; })[0];
  if (dup) errors.nama_syarikat = 'Syarikat ini sudah didaftarkan bagi tahun ' + yr + ' (' + dup.id + ').';
}

var PROGRAM_DONE_REQUIRE = ['tarikh_mula', 'tarikh_tamat', 'lokasi', 'bil_peserta', 'bajet_rm', 'pendapatan_rm'];

// ---------------------------------------------------------------------------
// Definisi KPI. entry: 'faculty' = PIC fakulti + Admin; 'admin' = Admin sahaja.
// ---------------------------------------------------------------------------
var KPIS = [
  {
    id: 'KPT1', sheet: null, auto: true, group: 'KPT', teras: 't1', entry: 'auto',
    title: 'KPT 1 · Jumlah jualan agregat usahawan pelajar', short: 'Jualan agregat usahawan',
    unit: 'RM jualan setahun', measure: 'kpt1', jenis: 'minimum', valueFormat: 'rm', listColumns: [], statusField: null, rules: [], fields: []
  },
  {
    id: 'KPT2', prefix: 'K2', sheet: 'KPT2_Graduan_Usahawan', group: 'KPT', teras: 't1', entry: 'faculty',
    title: 'KPT 2 · Peratus graduan yang menceburi keusahawanan dan mewujudkan peluang pekerjaan', short: '% graduan berusahawan',
    unit: '% graduan usahawan', measure: 'kpt2', jenis: 'minimum', valueFormat: 'pct',
    listColumns: ['id', 'tahun_graduan', 'fakulti', 'nama', 'no_matrik', 'nama_perniagaan'],
    statusField: null, validate: kpt2Validate_, rules: [],
    fields: [
      F_('tahun_graduan', 'Tahun graduan', 'number', { required: true, min: 2026, max: 2030, sec: 'Graduan usahawan' }),
      F_('fakulti', 'Fakulti', 'faculty', { required: true }),
      F_('nama', 'Nama graduan', 'text', { required: true }),
      F_('no_kp', 'No. KP / pasport', 'text', { required: true }),
      F_('no_matrik', 'No. matrik', 'text'),
      F_('jantina', 'Jantina', 'text'),
      F_('bangsa', 'Bangsa', 'text'),
      F_('bidang_pengajian', 'Bidang pengajian', 'text'),
      F_('nama_perniagaan', 'Nama perniagaan', 'text', { required: true, sec: 'Perniagaan' }),
      F_('no_pendaftaran_ssm', 'No. pendaftaran SSM / SKM / PBT', 'text', { required: true }),
      F_('jenis_pemilikan', 'Jenis pemilikan', 'select', { options: JENIS_MILIKAN }),
      F_('jenis_peniagaan', 'Jenis perniagaan', 'select', { options: JENIS_PERNIAGAAN }),
      F_('punca_modal', 'Punca modal', 'select', { options: PUNCA_MODAL }),
      F_('pendapatan_kasar', 'Pendapatan kasar (RM)', 'number', { min: 0 }),
      F_('bilangan_pekerja', 'Bilangan pekerja', 'select', { options: BILANGAN_PEKERJA }),
      F_('link_website', 'Pautan laman web', 'text'),
      F_('alamat_perniagaan', 'Alamat perniagaan', 'textarea', { full: true }),
      F_('tarikh_pernigaan', 'Tarikh penubuhan perniagaan', 'date', { required: true })
    ]
  },
  {
    id: 'KPT3', prefix: 'K3', sheet: 'KPT3_Tenaga_Pengajar', group: 'KPT', teras: 't1', entry: 'faculty',
    title: 'KPT 3 · Peratus tenaga pengajar keusahawanan dalam program peningkatan kompetensi', short: '% tenaga pengajar terlibat',
    unit: '% tenaga pengajar terlibat', measure: 'kpt3', jenis: 'minimum', valueFormat: 'pct',
    listColumns: ['id', 'tahun', 'fakulti', 'nama', 'no_staf', 'jenis_staf', 'pesijilan_profesional'],
    statusField: null, validate: kpt3Validate_, rules: [],
    fields: [
      F_('tahun', 'Tahun', 'number', { required: true, min: 2026, max: 2030, sec: 'Tenaga pengajar keusahawanan (berdaftar dengan Pusat)' }),
      F_('fakulti', 'Fakulti', 'faculty', { required: true }),
      F_('nama', 'Nama', 'text', { required: true }),
      F_('no_staf', 'No. staf', 'text', { required: true }),
      F_('no_kp', 'No. KP / pasport', 'text', { required: true }),
      F_('jenis_staf', 'Jenis staf', 'select', { required: true, options: ['Staf akademik', 'Staf bukan akademik'] }),
      F_('jantina', 'Jantina', 'select', { options: ['Lelaki', 'Perempuan'] }),
      F_('bumiputera', 'Bumiputera', 'select', { options: BANGSA_OPTIONS }),
      F_('jawatan', 'Jawatan', 'select', { options: ['PENSYARAH', 'STAF PENTADBIRAN/PENGURUSAN', 'LAIN-LAIN'], sec: 'Kompetensi' }),
      F_('bidang_kepakaran', 'Bidang kepakaran mentor', 'select', { options: BIDANG_KEPAKARAN }),
      F_('pesijilan_profesional', 'Pesijilan profesional', 'text', { hint: 'Isi jika staf telah menjalani program peningkatan kompetensi / memiliki pesijilan; kosongkan jika belum.' }),
      F_('senarai_projek_mentee', 'Senarai projek mentee', 'textarea', { full: true }),
      F_('catatan', 'Catatan', 'textarea', { full: true })
    ]
  },
  {
    id: 'KPT4', prefix: 'K4', sheet: 'KPT4_Pelajar_Inovasi', group: 'KPT', teras: 't2', entry: 'faculty',
    title: 'KPT 4 · Jumlah pelajar yang memanfaatkan inovasi dan teknologi dalam keusahawanan', short: 'Pelajar inovasi dan teknologi',
    unit: 'pelajar', measure: 'kpt4', jenis: 'minimum',
    listColumns: ['id', 'nama', 'no_matrik', 'fakulti', 'nama_projek_inovasi', 'level_TRL'],
    statusField: 'level_TRL', unique: ['no_matrik'], validate: icValidate_, rules: [],
    fields: [
      F_('fakulti', 'Fakulti', 'faculty', { required: true, sec: 'Pelajar' }),
      F_('nama', 'Nama pelajar', 'text', { required: true }),
      F_('no_kp', 'No. KP / pasport', 'text', { required: true }),
      F_('no_matrik', 'No. matrik', 'text', { required: true, hint: 'Setiap pelajar dikira sekali sahaja sepanjang pengajian.' }),
      F_('nama_syarikat', 'Nama syarikat', 'text'),
      F_('nama_ahli_kumpulan', 'Nama ahli kumpulan', 'textarea', { full: true }),
      F_('no_pendaftaran_SSM', 'No. pendaftaran SSM', 'text'),
      F_('jenis_perniagaan', 'Jenis perniagaan', 'select', { options: JENIS_PERNIAGAAN }),
      F_('status_bumiputera', 'Status Bumiputera', 'yesno'),
      F_('nama_projek_inovasi', 'Nama projek / inovasi', 'text', { required: true, sec: 'Inovasi dan teknologi' }),
      F_('level_TRL', 'Tahap kesediaan teknologi (TRL 1 hingga 3)', 'select', { required: true, options: ['TRL 1', 'TRL 2', 'TRL 3'], short: 'TRL' }),
      F_('penilaiain_CRL', 'Penilaian CRL', 'text'),
      F_('pautan_website', 'Pautan laman web', 'text'),
      F_('sipnopsis_inovasi', 'Sinopsis inovasi', 'textarea', { full: true }),
      F_('bukti_inovasi', 'Bukti inovasi / penilaian TRL atau CRL (PDF)', 'file', { full: true, sec: 'Dokumen' })
    ]
  },
  {
    id: 'KPT5', sheet: null, auto: true, group: 'KPT', teras: 't2', entry: 'auto',
    title: 'KPT 5 · Jumlah syarikat pemula pelajar / graduan berasaskan inovasi dan teknologi', short: 'Syarikat pemula inovasi dan teknologi',
    unit: 'syarikat pemula', measure: 'kpt5', jenis: 'minimum', listColumns: [], statusField: null, rules: [], fields: []
  },
  {
    id: 'KPT6', prefix: 'K6', sheet: 'KPT6_Kolaborasi', group: 'KPT', teras: 't3', entry: 'faculty',
    title: 'KPT 6 · Bilangan projek / aktiviti berimpak daripada kolaborasi rasmi (tempatan dan antarabangsa)', short: 'Kolaborasi berimpak',
    unit: 'projek / aktiviti', measure: 'kpt6', jenis: 'minimum',
    listColumns: ['id', 'tajuk', 'rakan_institusi', 'skop', 'jenis_dokumen', 'fakulti', 'tarikh_mula'],
    statusField: 'skop', rules: [], validate: kpt6Validate_,
    fields: [
      F_('fakulti', 'Fakulti', 'faculty', { required: true, sec: 'Kolaborasi' }),
      F_('tajuk', 'Tajuk kolaborasi', 'text', { required: true, full: true }),
      F_('rakan_institusi', 'Rakan institusi', 'text', { required: true }),
      F_('bidang_kerjasama', 'Bidang kerjasama', 'text'),
      F_('jenis_dokumen', 'Dokumen rasmi', 'select', { required: true, options: ['MoU', 'MoA', 'LoA', 'LoI', 'Geran penyelidikan'] }),
      F_('bil_projek_aktiviti_berkolabrasi', 'Bilangan projek / aktiviti berkolaborasi', 'number', { required: true, min: 1, sec: 'Projek / aktiviti' }),
      F_('nama_projek', 'Nama projek / aktiviti', 'text', { full: true }),
      F_('tarikh_mula', 'Tarikh mula', 'date', { required: true }),
      F_('tarikh_akhir', 'Tarikh akhir', 'date'),
      F_('penerangan_impak', 'Penerangan impak', 'textarea', { full: true }),
      F_('laporan_kolabrasi', 'Laporan kolaborasi (PDF)', 'file', { full: true, sec: 'Dokumen' }),
      F_('bukti_dokumen', 'Bukti dokumen', 'select', { options: ['MoU', 'MoA', 'LoA', 'LoI', 'Geran Penyelidikan'] }),
      F_('skop', 'Tempatan atau antarabangsa', 'select', { required: true, options: ['Tempatan', 'Antarabangsa'], sec: 'Pengelasan' })
    ]
  },
  {
    id: 'KPT7', prefix: 'K7', sheet: 'KPT7_Pembiayaan', group: 'KPT', teras: 't3', entry: 'faculty',
    title: 'KPT 7 · Jumlah syarikat, perusahaan atau projek perniagaan yang dibiayai', short: 'Syarikat atau projek dibiayai',
    unit: 'syarikat / projek dibiayai', measure: 'kpt7', jenis: 'minimum',
    listColumns: ['id', 'nama_syarikat', 'sumber_pembiayaan', 'jumlah_rm', 'fakulti', 'tarikh_mula_embiayaan'],
    statusField: 'sumber_pembiayaan', validate: kpt7Validate_, rules: [],
    fields: [
      F_('fakulti', 'Fakulti', 'faculty', { required: true, sec: 'Syarikat' }),
      F_('mentor', 'Mentor', 'text'),
      F_('nama_syarikat', 'Nama syarikat / perusahaan / projek', 'text', { required: true, full: true }),
      F_('no_pendaftaran_syarikat', 'No. pendaftaran syarikat', 'text'),
      F_('nama_pemilik', 'Nama pemilik', 'text', { required: true }),
      F_('no_kp_pemilik', 'No. KP / pasport pemilik', 'text'),
      F_('bangsa', 'Bangsa', 'select', { options: BANGSA_OPTIONS }),
      F_('jenis_perniagaan', 'Jenis perniagaan', 'select', { options: JENIS_PERNIAGAAN }),
      F_('jenis_pembiaya', 'Jenis pembiaya', 'text', { sec: 'Pembiayaan' }),
      F_('sumber_pembiayaan', 'Sumber pembiayaan', 'select', { required: true, options: ['ANGEL INVESTOR', 'VENTURE CAPITAL', 'ENTITI PENDANAAN AWAM', 'HADIAH PERTANDINGAN', 'LAIN-LAIN'] }),
      F_('jumlah_rm', 'Nilai pembiayaan (RM)', 'number', { required: true, min: 0 }),
      F_('tarikh_mula_embiayaan', 'Tarikh mula pembiayaan', 'date', { required: true }),
      F_('lampiran', 'Surat tawaran / rekod penerimaan / pengesahan (PDF)', 'file', { full: true, sec: 'Dokumen' }),
      F_('catatatn', 'Catatan', 'textarea', { full: true })
    ]
  },
  {
    id: 'KAI1', prefix: 'L1', sheet: 'KAI1_Launchpad', group: 'Growth', fungsi: 'startup', entry: 'faculty',
    title: 'KAI 1 · Menggiatkan semula UTM Launchpad', short: 'UTM Launchpad',
    unit: 'inkubator aktif', measure: 'kai1', jenis: 'minimum',
    listColumns: ['id', 'nama_inkubator', 'aliran', 'jenis', 'fakulti', 'status', 'didaftarkan'],
    statusField: 'status',
    rules: [
      { when: { field: 'didaftarkan', in: ['Ya'] }, require: ['tarikh_pendaftaran'] },
      { when: { field: 'status', in: ['Tidak aktif'] }, require: ['tarikh_tidak_aktif'] },
      { when: { field: 'status', in: ['Beroperasi'] }, require: ['tarikh_beroperasi'] }
    ],
    fields: [
      F_('aliran', 'Aliran', 'select', { required: true, sec: 'Identiti', options: ['Technology Startup', 'High-Income Gig', 'Social Enterprise'] }),
      F_('jenis', 'Jenis pelaksanaan', 'select', { required: true, options: ['Inkubator Fakulti', 'Co-working / Ruang Individu'] }),
      F_('fakulti', 'Fakulti', 'faculty', { required: true, extra: ['LAIN-LAIN'] }),
      F_('nama_inkubator', 'Nama inkubator / startup', 'text', { required: true }),
      F_('bidang_fokus', 'Bidang fokus', 'text'),
      F_('penerangan', 'Penerangan ringkas', 'textarea', { full: true }),
      F_('lokasi', 'Lokasi ruang', 'text', { sec: 'Lokasi' }),
      F_('kapasiti', 'Kapasiti (tempat duduk)', 'number', { min: 0 }),
      F_('didaftarkan', 'Didaftarkan?', 'yesno', { required: true, sec: 'Pengaktifan' }),
      F_('tarikh_pendaftaran', 'Tarikh pendaftaran', 'date'),
      F_('no_pendaftaran', 'No. pendaftaran / rujukan', 'text'),
      F_('status', 'Status pembangunan', 'select', { required: true, options: ['Dicadangkan', 'Dalam pembangunan', 'Beroperasi', 'Tidak aktif'] }),
      F_('tarikh_beroperasi', 'Tarikh beroperasi', 'date'),
      F_('tarikh_tidak_aktif', 'Tarikh tidak aktif', 'date'),
      F_('bil_ahli', 'Bilangan ahli pasukan', 'number', { min: 0, sec: 'Aktiviti' }),
      F_('bil_mentor', 'Bilangan mentor', 'number', { min: 0 }),
      F_('pic_nama', 'Nama PIC inkubator', 'text', { sec: 'Pengurusan' }),
      F_('pic_emel', 'E-mel PIC inkubator', 'email'),
      F_('lampiran', 'Pautan lampiran bukti', 'url'),
      F_('catatan', 'Catatan', 'textarea', { full: true })
    ]
  },
  {
    id: 'KAI2', prefix: 'M2', sheet: 'KAI2_Makerspace', group: 'Growth', fungsi: 'startup', entry: 'admin',
    title: 'KAI 2 · Perkasa UTM Makerspace jadi Hab Inovasi Pelajar', short: 'UTM Makerspace',
    unit: '% kemajuan projek', measure: 'progress', jenis: 'kemajuan',
    listColumns: ['id', 'fasa', 'nama_milestone', 'ptj', 'status', 'peratus_siap', 'pemberat'],
    statusField: 'status',
    rules: [
      { when: { field: 'status', in: ['Siap'] }, require: ['tarikh_siap'] }
    ],
    fields: [
      F_('fasa', 'Fasa', 'select', { required: true, sec: 'Identiti', options: ['Perancangan & Reka Bentuk', 'Perolehan (Tender)', 'Pengubahsuaian & Pemasangan', 'Pelancaran Rasmi & Operasi Penuh'] }),
      F_('nama_milestone', 'Nama milestone', 'text', { required: true }),
      F_('ptj', 'PTJ bertanggungjawab', 'select', { options: ['BPA', 'JTNCP', 'Library', 'UTMD', 'UTMXCITE'] }),
      F_('pegawai', 'Pegawai bertanggungjawab', 'text'),
      F_('status', 'Status', 'select', { required: true, sec: 'Kemajuan', options: ['Belum mula', 'Dalam proses', 'Siap', 'Tertunda'] }),
      F_('peratus_siap', 'Peratus siap (0-100)', 'number', { required: true, min: 0, max: 100 }),
      F_('pemberat', 'Pemberat terhadap keseluruhan projek (%)', 'number', { required: true, min: 0, max: 100 }),
      F_('tarikh_mula', 'Tarikh mula', 'date', { sec: 'Jadual' }),
      F_('tarikh_sasaran', 'Tarikh sasaran siap', 'date'),
      F_('tarikh_siap', 'Tarikh sebenar siap', 'date'),
      F_('no_tender', 'No. rujukan tender', 'text', { sec: 'Perolehan' }),
      F_('status_tender', 'Status tender', 'select', { options: ['Tidak berkaitan', 'Penyediaan', 'Iklan', 'Penilaian', 'Anugerah'] }),
      F_('peruntukan_rm', 'Peruntukan (RM)', 'number', { min: 0 }),
      F_('lampiran', 'Pautan lampiran bukti', 'url', { sec: 'Pengurusan' }),
      F_('isu', 'Isu / halangan', 'textarea', { full: true }),
      F_('catatan', 'Catatan', 'textarea', { full: true })
    ]
  },
  {
    id: 'KAI3', prefix: 'R3', sheet: 'KAI3_Ruang_Perniagaan', group: 'Growth', fungsi: 'startup', entry: 'admin',
    title: 'KAI 3 · Ruang & kemudahan perniagaan pelajar', short: 'Ruang Perniagaan',
    unit: 'ruang ditawarkan', measure: 'kai3', jenis: 'minimum',
    renamed: { kolej_fakulti: 'lokasi' }, // tajuk lajur lama dinamakan semula oleh setup() (data dikekalkan)
    retired: ['kaedah_perolehan', 'no_rujukan', 'anggaran_kos', 'ptj', 'pegawai', 'tarikh_dikenalpasti', 'tarikh_sasaran_siap', 'diwartakan', 'tarikh_diwartakan'], // lajur dibuang daripada Sheet oleh setup()
    listColumns: ['id', 'kod_lot', 'jenis_ruang', 'lokasi', 'status', 'penyewa_nama', 'penyewa_matrik', 'tarikh_ditawarkan'],
    statusField: 'status',
    rules: [
      { when: { field: 'status', in: ['Ditawarkan', 'Disewa'] }, require: ['tarikh_ditawarkan'] },
      { when: { field: 'status', in: ['Disewa'] }, require: ['penyewa_matrik', 'tarikh_mula_sewa'] }
    ],
    validate: kai3Validate_,
    fields: [
      F_('kod_lot', 'Nama / kod lot', 'text', { required: true, sec: 'Identiti' }),
      F_('jenis_ruang', 'Jenis ruang', 'select', { required: true, options: ['Student Mall', 'Student Union Building (SUB)', 'Kiosk / Lot Mudah Alih', 'Bilik / Ruang Perniagaan', 'Lain-lain'] }),
      F_('lokasi', 'Lokasi', 'text', { required: true }),
      F_('bangunan', 'Bangunan / zon', 'text'),
      F_('keluasan', 'Keluasan (m²)', 'number', { min: 0 }),
      F_('status', 'Status ruang', 'select', { required: true, sec: 'Status', options: ['Dikenal pasti', 'Spesifikasi disediakan', 'Dalam perolehan', 'Siap', 'Ditawarkan', 'Disewa', 'Tidak aktif'] }),
      F_('tarikh_ditawarkan', 'Tarikh ditawarkan kepada pelajar', 'date'),
      F_('penyewa_matrik', 'No. matrik penyewa', 'text', { sec: 'Sewaan', hint: 'Wajib jika status Disewa.' }),
      F_('penyewa_nama', 'Nama penyewa', 'text'),
      F_('penyewa_kp', 'No. KP penyewa', 'text'),
      F_('nama_perniagaan', 'Nama perniagaan', 'text'),
      F_('tarikh_mula_sewa', 'Tarikh mula sewa', 'date'),
      F_('tarikh_tamat_sewa', 'Tarikh tamat sewa', 'date'),
      F_('kadar_sewa', 'Kadar sewa (RM/bulan)', 'number', { min: 0 }),
      F_('lampiran', 'Pautan lampiran bukti', 'url', { sec: 'Pengurusan' }),
      F_('catatan', 'Catatan', 'textarea', { full: true })
    ]
  },
  {
    id: 'KAI4', prefix: 'G4', sheet: 'KAI4_GiGA', group: 'Transform', fungsi: 'latihan', entry: 'faculty',
    title: 'KAI 4 · Premium Gig Academy (GiGA)', short: 'GiGA',
    unit: 'pelajar mendaftar', measure: 'kai4', jenis: 'minimum', perFacultyTarget: 2,
    listColumns: ['id', 'nama_pelajar', 'no_matrik', 'fakulti', 'program', 'bidang_gig'],
    statusField: null, rules: [],
    validate: icValidate_,
    fields: [
      F_('fakulti', 'Fakulti', 'faculty', { required: true, sec: 'Pelajar' }),
      F_('nama_pelajar', 'Nama pelajar', 'text', { required: true }),
      F_('no_kp', 'No. KP / pasport', 'text', { required: true }),
      F_('no_matrik', 'No. matrik', 'text', { required: true }),
      F_('emel', 'E-mel', 'email'),
      F_('telefon', 'No. telefon', 'text'),
      F_('tahun_pengajian', 'Tahun pengajian', 'number', { min: 1, max: 8 }),
      F_('program', 'Program', 'text'),
      F_('bidang_gig', 'Bidang gig', 'text', { sec: 'GiGA' }),
      F_('mentor_nama', 'Nama mentor', 'text'),
      F_('gig_pendapatan', 'Pendapatan gig (RM)', 'number', { min: 0 }),
      F_('lampiran', 'Pautan lampiran bukti', 'url', { sec: 'Pengurusan' }),
      F_('catatan', 'Catatan', 'textarea', { full: true })
    ]
  },
  {
    id: 'KAI5', prefix: 'F5', sheet: 'KAI5_FSIP', group: 'Transform', fungsi: 'startup', entry: 'admin',
    title: 'KAI 5 · Founder Self-Internship Program (F-SIP)', short: 'F-SIP',
    unit: 'pelajar mendaftar', measure: 'kai5', jenis: 'minimum',
    listColumns: ['id', 'nama_pelajar', 'no_matrik', 'fakulti', 'nama_startup', 'status'],
    statusField: 'status',
    rules: [
      { when: { field: 'status', in: ['Mendaftar', 'Tamat'] }, require: ['tarikh_daftar'] }
    ],
    fields: [
      F_('fakulti', 'Fakulti', 'faculty', { required: true, sec: 'Pelajar' }),
      F_('nama_pelajar', 'Nama pelajar', 'text', { required: true }),
      F_('no_matrik', 'No. matrik', 'text', { required: true }),
      F_('no_kp', 'No. KP / pasport', 'text'),
      F_('emel', 'E-mel', 'email'),
      F_('telefon', 'No. telefon', 'text'),
      F_('program', 'Program', 'text'),
      F_('tahun_pengajian', 'Tahun pengajian', 'number', { min: 1, max: 8 }),
      F_('tarikh_bincang_caq', 'Tarikh perbincangan dengan CAQ & Fakulti', 'date', { sec: 'Kelulusan' }),
      F_('kelulusan_caq', 'Kelulusan Curriculum and Academic Quality (CAQ)', 'select', { options: ['Belum', 'Dalam semakan', 'Diluluskan', 'Tidak diluluskan'] }),
      F_('kelulusan_senat', 'Kelulusan Senat', 'select', { options: ['Belum', 'Dalam semakan', 'Diluluskan', 'Tidak diluluskan'] }),
      F_('kertas_konsep_status', 'Status kertas konsep', 'select', { options: ['Belum mula', 'Dalam penyediaan', 'Dihantar', 'Diluluskan'] }),
      F_('tarikh_hantar_kertas', 'Tarikh hantar kertas konsep', 'date'),
      F_('tarikh_lulus_kertas', 'Tarikh kertas konsep diluluskan', 'date'),
      F_('nama_startup', 'Nama startup / projek', 'text', { sec: 'Startup & latihan industri (LI)' }),
      F_('bidang', 'Bidang', 'text'),
      F_('ringkasan', 'Ringkasan idea', 'textarea', { full: true }),
      F_('penyelia_li', 'Penyelia LI (staf akademik)', 'text'),
      F_('mentor_industri', 'Mentor industri', 'text'),
      F_('status', 'Status program', 'select', { required: true, options: ['Dicalonkan', 'Dalam kelulusan', 'Mendaftar', 'Tamat', 'Tarik diri'] }),
      F_('tarikh_daftar', 'Tarikh mendaftar', 'date'),
      F_('tarikh_mula_li', 'Tarikh mula LI', 'date'),
      F_('tarikh_tamat_li', 'Tarikh tamat LI', 'date'),
      F_('lampiran', 'Pautan lampiran bukti', 'url', { sec: 'Pengurusan' }),
      F_('catatan', 'Catatan', 'textarea', { full: true })
    ]
  },
  {
    id: 'KAI6', prefix: 'A6', sheet: 'KAI6_AI_Startup', group: 'Transform', fungsi: 'startup', entry: 'faculty',
    title: 'KAI 6 · Tubuhkan UTM AI Start Up', short: 'UTM AI Start Up',
    unit: 'pelajar dilatih', measure: 'kai6', jenis: 'minimum', perFacultyTarget: 5,
    facultyWhitelist: ['FAI', 'FC', 'FKE', 'MJIIT'],
    listColumns: ['id', 'nama', 'no_matrik', 'fakulti', 'nama_startup', 'status', 'link_profil'],
    statusField: 'status', rules: [],
    fields: [
      F_('fakulti', 'Fakulti', 'faculty', { required: true, sec: 'Pelajar' }),
      F_('nama', 'Nama pelajar', 'text', { required: true }),
      F_('no_kp', 'No. KP / pasport', 'text'),
      F_('no_matrik', 'No. matrik', 'text', { required: true }),
      F_('nama_startup', 'Nama startup AI', 'text', { sec: 'Pasukan / startup' }),
      F_('nama_ahli_kumpulan', 'Ahli kumpulan (no. matrik)', 'people', { full: true, kp: false, format: 'numbered', noun: 'ahli kumpulan', max: 10 }),
      F_('no_pendaftaran_SSM', 'No. pendaftaran SSM', 'text'),
      F_('link_profil', 'Link profil', 'url', { hint: 'Pautan profil startup / pasukan (laman web, LinkedIn, Instagram dan seumpamanya).' }),
      F_('bidang_ai', 'Bidang AI', 'select', { options: ['Pendidikan dan Pembelajaran', 'Pentadbiran dan Pengurusan', 'Analisis Data dan Pelaporan', 'Automasi Proses Kerja', 'Penulisan dan Penjanaan Kandungan', 'Reka Bentuk dan Multimedia', 'Pemasaran dan Komunikasi', 'Perniagaan dan Keusahawanan', 'Penyelidikan dan Inovasi', 'Pengaturcaraan dan Pembangunan Sistem', 'Khidmat Pelanggan dan Chatbot', 'Lain-lain'] }),
      F_('ringkasan', 'Ringkasan idea', 'textarea', { full: true }),
      F_('mentor_industri', 'Mentor universiti/industri', 'text'),
      F_('startup_ditubuhkan', 'Startup ditubuhkan?', 'yesno'),
      F_('status', 'Peringkat', 'select', { required: true, options: PERINGKAT_STARTUP, sec: 'Pengurusan' }),
      F_('lampiran', 'Pautan lampiran bukti', 'url'),
      F_('catatan', 'Catatan', 'textarea', { full: true })
    ]
  },
  {
    id: 'DKAI1', prefix: 'D1', sheet: 'DKAI1_Pelan', group: 'Department', fungsi: 'rentas', entry: 'admin',
    title: 'DKAI 1 · Pelan Pemerkasaan Keusahawanan Pelajar', short: 'Pelan Keusahawanan',
    unit: '% kemajuan pelan', measure: 'progress', jenis: 'kemajuan',
    listColumns: ['id', 'peringkat', 'nama_milestone', 'suku_sasaran', 'status', 'peratus_siap', 'pemberat'],
    statusField: 'status',
    rules: [
      { when: { field: 'status', in: ['Siap'] }, require: ['tarikh_siap'] }
    ],
    fields: [
      F_('peringkat', 'Peringkat', 'select', { required: true, sec: 'Identiti', options: ['Bengkel Pra-Pelan', 'Kelulusan'] }),
      F_('nama_milestone', 'Nama milestone', 'text', { required: true }),
      F_('suku_sasaran', 'Suku tahun sasaran', 'select', { options: ['Q1', 'Q2', 'Q3', 'Q4'] }),
      F_('status', 'Status', 'select', { required: true, sec: 'Kemajuan', options: ['Belum mula', 'Dalam proses', 'Siap'] }),
      F_('peratus_siap', 'Peratus siap (0-100)', 'number', { required: true, min: 0, max: 100 }),
      F_('pemberat', 'Pemberat terhadap keseluruhan pelan (%)', 'number', { required: true, min: 0, max: 100 }),
      F_('tarikh_mula', 'Tarikh mula', 'date', { sec: 'Jadual' }),
      F_('tarikh_sasaran', 'Tarikh sasaran siap', 'date'),
      F_('tarikh_siap', 'Tarikh sebenar siap', 'date'),
      F_('tarikh_bengkel', 'Tarikh bengkel', 'date', { sec: 'Bengkel pra-pelan (Q1-Q2)' }),
      F_('tempat', 'Tempat', 'text'),
      F_('bil_peserta', 'Bilangan peserta', 'number', { min: 0 }),
      F_('pihak_terlibat', 'Pihak terlibat', 'text'),
      F_('output_draf', 'Output / draf pelan (pautan)', 'url'),
      F_('badan_kelulusan', 'Badan kelulusan', 'select', { sec: 'Kelulusan (Q3-Q4)', options: ['JKE HEPA', 'JPU', 'Lain-lain'] }),
      F_('tarikh_mesyuarat', 'Tarikh mesyuarat', 'date'),
      F_('keputusan', 'Keputusan', 'select', { options: ['Belum dikemukakan', 'Dikemukakan', 'Diluluskan', 'Dipinda'] }),
      F_('lampiran', 'Pautan lampiran bukti', 'url', { sec: 'Pengurusan' }),
      F_('isu', 'Isu / halangan', 'textarea', { full: true }),
      F_('catatan', 'Catatan', 'textarea', { full: true })
    ]
  },
  // ------------------------------------------------------------------ CKAI (Center Key Amal Indicator) - mengikut enam fungsi UTMXCITE
  {
    id: 'CKAI1', prefix: 'PF', sheet: 'CKAI1_Profiling_Pelajar', fungsi: 'minat', group: 'Center', entry: 'faculty',
    title: 'CKAI 1 · Bilangan profiling pelajar yang didaftarkan', short: 'Profiling Pelajar',
    unit: 'profiling didaftarkan', measure: 'profiling', jenis: 'minimum',
    // Satu rekod = satu pelajar yang telah diprofilkan (satu profil bagi setiap no. matrik). Medan akan diperhalusi apabila proses profiling direka.
    listColumns: ['id', 'nama_pelajar', 'no_matrik', 'fakulti', 'tarikh_profiling', 'tahap_minat', 'tahap_kesediaan'],
    statusField: 'tahap_minat', filter2: 'tahap_kesediaan',
    unique: ['no_matrik'],
    rules: [],
    fields: [
      F_('fakulti', 'Fakulti', 'faculty', { required: true, sec: 'Pelajar' }),
      F_('nama_pelajar', 'Nama pelajar', 'text', { required: true }),
      F_('no_kp', 'No. KP / pasport', 'text'),
      F_('no_matrik', 'No. matrik', 'text', { required: true }),
      F_('emel', 'E-mel', 'email'),
      F_('telefon', 'No. telefon', 'text'),
      F_('program', 'Program pengajian', 'text'),
      F_('tahun_pengajian', 'Tahun pengajian', 'number', { min: 1, max: 8 }),
      F_('tarikh_profiling', 'Tarikh profiling didaftarkan', 'date', { required: true, sec: 'Profiling' }),
      F_('sumber_profiling', 'Sumber profiling', 'select', { required: true, options: ['Tinjauan / soal selidik', 'Saringan fakulti', 'Pendaftaran minat', 'Rujukan pensyarah / mentor', 'Penyertaan program UTMXCITE', 'Lain-lain'] }),
      F_('tahap_minat', 'Tahap minat keusahawanan', 'select', { required: true, options: ['Tiada minat', 'Rendah', 'Sederhana', 'Tinggi'] }),
      F_('minat_bidang', 'Bidang minat', 'select', { options: ['Kejuruteraan & Teknologi', 'Digital / AI', 'Sains & Kesihatan', 'Alam Bina & Kemampanan', 'Sosial & Pendidikan', 'Perniagaan & Keusahawanan', 'Lain-lain'] }),
      F_('pengalaman_perniagaan', 'Pengalaman perniagaan', 'select', { options: ['Tiada', 'Pernah berniaga', 'Sedang berniaga'] }),
      F_('tahap_kesediaan', 'Tahap kesediaan', 'select', { options: ['Belum ada idea', 'Ada idea', 'Ada prototaip / MVP', 'Sudah beroperasi'] }),
      F_('kemahiran', 'Kemahiran / bakat', 'textarea', { full: true }),
      F_('catatan', 'Catatan', 'textarea', { full: true, sec: 'Pengurusan' })
    ]
  },
  {
    id: 'CKAI2', prefix: 'PK', sheet: 'CKAI2_Program_Keusahawanan', fungsi: 'latihan', group: 'Center', entry: 'faculty',
    title: 'CKAI 2 · Bilangan program keusahawanan', short: 'Program Keusahawanan',
    unit: 'program selesai', measure: 'program', jenis: 'minimum',
    listColumns: ['id', 'nama_program', 'kategori', 'fakulti', 'tarikh_mula', 'lokasi', 'bil_peserta', 'bajet_rm', 'pendapatan_rm', 'status'],
    statusField: 'status',
    rules: [{ when: { field: 'status', in: ['Selesai'] }, require: PROGRAM_DONE_REQUIRE }],
    validate: programValidate_,
    fields: programFields_(['Bengkel', 'Kursus / Latihan', 'Bootcamp', 'Pertandingan', 'Seminar / Forum', 'Mentoring', 'Lain-lain'])
  },
  {
    id: 'CKAI3', prefix: 'PI', sheet: 'CKAI3_Program_Inovasi', fungsi: 'ideasi', group: 'Center', entry: 'faculty',
    title: 'CKAI 3 · Bilangan program inovasi', short: 'Program Inovasi',
    unit: 'program selesai', measure: 'program', jenis: 'minimum',
    listColumns: ['id', 'nama_program', 'kategori', 'fakulti', 'tarikh_mula', 'lokasi', 'bil_peserta', 'bajet_rm', 'pendapatan_rm', 'status'],
    statusField: 'status',
    rules: [{ when: { field: 'status', in: ['Selesai'] }, require: PROGRAM_DONE_REQUIRE }],
    validate: programValidate_,
    fields: programFields_(['Bengkel', 'Hackathon / Pertandingan', 'Pameran / Showcase', 'Latihan Teknikal', 'Seminar / Forum', 'Lain-lain'])
  },
  {
    id: 'CKAI4', prefix: 'SS', sheet: 'CKAI4_SSU', fungsi: 'startup', group: 'Center', entry: 'admin',
    title: 'CKAI 4 · Bilangan pendaftaran SSU (Sistem Syarikat Universiti)', short: 'Pendaftaran SSU',
    unit: 'pendaftaran SSU', measure: 'ssu', jenis: 'minimum',
    listColumns: ['id', 'nama_syarikat', 'nama_pelajar', 'no_matrik', 'fakulti', 'tarikh_daftar', 'status'],
    statusField: 'status',
    rules: [
      { when: { field: 'status_ssm', in: ['Berdaftar'] }, require: ['tarikh_ssm', 'no_daftar_ssm'] },
      { when: { field: 'berasaskan_inovasi', in: ['Ya'] }, require: ['trl_syarikat'] }],
    validate: ssuValidate_,
    fields: [
      F_('fakulti', 'Fakulti', 'faculty', { required: true, sec: 'Pemilik' }),
      F_('nama_pelajar', 'Nama pemilik', 'text', { required: true }),
      F_('no_kp', 'No. KP / pasport', 'text', { required: true }),
      F_('no_matrik', 'No. matrik', 'text', { required: true }),
      F_('emel', 'E-mel', 'email'),
      F_('telefon', 'No. telefon', 'text'),
      F_('jantina', 'Jantina', 'text'),
      F_('bangsa', 'Bangsa', 'text'),
      F_('bidang_pengajian', 'Bidang pengajian', 'text'),
      F_('nama_syarikat', 'Nama syarikat / perniagaan', 'text', { required: true, sec: 'Pendaftaran SSU' }),
      F_('jenis_perniagaan', 'Jenis perniagaan', 'select', { required: true, options: JENIS_PERNIAGAAN }),
      F_('jenis_perniagaan_lain', 'Nama jenis perniagaan lain', 'text'),
      F_('jenis_milikan', 'Jenis milikan', 'select', { options: JENIS_MILIKAN }),
      F_('bil_rakan_kongsi', 'Bilangan rakan kongsi perniagaan (termasuk pemilik / ketua pasukan)', 'number', { required: true, min: 1, max: 13 }),
      F_('bilangan_pekerja', 'Bilangan pekerja', 'select', { options: BILANGAN_PEKERJA }),
      F_('no_ssu', 'No. pendaftaran SSU', 'text', { required: true }),
      F_('tarikh_daftar', 'Tarikh pendaftaran', 'date', { required: true }),
      F_('status_ssm', 'Status pendaftaran SSM', 'select', { required: true, options: ['Berdaftar', 'Tidak Berdaftar'] }),
      F_('tarikh_ssm', 'Tarikh pendaftaran SSM', 'date', { hint: 'Wajib jika status SSM Berdaftar.' }),
      F_('no_daftar_ssm', 'No. pendaftaran SSM', 'text', { hint: 'Wajib jika status SSM Berdaftar.' }),
      F_('link_website_perniagaaan', 'Pautan laman web perniagaan', 'text'),
      F_('punca_modal', 'Punca modal', 'select', { options: PUNCA_MODAL, sec: 'Kewangan' }),
      F_('modal_awal', 'Jumlah modal awal (RM)', 'select', { options: JUMLAH_MODAL }),
      F_('jumlah_jualan', 'Jumlah jualan (RM)', 'number', { min: 0 }),
      F_('penyata_bank', 'Penyata bank (PDF)', 'file', { full: true, hint: 'PDF sahaja, maksimum 5 MB.' }),
      F_('tarikh_mula_perniagaan', 'Tarikh mula perniagaan', 'date'),
      F_('catatan', 'Catatan', 'textarea', { full: true, sec: 'Pengurusan' }),
      F_('status', 'Status', 'select', { required: true, options: ['Aktif', 'Tidak Aktif'], sec: 'KPT 5 · inovasi dan teknologi' }),
      F_('berasaskan_inovasi', 'Berasaskan inovasi dan teknologi?', 'yesno'),
      F_('trl_syarikat', 'TRL syarikat (TRL 4 hingga 6)', 'select', { options: ['TRL 4', 'TRL 5', 'TRL 6'], short: 'TRL' })
    ]
  },
  {
    id: 'CKAI5', prefix: 'MS', sheet: 'CKAI5_Makerspace', fungsi: 'startup', group: 'Center', entry: 'admin',
    title: 'CKAI 5 · Bilangan penggunaan Makerspace', short: 'Penggunaan Makerspace',
    unit: 'pengguna', measure: 'makerspace', jenis: 'minimum',
    listColumns: ['id', 'nama', 'no_matrik', 'peralatan', 'tarikh_mula', 'bil_peserta', 'status_bayaran', 'bayaran_rm', 'borang'],
    statusField: 'status_bayaran',
    rules: [{ when: { field: 'peralatan', in: ['Lain-lain (Other)'] }, require: ['peralatan_lain'] }],
    validate: makerspaceValidate_, unique: ['sumber_kunci'],
    fields: [
      F_('emel', 'E-mel', 'email', { required: true, sec: 'Pemohon' }),
      F_('nama', 'Nama penuh', 'text', { required: true }),
      F_('no_kp', 'No. KP / pasport', 'text', { required: true }),
      F_('no_matrik', 'No. matrik', 'text', { required: true }),
      F_('fakulti', 'Fakulti', 'faculty', { required: true }),
      F_('kelas', 'Jabatan / unit / kelas', 'text'),
      F_('telefon', 'No. telefon', 'text', { required: true }),
      F_('peralatan', 'Peralatan dipohon', 'select', { required: true, sec: 'Permohonan', options: ['3D Printer', 'Laser Cutter Machine', 'Peralatan Tangan (Tools)', 'Sewaan Ruang (Space Rental)', 'Lain-lain (Other)'] }),
      F_('peralatan_lain', 'Nama peralatan lain', 'text', { hint: 'Wajib jika memilih Lain-lain (Other).' }),
      F_('tujuan', 'Tujuan permohonan', 'textarea', { required: true, full: true }),
      F_('bil_peserta', 'Bil. peserta', 'number', { required: true, min: 1 }),
      F_('tarikh_mula', 'Tarikh mula', 'date', { required: true, sec: 'Tarikh dan masa' }),
      F_('tarikh_tamat', 'Tarikh tamat', 'date', { required: true }),
      F_('masa_mula', 'Masa mula', 'time', { required: true }),
      F_('masa_tamat', 'Masa tamat', 'time', { required: true }),
      F_('status_bayaran', 'Bayaran caj', 'select', { required: true, sec: 'Caj perkhidmatan', options: ['Bayar', 'Belum Dibayar', 'Tiada Caj'] }),
      F_('bayaran_rm', 'Bayaran (RM)', 'number', { short: 'Bayaran RM', min: 0, def: 5, hint: 'Lalai RM5. Diset RM0 secara automatik jika "Tiada Caj".' }),
      F_('borang', 'Borang permohonan (PDF)', 'file', { full: true, sec: 'Dokumen' }),
      F_('sumber_kunci', 'Kunci sumber', 'text', { hidden: true })
    ]
  },
  {
    id: 'CKAI6', prefix: 'SI', sheet: 'CKAI6_Sewaan_Inkubator', fungsi: 'startup', group: 'Center', entry: 'admin',
    title: 'CKAI 6 · Pendapatan sewaan ruang niaga', short: 'Sewaan ruang niaga',
    unit: 'RM sewaan diterima', measure: 'rent', jenis: 'minimum', valueFormat: 'rm',
    listColumns: ['id', 'tempoh', 'nama_pelajar', 'no_matrik', 'inkubator', 'penyewa', 'jumlah_rm', 'status_bayaran'],
    statusField: 'status_bayaran',
    rules: [{ when: { field: 'status_bayaran', in: ['Dibayar'] }, require: ['tarikh_bayar'] }, { when: { field: 'inkubator', in: ['Lain-lain'] }, require: ['inkubator_lain'] }],
    fields: [
      F_('tempoh', 'Bulan', 'month', { required: true, sec: 'Sewaan bulanan' }),
      F_('no_matrik', 'No. matrik pelajar', 'text', { required: true, sec: 'Pelajar penyewa' }),
      F_('nama_pelajar', 'Nama pelajar', 'text'),
      F_('no_kp', 'No. KP / pasport', 'text'),
      F_('inkubator', 'Ruang niaga', 'select', { required: true, sec: 'Ruang dan sewaan', options: LOKASI_PERNIAGAAN }),
      F_('inkubator_lain', 'Nama ruang niaga lain', 'text', { hint: 'Wajib jika memilih Lain-lain.' }),
      F_('penyewa', 'Penyewa (syarikat / pasukan)', 'text', { required: true }),
      F_('jumlah_rm', 'Jumlah sewa (RM)', 'number', { required: true, min: 0 }),
      F_('status_bayaran', 'Status bayaran', 'select', { required: true, options: ['Dibayar', 'Belum dibayar', 'Tertunggak'] }),
      F_('tarikh_bayar', 'Tarikh bayaran', 'date'),
      F_('no_resit', 'No. resit / rujukan', 'text'),
      F_('lampiran', 'Pautan lampiran bukti', 'url', { sec: 'Pengurusan' }),
      F_('catatan', 'Catatan', 'textarea', { full: true })
    ]
  },
  {
    id: 'CKAI7', prefix: 'PP', sheet: 'CKAI7_Pendapatan_Pelajar', fungsi: 'prestasi', group: 'Center', entry: 'faculty',
    title: 'CKAI 7 · Pendapatan usahawan pelajar', short: 'Pendapatan Usahawan',
    unit: 'RM pendapatan', measure: 'income', jenis: 'minimum', valueFormat: 'rm',
    listColumns: ['id', 'Tahun', 'Bulan', 'nama_pelajar', 'no_matrik', 'nama_perniagaan', 'fakulti', 'jenis_perniagaan', 'pendapatan_bulanan'],
    statusField: null,
    rules: [],
    validate: icValidate_,
    fields: [
      F_('fakulti', 'Fakulti', 'faculty', { required: true, sec: 'Pendapatan bulanan' }),
      F_('Tahun', 'Tahun', 'number', { required: true, min: 2026, max: 2030 }),
      F_('Bulan', 'Bulan', 'select', { required: true, options: BULAN_MS }),
      F_('nama_pelajar', 'Nama pelajar', 'text'),
      F_('no_kp', 'No. KP / pasport', 'text', { required: true }),
      F_('no_matrik', 'No. matrik', 'text'),
      F_('jantina', 'Jantina', 'text'),
      F_('bangsa', 'Bangsa', 'text'),
      F_('bidang_pengajian', 'Bidang pengajian', 'text'),
      F_('nama_perniagaan', 'Nama perniagaan / syarikat', 'text', { required: true, sec: 'Perniagaan' }),
      F_('no_ssu', 'No. pendaftaran SSU (jika ada)', 'text'),
      F_('no_ssm', 'No. pendaftaran SSM (jika ada)', 'text'),
      F_('jenis_milikan', 'Jenis milikan', 'select', { options: JENIS_MILIKAN }),
      F_('jenis_perniagaan', 'Jenis perniagaan', 'select', { options: JENIS_PERNIAGAAN }),
      F_('punca_modal', 'Punca modal', 'select', { options: PUNCA_MODAL, sec: 'Kewangan' }),
      F_('jumlah_modal', 'Jumlah modal awal (RM)', 'select', { options: JUMLAH_MODAL }),
      F_('pendapatan_bulanan', 'Pendapatan bulanan (RM)', 'number', { required: true, min: 0 }),
      F_('bilangan_pekerja', 'Bilangan pekerja', 'select', { options: BILANGAN_PEKERJA }),
      F_('link_website', 'Pautan laman web', 'text'),
      F_('Penyata_bank', 'Penyata bank (PDF)', 'file', { full: true, sec: 'Dokumen', hint: 'PDF sahaja, maksimum 5 MB.' }),
      F_('tarikh_mula_perniagaan', 'Tarikh mula perniagaan', 'date'),
      F_('lokasi_perniagaan_lain', 'Lokasi perniagaan', 'text'),
      F_('catatan', 'Catatan', 'textarea', { full: true })
    ]
  },
  {
    id: 'CKAI8', prefix: 'IN', sheet: 'CKAI8_Inovasi_Pelajar', fungsi: 'pameran', group: 'Center', entry: 'faculty',
    title: 'CKAI 8 · Bilangan inovasi pelajar yang dihasilkan', short: 'Inovasi Pelajar',
    unit: 'inovasi menyertai pertandingan', measure: 'innovation', jenis: 'minimum',
    // OD: projek inovasi pelajar yang TELAH menyertai pertandingan, sekurang-kurangnya peringkat Fakulti.
    listColumns: ['id', 'tajuk_inovasi', 'fakulti', 'nama_pertandingan', 'peringkat', 'tarikh', 'pingat', 'status_peningkatan'],
    statusField: 'peringkat', filter2: 'status_peningkatan',
    rules: [
      { when: { field: 'status_peningkatan', in: ['Calon peningkatan', 'Sedang disokong', 'Telah dibawa ke peringkat lebih tinggi'] }, require: ['peringkat_sasaran'] }
    ],
    fields: [
      F_('fakulti', 'Fakulti', 'faculty', { required: true, sec: 'Inovasi' }),
      F_('tajuk_inovasi', 'Tajuk inovasi / projek', 'text', { required: true }),
      F_('jenis_inovasi', 'Jenis inovasi', 'select', { required: true, options: ['Produk fizikal', 'Aplikasi / perisian', 'Perkhidmatan', 'Proses / kaedah', 'Model perniagaan', 'Lain-lain'] }),
      F_('bidang', 'Bidang', 'select', { options: ['Kejuruteraan & Teknologi', 'Digital / AI', 'Sains & Kesihatan', 'Alam Bina & Kemampanan', 'Sosial & Pendidikan', 'Perniagaan & Keusahawanan', 'Lain-lain'] }),
      F_('penerangan', 'Penerangan ringkas (masalah dan penyelesaian)', 'textarea', { full: true }),
      F_('trl', 'Tahap kesediaan teknologi (TRL)', 'select', { options: ['TRL 1', 'TRL 2', 'TRL 3', 'TRL 4', 'TRL 5', 'TRL 6', 'TRL 7', 'TRL 8', 'TRL 9'] }),
      F_('status_ip', 'Status harta intelek (IP)', 'select', { options: ['Tiada', 'Dalam proses permohonan', 'Didaftarkan (paten / hak cipta / reka bentuk)'] }),
      F_('nama_pasukan', 'Nama pasukan', 'text', { sec: 'Pasukan' }),
      F_('mentor', 'Nama mentor / penyelia', 'text', { required: true }),
      F_('pelajar', 'Pelajar (no. matrik)', 'people', { required: true, full: true }),
      F_('status_penyertaan', 'Status penyertaan', 'select', { required: true, sec: 'Pertandingan', options: ['Akan menyertai', 'Telah menyertai'] }),
      F_('nama_pertandingan', 'Nama pertandingan', 'text', { required: true }),
      F_('penganjur_pertandingan', 'Penganjur pertandingan', 'text'),
      F_('peringkat', 'Peringkat pertandingan', 'select', { required: true, options: ['Fakulti', 'Universiti', 'Kebangsaan', 'Antarabangsa'] }),
      F_('tarikh', 'Tarikh pertandingan', 'date', { required: true }),
      F_('lokasi', 'Tempat / negara', 'text'),
      F_('pingat', 'Pingat / kedudukan (jika menang)', 'select', { sec: 'Anugerah (pilihan, jika menang)', options: ['Emas', 'Perak', 'Gangsa', 'Johan', 'Naib Johan', 'Tempat Ketiga', 'Anugerah Khas', 'Penghargaan / Pengiktirafan'] }),
      F_('nama_anugerah', 'Nama anugerah', 'text'),
      F_('nilai_hadiah_rm', 'Nilai hadiah / geran (RM)', 'number', { min: 0 }),
      F_('sijil', 'Sijil (PDF, maksimum 5 MB)', 'file', { full: true }),
      F_('status_peningkatan', 'Status peningkatan', 'select', { sec: 'Peningkatan ke peringkat lebih tinggi', options: ['Belum dinilai', 'Calon peningkatan', 'Sedang disokong', 'Telah dibawa ke peringkat lebih tinggi', 'Tidak diteruskan'] }),
      F_('peringkat_sasaran', 'Peringkat sasaran seterusnya', 'select', { options: ['Universiti', 'Kebangsaan', 'Antarabangsa'] }),
      F_('pertandingan_seterusnya', 'Pertandingan / program seterusnya', 'text'),
      F_('tarikh_seterusnya', 'Tarikh seterusnya', 'date'),
      F_('sokongan_diperlukan', 'Sokongan diperlukan (pembiayaan, mentor, IP, prototaip, dll.)', 'textarea', { full: true }),
      F_('pautan_demo', 'Pautan video / demo / poster', 'url', { sec: 'Pengurusan' }),
      F_('catatan', 'Catatan', 'textarea', { full: true })
    ]
  },
  {
    id: 'CKAI9', prefix: 'AN', sheet: 'CKAI9_Anugerah', fungsi: 'pameran', group: 'Center', entry: 'faculty',
    title: 'CKAI 9 · Anugerah & pengiktirafan inovasi dan keusahawanan', short: 'Anugerah & Pengiktirafan',
    unit: 'anugerah / pengiktirafan', measure: 'award', jenis: 'minimum',
    listColumns: ['id', 'nama_anugerah', 'agensi', 'peringkat', 'program', 'fakulti', 'tarikh', 'pelajar', 'sijil'],
    statusField: 'peringkat',
    rules: [{ when: { field: 'program', in: ['Lain-lain'] }, require: ['program_lain'] }],
    fields: [
      F_('fakulti', 'Fakulti', 'faculty', { required: true, sec: 'Anugerah / pengiktirafan' }),
      F_('nama_anugerah', 'Nama anugerah / pengiktirafan', 'text', { required: true }),
      F_('tarikh', 'Tarikh', 'date', { required: true }),
      F_('agensi', 'Agensi / badan penganugerah', 'text', { required: true }),
      F_('peringkat', 'Peringkat', 'select', { required: true, options: ['Fakulti', 'Universiti', 'Kebangsaan', 'Antarabangsa'] }),
      F_('kategori', 'Kategori', 'select', { required: true, options: ['Inovasi', 'Keusahawanan'] }),
      F_('pingat', 'Pingat / kedudukan', 'select', { options: ['Emas', 'Perak', 'Gangsa', 'Johan', 'Naib Johan', 'Tempat Ketiga', 'Anugerah Khas', 'Penghargaan / Pengiktirafan'] }),
      F_('nilai_hadiah_rm', 'Nilai hadiah / geran (RM)', 'number', { min: 0 }),
      F_('lokasi', 'Lokasi / negara', 'text'),
      F_('program', 'Program', 'select', { required: true, sec: 'Program & projek', options: ['UTM Launchpad', 'UTM Makerspace', 'GiGAUTM Ascend (GiGA)', 'F-SIP', 'UTM AI Start Up', 'Program Keusahawanan Fakulti', 'Program Inovasi Fakulti', 'Lain-lain'] }),
      F_('program_lain', 'Nama program (jika Lain-lain)', 'text'),
      F_('nama_pasukan', 'Nama pasukan', 'text'),
      F_('produk_projek', 'Nama produk / projek / syarikat', 'text'),
      F_('mentor', 'Nama mentor / fasilitator', 'text', { required: true, sec: 'Mentor & pelajar' }),
      F_('pelajar', 'Pelajar (no. matrik)', 'people', { required: true, full: true }),
      F_('sijil', 'Sijil (PDF, maksimum 5 MB)', 'file', { required: true, full: true, sec: 'Bukti' }),
      F_('pautan_media', 'Pautan berita / media', 'url'),
      F_('catatan', 'Catatan', 'textarea', { full: true })
    ]
  },
  {
    id: 'CKAI10', prefix: 'TA', sheet: 'CKAI10_Perbelanjaan_Operasi', fungsi: 'rentas', group: 'Center', entry: 'admin',
    title: 'CKAI 10 · Jumlah perbelanjaan operasi', short: 'Perbelanjaan Operasi',
    unit: '% peruntukan digunakan', measure: 'tabung', jenis: 'penggunaan',
    listColumns: ['id', 'tempoh', 'tabung', 'no_chargeline', 'peruntukan_awal', 'komitmen', 'perbelanjaan', 'baki', 'peratus'],
    statusField: null,
    unique: ['kunci'],
    rules: [{ when: { field: 'tabung', in: ['Lain-lain'] }, require: ['tabung_lain', 'no_chargeline'] }],
    validate: tabungValidate_,
    fields: [
      F_('tempoh', 'Bulan laporan', 'month', { required: true, sec: 'Kedudukan kewangan tabung', hint: 'Perbelanjaan dilaporkan terkumpul sehingga bulan ini (sejak awal tahun).' }),
      F_('tabung', 'Nama tabung', 'select', { required: true, errorOn: 'tabung', options: TABUNG_AMANAH.map(function (t) { return t.nama; }).concat(['Lain-lain']) }),
      F_('tabung_lain', 'Nama tabung lain', 'text', { hint: 'Wajib jika memilih Lain-lain.' }),
      F_('no_chargeline', 'No. chargeline', 'text', { short: 'Chargeline', autoFrom: 'tabung', autoMap: TABUNG_AMANAH.reduce(function (m, t) { m[t.nama] = t.chargeline; return m; }, {}), hint: 'Diisi automatik apabila tabung yang disenaraikan dipilih. Isi sendiri hanya bagi Lain-lain.' }),
      F_('peruntukan_awal', 'Peruntukan / baki awal (a)', 'number', { min: 0, short: 'Peruntukan (a)' }),
      F_('komitmen', 'Komitmen (b)', 'number', { min: 0, short: 'Komitmen (b)', hint: 'Isi hanya jika berubah. Jika kosong, nilai bulan sebelumnya digunakan.' }),
      F_('perbelanjaan', 'Perbelanjaan sehingga bulan ini (c)', 'number', { required: true, min: 0, short: 'Belanja (c)' }),
      F_('bajet_sasaran', 'Bajet disasarkan sehingga bulan ini (RM)', 'number', { min: 0, short: 'Bajet sasaran', hint: 'Pilihan. Digunakan untuk mengira penjimatan berbanding bajet yang disasarkan.' }),
      F_('baki', 'Baki tabung d = a - (b + c)', 'number', { hidden: true, short: 'Baki (d)' }),
      F_('peratus', '% perbelanjaan daripada peruntukan', 'number', { hidden: true, short: '% belanja' }),
      F_('kunci', 'Kunci', 'text', { hidden: true, errorOn: 'tabung' }),
      F_('lampiran', 'Lampiran laporan (PDF)', 'file', { full: true, sec: 'Dokumen', hint: 'Laporan kedudukan kewangan dalam format PDF, maksimum 5 MB.' }),
      F_('catatan', 'Catatan', 'textarea', { full: true })
    ]
  }
];

/**
 * KPI yang menyimpan data pelajar: hanya no. matrik dimasukkan; medan lain (nama, no. KP, e-mel, telefon, fakulti)
 * disalin daripada tab PELAJAR semasa simpan. map = {lajur PELAJAR: medan KPI}. Medan itu ditanda `derived` (tidak dipaparkan pada borang).
 * Medan fakulti hanya diambil bagi KPI Admin sahaja (pada KPI fakulti, fakulti ialah unit pelapor PIC).
 */
var STUDENT_MATRIK_KEY = { KAI3: 'penyewa_matrik' };   // lalai: no_matrik
var STUDENT_MAPS = {
  KAI3: { nama_pelajar: 'penyewa_nama', no_kp: 'penyewa_kp' },
  KAI4: { nama_pelajar: 'nama_pelajar', no_kp: 'no_kp', emel: 'emel', telefon: 'telefon' },
  KAI5: { nama_pelajar: 'nama_pelajar', no_kp: 'no_kp', emel: 'emel', telefon: 'telefon', fakulti: 'fakulti' },
  KAI6: { nama_pelajar: 'nama', no_kp: 'no_kp', fakulti: 'fakulti' },
  CKAI1: { nama_pelajar: 'nama_pelajar', no_kp: 'no_kp', emel: 'emel', telefon: 'telefon', fakulti: 'fakulti' },
  CKAI4: { nama_pelajar: 'nama_pelajar', no_kp: 'no_kp', emel: 'emel', telefon: 'telefon', fakulti: 'fakulti', jantina: 'jantina', bangsa: 'bangsa', bidang_pengajian: 'bidang_pengajian' },
  CKAI5: { nama_pelajar: 'nama', no_kp: 'no_kp', emel: 'emel', telefon: 'telefon', fakulti: 'fakulti' },
  CKAI6: { nama_pelajar: 'nama_pelajar', no_kp: 'no_kp' },
  CKAI7: { nama_pelajar: 'nama_pelajar', no_kp: 'no_kp', fakulti: 'fakulti', jantina: 'jantina', bangsa: 'bangsa', bidang_pengajian: 'bidang_pengajian' },
  KPT2: { nama_pelajar: 'nama', no_kp: 'no_kp', jantina: 'jantina', bangsa: 'bangsa', bidang_pengajian: 'bidang_pengajian' },
  KPT4: { nama_pelajar: 'nama', no_kp: 'no_kp' }
};
KPIS.forEach(function (k) {
  var map = STUDENT_MAPS[k.id];
  if (!map) return;
  // Fakulti pelajar (daripada PELAJAR). KPI fakulti: medan berasingan `fakulti_pelajar` (medan `fakulti` kekal unit pelapor PIC).
  // KPI Admin: medan `fakulti` sendiri diambil daripada PELAJAR (ditambah jika belum ada, contoh CKAI 6).
  if (!map.fakulti && ['KPT2', 'KPT4', 'KAI4'].indexOf(k.id) < 0) {
    var hasFak = k.fields.some(function (f) { return f.key === 'fakulti'; });
    var at = k.fields.map(function (f) { return f.key; }).indexOf(map.no_kp);
    if (hasFak && k.entry === 'faculty') { map.fakulti = 'fakulti_pelajar'; k.fields.splice(at + 1, 0, F_('fakulti_pelajar', 'Fakulti pelajar', 'faculty')); }
    else if (!hasFak) {
      var fkKey = k.id === 'KAI3' ? 'penyewa_fakulti' : 'fakulti';
      map.fakulti = fkKey; k.fields.splice(at + 1, 0, F_(fkKey, k.id === 'KAI3' ? 'Fakulti penyewa' : 'Fakulti', 'faculty'));
    }
  }
  var mkKey = STUDENT_MATRIK_KEY[k.id] || 'no_matrik';
  k.student = { matrik: mkKey, map: map };
  k.fields.forEach(function (f) {
    if (f.key === mkKey) {
      if (k.id !== 'KPT2' && k.id !== 'KAI3') f.required = true;
      f.hint = (f.hint ? f.hint + ' ' : '') + 'Masukkan no. matrik sahaja; maklumat lain diambil daripada data PELAJAR. Jika pelajar belum ada, tetingkap untuk melengkapkannya akan dipaparkan.';
    }
    for (var col in map) {
      if (map.hasOwnProperty(col) && map[col] === f.key) { f.derived = true; f.autoShow = (col === 'nama_pelajar' || col === 'no_kp' || col === 'fakulti') ? col : undefined; f.derivedRequired = !!f.required; f.required = false; f.hint = undefined; }
    }
  });
});

/**
 * Tajuk lajur lama -> baharu (selepas pengemaskinian senarai lajur). setup() menamakan semula tajuk, atau menyalin
 * nilai lajur lama ke lajur baharu yang masih kosong supaya data sedia ada tidak hilang.
 */
var COLUMN_RENAMES = {
  CKAI7: { pendapatan_rm: 'pendapatan_bulanan', laporan_kewangan: 'Penyata_bank', laporan_kewangan_pautan: 'Penyata_bank_pautan' },
  KPT2: { tarikh_penubuhan: 'tarikh_pernigaan', no_pendaftaran: 'no_pendaftaran_ssm' },
  KPT4: { projek: 'nama_projek_inovasi', trl: 'level_TRL', lampiran: 'bukti_inovasi', lampiran_pautan: 'bukti_inovasi_pautan' },
  KPT6: { rakan: 'rakan_institusi', tarikh: 'tarikh_mula', lampiran: 'laporan_kolabrasi', lampiran_pautan: 'laporan_kolabrasi_pautan' },
  KPT7: { tarikh: 'tarikh_mula_embiayaan' },
  KAI6: { nama_pelajar: 'nama', no_ssm: 'no_pendaftaran_SSM' }
};
KPIS.forEach(function (k) {
  k.level = k.id.replace(/\d+$/, '');
  if (COLUMN_RENAMES[k.id]) { k.renamed = k.renamed || {}; for (var o in COLUMN_RENAMES[k.id]) { if (COLUMN_RENAMES[k.id].hasOwnProperty(o)) k.renamed[o] = COLUMN_RENAMES[k.id][o]; } }
});

/** Baris milestone awal bagi KPI berasaskan kemajuan (pemberat boleh diubah Admin). */
var MILESTONE_SEED = {
  KAI2: [
    { fasa: 'Perancangan & Reka Bentuk', nama_milestone: 'Perancangan & reka bentuk ruang', ptj: 'BPA' },
    { fasa: 'Perolehan (Tender)', nama_milestone: 'Proses perolehan (tender)', ptj: 'BPA' },
    { fasa: 'Pengubahsuaian & Pemasangan', nama_milestone: 'Pengubahsuaian dan pemasangan', ptj: 'JTNCP' },
    { fasa: 'Pelancaran Rasmi & Operasi Penuh', nama_milestone: 'Pelancaran rasmi dan operasi penuh', ptj: 'UTMXCITE' }
  ].map(function (m) { m.pemberat = 25; m.peratus_siap = 0; m.status = 'Belum mula'; return m; }),
  DKAI1: [
    { peringkat: 'Bengkel Pra-Pelan', nama_milestone: 'Bengkel pra-pelan', suku_sasaran: 'Q2', pemberat: 50 },
    { peringkat: 'Kelulusan', nama_milestone: 'Kelulusan JKE HEPA & JPU', suku_sasaran: 'Q4', pemberat: 50 }
  ].map(function (m) { m.peratus_siap = 0; m.status = 'Belum mula'; return m; })
};

/** Sasaran awal (minimum). Boleh disunting dalam tab "Sasaran". [kpi, tahun, sasaran, q1..q4, jenis, bajet, catatan] */
function buildTargetSeed_() {
  var rows = [];
  function add(kpi, year, target, q, jenis, bajet, note) {
    q = q || [];
    rows.push([kpi, year, target, q[0] === undefined ? '' : q[0], q[1] === undefined ? '' : q[1],
      q[2] === undefined ? '' : q[2], q[3] === undefined ? '' : q[3], jenis, bajet || '', note || '']);
  }
  [2026, 2027, 2028, 2029, 2030].forEach(function (y) {
    add('KAI1', y, 20, y === 2026 ? [5, 10, 15, 20] : [], 'minimum', y === 2026 ? 130000 : '', y === 2026 ? 'Inisiatif: 13 inkubator fakulti (RM130,000) + 10 co-working/ruang individu' : '');
  });
  add('KAI2', 2026, 60, [15, 30, 45, 60], 'kemajuan', 1000000, 'Satu ruang strategik Makerspace moden (anggaran RM1 juta)');
  add('KAI2', 2027, 80, [65, 70, 75, 80], 'kemajuan', '', '');
  add('KAI2', 2028, 100, [85, 90, 95, 100], 'kemajuan', '', 'Siap 100% menjelang 2028');
  [25, 30, 35, 40, 45].forEach(function (t, i) {
    add('KAI3', 2026 + i, t, i === 0 ? [10, 15, 20, 25] : [], 'minimum', '', i === 0 ? 'Minimum ruang ditawarkan kepada pelajar untuk disewa (+5 setiap tahun)' : '');
  });
  [2026, 2027, 2028, 2029, 2030].forEach(function (y) {
    add('KAI4', y, 20, y === 2026 ? [5, 10, 15, 20] : [], 'minimum', y === 2026 ? 200000 : '', y === 2026 ? 'Cadangan 2 pelajar setiap fakulti' : '');
    add('KAI5', y, 4, y === 2026 ? ['', 2, '', 4] : [], 'minimum', '', '');
    add('KAI6', y, 20, [], 'minimum', y === 2026 ? 400000 : '', y === 2026 ? 'Minimum 5 pelajar setiap fakulti (FAI, FC, FKE, MJIIT). Sasaran sekunder startup AI: Q1 0, Q2 1, Q3 2, Q4 3' : '');
  });
  add('DKAI1', 2026, 100, [], 'kemajuan', '', 'Projek sekali sahaja, mesti siap pada 2026');
  // KPT: sasaran tahunan mengikut Kamus KPI Keusahawanan IPT 2026-2030
  var kptT = { KPT1: [80000, 85000, 90000, 95000, 100000], KPT2: [10, 10.5, 11, 11.5, 12], KPT3: [10, 10.5, 11, 11.5, 12], KPT4: [600, 700, 800, 900, 1000], KPT5: [60, 65, 70, 75, 80], KPT6: [80, 85, 90, 95, 100], KPT7: [210, 220, 230, 240, 250] };
  Object.keys(kptT).forEach(function (k) { kptT[k].forEach(function (t, i) { add(k, 2026 + i, t, [], 'minimum', '', i === 0 ? 'Sasaran mengikut Kamus KPI Keusahawanan IPT 2026-2030' : ''); }); });
  // CKAI: sasaran belum ditetapkan. Isi melalui menu Admin > Sasaran.
  ['CKAI1', 'CKAI2', 'CKAI3', 'CKAI4', 'CKAI5', 'CKAI6', 'CKAI7', 'CKAI8', 'CKAI9'].forEach(function (k) {
    [2026, 2027, 2028, 2029, 2030].forEach(function (y) { add(k, y, '', [], 'minimum', '', ''); });
  });
  [2026, 2027, 2028, 2029, 2030].forEach(function (y) { add('CKAI10', y, 100, [], 'penggunaan', '', y === 2026 ? 'Sasaran 100% penggunaan peruntukan tabung: makin hampir 100% makin cekap' : ''); });
  return rows;
}

/** Daftar risiko awal daripada dokumen Pelan Tindakan (Risk Management). [kpi, risiko, sumber, mitigasi] */
var RISK_SEED = [
  ['KAI1', 'Kekangan masa HEPA dan fakulti', 'S19 General Operation', 'Wujudkan pasukan petugas bersama HEPA-Fakulti dengan garis masa dan tanggungjawab tetap.'],
  ['KAI1', 'Ketersediaan ruang sesuai di fakulti untuk ditukar menjadi inkubator', 'S20 Asset and Facilities', 'Audit ruang awal dan dapatkan kelulusan rasmi fakulti bagi peruntukan inkubator.'],
  ['KAI1', 'Kelewatan perolehan, pelaksanaan dan aktiviti operasi', 'S2 Suppliers / 3rd party', 'Jadual projek terperinci dengan pemantauan berkala dan pelaporan kemajuan kepada pengurusan.'],
  ['KAI2', 'Penggunaan ruang yang rendah oleh pelajar', 'S2 Suppliers / 3rd party', 'Jelajah UTMXCITE ke kolej dan fakulti untuk promosi kemudahan.'],
  ['KAI2', 'Kenaikan kos peralatan dan kerja', 'S2 Suppliers / 3rd party', 'Anggaran kos awal, kelulusan bajet awal, perolehan berfasa dan pembelian pukal.'],
  ['KAI2', 'Kelewatan perolehan, pelaksanaan dan aktiviti operasi', 'S2 Suppliers / 3rd party', 'Jadual projek terperinci dengan pemantauan berkala dan pelaporan kemajuan kepada pengurusan.'],
  ['KAI2', 'Kelewatan bekalan peralatan dan proses perolehan', 'S2 Suppliers / 3rd party', 'Pantau garis masa perolehan dan susulan berkala dengan pembekal.'],
  ['KAI3', 'Perniagaan dikendalikan oleh individu tidak sah atau pihak ketiga', 'Regulatory / Government', 'Garis panduan jelas dan prosedur operasi standard (SOP).'],
  ['KAI3', 'Ruang sesuai di kolej dan fakulti terhad', 'S2 Suppliers / 3rd party', 'Penilaian tapak awal dan keutamaan lokasi strategik berpengunjung tinggi.'],
  ['KAI3', 'Pelajar gagal mengendalikan perniagaan pada waktu operasi biasa', 'Regulatory / Government', 'Tetapkan waktu operasi standard dan pemantauan berkala bagi pematuhan.'],
  ['KAI4', 'Bilangan pelajar berminat dan berpotensi tinggi yang rendah', 'Customer / Student', 'Promosi aktif, program penglibatan dan inisiatif strategik.'],
  ['KAI4', 'Kefahaman pelajar tentang konsep dan peluang gig entrepreneurship terhad', 'Customer / Student', 'Program kesedaran berstruktur dan latihan pengenalan gig entrepreneurship.'],
  ['KAI4', 'Kelewatan pelaksanaan', 'S19 General Operation', 'Garis masa jelas dan pemantauan berkala.'],
  ['KAI5', 'Proses kelulusan panjang melibatkan banyak peringkat dan jawatankuasa', 'Internal Fraud', 'Bangunkan garis panduan dan SOP yang jelas bagi F-SIP.'],
  ['KAI5', 'Kualiti hasil pembelajaran rendah dalam startup yang ditubuhkan pelajar', 'Customer / Student', 'Pemantauan dan penilaian berkala oleh penyelia akademik dan mentor industri.'],
  ['KAI5', 'Pelajar menarik diri atau tidak menamatkan program', 'Customer / Student', 'Bimbingan berterusan dan sokongan intervensi awal.'],
  ['KAI6', 'Idea / prototaip pelajar mungkin disalin pihak lain', 'Legal & Litigation', 'Latihan kesedaran pendaftaran IP dan perlindungan idea.'],
  ['KAI6', 'Pelajar menarik diri daripada program', 'Customer / Student', 'Proses pemilihan berstruktur serta pemantauan dan sokongan berterusan.'],
  ['KAI6', 'Komitmen mentor yang rendah', 'External Fraud', 'Pemantauan berkala dan mekanisme pengiktirafan mentor.']
];

// ===== Util.gs =====
/** Utiliti umum: ralat pengguna, hash, tarikh, akses Sheet. */

function userError_(message, extra) {
  var e = new Error(message);
  e.user = true;
  if (extra) { for (var k in extra) { if (extra.hasOwnProperty(k)) e[k] = extra[k]; } }
  return e;
}

function authError_() {
  return userError_('Sesi tamat. Sila log masuk semula.', { auth: true });
}

function nowIso_() {
  return Utilities.formatDate(new Date(), APP.TZ, "yyyy-MM-dd'T'HH:mm:ss");
}

function todayIso_() {
  return Utilities.formatDate(new Date(), APP.TZ, 'yyyy-MM-dd');
}

function sha256Hex_(s) {
  var d = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8);
  return d.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function randomHex_(n) {
  var out = '';
  while (out.length < n) { out += sha256Hex_(Utilities.getUuid() + Math.random() + Date.now()); }
  return out.slice(0, n);
}

function randomDigits_(n) {
  var h = randomHex_(n * 4), out = '';
  for (var i = 0; i < n; i++) { out += String(parseInt(h.substr(i * 4, 4), 16) % 10); }
  return out;
}

function getProp_(key) { return PropertiesService.getScriptProperties().getProperty(key); }
function setProp_(key, value) { PropertiesService.getScriptProperties().setProperty(key, value); }

function getSalt_() {
  var s = getProp_('OTP_SALT');
  if (!s) { s = randomHex_(48); setProp_('OTP_SALT', s); }
  return s;
}

function normEmail_(e) { return String(e === null || e === undefined ? '' : e).trim().toLowerCase(); }

function isEmail_(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254;
}

function emailDomainAllowed_(e) {
  if (!APP.ALLOWED_EMAIL_DOMAINS || !APP.ALLOWED_EMAIL_DOMAINS.length) return true;
  var d = e.split('@')[1];
  return APP.ALLOWED_EMAIL_DOMAINS.indexOf(d) >= 0;
}

function yearOf_(iso) {
  var m = /^(\d{4})-\d{2}(-\d{2})?/.exec(String(iso || '')); // YYYY-MM-DD atau YYYY-MM (bulan)
  return m ? parseInt(m[1], 10) : null;
}

/** Elak suntikan formula Sheets: teks bermula dengan = + - @ disimpan sebagai teks. */
function sanitizeText_(s) {
  s = String(s);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function normalizeCell_(v, type) {
  if (v === null || v === undefined) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return isNaN(v.getTime()) ? '' : Utilities.formatDate(v, APP.TZ, type === 'month' ? 'yyyy-MM' : 'yyyy-MM-dd');
  }
  // Tarikh / bulan yang ditaip tangan dalam Sheet (contoh 03/2026, 2026/3, 15/03/2026) diseragamkan kepada YYYY-MM(-DD).
  if (typeof v === 'string' && (type === 'month' || type === 'date')) {
    var s = v.trim(), m;
    if (type === 'month') {
      if ((m = /^(\d{1,2})[\/\-.](\d{4})$/.exec(s))) return m[2] + '-' + ('0' + m[1]).slice(-2);
      if ((m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(s))) return m[3] + '-' + ('0' + m[2]).slice(-2);   // 01/04/2026 (hari/bulan/tahun) -> 2026-04
      if ((m = /^(\d{4})[\/\-.](\d{1,2})(?:[\/\-.]\d{1,2})?$/.exec(s))) return m[1] + '-' + ('0' + m[2]).slice(-2);
    } else if ((m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(s))) {
      return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
    }
    return s;
  }
  if (type === 'number') {
    if (v === '') return '';
    // Terima juga teks seperti "RM 1,200.50" yang ditaip / ditampal dalam Sheet.
    var n = Number(typeof v === 'string' ? v.replace(/rm|\s|,/gi, '') : v);
    return isFinite(n) ? n : '';
  }
  return typeof v === 'string' ? v.trim() : v;
}

// ---------------------------------------------------------------------------
// Akses Sheet
// ---------------------------------------------------------------------------
var SS_MEMO_ = null;   // objek Spreadsheet dibuka sekali setiap panggilan (openById ialah operasi perlahan)
function getSS_() {
  if (SS_MEMO_) return SS_MEMO_;
  var id = getProp_('SHEET_ID');
  if (id) {
    try { return (SS_MEMO_ = SpreadsheetApp.openById(id)); }
    catch (e) { console.error('Gagal buka Sheet ' + id + ': ' + (e && e.message)); throw userError_('Google Sheet tidak dapat dibuka. Pentadbir: semak SHEET_ID dalam Script Properties dan kebenaran akaun penerbit.'); }
  }
  var active = null;
  try { active = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) { active = null; }
  if (active) return active;
  throw userError_('Sistem belum disediakan. Pentadbir perlu menjalankan fungsi setup().');
}

function getSheet_(name) {
  var sh = getSS_().getSheetByName(name);
  if (!sh) throw userError_('Tab "' + name + '" tiada. Pentadbir perlu menjalankan fungsi setup().');
  return sh;
}

function typesFor_(kpi) {
  var t = { id: 'text' };
  kpi.fields.forEach(function (f) { t[f.key] = f.type; });
  return t;
}

/** Baca satu tab sebagai senarai objek. Setiap objek ada _row (nombor baris sebenar). */
function readTable_(name, types) {
  var sh = getSheet_(name);
  var lr = sh.getLastRow(), lc = sh.getLastColumn();
  if (lc < 1) return { headers: [], rows: [] };
  var headers = sh.getRange(1, 1, 1, lc).getValues()[0].map(String);
  var rows = [];
  if (lr >= 2) {
    var vals = sh.getRange(2, 1, lr - 1, lc).getValues();
    for (var i = 0; i < vals.length; i++) {
      var empty = true, o = { _row: i + 2 };
      for (var j = 0; j < headers.length; j++) {
        var v = normalizeCell_(vals[i][j], types ? types[headers[j]] : null);
        if (v !== '') empty = false;
        o[headers[j]] = v;
      }
      if (!empty) rows.push(o);
    }
  }
  return { headers: headers, rows: rows };
}

/**
 * Tulis satu baris mengikut NAMA tajuk (bukan kedudukan lajur). Lajur yang tiada dalam `obj` dikekalkan
 * (kemas kini) atau dibiarkan kosong (baris baharu). Jadi susunan lajur dalam Sheet tidak penting.
 */
function writeRow_(sh, rowNum, obj) {
  var lc = sh.getLastColumn();
  var headers = sh.getRange(1, 1, 1, lc).getValues()[0].map(String);
  var base = rowNum ? sh.getRange(rowNum, 1, 1, lc).getValues()[0] : headers.map(function () { return ''; });
  var out = headers.map(function (h, i) {
    if (!Object.prototype.hasOwnProperty.call(obj, h)) return base[i];
    return obj[h] === null || obj[h] === undefined ? '' : obj[h];
  });
  if (rowNum) sh.getRange(rowNum, 1, 1, lc).setValues([out]); else sh.appendRow(out);
}

/** Tulis banyak baris sekaligus. `cols` = nama lajur bagi setiap elemen dalam `rows` (tatasusunan). */
function writeRows_(sh, cols, rows) {
  if (!rows.length) return;
  var lc = sh.getLastColumn();
  var headers = sh.getRange(1, 1, 1, lc).getValues()[0].map(String);
  var idx = headers.map(function (h) { return cols.indexOf(h); });
  var matrix = rows.map(function (r) { return idx.map(function (j) { return j < 0 || r[j] === undefined ? '' : r[j]; }); });
  sh.getRange(sh.getLastRow() + 1, 1, matrix.length, lc).setValues(matrix);
}

function rowArray_(headers, obj) {
  return headers.map(function (h) { return obj[h] === undefined || obj[h] === null ? '' : obj[h]; });
}

var FAC_MEMO_ = null;   // senarai fakulti dibaca sekali setiap panggilan
function listFaculties_() {
  if (FAC_MEMO_) return FAC_MEMO_;
  FAC_MEMO_ = readTable_(SHEETS.FACULTIES).rows.map(function (r) { return { kod: String(r.kod), nama: String(r.nama) }; })
    .filter(function (r) { return r.kod; });
  return FAC_MEMO_;
}

function getKpi_(id) {
  for (var i = 0; i < KPIS.length; i++) { if (KPIS[i].id === id) return KPIS[i]; }
  throw userError_('KPI tidak dikenali.');
}

function kpiColumns_(kpi) {
  var cols = ['id'];
  kpi.fields.forEach(function (f) { cols.push(f.key); if (f.type === 'file') cols.push(fileLinkCol_(f.key)); });
  return cols.concat(SYS_COLS);
}

/** Lajur pautan Drive bagi medan fail (untuk Admin klik terus dalam Sheet). Tidak dihantar kepada klien. */
function fileLinkCol_(key) { return key + '_pautan'; }

function driveFileUrl_(fileId) { return fileId ? 'https://drive.google.com/file/d/' + fileId + '/view' : ''; }

function setFileLinks_(kpi, clean, obj) {
  kpi.fields.forEach(function (f) {
    if (f.type !== 'file') return;
    obj[fileLinkCol_(f.key)] = driveFileUrl_((parseJson_(clean[f.key], {}) || {}).id);
  });
}

function audit_(user, action, kpi, recordId, summary) {
  try {
    var sh = getSheet_(SHEETS.AUDIT);
    writeRow_(sh, null, { masa: nowIso_(), emel: user ? user.emel : '', tindakan: action, kpi: kpi || '', rekod_id: recordId || '', ringkasan: sanitizeText_(String(summary || '').slice(0, 500)) });
  } catch (e) {
    console.error('Gagal merekod audit: ' + e);
  }
}

// ---------------------------------------------------------------------------
// Lampiran (Google Drive): satu folder peribadi yang dimiliki pemilik skrip.
// ---------------------------------------------------------------------------
function getAttachFolder_() {
  var id = getProp_('FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* folder dipadam: cipta semula */ } }
  var f = DriveApp.createFolder('UTMXCITE ASCEND2030 - Lampiran');
  setProp_('FOLDER_ID', f.getId());
  return f;
}

function fileInFolder_(file) {
  var folderId = getAttachFolder_().getId();
  var it = file.getParents();
  while (it.hasNext()) { if (it.next().getId() === folderId) return true; }
  return false;
}

function parseJson_(v, fallback) {
  if (v === '' || v === null || v === undefined) return fallback;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch (e) { return fallback; }
}

function trashFile_(id) {
  try {
    if (!id) return;
    var f = DriveApp.getFileById(id);
    if (fileInFolder_(f)) f.setTrashed(true);
  } catch (e) { console.warn('Gagal membuang fail lampiran: ' + e); }
}

function clearDashCache_() {
  var cache = CacheService.getScriptCache();
  APP.YEARS.forEach(function (y) { cache.remove('dash:' + y); });
  cache.remove('trend');
}

// ===== Setup.gs =====
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

// ===== Auth.gs =====
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

// ===== Data.gs =====
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

// ===== Files.gs =====
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

// ===== Metrics.gs =====
/**
 * Pengiraan dashboard. Semua sasaran ialah MINIMUM (boleh dilebihi) kecuali KPI berjenis "kemajuan"
 * (KAI 2, DKAI 1) yang berakhir pada 100%. Dashboard awam hanya menerima data agregat (tiada data peribadi).
 */

function num_(v) { var n = Number(v); return isFinite(n) ? n : 0; }
function round1_(n) { return Math.round(n * 10) / 10; }
function round2_(n) { return Math.round(n * 100) / 100; }
function rm_(n) { return 'RM ' + round2_(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

function sumBy_(rows, keyFn, valFn) {
  var m = {}, order = [];
  rows.forEach(function (r) {
    var k = keyFn(r);
    if (k === '' || k === undefined || k === null) k = '(tiada)';
    if (!(k in m)) { m[k] = 0; order.push(k); }
    m[k] += valFn(r);
  });
  return order.map(function (k) { return { label: k, value: round2_(m[k]) }; });
}
function sumOf_(rows, field) { var t = 0; rows.forEach(function (r) { t += num_(r[field]); }); return t; }
function distinctCount_(rows, field) {
  var seen = {};
  rows.forEach(function (r) { var v = String(r[field] || '').trim().toLowerCase(); if (v) seen[v] = 1; });
  return Object.keys(seen).length;
}
/** CKAI 7: bulan pelaporan 'YYYY-MM' daripada lajur Tahun + Bulan (nama atau nombor); rekod lama guna bulan_pendapatan / tempoh. */
function ckai7Ym_(r) {
  var y = num_(r.Tahun), mo = String(r.Bulan === undefined ? '' : r.Bulan).trim().toLowerCase(), idx = -1;
  if (y && mo) {
    if (/^\d{1,2}$/.test(mo)) idx = parseInt(mo, 10) - 1;
    else for (var i = 0; i < BULAN_MS.length; i++) { if (BULAN_MS[i].toLowerCase() === mo || BULAN_MS[i].toLowerCase().slice(0, 3) === mo.slice(0, 3)) { idx = i; break; } }
    if (idx >= 0 && idx < 12) return y + '-' + ('0' + (idx + 1)).slice(-2);
  }
  var legacy = String(r.bulan_pendapatan || r.tempoh || '');
  return /^\d{4}-\d{2}/.test(legacy) ? legacy.slice(0, 7) : '';
}
/** CKAI 7: pendapatan bulanan (RM); jika lajur baharu masih kosong, guna lajur lama pendapatan_rm. */
function ckai7Rm_(r) {
  var v = r.pendapatan_bulanan;
  return num_(v === '' || v === undefined || v === null ? r.pendapatan_rm : v);
}
/**
 * Tahun pelaporan bagi KPI yang tiada medan tarikh sendiri: tahun tarikh lama (jika ada), jika tidak tahun dicipta_pada,
 * kemudian dikemas_kini_pada. Menerima YYYY-MM-DD(...) dan hari/bulan/tahun (06/10/2026) yang ditaip dalam Sheet.
 */
function createdYear_(r, legacyKeys) {
  function yr(v) {
    var s = String(v === undefined || v === null ? '' : v).trim(), mm;
    if ((mm = /^(\d{4})-\d{1,2}/.exec(s))) return parseInt(mm[1], 10);
    if ((mm = /^\d{1,2}[\/\-.]\d{1,2}[\/\-.](\d{4})/.exec(s))) return parseInt(mm[1], 10);
    return null;
  }
  var ks = (legacyKeys || []).concat(['dicipta_pada', 'dikemas_kini_pada']);
  for (var i = 0; i < ks.length; i++) { var y = yr(r[ks[i]]); if (y) return y; }
  return null;
}
function byMonth_(items) { return items.sort(function (a, b) { return String(a.label).localeCompare(String(b.label)); }); }

function countBy_(rows, keyFn) {
  var m = {}, order = [];
  rows.forEach(function (r) {
    var k = keyFn(r);
    if (k === '' || k === undefined || k === null) k = '(tiada)';
    if (!(k in m)) { m[k] = 0; order.push(k); }
    m[k] += 1;
  });
  return order.map(function (k) { return { label: k, value: m[k] }; });
}

function sortDesc_(items) { return items.sort(function (a, b) { return b.value - a.value; }); }

function perFacultyItems_(kpi, rows, faculties) {
  var counts = {};
  rows.forEach(function (r) { counts[r.fakulti] = (counts[r.fakulti] || 0) + 1; });
  var codes = kpi.facultyWhitelist ? kpi.facultyWhitelist.slice() : Object.keys(counts);
  if (!kpi.facultyWhitelist && kpi.perFacultyTarget) {
    faculties.forEach(function (f) { if (f.kod !== 'UTMXCITE' && codes.indexOf(f.kod) < 0) codes.push(f.kod); });
  }
  return codes.map(function (c) {
    var it = { label: c, value: counts[c] || 0 };
    if (kpi.perFacultyTarget) it.target = kpi.perFacultyTarget;
    return it;
  });
}

function countedInYear_(rows, statuses, dateField, year) {
  return rows.filter(function (r) {
    return statuses.indexOf(r.status) >= 0 && yearOf_(r[dateField]) === year;
  });
}

var MEASURES = {
  // ---- KPT: KPI peringkat Kementerian (Kamus KPI Keusahawanan IPT 2026-2030). Paparan awam: agregat sahaja. ----
  // KPT 1: jumlah jualan agregat usahawan pelajar = jumlah `pendapatan_bulanan` dalam CKAI 7 bagi tahun dipilih.
  kpt1: function (kpi, rows, year, ctx) {
    var sales = ctx.rows('CKAI7').filter(function (r) { return yearOf_(ckai7Ym_(r)) === year; });
    var total = sales.reduce(function (t, r) { return t + ckai7Rm_(r); }, 0);
    return {
      value: round2_(total),
      secondary: [
        { label: 'Usahawan melaporkan jualan', value: distinctCount_(sales.filter(function (r) { return ckai7Rm_(r) > 0; }).map(function (r) { return { k: r.no_kp || r.no_matrik || r.nama_perniagaan }; }), 'k') }
      ],
      breakdown: [
        { title: 'Jualan (RM) mengikut fakulti', items: sortDesc_(sumBy_(sales, function (r) { return r.fakulti; }, function (r) { return ckai7Rm_(r); })) },
        { title: 'Jualan (RM) mengikut jenis perniagaan', items: sortDesc_(sumBy_(sales, function (r) { return r.jenis_perniagaan; }, function (r) { return ckai7Rm_(r); })) }
      ]
    };
  },

  // KPT 2: % graduan usahawan (menubuhkan perniagaan berdaftar / menjana pekerjaan) daripada usahawan pelajar tahun akhir.
  // Penyebut: tab KPT2_Penyebut (tahun, fakulti, bil_penyebut), dijumlahkan bagi tahun dipilih.
  kpt2: function (kpi, rows, year, ctx) {
    var grads = rows.filter(function (r) { return num_(r.tahun_graduan) === year; });
    var den = ctx.kpt2Den(year);
    var w = [];
    if (!den && grads.length) w.push('Penyebut (bilangan usahawan pelajar tahun akhir) belum diisi dalam tab KPT2_Penyebut untuk tahun ini.');
    return {
      value: den ? round1_(grads.length * 100 / den) : 0,
      secondary: [{ label: 'Graduan usahawan', value: grads.length }, { label: 'Usahawan pelajar tahun akhir (penyebut)', value: den }],
      breakdown: [
        { title: 'Graduan mengikut fakulti', items: sortDesc_(countBy_(grads, function (r) { return r.fakulti; })) },
        { title: 'Graduan mengikut jantina', items: sortDesc_(countBy_(grads, function (r) { return r.jantina; })) }
      ],
      warnings: w
    };
  },

  // KPT 3: % tenaga pengajar keusahawanan yang berpesijilan profesional (pesijilan_profesional tidak kosong).
  kpt3: function (kpi, rows, year) {
    var all = rows.filter(function (r) { return num_(r.tahun) === year; });
    var done = all.filter(function (r) { return String(r.pesijilan_profesional || '').trim() !== ''; });
    return {
      value: all.length ? round1_(done.length * 100 / all.length) : 0,
      secondary: [{ label: 'Tenaga pengajar berdaftar', value: all.length }, { label: 'Berpesijilan profesional', value: done.length }],
      breakdown: [
        { title: 'Berpesijilan mengikut jenis staf', items: sortDesc_(countBy_(done, function (r) { return r.jenis_staf; })) },
        { title: 'Berpesijilan mengikut jantina', items: sortDesc_(countBy_(done, function (r) { return r.jantina; })) },
        { title: 'Berpesijilan mengikut fakulti', items: sortDesc_(countBy_(done, function (r) { return r.fakulti; })) }
      ]
    };
  },

  // KPT 4: pelajar memanfaatkan inovasi dan teknologi (TRL 1-3), dikira sekali sahaja (tahun kemunculan pertama).
  // Sumber: daftar KPT 4 + pelajar dalam CKAI 8 (inovasi pelajar) yang TRL 1-3.
  // Tahun pelaporan rekod daftar KPT 4 = tahun rekod dicipta (dicipta_pada); tiada medan tarikh.
  kpt4: function (kpi, rows, year, ctx) {
    var first = {};
    function add(key, y, fakulti, sumber) {
      key = String(key || '').replace(/^'/, '').trim().toLowerCase();
      if (!key || !y) return;
      if (!first[key] || y < first[key].y) first[key] = { y: y, fakulti: fakulti, sumber: sumber };
    }
    rows.forEach(function (r) { add(r.no_matrik, createdYear_(r, ['tarikh']), r.fakulti, 'Daftar fakulti (KPT 4)'); });
    ctx.rows('CKAI8').forEach(function (r) {
      if (['TRL 1', 'TRL 2', 'TRL 3'].indexOf(r.trl) < 0) return;
      var p = parseJson_(r.pelajar, []);
      if (Array.isArray(p)) p.forEach(function (x) { add(x && x.matrik, yearOf_(r.tarikh), r.fakulti, 'Inovasi pelajar (CKAI 8)'); });
    });
    var counted = Object.keys(first).map(function (k) { return first[k]; }).filter(function (x) { return x.y === year; });
    return {
      value: counted.length,
      secondary: [{ label: 'Terkumpul sehingga tahun ini', value: Object.keys(first).filter(function (k) { return first[k].y <= year; }).length }],
      breakdown: [
        { title: 'Mengikut fakulti', items: sortDesc_(countBy_(counted, function (x) { return x.fakulti; })) },
        { title: 'Mengikut sumber data', items: countBy_(counted, function (x) { return x.sumber; }) }
      ]
    };
  },

  // KPT 5: syarikat pemula (SSU aktif) berasaskan inovasi dan teknologi, TRL 4-6, didaftarkan pada tahun itu.
  kpt5: function (kpi, rows, year, ctx) {
    var cs = ctx.rows('CKAI4').filter(function (r) {
      return r.status === 'Aktif' && r.berasaskan_inovasi === 'Ya' && ['TRL 4', 'TRL 5', 'TRL 6'].indexOf(r.trl_syarikat) >= 0 && yearOf_(r.tarikh_daftar) === year;
    });
    return {
      value: cs.length,
      secondary: [{ label: 'Berdaftar SSM', value: cs.filter(function (r) { return r.status_ssm === 'Berdaftar'; }).length }],
      breakdown: [
        { title: 'Mengikut TRL', items: countBy_(cs, function (r) { return r.trl_syarikat; }).sort(function (a, b) { return a.label.localeCompare(b.label); }) },
        { title: 'Mengikut fakulti', items: sortDesc_(countBy_(cs, function (r) { return r.fakulti; })) }
      ]
    };
  },

  // KPT 6: projek / aktiviti berimpak daripada kolaborasi rasmi pada tahun itu.
  kpt6: function (kpi, rows, year) {
    var inYear = rows.filter(function (r) { return yearOf_(r.tarikh_mula) === year; });
    function n(r) { return num_(r.bil_projek_aktiviti_berkolabrasi) || 1; }
    function total(list) { return list.reduce(function (a, r) { return a + n(r); }, 0); }
    function byKey(fn) { return sortDesc_(sumBy_(inYear, fn, n)); }
    return {
      value: total(inYear),
      secondary: [
        { label: 'Tempatan', value: total(inYear.filter(function (r) { return r.skop === 'Tempatan'; })) },
        { label: 'Antarabangsa', value: total(inYear.filter(function (r) { return r.skop === 'Antarabangsa'; })) }
      ],
      breakdown: [
        { title: 'Mengikut dokumen rasmi', items: byKey(function (r) { return r.jenis_dokumen; }) },
        { title: 'Mengikut fakulti', items: byKey(function (r) { return r.fakulti; }) }
      ]
    };
  },

  // KPT 7: syarikat / projek dibiayai (unik setiap tahun). Sumber: daftar KPT 7 + hadiah pertandingan (CKAI 9, nilai hadiah > 0).
  kpt7: function (kpi, rows, year, ctx) {
    var items = [];
    rows.forEach(function (r) { if (yearOf_(r.tarikh_mula_embiayaan) === year) items.push({ name: r.nama_syarikat, jenis: r.sumber_pembiayaan, rm: num_(r.jumlah_rm), fakulti: r.fakulti }); });
    ctx.rows('CKAI9').forEach(function (r) {
      if (yearOf_(r.tarikh) === year && num_(r.nilai_hadiah_rm) > 0) items.push({ name: r.produk_projek || r.nama_anugerah, jenis: 'HADIAH PERTANDINGAN', rm: num_(r.nilai_hadiah_rm), fakulti: r.fakulti });
    });
    var seen = {}, uniq = [];
    items.forEach(function (x) { var k = String(x.name || '').trim().toLowerCase(); if (k && !seen[k]) { seen[k] = 1; uniq.push(x); } });
    return {
      value: uniq.length,
      secondary: [{ label: 'Jumlah nilai pembiayaan', value: rm_(sumOf_(items, 'rm')) }],
      breakdown: [
        { title: 'Mengikut sumber pembiayaan', items: sortDesc_(countBy_(items, function (x) { return x.jenis; })) },
        { title: 'Mengikut fakulti', items: sortDesc_(countBy_(uniq, function (x) { return x.fakulti; })) }
      ]
    };
  },

  // KAI 1: inkubator aktif = didaftarkan DAN (dalam pembangunan atau beroperasi); sasaran minimum 20 setiap tahun.
  kai1: function (kpi, rows, year, ctx) {
    var active = rows.filter(function (r) {
      if (r.didaftarkan !== 'Ya') return false;
      var reg = yearOf_(r.tarikh_pendaftaran), off = yearOf_(r.tarikh_tidak_aktif);
      if (!reg || reg > year) return false;
      if (off && off <= year) return false;
      if (r.status === 'Dalam pembangunan' || r.status === 'Beroperasi') return true;
      return r.status === 'Tidak aktif' && !!off && off > year;
    });
    var oper = active.filter(function (r) { return r.status === 'Beroperasi'; }).length;
    var jenis = countBy_(active, function (r) { return r.jenis; });
    jenis.forEach(function (it) {
      if (it.label === 'Inkubator Fakulti') it.target = 13;
      if (it.label === 'Co-working / Ruang Individu') it.target = 10;
    });
    return {
      value: active.length,
      secondary: [{ label: 'Sudah beroperasi', value: oper }],
      breakdown: [
        { title: 'Mengikut aliran', items: countBy_(active, function (r) { return r.aliran; }) },
        { title: 'Mengikut jenis (sasaran dalaman 13 + 10)', items: jenis },
        { title: 'Mengikut fakulti', items: sortDesc_(countBy_(active, function (r) { return r.fakulti; })) }
      ]
    };
  },

  // Kemajuan berpemberat (KAI 2, DKAI 1): jumlah (peratus siap x pemberat) / 100.
  progress: function (kpi, rows) {
    var sum = 0, weight = 0, done = 0;
    rows.forEach(function (r) {
      sum += num_(r.peratus_siap) * num_(r.pemberat) / 100;
      weight += num_(r.pemberat);
      if (r.status === 'Siap') done += 1;
    });
    var warnings = [];
    if (rows.length && Math.abs(weight - 100) > 0.01) warnings.push('Jumlah pemberat milestone ialah ' + round1_(weight) + '% (sepatutnya 100%).');
    return {
      value: Math.min(100, round1_(sum)),
      secondary: [{ label: 'Milestone siap', value: done + ' / ' + rows.length }],
      warnings: warnings,
      breakdown: [{
        title: 'Kemajuan milestone (%)',
        items: rows.map(function (r) { return { label: (r.fasa || r.peringkat || '') + ' - ' + r.nama_milestone + ' (' + num_(r.pemberat) + '%)', value: num_(r.peratus_siap), target: 100 }; })
      }]
    };
  },


  // CKAI 1: bilangan profiling pelajar yang didaftarkan pada tahun itu (satu profil bagi setiap pelajar).
  profiling: function (kpi, rows, year) {
    var inYear = rows.filter(function (r) { return yearOf_(r.tarikh_profiling) === year; });
    var order = ['Tiada minat', 'Rendah', 'Sederhana', 'Tinggi'];
    var ready = ['Belum ada idea', 'Ada idea', 'Ada prototaip / MVP', 'Sudah beroperasi'];
    return {
      value: inYear.length,
      secondary: [
        { label: 'Berminat (sederhana / tinggi)', value: inYear.filter(function (r) { return r.tahap_minat === 'Sederhana' || r.tahap_minat === 'Tinggi'; }).length },
        { label: 'Sudah ada idea / prototaip / berniaga', value: inYear.filter(function (r) { return r.tahap_kesediaan && r.tahap_kesediaan !== 'Belum ada idea'; }).length },
        { label: 'Sedang berniaga', value: inYear.filter(function (r) { return r.pengalaman_perniagaan === 'Sedang berniaga'; }).length }
      ],
      breakdown: [
        { title: 'Mengikut fakulti', items: sortDesc_(countBy_(inYear, function (r) { return r.fakulti; })) },
        { title: 'Mengikut tahap minat', items: countBy_(inYear, function (r) { return r.tahap_minat; }).sort(function (a, b) { return order.indexOf(a.label) - order.indexOf(b.label); }) },
        { title: 'Mengikut tahap kesediaan', items: countBy_(inYear, function (r) { return r.tahap_kesediaan || '(tiada)'; }).sort(function (a, b) { return ready.indexOf(a.label) - ready.indexOf(b.label); }) },
        { title: 'Mengikut sumber profiling', items: sortDesc_(countBy_(inYear, function (r) { return r.sumber_profiling; })) }
      ]
    };
  },

  // CKAI 2 dan 3: program yang SELESAI pada tahun itu (mengikut tarikh tamat), termasuk penyertaan, kos dan pendapatan.
  program: function (kpi, rows, year) {
    var done = rows.filter(function (r) { return r.status === 'Selesai' && yearOf_(r.tarikh_tamat) === year; });
    var upcoming = rows.filter(function (r) { return (r.status === 'Dirancang' || r.status === 'Sedang berjalan') && yearOf_(r.tarikh_mula) === year; });
    var cost = sumOf_(done, 'bajet_rm'), income = sumOf_(done, 'pendapatan_rm');
    return {
      value: done.length,
      secondary: [
        { label: 'Jumlah peserta', value: sumOf_(done, 'bil_peserta') },
        { label: 'Daripada itu pelajar', value: sumOf_(done, 'bil_pelajar') },
        { label: 'Kos penganjuran', value: rm_(cost) },
        { label: 'Pendapatan', value: rm_(income) },
        { label: 'Dirancang / sedang berjalan', value: upcoming.length }
      ],
      breakdown: [
        { title: 'Program selesai mengikut fakulti / penganjur', items: sortDesc_(countBy_(done, function (r) { return r.fakulti; })) },
        { title: 'Mengikut kategori', items: sortDesc_(countBy_(done, function (r) { return r.kategori; })) },
        { title: 'Peserta mengikut fakulti / penganjur', items: sortDesc_(sumBy_(done, function (r) { return r.fakulti; }, function (r) { return num_(r.bil_peserta); })) }
      ]
    };
  },

  // CKAI 4: pendaftaran SSU (Sistem Syarikat Universiti) pada tahun itu.
  ssu: function (kpi, rows, year) {
    var reg = rows.filter(function (r) { return yearOf_(r.tarikh_daftar) === year; });
    return {
      value: reg.length,
      secondary: [{ label: 'Masih aktif', value: reg.filter(function (r) { return r.status === 'Aktif'; }).length }],
      breakdown: [{ title: 'Mengikut fakulti', items: sortDesc_(countBy_(reg, function (r) { return r.fakulti; })) }]
    };
  },

  // CKAI 7: jumlah pendapatan usahawan pelajar (RM) bagi bulan-bulan dalam tahun itu.
  income: function (kpi, rows, year) {
    var inYear = rows.filter(function (r) { return yearOf_(ckai7Ym_(r)) === year; });
    var total = inYear.reduce(function (t, r) { return t + ckai7Rm_(r); }, 0);
    return {
      value: round2_(total),
      secondary: [
        { label: 'Perniagaan melaporkan pendapatan', value: distinctCount_(inYear, 'nama_perniagaan') },
        { label: 'Purata setiap perniagaan', value: rm_(distinctCount_(inYear, 'nama_perniagaan') ? total / distinctCount_(inYear, 'nama_perniagaan') : 0) }
      ],
      breakdown: [
        { title: 'Pendapatan (RM) mengikut fakulti', items: sortDesc_(sumBy_(inYear, function (r) { return r.fakulti; }, function (r) { return ckai7Rm_(r); })) },
        { title: 'Pendapatan (RM) mengikut jenis perniagaan', items: sortDesc_(sumBy_(inYear, function (r) { return r.jenis_perniagaan; }, function (r) { return ckai7Rm_(r); })) },
        { title: 'Pendapatan (RM) mengikut bulan', items: byMonth_(sumBy_(inYear, function (r) { return ckai7Ym_(r); }, function (r) { return ckai7Rm_(r); })) }
      ]
    };
  },

  // CKAI 5: bilangan penggunaan Makerspace = bilangan permohonan (satu rekod = satu penggunaan), mengikut tahun tarikh mula.
  makerspace: function (kpi, rows, year) {
    var inYear = rows.filter(function (r) { return yearOf_(r.tarikh_mula) === year; });
    var users = {};
    inYear.forEach(function (r) { users[String(r.no_matrik || r.emel).toUpperCase()] = 1; });
    return {
      value: sumOf_(inYear, 'bil_peserta'),          // Jumlah pengguna (jumlah bil_peserta), bukan bilangan tempahan
      secondary: [
        { label: 'Jumlah tempahan', value: inYear.length },
        { label: 'Pengguna unik', value: Object.keys(users).length },
        { label: 'Caj diterima', value: rm_(sumOf_(inYear.filter(function (r) { return r.status_bayaran === 'Bayar'; }), 'bayaran_rm')) },
        { label: 'Caj belum dibayar', value: rm_(sumOf_(inYear.filter(function (r) { return r.status_bayaran === 'Belum Dibayar'; }), 'bayaran_rm')) }
      ],
      breakdown: [
        // Carta mengikut BILANGAN PENGGUNA (jumlah bil_peserta), bukan bilangan tempahan
        { title: 'Penggunaan mengikut bulan', items: byMonth_(sumBy_(inYear, function (r) { return String(r.tarikh_mula).slice(0, 7); }, function (r) { return num_(r.bil_peserta); })) },
        { title: 'Penggunaan mengikut fakulti', items: sortDesc_(countBy_(inYear, function (r) { return r.fakulti; })) },
        { title: 'Peralatan paling banyak dipohon', items: sortDesc_(countBy_(inYear, function (r) { return String(r.peralatan || '').trim(); })).slice(0, 5) },
        { title: 'Penggunaan mengikut peralatan', items: sortDesc_(sumBy_(inYear, function (r) { return String(r.peralatan || '').trim(); }, function (r) { return num_(r.bil_peserta); })) }
      ]
    };
  },

  // CKAI 6: pendapatan sewaan ruang niaga yang DITERIMA (status Dibayar) pada tahun itu.
  rent: function (kpi, rows, year) {
    var inYear = rows.filter(function (r) { return yearOf_(r.tempoh) === year; });
    function isPaid(r) { return String(r.status_bayaran || '').trim().toLowerCase() === 'dibayar'; }   // tahan terhadap huruf besar/kecil yang ditaip dalam Sheet
    var paid = inYear.filter(isPaid);
    var due = inYear.filter(function (r) { return !isPaid(r); });
    return {
      value: round2_(sumOf_(paid, 'jumlah_rm')),
      secondary: [
        { label: 'Belum dibayar / tertunggak', value: rm_(sumOf_(due, 'jumlah_rm')) },
        { label: 'Penyewa', value: distinctCount_(inYear, 'penyewa') }
      ],
      breakdown: [{ title: 'Sewaan diterima (RM) mengikut bulan', items: byMonth_(sumBy_(paid, function (r) { return r.tempoh; }, function (r) { return num_(r.jumlah_rm); })) }]
    };
  },

  // CKAI 8: inovasi pelajar yang TELAH menyertai pertandingan (sekurang-kurangnya peringkat Fakulti) pada tahun itu.
  innovation: function (kpi, rows, year) {
    var done = rows.filter(function (r) { return r.status_penyertaan === 'Telah menyertai' && yearOf_(r.tarikh) === year; });
    var order = ['Fakulti', 'Universiti', 'Kebangsaan', 'Antarabangsa'];
    var students = 0;
    done.forEach(function (r) { var p = parseJson_(r.pelajar, []); if (Array.isArray(p)) students += p.length; });
    var pipeOrder = ['Belum dinilai', 'Calon peningkatan', 'Sedang disokong', 'Telah dibawa ke peringkat lebih tinggi', 'Tidak diteruskan'];
    return {
      value: done.length,
      secondary: [
        { label: 'Pelajar terlibat', value: students },
        { label: 'Memenang anugerah / pingat', value: done.filter(function (r) { return !!r.pingat; }).length },
        { label: 'Peringkat Universiti ke atas', value: done.filter(function (r) { return r.peringkat !== 'Fakulti'; }).length },
        { label: 'Calon peningkatan / sedang disokong', value: done.filter(function (r) { return r.status_peningkatan === 'Calon peningkatan' || r.status_peningkatan === 'Sedang disokong'; }).length },
        { label: 'Telah dibawa ke peringkat lebih tinggi', value: done.filter(function (r) { return r.status_peningkatan === 'Telah dibawa ke peringkat lebih tinggi'; }).length },
        { label: 'Akan menyertai (dirancang)', value: rows.filter(function (r) { return r.status_penyertaan === 'Akan menyertai' && yearOf_(r.tarikh) === year; }).length }
      ],
      breakdown: [
        { title: 'Mengikut peringkat pertandingan', items: countBy_(done, function (r) { return r.peringkat; }).sort(function (a, b) { return order.indexOf(a.label) - order.indexOf(b.label); }) },
        { title: 'Mengikut fakulti', items: sortDesc_(countBy_(done, function (r) { return r.fakulti; })) },
        { title: 'Mengikut jenis inovasi', items: sortDesc_(countBy_(done, function (r) { return r.jenis_inovasi; })) },
        { title: 'Status peningkatan', items: countBy_(done, function (r) { return r.status_peningkatan || 'Belum dinilai'; }).sort(function (a, b) { return pipeOrder.indexOf(a.label) - pipeOrder.indexOf(b.label); }) }
      ]
    };
  },

  // CKAI 10: jumlah perbelanjaan operasi tabung amanah. Bagi setiap tabung, rekod bulan terkini dalam tahun itu (angka terkumpul sejak awal tahun).
  // Paparan awam: jumlah keseluruhan dan butiran mengikut nama tabung (% dan RM perbelanjaan). Chargeline dan peruntukan/baki setiap tabung hanya dalam senarai Admin.
  tabung: function (kpi, rows, year) {
    // Label tabung pada paparan awam = 5 aksara terakhir no. chargeline (contoh A.J060000.6600.07078 -> 07078)
    function kod(r) { var c = String(r.no_chargeline || '').replace(/[.\s]/g, ''); return c ? c.slice(-5) : String(r.tabung === 'Lain-lain' ? (r.tabung_lain || 'Lain-lain') : r.tabung); }
    var inYear = rows.filter(function (r) { return yearOf_(r.tempoh) === year; });
    var latest = {};
    inYear.forEach(function (r) {
      var k = String(r.kunci).split('|')[1] || String(r.tabung);
      if (!latest[k] || String(r.tempoh) > String(latest[k].tempoh)) latest[k] = r;
    });
    var a = 0, b = 0, c = 0, d = 0, n = 0, bj = 0, cBj = 0;
    Object.keys(latest).forEach(function (k) {
      var r = latest[k]; a += num_(r.peruntukan_awal); b += num_(r.komitmen); c += num_(r.perbelanjaan); d += num_(r.baki); n++;
      if (num_(r.bajet_sasaran) > 0) { bj += num_(r.bajet_sasaran); cBj += num_(r.perbelanjaan); }
    });
    var sec = [
      { label: 'Jumlah perbelanjaan terkumpul', value: rm_(c) },
      { label: 'Jumlah peruntukan / baki awal', value: rm_(a) },
      { label: 'Komitmen', value: rm_(b) },
      { label: 'Baki tabung', value: rm_(d) }
    ];
    if (bj > 0) {
      sec.push({ label: 'Bajet disasarkan', value: rm_(bj) });
      sec.push({ label: bj >= cBj ? 'Penjimatan berbanding bajet' : 'Lebihan berbanding bajet', value: rm_(Math.abs(bj - cBj)) });
      sec.push({ label: 'Perbelanjaan daripada bajet disasarkan', value: round1_(cBj * 100 / bj) + '%' });
    }
    sec.push({ label: 'Bilangan tabung dilaporkan', value: n });
    return {
      value: a ? round1_(c * 100 / a) : 0,
      secondary: sec,
      breakdown: [
        { title: '% Penggunaan Tabung', items: sortDesc_(Object.keys(latest).map(function (k) { var r = latest[k]; return { label: kod(r), value: num_(r.peruntukan_awal) ? round1_(num_(r.perbelanjaan) * 100 / num_(r.peruntukan_awal)) : 0 }; })) },
        { title: 'Peruntukan (RM) mengikut tabung', items: Object.keys(latest).map(function (k) { var r = latest[k]; return { label: kod(r), value: round2_(num_(r.peruntukan_awal)) }; }) },
        { title: 'Perbelanjaan (RM) mengikut tabung', items: sortDesc_(Object.keys(latest).map(function (k) { var r = latest[k]; return { label: kod(r), value: round2_(num_(r.perbelanjaan)) }; })) }
      ]
    };
  },

  // CKAI 9: anugerah dan pengiktirafan inovasi / keusahawanan yang diterima pada tahun itu.
  award: function (kpi, rows, year) {
    var inYear = rows.filter(function (r) { return yearOf_(r.tarikh) === year; });
    var order = ['Fakulti', 'Universiti', 'Kebangsaan', 'Antarabangsa'];
    var byLevel = countBy_(inYear, function (r) { return r.peringkat; }).sort(function (a, b) { return order.indexOf(a.label) - order.indexOf(b.label); });
    var students = 0;
    inYear.forEach(function (r) { var p = parseJson_(r.pelajar, []); if (Array.isArray(p)) students += p.length; });
    return {
      value: inYear.length,
      secondary: [
        { label: 'Peringkat kebangsaan / antarabangsa', value: inYear.filter(function (r) { return r.peringkat === 'Kebangsaan' || r.peringkat === 'Antarabangsa'; }).length },
        { label: 'Pingat emas / johan', value: inYear.filter(function (r) { return r.pingat === 'Emas' || r.pingat === 'Johan'; }).length },
        { label: 'Pelajar penerima', value: students }
      ],
      breakdown: [
        { title: 'Mengikut peringkat', items: byLevel },
        { title: 'Mengikut kategori', items: countBy_(inYear, function (r) { return r.kategori; }) },
        { title: 'Mengikut program', items: sortDesc_(countBy_(inYear, function (r) { return r.program; })) },
        { title: 'Mengikut fakulti', items: sortDesc_(countBy_(inYear, function (r) { return r.fakulti; })) }
      ]
    };
  },

  // KAI 3: ruang ditawarkan kepada pelajar untuk disewa (kumulatif); penggunaan = disewa / ditawarkan.
  kai3: function (kpi, rows, year) {
    var offered = rows.filter(function (r) {
      return (r.status === 'Ditawarkan' || r.status === 'Disewa') && yearOf_(r.tarikh_ditawarkan) && yearOf_(r.tarikh_ditawarkan) <= year;
    });
    var rented = offered.filter(function (r) { return r.status === 'Disewa'; });
    var rate = offered.length ? round1_(rented.length / offered.length * 100) : 0;
    var order = ['Dikenal pasti', 'Spesifikasi disediakan', 'Dalam perolehan', 'Siap', 'Ditawarkan', 'Disewa', 'Tidak aktif'];
    var pipe = countBy_(rows, function (r) { return r.status; }).sort(function (a, b) { return order.indexOf(a.label) - order.indexOf(b.label); });
    return {
      value: offered.length,
      secondary: [{ label: 'Disewa pelajar', value: rented.length }, { label: 'Kadar penggunaan', value: rate + '%' }],
      breakdown: [
        { title: 'Ruang ditawarkan mengikut jenis', items: countBy_(offered, function (r) { return r.jenis_ruang; }) },
        { title: 'Ruang ditawarkan mengikut lokasi', items: sortDesc_(countBy_(offered, function (r) { return r.lokasi; })) },
        { title: 'Saluran paip semua ruang (mengikut status)', items: pipe }
      ]
    };
  },

  // KAI 4: pelajar mendaftar dalam GiGAUTM Ascend pada tahun itu.
  kai4: function (kpi, rows, year, ctx) {
    // Setiap rekod = pelajar GiGA; tahun pelaporan = tahun rekod dicipta (tiada medan status / tarikh).
    var counted = rows.filter(function (r) { return createdYear_(r, ['tarikh_daftar']) === year; });
    return {
      value: counted.length,
      secondary: [
        { label: 'Jumlah pendapatan gig (RM)', value: rm_(sumOf_(counted.map(function (r) { return { v: num_(r.gig_pendapatan) }; }), 'v')) }
      ],
      breakdown: [
        { title: 'Pelajar mengikut fakulti (cadangan minimum 2 setiap fakulti)', items: perFacultyItems_(kpi, counted, ctx.faculties) },
        { title: 'Pelajar mengikut bidang gig', items: sortDesc_(countBy_(counted, function (r) { return r.bidang_gig; })) }
      ]
    };
  },

  // KAI 5: pelajar mendaftar dalam F-SIP pada tahun itu.
  kai5: function (kpi, rows, year) {
    var counted = countedInYear_(rows, ['Mendaftar', 'Tamat'], 'tarikh_daftar', year);
    return {
      value: counted.length,
      secondary: [{ label: 'Kertas konsep diluluskan', value: rows.filter(function (r) { return r.kertas_konsep_status === 'Diluluskan'; }).length }],
      breakdown: [
        { title: 'Pelajar mendaftar mengikut fakulti', items: sortDesc_(countBy_(counted, function (r) { return r.fakulti; })) },
        { title: 'Semua pelajar mengikut peringkat (keseluruhan)', items: countBy_(rows, function (r) { return r.status; }) }
      ]
    };
  },

  // KAI 6: pelajar dilatih membentuk startup AI pada tahun itu; minimum 5 setiap fakulti (FAI, FC, FKE, MJIIT).
  kai6: function (kpi, rows, year, ctx) {
    // Tahun pelaporan = tahun rekod dicipta (tiada medan tarikh mula latihan).
    var okStatus = PERINGKAT_STARTUP.concat(['Ideasi', 'Prototaip / MVP', 'Dalam latihan', 'Tamat latihan']);   // nilai lama dikira sehingga setup() menukarnya
    var counted = rows.filter(function (r) { return okStatus.indexOf(String(r.status || '').trim()) >= 0 && createdYear_(r, ['tarikh_mula_latihan']) === year; });   // lazim lama dikira sehingga setup() menukarnya
    var startups = {};
    counted.forEach(function (r) { if (r.nama_startup) startups[String(r.nama_startup).toLowerCase()] = 1; });
    return {
      value: counted.length,
      secondary: [
        { label: 'Startup AI (unik)', value: Object.keys(startups).length },
        { label: 'Startup ditubuhkan', value: counted.filter(function (r) { return r.startup_ditubuhkan === 'Ya'; }).length }
      ],
      breakdown: [
        { title: 'Mengikut fakulti (minimum 5 setiap fakulti)', items: perFacultyItems_(kpi, counted, ctx.faculties) },
        { title: 'Semua pelajar mengikut status (keseluruhan)', items: countBy_(rows, function (r) { return r.status; }) }
      ]
    };
  }
};

function readTargets_() {
  var out = {};
  readTable_(SHEETS.TARGETS, { tahun: 'number', sasaran: 'number', q1: 'number', q2: 'number', q3: 'number', q4: 'number' }).rows.forEach(function (r) {
    if (!r.kpi || r.tahun === '') return;
    out[r.kpi] = out[r.kpi] || {};
    out[r.kpi][r.tahun] = { sasaran: r.sasaran, q: [r.q1, r.q2, r.q3, r.q4], jenis: r.jenis, bajet: r.bajet_rm, catatan: r.catatan };
  });
  return out;
}

function statusFor_(kpi, value, target) {
  if (target === '' || target === undefined || target === null) return 'Tiada sasaran';
  if (kpi.jenis === 'penggunaan') {   // peratus peruntukan digunakan: makin hampir 100% makin cekap; lebih 100% = melebihi peruntukan
    if (value > 100) return 'Melebihi peruntukan';
    return value >= target ? 'Capai sasaran' : 'Di bawah sasaran';
  }
  if (kpi.jenis === 'kemajuan') {
    if (value >= 100) return 'Selesai';
    return value >= target ? 'Capai sasaran' : 'Di bawah sasaran';
  }
  if (value > target) return 'Melebihi sasaran';
  return value === target ? 'Capai sasaran' : 'Di bawah sasaran';
}

function currentQuarter_() {
  return Math.ceil(parseInt(Utilities.formatDate(new Date(), APP.TZ, 'M'), 10) / 3);
}

function buildKpiCard_(kpi, rows, year, targets, ctx) {
  var m = MEASURES[kpi.measure](kpi, rows, year, ctx);
  var t = (targets[kpi.id] || {})[year] || null;
  var target = t && t.sasaran !== '' ? t.sasaran : '';
  var card = {
    id: kpi.id, title: kpi.title, short: kpi.short, group: kpi.group, level: kpi.level, teras: kpi.teras || null, fungsi: kpi.fungsi || null, unit: kpi.unit, jenis: kpi.jenis, format: kpi.valueFormat || '',
    value: m.value, target: target,
    pct: target !== '' && target > 0 ? round1_(m.value / target * 100) : null,
    status: statusFor_(kpi, m.value, target),
    secondary: m.secondary || [], breakdown: m.breakdown || [], warnings: m.warnings || [],
    note: t ? t.catatan : ''
  };
  var nowYear = yearOf_(todayIso_());
  if (t && target !== '' && year === nowYear) {
    var q = currentQuarter_();
    var qt = t.q[q - 1];
    card.quarter = q;
    card.quarterTarget = qt === '' || qt === undefined ? '' : qt;
    card.quarterStatus = card.quarterTarget === '' ? 'Tiada sasaran suku tahun' : statusFor_(kpi, m.value, card.quarterTarget);
  }
  if (kpi.id === 'KAI6') card.secondaryTargets = 'Sasaran sekunder startup AI 2026: Q1 0, Q2 1, Q3 2, Q4 3';
  return card;
}

/**
 * Ukuran Pekerjaan Premium Tier 1: peratus usahawan pelajar yang PURATA pendapatan sebulan (jumlah pendapatan dibahagi
 * bilangan bulan dilaporkan dalam tahun itu) melebihi ambang RM4,000, daripada semua usahawan yang melaporkan pendapatan (CKAI 7).
 * Seorang usahawan dikenal pasti melalui no. KP; jika tiada, no. matrik; jika tiada, nama perniagaan dan fakulti.
 */
function premiumShare_(rows, year) {
  var people = {};
  rows.forEach(function (r) {
    if (yearOf_(ckai7Ym_(r)) !== year) return;
    var key = String(r.no_kp || '').replace(/^'/, '').trim().toLowerCase() || String(r.no_matrik || '').replace(/^'/, '').trim().toLowerCase() || (String(r.nama_perniagaan || '').trim().toLowerCase() + '|' + String(r.fakulti || ''));
    if (key === '|') return;
    var p = people[key] || (people[key] = { sum: 0, months: {} });
    p.sum += ckai7Rm_(r); p.months[ckai7Ym_(r)] = 1;
  });
  var total = 0, premium = 0;
  Object.keys(people).forEach(function (k) {
    var n = Object.keys(people[k].months).length;
    if (!n) return;
    total++;
    if (people[k].sum / n > APP.PREMIUM_INCOME_RM) premium++;
  });
  var pct = total ? round1_(premium * 100 / total) : 0;
  return {
    label: 'Pekerjaan Premium Tier 1', premium: premium, total: total, pct: pct,
    thresholdRm: APP.PREMIUM_INCOME_RM, targetPct: APP.PREMIUM_TARGET_PCT, targetYear: APP.PREMIUM_TARGET_YEAR,
    pctOfTarget: Math.round(pct * 100 / APP.PREMIUM_TARGET_PCT)
  };
}

/** Data dibaca sekali setiap panggilan dan dikongsi antara tahun (Infografik mengira 5 tahun sekaligus). */
var DASH_MEMO_ = null;
function dashMemo_() {
  if (!DASH_MEMO_) DASH_MEMO_ = { tables: {}, targets: readTargets_(), faculties: listFaculties_() };
  return DASH_MEMO_;
}

function computeDashboard_(year) {
  var memo = dashMemo_(), targets = memo.targets, cache = memo.tables;
  function tableRows(id) {
    var k = getKpi_(id);
    if (!k.sheet) return [];
    return cache[id] || (cache[id] = readTable_(k.sheet, typesFor_(k)).rows);
  }
  var ctx = { faculties: memo.faculties, rows: tableRows, kpt2Den: function (y) {
    if (!cache.__den) cache.__den = getSS_().getSheetByName(SHEETS.KPT2_DEN) ? readTable_(SHEETS.KPT2_DEN).rows : [];
    var n = 0;
    cache.__den.forEach(function (r) { if (num_(r.tahun) === y) n += num_(r.bil_penyebut); });
    return n;
  } };
  var cards = KPIS.map(function (kpi) {
    return buildKpiCard_(kpi, tableRows(kpi.id), year, targets, ctx);
  });
  var withTarget = cards.filter(function (c) { return c.target !== ''; }).length;
  var meet = cards.filter(function (c) { return c.status === 'Capai sasaran' || c.status === 'Melebihi sasaran' || c.status === 'Selesai'; }).length;
  return {
    year: year, years: APP.YEARS, levels: LEVELS, teras: TERAS, functions: FUNCTIONS, generatedAt: nowIso_(),
    ds: { label: 'DS 04 · Pekerjaan Premium Tier 1', goal: '40% Pekerjaan Premium Tier 1 (2030)' },
    summary: { total: withTarget, meet: meet },
    premium: premiumShare_(tableRows('CKAI7'), year),
    kpis: cards
  };
}

/** Dashboard awam dengan cache pendek. Tidak memerlukan log masuk. */
function getDashboard_(yearIn) {
  var year = parseInt(yearIn, 10);
  if (APP.YEARS.indexOf(year) < 0) year = Math.min(Math.max(yearOf_(todayIso_()), APP.YEARS[0]), APP.YEARS[APP.YEARS.length - 1]);
  var cache = CacheService.getScriptCache();
  var hit = cache.get('dash:' + year);
  if (hit) return JSON.parse(hit);
  var d = computeDashboard_(year);
  try { cache.put('dash:' + year, JSON.stringify(d), APP.DASH_CACHE_TTL); } catch (e) { /* terlalu besar: abaikan cache */ }
  return d;
}

/** Infografik: dashboard tahun dipilih + trend dalam satu panggilan (satu bacaan Sheet dikongsi semua tahun). */
function getInfografik_(yearIn) {
  var d = getDashboard_(yearIn), t = getTrend_();
  return { dash: d, trend: t };
}

/** Trend 2026-2030 untuk Infografik (awam, agregat sahaja): nilai setiap KPI, ukuran premium dan bilangan KPI mencapai sasaran bagi setiap tahun. */
function getTrend_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('trend');
  if (hit) return JSON.parse(hit);
  var out = APP.YEARS.map(function (y) {
    var d = getDashboard_(y);
    var vals = {};
    d.kpis.forEach(function (c) { vals[c.id] = { v: c.value, t: c.target, p: c.pct }; });
    return { year: y, premiumPct: d.premium ? d.premium.pct : 0, premiumTotal: d.premium ? d.premium.total : 0, meet: d.summary.meet, total: d.summary.total, kpis: vals };
  });
  try { cache.put('trend', JSON.stringify(out), APP.DASH_CACHE_TTL); } catch (e) { /* abaikan */ }
  return out;
}

// ===== Admin.gs =====
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

// ===== Logos.gs =====
/** Logo kulit slaid (dijana oleh tools/make_slide_logos.js). Dimuat hanya apabila "Cetak slide" ditekan. */
var SLIDE_LOGOS = {
  utm: "data:image/webp;base64,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",
  xcite: "data:image/webp;base64,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"
};

// ===== Code.gs =====
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

