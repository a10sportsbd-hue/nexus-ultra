
import {json,cookieValue,clearCookie} from "../../_lib/admin.js";
export async function onRequestPost({request,env}) {
  const token=cookieValue(request,"nu_admin");
  if(token && env.DB) {
    const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token));
    const hash=[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,"0")).join("");
    await env.DB.prepare("DELETE FROM admin_sessions WHERE token_hash=?").bind(hash).run();
  }
  return json({success:true},200,{"Set-Cookie":clearCookie});
}
