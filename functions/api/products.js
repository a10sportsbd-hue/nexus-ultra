export async function onRequestGet({ request, env }) {
  if (!env.DB) return Response.json({ success: false, error: "D1 database binding is not configured." }, { status: 503 });
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim().slice(0, 80);
  const category = (url.searchParams.get("category") || "").trim().slice(0, 40);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 24), 1), 100);
  let sql = "SELECT id, name, slug, description, price, sale_price, sku, stock_quantity, category_id, status FROM products WHERE status = 'active'";
  const args = [];
  if (q) { sql += " AND (name LIKE ? OR description LIKE ?)"; args.push(`%${q}%`, `%${q}%`); }
  if (category) { sql += " AND category_id = ?"; args.push(category); }
  sql += " ORDER BY created_at DESC LIMIT ?";
  args.push(limit);
  const { results } = await env.DB.prepare(sql).bind(...args).all();
  return Response.json({ success: true, data: results });
}
