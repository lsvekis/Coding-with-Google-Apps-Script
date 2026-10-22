/** Kawalan demo: log masuk pantas, e-mel OTP simulasi, panduan dan set semula data. */
(function () {
  'use strict';
  var css = document.createElement('style');
  css.textContent =
    '#demobar{position:fixed;right:12px;bottom:12px;z-index:60;background:#2b1a1f;color:#fff;border-radius:12px;box-shadow:0 4px 18px #0005;font:12.5px/1.4 "Segoe UI",Roboto,Arial,sans-serif;max-width:min(92vw,560px)}' +
    '#demobar .dh{display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;user-select:none}' +
    '#demobar .tag{background:#e9b949;color:#2b1a1f;font-weight:700;border-radius:6px;padding:2px 7px;font-size:11px;letter-spacing:.4px}' +
    '#demobar .db{display:none;padding:4px 12px 12px;border-top:1px solid #ffffff22}' +
    '#demobar.open .db{display:block}' +
    '#demobar p{margin:8px 0 6px;color:#ffffffcc}' +
    '#demobar .row{display:flex;gap:6px;flex-wrap:wrap}' +
    '#demobar button{background:#fff;color:#5c0f2a;border:0;border-radius:7px;padding:6px 10px;font:inherit;font-weight:600;cursor:pointer}' +
    '#demobar button.o{background:transparent;color:#fff;border:1px solid #ffffff66;font-weight:500}' +
    '#demobar button:hover{filter:brightness(.92)}' +
    '#demomail{position:fixed;right:12px;top:72px;z-index:70;display:flex;flex-direction:column;gap:8px;max-width:min(92vw,340px)}' +
    '#demomail .m{background:#fff;color:#2b1a1f;border:1px solid #e3d9dc;border-left:5px solid #5c0f2a;border-radius:10px;box-shadow:0 4px 18px #0004;padding:10px 12px;font:13px/1.45 "Segoe UI",Roboto,Arial,sans-serif}' +
    '#demomail .m b.code{display:block;font-size:26px;letter-spacing:6px;color:#5c0f2a;margin:4px 0}' +
    '#demomail .m small{color:#6a5a5f}' +
    '#demomail .m button{margin-top:6px;margin-right:6px;border:1px solid #5c0f2a;background:#fff;color:#5c0f2a;border-radius:6px;padding:4px 9px;font:inherit;cursor:pointer}' +
    '#demomodal{position:fixed;inset:0;background:#0007;z-index:80;display:flex;align-items:center;justify-content:center;padding:16px}' +
    '#demomodal .dlg{background:#fff;color:#2b1a1f;border-radius:12px;padding:20px 22px;max-width:560px;width:100%;max-height:88vh;overflow:auto;font:14px/1.5 "Segoe UI",Roboto,Arial,sans-serif}' +
    '#demomodal h2{color:#5c0f2a;font-size:18px;margin:0 0 8px}#demomodal ol{padding-left:20px;margin:8px 0}#demomodal li{margin:5px 0}' +
    '#demomodal button{margin-top:10px;background:#5c0f2a;color:#fff;border:0;border-radius:7px;padding:8px 14px;font:inherit;cursor:pointer}';
  document.head.appendChild(css);

  var bar = document.createElement('div');
  bar.id = 'demobar';
  bar.innerHTML = '<div class="dh" role="button" tabindex="0" aria-expanded="false"><span class="tag">PROTOTAIP PRA-DEMO</span><span>Data contoh sahaja · bukan sistem sebenar</span><span style="margin-left:auto">▲</span></div>' +
    '<div class="db"><p>Log masuk pantas (tanpa OTP) atau cuba log masuk biasa: kod OTP simulasi akan muncul di kanan bawah.</p>' +
    '<div class="row"><button data-d="admin.demo@utm.my">Admin</button><button data-d="pic.fai@utm.my">PIC Fakulti AI</button><button data-d="pic.fc@utm.my">PIC Fakulti Komputeran</button><button class="o" data-d="">Awam (log keluar)</button></div>' +
    '<p>Data yang anda masukkan disimpan dalam pelayar ini sahaja.</p>' +
    '<div class="row"><button class="o" data-a="guide">Panduan demo</button><button class="o" data-a="reset">Set semula data contoh</button></div></div>';
  document.body.appendChild(bar);
  var head = bar.querySelector('.dh');
  function toggle() { var o = bar.classList.toggle('open'); head.setAttribute('aria-expanded', String(o)); head.lastChild.textContent = o ? '▼' : '▲'; }
  head.addEventListener('click', toggle);
  head.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });

  bar.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-d')) {
      var email = b.getAttribute('data-d');
      try {
        if (!email) { localStorage.removeItem('utmx_token'); sessionStorage.removeItem('utmx_token'); }
        else { var tok = randomHex_(48); CacheService.getScriptCache().put('sess:' + sha256Hex_(tok), email, APP.SESSION_TTL); localStorage.setItem('utmx_token', tok); }
      } catch (err) { /* abaikan */ }
      window.__demoPersistNow(); location.reload();
    } else if (b.getAttribute('data-a') === 'reset') {
      if (confirm('Set semula semua data contoh? Perubahan anda akan hilang.')) { window.__demoReset(); location.reload(); }
    } else if (b.getAttribute('data-a') === 'guide') { showGuide(); }
  });

  function showGuide() {
    var m = document.createElement('div'); m.id = 'demomodal';
    m.innerHTML = '<div class="dlg" role="dialog" aria-modal="true"><h2>Cadangan aliran demo (10 minit)</h2><ol>' +
      '<li><b>Dashboard awam:</b> tanpa log masuk. Tukar tahun dan tukar paparan <i>Mengikut peringkat / Mengikut fungsi</i> (enam fungsi UTMXCITE). Buka "Butiran" pada beberapa kad.</li>' +
      '<li><b>Log masuk OTP:</b> tekan Log Masuk, masukkan <code>pic.fai@utm.my</code>. Kod OTP simulasi muncul di kanan bawah.</li>' +
      '<li><b>PIC Fakulti AI:</b> sidebar hanya menunjukkan KPI yang dibenarkan. Buka <i>CKAI 1 Profiling</i> dan tambah satu profil.</li>' +
      '<li><b>Daftar program (CKAI 2/3):</b> tambah program Selesai dan lihat medan wajib (tarikh, tempat, penyertaan, kos, pendapatan).</li>' +
      '<li><b>Anugerah (CKAI 9):</b> tambah beberapa pelajar, muat naik sijil PDF, kemudian muat turun semula.</li>' +
      '<li><b>Inovasi pelajar (CKAI 8):</b> tapis "Status peningkatan = Calon peningkatan" untuk melihat projek yang boleh dibawa ke peringkat lebih tinggi.</li>' +
      '<li><b>Sekatan akses:</b> PIC tidak boleh membuka CKAI 4 / 5 / 6 atau data fakulti lain.</li>' +
      '<li><b>Admin:</b> tukar ke Admin. Tunjukkan Urus Pengguna, Sasaran (isi sasaran CKAI) dan Log Audit.</li>' +
      '<li><b>Kembali ke dashboard awam:</b> angka dikemas kini serta-merta; tiada nama atau data peribadi dipaparkan.</li></ol>' +
      '<p style="color:#6a5a5f;font-size:12.5px">Semua nama, no. matrik dan no. KP dalam prototaip ini adalah rekaan. Sasaran CKAI hanyalah contoh.</p><button>Tutup</button></div>';
    m.addEventListener('click', function (e) { if (e.target === m || e.target.tagName === 'BUTTON') m.remove(); });
    document.body.appendChild(m);
  }

  // E-mel OTP simulasi
  var box = document.createElement('div'); box.id = 'demomail'; document.body.appendChild(box);
  window.__demoMail = function (mail) {
    var code = (/(\d{6})/.exec(mail.body || '') || [])[1] || '';
    var d = document.createElement('div'); d.className = 'm';
    d.innerHTML = '<small>E-mel simulasi kepada <b></b></small><b class="code"></b><small>Sah 5 minit. Dalam sistem sebenar kod ini dihantar melalui e-mel.</small><br><button data-c>Salin kod</button><button data-x>Tutup</button>';
    d.querySelector('small b').textContent = mail.to;
    d.querySelector('.code').textContent = code;
    if (!code) { d.querySelector('.code').textContent = 'E-mel ujian'; }
    d.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-c')) { try { navigator.clipboard.writeText(code); e.target.textContent = 'Disalin'; } catch (err) { /* abaikan */ } }
      if (e.target.hasAttribute('data-x')) d.remove();
    });
    box.appendChild(d);
    setTimeout(function () { d.remove(); }, 90000); // hilang sendiri supaya tidak menutup UI
    var inp = document.getElementById('l_code'); if (inp) setTimeout(function () { var i2 = document.getElementById('l_code'); if (i2) i2.placeholder = code; }, 300);
  };
  // Kotak e-mel hilang apabila dialog log masuk ditutup (log masuk berjaya atau dibatal)
  var modalHost = document.getElementById('modal') || document.getElementById('app');
  new MutationObserver(function () {
    var m = document.getElementById('modal');
    if (m && !m.firstChild) box.innerHTML = '';
  }).observe(document.body, { childList: true, subtree: true });
})();
