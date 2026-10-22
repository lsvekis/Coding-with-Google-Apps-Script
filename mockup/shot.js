const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
for(const n of ['dash','kai4_form','kai4_list']){const p=await b.newPage({viewport:{width:1280,height:720}});await p.goto('file://'+process.cwd()+'/'+n+'.html');await p.screenshot({path:n+'.png'});}
await b.close()})();
