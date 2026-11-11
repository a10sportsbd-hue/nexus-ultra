export async function onRequestGet({ request, env }) {
  if (!env.DB) {
    return Response.json({ success:false, error:"D1 database binding 'DB' is not configured." }, { status:503 });
  }
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim().slice(0,80);
  const category = (url.searchParams.get("category") || "").trim().slice(0,40);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 24),1),100);
  let sql = `SELECT p.id,p.name,p.slug,p.description,p.price,p.sale_price,p.sku,p.stock_quantity,
                    p.category_id,p.status,p.image_url
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE p.status = 'active'`;
  const args = [];
  if (q) { sql += " AND (p.name LIKE ? OR p.description LIKE ?)"; args.push(`%${q}%`,`%${q}%`); }
  if (category) { sql += " AND (p.category_id = ? OR c.slug = ?)"; args.push(category,category); }
  sql += " ORDER BY p.created_at DESC LIMIT ?";
  args.push(limit);
  try {
    const { results } = await env.DB.prepare(sql).bind(...args).all();
    return Response.json({success:true,data:results},{headers:{"Cache-Control":"no-store"}});
  } catch (error) {
    return Response.json({success:false,error:"Unable to retrieve products."},{status:500});
  }
}
