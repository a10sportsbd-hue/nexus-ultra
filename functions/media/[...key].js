
export async function onRequestGet({env,params}) {
 if(!env.PRODUCT_MEDIA)return new Response("Media storage unavailable",{status:503});
 const key=String(params.key||"").replace(/^\/+/,"");
 if(!key.startsWith("products/") || key.includes(".."))return new Response("Not found",{status:404});
 const object=await env.PRODUCT_MEDIA.get(key);
 if(!object)return new Response("Not found",{status:404});
 const headers=new Headers();
 object.writeHttpMetadata(headers);
 headers.set("ETag",object.httpEtag);
 headers.set("X-Content-Type-Options","nosniff");
 headers.set("Cache-Control","public, max-age=31536000, immutable");
 return new Response(object.body,{headers});
}
