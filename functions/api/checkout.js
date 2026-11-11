
import {json,id,readBody} from "../_lib/admin.js";
const clean = (v,n=200)=>String(v??"").trim().slice(0,n);
export async function onRequestPost({request,env}) {
  if(!env.DB) return json({success:false,error:"Database unavailable"},503);
  let body=await readBody(request);
  if(!body || !Array.isArray(body.items) || body.items.length<1 || body.items.length>30)
    return json({success:false,error:"Cart is empty or invalid."},400);
  const name=clean(body.customer_name,100), phone=clean(body.phone,20).replace(/[\s-]/g,""), address=clean(body.delivery_address,500);
  if(name.length<2 || !/^01[3-9]\d{8}$/.test(phone) || address.length<8)
    return json({success:false,error:"সঠিক নাম, ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর এবং পূর্ণ ঠিকানা দিন।"},400);
  const quantities=new Map();
  for(const item of body.items){
    const pid=clean(item.id,80), qty=Number(item.quantity);
    if(!pid || !Number.isInteger(qty) || qty<1 || qty>20) return json({success:false,error:"Invalid cart item."},400);
    quantities.set(pid,(quantities.get(pid)||0)+qty);
  }
  if(quantities.size>20) return json({success:false,error:"Too many different products."},400);
  const ids=[...quantities.keys()], placeholders=ids.map(()=>"?").join(",");
  const {results:products}=await env.DB.prepare(
    `SELECT id,name,price,sale_price,stock_quantity,status FROM products WHERE id IN (${placeholders})`
  ).bind(...ids).all();
  if(products.length!==ids.length) return json({success:false,error:"এক বা একাধিক পণ্য আর পাওয়া যাচ্ছে না।"},409);
  let subtotal=0;
  for(const p of products){
    const qty=quantities.get(p.id);
    if(p.status!=="active" || p.stock_quantity<qty)
      return json({success:false,error:`${p.name}: পর্যাপ্ত স্টক নেই।`},409);
    const price=Number(p.sale_price)>0?Number(p.sale_price):Number(p.price);
    subtotal+=price*qty;
  }
  const settings=await env.DB.prepare("SELECT key,value FROM settings WHERE key IN ('delivery_fee','free_delivery_threshold')").all();
  const cfg=Object.fromEntries(settings.results.map(x=>[x.key,x.value]));
  const deliveryFee=subtotal>=Number(cfg.free_delivery_threshold||3000)?0:Number(cfg.delivery_fee||80);
  const total=subtotal+deliveryFee, orderId=id();
  const orderNumber="NU"+Date.now().toString().slice(-9)+Math.floor(100+Math.random()*900);
  const statements=[env.DB.prepare(`INSERT INTO orders(id,order_number,customer_name,phone,delivery_address,subtotal,delivery_fee,discount,total,payment_method,payment_status,order_status)
    VALUES(?,?,?,?,?,?,?,?,?,'cod','unpaid','pending')`).bind(orderId,orderNumber,name,phone,address,subtotal,deliveryFee,0,total)];
  for(const p of products){
    const qty=quantities.get(p.id), price=Number(p.sale_price)>0?Number(p.sale_price):Number(p.price);
    statements.push(env.DB.prepare(`INSERT INTO order_items(id,order_id,product_id,product_name,unit_price,quantity,line_total)
      VALUES(?,?,?,?,?,?,?)`).bind(id(),orderId,p.id,p.name,price,qty,price*qty));
  }
  try {
    await env.DB.batch(statements);
    return json({success:true,data:{order_number:orderNumber,subtotal,delivery_fee:deliveryFee,total,payment_method:"cod",payment_status:"unpaid"}},201);
  } catch(error) {
    const message=String(error?.message||"");
    if(message.includes("INSUFFICIENT_STOCK")) return json({success:false,error:"স্টক পরিবর্তিত হয়েছে। কার্ট আপডেট করে আবার চেষ্টা করুন।"},409);
    if(message.includes("PRODUCT_NOT_AVAILABLE")||message.includes("PRODUCT_NOT_FOUND")) return json({success:false,error:"একটি পণ্য এখন অর্ডার করা যাচ্ছে না।"},409);
    return json({success:false,error:"অর্ডার সম্পন্ন হয়নি। আবার চেষ্টা করুন।"},500);
  }
}
