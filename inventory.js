// Inventory management: stock per location, alerts, SKU/barcodes, suppliers and purchase orders.
// Data is saved in localStorage ("inv_data_v1"). Stock of locations marked "Sells online" is synced
// with the store through "shop_stock", so online orders reduce inventory automatically.
const $=id=>document.getElementById(id);
const inr=n=>"₹"+Math.round(n).toLocaleString("en-IN");
const esc=s=>String(s).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const ls=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}};
const K="inv_data_v1",WHY=["Stock count","Damaged","Expired","Returned","Other"];
let D,tab="stock",F={q:"",st:"all",loc:"all"};
const prod=id=>PRODUCTS.find(p=>p.id==id);
const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0);
const pad=(n,l)=>String(n).padStart(l,"0");
const dt=t=>new Date(t).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"2-digit"});

// ---------- barcodes (EAN-13) ----------
function check(d12){let s=0;for(let i=0;i<12;i++)s+=+d12[i]*(i%2?3:1);return(10-s%10)%10}
const ean=d12=>d12+check(d12);
const isEan=c=>/^\d{13}$/.test(c)&&+c[12]===check(c.slice(0,12));
const EL=["0001101","0011001","0010011","0111101","0100011","0110001","0101111","0111011","0110111","0001011"];
const EG=["0100111","0110011","0011011","0100001","0011101","0111001","0000101","0010001","0001001","0010111"];
const ER=["1110010","1100110","1101100","1000010","1011100","1001110","1010000","1000100","1001000","1110100"];
const EP=["LLLLLL","LLGLGG","LLGGLG","LLGGGL","LGLLGG","LGGLLG","LGGGLL","LGLGLG","LGLGGL","LGGLGL"];
function eanSvg(c){
  let b="101";for(let i=1;i<7;i++)b+=(EP[+c[0]][i-1]==="L"?EL:EG)[+c[i]];
  b+="01010";for(let i=7;i<13;i++)b+=ER[+c[i]];b+="101";
  const u=2,x0=12;let r="";
  [...b].forEach((v,i)=>{if(v==="1")r+=`<rect x="${x0+i*u}" y="4" width="${u}" height="62"/>`});
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x0*2+95*u} 84" role="img" aria-label="Barcode ${c}"><rect width="100%" height="100%" fill="#fff"/><g fill="#000">${r}</g><text x="${(x0*2+95*u)/2}" y="80" text-anchor="middle" font-family="Arial" font-size="13" letter-spacing="3">${c}</text></svg>`;
}

// ---------- data ----------
function seed(){
  const shop=ls("shop_stock",{}),items={};
  PRODUCTS.forEach(p=>items[p.id]=blank(p,shop[p.id]!==undefined?shop[p.id]:p.s));
  return{locations:[{id:"L1",name:"Main Store",online:true},{id:"L2",name:"Godown",online:false}],
    suppliers:[{id:"S1",name:"Pune Pharma Distributors",phone:"919999999999",lead:2,note:"Edit me"}],items,pos:[],log:[],synced:{}};
}
function blank(p,q){return{sku:"QM-"+(p.n.replace(/[^A-Za-z ]/g,"").split(" ")[0].slice(0,3).toUpperCase())+"-"+pad(p.id,3),
  bc:ean("2000000"+pad(p.id,5)),reorder:10,cost:Math.round(p.p*.75),sup:"S1",qty:{L1:q,L2:0}}}
function ensure(){PRODUCTS.forEach(p=>{if(!D.items[p.id])D.items[p.id]=blank(p,p.s)})}
const tot=id=>sum(Object.values(D.items[id].qty),x=>x||0);
const onl=id=>sum(D.locations.filter(l=>l.online),l=>D.items[id].qty[l.id]||0);
const stat=id=>{const t=tot(id);return t<=0?"out":t<=D.items[id].reorder?"low":"ok"};
function log(pid,loc,d,why){D.log.unshift({ts:Date.now(),pid,loc,d,why});D.log=D.log.slice(0,300)}
function save(){
  const o={};PRODUCTS.forEach(p=>o[p.id]=onl(p.id));D.synced=o;
  try{localStorage.setItem("shop_stock",JSON.stringify(o));localStorage.setItem(K,JSON.stringify(D))}catch(e){toast("Could not save. Browser storage may be full or blocked.")}
}
// store -> inventory: online orders (stock went down) and edits made in the store's owner panel
function pull(){
  const sh=ls("shop_stock",{}),ons=D.locations.filter(l=>l.online);let ch=false;
  if(!ons.length)return;
  PRODUCTS.forEach(p=>{
    const s=sh[p.id],sy=D.synced[p.id];if(s===undefined||sy===undefined||s===sy)return;
    const it=D.items[p.id],diff=s-sy;
    if(diff<0){let need=-diff;ons.forEach(l=>{const t=Math.min(need,it.qty[l.id]||0);it.qty[l.id]=(it.qty[l.id]||0)-t;need-=t});log(p.id,ons[0].id,diff,"Online order")}
    else{it.qty[ons[0].id]=(it.qty[ons[0].id]||0)+diff;log(p.id,ons[0].id,diff,"Edited in store panel")}
    ch=true;
  });
  if(ch){save();render()}
}
function toast(t){const d=document.createElement("div");d.className="toast";d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2400)}

// ---------- dialogs ----------
const dlg=$("dlg"),body=$("dlgBody");
function openDlg(h){body.innerHTML=h;if(!dlg.open)dlg.showModal()}
const closeDlg=()=>{if(dlg.open)dlg.close()};
const locOpts=sel=>D.locations.map(l=>`<option value="${l.id}" ${l.id===sel?"selected":""}>${esc(l.name)}</option>`).join("");
const head=t=>`<div class="r"><h2>${t}</h2><button class="x" data-close aria-label="Close">×</button></div>`;

function adjDlg(pid){
  const p=prod(pid),it=D.items[pid];
  openDlg(head(esc(p.n))+`<p class="note">${esc(it.sku)} · ${esc(p.w)}</p><h3>Set stock count</h3>`+
    D.locations.map(l=>`<label class="r"><span>${esc(l.name)}</span><input class="f" type="number" min="0" data-q="${l.id}" value="${it.qty[l.id]||0}"></label>`).join("")+
    `<label>Reason<select class="f" id="why">${WHY.map(w=>`<option>${w}</option>`).join("")}</select></label><button class="cta" id="saveAdj">Save stock</button>`+
    (D.locations.length>1?`<h3>Move between locations</h3><div class="r3"><select class="f" id="tf">${locOpts(D.locations[0].id)}</select><select class="f" id="tt">${locOpts(D.locations[1].id)}</select><input class="f" id="tq" type="number" min="1" value="1" aria-label="Quantity to move"></div><button class="cta alt" id="doTr">Move stock</button>`:""));
  $("saveAdj").onclick=()=>{
    body.querySelectorAll("[data-q]").forEach(i=>{const v=Math.max(0,parseInt(i.value)||0),old=it.qty[i.dataset.q]||0;if(v!==old){it.qty[i.dataset.q]=v;log(pid,i.dataset.q,v-old,$("why").value)}});
    save();closeDlg();render();toast("Stock saved");
  };
  if($("doTr"))$("doTr").onclick=()=>{
    const f=$("tf").value,t=$("tt").value,q=parseInt($("tq").value)||0;
    if(f===t)return toast("Choose two different locations.");
    if(q<1||q>(it.qty[f]||0))return toast("Not enough stock in the source location.");
    it.qty[f]-=q;it.qty[t]=(it.qty[t]||0)+q;log(pid,f,-q,"Moved out");log(pid,t,q,"Moved in");
    save();closeDlg();render();toast("Stock moved");
  };
}
function editDlg(pid){
  const p=prod(pid),it=D.items[pid];
  openDlg(head("Edit "+esc(p.n))+`<label>SKU<input class="f" id="eSku" value="${esc(it.sku)}"></label><label>Barcode (13-digit EAN or any code)<input class="f" id="eBc" value="${esc(it.bc)}"></label>
    <div class="r3" style="grid-template-columns:1fr 1fr"><label>Reorder level<input class="f" id="eRe" type="number" min="0" value="${it.reorder}"></label><label>Cost price (₹)<input class="f" id="eCost" type="number" min="0" value="${it.cost}"></label></div>
    <label>Supplier<select class="f" id="eSup"><option value="">None</option>${D.suppliers.map(s=>`<option value="${s.id}" ${s.id===it.sup?"selected":""}>${esc(s.name)}</option>`).join("")}</select></label>
    <button class="cta" id="saveEd">Save details</button>`);
  $("saveEd").onclick=()=>{
    const sku=$("eSku").value.trim(),bc=$("eBc").value.trim();
    if(!sku||!bc)return toast("SKU and barcode cannot be empty.");
    if(PRODUCTS.some(x=>x.id!=pid&&(D.items[x.id].sku.toLowerCase()===sku.toLowerCase()||D.items[x.id].bc===bc)))return toast("Another product already uses this SKU or barcode.");
    Object.assign(it,{sku,bc,reorder:Math.max(0,+$("eRe").value||0),cost:Math.max(0,+$("eCost").value||0),sup:$("eSup").value});
    save();closeDlg();render();toast("Details saved");
  };
}
function lblDlg(pid){
  const p=prod(pid),it=D.items[pid];
  openDlg(head("Barcode label")+`<div id="lbl"><b>${esc(p.n)}</b> · ${esc(p.w)}<br>${isEan(it.bc)?eanSvg(it.bc):`<p>${esc(it.bc)}<br><small>Custom code (no bars)</small></p>`}<br>${esc(it.sku)} · MRP ${inr(p.m)}</div><button class="cta" id="prn">Print label</button>`);
  $("prn").onclick=()=>{const w=window.open("","_blank","width=380,height=300");if(!w)return toast("Allow pop-ups to print.");w.document.write("<title>Label</title><body style='margin:8px'>"+$("lbl").outerHTML+"<script>onload=function(){print()}<\/script>");w.document.close()};
}
function supDlg(id){
  const s=D.suppliers.find(x=>x.id===id)||{name:"",phone:"",lead:2,note:""};
  openDlg(head(id?"Edit supplier":"New supplier")+`<label>Name<input class="f" id="sN" value="${esc(s.name)}"></label><label>WhatsApp number (91XXXXXXXXXX)<input class="f" id="sP" inputmode="numeric" value="${esc(s.phone)}"></label>
    <label>Delivery time (days)<input class="f" id="sL" type="number" min="0" value="${s.lead}"></label><label>Notes<input class="f" id="sT" value="${esc(s.note)}"></label><button class="cta" id="saveSup">Save supplier</button>`);
  $("saveSup").onclick=()=>{
    const n=$("sN").value.trim(),ph=$("sP").value.replace(/\D/g,"");
    if(!n)return toast("Enter the supplier name.");
    const v={name:n,phone:ph,lead:+$("sL").value||0,note:$("sT").value.trim()};
    if(id)Object.assign(s,v);else D.suppliers.push({id:"S"+Date.now().toString(36),...v});
    save();closeDlg();render();
  };
}
function locDlg(){
  openDlg(head("New location")+`<label>Name<input class="f" id="lN" placeholder="e.g. Kothrud branch"></label><button class="cta" id="saveLoc">Add location</button>`);
  $("saveLoc").onclick=()=>{const n=$("lN").value.trim();if(!n)return toast("Enter a location name.");
    const id="L"+Date.now().toString(36);D.locations.push({id,name:n,online:false});PRODUCTS.forEach(p=>D.items[p.id].qty[id]=0);save();closeDlg();render()};
}
function poDlg(opt={}){
  if(!D.suppliers.length)return toast("Add a supplier first.");
  let lines=[];
  openDlg(head("New purchase order")+`<label>Supplier<select class="f" id="pS">${D.suppliers.map(s=>`<option value="${s.id}" ${s.id===opt.sup?"selected":""}>${esc(s.name)}</option>`).join("")}</select></label>
    <label>Deliver to<select class="f" id="pL">${locOpts(D.locations[0].id)}</select></label><div id="pLines"></div>
    <div class="r"><button class="sm" id="addL">Add product</button><button class="sm" id="fillL">Add low-stock items</button></div>
    <p class="note">Order total <b id="pT"></b></p><button class="cta" id="savePO">Create purchase order</button>`);
  const total=()=>$("pT").textContent=inr(sum(lines,l=>l.q*l.cost));
  const draw=()=>{$("pLines").innerHTML=lines.length?lines.map((l,i)=>`<div class="r3"><select class="f" data-i="${i}" data-k="pid" aria-label="Product">${PRODUCTS.map(p=>`<option value="${p.id}" ${p.id==l.pid?"selected":""}>${esc(p.n)}</option>`).join("")}</select><input class="f" type="number" min="1" data-i="${i}" data-k="q" value="${l.q}" aria-label="Quantity"><input class="f" type="number" min="0" data-i="${i}" data-k="cost" value="${l.cost}" aria-label="Unit cost in rupees"></div>`).join(""):'<p class="note">No products yet. Add a product or use low-stock items.</p>';total()};
  const add=pid=>{if(!lines.some(l=>l.pid==pid))lines.push({pid:+pid,q:Math.max(1,D.items[pid].reorder*2-tot(pid)),cost:D.items[pid].cost})};
  const fill=()=>{PRODUCTS.filter(p=>stat(p.id)!=="ok"&&(!$("pS").value||D.items[p.id].sup===$("pS").value)).forEach(p=>add(p.id));draw();if(!lines.length)toast("No low-stock items for this supplier.")};
  $("addL").onclick=()=>{const n=PRODUCTS.find(p=>!lines.some(l=>l.pid==p.id));if(n){add(n.id);draw()}};
  $("fillL").onclick=fill;
  $("pLines").addEventListener("input",e=>{const t=e.target,i=t.dataset.i;if(i===undefined)return;if(t.dataset.k==="pid"){lines[i].pid=+t.value;lines[i].cost=D.items[t.value].cost;draw()}else{lines[i][t.dataset.k]=Math.max(0,+t.value||0);total()}});
  $("savePO").onclick=()=>{
    const ls2=lines.filter(l=>l.q>0);if(!ls2.length)return toast("Add at least one product with a quantity.");
    D.pos.unshift({id:"PO-"+pad(D.pos.length+1,4),ts:Date.now(),sup:$("pS").value,loc:$("pL").value,status:"ordered",lines:ls2});
    save();closeDlg();tab="po";render();toast("Purchase order created");
  };
  if(opt.auto)fill();else draw();
}
function receivePO(id){
  const po=D.pos.find(x=>x.id===id);if(!po||po.status!=="ordered")return;
  if(!confirm("Mark "+po.id+" as received and add the stock to "+(D.locations.find(l=>l.id===po.loc)||{}).name+"?"))return;
  po.lines.forEach(l=>{const it=D.items[l.pid];it.qty[po.loc]=(it.qty[po.loc]||0)+l.q;it.cost=l.cost;log(l.pid,po.loc,l.q,"Received "+po.id)});
  po.status="received";po.rcv=Date.now();save();render();toast(po.id+" received. Stock updated.");
}
function waPO(id){
  const po=D.pos.find(x=>x.id===id),s=D.suppliers.find(x=>x.id===po.sup)||{};
  const m=`*Purchase order ${po.id}* – Quick Med Pune\n\n`+po.lines.map(l=>`• ${prod(l.pid).n} × ${l.q} @ ${inr(l.cost)}`).join("\n")+`\n\nTotal: ${inr(sum(po.lines,l=>l.q*l.cost))}\nDeliver to: ${(D.locations.find(l=>l.id===po.loc)||{}).name}`;
  window.open("https://wa.me/"+(s.phone||"")+"?text="+encodeURIComponent(m),"_blank");
}

// ---------- views ----------
const thumb=p=>{const b=p.i.replace(/\.\w+$/,"");return`<img class="th" src="images/${b}.jpg" data-b="${b}" data-k="0" onerror="nextImg(this)" alt="">`};
const EXT=["jpg","png","webp","svg"];
function nextImg(el){const k=+el.dataset.k+1;if(k<EXT.length){el.dataset.k=k;el.src="images/"+el.dataset.b+"."+EXT[k]}else el.onerror=null}
const pill=s=>`<span class="pill ${s}">${{out:"Out of stock",low:"Low stock",ok:"In stock"}[s]}</span>`;

function stockView(){
  const q=F.q.toLowerCase();
  const rows=PRODUCTS.filter(p=>{const it=D.items[p.id];
    return(!q||(p.n+it.sku+it.bc).toLowerCase().includes(q))&&(F.st==="all"||stat(p.id)===F.st)&&(F.loc==="all"||(it.qty[F.loc]||0)>0)});
  return`<div class="filters"><input class="f" id="fq" placeholder="Search name, SKU or barcode" value="${esc(F.q)}" aria-label="Search"><select class="f" id="fs" aria-label="Status"><option value="all">All status</option><option value="low" ${F.st==="low"?"selected":""}>Low stock</option><option value="out" ${F.st==="out"?"selected":""}>Out of stock</option><option value="ok" ${F.st==="ok"?"selected":""}>In stock</option></select><select class="f" id="fl" aria-label="Location"><option value="all">All locations</option>${locOpts(F.loc)}</select></div>
  <div class="scroll"><table><tr><th>Product</th><th>SKU</th><th>Barcode</th>${D.locations.map(l=>`<th class="n">${esc(l.name)}</th>`).join("")}<th class="n">Total</th><th class="n">Reorder at</th><th>Status</th><th></th></tr>`+
  (rows.length?rows.map(p=>{const it=D.items[p.id];return`<tr><td>${thumb(p)}${esc(p.n)} <small>${esc(p.w)}${p.r?" · Rx":""}</small></td><td>${esc(it.sku)}</td><td>${esc(it.bc)}</td>${D.locations.map(l=>`<td class="n">${it.qty[l.id]||0}</td>`).join("")}<td class="n"><b>${tot(p.id)}</b></td><td class="n">${it.reorder}</td><td>${pill(stat(p.id))}</td><td><button class="sm go" data-act="adj" data-id="${p.id}">Stock</button> <button class="sm" data-act="edit" data-id="${p.id}">Edit</button> <button class="sm" data-act="lbl" data-id="${p.id}">Label</button></td></tr>`}).join(""):`<tr><td class="empty" colspan="${8+D.locations.length}">No products match.</td></tr>`)+`</table></div>`;
}
function poView(){
  return`<div class="r" style="margin-bottom:10px"><h2>Purchase orders</h2><button class="sm go" data-act="po-new">New purchase order</button></div><div class="scroll"><table><tr><th>Order</th><th>Date</th><th>Supplier</th><th>Deliver to</th><th>Items</th><th class="n">Total</th><th>Status</th><th></th></tr>`+
  (D.pos.length?D.pos.map(po=>{const s=D.suppliers.find(x=>x.id===po.sup)||{name:"(removed)"},l=D.locations.find(x=>x.id===po.loc)||{name:"-"};
    return`<tr><td>${po.id}</td><td>${dt(po.ts)}</td><td>${esc(s.name)}</td><td>${esc(l.name)}</td><td title="${esc(po.lines.map(x=>prod(x.pid).n+" × "+x.q).join(", "))}">${sum(po.lines,x=>x.q)} units</td><td class="n">${inr(sum(po.lines,x=>x.q*x.cost))}</td><td><span class="pill ${po.status==="received"?"ok":po.status==="ordered"?"low":"out"}" ${po.status==="ordered"?'style="background:var(--turm);color:#17203d"':""}>${po.status[0].toUpperCase()+po.status.slice(1)}</span></td><td>${po.status==="ordered"?`<button class="sm go" data-act="po-recv" data-id="${po.id}">Receive</button> <button class="sm" data-act="po-wa" data-id="${po.id}">WhatsApp</button> <button class="sm bad" data-act="po-cancel" data-id="${po.id}">Cancel</button>`:`<span class="dim">${po.rcv?dt(po.rcv):""}</span>`}</td></tr>`}).join(""):'<tr><td class="empty" colspan="8">No purchase orders yet.</td></tr>')+`</table></div>`;
}
function supView(){
  return`<div class="r" style="margin-bottom:10px"><h2>Suppliers</h2><button class="sm go" data-act="sup-new">Add supplier</button></div><div class="scroll"><table><tr><th>Name</th><th>WhatsApp</th><th class="n">Delivery days</th><th class="n">Products</th><th>Notes</th><th></th></tr>`+
  (D.suppliers.length?D.suppliers.map(s=>`<tr><td>${esc(s.name)}</td><td>${esc(s.phone)}</td><td class="n">${s.lead}</td><td class="n">${PRODUCTS.filter(p=>D.items[p.id].sup===s.id).length}</td><td>${esc(s.note)}</td><td><button class="sm" data-act="sup-edit" data-id="${s.id}">Edit</button> <button class="sm bad" data-act="sup-del" data-id="${s.id}">Remove</button></td></tr>`).join(""):'<tr><td class="empty" colspan="6">No suppliers yet.</td></tr>')+`</table></div>`;
}
function locView(){
  return`<div class="r" style="margin-bottom:10px"><h2>Locations</h2><button class="sm go" data-act="loc-new">Add location</button></div><div class="scroll"><table><tr><th>Name</th><th class="n">Units</th><th class="n">Stock value</th><th>Sells online</th><th></th></tr>`+
  D.locations.map((l,i)=>`<tr><td>${esc(l.name)}</td><td class="n">${sum(PRODUCTS,p=>D.items[p.id].qty[l.id]||0)}</td><td class="n">${inr(sum(PRODUCTS,p=>(D.items[p.id].qty[l.id]||0)*D.items[p.id].cost))}</td><td><label><input type="checkbox" data-act="loc-on" data-id="${l.id}" ${l.online?"checked":""}> Online store uses this stock</label></td><td>${i>0?`<button class="sm bad" data-act="loc-del" data-id="${l.id}">Remove</button>`:""}</td></tr>`).join("")+
  `</table></div><h2 style="margin:18px 0 8px">Recent stock movements</h2><div class="scroll"><table><tr><th>Date</th><th>Product</th><th>Location</th><th class="n">Change</th><th>Reason</th></tr>`+
  (D.log.length?D.log.slice(0,25).map(e=>`<tr><td>${dt(e.ts)}</td><td>${esc((prod(e.pid)||{n:"?"}).n)}</td><td>${esc((D.locations.find(l=>l.id===e.loc)||{name:"-"}).name)}</td><td class="n ${e.d<0?"down":"up"}">${e.d>0?"+":""}${e.d}</td><td>${esc(e.why)}</td></tr>`).join(""):'<tr><td class="empty" colspan="5">No movements yet.</td></tr>')+`</table></div>`;
}
function render(){
  ensure();
  const c={out:0,low:0,ok:0};PRODUCTS.forEach(p=>c[stat(p.id)]++);
  const units=sum(PRODUCTS,p=>tot(p.id)),val=sum(PRODUCTS,p=>tot(p.id)*D.items[p.id].cost);
  $("kpis").innerHTML=[["Products (SKUs)",PRODUCTS.length,D.locations.length+" locations"],["Units in stock",units.toLocaleString("en-IN"),""],["Stock value (at cost)",inr(val),""],["Needs attention",c.out+c.low,c.out+" out of stock · "+c.low+" low"]].map(k=>`<div class="kpi"><small>${k[0]}</small><b>${k[1]}</b><span>${k[2]}</span></div>`).join("");
  const al=$("alerts"),bad=PRODUCTS.filter(p=>stat(p.id)!=="ok");
  al.className="banner"+(bad.length?" bad":"");
  al.innerHTML=bad.length?`<b>${c.out?c.out+" out of stock":""}${c.out&&c.low?" and ":""}${c.low?c.low+" running low":""}:</b> ${esc(bad.slice(0,4).map(p=>p.n).join(", "))}${bad.length>4?" and "+(bad.length-4)+" more":""}. <button class="sm go" data-act="po-low">Create purchase order</button>`:"";
  document.title=(bad.length?"("+bad.length+") ":"")+"Inventory – Quick Med Pune";
  const T=[["stock","Stock"],["po","Purchase orders"+(D.pos.filter(p=>p.status==="ordered").length?" ("+D.pos.filter(p=>p.status==="ordered").length+")":"")],["sup","Suppliers"],["loc","Locations and activity"]];
  $("tabs").innerHTML=T.map(t=>`<button role="tab" data-tab="${t[0]}" aria-selected="${tab===t[0]}">${t[1]}</button>`).join("");
  const act=document.activeElement&&document.activeElement.id,pos=document.activeElement&&document.activeElement.selectionStart;
  $("view").innerHTML={stock:stockView,po:poView,sup:supView,loc:locView}[tab]();
  if(act==="fq"){const e=$("fq");e.focus();try{e.setSelectionRange(pos,pos)}catch(x){}}
}

// ---------- events ----------
document.addEventListener("click",e=>{
  const t=e.target.closest("button,input[type=checkbox]");if(!t)return;
  if(t.dataset.close!==undefined)return closeDlg();
  if(t.dataset.tab){tab=t.dataset.tab;return render()}
  const a=t.dataset.act,id=t.dataset.id;if(!a)return;
  if(a==="adj")adjDlg(id);if(a==="edit")editDlg(id);if(a==="lbl")lblDlg(id);
  if(a==="po-new")poDlg();
  if(a==="po-low"){const f=PRODUCTS.find(p=>stat(p.id)!=="ok");poDlg({sup:f&&D.items[f.id].sup,auto:true})}
  if(a==="po-recv")receivePO(id);if(a==="po-wa")waPO(id);
  if(a==="po-cancel"&&confirm("Cancel "+id+"?")){D.pos.find(x=>x.id===id).status="cancelled";save();render()}
  if(a==="sup-new")supDlg();if(a==="sup-edit")supDlg(id);
  if(a==="sup-del"&&confirm("Remove this supplier? Products linked to it will have no supplier.")){D.suppliers=D.suppliers.filter(s=>s.id!==id);PRODUCTS.forEach(p=>{if(D.items[p.id].sup===id)D.items[p.id].sup=""});save();render()}
  if(a==="loc-new")locDlg();
  if(a==="loc-on"){D.locations.find(l=>l.id===id).online=t.checked;save();render();toast("Online store stock updated")}
  if(a==="loc-del"){if(sum(PRODUCTS,p=>D.items[p.id].qty[id]||0)>0)return toast("Move or clear the stock in this location first.");
    if(confirm("Remove this location?")){D.locations=D.locations.filter(l=>l.id!==id);PRODUCTS.forEach(p=>delete D.items[p.id].qty[id]);save();render()}}
});
document.addEventListener("input",e=>{if(e.target.id==="fq"){F.q=e.target.value;render()}});
document.addEventListener("change",e=>{if(e.target.id==="fs"){F.st=e.target.value;render()}if(e.target.id==="fl"){F.loc=e.target.value;render()}});
$("scan").addEventListener("keydown",e=>{
  if(e.key!=="Enter")return;const v=e.target.value.trim().toLowerCase();if(!v)return;
  const p=PRODUCTS.find(x=>D.items[x.id].bc===v||D.items[x.id].sku.toLowerCase()===v);
  e.target.value="";p?adjDlg(p.id):toast("No product with that barcode or SKU.");
});
$("csv").onclick=()=>{
  const q=v=>'"'+String(v).replace(/"/g,'""')+'"';
  const r=[["SKU","Product","Barcode",...D.locations.map(l=>l.name),"Total","Reorder level","Cost","Supplier"].map(q).join(",")];
  PRODUCTS.forEach(p=>{const it=D.items[p.id],s=D.suppliers.find(x=>x.id===it.sup);r.push([it.sku,p.n+" "+p.w,it.bc,...D.locations.map(l=>it.qty[l.id]||0),tot(p.id),it.reorder,it.cost,s?s.name:""].map(q).join(","))});
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+r.join("\n")],{type:"text/csv"}));a.download="stock.csv";a.click();
};
window.addEventListener("storage",e=>{if(e.key==="shop_stock")pull()});
setInterval(pull,4000);

// ---------- start ----------
D=ls(K,null)||seed();ensure();save();render();pull();
