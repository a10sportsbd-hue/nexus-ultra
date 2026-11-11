
import {json,readBody,requireAdmin,validOrigin} from "../../../_lib/admin.js";
export async function onRequestPut({request,env,params}) {
 const a=await requireAdmin(request,env); if(a.error)return a.error;
 if(!validOrigin(request))return json({success:false,error:"Invalid origin"},403);
 const b=await readBody(request), id=params.id;
 const name=String(b?.name||"").trim(),sku=String(b?.sku||"").trim().toUpperCase(),price=Number(b?.price),stock=Number(b?.stock_quantity||0);
 if(!name||!sku||!Number.isInteger(price)||price<0||!Number.isInteger(stock)||stock<0)return json({success:false,error:"Invalid product fields"},400);
 try {
  await env.DB.prepare(`UPDATE products SET category_id=?,name=?,slug=?,description=?,sku=?,price=?,sale_price=?,stock_quantity=?,status=?,image_url=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
   .bind(b.category_id||null,name,String(b.slug||name.toLowerCase().replace(/[^a-z0-9]+/g,"-")),String(b.description||""),sku,price,b.sale_price===""||b.sale_price==null?null:Number(b.sale_price),stock,b.status==="draft"?"draft":"active",String(b.image_url||"").slice(0,500)||null,id).run();
  return json({success:true});
 } catch { return json({success:false,error:"Could not update product. Check unique SKU/slug."},400); }
}
export async function onRequestDelete({request,env,params}) {
 const a=await requireAdmin(request,env); if(a.error)return a.error;
 if(!validOrigin(request))return json({success:false,error:"Invalid origin"},403);
 await env.DB.prepare("DELETE FROM products WHERE id=?").bind(params.id).run();
 return json({success:true});
}
