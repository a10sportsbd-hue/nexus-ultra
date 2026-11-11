# NEXUS ULTRA

Premium single-vendor e-commerce foundation for Bangladesh. PHP-free architecture:
- Static storefront: HTML, CSS, Vanilla JavaScript
- Backend: Cloudflare Pages Functions
- Database: Cloudflare D1
- Optional media storage: Cloudflare R2
- Currency: BDT (৳)
- Languages: Bangla + English
- Theme: Dark + Light

## Current Phase 01 deliverables
- Responsive storefront foundation and visual design system
- Bilingual interface toggle
- Dark/light theme toggle
- Product search and sort UI
- Working local cart using browser localStorage
- Cloudflare Pages Functions health, products and categories endpoints
- D1 initial schema and sample catalog seed
- Wrangler configuration and deployment instructions

**Important:** Checkout, real customer accounts, admin mutations, payment gateway processing, R2 upload and order fulfillment are not yet production-enabled. They are later development phases. The current storefront uses sample products and a local browser cart.

## Requirements
- Node.js LTS and npm
- Cloudflare account
- Wrangler CLI (installed through npm)

## Run locally
```bash
npm install
npx wrangler pages dev public
```
Open the local URL printed by Wrangler.

## Create D1 database
```bash
npx wrangler d1 create nexus-ultra-db
```
Copy the returned database ID into `wrangler.toml`, replacing `REPLACE_WITH_YOUR_D1_DATABASE_ID`.

Apply migrations:
```bash
npx wrangler d1 migrations apply nexus-ultra-db --remote
```

## Deploy to Cloudflare Pages
```bash
npx wrangler pages project create nexus-ultra
npx wrangler pages deploy public --project-name nexus-ultra
```
The first deployment creates a `*.pages.dev` address. Keep `wrangler.toml` in the repository so Pages Functions and D1 binding can be configured. In the Cloudflare dashboard, verify the D1 binding is named `DB` for the Pages project if deploying through Git integration.

## API routes
- `GET /api/health`
- `GET /api/products`
- `GET /api/categories`

The product and category APIs require the D1 binding named `DB`. Without it, they return HTTP 503 with a configuration message. `/api/health` remains available and reports whether D1 is bound.

## Security and production notes
- Never commit API tokens, passwords, or `.dev.vars`.
- Create Cloudflare secrets using Wrangler secrets or Pages environment variables.
- Do not store plaintext passwords. Authentication must use server-side password hashing and secure session cookies.
- Validate prices, stock, shipping fees, discounts and payment callbacks on the server. Never trust browser-calculated totals.
- Configure Turnstile, rate limits, CSP and security headers before public launch.
- Use a real payment merchant account and verify gateway signatures before marking an order paid.
- Configure R2 separately before enabling image uploads.

## Project layout
```text
public/       Static storefront and assets
functions/    Pages Functions API
migrations/   D1 SQL migrations
wrangler.toml Cloudflare configuration
tests/        Reserved for automated tests
```
