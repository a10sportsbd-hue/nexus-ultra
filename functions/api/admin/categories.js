
import {json,id,readBody,requireAdmin,validOrigin} from "../../_lib/admin.js";
export async function onRequestGet({request,env}) {
 const a=await requireAdmin(request,env);if(a.error)return a.error;
 const {results}=await env.DB.prepare("SELECT * FROM categories ORDER BY sort_order,name").all();
 return json({success:true,data:results});
}
export async function onRequestPost({request,env}) {
 const a=await requireAdmin(request,env);if(a.error)return a.error;
 if(!validOrigin(request))return json({success:false,error:"Invalid origin"},403);
 const b=await readBody(request),name=String(b?.name||"").trim(),slug=String(b?.slug||name.toLowerCase().replace(/[^a-z0-9]+/g,"-"));
 if(!name||!slug)return json({success:false,error:"Category name required"},400);
 try {await env.DB.prepare("INSERT INTO categories(id,name,slug,description,sort_order,is_active) VALUES(?,?,?,?,?,1)").bind(id(),name,slug,String(b.description||""),Number(b.sort_order)||0).run();return json({success:true},201);}
 catch{return json({success:false,error:"Category slug already exists"},400);}
}
