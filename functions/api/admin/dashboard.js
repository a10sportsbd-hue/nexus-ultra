
import {json,requireAdmin} from "../../_lib/admin.js";
export async function onRequestGet({request,env}) {
  const auth=await requireAdmin(request,env); if(auth.error) return auth.error;
  const [products,orders,customers,revenue,pending,recent]=await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS n FROM products").first(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM orders").first(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE role='customer'").first(),
    env.DB.prepare("SELECT COALESCE(SUM(total),0) AS n FROM orders WHERE payment_status='paid'").first(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM orders WHERE order_status IN ('pending','processing')").first(),
    env.DB.prepare("SELECT id,order_number,customer_name,total,order_status,created_at FROM orders ORDER BY created_at DESC LIMIT 8").all()
  ]);
  return json({success:true,stats:{products:products.n,orders:orders.n,customers:customers.n,revenue:Number(revenue.n),pending:pending.n},recent:recent.results});
}
