const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const catalog = [
 {id:"p1",name:"Nova Wireless Headphones",price:3490,category:"tech"},
 {id:"p2",name:"Pulse Smart Watch X",price:4890,category:"tech"},
 {id:"p3",name:"Urban Carry Backpack",price:2250,category:"style"},
 {id:"p4",name:"Halo Ambient Desk Lamp",price:1890,category:"home"}
];
let cart = JSON.parse(localStorage.getItem("nu_cart") || "[]");
let lang = localStorage.getItem("nu_lang") || "bn";
let theme = localStorage.getItem("nu_theme") || "dark";
const translations = {
 en:{announcement:"— Welcome to a new experience",nav_home:"Home",nav_shop:"Shop",nav_collections:"Collections",nav_about:"About us",eyebrow:"THE NEXT GENERATION SHOPPING EXPERIENCE",hero_title:"Beyond ordinary.<br><em>Your new</em><br>destination.",hero_desc:"Curated premium products for technology, style and everyday living — all in one place.",explore:"Start shopping",discover:"Explore collections",authentic:"Authentic products",support:"Customer support",local:"Local payments",trust1:"Curated products",trust2:"Secure checkout",trust3:"Fast delivery",trust4:"Easy returns",categories:"Explore your categories",view_all:"View all",cat_tech:"Tech & Gadgets",cat_style:"Style & Lifestyle",cat_home:"Home Essentials",featured:"Featured products",featured_desc:"Thoughtfully selected for your everyday life.",load_more:"Explore more products",promo_title:"Better choices.<br><em>Better experiences.</em>",promo_desc:"Every NEXUS ULTRA product is selected with quality, utility and design in mind.",shop_now:"Shop now",newsletter_title:"Don't miss what's next.",newsletter_desc:"Get updates on new collections and offers.",footer_desc:"Make everyday choices extraordinary."},
 bn:{announcement:"— নতুন অভিজ্ঞতায় স্বাগতম",nav_home:"হোম",nav_shop:"শপ",nav_collections:"কালেকশন",nav_about:"আমাদের সম্পর্কে",eyebrow:"নতুন প্রজন্মের শপিং অভিজ্ঞতা",hero_title:"সাধারণের বাইরে।<br><em>আপনার পছন্দের</em><br>নতুন ঠিকানা।",hero_desc:"প্রযুক্তি, স্টাইল ও দৈনন্দিন জীবনের বাছাই করা প্রিমিয়াম পণ্য—এক জায়গায়।",explore:"শপিং শুরু করুন",discover:"কালেকশন দেখুন",authentic:"অরিজিনাল পণ্য",support:"কাস্টমার সাপোর্ট",local:"লোকাল পেমেন্ট",trust1:"বাছাই করা পণ্য",trust2:"নিরাপদ চেকআউট",trust3:"দ্রুত ডেলিভারি",trust4:"সহজ রিটার্ন",categories:"আপনার পছন্দের ক্যাটাগরি",view_all:"সব দেখুন",cat_tech:"টেক ও গ্যাজেট",cat_style:"স্টাইল ও লাইফস্টাইল",cat_home:"হোম এসেনশিয়ালস",featured:"নির্বাচিত পণ্য",featured_desc:"আপনার দৈনন্দিন জীবনের জন্য বিশেষভাবে বাছাই করা।",load_more:"আরও পণ্য দেখুন",promo_title:"ভালো পছন্দ।<br><em>আরও ভালো অভিজ্ঞতা।</em>",promo_desc:"NEXUS ULTRA-তে প্রতিটি পণ্য বাছাই করা হয় মান, ব্যবহারিকতা ও ডিজাইনের কথা ভেবে।",shop_now:"এখনই শপ করুন",newsletter_title:"নতুন কিছু মিস করবেন না।",newsletter_desc:"নতুন কালেকশন ও অফারের খবর পেতে যুক্ত থাকুন।",footer_desc:"প্রতিদিনের পছন্দকে আরও বিশেষ করে তুলুন।"}
};
function money(n){return new Intl.NumberFormat(lang==="bn"?"bn-BD":"en-BD",{style:"currency",currency:"BDT",maximumFractionDigits:0}).format(n)}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function persist(){localStorage.setItem("nu_cart",JSON.stringify(cart));renderCart()}
function renderCart(){
 $("#cartCount").textContent=cart.reduce((s,x)=>s+x.qty,0);
 $("#cartTotal").textContent=money(cart.reduce((s,x)=>s+x.price*x.qty,0));
 $("#cartItems").innerHTML=cart.length?cart.map(x=>`<div class="cart-line"><div><b>${x.name}</b><div class="muted">${money(x.price)} × ${x.qty}</div></div><div><b>${money(x.price*x.qty)}</b><br><button data-remove="${x.id}">Remove</button></div></div>`).join(""):'<p class="muted">Your bag is empty.</p>';
 $$("[data-remove]").forEach(b=>b.addEventListener("click",()=>{cart=cart.filter(x=>x.id!==b.dataset.remove);persist()}));
}
function add(id){const p=catalog.find(x=>x.id===id);if(!p)return;const found=cart.find(x=>x.id===id);found?found.qty++:cart.push({...p,qty:1});persist();toast(lang==="bn"?"ব্যাগে যোগ হয়েছে":"Added to bag")}
function applyLang(){document.documentElement.lang=lang;$$("[data-i18n]").forEach(el=>{const k=el.dataset.i18n;if(translations[lang][k])el.innerHTML=translations[lang][k]});$("#langToggle").textContent=lang==="bn"?"EN":"বাংলা";$("#searchInput").placeholder=lang==="bn"?"পণ্য খুঁজুন...":"Search products...";renderCart()}
function applyTheme(){document.documentElement.dataset.theme=theme;document.body.classList.toggle("light",theme==="light");localStorage.setItem("nu_theme",theme);$("#themeToggle").textContent=theme==="dark"?"☼":"◐"}
function filterProducts(){
 const q=$("#searchInput").value.toLowerCase(), sort=$("#sortSelect").value;
 let list=catalog.filter(p=>p.name.toLowerCase().includes(q));
 if(sort==="low")list.sort((a,b)=>a.price-b.price);if(sort==="high")list.sort((a,b)=>b.price-a.price);
 const cards=$$("#productGrid .product-card");
 cards.forEach(card=>{const title=$("h3",card).textContent.toLowerCase();card.hidden=!title.includes(q)});
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(b)add(b.dataset.add)});
$("#themeToggle").addEventListener("click",()=>{theme=theme==="dark"?"light":"dark";applyTheme()});
$("#langToggle").addEventListener("click",()=>{lang=lang==="bn"?"en":"bn";localStorage.setItem("nu_lang",lang);applyLang()});
$("#cartOpen").addEventListener("click",()=>document.body.classList.add("cart-open"));
$("#cartClose").addEventListener("click",()=>document.body.classList.remove("cart-open"));
$("#drawerBackdrop").addEventListener("click",()=>document.body.classList.remove("cart-open"));
$("#searchInput").addEventListener("input",filterProducts);$("#sortSelect").addEventListener("change",filterProducts);
$("#loadMore").addEventListener("click",()=>toast(lang==="bn"?"আরও পণ্য শিগগিরই আসছে":"More products coming soon"));
$("#checkoutBtn").addEventListener("click",()=>toast("Checkout module will be enabled after backend setup."));
$("#accountBtn").addEventListener("click",()=>toast("Customer account module is part of the next development phase."));
$("#newsletterForm").addEventListener("submit",e=>{e.preventDefault();toast("ধন্যবাদ! আপনি তালিকায় যুক্ত হয়েছেন।");e.target.reset()});
$("#menuToggle").addEventListener("click",()=>toast("Mobile navigation: use the sections below."));
$$("[data-category]").forEach(a=>a.addEventListener("click",()=>{const c=a.dataset.category;$("#searchInput").value="";filterProducts();$("#shop").scrollIntoView()}));
$("#year").textContent=new Date().getFullYear();applyTheme();applyLang();renderCart();
