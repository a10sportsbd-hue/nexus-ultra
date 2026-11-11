
import {json,requireAdmin,readBody,validOrigin} from "../../_lib/admin.js";
export async function onRequestGet({request,env}) {
 const a=await requireAdmin(request,env);if(a.error)return a.error;
 const {results}=await env.DB.prepare("SELECT key,value FROM settings ORDER BY key").all();
 return json({success:true,data:results});
}
export async function onRequestPut({request,env}) {
 const a=await requireAdmin(request,env);if(a.error)return a.error;
 if(!validOrigin(request))return json({success:false,error:"Invalid origin"},403);
 const b=await readBody(request), entries=Object.entries(b||{}).slice(0,30);
 for(const [key,value] of entries) {
  if(!/^[a-z0-9_]{2,60}$/.test(key))continue;
  await env.DB.prepare("INSERT INTO settings(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP").bind(key,String(value).slice(0,500)).run();
 }
 return json({success:true});
}
