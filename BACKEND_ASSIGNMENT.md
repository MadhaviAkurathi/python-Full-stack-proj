# PROJECT: Build the Django REST Framework backend for an existing e-commerce frontend

## Scenario

Your frontend team has delivered Form & Field, a React commerce application. It already sends HTTP requests to `http://localhost:8000/api/`. Your job is to design, implement, test, and explain the complete backend from an empty directory. You must satisfy `API_CONTRACT.md` without modifying its contract to make the backend easier to implement.

**ALL MAIN CRUD APIs MUST BE IMPLEMENTED USING DJANGO REST FRAMEWORK ModelViewSet.**

Use ModelSerializer, DefaultRouter or SimpleRouter, serializer validation, authentication, permissions, filtering, searching, ordering, and pagination. Business actions belong in appropriate ModelViewSets using `@action(detail=True, methods=[...])` or `@action(detail=False, methods=[...])`. JWT library views are allowed for token operations; do not build the main resource APIs around function-based views or APIView. Explain method restrictions for singleton carts and transactional orders.

This is a substantial capstone. The supplied frontend is a starting asset, not evidence that you built a full-stack application yourself. You can credibly present the completed project as full-stack integration after you implement the backend, verify every flow, document your decisions, and distinguish your contribution from the starter.

## Deliverables and definition of done

Submit a working repository, database migrations, repeatable student-authored sample data procedure, API tests, frontend integration evidence, an ER diagram, architectural decisions, deployment/runbook documentation, and a 5–8 minute demo. No genuine customer data or live payment credentials. SQLite is the default; investigate PostgreSQL for production concurrency. The backend directory delivered with this assignment deliberately contains only `.gitkeep`.

Read the API contract first. The frontend already implements all shopper and staff flows; a build passing alone is not completion. Acceptance means a real Django server successfully serves registration, login/refresh, catalog, reviews, profile, addresses, cart, wishlist, checkout, orders, coupons, and staff management.

## Architecture and domain responsibilities

React → centralized Axios/JWT layer → DRF routers/ModelViewSets → serializers/domain operations → Django ORM/database. Media URLs are returned by the backend; the client renders them. The backend owns authorization, pricing, validation, totals, state transitions, and stock. Client buttons and disabled fields are usability features only.

Design these entities and explain their relationships before coding:

| Entity | Relationships and constraints to consider |
|---|---|
| User | Unique normalized email, hashed password, staff privilege protected from public writes; choose custom user strategy before migrations |
| UserProfile | OneToOne User; phone, date_of_birth, profile_image |
| Address | ForeignKey User; one default per owner; order address snapshots remain independent |
| Category | Optional self ForeignKey parent; prevent cycles; unique slug |
| Brand | One-to-many Products; unique slug |
| Product | ForeignKey Category and optional Brand; decimal prices, SKU, availability, feature flags, timestamps |
| ProductImage | ForeignKey Product; URL/file, alt text, primary flag, display order |
| ProductVariant | ForeignKey Product; independently priced SKU and stock |
| Cart | OneToOne User; derived totals |
| CartItem | ForeignKey Cart/Product/optional Variant; unique product+variant within cart, positive quantity |
| Wishlist | OneToOne User |
| WishlistItem | ForeignKey Wishlist/Product; unique pair; also teaches a many-to-many relationship through a model |
| Order | ForeignKey User; immutable address snapshot, order number, totals and states |
| OrderItem | ForeignKey Order with purchase-time product name, SKU, variant name and price snapshots |
| Payment | ForeignKey/OneToOne Order according to your retry model; method, status, timestamps, no real card data |
| Coupon | Unique normalized code, fixed/percentage discount, minimum, cap, time window, usage limit, active flag |

You may add CouponRedemption/CheckoutAttempt records to enforce usage and idempotency, Inventory for stock movements, or product attributes for advanced variants. Explain ForeignKey vs OneToOne vs ManyToMany, on_delete choices, indexes, unique constraints, check constraints, and why serializer checks alone cannot prevent concurrent duplicates.

## Progressive implementation phases

### 1 — Django setup

Create a virtual environment and Django project inside backend. Choose supported versions of Python/Django/DRF and record exact dependencies yourself. Expected packages: Django, djangorestframework, django-filter, djangorestframework-simplejwt, and optionally django-cors-headers. Configure apps, settings, environment variables, URLs, database, migrations, logging and development media. Do not commit secrets, virtual environments or databases.

React runs on `http://localhost:5173`; Django on `http://localhost:8000`. Configure CORS for the explicit frontend origin; understand CORS is not authentication. Document production trusted origins, allowed hosts, HTTPS and DEBUG=False separately. Avoid unrestricted CORS as a deployment shortcut.

### 2 — Core models

Implement User/Profile, Category, Brand, Product, ProductImage and ProductVariant. Register useful Django admin views, add constraints and migrations, and create a staff account through a secure workflow. Create your own realistic catalog with multiple categories, variants and images, enough records to exercise pagination. Explain migration safety and media storage; demonstrate uploading images through Django admin. No provided seed or backend solution exists.

### 3 — Serializers

Use ModelSerializer; mark calculated/ownership fields read-only and credentials write-only. Practice nested serializers, validate(), validate_<field>(), create() and update(). Use SerializerMethodField only where appropriate, avoiding queries per object. Explain separate ProductListSerializer, ProductDetailSerializer and ProductCreateUpdateSerializer, and use get_serializer_class() where their shapes/permissions differ. Read-side relationships are nested; write-side relationships use *_id keys. Implement transactional nested image/variant writes without cross-product ID injection.

### 4 — ModelViewSets

Implement CategoryViewSet, BrandViewSet and ProductViewSet with standard CRUD. Override get_queryset(), perform_create() and perform_update() when useful; choose serializers by action deliberately. Restrict unsupported operations. Public reads show active resources only; staff catalog requests with include_inactive=true include inactive data. Never let a client grant itself staff status.

### 5 — Routers

Register resource ViewSets using DefaultRouter/SimpleRouter. Match trailing slashes and IDs exactly. Plan singleton and nested item routes carefully: `/cart/`, `/cart/items/`, `/wishlist/items/` are fixed. Router-generated custom actions are suitable for order cancel/pay and coupon validate. Demonstrate route resolution; do not redesign contracts.

### 6 — Filtering, searching and ordering

Use django-filter for category, brand, min/max effective price, is_featured, in_stock and on_sale. Use DRF SearchFilter across name, description, SKU, brand and category names. Use OrderingFilter with explicit allowed fields and rating/price annotations where needed. Combine filters, preserve search during pagination, validate bad ranges and booleans. Implement administrative search and scope flags from the contract.

### 7 — Pagination

Configure page-number pagination (12 records/page) with count/next/previous/results for all documented collections. Ensure deterministic ordering to prevent missing or duplicated records between pages. Do not paginate cart or wishlist singleton responses. Test empty datasets and invalid pages. Category/brand selectors load successive API pages; test a taxonomy larger than one page.

### 8 — Authentication

Implement email/password register/login, access/refresh JWTs, me, change-password, and profile GET/PATCH. Return the documented user/session structure, including is_staff. Use secure hashing and Django password validators. Reject duplicate normalized emails and password mismatch. Validate expired/invalid tokens; test single-flight frontend refresh and failed refresh logout. Logout currently clears browser tokens, not server revocation. Explain the XSS tradeoff of sessionStorage and propose a versioned HttpOnly cookie/CSRF design for deployment.

### 9 — Permissions and object ownership

Practice AllowAny, IsAuthenticated, IsAdminUser and custom permission classes. Enforce both action-level authorization and owner-filtered querysets; object permissions alone do not filter lists or automatically protect create operations.

| Actor | Allowed behavior |
|---|---|
| Anonymous | Active catalog/category/brand reads; public reviews |
| Customer | Own cart/wishlist/profile/addresses/orders; create reviews and edit/delete own reviews |
| Staff | Catalog/category/brand/inventory management; all-order scope and valid order transitions |

**Using `Order.objects.all()` for normal customer requests is wrong.** Filter private resources by request.user. Also validate ownership of submitted address IDs, item IDs and nested related IDs. A different URL ID must not expose another customer's data. Test list, retrieve, create, update and delete independently with two users. Scope=all and include_inactive are privileged operations, not trusted strings. Frontend ProtectedRoute/AdminRoute behavior is UX only; backend enforcement remains mandatory.

### 10 — Cart

Implement Cart and CartItem, singleton retrieval, adding, quantity replacement and deletion. Merge repeated product/variant adds; enforce uniqueness and validate merged quantity against authoritative stock. Quantity must be a positive integer; an inactive or unavailable item is rejected. Cart totals derive from current prices. Base stock and variant stock must not be decremented twice. Cart does not reserve inventory.

### 11 — Wishlist

Implement own singleton and item operations with database uniqueness. Adding a duplicate is idempotent. Moving to cart consists of two HTTP mutations: cart succeeds before wishlist removal. Handle unavailable products and variant selection. Never expose another user's list.

### 12 — Reviews

Implement Review ModelViewSet, product filtering, owner writes, public read representations, and one review per user/product. Rating must be integer 1–5; validate title/comment. Update average_rating and review_count on edits and deletion. Purchased-only review eligibility is optional; if added, document it in your contract version and UI.

### 13 — Addresses

Implement address CRUD with owner assignment and filtering. Validate required fields, country code and appropriate phone/postal rules without assuming all countries share formats. Keep at most one default transactionally. A customer cannot submit another customer's address during checkout. Deleting/editing addresses must not rewrite prior orders.

### 14 — Orders

Create Order, OrderItem and Payment models. Historical names, SKUs, prices and shipping addresses must survive future catalog changes. Customers list/retrieve only their own orders; staff uses scope=all. Restrict staff PATCH to valid order status transitions. No general order delete or replace API. Order number is server-generated and unique.

### 15 — Checkout

Implement the following business operation; do not copy client totals:

Authenticated user → retrieve cart → validate nonempty cart → validate active products and variants → validate stock → validate owned address → validate coupon → calculate decimal prices → create order → create immutable items/address snapshot → reduce stock → create payment → consume redemption → clear cart → return Order.

For correctness, **all critical writes must be atomic**. An exception rolls back order, items, stock, payments, coupon use and cart changes. Base tax/shipping are zero; real financial rules are outside this educational contract. CARD_SIMULATION and COD are the only methods; never accept real card numbers. Implement idempotent checkout with the provided UUID and owner-scoped uniqueness. Replayed successful requests return the original order, not another stock decrement. Same key/different payload returns 409. Carefully consider concurrent requests; SQLite alone cannot demonstrate row-level locking.

### 16 — Coupons

Implement Coupon and a validate custom action. Validate active/date window/minimum/usage/cap and discount type/value. Use server-computed cart totals; cart_total supplied by the browser is advisory. Validation is a preview and does not reserve use. Checkout rechecks and consumes use atomically. Percentage discount must be >0 and <=100; fixed discounts >0; cap at eligible subtotal. Use timezone-aware datetimes. Manage coupons in Django admin for the base project.

### 17 — Advanced validation and state transitions

Reject zero/negative/fractional quantities; negative prices/stock; discount >= regular price; mismatched variants; another user's related objects; missing required variants; invalid ratings; duplicate email/SKU/slug; expired/inactive/exhausted coupons; insufficient order amount; inactive/out-of-stock checkout. Read-only fields cannot be injected.

Implement the contract's order transition graph. Cannot cancel shipped/delivered orders. Cancel once restores stock and coupon use once; repeated cancellation is harmless. Simulated pay is idempotent; no duplicate Payment records or charging. Staff cannot bypass the same business rules through PATCH. Use database constraints as the final protection against race conditions, with safe user-facing errors.

### 18 — Testing

Write meaningful model, serializer, permission, API, transaction and integration tests. Use separate users and staff. Test happy paths and failure paths. Test the exact response types, money strings, pagination envelope and nested relationships. Assert side effects (stock, cart, coupon use and snapshots), not just HTTP status. See scenario matrix below. Run concurrency tests with PostgreSQL if claiming overselling prevention under load.

### 19 — Frontend integration and portfolio handoff

Run the supplied React app against your real backend. Exercise every route and form. Fix backend mismatches rather than replacing API calls with fixtures. Inspect browser Network requests, errors, token refresh and pagination. Deploy the completed system if desired; record environment setup, API base URL, migration procedure, media hosting, static SPA fallback and rollback approach. Finish `PORTFOLIO_GUIDE.md` deliverables and submit evidence.

## HTTP behavior to explain in interviews

GET reads without intentional business mutations (singleton initialization is documented). POST creates resources or invokes actions. PUT replaces writable representation; PATCH partially updates. DELETE removes resources only where permitted. GET returns 200, POST creation 201, updates/actions 200, deletion 204; 400 for validation, 401 for unauthenticated, 403 for insufficient privilege, 404 for missing/hidden records. Understand 409 for idempotency conflict, 429 throttling, and why internal failures must not return 200. Do not invent HTTP verbs to fit implementation.

Error handling must support detail and field/nested-field messages from API_CONTRACT.md. CORS/network failure is distinct from HTTP validation. Never send password hashes, token secrets or stack traces in error responses.

## Required acceptance scenarios

Record requests, expected/actual status, assertions and evidence. Automate most scenarios; manually verify UI presentation as well.

| # | Scenario | Expected evidence |
|---|---|---|
| 1 | Register a customer | 201 Session; password hashed; is_staff false |
| 2 | Duplicate email with different casing | 400; one account |
| 3 | Weak/mismatched password | 400 field errors displayed |
| 4 | Correct and incorrect login | 200 vs generic 401 |
| 5 | Expired access with valid refresh | refresh then original request succeeds |
| 6 | Multiple simultaneous expired requests | one refresh; safe retries |
| 7 | Expired refresh | login redirect; no infinite retry |
| 8 | Anonymous catalog and product detail | 200; no inactive resources |
| 9 | Search by name, SKU, brand and category | matching results only |
| 10 | Combined category/brand/price/stock filters | AND semantics; sale filter works |
| 11 | Sort effective price, rating and newest | correct stable order |
| 12 | Paginate >12 products | no missing/duplicate items; filters retained |
| 13 | Empty search / nonexistent detail | empty UI / 404 error |
| 14 | Add base product; add same product again | merged positive quantity |
| 15 | Select and add variant | exact variant price/stock used |
| 16 | Missing/foreign variant ID | 400; cart unchanged |
| 17 | Zero/negative/fractional/excess quantity | 400; useful field error |
| 18 | Update/remove cart item | totals recompute; deletion 204 |
| 19 | Duplicate wishlist and move to cart | unique wishlist; remove only after add success |
| 20 | Create/update/default/delete address | owner only; exactly one default |
| 21 | Access another user's private IDs | 404; list is also scoped |
| 22 | Checkout with foreign address | 400/404; no order/stock change |
| 23 | Empty/inactive/out-of-stock checkout | 400; all side effects absent |
| 24 | Successful checkout | order snapshots; correct stock decrement; cart cleared; Payment created |
| 25 | Forced mid-checkout database failure | transaction rollback across every write |
| 26 | Repeat same checkout key | same order; no duplicate effects |
| 27 | Same key, changed body | 409 |
| 28 | Concurrent last-item purchase | at most one succeeds; document DB-specific proof |
| 29 | Valid/expired/inactive/exhausted coupons | discount/cap/minimum enforced; validation does not consume |
| 30 | Tampered client cart_total/prices/user | no authority over server calculations/ownership |
| 31 | Pay simulated order twice | one payment effect; order CONFIRMED |
| 32 | Cancel twice; cancel delivered order | one restock; delivered cancellation rejected |
| 33 | Staff invalid state jump / unpaid confirmation | 400; no state change |
| 34 | Customer attempts staff create/update/delete | 403 for each action |
| 35 | Customer scope=all/include_inactive | 403; no leaked data |
| 36 | Staff product/category/brand CRUD | nested response, protected deletion, inventory changes |
| 37 | Replace images/variants with foreign child ID | 400; no cross-product mutation |
| 38 | Review create/update/delete, rating 0/6 | ownership and aggregates correct; invalid rating 400 |
| 39 | Edit another user's review | 404; unchanged |
| 40 | Change profile/password | own fields only; old password and confirmation validated |
| 41 | Edit product/address after purchase | order snapshots unchanged |
| 42 | Backend stopped / slow response | clear unavailable/loading UI, never fake success |
| 43 | Mobile 375px / tablet / desktop | usable navigation/forms and no unintended overflow |
| 44 | Keyboard-only flow | labels, focus visibility, submit buttons, error announcements |
| 45 | Simulated payment privacy | no real card inputs or secrets in logs |

## Optional advanced challenges

After the base acceptance criteria pass, investigate PostgreSQL inventory locking and select_for_update(), isolation levels, retry/deadlock handling, inventory ledgers, database indexes with query plans, select_related()/prefetch_related() and N+1 query budgets, aggregate annotations, custom pagination, throttling, cache invalidation, recommendations, recently viewed products, soft deletion, audit trails, OpenAPI documentation, background email/outbox patterns, observability and structured logs. Atomic checkout and basic idempotency are already required; advanced work proves them under real concurrent load and handles operational recovery.

Compare SQLite vs PostgreSQL explicitly; do not claim row locks from a database that does not provide them. Explain costs and tradeoffs rather than adding tools for a longer technology list. Do not implement real payment processing as a hidden extension of CARD_SIMULATION.

## Assessment rubric (100 points)

| Area | Points | Evidence |
|---|---:|---|
| Models, migrations and constraints | 15 | ERD, schema and design rationale |
| ModelViewSets, serializers and exact contracts | 20 | resource/action coverage and contract tests |
| Authentication, permissions and ownership | 20 | adversarial two-user tests; no leaks |
| Checkout, stock, coupon and order integrity | 20 | rollback, idempotency and snapshot tests |
| Filtering, pagination and query efficiency | 10 | combined filters, query counts and ordering |
| Frontend integration and accessibility | 5 | working real-API demo across viewports |
| Test quality and reproducibility | 5 | repeatable clean setup and green test suite |
| Documentation and interview explanation | 5 | portfolio evidence and honest ownership |

Security leaks, fabricated API success, implementing CRUD without ModelViewSet, or changing the frontend contracts to bypass requirements prevent completion regardless of score.

## Final submission checklist

- [ ] Virtual environment and reproducible backend dependency manifest created by student
- [ ] Django project/apps/settings/URLs established; secret configuration documented
- [ ] DRF and JWT installed; explicit CORS origin configured
- [ ] SQLite works locally; PostgreSQL tradeoffs explained
- [ ] Custom user decision made before initial migrations
- [ ] All required domain entities, constraints and relationships documented
- [ ] Migrations run successfully from an empty database
- [ ] Staff/admin and realistic sample catalog procedure documented
- [ ] Media uploads demonstrated in Django admin and URLs render in React
- [ ] ModelSerializers protect read-only/write-only fields
- [ ] Nested product/image/variant serializers and writes validated
- [ ] Main CRUD uses ModelViewSet and routers
- [ ] Exact paths and trailing slashes satisfy API_CONTRACT.md
- [ ] Appropriate actions and HTTP method restrictions implemented
- [ ] JWT register/login/me/refresh/change-password work
- [ ] Profile GET/PATCH and staff flags secure
- [ ] Public vs staff catalog scopes enforced
- [ ] Combined filters/search/order/page work across all collections
- [ ] Cart merge/update/delete/variant/stock validation pass
- [ ] Wishlist uniqueness and owner permissions pass
- [ ] Review CRUD/ownership/aggregates pass
- [ ] Address CRUD/ownership/single default pass
- [ ] Checkout calculates prices entirely server-side
- [ ] Order and address snapshots are immutable
- [ ] Atomic checkout rollback verified
- [ ] Idempotent checkout and conflict cases verified
- [ ] Stock decremented once; cart clears only after success
- [ ] Coupon validation and usage rules verified
- [ ] Simulated payment and cancellation are idempotent
- [ ] Order state transitions apply equally to staff actions
- [ ] Two-user ID tampering tested for every private resource
- [ ] Customer cannot create/edit/delete administrative resources
- [ ] Error/status conventions and field messages match contract
- [ ] Tests assert side effects and data integrity, not only status
- [ ] Query optimization measured; N+1 explanation prepared
- [ ] React build and frontend unit tests pass
- [ ] Real Django/React end-to-end demo recorded
- [ ] Mobile and keyboard flows checked
- [ ] Deployment/runbook, ERD and decisions written
- [ ] Resume statements distinguish starter from student work
- [ ] All claims backed by test or demo evidence; no invented metrics
