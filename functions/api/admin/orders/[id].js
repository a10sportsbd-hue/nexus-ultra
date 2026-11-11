
import {json,readBody,requireAdmin,validOrigin} from "../../../_lib/admin.js";
export async function onRequestPatch({request,env,params}) {
 const a=await requireAdmin(request,env);if(a.error)return a.error;
 if(!validOrigin(request))return json({success:false,error:"Invalid origin"},403);
 const b=await readBody(request),allowed=["pending","processing","shipped","delivered","cancelled"];
 if(!allowed.includes(b?.order_status))return json({success:false,error:"Invalid order status"},400);
 await env.DB.prepare("UPDATE orders SET order_status=? WHERE id=?").bind(b.order_status,params.id).run();
 return json({success:true});
}
