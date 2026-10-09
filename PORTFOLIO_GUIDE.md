# Turn the capstone into credible interview evidence

The resume-worthy work is a complete, explainable system: models, APIs, permissions, transactions, tests, deployment and integration. The provided React client gives you a demanding consumer for your backend. Say clearly that you implemented the backend and integrated a supplied frontend; if you also extend React, describe exactly what you changed.

## Minimum portfolio package

1. **Working demo:** a live deployment or a repeatable local startup with catalog browsing, registration, variants, cart, address, coupon, checkout, payment simulation and order history. Show a staff change reflected in the storefront.
2. **Architecture diagram:** browser, frontend host, API, database, media storage, trust boundaries and authentication lifecycle. Label simulated payments honestly.
3. **ER diagram:** include cardinality, uniqueness, stock source, snapshot fields and ownership. Explain why history cannot depend on mutable product records.
4. **Three short decision records:** custom user/email strategy; nested serializer/read-write shape; transaction/idempotency strategy. Include options rejected and real tradeoffs.
5. **Evidence folder:** test report, permission matrix, query counts before/after an optimization, responsive screenshots and a demo recording. Redact secrets and tokens.
6. **Runbook:** supported runtime versions, installation, environment names (no values), migrations, sample data creation, staff creation, startup, health checks, deployment, backup/restore and rollback.
7. **Contribution statement:** supplied starter vs your implementation, extensions and collaborators. Link meaningful commits/PRs, not an invented narrative.

## 5–8 minute interview walkthrough

- 0:00–0:45: explain the user problem, stack and the provided frontend boundary.
- 0:45–2:00: browse/search/filter, select a variant, add it to the cart and show API requests.
- 2:00–3:15: select address, apply coupon, checkout and simulate payment. Show price/address snapshots.
- 3:15–4:15: demonstrate another user's order ID returning 404 and a customer staff write returning 403.
- 4:15–5:30: explain checkout transaction and idempotency; run a rollback/replay test.
- 5:30–6:30: show a query optimization and the measurement method, not just the use of prefetch_related.
- 6:30–8:00: show deployment/tests and discuss a known limitation and your next improvement.

## Resume bullet templates — use only after completing the work

- “Built a Django REST Framework commerce backend and integrated it with a supplied React storefront, implementing ModelViewSet APIs for catalog, cart, wishlist, reviews, addresses and orders.”
- “Implemented JWT authentication, role-based permissions and owner-scoped querysets; verified cross-user access protection with [actual number] automated negative tests.”
- “Designed atomic, idempotent checkout with purchase-time snapshots, stock validation and coupon redemption; tested rollback and duplicate-request behavior.”
- “Reduced catalog database queries from [measured before] to [measured after] using [actual technique], measured on [dataset and endpoint].”
- “Deployed [actual components] with [actual environment], documented migrations and recovery, and demonstrated responsive frontend/backend integration.”

Do not fill brackets with estimates. Do not write “built the entire full-stack application from scratch” if you used this frontend unchanged. Do not claim real payment integration, production users, revenue or scale. A strong honest project is more useful than inflated numbers.

## Questions you should be able to answer without reading code

- Why ModelViewSet and routers? Which actions/methods did you restrict, and why?
- Why separate read/write serializers? How did you prevent mass assignment and nested child-ID injection?
- Why is get_queryset() part of security? What doesn't an object permission check protect?
- How are variant stock and base stock different? Can two buyers purchase the final unit?
- What does transaction.atomic() guarantee? What does it not guarantee under your database's isolation level?
- Why is select_for_update() behavior different on SQLite? What proof do you have on PostgreSQL?
- What happens if the order is saved but the network response is lost? How does your idempotency key work?
- What happens if a coupon's last redemption is used concurrently? What happens on cancellation?
- Why store order snapshots? What happens when an address or product is deleted?
- How are decimals rounded? Why is cart_total advisory? What changes for paid shipping or real tax?
- Why can frontend route protection never enforce data security?
- Where are tokens stored, what can XSS do, and how would HttpOnly cookies change CSRF handling?
- How did you identify N+1 queries? How do pagination and ordering affect correctness?
- What must change before this becomes a production store (real payment provider, operational controls, session policy, financial rules)?

## Meaningful extensions after the base project

Pick one or two and own them end to end: visual variant/image editors with uploads; paginated searchable taxonomy selects; inventory audit trail; PostgreSQL concurrent checkout tests; measured query budgets; accessible saved searches; versioned checkout quotes. Add API documentation, tests and a decision record for each. A small feature with sound engineering is stronger than a long list of untested integrations.
