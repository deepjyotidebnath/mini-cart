// Sales dashboard. Reads orders saved by the store (localStorage "shop_orders") or builds demo data.
const $=id=>document.getElementById(id);
const inr=n=>"₹"+Math.round(n).toLocaleString("en-IN");
const load=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}};
const DAY=864e5,LOW=5;
let charts={};

// ---------- data ----------
function demoOrders(){
  let a=20261002;const rnd=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  const names=["Aarav Patil","Sneha Kulkarni","Rohan Deshmukh","Priya Joshi","Vikram More","Anjali Shinde","Kiran Pawar","Meera Gokhale","Sahil Jadhav","Neha Bhosale"];
  const out=[],now=Date.now();
  for(let d=89;d>=0;d--){
    const dt=new Date(now-d*DAY),wk=[0,6].includes(dt.getDay());
    const n=Math.floor(2+rnd()*4+(wk?2:0)+(90-d)/30);
    for(let i=0;i<n;i++){
      const k=1+Math.floor(rnd()*3),items=[],used={};
      for(let x=0;x<k;x++){
        const p=PRODUCTS[Math.floor(Math.pow(rnd(),1.4)*PRODUCTS.length)];if(used[p.id])continue;used[p.id]=1;
        items.push({id:p.id,n:p.n,c:p.c,q:1+Math.floor(rnd()*3),p:p.p});
      }
      const sub=items.reduce((s,t)=>s+t.q*t.p,0);
      out.push({id:"DM"+String(out.length+1).padStart(4,"0"),ts:dt.setHours(9+Math.floor(rnd()*11),Math.floor(rnd()*60)),
        name:names[Math.floor(rnd()*names.length)],phone:"98"+Math.floor(10000000+rnd()*89999999),pin:"411"+String(Math.floor(rnd()*60)).padStart(3,"0"),
        pay:rnd()<.62?"upi":"cod",total:sub+(sub<499?40:0),items});
      dt.setTime(now-d*DAY);
    }
  }
  return out;
}
const stockNow=()=>{const s=load("shop_stock",{});return PRODUCTS.map(p=>({...p,stock:s[p.id]!==undefined?s[p.id]:p.s}))};
const inRange=(o,days,off=0)=>o.ts>=Date.now()-(days+off)*DAY&&o.ts<Date.now()-off*DAY;
const sum=(arr,f)=>arr.reduce((s,x)=>s+f(x),0);
const delta=(c,p)=>p?((c-p)/p*100):null;
const dTxt=d=>d===null?"":`<span class="${d>=0?"up":"down"}">${d>=0?"+":""}${d.toFixed(0)}% vs previous period</span>`;

// ---------- render ----------
function render(){
  const days=+$("range").value,live=load("shop_orders",[]);
  const useDemo=$("src").value==="demo",all=useDemo?demoOrders():live;
  $("banner").textContent=useDemo?"Showing demo data. Choose Store orders to see real orders from your store.":
    all.length?"":"No orders yet. Orders sent from your store appear here automatically. Pick Demo data to preview the dashboard.";
  const cur=all.filter(o=>inRange(o,days)),prev=all.filter(o=>inRange(o,days,days));
  const rev=sum(cur,o=>o.total),pr=sum(prev,o=>o.total),cnt=cur.length,aov=cnt?rev/cnt:0;
  const upi=cnt?cur.filter(o=>o.pay==="upi").length/cnt*100:0;
  const st=stockNow(),low=st.filter(p=>p.stock<=LOW);
  $("kpis").innerHTML=[
    ["Revenue",inr(rev),dTxt(delta(rev,pr))],
    ["Orders",cnt,dTxt(delta(cnt,prev.length))],
    ["Average order",inr(aov),cnt?`UPI ${upi.toFixed(0)}% · COD ${(100-upi).toFixed(0)}%`:""],
    ["Low or out of stock",low.length,low.length?low.slice(0,2).map(p=>p.n).join(", ")+(low.length>2?" and more":""):"All items well stocked"]
  ].map(k=>`<div class="kpi"><small>${k[0]}</small><b>${k[1]}</b><span>${k[2]}</span></div>`).join("");

  // revenue per day
  const labels=[],vals=[];
  for(let d=days-1;d>=0;d--){const t=new Date(Date.now()-d*DAY);labels.push(t.toLocaleDateString("en-IN",{day:"numeric",month:"short"}));
    vals.push(sum(cur.filter(o=>new Date(o.ts).toDateString()===t.toDateString()),o=>o.total))}
  // by product / category
  const prod={},cat={};
  cur.forEach(o=>o.items.forEach(i=>{const r=i.q*i.p;(prod[i.n]=prod[i.n]||{r:0,q:0});prod[i.n].r+=r;prod[i.n].q+=i.q;cat[i.c]=(cat[i.c]||0)+r}));
  const top=Object.entries(prod).sort((a,b)=>b[1].r-a[1].r).slice(0,6);
  const css=getComputedStyle(document.documentElement),c=n=>css.getPropertyValue(n).trim();
  Chart.defaults.color=c("--mute");Chart.defaults.borderColor=c("--line");Chart.defaults.font.family="Mukta,system-ui,sans-serif";
  const pal=[c("--blue"),c("--turm"),c("--leaf"),c("--chilli"),"#7a4bb5","#2a9db5","#b4571f"];
  const draw=(id,cfg)=>{charts[id]&&charts[id].destroy();charts[id]=new Chart($(id),cfg)};
  const base={responsive:true,maintainAspectRatio:false};
  draw("cRev",{type:"line",data:{labels,datasets:[{data:vals,borderColor:c("--blue"),backgroundColor:c("--blue")+"22",fill:true,tension:.3,pointRadius:days>30?0:3}]},
    options:{...base,plugins:{legend:{display:false},tooltip:{callbacks:{label:x=>inr(x.parsed.y)}}},scales:{y:{beginAtZero:true,ticks:{callback:v=>inr(v)}},x:{ticks:{maxTicksLimit:8}}}}});
  draw("cCat",{type:"doughnut",data:{labels:Object.keys(cat),datasets:[{data:Object.values(cat),backgroundColor:pal,borderColor:c("--card"),borderWidth:2}]},
    options:{...base,cutout:"60%",plugins:{legend:{position:"bottom"},tooltip:{callbacks:{label:x=>x.label+": "+inr(x.parsed)}}}}});
  draw("cTop",{type:"bar",data:{labels:top.map(t=>t[0]),datasets:[{data:top.map(t=>t[1].r),backgroundColor:c("--leaf"),borderRadius:4}]},
    options:{...base,indexAxis:"y",plugins:{legend:{display:false},tooltip:{callbacks:{label:x=>inr(x.parsed.x)+" · "+top[x.dataIndex][1].q+" sold"}}},scales:{x:{ticks:{callback:v=>inr(v)}}}}});

  // restock table: days of stock left at the current selling rate
  const rows=st.map(p=>{const sold=prod[p.n]?prod[p.n].q:0,rate=sold/days;return{...p,sold,left:rate?p.stock/rate:Infinity}})
    .sort((a,b)=>(a.stock<=0?-1:a.left)-(b.stock<=0?-1:b.left)).slice(0,7);
  $("tStock").innerHTML="<tr><th>Product</th><th class='n'>In stock</th><th class='n'>Sold</th><th class='n'>Days left</th><th>Status</th></tr>"+
    rows.map(p=>`<tr><td>${p.n}</td><td class="n">${p.stock}</td><td class="n">${p.sold}</td><td class="n">${p.left===Infinity?"–":Math.floor(p.left)}</td><td><span class="pill ${p.stock<=0?"out":p.stock<=LOW||p.left<7?"low":"ok"}">${p.stock<=0?"Out of stock":p.stock<=LOW||p.left<7?"Reorder":"OK"}</span></td></tr>`).join("");
  // recent orders
  const rec=[...all].sort((a,b)=>b.ts-a.ts).slice(0,8);
  $("tOrders").innerHTML=rec.length?"<tr><th>Order</th><th>Date</th><th>Customer</th><th>Phone</th><th>Items</th><th>Payment</th><th class='n'>Total</th></tr>"+
    rec.map(o=>`<tr><td>${o.id}</td><td>${new Date(o.ts).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</td><td>${esc(o.name)}</td><td>xxxxxx${String(o.phone).slice(-4)}</td><td>${sum(o.items,i=>i.q)}</td><td>${o.pay==="upi"?"UPI":"COD"}</td><td class="n">${inr(o.total)}</td></tr>`).join(""):
    '<tr><td class="empty">No orders to show.</td></tr>';
}
const esc=s=>String(s).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));

// ---------- actions ----------
$("csv").onclick=()=>{
  const o=$("src").value==="demo"?demoOrders():load("shop_orders",[]);
  if(!o.length)return alert("There are no orders to export yet.");
  const q=v=>'"'+String(v).replace(/"/g,'""')+'"';
  const rows=[["Order","Date","Customer","Phone","PIN","Payment","Items","Total"].join(",")].concat(o.map(x=>[x.id,new Date(x.ts).toISOString().slice(0,16).replace("T"," "),x.name,x.phone,x.pin,x.pay,x.items.map(i=>i.n+" x"+i.q).join("; "),x.total].map(q).join(",")));
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+rows.join("\n")],{type:"text/csv"}));a.download="orders.csv";a.click();
};
$("clr").onclick=()=>{if(confirm("Delete all orders saved by the store in this browser? This cannot be undone.")){try{localStorage.removeItem("shop_orders")}catch(e){}render()}};
$("range").onchange=$("src").onchange=render;
matchMedia("(prefers-color-scheme:dark)").addEventListener("change",render);
if(!load("shop_orders",[]).length)$("src").value="demo";
render();
