import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database";

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

let CONFIG = { deliveryFee: 2500, kbzName:"Mini Shop (နမူနာ)", kbzAcct:"09-000-000-001", waveName:"Mini Shop (နမူနာ)", waveAcct:"09-000-000-001" };
let PRODUCTS = [];
const FALLBACK_PRODUCTS = [
  {id:"p1", name:"ရှပ်အင်္ကျီ — Classic Shirt", price:17500, old:22000, cat:"အင်္ကျီ", img:"images/p1-classic-shirt.jpg", color:"အဖြူရောင်", dot:"#FFFFFF",
   desc:"ရိုးရှင်းပြီး smart ကျကျ ဝတ်ဆင်နိုင်တဲ့ classic white shirt ဖြစ်ပါတယ်။ ရုံးတက်ပွဲတက်တွေအတွက် အထူးသင့်တော်ပါတယ်။"},
  {id:"p2", name:"ဘာလောက်စ်အင်္ကျီ — Floral Blouse", price:19500, old:null, cat:"အင်္ကျီ", img:"images/p2-floral-blouse.jpg", color:"ပန်းရောင်", dot:"#F9A8D4",
   desc:"နူးညံ့တဲ့ ပန်းရောင်အခြေခံပေါ်မှာ floral pattern ပါတဲ့ Feminine Blouse ဖြစ်ပါတယ်။ brunch look နဲ့ ပွဲသွား smart-casual style တွေအတွက် သင့်တော်ပါတယ်။"},
  {id:"p3", name:"တီရှပ် — Cotton Tee", price:8900, old:12000, cat:"အင်္ကျီ", img:"images/p3-cotton-tee.jpg", color:"မီးခိုးရောင်", dot:"#9CA3AF",
   desc:"နေ့တိုင်းဝတ်လို့ရတဲ့ 100% cotton တီရှပ်။ နူးညံ့ပြီး လေဝင်လေထွက်ကောင်းလို့ နွေရာသီအတွက် အကောင်းဆုံးပါ။"},
  {id:"p4", name:"ဂါဝန် — Summer Dress", price:22000, old:28000, cat:"ဂါဝန်", img:"images/p4-summer-dress.jpg", color:"အပြာနု", dot:"#93C5FD",
   desc:"အပြာနုရောင် floral လေးနဲ့ လေပြေပြေဝတ်လို့ရတဲ့ summer dress။ ပွဲသွား/အလည်သွားတိုင်း ချစ်စရာကောင်းနေမှာပါ။"},
  {id:"p5", name:"ဟူဒီ — Pastel Hoodie", price:24500, old:null, cat:"အင်္ကျီ", img:"images/p5-hoodie.jpg", color:"ခရမ်းနု", dot:"#C4B5FD",
   desc:"နူးညံ့တဲ့ ခရမ်းနုရောင် fleece hoodie။ အေးတဲ့ရာသီ/အဲကွန်းခန်းထဲမှာ ဝတ်ဖို့ အကောင်းဆုံးပါ။"},
  {id:"p6", name:"စကတ် — Pleated Skirt", price:15500, old:19000, cat:"စကတ် & ဘောင်း", img:"images/p6-skirt.jpg", color:"ခရင်မ်", dot:"#FDE68A",
   desc:"ခရင်မ်ရောင် pleated midi skirt — ရုံးဝတ်/ကျောင်းဝတ်အဖြစ် လူကြိုက်များတဲ့ ဒီဇိုင်းပါ။"},
  {id:"p7", name:"ဘောင်းဘီ — Wide-leg Pants", price:21000, old:null, cat:"စကတ် & ဘောင်း", img:"images/p7-pants.jpg", color:"ဘေ့ချ်", dot:"#D6C19A",
   desc:"ဘေ့ချ်ရောင် wide-leg linen ဘောင်းဘီ။ သက်သောင့်သက်သာရှိပြီး စတိုင်ကျတဲ့ everyday look အတွက်ပါ။"},
  {id:"p8", name:"ကာဒီဂန် — Knit Cardigan", price:18500, old:23000, cat:"အင်္ကျီ", img:"images/p8-cardigan.jpg", color:"ပန်းနု", dot:"#FBCFE8",
   desc:"ပန်းနုရောင် knit cardigan — အပေါ်ထပ်ဝတ်ဖို့ နွေးထွေးနူးညံ့တဲ့ ရွေးချယ်မှုပါ။"}
];
const CATS = ["အင်္ကျီ","ဂါဝန်","စကတ် & ဘောင်း"];
const STATUS_MY = {pending:"စောင့်ဆိုင်းနေသည်",confirmed:"အတည်ပြုပြီး",shipped:"ပို့ဆောင်နေသည်",delivered:"ပို့ဆောင်ပြီးပါပြီ",cancelled:"ပယ်ဖျက်ထားသည်"};

async function loadStore(){
  try{
    const [p,c] = await Promise.all([get(ref(db,"products")), get(ref(db,"config"))]);
    if(p.val()){
      PRODUCTS = Object.values(p.val()).filter(x=>x.active!==false).sort((a,b)=>(a.order||0)-(b.order||0));
    }
    if(c.val()) CONFIG = {...CONFIG, ...c.val()};
  }catch(e){ console.error("RTDB load failed, using fallback", e); }
  if(!PRODUCTS.length) PRODUCTS = FALLBACK_PRODUCTS;
}
const REGIONS = {"ရန်ကုန်တိုင်း":["ဗဟန်း","လသာ","ပန်းပဲတန်း","တာမွေ","အလုံ","ကြည့်မြင်တိုင်","စမ်းချောင်း","ကမာရွတ်","လှိုင်","မရမ်းကုန်း","သင်္ဃန်းကျွန်း","ရန်ကင်း","တောင်ဥက္ကလာ","မြောက်ဥက္ကလာ","ဒဂုံမြို့သစ် (တောင်)","ဒဂုံမြို့သစ် (မြောက်)","ရွှေပြည်သာ","လှိုင်သာယာ","ထန်တလန်"],"မန္တလေးတိုင်း":["အောင်မြေသာစံ","ချမ်းအေးသာစံ","မဟာအောင်မြေ","ပြည်ကြီးတံခွန်","အမရပူရ","ပုသိမ်ကြီး"],"ပဲခူးတိုင်း":["ပဲခူး","ပြည်","တောင်ငူ"],"ဧရာဝတီတိုင်း":["ပုသိမ်","ဟင်္သာတ","မြောင်းမြ"],"မကွေးတိုင်း":["မကွေး","ပခုက္ကူ"],"စစ်ကိုင်းတိုင်း":["မုံရွာ","စစ်ကိုင်း"],"တနင်္သာရီတိုင်း":["ထားဝယ်","မြိတ်"],"ကချင်ပြည်နယ်":["မြစ်ကြီးနား","ဗန်းမော်"],"ကယားပြည်နယ်":["လွိုင်ကော်"],"ကရင်ပြည်နယ်":["ဘားအံ"],"ချင်းပြည်နယ်":["ဟားခါး"],"မွန်ပြည်နယ်":["မော်လမြိုင်"],"ရခိုင်ပြည်နယ်":["စစ်တွေ"],"ရှမ်းပြည်နယ်":["တောင်ကြီး","လားရှိုး","ကျိုင်းတုံ"]};

const $ = s => document.querySelector(s);
const fmt = n => n.toLocaleString("en-US") + " Ks";
const byId = id => PRODUCTS.find(p=>p.id===id);

/* ---------- navigation ---------- */
const VIEWS = ["view-home","view-cats","view-detail","view-checkout","view-success","view-tracking"];
function show(v){
  VIEWS.forEach(x=>$("#"+x).hidden = x!==v);
  window.scrollTo(0,0);
  $("#tabbar").style.display = (v==="view-checkout"||v==="view-success") ? "none" : "flex";
}
document.querySelectorAll("[data-back]").forEach(b=>b.onclick=()=>show("view-home"));
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  t.classList.add("active");
  const k=t.dataset.tab;
  if(k==="home") show("view-home");
  else if(k==="cats") renderCats(), show("view-cats");
  else openSheet();
});
$("#go-tracking-top").onclick=()=>show("view-tracking");
$("#s-go-track").onclick=()=>show("view-tracking");
$("#s-continue").onclick=()=>show("view-home");
$("#hero-shop").onclick=()=>{$("#product-grid").scrollIntoView({behavior:"smooth"})};
$("#see-all").onclick=()=>setFilter("All");

/* ---------- products ---------- */
let curFilter="All";
function cardHTML(p){
  const off = p.old ? `<span class="off">-${Math.round((1-p.price/p.old)*100)}%</span>` : "";
  const old = p.old ? `<div class="old">${fmt(p.old)}</div>` : "";
  const so = p.stock===0 ? `<span class="soldout">ကုန်နေပါပြီ</span>` : "";
  return `<div class="pcard" data-id="${p.id}">
    <div class="im">${off}${so}<img src="${p.img}" alt="" loading="lazy"></div>
    <div class="bd"><div class="nm">${p.name}</div><div class="pr">${fmt(p.price)}</div>${old}</div>
  </div>`;
}
function renderProducts(){
  const list = curFilter==="All" ? PRODUCTS : PRODUCTS.filter(p=>p.cat===curFilter);
  $("#product-grid").innerHTML = list.map(cardHTML).join("");
  const best = [...PRODUCTS].sort((a,b)=>((b.old?1:0)-(a.old?1:0))).slice(0,4);
  $("#best-grid").innerHTML = best.map(cardHTML).join("");
  document.querySelectorAll(".pcard").forEach(c=>c.onclick=()=>openDetail(c.dataset.id));
}
function setFilter(c){
  curFilter=c;
  document.querySelectorAll("#cat-chips .chip").forEach(x=>x.classList.toggle("active",x.dataset.cat===c));
  renderProducts(); show("view-home");
}
document.querySelectorAll("#cat-chips .chip").forEach(x=>x.onclick=()=>setFilter(x.dataset.cat));
function renderCats(){
  $("#cat-list").innerHTML = CATS.map(c=>{
    const p = PRODUCTS.find(x=>x.cat===c);
    const n = PRODUCTS.filter(x=>x.cat===c).length;
    return `<button class="cat-row" data-cat="${c}"><img src="${p.img}"><div><b>${c}</b><br><small>${n} မျိုး</small></div><span class="go">›</span></button>`;
  }).join("");
  document.querySelectorAll(".cat-row").forEach(r=>r.onclick=()=>setFilter(r.dataset.cat));
}

/* ---------- detail ---------- */
let dId=null, dQty=1;
function openDetail(id){
  dId=id; dQty=1; $("#d-qty").textContent="1";
  const p=byId(id);
  $("#d-img").src=p.img; $("#d-name").textContent=p.name;
  $("#d-price").textContent=fmt(p.price);
  $("#d-desc").textContent=p.desc; $("#d-color").textContent=p.color;
  $("#d-dot").style.background=p.dot;
  const soldOut = p.stock===0;
  $("#d-add").disabled=soldOut; $("#d-buy").disabled=soldOut;
  $("#d-add").style.opacity=soldOut?.45:1; $("#d-buy").style.opacity=soldOut?.45:1;
  show("view-detail");
}
$("#d-minus").onclick=()=>{dQty=Math.max(1,dQty-1);$("#d-qty").textContent=dQty};
$("#d-plus").onclick=()=>{dQty=Math.min(99,dQty+1);$("#d-qty").textContent=dQty};
$("#d-add").onclick=()=>{addToCart(dId,dQty);toast("ခြင်းတောင်းထဲ ထည့်ပြီးပါပြီ")};
$("#d-buy").onclick=()=>{addToCart(dId,dQty);startCheckout()};

/* ---------- cart ---------- */
let cart = JSON.parse(localStorage.getItem("ms_cart")||"[]");
function saveCart(){localStorage.setItem("ms_cart",JSON.stringify(cart));updateBadge()}
function addToCart(id,qty){
  const f=cart.find(c=>c.id===id);
  if(f) f.qty=Math.min(99,f.qty+qty); else cart.push({id,qty});
  saveCart();
}
function cartCount(){return cart.reduce((s,c)=>s+c.qty,0)}
function cartSub(){return cart.reduce((s,c)=>s+byId(c.id).price*c.qty,0)}
function updateBadge(){
  const n=cartCount(), b=$("#cart-badge");
  b.hidden=n===0; b.textContent=n;
}
function openSheet(){
  renderSheet();
  $("#sheet-bg").hidden=false; $("#cart-sheet").hidden=false;
}
function closeSheet(){$("#sheet-bg").hidden=true;$("#cart-sheet").hidden=true}
$("#sheet-close").onclick=closeSheet; $("#sheet-bg").onclick=closeSheet;
function renderSheet(){
  $("#sheet-count").textContent=cartCount();
  if(!cart.length){$("#sheet-items").innerHTML=`<div class="empty">ခြင်းတောင်းထဲမှာ ပစ္စည်းမရှိသေးပါ</div>`}
  else $("#sheet-items").innerHTML=cart.map(c=>{
    const p=byId(c.id);
    return `<div class="citem">
      <img src="${p.img}">
      <div class="inf"><div class="nm">${p.name}</div><div class="pr">${fmt(p.price)}</div>
        <div class="stepper"><button data-a="m" data-id="${p.id}">−</button><span>${c.qty}</span><button data-a="p" data-id="${p.id}">+</button></div>
      </div>
      <div><div class="ln">${fmt(p.price*c.qty)}</div><button class="del" data-a="d" data-id="${p.id}">🗑</button></div>
    </div>`;
  }).join("");
  $("#sheet-total").textContent=fmt(cartSub());
  document.querySelectorAll("#sheet-items button").forEach(b=>b.onclick=()=>{
    const id=b.dataset.id, it=cart.find(c=>c.id===id);
    if(b.dataset.a==="m") it.qty=Math.max(1,it.qty-1);
    if(b.dataset.a==="p") it.qty=Math.min(99,it.qty+1);
    if(b.dataset.a==="d") cart=cart.filter(c=>c.id!==id);
    saveCart(); renderSheet();
  });
}
$("#sheet-order").onclick=()=>{ if(!cart.length){toast("ခြင်းတောင်းထဲမှာ ပစ္စည်းမရှိသေးပါ");return} closeSheet(); startCheckout(); };

/* ---------- checkout ---------- */
let payMethod="COD";
Object.keys(REGIONS).forEach(r=>{const o=document.createElement("option");o.value=r;o.textContent=r;$("#f-region").appendChild(o)});
$("#f-region").onchange=e=>{
  const t=$("#f-town"); t.innerHTML="";
  (REGIONS[e.target.value]||[]).forEach(x=>{const o=document.createElement("option");o.value=x;o.textContent=x;t.appendChild(o)});
  if(!t.options.length) t.innerHTML=`<option value="">တိုင်းအရင်ရွေးပါ</option>`;
};
function curAcct(){ return payMethod==="WavePay" ? {name:CONFIG.waveName, no:CONFIG.waveAcct} : {name:CONFIG.kbzName, no:CONFIG.kbzAcct}; }
function refreshPrepaid(){
  $("#pp-amount").textContent=fmt(cartSub()+CONFIG.deliveryFee);
  const a=curAcct();
  $("#pp-acct-name").textContent=a.name; $("#pp-acct").textContent=a.no;
}
document.querySelectorAll(".pay-opt").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".pay-opt").forEach(x=>x.classList.remove("active"));
  b.classList.add("active"); payMethod=b.dataset.pay;
  $("#prepaid-box").hidden = payMethod==="COD";
  refreshPrepaid();
});
$("#copy-acct").onclick=async()=>{const no=curAcct().no;try{await navigator.clipboard.writeText(no.replaceAll("-",""));toast("အကောင့်နံပါတ် ကူးပြီးပါပြီ")}catch{toast(no)}};
function startCheckout(){
  if(!cart.length){toast("ခြင်းတောင်းထဲမှာ ပစ္စည်းမရှိသေးပါ");return}
  const total=cartSub()+CONFIG.deliveryFee;
  refreshPrepaid();
  $("#co-items").innerHTML=cart.map(c=>{const p=byId(c.id);
    return `<div class="co-line"><span>${p.name} × ${c.qty}</span><span>${fmt(p.price*c.qty)}</span></div>`}).join("");
  $("#co-sub").textContent=fmt(cartSub());
  $("#co-del").textContent=fmt(CONFIG.deliveryFee);
  $("#co-total").textContent=fmt(total);
  show("view-checkout");
}
function genCode(){
  const ch="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s="";
  for(let i=0;i<6;i++) s+=ch[Math.floor(Math.random()*ch.length)];
  return "MS-"+s;
}
$("#place-order").onclick=async()=>{
  const name=$("#f-name").value.trim(), phone=$("#f-phone").value.trim(),
        addr=$("#f-addr").value.trim(), region=$("#f-region").value, town=$("#f-town").value;
  if(!name||!phone||!addr||!region||!town){toast("လိပ်စာအချက်အလက် အပြည့်ဖြည့်ပေးပါ");return}
  if(!/^09\d{7,9}$/.test(phone.replaceAll(" ",""))){toast("ဖုန်းနံပါတ် မှားနေပါတယ်");return}
  const txn=$("#f-txn").value.trim();
  if(payMethod!=="COD" && !/^\d{5}$/.test(txn)){toast("Transaction နောက်ဆုံး ၅ လုံး ဖြည့်ပေးပါ");return}
  const btn=$("#place-order"); btn.disabled=true; btn.textContent="တင်နေပါတယ်...";
  try{
    const sub=cartSub(), total=sub+CONFIG.deliveryFee;
    let code=genCode();
    for(let i=0;i<5;i++){ const s=await get(ref(db,"orders/"+code)); if(!s.exists()) break; code=genCode(); }
    const order={
      code, name, phone, address:addr, region, township:town,
      items:cart.map(c=>{const p=byId(c.id);return{id:p.id,name:p.name,price:p.price,qty:c.qty}}),
      subtotal:sub, delivery:CONFIG.deliveryFee, total,
      pay:payMethod, txn: payMethod==="COD"?"":txn,
      status:"pending", createdAt:new Date().toISOString()
    };
    await set(ref(db,"orders/"+code), order);
    cart=[]; saveCart();
    $("#s-thanks").textContent=`${name} ရေ — မှာယူမှုအတွက် ကျေးဇူးတင်ပါသည်။ ဆိုင်မှ အတည်ပြု၍ ပို့ဆောင်ပေးပါမည်။`;
    $("#s-code").textContent=code;
    $("#s-sub").textContent=fmt(sub); $("#s-del").textContent=fmt(CONFIG.deliveryFee); $("#s-total").textContent=fmt(total);
    $("#s-pay").innerHTML = payMethod==="COD"
      ? `ငွေပေးချေမှု <b>Cash on Delivery</b> — အိမ်ရောက်မှ <b>${fmt(total)}</b> ပေးရန်`
      : `ငွေပေးချေမှု <b>${payMethod}</b> — ငွေကြိုရှင်းပြီးပါပြီ`;
    show("view-success");
  }catch(e){ console.error(e); toast("Order တင်မရပါ — အင်တာနက်စစ်ပြီး ထပ်ကြိုးစားပါ"); }
  btn.disabled=false; btn.textContent="Order တင်မယ်";
};

/* ---------- tracking ---------- */
const PAYL={COD:"အိမ်ရောက်ငွေချေ (COD)",KBZPay:"KBZPay",WavePay:"WavePay"};
$("#t-search").onclick=async()=>{
  const phone=$("#t-phone").value.trim(), code=$("#t-code").value.trim().toUpperCase();
  if(!phone||!code){toast("ဖုန်းနံပါတ် နှင့် Order နံပါတ် ဖြည့်ပါ");return}
  $("#t-result").innerHTML=`<div class="empty">ရှာနေပါတယ်...</div>`;
  try{
    const s=await get(ref(db,"orders/"+code));
    if(!s.exists()||s.val().phone.replaceAll(" ","")!==phone.replaceAll(" ","")){
      $("#t-result").innerHTML=`<div class="empty">Order မတွေ့ပါ — နံပါတ်များ ပြန်စစ်ပေးပါ</div>`; return;
    }
    const o=s.val();
    const items=o.items.map(i=>`<div class="co-line"><span>${i.name} × ${i.qty}</span><span>${fmt(i.price*i.qty)}</span></div>`).join("");
    const d=new Date(o.createdAt);
    $("#t-result").innerHTML=`<div class="t-card">
      <div class="order-no">${o.code}</div>
      <span class="t-badge">${PAYL[o.pay]||o.pay}</span>
      <span class="t-badge">${STATUS_MY[o.status]||o.status}</span>
      <div class="t-date">${d.toLocaleDateString("en-GB")} ${d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</div>
      <hr>${items}<hr>
      <div class="row"><span class="muted">စုစုပေါင်း (ပို့ခ ${fmt(o.delivery)})</span><b style="color:var(--p)">${fmt(o.total)}</b></div>
      <div class="co-line"><span>ပို့ရန်</span><span>${o.township}, ${o.region}</span></div>
    </div>`;
  }catch(e){ console.error(e); $("#t-result").innerHTML=`<div class="empty">ရှာမရပါ — အင်တာနက်စစ်ပြီး ထပ်ကြိုးစားပါ</div>`; }
};

function toast(m){
  const t=$("#toast"); t.textContent=m; t.hidden=false;
  clearTimeout(t._h); t._h=setTimeout(()=>t.hidden=true,2200);
}

(async()=>{ await loadStore(); renderProducts(); updateBadge(); show("view-home"); })();
