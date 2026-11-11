
import {json,requireAdmin} from "../../_lib/admin.js";
export async function onRequestGet({request,env}) {
  const auth=await requireAdmin(request,env); if(auth.error) return auth.error;
  return json({success:true,user:{name:auth.user.full_name,email:auth.user.email}});
}
