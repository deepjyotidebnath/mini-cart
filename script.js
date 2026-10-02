// Product images live in the images/ folder. Each product uses a file named after it
// (e.g. images/paracetamol.jpg). The page tries .jpg, .png, .webp, then the built-in .svg.
const EXT=["jpg","png","webp","svg"];
function nextImg(el){const k=+el.dataset.k+1;if(k<EXT.length){el.dataset.k=k;el.src="images/"+el.dataset.b+"."+EXT[k]}else el.onerror=null}
function img(p,cls,alt){const b=p.i.replace(/\.\w+$/,"");return `<img ${cls?`class="${cls}" `:""}src="images/${b}.${EXT[0]}" data-b="${b}" data-k="0" onerror="nextImg(this)" alt="${alt}" loading="lazy">`}
const DEF={name:"Quick Med Pune",wa:"919999999999",upi:"quickmed@upi"};
const PRODUCTS=[
{id:1,n:"Paracetamol 650",w:"15 tablets",p:30,m:34,c:"Pain & Fever",i:"paracetamol.svg",s:80,r:0},
{id:2,n:"Cetirizine 10 mg",w:"10 tablets",p:22,m:25,c:"Cold & Allergy",i:"cetirizine.svg",s:4,r:0},
{id:3,n:"Herbal Cough Syrup",w:"100 ml",p:85,m:99,c:"Cold & Allergy",i:"coughsyrup.svg",s:30,r:0},
{id:4,n:"ORS Electrolyte",w:"5 sachets",p:40,m:45,c:"Digestive",i:"ors.svg",s:60,r:0},
{id:5,n:"Antacid Gel",w:"170 ml",p:110,m:125,c:"Digestive",i:"antacid.svg",s:25,r:0},
{id:6,n:"Multivitamin",w:"30 tablets",p:180,m:220,c:"Vitamins",i:"multivit.svg",s:18,r:0},
{id:7,n:"Pain Relief Gel",w:"30 g",p:95,m:110,c:"Pain & Fever",i:"painrelief.svg",s:0,r:0},
{id:8,n:"Antiseptic Liquid",w:"250 ml",p:135,m:150,c:"First Aid",i:"antiseptic.svg",s:22,r:0},
{id:9,n:"Adhesive Bandages",w:"20 strips",p:45,m:50,c:"First Aid",i:"bandages.svg",s:70,r:0},
{id:10,n:"Digital Thermometer",w:"Fast read",p:150,m:199,c:"Devices",i:"thermometer.svg",s:14,r:0},
{id:11,n:"Metformin 500 mg",w:"10 tablets",p:18,m:20,c:"Prescription",i:"metformin.svg",s:50,r:1},
{id:12,n:"Amoxicillin 500 mg",w:"10 capsules",p:85,m:95,c:"Prescription",i:"amoxicillin.svg",s:20,r:1}];
const FREE=499,SHIP=40;
let S=JSON.parse(JSON.stringify(DEF)),stock={},cart={},cat="All",pay="upi",qrObj=null;
const $=id=>document.getElementById(id),inr=n=>"₹"+n.toLocaleString("en-IN");
const store=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const load=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}};
S=Object.assign(S,load("shop_settings",{}));
PRODUCTS.forEach(p=>stock[p.id]=p.s);stock=Object.assign(stock,load("shop_stock",{}));
function toast(t){const d=document.createElement("div");d.className="toast";d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2200)}
const total=()=>PRODUCTS.reduce((a,p)=>a+(cart[p.id]||0)*p.p,0);
const count=()=>Object.values(cart).reduce((a,b)=>a+b,0);
const ship=()=>total()&&total()<FREE?SHIP:0;
function setQty(id,q){const max=stock[id];q=Math.max(0,Math.min(q,max));if(q)cart[id]=q;else delete cart[id];render();renderCart()}
function render(){
  $("brand").innerHTML=S.name.replace(/(\S+)$/,"<span>$1</span>");
  $("foot").textContent="© "+new Date().getFullYear()+" "+S.name+" · Drug Licence No. [add yours] · Prescription medicines are delivered only against a valid prescription.";
  document.title=S.name+" – Order on WhatsApp, Pay by UPI";
  const cats=["All",...new Set(PRODUCTS.map(p=>p.c))];
  $("cats").innerHTML=cats.map(c=>`<button class="chip" aria-pressed="${c===cat}" data-cat="${c}">${c}</button>`).join("");
  const term=$("q").value.trim().toLowerCase();
  const list=PRODUCTS.filter(p=>(cat==="All"||p.c===cat)&&p.n.toLowerCase().includes(term));
  $("grid").innerHTML=list.length?list.map(p=>{
    const s=stock[p.id],q=cart[p.id]||0;
    const tag=s<=0?'<span class="tag out">Out of stock</span>':s<=5?`<span class="tag low">Only ${s} left</span>`:`<span class="tag">${Math.round(100-p.p/p.m*100)}% off</span>`;
    const act=s<=0?'<button class="add" disabled>Out of stock</button>':q?`<div class="step"><button data-d="-1" data-id="${p.id}" aria-label="Remove one">−</button><b>${q}</b><button data-d="1" data-id="${p.id}" aria-label="Add one">+</button></div>`:`<button class="add" data-add="${p.id}">Add to cart</button>`;
    return `<article><div class="pic">${img(p,"",p.n+" "+p.w)}${p.r?'<span class="rx">Rx</span>':""}${tag}</div><div class="info"><h3>${p.n}</h3><small>${p.w}</small><div class="price">${inr(p.p)}<s>${inr(p.m)}</s></div>${act}</div></article>`}).join(""):'<p class="empty">No products match. Try a different word or category.</p>';
  $("cnt").textContent=count();$("sub").textContent=inr(total());
  seo();
}
function seo(){
  let el=$("ld");if(!el){el=document.createElement("script");el.id="ld";el.type="application/ld+json";document.head.appendChild(el)}
  el.textContent=JSON.stringify({"@context":"https://schema.org","@graph":[{"@type":"Pharmacy",name:S.name,areaServed:"Pune",address:{"@type":"PostalAddress",addressLocality:"Pune",addressRegion:"Maharashtra",addressCountry:"IN"}}].concat(PRODUCTS.map(p=>({"@type":"Product",name:p.n+" "+p.w,category:p.c,brand:{"@type":"Brand",name:S.name},offers:{"@type":"Offer",priceCurrency:"INR",price:p.p,availability:stock[p.id]>0?"https://schema.org/InStock":"https://schema.org/OutOfStock"}})))});
}
function renderCart(){
  const items=PRODUCTS.filter(p=>cart[p.id]);
  $("lines").innerHTML=items.length?items.map(p=>`<div class="line">${img(p,"th","")}<div><b>${p.n}</b><br><small>${p.w} · ${inr(p.p)}</small></div><div class="step" style="min-width:104px;margin:0"><button data-d="-1" data-id="${p.id}" aria-label="Remove one">−</button><b>${cart[p.id]}</b><button data-d="1" data-id="${p.id}" aria-label="Add one">+</button></div></div>`).join(""):'<p class="empty">Your cart is empty. Add a product to start.</p>';
  const t=total(),sh=ship();
  $("sum").innerHTML=t?`<div class="row"><span>Subtotal</span><span>${inr(t)}</span></div><div class="row"><span>Delivery</span><span>${sh?inr(sh):"Free"}</span></div>${sh?`<p class="note">Add ${inr(FREE-t)} more for free delivery.</p>`:""}<div class="row tot"><span>Total</span><span>${inr(t+sh)}</span></div>`:"";
  $("toCheckout").style.display=t?"block":"none";$("rxNote").style.display=items.some(p=>p.r)?"block":"none";
}
function upiUrl(){const a=(total()+ship()).toFixed(2);return`upi://pay?pa=${encodeURIComponent(S.upi)}&pn=${encodeURIComponent(S.name)}&am=${a}&cu=INR&tn=${encodeURIComponent("Order payment")}`}
function drawQR(){
  const u=upiUrl();$("amt").textContent=inr(total()+ship());$("upiLink").href=u;
  $("qr").innerHTML="";
  try{qrObj=new QRCode($("qr"),{text:u,width:200,height:200,correctLevel:QRCode.CorrectLevel.M})}catch(e){$("qr").textContent="QR could not load. Use the button below."}
}
function setPay(m){pay=m;$("mUpi").setAttribute("aria-pressed",m==="upi");$("mCod").setAttribute("aria-pressed",m==="cod");$("upiBox").style.display=m==="upi"?"block":"none";if(m==="upi")drawQR()}
function sendOrder(){
  const n=$("cn").value.trim(),ph=$("cp").value.trim(),a=$("ca").value.trim(),z=$("cz").value.trim();
  if(!n||!/^[6-9]\d{9}$/.test(ph)){return $("err").textContent="Enter your name and a valid 10-digit mobile number."}
  if(!a||!/^41[0-2]\d{3}$/.test(z)){return $("err").textContent="Enter your address and a Pune PIN code (410xxx to 412xxx)."}
  $("err").textContent="";
  const items=PRODUCTS.filter(p=>cart[p.id]);
  const msg=`*New order – ${S.name}*\n\n`+items.map(p=>`• ${p.n} (${p.w}) × ${cart[p.id]} = ${inr(p.p*cart[p.id])}`).join("\n")+`\n\nSubtotal: ${inr(total())}\nDelivery: ${ship()?inr(ship()):"Free"}\n*Total: ${inr(total()+ship())}*\nPayment: ${pay==="upi"?"UPI (screenshot to follow)":"Cash on delivery"}\n\nName: ${n}\nPhone: ${ph}\nAddress: ${a}, ${z}`+(items.some(p=>p.r)?"\n\nPrescription needed: I will send a photo of it in this chat.":"");
  items.forEach(p=>stock[p.id]=Math.max(0,stock[p.id]-cart[p.id]));
  store("shop_stock",stock);cart={};
  window.open("https://wa.me/"+S.wa.replace(/\D/g,"")+"?text="+encodeURIComponent(msg),"_blank");
  $("coD").close();render();renderCart();toast("Order sent. Stock updated.");
}
function ownerOpen(){
  $("sName").value=S.name;$("sWa").value=S.wa;$("sUpi").value=S.upi;
  $("stockList").innerHTML=PRODUCTS.map(p=>`<div class="row" style="padding:4px 0"><span>${p.n}</span><input class="stk" type="number" min="0" data-sid="${p.id}" value="${stock[p.id]}" aria-label="Stock for ${p.n}"></div>`).join("");
  $("owD").showModal();
}
document.addEventListener("click",e=>{
  const t=e.target.closest("button,a");if(!t)return;
  if(t.dataset.close!==undefined)t.closest("dialog").close();
  if(t.dataset.cat){cat=t.dataset.cat;render()}
  if(t.dataset.add)setQty(+t.dataset.add,1);
  if(t.dataset.d)setQty(+t.dataset.id,(cart[t.dataset.id]||0)+ +t.dataset.d);
});
$("q").addEventListener("input",render);
$("cartBtn").onclick=()=>{renderCart();$("cartD").showModal()};
$("toCheckout").onclick=()=>{$("cartD").close();$("err").textContent="";setPay(pay);$("coD").showModal()};
$("mUpi").onclick=()=>setPay("upi");$("mCod").onclick=()=>setPay("cod");
$("wa").onclick=sendOrder;$("ownerBtn").onclick=ownerOpen;
$("saveOw").onclick=()=>{
  S.name=$("sName").value.trim()||DEF.name;S.wa=$("sWa").value.trim()||DEF.wa;S.upi=$("sUpi").value.trim()||DEF.upi;
  document.querySelectorAll("[data-sid]").forEach(i=>stock[i.dataset.sid]=Math.max(0,parseInt(i.value)||0));
  Object.keys(cart).forEach(id=>{if(cart[id]>stock[id]){stock[id]>0?cart[id]=stock[id]:delete cart[id]}});
  store("shop_settings",S);store("shop_stock",stock);$("owD").close();render();toast("Saved");
};
render();
