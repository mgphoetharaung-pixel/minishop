import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, update, remove } from "firebase/database";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDIVLEDPW4Dn8KO71YCKfoCseWxKHf4sPs",
  authDomain: "clothing-store-d9135.firebaseapp.com",
  databaseURL: "https://clothing-store-d9135-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "clothing-store-d9135",
  storageBucket: "clothing-store-d9135.firebasestorage.app",
  messagingSenderId: "652578274136",
  appId: "1:652578274136:web:f3a49d4e1bd94afe46032d"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const $ = s => document.querySelector(s);
const fmt = n => Number(n||0).toLocaleString("en-US") + " Ks";
const STATUS = {pending:"စောင့်ဆိုင်းနေသည်",confirmed:"အတည်ပြုပြီး",shipped:"ပို့ဆောင်နေသည်",delivered:"ရောက်ရှိပြီး",cancelled:"ပယ်ဖျက်ထားသည်"};
const PAYL = {COD:"COD",KBZPay:"KBZPay",WavePay:"WavePay"};
const dstr = iso => { const d=new Date(iso); return d.toLocaleDateString("en-GB")+" "+d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}); };

let PRODUCTS=[], ORDERS=[], CONFIG={}, oFilter="all";
let charts={};

/* ---------- auth ---------- */
$("#l-btn").onclick = async () => {
  const email=$("#l-email").value.trim(), pass=$("#l-pass").value;
  const err=$("#l-err"); err.hidden=true;
  $("#l-btn").disabled=true;
  try{
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const s = await get(ref(db,"admins/"+cred.user.uid));
    if(!s.val()){ await signOut(auth); throw new Error("ဒီအကောင့်မှာ admin ခွင့်မရှိပါ"); }
    enter();
  }catch(e){
    err.textContent = e.code==="auth/invalid-credential" ? "အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားနေပါတယ်"
      : e.code==="auth/invalid-email" ? "အီးမေးလ်ပုံစံ မှားနေပါတယ်"
      : e.message||"လော့ဂ်အင် မအောင်မြင်ပါ";
    err.hidden=false;
  }
  $("#l-btn").disabled=false;
};
$("#logout").onclick=()=>signOut(auth).then(()=>location.reload());
onAuthStateChanged(auth, async user=>{
  if(!user) return;
  const s = await get(ref(db,"admins/"+user.uid)).catch(()=>null);
  if(s && s.val()) enter(); else signOut(auth);
});
async function enter(){
  $("#login-view").hidden=true; $("#admin-app").hidden=false;
  $("#a-email").textContent=auth.currentUser.email;
  await reload();
}
async function reload(){
  const [p,o,c] = await Promise.all([
    get(ref(db,"products")), get(ref(db,"orders")), get(ref(db,"config"))
  ]);
  PRODUCTS = p.val()?Object.values(p.val()).sort((a,b)=>(a.order||0)-(b.order||0)):[];
  ORDERS = o.val()?Object.values(o.val()).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)):[];
  CONFIG = c.val()||{};
  const np = ORDERS.filter(x=>x.status==="pending").length;
  $("#n-pending").hidden=np===0; $("#n-pending").textContent=np;
  renderDash(); renderOrders(); renderProducts(); renderReports(); fillSettings();
}
function toast(m){ const t=$("#toast"); t.textContent=m; t.hidden=false; clearTimeout(t._h); t._h=setTimeout(()=>t.hidden=true,2200); }

/* ---------- tabs ---------- */
document.querySelectorAll(".atab").forEach(t=>t.onclick=()=>{
  document.querySelectorAll(".atab").forEach(x=>x.classList.remove("active"));
  t.classList.add("active");
  ["dash","orders","products","reports","settings"].forEach(k=>$("#pg-"+k).hidden = k!==t.dataset.t);
});

/* ---------- dashboard ---------- */
function renderDash(){
  const act = ORDERS.filter(o=>o.status!=="cancelled");
  const rev = act.reduce((s,o)=>s+Number(o.total||0),0);
  const today = new Date().toISOString().slice(0,10);
  const trev = act.filter(o=>(o.createdAt||"").slice(0,10)===today).reduce((s,o)=>s+Number(o.total||0),0);
  const pend = ORDERS.filter(o=>o.status==="pending").length;
  $("#dash-stats").innerHTML = `
    <div class="stat"><span class="ic g-green">💰</span><div><small>ဒီနေ့ဝင်ငွေ</small><b>${fmt(trev)}</b></div></div>
    <div class="stat"><span class="ic g-blue">💵</span><div><small>စုစုပေါင်းဝင်ငွေ</small><b>${fmt(rev)}</b></div></div>
    <div class="stat"><span class="ic g-violet">🧾</span><div><small>Orders စုစုပေါင်း</small><b>${ORDERS.length}</b></div></div>
    <div class="stat"><span class="ic g-amber">⏳</span><div><small>စောင့်ဆိုင်းနေသည်</small><b>${pend}</b></div></div>`;
  $("#dash-recent").innerHTML = `<tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr>` +
    ORDERS.slice(0,10).map(o=>`<tr data-id="${o.code}">
      <td><b>${o.code}</b><br><small class="muted">${dstr(o.createdAt)}</small></td>
      <td>${esc(o.name)}<br><small class="muted">${esc(o.phone)}</small></td>
      <td><b>${fmt(o.total)}</b></td>
      <td><span class="st st-${o.status}">${STATUS[o.status]||o.status}</span></td></tr>`).join("")
    || `<tr><td colspan="4" class="muted">Order မရှိသေးပါ</td></tr>`;
  document.querySelectorAll("#dash-recent tr[data-id]").forEach(r=>r.onclick=()=>openOrder(r.dataset.id));
}
const esc = s => String(s||"").replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* ---------- orders ---------- */
document.querySelectorAll("#o-filters .chip").forEach(c=>c.onclick=()=>{
  document.querySelectorAll("#o-filters .chip").forEach(x=>x.classList.remove("active"));
  c.classList.add("active"); oFilter=c.dataset.f; renderOrders();
});
function renderOrders(){
  const list = oFilter==="all"?ORDERS:ORDERS.filter(o=>o.status===oFilter);
  $("#o-table").innerHTML = `<tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Pay</th><th>Status</th></tr>` +
    list.map(o=>`<tr data-id="${o.code}">
      <td><b>${o.code}</b><br><small class="muted">${dstr(o.createdAt)}</small></td>
      <td>${esc(o.name)}<br><small class="muted">${esc(o.phone)}</small></td>
      <td>${(o.items||[]).reduce((s,i)=>s+i.qty,0)}</td>
      <td><b>${fmt(o.total)}</b></td>
      <td>${PAYL[o.pay]||o.pay}</td>
      <td><span class="st st-${o.status}">${STATUS[o.status]||o.status}</span></td></tr>`).join("")
    || `<tr><td colspan="6" class="muted">မတွေ့ပါ</td></tr>`;
  document.querySelectorAll("#o-table tr[data-id]").forEach(r=>r.onclick=()=>openOrder(r.dataset.id));
}
function openOrder(code){
  const o = ORDERS.find(x=>x.code===code); if(!o) return;
  $("#m-code").textContent=code;
  $("#m-body").innerHTML = `
    <div class="kv"><span class="muted">အမည်</span><b>${esc(o.name)}</b></div>
    <div class="kv"><span class="muted">ဖုန်း</span><b>${esc(o.phone)}</b></div>
    <div class="kv"><span class="muted">လိပ်စာ</span><span>${esc(o.address)}, ${esc(o.township)}, ${esc(o.region)}</span></div>
    <div class="kv"><span class="muted">ရက်စွဲ</span><span>${dstr(o.createdAt)}</span></div><br>
    ${(o.items||[]).map(i=>`<div class="kv"><span>${esc(i.name)} × ${i.qty}</span><span>${fmt(i.price*i.qty)}</span></div>`).join("")}
    <div class="kv"><span class="muted">ပစ္စည်းဖိုး</span><span>${fmt(o.subtotal)}</span></div>
    <div class="kv"><span class="muted">ပို့ဆောင်ခ</span><span>${fmt(o.delivery)}</span></div>
    <div class="kv"><span><b>စုစုပေါင်း</b></span><b style="color:var(--p)">${fmt(o.total)}</b></div>
    <div class="kv"><span class="muted">ငွေပေးချေမှု</span><span>${PAYL[o.pay]||o.pay}${o.txn?" · …"+esc(o.txn):""}</span></div>`;
  $("#m-status").innerHTML = Object.keys(STATUS).map(s=>
    `<button class="stbtn ${o.status===s?"on":""}" data-s="${s}">${STATUS[s]}</button>`).join("");
  document.querySelectorAll("#m-status .stbtn").forEach(b=>b.onclick=()=>setStatus(code,b.dataset.s));
  $("#m-bg").hidden=false; $("#o-modal").hidden=false;
}
async function setStatus(code,s){
  const o = ORDERS.find(x=>x.code===code);
  await update(ref(db,"orders/"+code),{...o,status:s});
  toast("→ "+STATUS[s]); closeModal(); reload();
}
function closeModal(){ $("#m-bg").hidden=true; $("#o-modal").hidden=true; $("#p-modal").hidden=true; }
$("#m-x").onclick=closeModal; $("#m-bg").onclick=closeModal; $("#pm-x").onclick=closeModal;

/* ---------- products ---------- */
function renderProducts(){
  $("#p-table").innerHTML = `<tr><th></th><th>အမည်</th><th>အမျိုးအစား</th><th>ဈေး</th><th>Stock</th><th>ပြသမှု</th><th></th></tr>` +
    PRODUCTS.map(p=>`<tr>
      <td><img class="mini-img" src="${p.img}"></td>
      <td><b>${esc(p.name)}</b></td><td>${esc(p.cat)}</td>
      <td><b>${fmt(p.price)}</b>${p.old?`<br><small class="muted"><s>${fmt(p.old)}</s></small>`:""}</td>
      <td>${p.stock??"—"}</td>
      <td>${p.active===false?'<span class="st st-cancelled">ပိတ်ထား</span>':'<span class="st st-delivered">ဖွင့်ထား</span>'}</td>
      <td style="white-space:nowrap"><button class="rowbtn" data-e="${p.id}">ပြင်</button><button class="rowbtn danger" data-d="${p.id}">ဖျက်</button></td></tr>`).join("");
  document.querySelectorAll("#p-table [data-e]").forEach(b=>b.onclick=e=>{e.stopPropagation();openProduct(b.dataset.e)});
  document.querySelectorAll("#p-table [data-d]").forEach(b=>b.onclick=e=>{e.stopPropagation();delProduct(b.dataset.d)});
}
let editId=null, pendingImg=null;
$("#p-add").onclick=()=>openProduct(null);
function openProduct(id){
  editId=id; pendingImg=null; $("#pm-file").value=""; $("#pm-url").value="";
  const p = id?PRODUCTS.find(x=>x.id===id):null;
  $("#pm-title").textContent = p?"ပစ္စည်းပြင်ရန်":"ပစ္စည်းအသစ်";
  $("#pm-name").value=p?p.name:""; $("#pm-price").value=p?p.price:"";
  $("#pm-old").value=p&&p.old?p.old:""; $("#pm-cat").value=p?p.cat:"အင်္ကျီ";
  $("#pm-stock").value=p?(p.stock??""):""; $("#pm-color").value=p?p.color||"" : "";
  $("#pm-desc").value=p?p.desc||"": ""; $("#pm-active").checked=p?p.active!==false:true;
  $("#pm-prev").src=p?p.img:""; pendingImg=p?p.img:null;
  $("#m-bg").hidden=false; $("#p-modal").hidden=false;
}
$("#pm-up").onclick=()=>$("#pm-file").click();
function fileToDataURL(file){
  return new Promise((res,rej)=>{
    const img=new Image(), url=URL.createObjectURL(file);
    img.onload=()=>{
      URL.revokeObjectURL(url);
      const max=800; let w=img.width,h=img.height;
      if(Math.max(w,h)>max){ const r=max/Math.max(w,h); w=Math.round(w*r); h=Math.round(h*r); }
      const c=document.createElement("canvas"); c.width=w; c.height=h;
      c.getContext("2d").drawImage(img,0,0,w,h);
      res(c.toDataURL("image/jpeg",0.75));
    };
    img.onerror=rej; img.src=url;
  });
}
$("#pm-file").onchange=e=>{
  const f=e.target.files[0]; if(!f) return;
  toast("ပုံပြင်ဆင်နေပါတယ်...");
  fileToDataURL(f).then(url=>{ $("#pm-prev").src=url; pendingImg=url; })
    .catch(()=>toast("ပုံဖတ်မရပါ — တခြားပုံ စမ်းကြည့်ပါ"));
};
$("#pm-url").oninput=e=>{ if(e.target.value.trim()){ $("#pm-prev").src=e.target.value.trim(); pendingImg=e.target.value.trim(); } };
$("#pm-save").onclick=async()=>{
  const name=$("#pm-name").value.trim(), price=Number($("#pm-price").value);
  if(!name||!price){toast("အမည် နှင့် ဈေး ဖြည့်ပေးပါ");return}
  const btn=$("#pm-save"); btn.disabled=true; btn.textContent="သိမ်းနေပါတယ်...";
  try{
    let img = typeof pendingImg==="string"?pendingImg:null;
    if(!img){toast("ပုံရွေးပေးပါ");btn.disabled=false;btn.textContent="သိမ်းမယ်";return}
    const data={ id:editId||("p"+Date.now()), name, price,
      old:Number($("#pm-old").value)||null, cat:$("#pm-cat").value,
      stock:$("#pm-stock").value===""?null:Number($("#pm-stock").value),
      color:$("#pm-color").value.trim(), desc:$("#pm-desc").value.trim(),
      img, dot:"#C4B5FD", active:$("#pm-active").checked,
      order: editId?(PRODUCTS.find(x=>x.id===editId)||{}).order||0 : PRODUCTS.length };
    await set(ref(db,"products/"+data.id),data);
    toast("သိမ်းပြီးပါပြီ"); closeModal(); reload();
  }catch(e){console.error(e);toast("မသိမ်းရပါ — ထပ်ကြိုးစားပါ")}
  btn.disabled=false; btn.textContent="သိမ်းမယ်";
};
async function delProduct(id){
  const p=PRODUCTS.find(x=>x.id===id);
  if(!confirm(`"${p.name}" ကို ဖျက်မှာလား?`)) return;
  await remove(ref(db,"products/"+id)); toast("ဖျက်ပြီးပါပြီ"); reload();
}

/* ---------- reports ---------- */
$("#r-range").onchange=renderReports;
function renderReports(){
  const days=Number($("#r-range").value);
  const from=new Date(); from.setDate(from.getDate()-days+1); from.setHours(0,0,0,0);
  const list=ORDERS.filter(o=>o.status!=="cancelled"&&new Date(o.createdAt)>=from);
  const rev=list.reduce((s,o)=>s+Number(o.total||0),0);
  $("#r-stats").innerHTML=`
    <div class="stat"><span class="ic g-green">💰</span><div><small>ဝင်ငွေ (${days} ရက်)</small><b>${fmt(rev)}</b></div></div>
    <div class="stat"><span class="ic g-violet">🧾</span><div><small>Orders</small><b>${list.length}</b></div></div>
    <div class="stat"><span class="ic g-cyan">📊</span><div><small>ပျမ်းမျှ order တန်ဖိုး</small><b>${fmt(list.length?Math.round(rev/list.length):0)}</b></div></div>
    <div class="stat"><span class="ic g-red">✕</span><div><small>ပယ်ဖျက်ထားသည်</small><b>${ORDERS.filter(o=>o.status==="cancelled"&&new Date(o.createdAt)>=from).length}</b></div></div>`;
  const labels=[],data=[];
  for(let i=days-1;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i);
    const k=d.toISOString().slice(0,10); labels.push(d.getDate()+"/"+(d.getMonth()+1));
    data.push(list.filter(o=>(o.createdAt||"").slice(0,10)===k).reduce((s,o)=>s+Number(o.total||0),0)); }
  const stCount={}; list.forEach(o=>stCount[o.status]=(stCount[o.status]||0)+1);
  const prodRev={}; list.forEach(o=>(o.items||[]).forEach(i=>{prodRev[i.name]= (prodRev[i.name]||0)+i.price*i.qty}));
  const top=Object.entries(prodRev).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const payCount={}; list.forEach(o=>payCount[PAYL[o.pay]||o.pay]=(payCount[PAYL[o.pay]||o.pay]||0)+1);
  Object.values(charts).forEach(c=>c&&c.destroy()); charts={};
  const palette=["#8B5CF6","#EC4899","#F59E0B","#10B981","#3B82F6","#06B6D4","#F43F5E"];
  charts.rev=new Chart($("#ch-rev"),{type:"bar",data:{labels,datasets:[{data,backgroundColor:"#8B5CF6",borderRadius:5}]},options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}});
  charts.st=new Chart($("#ch-status"),{type:"doughnut",data:{labels:Object.keys(stCount).map(k=>STATUS[k]||k),datasets:[{data:Object.values(stCount),backgroundColor:palette}]},options:{plugins:{legend:{position:"bottom"}}}});
  charts.top=new Chart($("#ch-top"),{type:"bar",data:{labels:top.map(t=>t[0].slice(0,18)),datasets:[{data:top.map(t=>t[1]),backgroundColor:"#A78BFA",borderRadius:5}]},options:{indexAxis:"y",plugins:{legend:{display:false}}}});
  charts.pay=new Chart($("#ch-pay"),{type:"doughnut",data:{labels:Object.keys(payCount),datasets:[{data:Object.values(payCount),backgroundColor:palette}]},options:{plugins:{legend:{position:"bottom"}}}});
}

/* ---------- settings ---------- */
function fillSettings(){
  $("#s-fee").value=CONFIG.deliveryFee??2500;
  $("#s-kbzn").value=CONFIG.kbzName||""; $("#s-kbza").value=CONFIG.kbzAcct||"";
  $("#s-waven").value=CONFIG.waveName||""; $("#s-wavea").value=CONFIG.waveAcct||"";
}
$("#s-save").onclick=async()=>{
  await set(ref(db,"config"),{ deliveryFee:Number($("#s-fee").value)||2500,
    kbzName:$("#s-kbzn").value.trim(), kbzAcct:$("#s-kbza").value.trim(),
    waveName:$("#s-waven").value.trim(), waveAcct:$("#s-wavea").value.trim() });
  toast("သိမ်းပြီးပါပြီ"); reload();
};
$("#s-pw").onclick=async()=>{
  const a=$("#s-pw1").value,b=$("#s-pw2").value;
  if(a.length<6){toast("စကားဝှက် အနည်းဆုံး ၆ လုံး");return}
  if(a!==b){toast("စကားဝှက် နှစ်ခု မတူပါ");return}
  try{ await updatePassword(auth.currentUser,a); toast("ပြောင်းပြီးပါပြီ"); $("#s-pw1").value=$("#s-pw2").value=""; }
  catch(e){ toast("မရပါ — ပြန်လော့ဂ်အင်ဝင်ပြီးမှ ထပ်လုပ်ပါ"); }
};
