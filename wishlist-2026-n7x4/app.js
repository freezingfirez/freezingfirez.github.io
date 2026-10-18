(()=>{
"use strict";
const items=(window.WISHLIST_ITEMS||[]).slice().sort((a,b)=>a.priority-b.priority);
const grid=document.getElementById("giftGrid"),tabs=document.getElementById("categoryTabs"),counter=document.getElementById("resultsCount");
const search=document.getElementById("searchInput"),sort=document.getElementById("sortSelect");
let category="All";
const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&#39;"}[c]));
const safe=s=>{try{const u=new URL(s);return u.protocol==="https:"?u.href:"#"}catch{return"#"}};
const money=n=>Number.isFinite(n)?new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n):"Choose model";
function renderTabs(){
const cats=["All",...new Set(items.map(x=>x.category))];
tabs.innerHTML=cats.map(c=>'<button class="tab '+(c===category?'active':'')+'" data-category="'+escape(c)+'" aria-pressed="'+(c===category)+'">'+escape(c==="All"?"All gifts":c)+'</button>').join("");
tabs.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{category=b.dataset.category;renderTabs();render()}));
}
function card(x){
const shops=x.stores||[];
const first=shops[0];
const image=x.image?'<img loading="lazy" alt="'+escape(x.name)+' product photo" src="'+escape(safe(x.image))+'" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'"><span class="picture-fallback" style="display:none">✦</span>':'<span class="picture-fallback">✦</span>';
return '<article class="gift-card"><div class="product-image green">'+image+
'<span class="rank-pill">#'+x.priority+' priority</span><span class="stage-pill">'+(x.price===null?'Selection TBD':'On my list')+'</span></div>'+
'<div class="card-body"><div class="category-label">'+escape(x.brand)+'</div><h3 class="card-name">'+escape(x.name)+'</h3>'+
'<p class="card-desc">'+escape(x.description)+'</p>'+
(x.depends?'<p class="dependency"><strong>Before buying:</strong> '+escape(x.depends)+'</p>':'')+
'<div class="price-row"><div><div class="price-label">Reference budget · not live</div><div class="price">'+money(x.price)+'</div></div>'+
(first?'<a class="card-cta" href="'+escape(safe(first[1]))+'" target="_blank" rel="noopener noreferrer">Shop ↗</a>':'')+'</div>'+
'<div class="store-links"><b>Compare stores</b> · '+shops.map(s=>'<a href="'+escape(safe(s[1]))+'" target="_blank" rel="noopener noreferrer">'+escape(s[0])+' ↗</a>').join(' · ')+'</div>'+
'<p class="card-footnote">Check live price, stock, seller, exact mount/model before checkout.</p></div></article>';
}
function render(){
let data=items.filter(x=>(category==="All"||x.category===category)&&[x.name,x.brand,x.category,x.description].join(' ').toLowerCase().includes(search.value.toLowerCase()));
switch(sort.value){case"low":data.sort((a,b)=>(a.price??Infinity)-(b.price??Infinity));break;case"high":data.sort((a,b)=>(b.price??-Infinity)-(a.price??-Infinity));break;case"alpha":data.sort((a,b)=>a.name.localeCompare(b.name));break;default:data.sort((a,b)=>a.priority-b.priority);}
counter.textContent=data.length+" "+(data.length===1?"gift":"gifts");
grid.innerHTML=data.length?data.map(card).join(""):'<div class="empty-state"><h3>No matching gifts</h3><p>Try another search or category.</p></div>';
}
const css=document.createElement('style');css.textContent='.gift-card{position:relative}.product-image{background:radial-gradient(circle,#ebeee5,#c3d4c9)!important}.product-image img{object-fit:contain;width:100%;height:100%;padding:23px}.picture-fallback{display:grid;place-items:center;font-size:84px;color:#658e7d;width:100%;height:100%}.dependency{background:#e7c79c16;border:1px solid #e7c79c55;border-radius:11px;padding:12px;font-size:12px;line-height:1.55;color:#e8d6b7}.dependency strong{color:#f7e4c5}.store-links{border-top:1px solid #40555a;margin-top:17px;padding-top:14px;font-size:11px;color:#b2c6c5;line-height:2}.store-links a{color:#f2d3a4;text-decoration:underline;text-underline-offset:3px}.card-footnote{margin:10px 0 0;color:#899da5;line-height:1.45}.price{font-size:19px}.rank-pill{font-size:11px}';document.head.appendChild(css);
const now=new Date(),christmas=new Date(now.getFullYear(),11,25);if(now>christmas)christmas.setFullYear(now.getFullYear()+1);
document.getElementById('daysLeft').textContent=Math.max(0,Math.ceil((christmas-now)/86400000));
const toast=document.getElementById('toast');document.getElementById('shareBtn').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);toast.textContent='Link copied!';toast.classList.add('visible');setTimeout(()=>toast.classList.remove('visible'),2500)}catch{toast.textContent='Copy the address bar link.';toast.classList.add('visible')}});
search.addEventListener('input',render);sort.addEventListener('change',render);renderTabs();render();
})();