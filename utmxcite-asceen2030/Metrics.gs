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
