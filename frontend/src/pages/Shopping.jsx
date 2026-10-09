import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, ShoppingBag } from "lucide-react";
import {
  addressesApi,
  cartApi,
  couponsApi,
  ordersApi,
  wishlistApi,
} from "../api/services";
import { useQuery } from "../hooks/useQuery";
import { useStore } from "../context/Store";
import {
  EmptyState,
  Field,
  MutationStatus,
  PageHeading,
  Pagination,
  ProductImage,
  QueryState,
  useMutation,
} from "../components/UI";
import { money } from "../utils/format";
export function PriceSummary({ cart, children }) {
  return (
    <aside className="panel summary">
      <span className="eyebrow">THE DETAILS</span>
      <h2>Your bag, considered.</h2>
      <div>
        <span>Subtotal</span>
        <span>{money(cart.subtotal)}</span>
      </div>
      <div>
        <span>Discount</span>
        <span>−{money(cart.discount)}</span>
      </div>
      {cart.shipping_charge != null && (
        <div>
          <span>Shipping</span>
          <span>{money(cart.shipping_charge)}</span>
        </div>
      )}
      {cart.tax != null && (
        <div>
          <span>Tax</span>
          <span>{money(cart.tax)}</span>
        </div>
      )}
      <div className="summary-total">
        <strong>Total</strong>
        <strong>{money(cart.total)}</strong>
      </div>
      {children}
    </aside>
  );
}
function CartRow({ item, refresh }) {
  const [quantity, setQuantity] = useState(item.quantity),
    mutation = useMutation();
  return (
    <article className="cart-row">
      <Link to={`/products/${item.product.id}`}>
        <ProductImage product={item.product} />
      </Link>
      <div className="cart-info">
        <Link to={`/products/${item.product.id}`}>
          <h3>{item.product.name}</h3>
        </Link>
        <p>
          {item.variant?.name || "Standard"} · {money(item.unit_price)} each
        </p>
        <div className="inline">
          <Field
            label="Quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
          <button
            className="text-button"
            disabled={
              mutation.pending || quantity < 1 || !Number.isInteger(quantity)
            }
            onClick={() =>
              mutation.run(() => cartApi.update(item.id, quantity), refresh)
            }
          >
            Update
          </button>
          <button
            className="text-button"
            disabled={mutation.pending}
            onClick={() => mutation.run(() => cartApi.remove(item.id), refresh)}
          >
            Remove
          </button>
        </div>
        <MutationStatus mutation={mutation} />
      </div>
      <strong>{money(item.total_price)}</strong>
    </article>
  );
}
export function CartPage() {
  const { refreshCart } = useStore(),
    query = useQuery(refreshCart, []);
  return (
    <div className="wrap page">
      <PageHeading title="Good things in your bag." eyebrow="YOUR SHOPPING BAG">
        <Link className="text-link" to="/products">
          Keep exploring <ArrowRight size={18} />
        </Link>
      </PageHeading>
      <QueryState query={query}>
        {(cart) =>
          cart.items.length ? (
            <div className="shopping-layout">
              <div>
                {cart.items.map((item) => (
                  <CartRow
                    key={`${item.id}-${item.quantity}`}
                    item={item}
                    refresh={query.reload}
                  />
                ))}
              </div>
              <PriceSummary cart={cart}>
                <Link className="button full" to="/checkout">
                  Continue to checkout <ArrowRight size={16} />
                </Link>
                <p className="muted">
                  <Lock size={13} /> Final totals are verified by the store.
                </p>
              </PriceSummary>
            </div>
          ) : (
            <EmptyState
              title="Your bag has room for something good."
              to="/products"
            />
          )
        }
      </QueryState>
    </div>
  );
}
export function WishlistPage() {
  const { refreshWishlist, refreshCart } = useStore(),
    query = useQuery(refreshWishlist, []),
    mutation = useMutation(),
    navigate = useNavigate();
  return (
    <div className="wrap page">
      <PageHeading title="Worth saving for later." eyebrow="YOUR WISHLIST" />
      <MutationStatus mutation={mutation} />
      <QueryState query={query}>
        {(wishlist) =>
          wishlist.items.length ? (
            <div className="product-grid">
              {wishlist.items.map((item) => (
                <article className="product-card" key={item.id}>
                  <Link to={`/products/${item.product.id}`}>
                    <div className="product-image">
                      <ProductImage product={item.product} />
                    </div>
                    <h3>{item.product.name}</h3>
                  </Link>
                  <div className="inline">
                    <button
                      disabled={mutation.pending}
                      onClick={() => {
                        if (item.product.variants.length)
                          return navigate(`/products/${item.product.id}`);
                        mutation.run(async () => {
                          await cartApi.add({
                            product_id: item.product.id,
                            variant_id: null,
                            quantity: 1,
                          });
                          await refreshCart();
                          await wishlistApi.remove(item.id);
                        }, query.reload);
                      }}
                    >
                      <ShoppingBag size={15} /> Move to bag
                    </button>
                    <button
                      className="text-button"
                      disabled={mutation.pending}
                      onClick={() =>
                        mutation.run(
                          () => wishlistApi.remove(item.id),
                          query.reload,
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Keep your favourites close." to="/products" />
          )
        }
      </QueryState>
    </div>
  );
}
function CheckoutForm({ cart }) {
  const [addressPage, setAddressPage] = useState(1),
    addresses = useQuery(
      () => addressesApi.list({ page: addressPage }),
      [addressPage],
    );
  const [addressId, setAddressId] = useState(""),
    [method, setMethod] = useState("COD"),
    [code, setCode] = useState(""),
    [coupon, setCoupon] = useState(null);
  const mutation = useMutation(),
    couponMutation = useMutation(),
    navigate = useNavigate(),
    { refreshCart } = useStore();
  // The key survives a network retry within this checkout, but resets when the payload changes.
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const invalidate = () => setRequestKey(crypto.randomUUID());
  return (
    <div className="shopping-layout">
      <div>
        <section className="panel">
          <h2>01 / A place to land</h2>
          <QueryState query={addresses}>
            {(data) => (
              <>
                {data.results.map((a) => (
                  <label className="address-choice" key={a.id}>
                    <input
                      type="radio"
                      name="address"
                      checked={addressId === String(a.id)}
                      onChange={() => {
                        setAddressId(String(a.id));
                        invalidate();
                      }}
                    />
                    <span>
                      <strong>{a.full_name}</strong>
                      <br />
                      {a.address_line_1}, {a.city}, {a.postal_code}
                    </span>
                  </label>
                ))}
                {!data.results.length && (
                  <p>Add an address before placing your order.</p>
                )}
                <Pagination
                  data={data}
                  page={addressPage}
                  onChange={setAddressPage}
                />
              </>
            )}
          </QueryState>
          <Link to="/profile/addresses/new">Add a shipping address</Link>
        </section>
        <section className="panel">
          <h2>02 / Make it yours</h2>
          {[
            ["COD", "Pay on delivery"],
            ["CARD_SIMULATION", "Simulated card payment"],
          ].map(([value, label]) => (
            <label className="address-choice" key={value}>
              <input
                type="radio"
                name="payment"
                checked={method === value}
                onChange={() => {
                  setMethod(value);
                  invalidate();
                }}
              />
              {label}
            </label>
          ))}
          <p className="muted">
            This is an educational checkout. No real card details or payments
            are collected.
          </p>
        </section>
        <section className="panel">
          <h2>03 / A little extra</h2>
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              couponMutation.run(
                () => couponsApi.validate({ code, cart_total: cart.subtotal }),
                (result) => {
                  setCoupon(result.valid ? result : null);
                  invalidate();
                  couponMutation.setMessage(result.message);
                },
              );
            }}
          >
            <Field
              label="Coupon code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setCoupon(null);
                invalidate();
              }}
            />
            <button
              className="secondary"
              disabled={couponMutation.pending || !code.trim()}
            >
              Check code
            </button>
          </form>
          <MutationStatus mutation={couponMutation} />
          {coupon && (
            <p className="success">
              Estimated saving: {money(coupon.discount)}. Revalidated when you
              place your order.
            </p>
          )}
        </section>
      </div>
      <PriceSummary cart={cart}>
        {cart.items.map((item) => (
          <p key={item.id}>
            {item.quantity} × {item.product.name}
          </p>
        ))}
        <p className="muted">
          The bag total above is before checkout coupon, shipping, and tax. The
          backend calculates the final order total using its published pricing
          rules.
        </p>
        <MutationStatus mutation={mutation} />
        <button
          className="full"
          disabled={!addressId || mutation.pending || couponMutation.pending}
          onClick={() =>
            mutation.run(
              () =>
                ordersApi.create({
                  address_id: Number(addressId),
                  payment_method: method,
                  coupon_code: coupon?.code || "",
                  idempotency_key: requestKey,
                }),
              async (order) => {
                refreshCart().catch(() => {});
                navigate(`/orders/${order.id}/success`, { replace: true });
              },
            )
          }
        >
          {mutation.pending ? "Placing your order…" : "Place order"}
          <ArrowRight size={16} />
        </button>
      </PriceSummary>
    </div>
  );
}
export function CheckoutPage() {
  const query = useQuery(cartApi.get, []);
  return (
    <div className="wrap page">
      <PageHeading title="Almost at your doorstep." eyebrow="CHECKOUT" />
      <QueryState query={query}>
        {(cart) =>
          cart.items.length ? (
            <CheckoutForm cart={cart} />
          ) : (
            <EmptyState title="Your bag is empty." to="/products" />
          )
        }
      </QueryState>
    </div>
  );
}
