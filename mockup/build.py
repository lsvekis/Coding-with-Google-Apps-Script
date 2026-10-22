t=open('mockup.html').read()
def card(t_,v,s,p,tag,c):
    return f'<div class="card"><span class="tag {c}">{tag}</span><div class="t">{t_}</div><div class="v">{v}</div><div class="bar"><b style="width:{p}%"></b></div><div class="s">{s}</div></div>'
cards=''.join([
card('KAI 1 · Menggiatkan semula UTM Launchpad','1 / 20','Inkubator · Q2 2026',5,'Growth','G'),
card('KAI 2 · UTM Makerspace Hab Inovasi','15%','Sasaran 60%',25,'Growth','G'),
card('KAI 3 · Ruang &amp; kemudahan perniagaan','10 / 25','Lot · Q2 2026',40,'Growth','G'),
card('KAI 4 · Premium Gig Academy','1 / 20','Pelajar',5,'Transform','T'),
card('KAI 5 · Founder Self-Internship (F-SIP)','0 / 4','Pelajar · Belum bermula',0,'Transform','T'),
card('KAI 6 · Tubuhkan UTM AI Start Up','5 / 20','Pelajar · Q2 2026',25,'Transform','T'),
card('DKAI 1 · Pelan Pemerkasaan Keusahawanan','50%','Sasaran 100%',50,'Internal','I'),
'<div class="card" style="background:#5c0f2a;color:#fff"><div class="t" style="color:#fff9">Sasaran DS04 (2030)</div><div class="v" style="color:#e9b949">40%</div><div class="s" style="color:#fff9">Pekerjaan Premium Tier 1</div></div>'])
dash=f'''<div class="cont"><div class="pub">Paparan awam · Data ringkasan sahaja, tiada log masuk diperlukan</div>
<div class="grid g4">{cards}</div>
<h3>KAI 1 mengikut fakulti (contoh)</h3>
<table><tr><th>Fakulti</th><th>Inkubator</th><th>Status</th></tr><tr><td>Fakulti Komputeran</td><td>1</td><td>Aktif</td></tr><tr><td>Fakulti Kejuruteraan Elektrik</td><td>0</td><td>Dalam perancangan</td></tr></table></div>'''
def tabs(a,b): return f'<div class="tabs"><div class="tab {a}">▤ Senarai</div><div class="tab {b}">＋ Masuk Data</div></div>'
form=tabs('','act')+'''<div class="cont"><div class="f">
<div><label>Fakulti</label><div class="in">FAI (dikunci mengikut PIC)</div></div>
<div><label>Nama Pelajar</label><div class="in">Ahmad bin Ali</div></div>
<div><label>No. Matrik</label><div class="in">A24XX0000</div></div>
<div><label>Program</label><div class="in">Sarjana Muda Sains Komputer</div></div>
<div><label>Peringkat</label><div class="in">Permohonan ▾</div></div>
<div><label>Mentor 1:1</label><div class="in">Dr. Siti Aminah</div></div>
<div><label>Bootcamp 3+3</label><div class="in">Sedang berjalan ▾</div></div>
<div><label>Catatan / Lampiran</label><div class="in">Pilih fail…</div></div>
</div><div style="margin-top:18px;display:flex;gap:10px"><button class="btn">Simpan</button><button class="btn o">Batal</button></div></div>'''
listing=tabs('act','')+'''<div class="cont"><div style="display:flex;gap:10px;margin-bottom:12px"><div class="in" style="width:260px">🔍 Cari…</div><div class="in" style="width:160px">Fakulti: Semua ▾</div></div>
<table><tr><th>ID</th><th>Pelajar</th><th>Fakulti</th><th>Peringkat</th><th>Dikemas kini</th><th></th></tr>
<tr><td>G4-001</td><td>Ahmad bin Ali</td><td>FAI</td><td>Bootcamp</td><td>12 Jun 2026</td><td>Edit</td></tr>
<tr><td>G4-002</td><td>Nur Aina</td><td>FC</td><td>Permohonan</td><td>10 Jun 2026</td><td>Edit</td></tr></table></div>'''
pin='<div class="prof"><div class="av">AA</div><div><b>Ahmad bin Ali</b><small>pic.fai@utm.my</small></div></div>'
pout='<div class="prof"><div class="av">?</div><div><b>Pengunjung</b><small>Belum log masuk</small></div></div>'
uin='<span class="badge">PIC · FAI</span><button class="btn o">Log Keluar</button>'
uout='<span>Paparan awam</span><button class="btn">Log Masuk</button>'
def out(n,title,user,body,act,prof=''):
    s=t.replace('__PROF__',prof).replace('__TITLE__',title).replace('__USER__',user).replace('__BODY__',body)
    s=s.replace('item __'+act,'item act').replace('item __D','item').replace('item __K','item')
    open(n,'w').write(s)
out('dash.html','Dashboard KPI',uout,dash,'D',pout)
out('kai4_form.html','KAI 4 · Premium Gig Academy (GiGAUTM Ascend)',uin,form,'K',pin)
out('kai4_list.html','KAI 4 · Premium Gig Academy (GiGAUTM Ascend)',uin,listing,'K',pin)
