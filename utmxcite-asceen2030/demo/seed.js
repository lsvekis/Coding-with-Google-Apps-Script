/**
 * Data CONTOH untuk prototaip pra-demo. Semua nama, no. matrik dan no. KP adalah rekaan.
 * Menggunakan fungsi pelayan sebenar (saveRecord_, saveUser_, saveTarget_, uploadFile_) supaya data melalui pengesahan yang sama.
 */
window.__demoSeed = function () {
  var tok = randomHex_(48);
  CacheService.getScriptCache().put('sess:' + sha256Hex_(tok), 'admin.demo@utm.my', 600);

  var now = new Date();
  var Y = Math.min(Math.max(now.getFullYear(), APP.YEARS[0]), APP.YEARS[APP.YEARS.length - 1]);
  var curM = Y === now.getFullYear() ? now.getMonth() + 1 : 12;
  var lastM = Math.max(3, Math.min(curM, 9));          // bulan terakhir yang dilaporkan
  function p2(n) { return ('0' + n).slice(-2); }
  function ymd(m, d) { return Y + '-' + p2(Math.min(m, lastM)) + '-' + p2(d); }
  function ym(m) { return Y + '-' + p2(m); }
  // Data asas pelajar (tab PELAJAR): daftar pelajar contoh dahulu; rekod KPI hanya membawa no. matrik.
  var kpCounter = 0, stuSeen = {};
  function ensureStu(m, nama, kp, fak, emel, tel) {
    m = String(m || '').trim(); if (!m || stuSeen[m.toUpperCase()]) return;
    stuSeen[m.toUpperCase()] = 1;
    var kpv = String(kp || '').replace(/-/g, '');
    if (!/^[A-Za-z0-9]{6,20}$/.test(kpv)) kpv = '90' + ('0000000000' + (++kpCounter)).slice(-10);
    var r = saveStudents_(tok, [{ no_matrik: m, nama_pelajar: nama || ('Pelajar Contoh ' + m), no_kp: kpv, fakulti: fak || 'FAI', emel: emel || '', telefon: tel || '' }]).results[0];
    if (!r.ok) throw new Error('Seed PELAJAR gagal ' + m + ' ' + JSON.stringify(r.fields));
  }
  function save(kpi, rec) {
    var def = getKpi_(kpi);
    if (def.student) {
      var mp = def.student.map, mk = def.student.matrik;
      if (!rec[mk] && rec[mp.no_kp] && !(kpi === 'KPT2')) rec[mk] = 'M' + String(rec[mp.no_kp]).replace(/[^A-Za-z0-9]/g, '');
      ensureStu(rec[mk], rec[mp.nama_pelajar], rec[mp.no_kp], (mp.fakulti && rec.fakulti) || rec.fakulti, rec[mp.emel], rec[mp.telefon]);
    }
    def.fields.forEach(function (f) { if (f.type === 'people' && Array.isArray(rec[f.key])) rec[f.key].forEach(function (p) { ensureStu(p.matrik, p.nama, p.nokp, 'FAI'); }); });
    try { return saveRecord_(tok, kpi, rec); }
    catch (e) { throw new Error('Seed ' + kpi + ' gagal: ' + e.message + ' ' + JSON.stringify(e.fields || {}) + ' ' + JSON.stringify(rec)); }
  }
  function nm(prefix, i) { return prefix + ' ' + p2(i); }
  var FAC = ['FAI', 'FC', 'FKE', 'MJIIT', 'FKA', 'FKM', 'FKT', 'FS'];
  function fac(i) { return FAC[i % FAC.length]; }

  // ---- Pengguna contoh
  saveUser_(tok, { emel: 'pic.fai@utm.my', nama: 'PIC Fakulti AI (contoh)', peranan: 'PIC', fakulti: 'FAI', kpi_akses: 'KAI1,KAI4,KAI6,CKAI1,CKAI2,CKAI3,CKAI7,CKAI8,CKAI9,KPT2,KPT3,KPT4,KPT6,KPT7', aktif: 'Ya' });
  saveUser_(tok, { emel: 'pic.fc@utm.my', nama: 'PIC Fakulti Komputeran (contoh)', peranan: 'PIC', fakulti: 'FC', kpi_akses: 'KAI1,KAI4,KAI6,CKAI1,CKAI2,CKAI3,CKAI7,CKAI8,CKAI9,KPT2,KPT3,KPT4,KPT6,KPT7', aktif: 'Ya' });

  // ---- Sasaran CKAI (contoh sahaja; sasaran sebenar akan ditetapkan oleh UTMXCITE)
  [['CKAI1', 120], ['CKAI2', 10], ['CKAI3', 8], ['CKAI4', 30], ['CKAI5', 600], ['CKAI6', 60000], ['CKAI7', 120000], ['CKAI8', 12], ['CKAI9', 8]].forEach(function (t) {
    saveTarget_(tok, { kpi: t[0], tahun: Y, sasaran: t[1], catatan: 'Sasaran CONTOH untuk demo' });
  });

  // ---- KAI 1 Launchpad
  [['Technology Startup', 'Inkubator Fakulti', 'FAI', 'Launchpad FAI', 'Beroperasi'], ['High-Income Gig', 'Inkubator Fakulti', 'FC', 'Launchpad FC', 'Beroperasi'],
   ['Technology Startup', 'Inkubator Fakulti', 'FKE', 'Launchpad FKE', 'Dalam pembangunan'], ['Social Enterprise', 'Inkubator Fakulti', 'MJIIT', 'Launchpad MJIIT', 'Dalam pembangunan'],
   ['High-Income Gig', 'Inkubator Fakulti', 'FKM', 'Launchpad FKM', 'Dalam pembangunan'], ['Social Enterprise', 'Co-working / Ruang Individu', 'UTMXCITE', 'Co-working UTMXCITE A', 'Beroperasi'],
   ['Technology Startup', 'Co-working / Ruang Individu', 'UTMXCITE', 'Ruang Individu B', 'Dalam pembangunan']].forEach(function (r, i) {
    save('KAI1', { aliran: r[0], jenis: r[1], fakulti: r[2], nama_inkubator: r[3], didaftarkan: 'Ya', tarikh_pendaftaran: ymd(1 + (i % 3), 10 + i), status: r[4], tarikh_beroperasi: r[4] === 'Beroperasi' ? ymd(3, 15) : '', kapasiti: 20 + i * 5, bil_ahli: 6 + i, bil_mentor: 2 });
  });
  save('KAI1', { aliran: 'Social Enterprise', jenis: 'Inkubator Fakulti', fakulti: 'FS', nama_inkubator: 'Launchpad FS (cadangan)', didaftarkan: 'Tidak', status: 'Dicadangkan' });

  // ---- KAI 2 Makerspace dan DKAI 1 (milestone berpemberat)
  function setMilestone(kpi, idx, pct, status) {
    var rows = listRecords_(tok, kpi, {}).rows.sort(function (a, b) { return a.id < b.id ? -1 : 1; });
    var r = rows[idx]; r.peratus_siap = pct; r.status = status; if (status === 'Siap') r.tarikh_siap = ymd(4, 20);
    save(kpi, r);
  }
  setMilestone('KAI2', 0, 100, 'Siap'); setMilestone('KAI2', 1, 60, 'Dalam proses');
  setMilestone('DKAI1', 0, 100, 'Siap'); setMilestone('DKAI1', 1, 30, 'Dalam proses');

  // ---- KAI 3 Ruang perniagaan
  for (var i = 1; i <= 10; i++) {
    var st = i <= 5 ? 'Disewa' : i <= 8 ? 'Ditawarkan' : 'Dalam perolehan';
    var rec = { kod_lot: 'Lot ' + p2(i), jenis_ruang: i % 3 ? 'Kiosk / Lot Mudah Alih' : 'Student Mall', lokasi: ['KTDI', 'KTHO', 'KTR', 'FC', 'FKE'][i % 5], status: st };
    if (st !== 'Dalam perolehan') rec.tarikh_ditawarkan = ymd(2, i + 1);
    if (st === 'Disewa') { rec.penyewa_nama = nm('Pasukan Contoh', i); rec.penyewa_kp = '0501' + p2(i) + '10' + ('0000' + i).slice(-4); rec.tarikh_mula_sewa = ymd(3, i + 1); rec.kadar_sewa = 150; }
    save('KAI3', rec);
  }

  // ---- KAI 4 GiGAUTM Ascend, KAI 5 F-SIP, KAI 6 UTM AI Start Up
  for (i = 1; i <= 14; i++) {
    save('KAI4', { fakulti: fac(i), nama_pelajar: nm('Pelajar GiGA Contoh', i), no_kp: '0001' + p2(i) + '10' + ('0000' + i).slice(-4), no_matrik: 'G24' + p2(i) + '001', tahun_pengajian: 1 + (i % 4), program: 'Program contoh', bidang_gig: ['Reka bentuk grafik', 'Pengaturcaraan', 'Penulisan', 'Pemasaran digital'][i % 4], mentor_nama: 'Mentor Contoh ' + (1 + (i % 3)), gig_pendapatan: i <= 3 ? 800 * i : 0 });
  }
  for (i = 1; i <= 2; i++) save('KAI5', { fakulti: fac(i), nama_pelajar: nm('Pelajar F-SIP Contoh', i), no_matrik: 'F24' + p2(i) + '001', status: 'Mendaftar', tarikh_daftar: ymd(5, 10 + i), nama_startup: 'Startup F-SIP ' + i, kelulusan_caq: 'Diluluskan' });
  [['FAI', 4], ['FC', 3], ['FKE', 2], ['MJIIT', 2]].forEach(function (f, fi) {
    for (var j = 1; j <= f[1]; j++) save('KAI6', { fakulti: f[0], nama: nm('Pelajar AI ' + f[0] + ' Contoh', j), no_matrik: 'A' + (fi + 1) + p2(j) + '24', status: PERINGKAT_STARTUP[j % 5], nama_startup: 'AI Startup ' + f[0] + ' ' + Math.ceil(j / 2), bidang_ai: ['Analisis Data dan Pelaporan', 'Automasi Proses Kerja', 'Khidmat Pelanggan dan Chatbot', 'Pendidikan dan Pembelajaran'][j % 4], mentor_industri: 'Mentor Industri Contoh', link_profil: 'https://contoh.my/profil/' + f[0].toLowerCase() + j, startup_ditubuhkan: j % 3 === 0 ? 'Ya' : 'Tidak' });
  });

  // ---- CKAI 1 Profiling pelajar
  var minat = ['Tinggi', 'Sederhana', 'Rendah', 'Tinggi', 'Sederhana', 'Tiada minat'], ready = ['Ada idea', 'Belum ada idea', 'Ada prototaip / MVP', 'Ada idea', 'Sudah beroperasi', 'Belum ada idea'];
  var sumber = ['Tinjauan / soal selidik', 'Saringan fakulti', 'Pendaftaran minat', 'Rujukan pensyarah / mentor', 'Penyertaan program UTMXCITE'];
  for (i = 1; i <= 36; i++) {
    save('CKAI1', { fakulti: fac(i), nama_pelajar: nm('Pelajar Profil Contoh', i), no_matrik: 'P24' + p2(i) + '0' + (i % 9 + 1), tarikh_profiling: ymd(1 + (i % lastM), 3 + (i % 20)), sumber_profiling: sumber[i % sumber.length], tahap_minat: minat[i % 6], tahap_kesediaan: ready[i % 6], pengalaman_perniagaan: i % 7 === 0 ? 'Sedang berniaga' : 'Tiada' });
  }

  // ---- CKAI 2 & 3 Program
  function prog(kpi, n, kat, fak, mon, ppl, cost, inc, status) {
    save(kpi, { fakulti: fak, nama_program: n, kategori: kat, tahap: fak === 'UTMXCITE' ? 'Pusat (UTMXCITE)' : 'Fakulti', status: status || 'Selesai', tarikh_mula: ymd(mon, 5), tarikh_tamat: status === 'Dirancang' ? '' : ymd(mon, 6), lokasi: 'Dewan ' + fak, bil_peserta: ppl, bil_pelajar: Math.round(ppl * 0.8), bil_staf: Math.round(ppl * 0.1), bil_luar: ppl - Math.round(ppl * 0.8) - Math.round(ppl * 0.1), bajet_rm: cost, pendapatan_rm: inc, skor_kepuasan: 4.3 });
  }
  prog('CKAI2', 'Bengkel Asas Keusahawanan', 'Bengkel', 'FAI', 2, 60, 2500, 600); prog('CKAI2', 'Bootcamp Perniagaan Digital', 'Bootcamp', 'FC', 3, 45, 4800, 1200);
  prog('CKAI2', 'Kursus Pitching Pelaburan', 'Kursus / Latihan', 'UTMXCITE', 4, 80, 6500, 0); prog('CKAI2', 'Forum Usahawan Muda', 'Seminar / Forum', 'FKE', 5, 120, 3200, 900);
  prog('CKAI2', 'Mentoring Perniagaan Siri 1', 'Mentoring', 'MJIIT', 6, 30, 1500, 0); prog('CKAI2', 'Pertandingan Pelan Perniagaan', 'Pertandingan', 'FKM', 7, 90, 7000, 2000);
  prog('CKAI2', 'Bengkel Akan Datang', 'Bengkel', 'FS', 12, 40, 0, 0, 'Dirancang');
  prog('CKAI3', 'Hackathon Inovasi Kampus', 'Hackathon / Pertandingan', 'FC', 3, 150, 9000, 2500); prog('CKAI3', 'Pameran Inovasi Pelajar', 'Pameran / Showcase', 'UTMXCITE', 5, 300, 12000, 4000);
  prog('CKAI3', 'Latihan Prototaip 3D', 'Latihan Teknikal', 'FKM', 4, 35, 3000, 500); prog('CKAI3', 'Bengkel Reka Bentuk Produk', 'Bengkel', 'FAI', 6, 55, 2800, 0);
  prog('CKAI3', 'Forum Inovasi Mampan', 'Seminar / Forum', 'FKT', 7, 100, 3500, 800); prog('CKAI3', 'Hackathon AI (akan datang)', 'Hackathon / Pertandingan', 'FAI', 12, 120, 0, 0, 'Dirancang');

  // ---- CKAI 4 SSU
  for (i = 1; i <= 14; i++) {
    save('CKAI4', { fakulti: fac(i), nama_pelajar: nm('Pelajar SSU Contoh', i), no_kp: '0201' + p2(i) + '10' + ('0000' + i).slice(-4), no_matrik: 'S24' + p2(i) + '001', nama_syarikat: 'Syarikat Contoh ' + p2(i) + ' Sdn Bhd', jenis_perniagaan: JENIS_PERNIAGAAN[i % 6 * 3], bil_rakan_kongsi: 1 + (i % 4), bilangan_pekerja: BILANGAN_PEKERJA[i % 12], jenis_milikan: JENIS_MILIKAN[i % 4], punca_modal: PUNCA_MODAL[i % 9], modal_awal: JUMLAH_MODAL[i % 9], jumlah_jualan: 1000 + i * 350, status_ssm: i % 3 === 0 ? 'Tidak Berdaftar' : 'Berdaftar', tarikh_ssm: i % 3 === 0 ? '' : ymd(1 + (i % lastM), 2), no_daftar_ssm: i % 3 === 0 ? '' : 'SSM-' + p2(i) + '9001', no_ssu: 'SSU-' + Y + '-' + ('000' + i).slice(-4), tarikh_daftar: ymd(1 + (i % lastM), 8 + (i % 15)), status: i === 14 ? 'Tidak Aktif' : 'Aktif', berasaskan_inovasi: i % 3 === 1 ? 'Ya' : 'Tidak', trl_syarikat: i % 3 === 1 ? ['TRL 4', 'TRL 5', 'TRL 6'][i % 3 + (i % 2)] || 'TRL 5' : '' });
  }

  // ---- CKAI 5 Makerspace, CKAI 6 Sewaan ruang niaga, CKAI 7 Pendapatan
  var biz = ['Kedai Contoh A', 'Gig Contoh B', 'Kraf Contoh C', 'Aplikasi Contoh D'];
  for (var m = 1; m <= lastM; m++) {
    var eq = ['3D Printer', 'Laser Cutter Machine', 'Peralatan Tangan (Tools)', 'Sewaan Ruang (Space Rental)', 'Lain-lain (Other)'];
    for (var u = 0; u < 3 + (m % 3); u++) {
      save('CKAI5', { emel: 'pengguna' + u + '@graduate.utm.my', nama: nm('Pemohon Makerspace', m * 5 + u), no_kp: '9901' + p2(m) + '0' + u + '1234', no_matrik: 'A2' + p2(m) + 'EC' + p2(u + 1) + '1', fakulti: fac(m + u), kelas: 'Tahun ' + (1 + u % 4), telefon: '012-34567' + p2(m + u),
        peralatan: eq[(m + u) % eq.length], peralatan_lain: eq[(m + u) % eq.length] === 'Lain-lain (Other)' ? 'Vacuum Former' : '', tujuan: 'Membangunkan prototaip projek contoh', bil_peserta: 1 + (u % 4), tarikh_mula: ymd(m, 3 + u * 5), tarikh_tamat: ymd(m, 3 + u * 5), masa_mula: '09:00', masa_tamat: '12:30', status_bayaran: u === 2 ? 'Tiada Caj' : (m === lastM ? 'Belum Dibayar' : 'Bayar'), bayaran_rm: 5 });
    }
    ['SUB - Lot 1', 'Student Mall - Lot 2', 'Student Mall - Lot 7'].forEach(function (inc, k) {
      var late = m === lastM && k === 2;
      save('CKAI6', { tempoh: ym(m), no_matrik: 'SW' + p2(k + 1), nama_pelajar: 'Pelajar Penyewa Contoh ' + (k + 1), inkubator: inc, penyewa: 'Penyewa Contoh ' + (k + 1), jumlah_rm: 600 + k * 150, status_bayaran: late ? 'Belum dibayar' : 'Dibayar', tarikh_bayar: late ? '' : ymd(m, 7) });
    });
    biz.forEach(function (b, k) {
      save('CKAI7', { fakulti: fac(k), Tahun: Y, Bulan: BULAN_MS[m - 1], nama_perniagaan: b, no_kp: '0401' + p2(k + 1) + '100' + ('000' + k).slice(-3), jantina: k % 2 ? 'Perempuan' : 'Lelaki', bangsa: BANGSA_OPTIONS[k % 6], bidang_pengajian: BIDANG_PENGAJIAN[k % 11], jenis_perniagaan: JENIS_PERNIAGAAN[(k * 5) % JENIS_PERNIAGAAN.length], pendapatan_bulanan: 700 + m * 130 + k * (k === 3 ? 1100 : 220), bilangan_pekerja: BILANGAN_PEKERJA[k % 12] });
    });
  }

  // ---- CKAI 8 Inovasi pelajar (dengan penjejakan peningkatan)
  var pipe = ['Calon peningkatan', 'Sedang disokong', 'Telah dibawa ke peringkat lebih tinggi', 'Belum dinilai', 'Calon peningkatan', 'Belum dinilai', 'Tidak diteruskan', 'Calon peningkatan', 'Belum dinilai'];
  var levels = ['Fakulti', 'Universiti', 'Kebangsaan', 'Fakulti', 'Fakulti', 'Universiti', 'Fakulti', 'Kebangsaan', 'Fakulti'];
  for (i = 0; i < 9; i++) {
    var inn = { fakulti: fac(i), tajuk_inovasi: 'Inovasi Contoh ' + (i + 1), jenis_inovasi: ['Produk fizikal', 'Aplikasi / perisian', 'Perkhidmatan'][i % 3], bidang: 'Digital / AI', trl: 'TRL ' + (3 + (i % 4)), mentor: 'Dr. Mentor Contoh ' + (1 + (i % 3)),
      pelajar: [{ nama: nm('Pelajar Inovasi Contoh', i * 2 + 1), matrik: 'N24' + p2(i + 1) + '01' }, { nama: nm('Pelajar Inovasi Contoh', i * 2 + 2), matrik: 'N24' + p2(i + 1) + '02' }],
      status_penyertaan: 'Telah menyertai', nama_pertandingan: 'Pertandingan ' + levels[i] + ' Contoh', peringkat: levels[i], tarikh: ymd(2 + (i % 6), 12),
      status_peningkatan: pipe[i], peringkat_sasaran: pipe[i] === 'Belum dinilai' || pipe[i] === 'Tidak diteruskan' ? '' : (levels[i] === 'Fakulti' ? 'Universiti' : 'Kebangsaan') };
    if (i === 1 || i === 2 || i === 7) { inn.pingat = i === 2 ? 'Emas' : 'Perak'; inn.nama_anugerah = 'Anugerah Inovasi Contoh'; }
    if (i === 0 || i === 7) inn.sokongan_diperlukan = 'Pembiayaan prototaip dan mentor industri (contoh)';
    save('CKAI8', inn);
  }
  save('CKAI8', { fakulti: 'FAI', tajuk_inovasi: 'Inovasi Akan Datang', jenis_inovasi: 'Produk fizikal', mentor: 'Dr. Mentor Contoh 1', pelajar: [{ nama: 'Pelajar Inovasi Contoh 99', matrik: 'N2499' + '01' }], status_penyertaan: 'Akan menyertai', nama_pertandingan: 'Pertandingan Kebangsaan Contoh', peringkat: 'Kebangsaan', tarikh: ymd(12, 1) });

  // ---- CKAI 10 Perbelanjaan operasi (kedudukan tabung amanah; angka contoh berdasarkan susunan laporan)
  [['Tabung Induk UTM XCITE', 118602.64, 57641.95], ['Tabung Khas Program Keusahawanan KPM - UTM XCITE', 1217006.43, 157938.9], ['Majlis Keusahawanan Universiti Awam Malaysia (MAKMUM)', 190384.28, 21440],
    ['UMUM-Tabung Usahawan Urusetia HEP', 265986.75, 40440.05], ['Tabung Program Mikro Kredit Pelajar UTM - MTDC', 132335, 0]].forEach(function (t) {
    for (var m = 1; m <= lastM; m++) save('CKAI10', Object.assign({ tempoh: ym(m), tabung: t[0], perbelanjaan: Math.round(t[2] * m / lastM * 100) / 100, bajet_sasaran: Math.round(t[1] * m / 12 * 100) / 100 }, m === 1 ? { peruntukan_awal: t[1], komitmen: 0 } : {})); // a dan b diisi sekali sahaja
  });

  // ---- CKAI 9 Anugerah (satu rekod dengan sijil PDF contoh)
  var pdfBody = 'BT /F1 18 Tf 40 100 Td (SIJIL CONTOH - DATA DEMO) Tj ET';
  var pdf = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 400 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length ' + pdfBody.length + '>>stream\n' + pdfBody + '\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF';
  var up = uploadFile_(tok, 'CKAI9', 'sijil', { name: 'sijil-contoh.pdf', data: btoa(pdf) });
  [['FAI', 'Anugerah Inovasi Negara (contoh)', 'Kebangsaan', 'Inovasi', 'Emas'], ['FC', 'Pertandingan Usahawan Muda (contoh)', 'Universiti', 'Keusahawanan', 'Perak'], ['FKE', 'Inovasi Fakulti (contoh)', 'Fakulti', 'Inovasi', 'Johan'],
   ['MJIIT', 'Global Startup Challenge (contoh)', 'Antarabangsa', 'Keusahawanan', 'Anugerah Khas'], ['FKM', 'Anugerah Reka Bentuk (contoh)', 'Kebangsaan', 'Inovasi', 'Gangsa'], ['UTMXCITE', 'Pengiktirafan Pusat Keusahawanan (contoh)', 'Universiti', 'Keusahawanan', 'Penghargaan / Pengiktirafan']].forEach(function (a, k) {
    var rec = { fakulti: a[0], nama_anugerah: a[1], tarikh: ymd(2 + k, 18), agensi: 'Agensi Penganugerah Contoh', peringkat: a[2], kategori: a[3], pingat: a[4], program: ['GiGAUTM Ascend (GiGA)', 'UTM AI Start Up', 'UTM Launchpad', 'F-SIP', 'Program Inovasi Fakulti', 'Lain-lain'][k], program_lain: k === 5 ? 'Program Pusat (contoh)' : '', mentor: 'Dr. Mentor Contoh ' + (1 + (k % 3)),
      pelajar: [{ nama: nm('Pelajar Anugerah Contoh', k * 2 + 1), matrik: 'W24' + p2(k + 1) + '01', nokp: '00010' + (k + 1) + '010001' }, { nama: nm('Pelajar Anugerah Contoh', k * 2 + 2), matrik: 'W24' + p2(k + 1) + '02', nokp: '00020' + (k + 1) + '020002' }] };
    if (k === 0) rec.sijil = { id: up.id, name: up.name };
    else { var u2 = uploadFile_(tok, 'CKAI9', 'sijil', { name: 'sijil-contoh-' + (k + 1) + '.pdf', data: btoa(pdf) }); rec.sijil = { id: u2.id, name: u2.name }; }
    save('CKAI9', rec);
  });

  // ---- KPT (peringkat Kementerian): daftar contoh. KPT 1 dan KPT 5 dikira automatik daripada CKAI 7 dan CKAI 4.
  (function () {
    var den = getSheet_(SHEETS.KPT2_DEN), t = readTable_(SHEETS.KPT2_DEN), hc = den.getRange(1, 1, 1, den.getLastColumn()).getValues()[0].indexOf('bil_penyebut') + 1;
    t.rows.forEach(function (r) { if (num_(r.tahun) === Y) den.getRange(r._row, hc).setValue(20 + FAC.indexOf(r.fakulti) * 3); });
  })();
  for (i = 1; i <= 14; i++) save('KPT2', { tahun_graduan: Y, fakulti: fac(i), nama: nm('Graduan Usahawan Contoh', i), no_kp: '9501' + p2(i) + '105' + ('000' + i).slice(-3), no_matrik: 'GR' + p2(i) + '001', jantina: i % 2 ? 'Lelaki' : 'Perempuan', bangsa: BANGSA_OPTIONS[i % 6], bidang_pengajian: BIDANG_PENGAJIAN[i % 11], nama_perniagaan: 'Perniagaan Graduan ' + p2(i), no_pendaftaran_ssm: 'SSM-' + p2(i) + '0001', jenis_pemilikan: JENIS_MILIKAN[0], jenis_peniagaan: JENIS_PERNIAGAAN[(i * 7) % JENIS_PERNIAGAAN.length], punca_modal: PUNCA_MODAL[0], pendapatan_kasar: 5000 + i * 800, bilangan_pekerja: BILANGAN_PEKERJA[i % 12], tarikh_pernigaan: ymd(3, 5 + (i % 10)) });
  for (i = 1; i <= 24; i++) save('KPT3', { tahun: Y, fakulti: fac(i), nama: nm('Tenaga Pengajar Contoh', i), no_staf: 'ST' + p2(i) + '01', no_kp: '7501' + p2(i) + '105' + ('000' + i).slice(-3), jenis_staf: i % 5 === 0 ? 'Staf bukan akademik' : 'Staf akademik',
    jantina: i % 2 ? 'Lelaki' : 'Perempuan', bumiputera: BANGSA_OPTIONS[i % 6], jawatan: i % 5 === 0 ? 'STAF PENTADBIRAN/PENGURUSAN' : 'PENSYARAH', bidang_kepakaran: BIDANG_KEPAKARAN[i % 8], pesijilan_profesional: i <= 15 ? ['Certified Entrepreneurship Educator', 'Pensijilan Mentor Keusahawanan', 'Certified Business Coach'][i % 3] : '', senarai_projek_mentee: i <= 15 ? 'Projek mentee contoh ' + i : '' });
  for (i = 1; i <= 9; i++) save('KPT4', { fakulti: fac(i), nama: nm('Pelajar Inovasi Contoh', i), no_kp: '0301' + p2(i) + '105' + ('000' + i).slice(-3), no_matrik: 'KP4' + p2(i) + '001', nama_syarikat: 'Syarikat Inovasi ' + p2(i), status_bumiputera: i % 2 ? 'Ya' : 'Tidak', 'nama_projek_inovasi': 'Projek teknologi contoh ' + i, level_TRL: ['TRL 1', 'TRL 2', 'TRL 3'][i % 3], penilaiain_CRL: 'CRL ' + (1 + i % 3), sipnopsis_inovasi: 'Sinopsis contoh ' + i });
  [['FAI', 'MoU', 'Tempatan'], ['FC', 'MoA', 'Antarabangsa'], ['FKE', 'LoI', 'Tempatan'], ['MJIIT', 'Geran penyelidikan', 'Antarabangsa'], ['FKM', 'MoU', 'Tempatan']].forEach(function (a, k) {
    save('KPT6', { fakulti: a[0], tajuk: 'Kolaborasi contoh ' + (k + 1), rakan_institusi: 'Rakan Industri Contoh ' + (k + 1), bidang_kerjasama: ['AI', 'Keusahawanan', 'Penyelidikan'][k % 3], skop: a[2], jenis_dokumen: a[1], bil_projek_aktiviti_berkolabrasi: 1 + (k % 3), nama_projek: 'Projek kolaborasi contoh ' + (k + 1), tarikh_mula: ymd(2 + k, 12), penerangan_impak: 'Impak contoh.' });
  });
  [['FAI', 'ANGEL INVESTOR', 30000], ['FC', 'ENTITI PENDANAAN AWAM', 50000], ['FKE', 'VENTURE CAPITAL', 120000], ['MJIIT', 'HADIAH PERTANDINGAN', 5000]].forEach(function (a, k) {
    save('KPT7', { fakulti: a[0], nama_syarikat: 'Syarikat Dibiayai Contoh ' + (k + 1), mentor: 'Mentor Contoh ' + (k + 1), nama_pemilik: nm('Pemilik Contoh', k + 1), no_kp_pemilik: '8001' + p2(k + 1) + '105' + ('000' + k).slice(-3), bangsa: BANGSA_OPTIONS[k % 6], jenis_perniagaan: JENIS_PERNIAGAAN[(k * 11) % JENIS_PERNIAGAAN.length], sumber_pembiayaan: a[1], jumlah_rm: a[2], tarikh_mula_embiayaan: ymd(3 + k, 9) });
  });
  CacheService.getScriptCache().remove('sess:' + sha256Hex_(tok));
};
