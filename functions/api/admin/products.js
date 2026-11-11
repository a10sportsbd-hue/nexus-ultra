
import {json,id,readBody,requireAdmin,validOrigin} from "../../_lib/admin.js";
export async function onRequestGet({request,env}) {
 const a=await requireAdmin(request,env); if(a.error)return a.error;
 const {results}=await env.DB.prepare(`SELECT p.*,c.name AS category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id ORDER BY p.created_at DESC LIMIT 200`).all();
 return json({success:true,data:results});
}
export async function onRequestPost({request,env}) {
 const a=await requireAdmin(request,env); if(a.error)return a.error;
 if(!validOrigin(request))return json({success:false,error:"Invalid origin"},403);
 const b=await readBody(request), name=String(b?.name||"").trim(), sku=String(b?.sku||"").trim().toUpperCase();
 const price=Number(b?.price), stock=Number(b?.stock_quantity||0), category=String(b?.category_id||"").trim();
 if(!name||!sku||!Number.isInteger(price)||price<0||!Number.isInteger(stock)||stock<0)return json({success:false,error:"Name, SKU, valid price and stock are required"},400);
 const slug=String(b?.slug||name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")).slice(0,180);
 try {
  await env.DB.prepare(`INSERT INTO products(id,category_id,name,slug,description,sku,price,sale_price,stock_quantity,status,image_url)
   VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(id(),category||null,name,slug,String(b.description||""),sku,price,b.sale_price===""||b.sale_price==null?null:Number(b.sale_price),stock,b.status==="draft"?"draft":"active",String(b.image_url||"").slice(0,500)||null).run();
  return json({success:true},201);
 } catch { return json({success:false,error:"Could not save product. Check SKU/slug uniqueness and category."},400); }
}
