# Form & Field API contract · v1

This is the integration specification, not a backend solution. The supplied React client calls real HTTP endpoints only. Implement the backend without changing these contracts. Source of endpoint paths: `frontend/src/api/endpoints.js`; all calls: `frontend/src/api/services.js` and token refresh in `axiosClient.js`.

## Universal conventions

- Default base URL: `http://localhost:8000/api`. All paths below are relative to it and end in `/`.
- JSON request/response, UTF-8. No body on GET or DELETE. PATCH modifies only submitted fields. PUT replaces all writable fields and must be implemented for main CRUD resources even though this client uses PATCH.
- Authentication: `Authorization: Bearer <access>`. **Public** means anonymous read allowed. **Owner** means authenticated and restricted to the current user's resources, including nested foreign keys. **Staff** requires `is_staff`; hiding UI is not security.
- IDs are positive integers. Money is a nonnegative decimal string with two places, in INR. Timestamps are ISO 8601 UTC; dates are `YYYY-MM-DD`. Images are absolute HTTP(S) URLs or null. No HTML in descriptions. Missing collections are `[]`, never null.
- Collections use page-number pagination: `{ "count": 42, "next": "http://localhost:8000/api/products/?page=2", "previous": null, "results": [] }`. Page size 12; next/previous must preserve filters. Applies to products, categories, brands, reviews, addresses and orders. Cart and wishlist are singleton objects, not paginated.
- `page` defaults to 1. Invalid query values return 400, out-of-range pages return 404. Unknown ordering fields return 400. Sorting is stable (ID as tie-breaker). Product `price` ordering and price filters use effective price (`discount_price` when present, otherwise `price`).
- Errors: `{ "detail": "Product is out of stock." }` or `{ "quantity": ["Requested quantity exceeds available stock."] }`. Nested errors use the same dictionary/array style. UI flattens either form. Never return tracebacks or secrets.
- Every route may return 400 (validation), 401 (missing/expired credentials for protected routes), 403 (insufficient privilege), 404 (missing or inaccessible object), 429 (throttled), and 500 (unexpected server failure). Each table row names the relevant success and common additional codes. Wrong methods: 405. Successful POST creation: 201; reads/updates/actions: 200; deletes: 204 with no body.
- Owner querysets hide other users' IDs with 404. Client-supplied `user`, totals, privileged flags, timestamps, calculated ratings, and payment status are rejected as read-only. List endpoints never leak private resources.
- All query parameters are listed below; absent query parameters mean none. Main CRUD resources support GET list/detail, POST, PUT, PATCH, DELETE as specified by permissions. Orders cannot be arbitrarily deleted or replaced.

## Exact response schemas

The following named schemas define **all fields consumed by the client**. Read-only extras are permitted. Write schemas are separate; do not require the client to post nested read representations.

### User, profile and auth

`User`:
```json
{"id":1,"email":"student@example.com","first_name":"Student","last_name":"User","is_staff":false}
```
`Session`:
```json
{"access":"jwt-access","refresh":"jwt-refresh","user":{"id":1,"email":"student@example.com","first_name":"Student","last_name":"User","is_staff":false}}
```
`Profile` = User fields plus:
```json
{"phone":"+919876543210","date_of_birth":null,"profile_image":null}
```

### Catalog

`Category`:
```json
{"id":3,"name":"Home","slug":"home","description":"Everyday essentials","image":null,"parent":null,"is_active":true,"created_at":"2026-09-30T09:00:00Z","updated_at":"2026-09-30T09:00:00Z"}
```
`parent` is null or `{ "id": 1, "name": "Living" }`.

`Brand`:
```json
{"id":2,"name":"Field Studio","slug":"field-studio","description":"Considered design","logo":null,"is_active":true}
```

`Product` (same shape in listings, details, cart and wishlist; optimize queries accordingly):
```json
{
  "id":12,"name":"Everyday vessel","slug":"everyday-vessel",
  "description":"A matte ceramic vessel.","short_description":"A simple form for everyday living.",
  "category":{"id":3,"name":"Home"},"brand":{"id":2,"name":"Field Studio"},
  "price":"1499.00","discount_price":"1299.00","stock":25,"sku":"VES-001",
  "is_active":true,"is_featured":true,"average_rating":4.5,"review_count":2,
  "images":[{"id":1,"product":12,"image":"https://example.com/vessel.jpg","alt_text":"Green ceramic vessel","is_primary":true,"display_order":0}],
  "variants":[{"id":4,"name":"Moss / Large","sku":"VES-M-L","price":"1599.00","stock":10}],
  "created_at":"2026-09-30T09:00:00Z","updated_at":"2026-09-30T09:00:00Z"
}
```
`brand` can be null; category cannot. No reviews means rating 0 and count 0. Variant prices are final unit prices, not offsets; product discounts do not apply again to variants. If variants exist, a variant is required when adding to cart. Variant stock is authoritative for that variant; base stock applies only to non-variant products. Aggregate available variant stock should be exposed as product stock for variant products.

### Cart and wishlist

`Cart`:
```json
{"id":5,"items":[{"id":9,"product":"<Product object>","variant":{"id":4,"name":"Moss / Large","sku":"VES-M-L","price":"1599.00","stock":10},"quantity":2,"unit_price":"1599.00","total_price":"3198.00"}],"subtotal":"3198.00","discount":"0.00","total":"3198.00"}
```
The angle-bracket schema reference above must be replaced with an actual nested Product object, not a string. `variant` is null for a non-variant product. Subtotal sums effective unit prices; catalog discounts are already included, so cart discount is `0.00`. Cart total equals subtotal. Checkout coupon discount is applied to the order separately.

`Wishlist`:
```json
{"id":2,"items":[{"id":7,"product":"<Product object>"}]}
```
Replace the Product schema reference with the nested object. New users receive real empty singleton objects on GET (created server-side if necessary), not 404. No local anonymous cart exists.

### Address and review

`Address`:
```json
{"id":6,"full_name":"Student User","phone":"+919876543210","address_line_1":"12 Garden Road","address_line_2":"","city":"Hyderabad","state":"Telangana","postal_code":"500001","country":"IN","address_type":"HOME","is_default":true}
```
`Review`:
```json
{"id":8,"product":12,"user":{"id":1,"first_name":"Student"},"rating":5,"title":"A lovely everyday object","comment":"Well made and useful.","created_at":"2026-09-30T09:00:00Z","updated_at":"2026-09-30T09:00:00Z"}
```

### Order

`Order` is used for list, detail, creation, cancellation, payment and staff update:
```json
{
  "id":21,"order_number":"FF-2026-000021","user":1,
  "shipping_address":{"full_name":"Student User","phone":"+919876543210","address_line_1":"12 Garden Road","address_line_2":"","city":"Hyderabad","state":"Telangana","postal_code":"500001","country":"IN","address_type":"HOME","is_default":true},
  "items":[{"id":33,"product":12,"product_name":"Everyday vessel","sku":"VES-M-L","variant":4,"variant_name":"Moss / Large","quantity":2,"unit_price":"1599.00","total_price":"3198.00"}],
  "subtotal":"3198.00","discount":"0.00","shipping_charge":"0.00","tax":"0.00","total":"3198.00",
  "payment_method":"CARD_SIMULATION","payment_status":"PENDING","order_status":"PENDING",
  "created_at":"2026-09-30T09:00:00Z","updated_at":"2026-09-30T09:00:00Z"
}
```
Shipping address is an immutable snapshot, with no required ID. Order product/variant IDs may become null after deletion; purchase-time name, SKU, variant name and prices remain immutable. `payment_method`: COD or CARD_SIMULATION. `payment_status`: PENDING, PAID, FAILED, REFUNDED. `order_status`: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED.

## Authentication endpoints

| Method / endpoint | Auth / permission | Query | Request body | Success | Validation / common errors | Used by |
|---|---|---|---|---|---|---|
| POST `/auth/register/` | Public | None | `{ "email":"student@example.com", "password":"strong-password", "password_confirm":"strong-password", "first_name":"Student", "last_name":"User" }` | 201 Session | 400 duplicate normalized email, weak password, confirmation mismatch; never accept is_staff | Register |
| POST `/auth/login/` | Public | None | `{ "email":"student@example.com", "password":"strong-password" }` | 200 Session | 401 invalid credentials, 400 missing fields; generic failure avoids email enumeration | Login |
| POST `/auth/token/refresh/` | Refresh token | None | `{ "refresh":"jwt-refresh" }` | 200 `{ "access":"new-access", "refresh":"new-refresh" }`; refresh may be omitted if rotation disabled | 401 invalid/expired token; 400 missing token | Axios interceptor |
| GET `/auth/me/` | Owner | None | None | 200 User | 401 expired/invalid access | StoreProvider |
| POST `/auth/change-password/` | Owner | None | `{ "old_password":"old", "new_password":"new-strong-password", "new_password_confirm":"new-strong-password" }` | 200 `{ "detail":"Password changed successfully." }` | 400 old password invalid, weak/mismatched new password | PasswordPage |
| GET `/profile/` | Owner | None | None | 200 Profile | 401 | ProfilePage, EditProfilePage |
| PATCH `/profile/` | Owner | None | `{ "first_name":"Student", "last_name":"User", "phone":"+919876543210", "date_of_birth":null, "profile_image":null }` | 200 Profile | 400 invalid phone/date/URL, future birth date; reject email/is_staff/id | EditProfilePage |

Logout clears browser session tokens; there is no logout HTTP call. Password change in this contract preserves the current session. Revocation/blacklisting and cookie-based refresh are optional documented extensions requiring an intentional contract version. The client stores tokens in sessionStorage, not localStorage, never passwords. Access refresh is single-flight for simultaneous 401 responses and each failed request retries once.

## Catalog endpoints

Use these tables for each concrete resource. `{id}` is a positive numeric resource ID, not a slug.

| Method / endpoint | Permission | Query | Body | Success | Errors | Used by |
|---|---|---|---|---|---|---|
| GET `/categories/` | Public; include_inactive staff-only | page, search (name), include_inactive boolean | None | 200 Page<Category> | 400 invalid filter, 403 staff scope | HomePage, ProductListPage, AdminPage |
| GET `/categories/{id}/` | Public active; staff any | None | None | 200 Category | 404 hidden/missing | CRUD assignment; shared service capability |
| POST `/categories/` | Staff | None | CategoryWrite | 201 Category | 400 duplicate slug, parent cycle | AdminPage |
| PUT/PATCH `/categories/{id}/` | Staff | None | CategoryWrite (partial for PATCH) | 200 Category | 400 validation, 404 | AdminPage uses PATCH |
| DELETE `/categories/{id}/` | Staff | None | None | 204 | 400 referenced category cannot be deleted, 404 | AdminPage |
| GET `/brands/` | Public; include_inactive staff-only | page, search (name), include_inactive boolean | None | 200 Page<Brand> | 400 invalid filter, 403 staff scope | ProductListPage, AdminPage |
| GET `/brands/{id}/` | Public active; staff any | None | None | 200 Brand | 404 | CRUD assignment; shared service capability |
| POST `/brands/` | Staff | None | BrandWrite | 201 Brand | 400 duplicate slug | AdminPage |
| PUT/PATCH `/brands/{id}/` | Staff | None | BrandWrite (partial for PATCH) | 200 Brand | 400 validation, 404 | AdminPage uses PATCH |
| DELETE `/brands/{id}/` | Staff | None | None | 204 | 400 referenced brand cannot be deleted, 404 | AdminPage |
| GET `/products/` | Public active; include_inactive staff-only | See filter table | None | 200 Page<Product> | 400 invalid filter, 403 staff scope | HomePage, ProductListPage, SearchResults, AdminPage |
| GET `/products/{id}/` | Public active; staff any | None | None | 200 Product | 404 hidden/missing | ProductDetailPage |
| POST `/products/` | Staff | None | ProductWrite | 201 Product | 400 invalid relation/prices/SKU/nested data | AdminPage |
| PUT/PATCH `/products/{id}/` | Staff | None | ProductWrite (partial for PATCH) | 200 Product | 400 validation, 404 | AdminPage uses PATCH |
| DELETE `/products/{id}/` | Staff | None | None | 204 | 400 deletion protection, 404 | AdminPage |

`CategoryWrite`: `name`, `slug`, `description`, `image` (URL/null), `parent_id` (integer/null), `is_active` (boolean). `BrandWrite`: `name`, `slug`, `description`, `logo` (URL/null), `is_active`. Required on POST/PUT: name, slug; remaining fields default to empty strings/null/true. Names cannot be blank; slugs unique. Parent cannot be self or descendant. Inactive categories/brands hide their products publicly.

`ProductWrite` exact example:
```json
{
  "name":"Everyday vessel","slug":"everyday-vessel","description":"A matte ceramic vessel.","short_description":"Made for everyday living.",
  "category_id":3,"brand_id":2,"price":"1499.00","discount_price":null,"stock":25,"sku":"VES-001","is_active":true,"is_featured":false,
  "images":[{"image":"https://example.com/vessel.jpg","alt_text":"Ceramic vessel","is_primary":true,"display_order":0}],
  "variants":[{"name":"Moss / Large","sku":"VES-M-L","price":"1599.00","stock":10}]
}
```
Required on POST/PUT: name, slug, category_id, price, stock, sku. Other text fields default empty; discount_price and brand_id null; images/variants empty; is_active true; is_featured false. Decimal money must be >=0; discount_price must be strictly less than price when present. Stock is a nonnegative integer. SKU/slug unique. References must exist. At most one primary image. Image display_order is a nonnegative integer. Variant SKU unique; no negative price/stock. For products with variants, return derived product stock. Write arrays replace their respective collections atomically; supplied child IDs must already belong to this product; omitted IDs create children. PATCH omitting an array preserves it. Reject deleting variants referenced by active carts/orders, or preserve historical references safely. Do not silently reassign children between products.

Base contract accepts image URLs; the frontend editor does not upload binary files. Students must configure media serving and demonstrate image upload through Django admin. A versioned multipart API and polished upload UI are optional extensions, not hidden requirements for this frontend.

| Product query | Type / meaning |
|---|---|
| page | positive integer, default 1 |
| search | string, case-insensitive search over name, description, SKU, brand name, category name |
| category, brand | integer ID, exact filter |
| min_price, max_price | nonnegative decimal, inclusive effective product price; min must not exceed max |
| is_featured | boolean true/false |
| in_stock | boolean; true means available base stock or at least one available variant |
| on_sale | boolean; true means non-null discount_price less than price |
| ordering | price, -price, -created_at (default), name, -average_rating |
| include_inactive | boolean, true only for staff; staff catalog screen uses it |

Combine all filters with AND. Example: `/products/?category=3&min_price=1000&max_price=5000&in_stock=true&ordering=price&page=1`. Catalog filter selectors follow each numbered taxonomy page to expose all categories/brands; catalog/admin result listings remain paginated. For very large taxonomies, async searchable selects are a useful optimization.

## Cart and wishlist endpoints

| Method / endpoint | Permission | Query | Request | Success | Errors | Used by |
|---|---|---|---|---|---|---|
| GET `/cart/` | Owner | None | None | 200 Cart | 401 | CartPage, CheckoutPage, store refresh |
| POST `/cart/items/` | Owner | None | `{ "product_id":12, "variant_id":4, "quantity":2 }` | 201 CartItem (same shape as Cart.items member) | 400 zero/negative/noninteger quantity, unavailable product, variant mismatch, insufficient stock | ProductDetailPage, WishlistPage |
| PATCH `/cart/items/{id}/` | Owner | None | `{ "quantity":3 }` | 200 CartItem | 400 stock/quantity, 404 ownership | CartPage |
| DELETE `/cart/items/{id}/` | Owner | None | None | 204 | 404 ownership | CartPage |
| GET `/wishlist/` | Owner | None | None | 200 Wishlist | 401 | WishlistPage, store refresh |
| POST `/wishlist/items/` | Owner | None | `{ "product_id":12 }` | 201 WishlistItem, or 200 existing item | 400 inactive/missing product | ProductDetailPage |
| DELETE `/wishlist/items/{id}/` | Owner | None | None | 204 | 404 ownership | WishlistPage |

Cart POST merges an existing (cart, product, variant) line by adding quantity, then validates combined quantity against stock. Variant must belong to product. Null variant is accepted only for products without variants. PATCH replaces quantity; DELETE removes. Client reloads singleton after writes. Wishlist move executes cart add first and only then deletes wishlist item; failure leaves wishlist item in place. This is not a cross-request transaction. Cart/wishlist uniqueness must be database-backed.

Use ModelViewSets with method restrictions for item resources and singleton custom actions or explicit router mappings to honor these exact paths. Do not replace them with `/cart/{cart_id}/items/`.

## Reviews and addresses

| Method / endpoint | Permission | Query | Request | Success | Errors | Used by |
|---|---|---|---|---|---|---|
| GET `/reviews/` | Public | page, product (integer product ID) | None | 200 Page<Review> | 400 invalid product filter | ProductDetailPage |
| GET `/reviews/{id}/` | Public | None | None | 200 Review | 404 | CRUD assignment; shared service |
| POST `/reviews/` | Owner | None | `{ "product_id":12,"rating":5,"title":"Useful","comment":"Well made." }` | 201 Review | 400 duplicate user/product, rating not integer 1–5, blank title/comment, invalid product | ProductDetailPage |
| PUT/PATCH `/reviews/{id}/` | Owner of review | None | `{ "rating":4,"title":"Updated title","comment":"Updated review." }` (partial for PATCH) | 200 Review | 400 validation, 404 other owner; product/user immutable | ProductDetailPage uses PATCH |
| DELETE `/reviews/{id}/` | Owner of review | None | None | 204 | 404 ownership | ProductDetailPage |
| GET `/addresses/` | Owner | page | None | 200 Page<Address> | 401 | AddressesPage, CheckoutPage |
| GET `/addresses/{id}/` | Owner | None | None | 200 Address | 404 ownership | AddressEditPage |
| POST `/addresses/` | Owner | None | AddressWrite | 201 Address | 400 required/invalid fields | AddressEditPage |
| PUT/PATCH `/addresses/{id}/` | Owner | None | AddressWrite (partial for PATCH) | 200 Address | 400 validation, 404 ownership | AddressEditPage uses PATCH |
| DELETE `/addresses/{id}/` | Owner | None | None | 204 | 404 ownership | AddressesPage |

AddressWrite is Address without id. Full name, phone, address_line_1, city, state, postal_code and country are required. Country is a two-letter ISO code. address_line_2 defaults empty, address_type defaults HOME (HOME/WORK/OTHER), is_default false. At most one default per owner; setting one must clear the previous default transactionally. Updating or deleting an address never alters existing order snapshots. Review aggregates recalculate after create/update/delete; expose public reviewer first name and ID only, never email.

## Coupons and orders

| Method / endpoint | Permission | Query | Request | Success | Errors | Used by |
|---|---|---|---|---|---|---|
| POST `/coupons/validate/` | Owner | None | `{ "code":"SAVE10","cart_total":"5000.00" }` | 200 `{ "valid":true,"code":"SAVE10","discount":"500.00","message":"Coupon is eligible." }` | 400 malformed input; ineligible coupon returns 200 `{ "valid":false,"code":"SAVE10","discount":"0.00","message":"Coupon has expired." }` | CheckoutPage |
| GET `/orders/` | Owner; scope=all staff only | page, search (order_number), scope (all optional) | None | 200 Page<Order>, newest first | 403 nonstaff all scope, 400 invalid query | OrdersPage, AdminPage |
| POST `/orders/` | Owner | None | `{ "address_id":6,"payment_method":"COD","coupon_code":"","idempotency_key":"client-generated-uuid" }` | 201 Order; replay 200 same Order | 400 empty cart, inactive product, stock, coupon, foreign address, invalid payment; 409 reused key with different payload | CheckoutPage |
| GET `/orders/{id}/` | Owner or Staff | None | None | 200 Order | 404 ownership | OrderDetailPage, OrderSuccess |
| PATCH `/orders/{id}/` | Staff only | None | `{ "order_status":"PROCESSING" }` | 200 Order | 400 invalid transition or other writable fields, 403 customer | AdminPage |
| POST `/orders/{id}/cancel/` | Owner or Staff | None | `{}` | 200 Order | 400 shipped/delivered/noncancelable, 404 ownership | OrderDetailPage |
| POST `/orders/{id}/pay/` | Owner | None | `{ "method":"CARD_SIMULATION" }` | 200 Order | 400 COD/cancelled order/invalid method, 404 ownership | OrderDetailPage |

Coupon validation recalculates the authenticated cart total: cart_total is advisory, never authority. Normalize codes consistently; check active flag, inclusive valid_from and exclusive valid_until, minimum amount, global usage_limit and maximum_discount. Coupon discount cannot exceed subtotal. This endpoint does not consume a redemption or modify the cart. Order creation revalidates and consumes redemption only on success. Coupon admin CRUD is not called by this client; students may manage coupons using Django admin.

### Required pricing and transactional behavior

For the base assignment: shipping_charge = `0.00`, tax = `0.00` (educational pricing, not a tax policy). Order subtotal sums current effective unit prices × quantities. Discount comes only from the validated checkout coupon. Total = subtotal − discount + shipping_charge + tax, using decimal arithmetic rounded to two places. Do not trust any client price. With these deterministic rules, the client’s bag total plus displayed coupon estimate explains the expected final amount. Introducing paid shipping or tax requires a quote endpoint and a frontend confirmation step before charging; no real charge exists here.

Create Order and OrderItems with price/address snapshots, decrement correct product/variant stock, create a Payment record with method/status, consume coupon redemption, and clear the cart as **one atomic unit**. A failure must leave all of these unchanged. No stock reservations occur on add to cart. Recheck stock at checkout. Initial statuses: PENDING/PENDING. CARD_SIMULATION payment action sets payment PAID and order CONFIRMED; no external gateway or card number. COD may be confirmed by staff and marked paid by the student's admin workflow on delivery. Repeated pay on an already paid order returns unchanged Order and creates no additional payment.

Order state transitions: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED. PENDING or CONFIRMED → CANCELLED. Terminal states do not transition. Staff cannot skip transitions. Cancellation restores stock once, releases coupon usage once, and changes PAID to REFUNDED (simulation); otherwise payment remains PENDING. Repeated cancel returns unchanged CANCELLED Order. Staff PATCH to CANCELLED must apply the same cancellation business rules. Staff must not set a CARD_SIMULATION order to CONFIRMED until paid.

Idempotency is required because the supplied checkout sends a UUID: scope keys by owner; same key + same canonical payload returns original order even if cart is now empty. Same key + different payload → 409. Validate/store the key atomically with creation; concurrent identical requests must produce one order. The client preserves its key for network retry while on checkout; changing address/method/coupon rotates it. A browser reload starts a new checkout attempt; users should check order history after an uncertain outcome.

## API audit map

No components call Axios directly. All service requests resolve through the central endpoint registry:

- authApi → register, login, me, change-password; axiosClient → token/refresh.
- profileApi → GET/PATCH profile.
- productsApi/categoriesApi/brandsApi → catalog CRUD table.
- resourceApi in AdminPage → catalog list/create/update/delete or orders list/PATCH. Generic helper capabilities not used by a screen do not authorize extra order methods.
- reviewsApi → reviews CRUD table; addressesApi → addresses CRUD table.
- cartApi/wishlistApi → singleton and item table.
- ordersApi → orders list/create/detail/cancel/pay.
- couponsApi → coupons/validate.

All have loading and/or mutation pending state, error presentation, and retry paths. A backend outage must display an error, never invented inventory, authentication, orders, or payments. Test-only HTTP adapters in frontend tests are not part of the application runtime.
