# UTMXCITE 4 ASCEND 2030 Report

Aplikasi web Google Apps Script (GAS) + Google Sheets untuk melaporkan 7 KPI UTMXCITE di bawah **DS 04 · Pekerjaan Premium Tier 1** (KAI 1-6 dan DKAI 1), serta 8 **CKAI** (Center Key Amal Indicator).
Rujukan sebenar: Dokumen Pelan Tindakan UTMXCITE (PDF).

- **Dashboard awam** (tanpa log masuk): kemajuan 7 KPI, data agregat sahaja.
- **Log masuk e-mel + OTP** untuk PIC fakulti dan Admin. Tiada kata laluan.
- **Sidebar kiri** (gaya portal UTM, cerah): pengepala dengan butang menu dan **logo UTM ASCEND**, kad profil (nama dan e-mel), **Dashboard**, dan satu bahagian **PERINGKAT** dengan tiga kumpulan boleh dilipat: **KAI · Universiti** (subtajuk Growth / Transform), **DKAI · Jabatan (JTNC HEPA)** dan **CKAI · Pusat (UTMXCITE)** (subtajuk enam fungsi). Admin mempunyai bahagian **Admin**. Kumpulan yang mengandungi halaman aktif dibuka automatik. Butang menu mengecilkan sidebar kepada ikon (pada telefon ia menutup laci menu).
- **Sub-tab Senarai / Masuk Data** pada bar atas setiap KAI, DKAI dan CKAI.
- Semua data disimpan dalam satu Google Sheet, **satu tab bagi setiap KPI**.

## Empat peringkat penunjuk

| Peringkat | KPI | Tag kad |
|---|---|---|
| **KPT · Peringkat Kementerian** | KPT 1 hingga KPT 7 (KPI Keusahawanan IPT 2026-2030, dikelompokkan mengikut tiga Teras) | KPT |
| **KAI · Peringkat Universiti** | KAI 1 hingga KAI 6 | Growth (KAI 1-3), Transform (KAI 4-6) |
| **DKAI · Peringkat Jabatan (JTNC HEPA)** | DKAI 1 | Department |
| **CKAI · Peringkat Pusat (UTMXCITE)** | CKAI 1 hingga CKAI 9 (dikelompokkan mengikut enam fungsi) | Center |

Dashboard, sidebar dan Infografik dikelompokkan mengikut empat peringkat ini; KPT dipaparkan dahulu.

## KPT · Peringkat Kementerian (Kamus KPI Keusahawanan PTK-IPT 2026-2030)

| KPT | Teras | Sumber data | Pengisian |
|---|---|---|---|
| **KPT 1** · Jumlah jualan agregat usahawan pelajar | 1 | **Automatik** daripada CKAI 7 (jenis pendapatan *Geran / Pembiayaan* dikecualikan) | Tiada borang |
| **KPT 2** · % graduan menceburi keusahawanan | 1 | Daftar graduan (tab `KPT2_Graduan_Usahawan`; jantina, bangsa, bidang pengajian auto daripada PELAJAR) + **penyebut tahunan** (bilangan usahawan pelajar tahun akhir) dalam tab `KPT2_Penyebut` (tahun, fakulti, bil_penyebut; diisi Admin terus dalam Sheet, baris disemai oleh `setup()`) | PIC fakulti dan Admin |
| **KPT 3** · % tenaga pengajar dalam program kompetensi | 1 | Daftar staf (seorang sekali setahun); % = berpesijilan profesional ÷ berdaftar | PIC fakulti dan Admin |
| **KPT 4** · Pelajar memanfaatkan inovasi dan teknologi (TRL 1-3) | 2 | Daftar KPT 4 + pelajar **CKAI 8** (TRL 1-3). Setiap pelajar (no. matrik) dikira **sekali sahaja**, pada tahun kemunculan pertama | PIC fakulti dan Admin |
| **KPT 5** · Syarikat pemula berasaskan inovasi dan teknologi | 2 | **Automatik** daripada CKAI 4 (SSU aktif, *berasaskan inovasi* = Ya, TRL 4-6). CKAI 4 kekal cara lama: Admin sahaja, data dimasukkan secara manual (tiada import daripada sistem SSU) | Tiada borang |
| **KPT 6** · Projek / aktiviti kolaborasi rasmi | 3 | Daftar (MoU, MoA, LoA, LoI, geran), tempatan / antarabangsa, impak, lampiran | PIC fakulti dan Admin |
| **KPT 7** · Syarikat / projek dibiayai | 3 | Daftar KPT 7 + hadiah pertandingan **CKAI 9** (nilai hadiah > RM0). Satu syarikat dikira sekali setahun | PIC fakulti dan Admin |

Sasaran tahunan 2026-2030 disemai daripada kamus semasa `setup()`. Tab baharu: `KPT2_Graduan_Usahawan`, `KPT3_Tenaga_Pengajar`, `KPT4_Pelajar_Inovasi`, `KPT6_Kolaborasi`, `KPT7_Pembiayaan` (KPT 1 dan KPT 5 tiada tab). Dashboard dan Infografik awam hanya menunjukkan agregat; nama dan no. KP hanya dalam Sheet dan senarai Admin / PIC. PIC diberi akses melalui `kpi_akses`: `KPT2,KPT3,KPT4,KPT6,KPT7`.

## Muat naik pukal (CSV)

Setiap KPI yang boleh diisi mempunyai dua cara kemasukan data: **Masuk Data** (satu rekod, borang sedia ada) dan **Muat Naik Pukal** (tab ketiga). Admin dan PIC fakulti (bagi KPI yang diberi akses, hanya untuk fakulti sendiri) boleh muat turun **templat CSV** (tajuk lajur, baris panduan, baris contoh), mengisinya dalam Excel dan memuat naiknya. Setiap baris melalui pengesahan, pemeriksaan unik dan peraturan yang sama seperti borang tunggal; baris yang sah disimpan, baris yang gagal dilaporkan mengikut nombor baris dan boleh dimuat turun sebagai CSV untuk dibetulkan. Maksimum 500 baris dan 1 MB setiap fail. Format tarikh hari/bulan/tahun, pilihan huruf kecil dan Ya/Tidak diterima. Lampiran PDF tidak dimuat naik secara pukal (tambah melalui Edit rekod). Medan ramai orang ditulis `nama|no. matrik|no. KP` dan dipisahkan dengan `##`. Muat naik pukal hanya menambah rekod baharu; ia tidak mengubah rekod sedia ada. Setiap muat naik direkod dalam Log Audit (`MUAT_NAIK_PUKAL`).

## Data asas pelajar (tab PELAJAR)

Semua data pelajar diambil daripada satu tab asas, **`PELAJAR`**, dengan lajur `no_matrik`, `no_kp`, `nama_pelajar`, `emel`, `telefon`, `fakulti` (dua lajur audit `dikemas_kini_pada` dan `dikemas_kini_oleh` ditambah oleh `setup()`; data sedia ada dalam tab tidak diubah). Anda boleh menampal data pelajar terus ke dalam tab ini.

- **Piawai:** setiap KPI berdata pelajar mempunyai empat medan pelajar: **no. matrik** (diisi), serta **nama**, **no. KP** dan **fakulti pelajar** (auto, baca sahaja pada borang; PIC melihat no. KP disamarkan). Pada KPI fakulti, `fakulti` kekal unit pelapor PIC dan fakulti pelajar ialah medan `fakulti_pelajar`.
- **Semua kemasukan pelajar guna kaedah yang sama**, termasuk KAI 3 (penyewa; no. matrik wajib bila *Disewa*, medan `penyewa_nama`, `penyewa_kp`, `penyewa_fakulti` auto) dan senarai ramai pelajar (CKAI 4 rakan kongsi, CKAI 8, CKAI 9): setiap baris hanya no. matrik, manakala nama, no. KP (samar bagi PIC) dan fakulti dipaparkan auto dan disimpan bersama rekod. CKAI 8 kini turut menyimpan no. KP.
- **Kemasukan data hanya memerlukan no. matrik.** Pada KAI 4, 5, 6, CKAI 1, 4, 5, 7, KPT 2 dan KPT 4, nama, no. KP, e-mel dan telefon (serta fakulti bagi KPI Admin: KAI 5, CKAI 4, CKAI 5) tidak lagi ada pada borang; ia disalin daripada PELAJAR semasa simpan (nilai dalam PELAJAR sentiasa digunakan). Pada senarai pelajar (CKAI 4 rakan kongsi, CKAI 8, CKAI 9) setiap baris hanya no. matrik.
- **Jika pelajar tiada atau maklumat tidak lengkap** (nama, no. KP sah dan fakulti; ditambah e-mel dan telefon bagi CKAI 5), satu **tetingkap** dipaparkan untuk melengkapkannya (sebaik no. matrik dimasukkan, atau semasa simpan). Maklumat disimpan dalam PELAJAR dan boleh digunakan semula oleh semua KPI.
- **Siapa boleh mengubah PELAJAR:** Admin boleh mengubah semua medan. PIC hanya boleh mendaftar pelajar baharu atau mengisi medan yang masih kosong / tidak sah; data sah sedia ada tidak ditimpa. Carian no. matrik tidak mendedahkan no. KP, e-mel atau telefon kepada PIC (hanya nama dan fakulti).
- **Muat naik pukal:** templat KPI hanya ada lajur no. matrik bagi pelajar. Baris dengan pelajar yang belum ada dalam PELAJAR dilaporkan sebagai gagal (dengan senarai no. matrik) dan butang **Lengkapkan maklumat pelajar** membuka tetingkap yang sama.
- Rekod lama kekal seperti sedia ada. Jika rekod lama diedit dan no. matrik belum ada dalam PELAJAR, tetingkap melengkapkan akan dipaparkan.
- **PDPA:** no. KP, e-mel dan telefon disimpan dalam Sheet sebagai teks biasa; hadkan akses kepada Sheet. Tiada data ini muncul pada dashboard atau Infografik awam, dan Log Audit hanya merekod no. matrik.

## Segerak CKAI 5 daripada Sheet permohonan (Sheet luar)

CKAI 5 (Penggunaan Makerspace) boleh dikemas kini daripada Sheet borang permohonan peralatan (tab **DATA**; ID dalam `MAKERSPACE_SRC` di Config.gs atau Script Property `MAKERSPACE_SHEET_ID`). Akaun yang menerbitkan aplikasi mesti ada akses **Viewer** pada Sheet itu.

- **Manual:** Admin > CKAI 5 > **Segerak daripada Sheet permohonan**. Setiap baris baharu diimport dan melalui pengesahan yang sama seperti kemasukan biasa; baris bermasalah dilaporkan dengan nombor baris sumber (betulkan di Sheet sumber, kemudian segerak semula).
- **Automatik:** dalam Apps Script, Triggers > Add trigger > fungsi `segerakMakerspace` > Time-driven (contoh: setiap hari).
- **Tiada pendua:** setiap rekod diimport mempunyai kunci sumber (cap masa + no. matrik; lajur `sumber_kunci`), jadi segerak berulang selamat.
- **Pelajar:** no. matrik dipadankan dengan PELAJAR. Pelajar yang belum ada atau belum lengkap didaftar daripada data borang (nama, no. KP, e-mel, telefon, fakulti); data sah sedia ada dalam PELAJAR tidak ditimpa. Fakulti sumber mesti kod fakulti sah (contoh FABU, SPACE).
- **Pemetaan:** peralatan Laser Cut/Cutter -> Laser Cutter Machine; 3D -> 3D Printer; Sewaan Ruang; Peralatan Tangan; selain itu -> Lain-lain (nama asal disimpan). Lajur Fakulti/Jabatan/Unit/Kelas disimpan juga dalam "Jabatan / unit / kelas". Bayaran: jika lajur caj ada amaun (contoh RM25.50) -> Bayar; jika kosong -> Belum Dibayar (RM0), boleh dikemas kini oleh Admin. Bilangan peserta kosong -> 1.
- **Borang permohonan:** pautan Drive asal disimpan (lajur `borang_pautan`); fail kekal milik pemilik asal dan tidak dipindah atau dipadam oleh aplikasi.
- Tab lain dalam Sheet sumber (Sheet4, BLACKLIST / TAK BAYAR) tidak dibaca.

## Log masuk berterusan

Selepas OTP berjaya, pengguna kekal log masuk pada pelayar itu **sehingga menekan Log Keluar** (tiada OTP baharu semasa muat semula atau selepas pelayar ditutup). Token disimpan dalam `localStorage` pelayar; di pelayan, hanya **cincang SHA-256** token disimpan dalam tab `Sesi` (token mentah tidak pernah disimpan). Cache 6 jam hanya mempercepat semakan.

- **Log Keluar** menamatkan sesi itu serta-merta. **Log keluar semua peranti** (pautan di bawah profil) menamatkan semua sesi pengguna.
- Sesi tamat juga apabila akaun **dinyahaktifkan atau dipadam** oleh Admin; peranan dan akses KPI dibaca semula daripada tab Pengguna pada setiap permintaan.
- Had **10 sesi serentak** bagi seorang pengguna (peranti/pelayar); sesi tertua ditamatkan apabila had dilampaui.
- Jika pelayar menyekat storan, atau mod peribadi digunakan, OTP diperlukan semula pada lawatan berikutnya. Pada komputer awam, sentiasa tekan Log Keluar.
- Padam baris tab `Sesi` untuk menamatkan sesi tertentu secara manual.

## Peranan dan akses

| Peranan | Dashboard | KAI 1, 4, 6 (fakulti) | KAI 2, 3, 5, DKAI 1 | Urus pengguna / sasaran / audit |
|---|---|---|---|---|
| Awam | Ya | – | – | – |
| PIC Fakulti | Ya | Fakulti sendiri sahaja, bagi KPI yang diberi akses | – | – |

| Admin | Ya | Semua fakulti | Ya | Ya |

KAI 6 terhad kepada **FAI, FC, FKE, MJIIT**. Semua semakan akses dibuat di pelayar **dan** di pelayan (menyembunyikan menu sahaja tidak digunakan sebagai kawalan).

## Sasaran (semua ialah MINIMUM, boleh dilebihi)

| KPI | Sasaran | Cara kiraan |
|---|---|---|
| KAI 1 UTM Launchpad | ≥ 20 setiap tahun (2026-2030) | Inkubator **aktif**: didaftarkan dan dalam pembangunan / beroperasi, termasuk yang sedia ada |
| KAI 2 Makerspace | 60% (2026), 80% (2027), 100% (2028) | Kemajuan milestone berpemberat (4 fasa, 25% setiap satu secara lalai) |
| KAI 3 Ruang Perniagaan | 25 (2026), +5 setahun hingga 45 (2030) | Ruang **ditawarkan** kepada pelajar untuk disewa (kumulatif); disewa dan kadar penggunaan ialah maklumat sokongan |
| KAI 4 GiGA | ≥ 20 setahun | Pelajar mendaftar pada tahun itu (cadangan 2 setiap fakulti) |
| KAI 5 F-SIP | ≥ 4 setahun | Pelajar mendaftar pada tahun itu |
| KAI 6 UTM AI Start Up | ≥ 20 setahun, minimum 5 setiap fakulti | Pelajar dilatih membentuk startup AI pada tahun itu |
| DKAI 1 Pelan Keusahawanan | 100% pada 2026 (sekali sahaja) | Milestone berpemberat (bengkel pra-pelan 50%, kelulusan JKE HEPA/JPU 50%) |

Sasaran tahunan, sasaran suku tahun (kumulatif) dan bajet disimpan dalam tab **Sasaran** dan boleh disunting melalui menu Admin → Sasaran (atau terus dalam Sheet). Bajet tidak dipaparkan kepada awam.

## Enam fungsi UTMXCITE dan CKAI (Center Key Amal Indicator)

Enam fungsi ialah mandat peringkat Universiti kepada UTMXCITE dan menjadi **aliran proses kerja**. Setiap indikator (KAI, DKAI dan CKAI) ditanda dengan satu fungsi. Dashboard boleh dipaparkan **mengikut peringkat** (KAI / DKAI / CKAI) atau **mengikut fungsi**, dan dalam bahagian CKAI indikator dikelompokkan di bawah fungsi masing-masing.

| Fungsi | KAI / DKAI berkaitan | CKAI | Penginput CKAI |
|---|---|---|---|
| **1 · Identify Student Entrepreneurship Interest** (kenal pasti minat) | | CKAI 1 · Bilangan **profiling pelajar yang didaftarkan** | PIC fakulti dan Admin |
| **2 · Conduct Entrepreneurship Training** (latihan) | KAI 4 | CKAI 2 · Bilangan program keusahawanan | PIC fakulti dan Admin |
| **3 · Support Student Business Ideation** (pengideaan) | | CKAI 3 · Bilangan program inovasi | PIC fakulti dan Admin |
| **4 · Facilitate Student Startup Development** (pembangunan startup) | KAI 1, 2, 3, 5, 6 | CKAI 4 · Pendaftaran SSU; CKAI 5 · Penggunaan Makerspace; CKAI 6 · Pendapatan sewaan ruang niaga | Admin |
| **5 · Monitor Student Enterprise Performance** (pantau prestasi) | | CKAI 7 · Pendapatan usahawan pelajar | PIC fakulti dan Admin |
| **6 · Showcase Student Innovation Venture** (pameran inovasi) | | CKAI 8 · Inovasi pelajar yang dihasilkan; CKAI 9 · Anugerah & pengiktirafan | PIC fakulti dan Admin |
| Merentas fungsi | DKAI 1 | | |

Semua CKAI ialah sasaran **minimum** dan **belum ditetapkan**: isi melalui menu Admin → Sasaran (sehingga itu kad menunjukkan "Tiada sasaran"). Dashboard awam hanya menunjukkan jumlah agregat (kiraan atau jumlah RM), tanpa nama pelajar, projek, perniagaan atau penyewa.
**PIC diberi akses** dengan menambah kod pada lajur `kpi_akses` (tab `Pengguna` atau menu Urus Pengguna): `CKAI1,CKAI2,CKAI3,CKAI7,CKAI8,CKAI9` (semua CKAI yang boleh diisi fakulti). CKAI 4, 5 dan 6 hanya untuk Admin.

| CKAI | Unit rekod | Dikira |
|---|---|---|
| 1 Profiling | Satu pelajar yang diprofilkan (satu profil bagi setiap no. matrik) | Profiling didaftarkan pada tahun **tarikh profiling** |
| 2, 3 Program | Satu program | Program berstatus **Selesai** pada tahun tarikh tamat |
| 4 SSU | Satu syarikat / perniagaan pelajar | Pendaftaran pada tahun tarikh daftar |
| 5 Makerspace | Satu baris sebulan | Jumlah penggunaan bagi bulan dalam tahun itu |
| 6 Sewaan ruang niaga | Satu baris sebulan bagi setiap penyewa | Jumlah RM berstatus **Dibayar** (belum bayar / tertunggak dipaparkan berasingan) |
| 7 Pendapatan usahawan | Satu baris sebulan bagi setiap perniagaan | Jumlah RM bagi bulan dalam tahun itu |
| 8 Inovasi pelajar | Satu projek inovasi | Projek yang **telah menyertai pertandingan** (sekurang-kurangnya peringkat Fakulti) pada tahun tarikh pertandingan |
| 9 Anugerah | Satu anugerah / pengiktirafan | Bilangan yang diterima pada tahun tarikh |

**CKAI 1 · profiling pelajar:** proses profiling pelajar akan dibangunkan oleh UTMXCITE, jadi medan sekarang ialah set asas dan akan diperhalusi kemudian: pelajar (fakulti, nama, no. matrik, e-mel, telefon, program, tahun), **tarikh profiling**, sumber profiling (tinjauan, saringan fakulti, pendaftaran minat, rujukan, penyertaan program), **tahap minat** (Tiada / Rendah / Sederhana / Tinggi), bidang minat, pengalaman perniagaan, **tahap kesediaan** (Belum ada idea / Ada idea / Ada prototaip / Sudah beroperasi), kemahiran dan catatan. Medan `cadangan_tindakan` dan `persetujuan` (PDPA) telah dibuang mengikut senarai lajur terkini; pastikan persetujuan pelajar diperoleh di luar sistem. No. matrik mesti unik (tidak peka huruf besar/kecil). PIC tidak dapat melihat ID rekod fakulti lain apabila no. matrik pendua dikesan. Senarai boleh ditapis mengikut tahap minat dan tahap kesediaan.

**CKAI 2 dan 3 · daftar program (borang sama):** nama program, kategori, peringkat, penganjur / rakan kerjasama, pegawai program, objektif; **tarikh mula dan tamat**, **tempat**; **penyertaan** (jumlah peserta, dan daripada itu pelajar / staf UTM / luar UTM, serta skor kepuasan 0-5); **kewangan** (**kos penganjuran**, sumber peruntukan, **pendapatan**, sumber pendapatan); bilangan hasil (projek / prototaip / idea / startup), laporan program (PDF, pilihan), pautan dan catatan. Bagi program berstatus **Selesai**, tarikh mula dan tamat, tempat, jumlah peserta, kos dan pendapatan wajib diisi (0 dibenarkan). Tarikh tamat tidak boleh sebelum tarikh mula, dan pelajar + staf + luar UTM tidak boleh melebihi jumlah peserta. Kad dashboard menjumlahkan peserta, kos dan pendapatan bagi program yang selesai pada tahun dipilih.

**CKAI 8 · medan borang (inovasi pelajar):** tajuk inovasi, jenis, bidang, penerangan, tahap kesediaan teknologi (TRL), status harta intelek; pasukan, mentor / penyelia, pelajar (nama dan no. matrik, **tanpa no. KP**); pertandingan (status penyertaan, nama, penganjur, **peringkat** Fakulti / Universiti / Kebangsaan / Antarabangsa, tarikh, tempat); **anugerah (pilihan, jika menang)**: pingat / kedudukan, nama anugerah, nilai hadiah, sijil PDF; dan **peningkatan ke peringkat lebih tinggi**: status (Belum dinilai, Calon peningkatan, Sedang disokong, Telah dibawa ke peringkat lebih tinggi, Tidak diteruskan), peringkat sasaran, pertandingan seterusnya, tarikh dan sokongan diperlukan. Senarai boleh ditapis mengikut peringkat dan status peningkatan, jadi XCITE dapat mengenal pasti projek untuk dibawa naik.

**CKAI 9 · medan borang (anugerah):** nama anugerah, tarikh, agensi / badan penganugerah, peringkat (Fakulti / Universiti / Kebangsaan / Antarabangsa), kategori (Inovasi / Keusahawanan), program (UTM Launchpad, Makerspace, GiGAUTM Ascend, F-SIP, UTM AI Start Up, program fakulti, atau Lain-lain + nama), nama mentor / fasilitator, **pelajar (nama, no. matrik, no. KP; tambah seberapa banyak yang perlu)** dan **sijil PDF**. Medan tambahan: pingat / kedudukan, nilai hadiah (RM), lokasi / negara, nama pasukan, produk / projek / syarikat, pautan berita dan catatan.

Tab Sheet dinamakan mengikut nombor: `CKAI1_Profiling_Pelajar`, `CKAI2_Program_Keusahawanan`, `CKAI3_Program_Inovasi`, `CKAI4_SSU`, `CKAI5_Makerspace`, `CKAI6_Sewaan_Inkubator`, `CKAI7_Pendapatan_Pelajar`, `CKAI8_Inovasi_Pelajar`, `CKAI9_Anugerah`.

## Pemasangan

1. Buat projek Apps Script baharu (script.google.com) **atau** buka Sheet baharu → Extensions → Apps Script (projek terikat).
2. Salin semua fail dalam folder ini: `*.gs`, `*.html` dan `appsscript.json` (aktifkan "Show appsscript.json manifest file" dalam Project Settings). Dengan [clasp](https://github.com/google/clasp): `clasp push` (fail ujian dan README diabaikan melalui `.claspignore`). `tools/` turut diabaikan; `Logo.html` mesti ikut disalin.
3. Jalankan fungsi **`setup()`** sekali daripada editor dan luluskan kebenaran (Sheets, hantar e-mel, e-mel pengguna). (Pemasangan sedia ada yang dikemas kini kepada versi ini: jalankan `setup()` sekali lagi. Ia menambah tab CKAI dan baris sasaran CKAI tanpa menyentuh data sedia ada.) Ia:
   - mencipta (atau menggunakan semula) Sheet dan semua tab: `Pengguna`, `Fakulti`, `Sasaran`, `Risiko`, `Log_Audit` dan 7 tab KPI,
   - memasukkan sasaran awal, senarai fakulti, daftar risiko daripada PDF, dan milestone awal KAI 2 / DKAI 1,
   - mendaftarkan **pemilik skrip sebagai Admin pertama**.
   Selamat dijalankan semula (tidak menduplikasi data). ID Sheet disimpan dalam Script Properties (`SHEET_ID`).
4. **Deploy → New deployment → Web app**: *Execute as* **Me**, *Who has access* **Anyone** (diperlukan supaya dashboard boleh dilihat tanpa akaun Google; log masuk OTP dikendalikan oleh aplikasi). Salin URL web app.
5. Log masuk sebagai Admin → **Urus Pengguna** → daftar e-mel PIC (peranan PIC, fakulti, akses KPI contoh `KAI1,KAI4,KAI6`).

## Tab `Pengguna`

Satu tab untuk Admin dan PIC (e-mel di lajur A). Lajur: `emel`, `nama`, `peranan` (**Admin** atau **PIC**), `fakulti`, `kpi_akses` (contoh `KAI1,KAI4,KAI6`), `aktif` (**Ya** / **Tidak**), `dicipta_pada`.
Boleh disunting terus dalam Sheet (drop-down disediakan bagi `peranan` dan `aktif`) atau melalui menu Admin → Urus Pengguna. Huruf besar/kecil dan ruang kosong diabaikan. Peranan selain Admin/PIC bermakna **tiada akses** (bukan PIC secara lalai). Lajur dibaca mengikut nama tajuk, jadi susunan lajur tidak penting.

## Lampiran PDF (sijil) dan data peribadi

- Sijil dimuat naik sebagai **PDF sahaja, maksimum 5 MB**. Kandungan sebenar disemak (bermula dengan `%PDF-`), bukan sekadar nama fail. Nama fail dibersihkan. Had 20 muat naik sejam bagi setiap pengguna.
- Fail disimpan dalam folder Drive **peribadi** "UTMXCITE ASCEND2030 - Lampiran" milik pemilik skrip dan **tidak dikongsi**. Fail hanya boleh dimuat turun melalui aplikasi selepas semakan akses: PIC bagi fakulti sendiri, Admin bagi semua. Setiap muat naik dan muat turun direkod dalam `Log_Audit`.
- Satu rekod hanya boleh merujuk fail yang baru dimuat naik oleh pengguna itu sendiri melalui aplikasi (tidak boleh merujuk fail Drive sembarangan). Fail yang diganti atau yang rekodnya dipadam dibuang ke tong sampah Drive.
- Manifest meminta skop `https://www.googleapis.com/auth/drive` (diperlukan oleh `DriveApp`). Skop ini luas, jadi gunakan akaun pemilik skrip yang sesuai dan jangan kongsi projek Apps Script dengan orang yang tidak perlu.
- **No. KP dan no. matrik pelajar** (no. KP hanya dalam CKAI 9; no. matrik, e-mel dan telefon juga dalam profiling CKAI 1, SSU CKAI 4, inovasi CKAI 8 dan KAI 4 hingga 6) ialah data peribadi (PDPA 2010). Ia hanya dipaparkan kepada Admin dan PIC fakulti berkenaan, tidak dipaparkan dalam jadual senarai (hanya nama), tidak dimasukkan dalam `Log_Audit`, dan tidak pernah muncul pada dashboard awam. Dalam Google Sheet, no. KP disimpan sebagai teks biasa, jadi **hadkan akses kepada Sheet** (jangan kongsi) dan tetapkan tempoh simpanan mengikut dasar universiti.

## Logo

Logo rasmi UTM ASCEND 2030 dipaparkan di atas sidebar pada panel putih. Ia disimpan dalam `Logo.html` sebagai data URI, jadi tiada hos imej luar diperlukan. Untuk menggantikannya (PNG lut sinar, lebar ~260px):

```
python3 tools/make_logo_html.py logo-baharu.png
```

Jika logo baharu memerlukan latar lain, ubah warna `.brandlogo` dalam `Styles.html`.

## Perkara yang perlu disemak selepas setup

- **Tab `Fakulti`**: senarai awal (13 fakulti + `UTMXCITE`) ialah andaian. Semak dan betulkan kod/nama mengikut senarai sebenar UTM. `FAI`, `FC`, `FKE`, `MJIIT` perlu kekal kerana digunakan oleh KAI 6.
- **Kemajuan awal ialah 0%.** Milestone KAI 2 dan DKAI 1 disemai dengan peratus siap 0 dan pemberat 25% (KAI 2) / 50% (DKAI 1). Kemas kini peratus siap mengikut kemajuan sebenar (contoh: pencapaian Q2 2026 dalam ringkasan: KAI 2 15%, DKAI 1 50%). Tiada pencapaian dimasukkan secara automatik.
- **Pencapaian lain** (contoh: 1 inkubator, 10 ruang, 1 pelajar GiGA, 5 pelajar AI pada Q2) perlu dimasukkan sebagai rekod sebenar melalui borang.
- `ALLOWED_EMAIL_DOMAINS` dalam `Config.gs` boleh dihadkan (contoh `['utm.my']`).

## Keselamatan

- OTP 6 digit, sah 5 minit, sekali guna, maksimum 5 percubaan, dan 5 permintaan sejam bagi setiap e-mel. OTP disimpan sebagai hash (dengan salt rahsia) dalam CacheService.
- Mesej "OTP dihantar" sama sama ada e-mel berdaftar atau tidak (tiada penghitungan akaun).
- Token sesi rawak 192-bit, disimpan sebagai hash, tamat dalam 6 jam, dan dibatalkan semasa log keluar. Peranan dan status aktif dibaca semula daripada Sheet pada setiap panggilan, jadi menyahaktifkan pengguna berkuat kuasa serta-merta.
- PIC dipaksa ke fakultinya di pelayan; rekod fakulti lain tidak boleh dibaca atau diubah. Padam: Admin sahaja. Admin terakhir tidak boleh dinyahaktif atau dipadam.
- Pengesahan medan di pelayan (wajib, pilihan, nombor, tarikh, e-mel, URL, peraturan bersyarat). Teks yang bermula dengan `= + - @` dilindungi daripada suntikan formula Sheets (awalan `'`; tidak dipaparkan dalam aplikasi).
- Semua output klien di-escape (tiada XSS). Ralat dalaman tidak dibocorkan kepada pengguna.
- `Log_Audit` merekod log masuk, tambah / kemas kini / padam, perubahan pengguna dan sasaran.
- Dashboard awam hanya mengandungi kiraan agregat: tiada nama, no. matrik, e-mel atau bajet.
- **Sheet tidak perlu dikongsi kepada awam.** Jangan kongsi tab data dengan sesiapa yang tidak sepatutnya melihat maklumat pelajar.

## Had yang perlu diketahui

- Kuota e-mel `MailApp`: kira-kira 100/hari (akaun Gmail biasa) atau 1,500/hari (Google Workspace). Pemilik skrip yang menghantar semua e-mel OTP.
- Sesi disimpan dalam CacheService (maksimum 6 jam, boleh dikosongkan oleh Google tanpa notis). Pengguna hanya perlu log masuk semula.
- Lampiran bukti disimpan sebagai **pautan** (Drive / URL), bukan muat naik fail.
- Pencapaian dikira daripada rekod semasa pada hari dilihat, bukan salinan sejarah. Untuk tahun lepas, ia bergantung pada tarikh dalam rekod (tarikh pendaftaran, daftar, mula latihan, ditawarkan).

## Susunan lajur

Semua penulisan ke Sheet mengikut **nama tajuk lajur**, bukan kedudukan. Jadi lajur boleh disusun semula, atau lajur anda sendiri boleh ditambah, tanpa merosakkan data. Nama tajuk yang dikenali oleh kod mesti kekal tepat. Apabila versi baharu menambah medan, `setup()` menambah lajur baharu di hujung tab sedia ada.

## Prototaip pra-demo

`demo/utmxcite-demo.html` ialah satu fail HTML yang menjalankan kod sistem sebenar dalam pelayar dengan data contoh (tanpa Google), untuk pra-demo. Lihat `demo/README.md`. Bina semula dengan `node tools/build_demo.js`.

## Ujian

Logik pelayan diuji dengan tiruan API GAS (Node 18+):

```
node tests/run.js        # ujian logik: OTP, akses, pengesahan, kiraan KPI dan CKAI, dashboard awam
node tests/demo.js       # ujian prototaip pra-demo (fail HTML tunggal, file://)
node tests/e2e.js        # ujian pelayar sebenar (Playwright + Chromium) menggunakan pelayan tiruan yang sama, termasuk muat naik/muat turun PDF
```

Ujian tidak menggantikan ujian sebenar dalam Google (contoh: kebenaran OAuth, penghantaran e-mel sebenar, Drive sebenar, kelajuan Sheets, dan sama ada pelayar anda membenarkan muat turun PDF daripada halaman Apps Script). Lakukan ujian asap selepas deploy: log masuk Admin, tambah PIC, log masuk PIC, simpan satu rekod dan semak dashboard awam dalam tetingkap inkognito.

## Tab Persediaan (pautan, ID dan semakan sistem)

- **Dalam Google Sheet:** tab `Persediaan` ditulis semula setiap kali `setup()` dijalankan. Ia memuatkan ID/pautan Sheet, pautan web app, Script ID, pautan folder lampiran, pemilik skrip dan panduan jika paparan "404".
- **Dalam aplikasi:** Admin > Pentadbiran > Persediaan. Menunjukkan pautan/ID (butang Salin), senarai semakan ✓/✗ (tab, lajur, Admin aktif, folder, pautan /exec, kuota e-mel), butang "Jalankan persediaan" (baiki tab/lajur hilang) dan "Hantar e-mel ujian".
- **Punca biasa "404":** guna pautan `/exec` (bukan `/dev` atau pautan editor), Execute as = Me, Who has access = Anyone, dan deploy *New version* selepas ubah kod.

## Infografik (menu awam)

Menu **Infografik** (tajuk halaman: **Laporan Prestasi UTMXCITE**; menu pertama, sebelum Dashboard; ia juga halaman pertama apabila pautan dibuka, tanpa log masuk) memaparkan pencapaian UTMXCITE secara visual daripada data dashboard: cincin Pekerjaan Premium Tier 1 berbanding sasaran 40%, panel **KPT** (cincin setiap KPI mengikut tiga Teras), pencapaian mengikut empat peringkat dan enam fungsi, nombor utama, trend premium, carta bulanan (pendapatan, sewaan, **Makerspace mengikut bilangan pengguna** iaitu jumlah `bil_peserta`, bukan bilangan tempahan) dan carta **Makerspace mengikut peralatan**, pecahan mengikut fakulti dan senarai semua indikator. Susunan carta: pendapatan usahawan (bulan + fakulti) sebaris; Makerspace (bulan + peralatan) sebaris; sewaan, SSU dan profiling sebaris. Panel **% Penggunaan Tabung** memaparkan satu cincin bagi setiap tabung dengan nilai penggunaan di tengah, kod tabung (5 digit chargeline) dan nilai belanja / peruntukan sebagai nombor (contoh `RM1,350 / RM5,000`) di bawah. Nama tabung dan no. chargeline penuh tidak dipaparkan kepada awam. Tahun boleh ditukar. Butang **Cetak slide** menjana slaid pembentangan (1280 x 720, sedia dicetak / Save as PDF; dalam dialog cetak pilih Margins: None dan Background graphics): slaid 1 tajuk (kulit; logo UTM, UTM ASCEND 2030 dan UTMXCITE, dimuat apabila Cetak slide ditekan; jana semula dengan `tools/make_slide_logos.js` jika logo diganti), 2 ringkasan (Premium, peringkat, ringkasan, rumusan, trend), 3 KPT mengikut Teras, 4 KAI Peringkat Universiti (+DKAI), 5 enam fungsi dan prestasi usahawan, 6 sewaan / SSU / profiling, 7 penggunaan tabung amanah, seterusnya semua indikator dan indikator yang perlu perhatian. Butang **Cetak halaman** (saiz kotak sama) mencetak paparan Infografik biasa. Hanya data agregat dipaparkan (titik akhir `api_trend` dan `api_dashboard`).

## CKAI 10 · Jumlah perbelanjaan operasi (Cross-cutting)

Laporan bulanan kedudukan kewangan tabung amanah UTMXCITE (berdasarkan laporan "Kedudukan Kewangan Baki Tabung Amanah"). **Admin sahaja** mengisi; satu rekod bagi setiap tabung setiap bulan.

- **Medan:** bulan laporan, nama tabung (lima tabung disenaraikan atau **Lain-lain** yang mesti dinamakan dan diberi chargeline), no. chargeline (automatik bagi tabung disenaraikan), peruntukan / baki awal (a), komitmen (b), perbelanjaan terkumpul sehingga bulan itu (c), lampiran laporan (PDF, tidak wajib) dan catatan. **Baki tabung d = a − (b + c)** dikira oleh sistem. **Peruntukan (a) dan komitmen (b) diisi sekali sahaja** (laporan pertama tabung bagi setiap tahun); bulan seterusnya hanya perbelanjaan (c) diisi, dan a/b diwarisi daripada rekod terdahulu. Isi komitmen semula hanya jika ia berubah.
- **Dashboard awam:** jumlah perbelanjaan, jumlah peruntukan, komitmen, baki, peratus penggunaan dan **butiran mengikut tabung** (% Penggunaan Tabung dan RM perbelanjaan; setiap tabung dilabel dengan 5 aksara terakhir no. chargeline, contoh 07078). No. chargeline serta peruntukan, komitmen dan baki setiap tabung hanya dalam senarai Admin.
- **Ukuran dan sasaran:** nilai KPI ialah **% perbelanjaan daripada peruntukan** (jumlah perbelanjaan terkumpul ÷ jumlah peruntukan tabung, rekod bulan terkini setiap tabung). Sasaran lalai **100%** (boleh diubah dalam Admin > Sasaran, maksimum 100%): makin hampir 100% makin cekap; lebih 100% ditandakan "Melebihi peruntukan". Medan pilihan **bajet disasarkan** membolehkan kiraan **penjimatan** (atau lebihan) berbanding bajet. % setiap tabung dipaparkan dalam senarai Admin.
- Maklumat perolehan tidak termasuk dalam KPI ini.
- Tambah tabung tetap baharu dengan menyunting `TABUNG_AMANAH` dalam `Config.gs`.

## CKAI 4 · lajur tab `CKAI4_SSU`

Lajur mengikut senarai terkini: id, fakulti, nama_pelajar, no_kp, no_matrik, emel, telefon, jantina, bangsa, bidang_pengajian, nama_syarikat, jenis_perniagaan, jenis_perniagaan_lain, jenis_milikan, bil_rakan_kongsi, bilangan_pekerja, no_ssu, tarikh_daftar, status_ssm, tarikh_ssm, no_daftar_ssm, link_website_perniagaaan, punca_modal, modal_awal, jumlah_jualan, penyata_bank (+ penyata_bank_pautan), tarikh_mula_perniagaan, catatan; kemudian `status`, `berasaskan_inovasi`, `trl_syarikat` (kekal untuk KPT 5) dan lajur sistem. Pemilik: hanya no. matrik dimasukkan; fakulti, nama, no. KP, e-mel, telefon, jantina, bangsa dan bidang_pengajian diambil daripada tab PELAJAR (lajur `jantina`, `bangsa` dan `bidang_pengajian` ditambah ke PELAJAR oleh `setup()`; pilihan bangsa: MELAYU, CINA, INDIA, PRIBUMI SARAWAK, PRIBUMI SABAH, LAIN-LAIN). Senarai rakan kongsi dan lampiran sijil SSM dibuang.

## KPT 4 · lajur tab `KPT4_Pelajar_Inovasi`

id, fakulti, nama, no_kp, no_matrik, nama_syarikat, nama_ahli_kumpulan, no_pendaftaran_SSM, jenis_perniagaan, status_bumiputera, `nama_projek_inovasi`, level_TRL, penilaiain_CRL, pautan_website, sipnopsis_inovasi, bukti_inovasi (+ bukti_inovasi_pautan), lajur sistem. Tiada medan tarikh: pelajar dikira pada tahun rekod dicipta (`dicipta_pada`). Satu pelajar dikira sekali (no. matrik), termasuk pelajar daripada CKAI 8 (TRL 1-3).

## KPT 6 · lajur tab `KPT6_Kolaborasi`

id, fakulti, tajuk, rakan_institusi, bidang_kerjasama, jenis_dokumen, bil_projek_aktiviti_berkolabrasi, nama_projek, tarikh_mula, tarikh_akhir, penerangan_impak, laporan_kolabrasi (+ pautan), bukti_dokumen (pilihan: MoU, MoA, LoA, LoI, Geran Penyelidikan), lajur sistem, dan `skop` (Tempatan / Antarabangsa, kekal untuk pecahan KPT 6). Nilai KPT 6 = jumlah `bil_projek_aktiviti_berkolabrasi` bagi rekod yang `tarikh_mula`nya dalam tahun dipilih.

## KPT 7 · lajur tab `KPT7_Pembiayaan`

id, fakulti, mentor, nama_syarikat, no_pendaftaran_syarikat, nama_pemilik, no_kp_pemilik, bangsa, jenis_perniagaan, jenis_pembiaya, sumber_pembiayaan (ANGEL INVESTOR, VENTURE CAPITAL, ENTITI PENDANAAN AWAM, HADIAH PERTANDINGAN, LAIN-LAIN), jumlah_rm, tarikh_mula_embiayaan, lampiran (+ lampiran_pautan), catatatn, lajur sistem. Tahun pelaporan = tahun `tarikh_mula_embiayaan`; satu syarikat dikira sekali setahun. Pecahan dashboard mengikut `sumber_pembiayaan` (hadiah CKAI 9 dikira sebagai HADIAH PERTANDINGAN).

## KAI 6 · lajur tab `KAI6_AI_Startup`

id, fakulti, nama, no_kp, no_matrik, nama_startup, nama_ahli_kumpulan, no_pendaftaran_SSM, bidang_ai (12 pilihan), ringkasan, mentor_industri, startup_ditubuhkan, status, lampiran (pautan), catatan, lajur sistem. Nama dan no. KP diambil daripada PELAJAR berdasarkan no. matrik. Tiada medan tarikh: pelajar berstatus Dalam latihan / Tamat latihan dikira pada tahun rekod dicipta (`dicipta_pada`).

## KAI 4 · lajur tab `KAI4_GiGA`

id, fakulti, nama_pelajar, no_kp, no_matrik, emel, telefon, tahun_pengajian, program, bidang_gig, mentor_nama, gig_pendapatan, lampiran, catatan, lajur sistem. Setiap rekod = satu pelajar GiGA, dikira pada tahun rekod dicipta (`dicipta_pada`; tiada medan status / tarikh). Pecahan: fakulti (minimum 2 setiap fakulti) dan bidang gig; jumlah pendapatan gig dipaparkan sebagai maklumat tambahan.

## CKAI 7 · lajur tab `CKAI7_Pendapatan_Pelajar`

id, fakulti, bulan_pendapatan, nama_pelajar, no_kp, no_matrik, jantina, bangsa, bidang_pengajian, nama_perniagaan, no_ssu, no_ssm, jenis_milikan, jenis_perniagaan, punca_modal, jumlah_modal, pendapatan_bulanan, bilangan_pekerja, link_website, Penyata_bank (+ Penyata_bank_pautan), tarikh_mula_perniagaan, lokasi_perniagaan_lain, catatan, lajur sistem. Nilai CKAI 7 dan ukuran Pekerjaan Premium (purata sebulan > RM4,000) guna `pendapatan_bulanan`; **KPT 1 (jualan agregat) juga guna `pendapatan_bulanan`** (lajur `jumlah_jualan` CKAI 7 sudah dibuang). Nama, no. KP, jantina, bangsa dan bidang pengajian diambil daripada PELAJAR. Medan `jenis_pendapatan`, `laporan_kewangan` dan `lokasi_perniagaan` (dropdown) dibuang.

**Migrasi data lajur lama:** apabila senarai lajur sesuatu tab dikemas kini, `setup()` menyalin nilai lajur lama ke lajur baharu yang masih kosong (contoh CKAI 7: `tempoh` → `bulan_pendapatan`, `pendapatan_rm` → `pendapatan_bulanan`; KPT 4: `projek` → `nama_projek_inovasi`, `trl` → `level_TRL`; KPT 6: `rakan`, `tarikh`; KPT 7: `tarikh`; KPT 2; KAI 6). Lajur lama tidak dipadam; padam sendiri selepas disemak. Nombor seperti "RM 1,200.50" dalam Sheet turut dibaca.

**CKAI 1 · fakulti:** `fakulti` diambil automatik daripada tab PELAJAR berdasarkan no. matrik (baca sahaja dalam borang). PIC fakulti hanya boleh merekod pelajar daripada fakultinya sendiri; Admin boleh merekod semua fakulti.

**CKAI 7 · Tahun dan Bulan:** tempoh pelaporan kini dua lajur, `Tahun` (2026-2030) dan `Bulan` (Januari … Disember). `setup()` mengisi `Tahun` dan `Bulan` daripada lajur lama `bulan_pendapatan` / `tempoh` (format YYYY-MM atau hari/bulan/tahun) bagi baris yang masih kosong.

**KAI 6 · ahli kumpulan dan fakulti:** `fakulti` diambil daripada PELAJAR (PIC hanya pelajar fakultinya; had fakulti KAI 6 kekal). `nama_ahli_kumpulan` dimasukkan sebagai senarai no. matrik (maksimum 10); nama diambil daripada PELAJAR dan disimpan dalam Sheet sebagai teks bernombor, satu baris setiap ahli: `1. NAMA (NO. MATRIK)`.

**KAI 6 · peringkat pembangunan startup:** medan `status` ialah *Peringkat pembangunan startup*: Idea/konsep, Prototaip, Validasi pasaran, Pelancaran, Pertumbuhan. Semua peringkat dikira dalam KAI 6. `setup()` menukar nilai lama: Ideasi / Dalam latihan → Idea/konsep; Prototaip / MVP / Tamat latihan → Prototaip (Dicalonkan, Dipilih dan Tarik diri tidak disentuh; betulkan sendiri).

**KAI 6 · link profil:** lajur baharu `link_profil` (pautan https sahaja) selepas `no_pendaftaran_SSM`; dipaparkan sebagai pautan "Buka pautan" dalam senarai.

**Susunan borang data pelajar:** pada semua KPI berdata pelajar, **No. matrik** dipaparkan sebagai medan pertama, diikuti medan automatik daripada PELAJAR (nama, no. KP, fakulti). Susunan ini hanya pada borang; susunan lajur dalam Sheet tidak berubah.
