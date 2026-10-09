import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Heart,
  Package,
  RefreshCw,
  Star,
} from "lucide-react";
import { errorMessage } from "../api/axiosClient";
import { useStore } from "../context/Store";
import { money, price } from "../utils/format";
export function LoadingSpinner() {
  return (
    <div className="state" role="status">
      <RefreshCw className="spin" size={22} />
      <p>Bringing things together…</p>
    </div>
  );
}
export function ErrorMessage({ error, retry }) {
  return (
    error && (
      <div className="error" role="alert">
        <AlertCircle size={20} />
        <div>
          <strong>We couldn’t complete that request</strong>
          <p>{errorMessage(error)}</p>
          {retry && (
            <button className="text-button" onClick={retry}>
              Try again <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>
    )
  );
}
export function EmptyState({
  title = "Nothing here yet",
  text = "Your next discovery is waiting.",
  to,
  action = "Explore the collection",
}) {
  return (
    <div className="state">
      <Package size={32} />
      <h3>{title}</h3>
      <p>{text}</p>
      {to && (
        <Link className="button" to={to}>
          {action} <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function QueryState({ query, children, empty }) {
  if (query.loading) return <LoadingSpinner />;
  if (query.error)
    return <ErrorMessage error={query.error} retry={query.reload} />;
  if (empty?.(query.data)) return <EmptyState />;
  return children(query.data);
}
export function ProtectedRoute({ children, admin = false }) {
  const { user, ready } = useStore(),
    location = useLocation();
  if (!ready) return <LoadingSpinner />;
  if (!user)
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  if (admin && !user.is_staff)
    return <EmptyState title="This space is for store administrators" to="/" />;
  return children;
}
export function RatingStars({ value = 0, count }) {
  return (
    <span className="rating">
      <Star size={13} fill="currentColor" /> {Number(value).toFixed(1)}
      {count !== undefined && <span> ({count})</span>}
    </span>
  );
}
export function PriceDisplay({ product }) {
  return (
    <span className="price">
      {money(price(product))}{" "}
      {product.discount_price != null && <del>{money(product.price)}</del>}
    </span>
  );
}
export function ProductImage({ product, className = "" }) {
  const [failed, setFailed] = useState(false);
  const image =
    product.images?.find((i) => i.is_primary) || product.images?.[0];
  return image && !failed ? (
    <img
      className={className}
      src={image.image}
      alt={image.alt_text || product.name}
      onError={() => setFailed(true)}
    />
  ) : (
    <div className={`image-placeholder ${className}`}>
      <Package size={40} />
      <span>Image coming soon</span>
    </div>
  );
}
export function ProductCard({ product }) {
  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-image">
        <ProductImage product={product} />
        {product.discount_price != null && (
          <span className="badge">A little less, a lot to love</span>
        )}
      </Link>
      <div className="product-meta">
        <span>{product.category?.name}</span>
        <RatingStars value={product.average_rating} />
      </div>
      <Link to={`/products/${product.id}`}>
        <h3>{product.name}</h3>
      </Link>
      <PriceDisplay product={product} />
    </article>
  );
}
export function ProductGrid({ products }) {
  return products.length ? (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  ) : (
    <EmptyState
      title="No products found"
      text="Try another search or change your filters."
    />
  );
}
export function Pagination({ data, page, onChange }) {
  return (
    <div className="pagination">
      <button disabled={!data.previous} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span>
        Page {page} · {data.count} results
      </span>
      <button disabled={!data.next} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  );
}
export function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
  ...props
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {type === "textarea" ? (
        <textarea
          name={name}
          value={value ?? ""}
          onChange={onChange}
          required={required}
          {...props}
        />
      ) : (
        <input
          name={name}
          type={type}
          value={value ?? ""}
          onChange={onChange}
          required={required}
          {...props}
        />
      )}
    </label>
  );
}
export function PageHeading({ eyebrow, title, children }) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow || "FORM & FIELD"}</span>
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  );
}
export function useMutation() {
  const [pending, setPending] = useState(false),
    [error, setError] = useState(null),
    [message, setMessage] = useState("");
  const run = async (fn, success) => {
    setPending(true);
    setError(null);
    setMessage("");
    try {
      const data = await fn();
      if (success) await success(data);
      return true;
    } catch (e) {
      setError(e);
      return false;
    } finally {
      setPending(false);
    }
  };
  return { pending, error, message, setMessage, run };
}
export function MutationStatus({ mutation }) {
  return (
    <>
      <ErrorMessage error={mutation.error} />
      {mutation.message && (
        <p className="success" role="status">
          {mutation.message}
        </p>
      )}
    </>
  );
}
