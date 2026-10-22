#!/usr/bin/env python3
"""Jana Logo.html (data URI) daripada fail PNG logo.

Guna:  python3 tools/make_logo_html.py logo.png
Cadangan: PNG lut sinar, lebar ~260px (paparan 2x). Logo rasmi UTM ASCEND 2030 (marun/kelabu) sesuai untuk
latar cerah, jadi sidebar meletakkannya pada panel putih. Jika logo anda memerlukan latar lain, ubah warna
`.brandlogo` dalam Styles.html.
"""
import base64, sys, pathlib

if len(sys.argv) != 2:
    sys.exit(__doc__)
here = pathlib.Path(__file__).resolve().parent

def uri(path):
    data = pathlib.Path(path).read_bytes()
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        sys.exit('Fail mesti PNG: %s' % path)
    return 'data:image/png;base64,' + base64.b64encode(data).decode()

# UTM_LOGO = logo UTM ASCEND 2030 (sidebar, log masuk, kulit slaid). Logo UTM dan UTMXCITE untuk kulit slaid: lihat tools/make_slide_logos.js (dimuat lazy, tidak melambatkan halaman).
out = here.parent / 'Logo.html'
out.write_text('<script>window.UTM_LOGO = "%s";</script>\n' % uri(sys.argv[1]))
print('Ditulis %s (%d KB)' % (out, out.stat().st_size // 1024))
