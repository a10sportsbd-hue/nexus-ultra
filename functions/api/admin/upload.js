import {json,requireAdmin,validOrigin,id} from "../../_lib/admin.js";
const TYPES={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
function toBase64(bytes){
 let binary="";
 const chunk=0x8000;
 for(let i=0;i<bytes.length;i+=chunk) binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));
 return btoa(binary);
}
export async function onRequestPost({request,env}) {
 const auth=await requireAdmin(request,env); if(auth.error)return auth.error;
 if(!validOrigin(request))return json({success:false,error:"Invalid origin"},403);
 if(!env.DB)return json({success:false,error:"Database unavailable"},503);
 const form=await request.formData(), file=form.get("file");
 if(!file || typeof file.arrayBuffer!=="function")return json({success:false,error:"Image file is required."},400);
 const ext=TYPES[file.type];
 if(!ext || file.size>256*1024)return json({success:false,error:"Only JPG, PNG or WEBP images up to 256 KB are allowed. Compress the image before upload."},400);
 const imageId=id(), bytes=new Uint8Array(await file.arrayBuffer()), encoded=toBase64(bytes);
 await env.DB.prepare("INSERT INTO media_objects(id,content_type,data_base64,byte_size) VALUES(?,?,?,?)")
   .bind(imageId,file.type,encoded,file.size).run();
 return json({success:true,data:{key:imageId,url:`/media/${imageId}.${ext}`}},201);
}
