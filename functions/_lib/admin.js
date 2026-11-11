
const encoder = new TextEncoder();
export const json = (data, status=200, headers={}) => Response.json(data,{status,headers:{"Cache-Control":"no-store",...headers}});
export const id = () => crypto.randomUUID();
export function cookieValue(request,name) {
  const raw=request.headers.get("Cookie")||"";
  const part=raw.split(";").map(x=>x.trim()).find(x=>x.startsWith(name+"="));
  return part ? decodeURIComponent(part.slice(name.length+1)) : "";
}
export function setCookie(value,maxAge) {
  return `nu_admin=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
export const clearCookie = "nu_admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0";
async function digest(value) {
  const bytes=await crypto.subtle.digest("SHA-256",encoder.encode(value));
  return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,"0")).join("");
}
export async function passwordHash(password,saltHex) {
  const salt=saltHex ? Uint8Array.from(saltHex.match(/.{2}/g),x=>parseInt(x,16)) : crypto.getRandomValues(new Uint8Array(16));
  const key=await crypto.subtle.importKey("raw",encoder.encode(password),"PBKDF2",false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:210000,hash:"SHA-256"},key,256);
  const hash=[...new Uint8Array(bits)].map(b=>b.toString(16).padStart(2,"0")).join("");
  return {encoded:`pbkdf2$210000$${[...salt].map(b=>b.toString(16).padStart(2,"0")).join("")}$${hash}`};
}
export async function verifyPassword(password,encoded) {
  const parts=String(encoded||"").split("$");
  if(parts.length!==4 || parts[0]!=="pbkdf2") return false;
  const result=await passwordHash(password,parts[2]);
  return result.encoded===encoded;
}
export async function createSession(env,userId) {
  const token=[...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,"0")).join("");
  const tokenHash=await digest(token);
  const expires=new Date(Date.now()+8*60*60*1000).toISOString();
  await env.DB.prepare("INSERT INTO admin_sessions(id,user_id,token_hash,expires_at) VALUES(?,?,?,?)").bind(id(),userId,tokenHash,expires).run();
  return token;
}
export async function requireAdmin(request,env) {
  if(!env.DB) return {error:json({success:false,error:"Database unavailable"},503)};
  const token=cookieValue(request,"nu_admin");
  if(!token) return {error:json({success:false,error:"Authentication required"},401)};
  const tokenHash=await digest(token);
  const row=await env.DB.prepare(`SELECT u.id,u.full_name,u.email,u.role,s.id AS session_id
    FROM admin_sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.expires_at>? AND u.role='admin' AND u.is_active=1 LIMIT 1`)
    .bind(tokenHash,new Date().toISOString()).first();
  if(!row) return {error:json({success:false,error:"Session expired"},401,{ "Set-Cookie":clearCookie })};
  return {user:row};
}
export async function readBody(request) {
  try { return await request.json(); } catch { return null; }
}
export function validOrigin(request) {
  const origin=request.headers.get("Origin");
  if(!origin) return true;
  try { return new URL(origin).host===new URL(request.url).host; } catch { return false; }
}
