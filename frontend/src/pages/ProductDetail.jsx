import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { productsApi, reviewsApi, cartApi, wishlistApi } from "../api/services";
import { useQuery } from "../hooks/useQuery";
import { useStore } from "../context/Store";
import {
  Field,
  MutationStatus,
  Pagination,
  PriceDisplay,
  ProductImage,
  QueryState,
  RatingStars,
  useMutation,
} from "../components/UI";
import { date, money } from "../utils/format";
function ReviewForm({ product, review, done }) {
  const [form, setForm] = useState(
    review
      ? { rating: review.rating, title: review.title, comment: review.comment }
      : { rating: 5, title: "", comment: "" },
  );
  const mutation = useMutation();
  return (
    <form
      className="panel"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.run(
          () =>
            review
              ? reviewsApi.update(review.id, form)
              : reviewsApi.create({ ...form, product_id: Number(product) }),
          () => {
            setForm({ rating: 5, title: "", comment: "" });
            done();
          },
        );
      }}
    >
      <h3>{review ? "Edit your review" : "Share your experience"}</h3>
      <label className="field">
        Rating
        <select
          value={form.rating}
          onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} stars
            </option>
          ))}
        </select>
      </label>
      {["title", "comment"].map((key) => (
        <Field
          key={key}
          label={key === "title" ? "Review title" : "Your review"}
          type={key === "comment" ? "textarea" : "text"}
          required
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      ))}
      <MutationStatus mutation={mutation} />
      <button disabled={mutation.pending}>
        {mutation.pending ? "Saving…" : "Save review"}
      </button>
      {review && (
        <button type="button" className="secondary" onClick={done}>
          Cancel
        </button>
      )}
    </form>
  );
}
function Reviews({ product }) {
  const [page, setPage] = useState(1),
    [editing, setEditing] = useState(null),
    { user } = useStore();
  const query = useQuery(
      () => reviewsApi.list({ product, page }),
      [product, page],
    ),
    mutation = useMutation();
  return (
    <section className="reviews">
      <h2>From their everyday.</h2>
      <MutationStatus mutation={mutation} />
      <QueryState query={query}>
        {(data) => (
          <>
            {data.results.length === 0 && (
              <p className="muted">No reviews yet. Start the conversation.</p>
            )}
            {data.results.map((review) => (
              <article className="review" key={review.id}>
                <div>
                  <RatingStars value={review.rating} />
                  <span className="muted">
                    {review.user.first_name} · {date(review.created_at)}
                  </span>
                </div>
                <h3>{review.title}</h3>
                <p>{review.comment}</p>
                {review.user.id === user?.id && (
                  <div className="inline">
                    <button
                      className="text-button"
                      onClick={() => setEditing(review)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-button"
                      disabled={mutation.pending}
                      onClick={() =>
                        mutation.run(
                          () => reviewsApi.remove(review.id),
                          query.reload,
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                )}
              </article>
            ))}
            <Pagination data={data} page={page} onChange={setPage} />
          </>
        )}
      </QueryState>
      {user ? (
        <ReviewForm
          key={editing?.id || "new"}
          product={product}
          review={editing}
          done={() => {
            setEditing(null);
            query.reload();
          }}
        />
      ) : (
        <Link to="/login">Sign in to write a review</Link>
      )}
    </section>
  );
}
function ProductContent({ product }) {
  const [variantId, setVariantId] = useState(""),
    [quantity, setQuantity] = useState(1),
    [image, setImage] = useState(null);
  const { user, refreshCart, refreshWishlist } = useStore(),
    navigate = useNavigate(),
    mutation = useMutation();
  const variant = product.variants.find((v) => String(v.id) === variantId),
    stock = variant?.stock ?? product.stock;
  const add = (target) => {
    if (!user)
      return navigate("/login", { state: { from: `/products/${product.id}` } });
    mutation.run(
      async () => {
        if (target === "cart") {
          await cartApi.add({
            product_id: product.id,
            variant_id: variant?.id ?? null,
            quantity,
          });
          await refreshCart();
        } else {
          await wishlistApi.add(product.id);
          await refreshWishlist();
        }
      },
      () =>
        mutation.setMessage(
          target === "cart" ? "Added to your bag." : "Saved to your wishlist.",
        ),
    );
  };
  return (
    <>
      <div className="detail-grid">
        <div>
          <div className="detail-image">
            {image ? (
              <img src={image.image} alt={image.alt_text || product.name} />
            ) : (
              <ProductImage product={product} />
            )}
          </div>
          <div className="thumbnails">
            {product.images.map((i) => (
              <button
                aria-label={`View ${i.alt_text || "product image"}`}
                key={i.id}
                onClick={() => setImage(i)}
              >
                <img src={i.image} alt={i.alt_text || ""} />
              </button>
            ))}
          </div>
        </div>
        <div className="detail-copy">
          <span className="eyebrow">
            {product.brand?.name} / {product.category.name}
          </span>
          <h1>{product.name}</h1>
          <RatingStars
            value={product.average_rating}
            count={product.review_count}
          />
          <div className="detail-price">
            {variant ? (
              money(variant.price)
            ) : (
              <PriceDisplay product={product} />
            )}
          </div>
          <p>{product.short_description}</p>
          {product.variants.length > 0 && (
            <label className="field">
              <span>Choose your variant</span>
              <select
                value={variantId}
                onChange={(e) => {
                  setVariantId(e.target.value);
                  setQuantity(1);
                }}
              >
                <option value="">Select an option</option>
                {product.variants.map((v) => (
                  <option key={v.id} value={v.id} disabled={!v.stock}>
                    {v.name} — {money(v.price)}
                    {!v.stock ? " · sold out" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p className={stock ? "stock" : "muted"}>
            {stock
              ? `${stock} available · Ready for your everyday`
              : "Currently out of stock"}
          </p>
          <Field
            label="Quantity"
            type="number"
            min="1"
            max={stock}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
          <div className="inline">
            <button
              disabled={
                mutation.pending ||
                stock < quantity ||
                quantity < 1 ||
                !Number.isInteger(quantity) ||
                (product.variants.length > 0 && !variant)
              }
              onClick={() => add("cart")}
            >
              <ShoppingBag size={18} /> Add to bag
            </button>
            <button
              className="secondary"
              disabled={mutation.pending}
              onClick={() => add("wishlist")}
            >
              <Heart size={18} /> Save
            </button>
          </div>
          <MutationStatus mutation={mutation} />
          <details open>
            <summary>The details</summary>
            <p className="description">{product.description}</p>
            <small>SKU: {variant?.sku || product.sku}</small>
          </details>
        </div>
      </div>
      <Reviews product={product.id} />
    </>
  );
}
export default function ProductDetailPage() {
  const { id } = useParams(),
    query = useQuery(() => productsApi.get(id), [id]);
  return (
    <div className="wrap page">
      <div className="breadcrumb">
        <Link to="/products">The collection</Link>
        <span>/</span>
        <span>Details</span>
      </div>
      <QueryState query={query}>
        {(product) => <ProductContent key={product.id} product={product} />}
      </QueryState>
    </div>
  );
}
