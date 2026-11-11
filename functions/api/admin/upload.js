
import {json,requireAdmin,validOrigin} from "../../_lib/admin.js";
const TYPES={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
export async function onRequestPost({request,env}) {
 const auth=await requireAdmin(request,env); if(auth.error)return auth.error;
 if(!validOrigin(request))return json({success:false,error:"Invalid origin"},403);
 if(!env.PRODUCT_MEDIA)return json({success:false,error:"R2 binding PRODUCT_MEDIA is not configured."},503);
 const form=await request.formData(), file=form.get("file");
 if(!file || typeof file.arrayBuffer!=="function")return json({success:false,error:"Image file is required."},400);
 const ext=TYPES[file.type];
 if(!ext || file.size>5*1024*1024)return json({success:false,error:"Only JPG, PNG or WEBP images up to 5 MB are allowed."},400);
 const key=`products/${crypto.randomUUID()}.${ext}`;
 await env.PRODUCT_MEDIA.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type,cacheControl:"public, max-age=31536000, immutable"}});
 return json({success:true,data:{key,url:`/media/${key}`}},201);
}
