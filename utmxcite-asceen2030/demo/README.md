# Prototaip pra-demo

Satu fail HTML, **`utmxcite-demo.html`**, yang boleh dibuka terus dalam pelayar (klik dua kali). Tiada pelayan, tiada Google, tiada internet diperlukan.

## Apa ini

Prototaip ini menjalankan **kod sistem sebenar yang sama**: antara muka (sidebar, dashboard, borang, senarai) dan logik pelayan (log masuk OTP, kawalan akses PIC/Admin, pengesahan medan, kiraan KPI, muat naik PDF, log audit). Yang berbeza hanyalah Google, yang digantikan dengan simulasi dalam pelayar:

| Sistem sebenar | Dalam prototaip |
|---|---|
| Google Sheets | Disimpan dalam `localStorage` pelayar |
| E-mel OTP (`MailApp`) | Kod OTP dipaparkan pada skrin (kotak kanan atas) |
| Google Drive (sijil PDF) | Disimpan dalam pelayar (fail kecil) |
| Web app Apps Script | Fail HTML tunggal |

Data (nama, no. matrik, no. KP, sasaran CKAI) semuanya **contoh rekaan** untuk demo. Perubahan yang anda buat disimpan dalam pelayar yang sama sahaja dan boleh disetel semula.

## Cara guna

1. Buka `utmxcite-demo.html`.
2. Gunakan bar **PROTOTAIP PRA-DEMO** di kanan bawah: log masuk pantas sebagai Admin, PIC Fakulti AI atau PIC Fakulti Komputeran, **Panduan demo** (aliran 10 minit), dan **Set semula data contoh**.
3. Log masuk biasa juga berfungsi: masukkan `pic.fai@utm.my`, `pic.fc@utm.my` atau `admin.demo@utm.my`; kod OTP simulasi muncul di kanan atas.

## Bina semula

Selepas sebarang perubahan pada kod sistem:

```
node tools/build_demo.js        # menghasilkan demo/utmxcite-demo.html
node tests/demo.js              # ujian pelayar bagi prototaip (Playwright + Chromium)
```

## Had

- Hanya untuk demo: tiada keselamatan sebenar (data dan sesi berada dalam pelayar anda).
- Penggunaan Google sebenar (kebenaran OAuth, e-mel sebenar, Drive sebenar, had kuota) tidak diuji oleh prototaip ini.
- Prototaip menggunakan logo UTM ASCEND. Fail ini untuk kegunaan dalaman; jangan hos secara awam tanpa kelulusan.
