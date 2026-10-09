# Form & Field

A considered storefront. A substantial Django REST Framework capstone.

This repository provides a complete React frontend and a contract-driven backend assignment. **The Django backend is intentionally empty.** Students build it themselves, then demonstrate real end-to-end commerce flows. There are no runtime mocks, seeded frontend products, fake accounts or local orders.

## Start the frontend

Use Node.js 20.19+ or 22 LTS and npm.

```sh
cd frontend
npm ci
cp .env.example .env
npm run dev
```

Open http://localhost:5173. The frontend expects `http://localhost:8000/api`. Configure `VITE_API_BASE_URL` to change it; restart Vite after editing the environment. Initially API requests fail and the UI explains that the Django server must be started. This is expected; do not “fix” it with mocks.

```sh
npm run build
npm test
npm run preview
```

The production bundle is `frontend/dist`. An SPA host must rewrite application routes (e.g. `/orders/21`) to index.html. Build-time API configuration must point to the deployed API. The Google-hosted fonts are optional visual enhancement; local fallback fonts preserve usability offline.

## What is included

- Responsive storefront with original Form & Field branding, a CSS editorial illustration, API-backed category/featured/new/popular/deal collections, product search, filters, ordering and pagination.
- Product galleries, variant selection, quantity/stock controls, wishlist, cart, review creation/editing/deletion.
- Registration/login, centralized JWT refresh, protected customer/staff routes, profile editing, password changes and address CRUD.
- Checkout with owned shipping address, coupon preview, COD/simulated card payment, retry idempotency key, order success/history/detail/cancellation/payment.
- Staff product/category/brand CRUD and order state management. Advanced nested product image/variant editing uses JSON arrays with documented fields.
- Central endpoint registry, reusable API services, query/mutation states, Context authentication/cart/wishlist, responsive styles and accessible forms.

## Architecture and repository

```text
frontend/
  src/
    api/          Endpoint registry, Axios/JWT and service layer
    components/   Layout, reusable states, forms, cards and route protection
    context/      Auth, cart and wishlist state
    hooks/        Request lifecycle hook
    pages/        Catalog, product, account, shopping, orders and staff UI
    utils/        Currency/date helpers
    App.jsx       Route table
    styles.css    Responsive visual system
  .env.example
  package.json
  package-lock.json
backend/
  .gitkeep        No implementation; student-owned assignment
API_CONTRACT.md
BACKEND_ASSIGNMENT.md
PORTFOLIO_GUIDE.md
README.md
```

React → API services → Axios (JWT, refresh, errors) → **student-built DRF** → ORM/database. API data is always authoritative. The client never calculates trusted order totals or authorizes backend operations. Authentication tokens persist only in sessionStorage for this assignment; document its XSS exposure and the cookie-based alternative before production use.

## Begin the assignment

1. Read [BACKEND_ASSIGNMENT.md](BACKEND_ASSIGNMENT.md) and model the domain.
2. Treat [API_CONTRACT.md](API_CONTRACT.md) as your integration specification.
3. Create the Django project in backend, using the assignment phases. Backend dependencies are documented, not preinstalled.
4. Start your Django server on port 8000 in a second terminal. No backend startup command can run until you create the backend project yourself.
5. Implement **all main CRUD APIs with ModelViewSet**, routers and ModelSerializer.
6. Work through security, transaction, API and UI acceptance scenarios until the storefront works with real data.
7. Build a credible portfolio submission using [PORTFOLIO_GUIDE.md](PORTFOLIO_GUIDE.md).

## Scope and honest readiness

This is a production-style educational starter, not an already deployed production commerce platform. Payment is simulated, tax/shipping are zero under the base contract, and there is no Django implementation. Frontend tests use isolated HTTP adapters only inside tests; they do not run in the app. A successful Vite build proves the frontend compiles, not that the unbuilt backend works.

Before claiming a completed full-stack project, implement the backend, run its tests and the real integration checklist, deploy or document reproducible local operation, and record your own contributions. Do not claim payment processing, production traffic, performance gains, or security properties without evidence.

Known extension points: staff nested data editing can become dedicated image/variant forms; category/brand selectors load all pages and can gain async search for very large taxonomies; refresh revocation and HttpOnly cookie sessions need a versioned auth design. None of these is silently implemented in a fake backend.
