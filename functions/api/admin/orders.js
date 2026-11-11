
import {json,requireAdmin} from "../../_lib/admin.js";
export async function onRequestGet({request,env}) {
 const a=await requireAdmin(request,env);if(a.error)return a.error;
 const {results}=await env.DB.prepare("SELECT id,order_number,customer_name,phone,delivery_address,total,payment_method,payment_status,order_status,created_at FROM orders ORDER BY created_at DESC LIMIT 200").all();
 return json({success:true,data:results});
}
