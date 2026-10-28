const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const fmt=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c)};
const addD=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return fmt(d)};
const wstart=s=>{const d=parse(s);d.setDate(d.getDate()-((d.getDay()+6)%7));return fmt(d)};
const today=()=>fmt(new Date());
let S={entries:[],targets:{},def:10};
const FV='10.12.2',CDN='https://www.gstatic.com/firebasejs/'+FV+'/';
let MINE=S,FB=null,uid=null,uname='';
const norm=o=>{o.entries=o.entries||[];o.targets=o.targets||{};o.def=o.def??10;return o};

async function load(){
  try{const r=localStorage.getItem('dsa');if(r)S=JSON.parse(r)}catch(e){}
  norm(S);MINE=S;
  if(FIREBASE_CONFIG.apiKey.startsWith('YOUR_')){$('where').textContent='Offline mode: saved in this browser only. Add your Firebase config to turn on live sync.';return}
  try{
    const app=await import(CDN+'firebase-app.js'),au=await import(CDN+'firebase-auth.js'),fs=await import(CDN+'firebase-firestore.js');
    const a=app.initializeApp(FIREBASE_CONFIG),auth=au.getAuth(a),db=fs.getFirestore(a);FB={au,fs,auth,db};
    $('si').onclick=()=>au.signInWithPopup(auth,new au.GoogleAuthProvider()).catch(e=>$('where').textContent='Sign-in failed: '+e.message);
    signedOut();au.onAuthStateChanged(auth,u=>u?start(u):signedOut());
  }catch(e){$('where').textContent='Could not load sync ('+e.message+'). Working offline in this browser.'}
}
function signedOut(){uid=null;$('si').classList.remove('hide');$('where').textContent='Sign in with Google to sync your tracker across devices.'}
async function start(u){
  uid=u.uid;uname=u.displayName||u.email;$('si').classList.add('hide');
  const {fs,db}=FB,me=fs.doc(db,'trackers',uid);
  try{
    const s=await fs.getDoc(me);
    if(s.exists()){S=norm(JSON.parse(s.data().json));MINE=S}
    else{await fs.setDoc(me,{name:uname,json:JSON.stringify(MINE),updated:Date.now()})}
    $('where').textContent='Signed in as '+uname+' · live sync on · your tracker is private to you.';
    render();
  }catch(e){$('where').textContent='Sync error: '+e.message+' (check your Firestore rules).'}
}
let tm;function save(){clearTimeout(tm);tm=setTimeout(async()=>{const json=JSON.stringify(S);
  try{localStorage.setItem('dsa',json)}catch(e){}
  try{if(FB&&uid){await FB.fs.setDoc(FB.fs.doc(FB.db,'trackers',uid),{name:uname,json,updated:Date.now()})}}catch(e){$('where').textContent='Could not sync: '+e.message}},300)}

/* calc */
const solvedOn=()=>{const m={};S.entries.forEach(e=>m[e.date]=(m[e.date]||0)+e.count);return m};
function streaks(){
  const m=solvedOn(),ds=Object.keys(m).filter(k=>m[k]>0).sort();
  let best=0,run=0,prev=null;
  ds.forEach(d=>{run=(prev&&addD(prev,1)===d)?run+1:1;best=Math.max(best,run);prev=d});
  let cur=0,c=m[today()]>0?today():addD(today(),-1);
  while(m[c]>0){cur++;c=addD(c,-1)}
  return{cur,best,doneToday:m[today()]>0};
}
function targetFor(ws){
  if(S.targets[ws]!=null)return S.targets[ws];
  const k=Object.keys(S.targets).filter(x=>x<ws).sort();
  return k.length?S.targets[k[k.length-1]]:S.def;
}
const solvedWeek=ws=>S.entries.filter(e=>e.date>=ws&&e.date<=addD(ws,6)).reduce((a,e)=>a+e.count,0);
const hoursWeek=ws=>S.entries.filter(e=>e.date>=ws&&e.date<=addD(ws,6)).reduce((a,e)=>a+e.hours,0);

/* render */
function bars(map,total){const k=Object.keys(map).sort((a,b)=>map[b]-map[a]);
  return k.length?k.map(x=>`<div class="tb"><span title="${esc(x)}">${esc(x)}</span><div class="bar"><i style="width:${total?map[x]/total*100:0}%"></i></div><span>${map[x]}</span></div>`).join(''):'<span class="sub">Nothing logged yet.</span>'}
function render(){
  const st=streaks(),tot=S.entries.reduce((a,e)=>a+e.count,0),hrs=S.entries.reduce((a,e)=>a+e.hours,0);
  const days=new Set(S.entries.filter(e=>e.count>0).map(e=>e.date)).size;
  $('stats').innerHTML=[[st.cur+(st.cur?' 🔥':''),'Current streak (days)'],[st.best,'Longest streak'],[tot,'Questions solved'],[hrs.toFixed(1),'Hours spent'],[days,'Active days'],[tot&&hrs?(tot/hrs).toFixed(1):'–','Questions / hour']].map(x=>`<div class="st"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');
  const ws=wstart(today()),tg=targetFor(ws),sv=solvedWeek(ws),pc=tg?Math.min(100,sv/tg*100):100;
  $('thisweek').innerHTML=`<div style="display:flex;justify-content:space-between"><span><b>${sv}</b> of ${tg} solved</span><span class="sub">${hoursWeek(ws).toFixed(1)} h</span></div><div class="bar" style="margin:8px 0"><i style="width:${pc}%"></i></div><div class="sub">${sv>=tg?'Target hit 🎉':(tg-sv)+' to go this week'}${st.doneToday?'':' · log something today to keep your streak'}</div>`;
  // heatmap
  const m=solvedOn(),start=addD(wstart(today()),-14*7);let h='';
  for(let i=0;i<15*7;i++){const d=addD(start,i),v=m[d]||0;h+=`<i title="${d}: ${v}" class="${d>today()?'':v>=6?'d':v>=4?'c':v>=2?'b':v>=1?'a':''}"></i>`}
  $('hm').innerHTML=h;
  const tm={},pm={};S.entries.forEach(e=>{const t=e.topic||'Untitled';tm[t]=(tm[t]||0)+e.count;pm[e.platform]=(pm[e.platform]||0)+e.count});
  $('topics').innerHTML=bars(tm,Math.max(...Object.values(tm),0));$('plats').innerHTML=bars(pm,Math.max(...Object.values(pm),0));
  $('tl').innerHTML=Object.keys(tm).map(t=>`<option value="${esc(t)}">`).join('');
  // history
  const es=[...S.entries].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
  $('hist').innerHTML=es.length?`<table><tr><th>Date</th><th>Topic</th><th>Platform</th><th>Solved</th><th>Hrs</th><th>Links</th><th></th></tr>`+es.map(e=>`<tr><td>${e.date}</td><td>${esc(e.topic)}<div class="sub">${esc(e.diff)}${e.rev?' · <span class="no">revise</span>':''}${e.notes?' · '+esc(e.notes):''}</div></td><td>${esc(e.platform)}</td><td>${e.count}</td><td>${e.hours}</td><td>${e.links.map((l,i)=>`<a href="${esc(l)}" target="_blank" rel="noopener">${i+1}</a>`).join(' ')}</td><td><button class="x" data-del="${e.id}" title="Delete">✕</button></td></tr>`).join('')+'</table>':'<span class="sub">No sessions yet.</span>';
  // weeks
  $('wt').value=tg;let r='';
  for(let i=0;i<10;i++){const w=addD(ws,-7*i),t=targetFor(w),s=solvedWeek(w);r+=`<tr><td>${w}${i?'':' (this week)'}</td><td>${t}</td><td>${s}</td><td>${hoursWeek(w).toFixed(1)}</td><td class="${s>=t?'ok':'no'}">${s>=t?'✓ hit':(i?'missed':'in progress')}</td></tr>`}
  $('wk').innerHTML='<table><tr><th>Week of (Mon)</th><th>Target</th><th>Solved</th><th>Hours</th><th></th></tr>'+r+'</table>';
}

/* events */
$('nav').onclick=e=>{const v=e.target.dataset.v;if(!v)return;
  ['dash','log','week'].forEach(x=>$(x).classList.toggle('hide',x!==v));
  [...$('nav').children].forEach(b=>b.classList.toggle('on',b.dataset.v===v))};
let nTouched=false;$('n').oninput=()=>nTouched=true;
$('l').oninput=()=>{if(!nTouched){const c=$('l').value.split('\n').filter(x=>x.trim()).length;$('n').value=c||1}};
$('add').onclick=()=>{
  const topic=$('t').value.trim(),date=$('d').value||today(),count=Math.max(0,parseInt($('n').value)||0);
  if(!topic){$('msg').textContent='Add a topic first.';return}
  const links=$('l').value.split('\n').map(x=>x.trim()).filter(x=>/^https?:\/\//i.test(x));
  S.entries.push({id:Date.now(),date,topic,platform:$('p').value,diff:$('df').value,count,hours:Math.max(0,parseFloat($('h').value)||0),links,notes:$('nt').value.trim(),rev:$('rv').checked});
  save();render();['t','l','nt'].forEach(i=>$(i).value='');$('rv').checked=false;$('n').value=1;nTouched=false;$('msg').textContent='Added ✓';setTimeout(()=>$('msg').textContent='',2000)};
$('hist').onclick=e=>{const id=e.target.dataset.del;if(id&&confirm('Delete this session?')){S.entries=S.entries.filter(x=>x.id!=id);save();render()}};
$('sw').onclick=()=>{const v=Math.max(0,parseInt($('wt').value)||0);S.targets[wstart(today())]=v;S.def=v;save();render()};
$('exp').onclick=async()=>{const data=JSON.stringify(S,null,2),name='dsa-tracker-backup.json';
  try{const d=window.claude&&await claude.use('downloads');if(d){await d.save({filename:name,data});return}}catch(e){}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.download=name;a.click()};
$('imp').onclick=()=>$('fi').click();
$('fi').onchange=async e=>{try{const j=JSON.parse(await e.target.files[0].text());if(!Array.isArray(j.entries))throw 0;
  if(confirm('Replace current data with this backup?')){S=MINE=j;S.targets=S.targets||{};S.def=S.def??10;save();render()}}catch(x){alert('That file is not a valid backup.')}};
$('d').value=today();
load().then(render);
