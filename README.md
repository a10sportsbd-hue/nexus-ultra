# NEXUS ULTRA — Cloudflare Pages Starter (Fixed)

Premium Bangladesh-focused storefront built with HTML, CSS, Vanilla JavaScript, Cloudflare Pages Functions and D1.

## Included
- Responsive Bangla/English storefront and dark/light theme
- Product search, category filter and price sorting backed by `GET /api/products`
- D1 schema and starter catalog
- Browser-local cart (not yet a server-side order)
- Cloudflare Pages Functions: `/api/health`, `/api/products`, `/api/categories`
- Fallback preview catalog when the D1 binding is missing

## Important status
This is a working storefront foundation, **not yet a complete production e-commerce platform**. Checkout/order creation, customer authentication, admin panel, payment gateway integration, shipping integration, stock reservation and transactional email are not implemented. The checkout button explains this rather than pretending an order was placed.

## Requirements
Node.js 20+ recommended, npm, Cloudflare account.

## Local preview
```bash
npm install
npx wrangler pages dev public
```
Open the local URL Wrangler prints. Without a local D1 binding, the storefront uses preview products.

## Create and connect D1
```bash
npx wrangler d1 create nexus-ultra-db
```
Copy the returned database ID into `wrangler.toml`, replacing `REPLACE_WITH_YOUR_D1_DATABASE_ID`.

Apply schema and sample data:
```bash
npx wrangler d1 migrations apply nexus-ultra-db --remote
```

For local D1:
```bash
npx wrangler d1 migrations apply nexus-ultra-db --local
```

## Deploy
If the Cloudflare Pages project is already connected to GitHub, commit and push to the connected branch; Cloudflare will build/deploy automatically. If using Wrangler:
```bash
npx wrangler pages deploy public --project-name nexus-ultra
```
The Pages project must have the D1 binding named `DB`. In Cloudflare Dashboard: Workers & Pages → nexus-ultra → Settings → Functions → D1 database bindings → add `DB` and select `nexus-ultra-db`. Redeploy after changing bindings.

## API smoke tests
```bash
curl https://YOUR-PROJECT.pages.dev/api/health
curl https://YOUR-PROJECT.pages.dev/api/categories
curl 'https://YOUR-PROJECT.pages.dev/api/products?limit=100'
curl 'https://YOUR-PROJECT.pages.dev/api/products?category=tech'
```
Health should report `"database": true`; products and categories should return `"success":true`.

## GitHub update workflow
Extract this ZIP, replace the corresponding files in your existing repository, then commit/push. Do not upload `.dev.vars`, API tokens, passwords or `node_modules`.

## Security before launch
- Implement server-side auth with secure, HttpOnly, SameSite cookies and password hashing.
- Recalculate prices, discounts, delivery fees and stock on the server.
- Add CSRF protection, rate limiting, Turnstile and security headers.
- Verify payment gateway signatures before marking orders paid.
- Configure privacy/returns/shipping policies and real support contact details.
- Never use client localStorage cart totals as authoritative order totals.


## Admin panel (added)
- Open `/admin/` after deployment.
- Apply both D1 migrations:
  `npx wrangler d1 migrations apply nexus-ultra-db --remote`
- In Cloudflare Pages project settings, add an encrypted secret named `ADMIN_SETUP_KEY` with a long random value (at least 32 random characters), then redeploy.
- Visit `/admin/`, expand **First-time admin setup**, enter the exact setup key, admin name/email, and a unique password of at least 12 characters.
- Sign in. After the first admin account is created, the setup endpoint locks itself. Remove the `ADMIN_SETUP_KEY` secret from Cloudflare after successful setup and redeploy.
- Admin sessions are stored hashed in D1 and use Secure, HttpOnly, SameSite=Strict cookies. Admin APIs require an authenticated admin account.
- Admin product image upload is not included in this build; product image/R2 upload requires an R2 bucket and a dedicated upload flow.
- Orders panel manages existing orders. Customer-facing order creation and payment processing are not yet included.


## COD Checkout + Cloudflare R2 Product Images

This release adds a real customer order flow using **Cash on Delivery only**. No online payment provider is called and no card/mobile-wallet details are collected.

### New capabilities
- Customer checkout with Bangladeshi mobile number and delivery address validation.
- COD order creation and order number response.
- Server-side product/price/stock lookup; browser-submitted prices are never trusted.
- D1 triggers reject unavailable/insufficient stock and decrement stock in the same atomic D1 batch as order creation.
- Admin image upload to a private R2 binding; public reads are served through `/media/...`.
- Admin can set product image URL or upload JPG/PNG/WEBP (maximum 5 MB).
- Store settings include delivery fee and free-delivery threshold.

### Required Cloudflare setup

1. **Backup D1** before applying migrations.
2. In Cloudflare Dashboard → Workers & Pages → D1 → `nexus-ultra-db` → Console, run the SQL from `migrations/0002_admin_sessions.sql` if not already applied, then run `migrations/0003_checkout_cod_r2.sql` exactly once. The 0003 migration adds `products.image_url` and stock-validation triggers. Do not run it twice.
3. In Cloudflare Dashboard → R2, create a bucket named `nexus-ultra-media`.
4. In the Pages project → Settings → Functions → R2 bucket bindings, add:
   - Variable name: `PRODUCT_MEDIA`
   - Bucket: `nexus-ultra-media`
5. Ensure the Pages project has its D1 binding:
   - Variable name: `DB`
   - Database: `nexus-ultra-db`
6. In Pages → Settings → Variables and Secrets, set `ADMIN_SETUP_KEY` as a **Secret** before first admin setup. Use a long, unique random value (at least 32 characters). After creating the first admin account at `/admin/`, remove `ADMIN_SETUP_KEY` and redeploy. Existing admin login continues to work.
7. Push the code to the connected GitHub production branch and wait for the Pages deployment to finish.
8. Test `/api/health`, `/api/products`, `/admin/`, a small COD order, and one product image upload.

### Store configuration
From Admin → Settings:
- `delivery_fee`: flat delivery fee in BDT (default 80).
- `free_delivery_threshold`: subtotal at which delivery becomes free (default 3000).
- `store_phone`: customer support phone (optional).

### Operational/security notes
- Admin routes require an authenticated admin session. Setup is one-time and requires the secret.
- Product uploads accept JPG, PNG and WEBP only, max 5 MB. R2 bucket is not exposed directly; the Pages media route serves uploaded product objects.
- Keep D1 backups and periodically review orders. Configure Cloudflare WAF/rate limiting for `/api/checkout` and `/api/admin/*` before high-volume production.
- COD is the only enabled payment method. Payment status remains `unpaid` until staff manually reconciles payment on delivery; do not mark an order paid before cash is received.
- This is a production-oriented starter, not a guarantee of compliance or load-tested production readiness. Before public launch, test delivery operations, cancellation/return rules, privacy/terms, backups, and abuse protection. Customer account/password recovery, SMS/OTP, automated shipping integrations and online gateways are not included.


## Free image storage (no R2/card)
This build stores optimized product images in the D1 `media_objects` table.
No R2 subscription or `PRODUCT_MEDIA` binding is required. Upload accepts JPG,
PNG, and WEBP files up to 256 KB; compress images before uploading. This is a
small-catalog/free-tier option, not a high-volume media CDN. Monitor D1 storage
and request quotas. The `/media/<uuid>.<ext>` route serves stored images.

### Required migration
After applying `0002_admin_sessions.sql` and `0003_checkout_cod_r2.sql`, apply
`0004_free_d1_media_and_admin_session_fix.sql` once. It renames the existing
`admin_sessions.admin_id` column to `user_id` to match the admin session code,
and creates `media_objects`.
