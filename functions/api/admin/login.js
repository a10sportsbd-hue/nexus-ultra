
import {json,readBody,verifyPassword,createSession,setCookie,validOrigin} from "../../_lib/admin.js";
export async function onRequestPost({request,env}) {
  if(!env.DB) return json({success:false,error:"Database unavailable"},503);
  if(!validOrigin(request)) return json({success:false,error:"Invalid origin"},403);
  const body=await readBody(request);
  const email=String(body?.email||"").trim().toLowerCase();
  const password=String(body?.password||"");
  const user=await env.DB.prepare("SELECT id,full_name,email,password_hash FROM users WHERE email=? AND role='admin' AND is_active=1 LIMIT 1").bind(email).first();
  if(!user || !(await verifyPassword(password,user.password_hash))) return json({success:false,error:"Email or password is incorrect"},401);
  const token=await createSession(env,user.id);
  return json({success:true,user:{name:user.full_name,email:user.email}},200,{"Set-Cookie":setCookie(token,28800)});
}
