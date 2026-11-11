
import {json,id,passwordHash,readBody,validOrigin} from "../../_lib/admin.js";
export async function onRequestPost({request,env}) {
  if(!env.DB) return json({success:false,error:"Database unavailable"},503);
  if(!validOrigin(request)) return json({success:false,error:"Invalid origin"},403);
  const setupKey=request.headers.get("X-Admin-Setup-Key")||"";
  if(!env.ADMIN_SETUP_KEY || setupKey!==env.ADMIN_SETUP_KEY) return json({success:false,error:"Invalid setup key"},403);
  const existing=await env.DB.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").first();
  if(existing) return json({success:false,error:"An admin already exists. Setup is locked."},409);
  const body=await readBody(request);
  const name=String(body?.name||"").trim().slice(0,100);
  const email=String(body?.email||"").trim().toLowerCase().slice(0,190);
  const password=String(body?.password||"");
  if(!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length<12)
    return json({success:false,error:"Provide name, valid email and password (at least 12 characters)."},400);
  const {encoded}=await passwordHash(password);
  try {
    await env.DB.prepare("INSERT INTO users(id,full_name,email,password_hash,role,is_active) VALUES(?,?,?,?, 'admin',1)")
      .bind(id(),name,email,encoded).run();
    return json({success:true,message:"Admin account created. Remove ADMIN_SETUP_KEY after setup."},201);
  } catch { return json({success:false,error:"Could not create admin. Email may already exist."},400); }
}
