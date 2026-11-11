"use strict";
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

let catalog = [];
let cart = [];
let lang = localStorage.getItem("nu_lang") || "bn";
let theme = localStorage.getItem("nu_theme") || "dark";
let activeCategory = "";
let searchTimer = null;
let requestNumber = 0;

const fallbackCatalog = [
  {id:"p1",name:"Nova Wireless Headphones",description:"Premium wireless audio experience.",price:3490,sale_price:null,stock_quantity:25,category_id:"cat-tech"},
  {id:"p2",name:"Pulse Smart Watch X",description:"Smart wearable for everyday life.",price:4890,sale_price:null,stock_quantity:18,category_id:"cat-tech"},
  {id:"p3",name:"Urban Carry Backpack",description:"Minimal everyday carry backpack.",price:2250,sale_price:null,stock_quantity:32,category_id:"cat-style"},
  {id:"p4",name:"Halo Ambient Desk Lamp",description:"Ambient lighting for your workspace.",price:1890,sale_price:null,stock_quantity:14,category_id:"cat-home"}
];

const categoryMap = {"cat-tech":"tech","cat-style":"style","cat-home":"home"};
const translations = {
 en:{announcement:"— Welcome to a new experience",nav_home:"Home",nav_shop:"Shop",nav_collections:"Collections",nav_about:"About us",eyebrow:"THE NEXT GENERATION SHOPPING EXPERIENCE",hero_title:"Beyond ordinary.<br><em>Your new</em><br>destination.",hero_desc:"Curated premium products for technology, style and everyday living — all in one place.",explore:"Start shopping",discover:"Explore collections",authentic:"Authentic products",support:"Customer support",local:"Local payments",trust1:"Curated products",trust2:"Secure checkout",trust3:"Fast delivery",trust4:"Easy returns",categories:"Explore your categories",view_all:"View all",cat_tech:"Tech & Gadgets",cat_style:"Style & Lifestyle",cat_home:"Home Essentials",featured:"Featured products",featured_desc:"Thoughtfully selected for your everyday life.",load_more:"Explore more products",promo_title:"Better choices.<br><em>Better experiences.</em>",promo_desc:"Every NEXUS ULTRA product is selected with quality, utility and design in mind.",shop_now:"Shop now",newsletter_title:"Don't miss what's next.",newsletter_desc:"Get updates on new collections and offers.",footer_desc:"Make everyday choices extraordinary."},
 bn:{announcement:"— নতুন অভিজ্ঞতায় স্বাগতম",nav_home:"হোম",nav_shop:"শপ",nav_collections:"কালেকশন",nav_about:"আমাদের সম্পর্কে",eyebrow:"নতুন প্রজন্মের শপিং অভিজ্ঞতা",hero_title:"সাধারণের বাইরে।<br><em>আপনার পছন্দের</em><br>নতুন ঠিকানা।",hero_desc:"প্রযুক্তি, স্টাইল ও দৈনন্দিন জীবনের বাছাই করা প্রিমিয়াম পণ্য—এক জায়গায়।",explore:"শপিং শুরু করুন",discover:"কালেকশন দেখুন",authentic:"অরিজিনাল পণ্য",support:"কাস্টমার সাপোর্ট",local:"লোকাল পেমেন্ট",trust1:"বাছাই করা পণ্য",trust2:"নিরাপদ চেকআউট",trust3:"দ্রুত ডেলিভারি",trust4:"সহজ রিটার্ন",categories:"আপনার পছন্দের ক্যাটাগরি",view_all:"সব দেখুন",cat_tech:"টেক ও গ্যাজেট",cat_style:"স্টাইল ও লাইফস্টাইল",cat_home:"হোম এসেনশিয়ালস",featured:"নির্বাচিত পণ্য",featured_desc:"আপনার দৈনন্দিন জীবনের জন্য বিশেষভাবে বাছাই করা।",load_more:"আরও পণ্য দেখুন",promo_title:"ভালো পছন্দ।<br><em>আরও ভালো অভিজ্ঞতা।</em>",promo_desc:"NEXUS ULTRA-তে প্রতিটি পণ্য বাছাই করা হয় মান, ব্যবহারিকতা ও ডিজাইনের কথা ভেবে।",shop_now:"এখনই শপ করুন",newsletter_title:"নতুন কিছু মিস করবেন না।",newsletter_desc:"নতুন কালেকশন ও অফারের খবর পেতে যুক্ত থাকুন।",footer_desc:"প্রতিদিনের পছন্দকে আরও বিশেষ করে তুলুন।"}
};

function money(n) {
  return new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-BD", {style:"currency",currency:"BDT",maximumFractionDigits:0}).format(Number(n) || 0);
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function toast(message) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  window.setTimeout(() => el.classList.remove("show"), 2200);
}
function persistCart() {
  localStorage.setItem("nu_cart", JSON.stringify(cart));
  renderCart();
}
function renderCart() {
  const count = $("#cartCount"), total = $("#cartTotal"), items = $("#cartItems");
  if (!count || !total || !items) return;
  count.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
  total.textContent = money(cart.reduce((sum, item) => sum + item.price * item.qty, 0));
  items.innerHTML = cart.length ? cart.map(item => `
    <div class="cart-line">
      <div><b>${escapeHTML(item.name)}</b><div class="muted">${money(item.price)} × ${item.qty}</div><div class="qty-controls"><button data-qty="-1" data-id="${escapeHTML(item.id)}" type="button">−</button><span>${item.qty}</span><button data-qty="1" data-id="${escapeHTML(item.id)}" type="button">+</button></div></div>
      <div><b>${money(item.price * item.qty)}</b><br><button data-remove="${escapeHTML(item.id)}" type="button">Remove</button></div>
    </div>`).join("") : '<p class="muted">Your bag is empty.</p>';
}
function add(id) {
  const product = catalog.find(item => String(item.id) === String(id));
  if (!product) return;
  const price = Number(product.sale_price) > 0 ? Number(product.sale_price) : Number(product.price);
  const existing = cart.find(item => String(item.id) === String(id));
  if (existing) existing.qty += 1;
  else cart.push({id:product.id,name:product.name,price,qty:1});
  persistCart();
  toast(lang === "bn" ? "ব্যাগে যোগ হয়েছে" : "Added to bag");
}
function applyLang() {
  document.documentElement.lang = lang;
  $$("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (translations[lang]?.[key]) el.innerHTML = translations[lang][key];
  });
  const toggle = $("#langToggle");
  if (toggle) toggle.textContent = lang === "bn" ? "EN" : "বাংলা";
  const search = $("#searchInput");
  if (search) search.placeholder = lang === "bn" ? "পণ্য খুঁজুন..." : "Search products...";
  renderCart();
}
function applyTheme() {
  document.documentElement.dataset.theme = theme;
  document.body.classList.toggle("light", theme === "light");
  localStorage.setItem("nu_theme", theme);
  const toggle = $("#themeToggle");
  if (toggle) toggle.textContent = theme === "dark" ? "☼" : "◐";
}
function visualFor(product) {
  const name = String(product.name || "").toLowerCase();
  if (name.includes("watch")) return "watch";
  if (name.includes("bag") || name.includes("backpack")) return "bag";
  if (name.includes("lamp")) return "lamp";
  return "head";
}
function renderProducts(products) {
  const grid = $("#productGrid");
  if (!grid) return;
  if (!products.length) {
    grid.innerHTML = `<p class="muted">${lang === "bn" ? "কোনো পণ্য পাওয়া যায়নি।" : "No products found."}</p>`;
    return;
  }
  grid.innerHTML = products.map(product => {
    const id = escapeHTML(product.id);
    const name = escapeHTML(product.name);
    const description = escapeHTML(product.description || "");
    const price = Number(product.sale_price) > 0 ? Number(product.sale_price) : Number(product.price);
    const stock = Number(product.stock_quantity) || 0;
    const category = categoryMap[product.category_id] || "tech";
    const visual = visualFor(product);
    const tag = stock <= 0 ? (lang === "bn" ? "স্টক শেষ" : "SOLD OUT") : stock <= 5 ? (lang === "bn" ? "সীমিত স্টক" : "LIMITED") : (lang === "bn" ? "নির্বাচিত" : "FEATURED");
    return `<article class="product-card">
      <div class="product-visual visual-${visual}">
        <span class="product-tag">${tag}</span>${product.image_url ? `<img class="catalog-image" src="${escapeHTML(product.image_url)}" alt="${name}" loading="lazy">` : `<div class="mock-${visual === "head" ? "headphone" : visual}"></div>`}
      </div>
      <div class="product-info">
        <small>${escapeHTML(category.toUpperCase())}</small>
        <h3>${name}</h3><p class="muted">${description}</p>
        <div class="product-bottom"><b>${money(price)}</b>
          <button class="add-btn" type="button" data-add="${id}" ${stock <= 0 ? "disabled" : ""} aria-label="Add ${name} to cart">+</button>
        </div>
      </div>
    </article>`;
  }).join("");
}
async function fetchProducts() {
  const grid = $("#productGrid");
  if (!grid) return;
  const current = ++requestNumber;
  const params = new URLSearchParams();
  const query = ($("#searchInput")?.value || "").trim();
  if (query) params.set("q", query);
  if (activeCategory) params.set("category", activeCategory);
  params.set("limit", "100");
  const sort = $("#sortSelect")?.value || "featured";
  try {
    const response = await fetch(`/api/products?${params.toString()}`, {headers:{Accept:"application/json"},cache:"no-store"});
    if (!response.ok) throw new Error(`API HTTP ${response.status}`);
    const result = await response.json();
    if (!result.success || !Array.isArray(result.data)) throw new Error(result.error || "Invalid API response");
    if (current !== requestNumber) return;
    catalog = result.data;
    if (sort === "low") catalog.sort((a,b) => (Number(a.sale_price) || Number(a.price)) - (Number(b.sale_price) || Number(b.price)));
    if (sort === "high") catalog.sort((a,b) => (Number(b.sale_price) || Number(b.price)) - (Number(a.sale_price) || Number(a.price)));
    renderProducts(catalog);
  } catch (error) {
    console.error("Product API error:", error);
    if (current !== requestNumber) return;
    // A local preview remains usable if D1 has not been configured.
    catalog = fallbackCatalog.filter(p => (!activeCategory || categoryMap[p.category_id] === activeCategory) &&
      (!query || `${p.name} ${p.description}`.toLowerCase().includes(query.toLowerCase())));
    if (sort === "low") catalog.sort((a,b) => a.price-b.price);
    if (sort === "high") catalog.sort((a,b) => b.price-a.price);
    renderProducts(catalog);
    toast(lang === "bn" ? "লাইভ ডেটাবেস পাওয়া যায়নি; প্রিভিউ পণ্য দেখানো হচ্ছে" : "Live database unavailable; showing preview products");
  }
}
function filterProducts() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(fetchProducts, 250);
}

document.addEventListener("click", event => {
  const qtyButton=event.target.closest("[data-qty]");
  if(qtyButton){const item=cart.find(x=>String(x.id)===String(qtyButton.dataset.id));if(item){item.qty=Math.max(1,Math.min(20,item.qty+Number(qtyButton.dataset.qty)));persistCart();}return;}
  const addButton = event.target.closest("[data-add]");
  if (addButton) { add(addButton.dataset.add); return; }
  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) {
    cart = cart.filter(item => String(item.id) !== String(removeButton.dataset.remove));
    persistCart();
  }
});
$("#themeToggle")?.addEventListener("click", () => { theme = theme === "dark" ? "light" : "dark"; applyTheme(); });
$("#langToggle")?.addEventListener("click", () => { lang = lang === "bn" ? "en" : "bn"; localStorage.setItem("nu_lang", lang); applyLang(); renderProducts(catalog); });
$("#cartOpen")?.addEventListener("click", () => document.body.classList.add("cart-open"));
$("#cartClose")?.addEventListener("click", () => document.body.classList.remove("cart-open"));
$("#drawerBackdrop")?.addEventListener("click", () => document.body.classList.remove("cart-open"));
$("#searchInput")?.addEventListener("input", filterProducts);
$("#sortSelect")?.addEventListener("change", fetchProducts);
$("#loadMore")?.addEventListener("click", () => toast(lang === "bn" ? "আরও পণ্য শিগগিরই যোগ হবে" : "More products will be added soon"));
$("#checkoutBtn")?.addEventListener("click", () => { if(!cart.length){toast(lang==="bn"?"আপনার কার্ট খালি":"Your cart is empty");return;} $("#checkoutModal").hidden=false; document.body.classList.remove("cart-open"); $("#checkoutSummary").textContent=money(cart.reduce((s,x)=>s+x.price*x.qty,0)); });
$("#checkoutCancel")?.addEventListener("click",()=>$("#checkoutModal").hidden=true);
$("#checkoutForm")?.addEventListener("submit",async event=>{
 event.preventDefault();const button=$("#placeOrderBtn");button.disabled=true;button.textContent=lang==="bn"?"অর্ডার হচ্ছে...":"Placing order...";
 const f=new FormData(event.target);
 try{
  const response=await fetch("/api/checkout",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({customer_name:f.get("customer_name"),phone:f.get("phone"),delivery_address:f.get("delivery_address"),items:cart.map(x=>({id:x.id,quantity:x.qty}))})});
  const result=await response.json();if(!response.ok||!result.success)throw new Error(result.error||"Order failed");
  const d=result.data;cart=[];persistCart();$("#checkoutModal").hidden=true;event.target.reset();
  toast((lang==="bn"?"অর্ডার সফল! অর্ডার নম্বর: ":"Order placed! Order: ")+d.order_number);
  alert((lang==="bn"?"অর্ডার সফল হয়েছে।\nঅর্ডার নম্বর: ":"Order placed.\nOrder number: ")+d.order_number+"\n"+(lang==="bn"?"মোট: ":"Total: ")+money(d.total)+"\n"+(lang==="bn"?"পেমেন্ট: ক্যাশ অন ডেলিভারি":"Payment: Cash on Delivery"));
 }catch(error){toast(error.message);}finally{button.disabled=false;button.textContent=lang==="bn"?"অর্ডার নিশ্চিত করুন":"Place COD order";}
});
$("#accountBtn")?.addEventListener("click", () => toast(lang === "bn" ? "কাস্টমার অ্যাকাউন্ট পরবর্তী ডেভেলপমেন্ট ধাপ" : "Customer accounts are not enabled yet."));
$("#newsletterForm")?.addEventListener("submit", event => {
  event.preventDefault();
  toast(lang === "bn" ? "ধন্যবাদ! ফর্মটি ডেমো মোডে কাজ করেছে।" : "Thank you! Newsletter is currently in preview mode.");
  event.target.reset();
});
$("#menuToggle")?.addEventListener("click", () => {
  const nav = $(".desktop-nav");
  if (!nav) return;
  nav.style.display = nav.style.display === "flex" ? "" : "flex";
  nav.style.flexDirection = "column";
  nav.style.position = "absolute";
  nav.style.top = "68px";
  nav.style.right = "12px";
  nav.style.padding = "18px";
  nav.style.background = "var(--surface)";
  nav.style.border = "1px solid var(--line)";
  nav.style.borderRadius = "12px";
});
$$("[data-category]").forEach(link => link.addEventListener("click", () => {
  activeCategory = link.dataset.category || "";
  if ($("#searchInput")) $("#searchInput").value = "";
  fetchProducts();
  $("#shop")?.scrollIntoView({behavior:"smooth"});
}));
$("#year") && ($("#year").textContent = new Date().getFullYear());
try { cart = JSON.parse(localStorage.getItem("nu_cart") || "[]"); if (!Array.isArray(cart)) cart = []; } catch { cart = []; }
applyTheme();
applyLang();
renderCart();
fetchProducts();
