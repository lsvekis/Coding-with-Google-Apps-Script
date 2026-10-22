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
