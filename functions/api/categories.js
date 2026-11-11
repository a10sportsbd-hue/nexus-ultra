export async function onRequestGet({ env }) {
  if (!env.DB) return Response.json({ success: false, error: "D1 database binding is not configured." }, { status: 503 });
  const { results } = await env.DB.prepare("SELECT id, name, slug, description FROM categories WHERE is_active = 1 ORDER BY sort_order, name").all();
  return Response.json({ success: true, data: results });
}
