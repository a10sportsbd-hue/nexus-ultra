export async function onRequestGet({env,params}) {
 if(!env.DB)return new Response("Media storage unavailable",{status:503});
 const raw=String(params.key||"");
 const match=raw.match(/^([0-9a-f-]{36})\.(jpg|png|webp)$/i);
 if(!match)return new Response("Not found",{status:404});
 const row=await env.DB.prepare("SELECT content_type,data_base64 FROM media_objects WHERE id=?")
   .bind(match[1]).first();
 if(!row)return new Response("Not found",{status:404});
 let binary;
 try { binary=atob(row.data_base64); } catch { return new Response("Invalid media",{status:500}); }
 const bytes=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 return new Response(bytes,{headers:{
   "Content-Type":row.content_type,
   "X-Content-Type-Options":"nosniff",
   "Cache-Control":"public, max-age=86400"
 }});
}
