import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  SlidersHorizontal,
  Sparkles,
  Truck,
} from "lucide-react";
import {
  productsApi,
  categoriesApi,
  brandsApi,
  listAll,
} from "../api/services";
import { useQuery } from "../hooks/useQuery";
import {
  EmptyState,
  ErrorMessage,
  PageHeading,
  Pagination,
  ProductGrid,
  QueryState,
} from "../components/UI";
function Collection({ title, eyebrow, params, to }) {
  const query = useQuery(() => productsApi.list(params), []);
  return (
    <section className="collection wrap">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <Link className="text-link" to={to}>
          View collection <ArrowUpRight size={18} />
        </Link>
      </div>
      <QueryState query={query}>
        {(data) => <ProductGrid products={data.results.slice(0, 4)} />}
      </QueryState>
    </section>
  );
}
export function HomePage() {
  const categories = useQuery(() => categoriesApi.list({ page: 1 }), []);
  return (
    <>
      <section className="hero wrap">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="tiny-dot" /> THE EVERYDAY COLLECTION
          </span>
          <h1>
            Good things.
            <br />
            For <em>your</em> everyday.
          </h1>
          <p>
            Considered essentials, fresh discoveries, and the little things that
            make life feel more like you.
          </p>
          <Link className="button" to="/products">
            Explore the collection <ArrowRight size={18} />
          </Link>
          <div className="hero-caption">
            <span>01 /</span> A little intention goes a long way.
          </div>
        </div>
        <div
          className="hero-art"
          role="img"
          aria-label="An editorial still life of a sculptural green vase, a terracotta bowl, and a cream pedestal"
        >
          <div className="art-label">
            OBJECTS WITH PURPOSE
            <br />
            <span>THE FORM & FIELD EDIT</span>
          </div>
          <div className="sun-circle" />
          <div className="plinth" />
          <div className="vase">
            <i />
            <b />
          </div>
          <div className="bowl" />
          <div className="art-caption">
            Simple forms.
            <br />
            <em>Endless possibilities.</em>
            <ArrowUpRight size={24} />
          </div>
          <span className="art-index">F&F — VOL. 01</span>
        </div>
      </section>
      <div className="benefits wrap">
        <div>
          <Box />
          <span>
            Thoughtfully curated<small>Find your kind of everyday</small>
          </span>
        </div>
        <div>
          <Truck />
          <span>
            Made for your doorstep<small>Shipping calculated at checkout</small>
          </span>
        </div>
        <div>
          <Sparkles />
          <span>
            Details that make a difference
            <small>A fresh perspective on essentials</small>
          </span>
        </div>
      </div>
      <section className="wrap category-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FOLLOW YOUR CURIOSITY</span>
            <h2>Find your corner.</h2>
          </div>
          <Link className="text-link" to="/products">
            Shop everything <ArrowUpRight size={18} />
          </Link>
        </div>
        <QueryState query={categories}>
          {(data) =>
            data.results.length ? (
              <div className="categories">
                {data.results.map((c, i) => (
                  <Link
                    to={`/products?category=${c.id}`}
                    key={c.id}
                    className={`category category-${i % 4}`}
                  >
                    {c.image ? <img src={c.image} alt="" /> : <Box size={32} />}
                    <div>
                      <h3>{c.name}</h3>
                      <ArrowUpRight size={20} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="The collection is taking shape"
                text="Categories will appear here when added to the store."
              />
            )
          }
        </QueryState>
      </section>
      <Collection
        title="Worth a closer look."
        eyebrow="THE CONSIDERED EDIT"
        params={{ is_featured: true }}
        to="/products?is_featured=true"
      />
      <section className="editorial wrap">
        <span className="eyebrow">LESS, BUT BETTER.</span>
        <h2>
          Surround yourself with
          <br />
          things that <em>feel like you.</em>
        </h2>
        <Link className="text-link" to="/products?ordering=-created_at">
          Discover something new <ArrowRight size={18} />
        </Link>
        <div className="editorial-mark">
          f<span>&</span>f
        </div>
      </section>
      <Collection
        title="Fresh perspectives."
        eyebrow="JUST ARRIVED"
        params={{ ordering: "-created_at" }}
        to="/products?ordering=-created_at"
      />
      <Collection
        title="A few crowd favourites."
        eyebrow="HIGHLY RATED"
        params={{ ordering: "-average_rating" }}
        to="/products?ordering=-average_rating"
      />
      <Collection
        title="Good finds, better prices."
        eyebrow="A LITTLE SOMETHING EXTRA"
        params={{ on_sale: true }}
        to="/products?on_sale=true"
      />
    </>
  );
}
export function ProductListPage() {
  const [params, setParams] = useSearchParams();
  const query = useQuery(
    () => productsApi.list(Object.fromEntries(params)),
    [params.toString()],
  );
  const categories = useQuery(() => listAll(categoriesApi), []),
    brands = useQuery(() => listAll(brandsApi), []);
  const update = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };
  return (
    <div className="wrap page">
      <PageHeading
        eyebrow="A WORLD OF EVERYDAY POSSIBILITIES"
        title={
          params.get("search")
            ? `Results for “${params.get("search")}”`
            : "The collection."
        }
      />
      <div className="catalog-layout">
        <aside className="filters">
          <h3>
            <SlidersHorizontal size={17} /> Refine your finds
          </h3>
          <label className="field">
            <span>Category</span>
            <select
              value={params.get("category") || ""}
              onChange={(e) => update("category", e.target.value)}
            >
              <option value="">All categories</option>
              {categories.data?.results.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <ErrorMessage error={categories.error} retry={categories.reload} />
          <label className="field">
            <span>Brand</span>
            <select
              value={params.get("brand") || ""}
              onChange={(e) => update("brand", e.target.value)}
            >
              <option value="">All brands</option>
              {brands.data?.results.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <ErrorMessage error={brands.error} retry={brands.reload} />
          <label className="field">
            <span>Minimum price (₹)</span>
            <input
              type="number"
              min="0"
              value={params.get("min_price") || ""}
              onChange={(e) => update("min_price", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Maximum price (₹)</span>
            <input
              type="number"
              min="0"
              value={params.get("max_price") || ""}
              onChange={(e) => update("max_price", e.target.value)}
            />
          </label>
          {[
            ["in_stock", "In stock only"],
            ["is_featured", "Featured finds"],
            ["on_sale", "On sale"],
          ].map(([key, label]) => (
            <label className="check" key={key}>
              <input
                type="checkbox"
                checked={params.get(key) === "true"}
                onChange={(e) => update(key, e.target.checked ? "true" : "")}
              />
              {label}
            </label>
          ))}
          <button className="text-button" onClick={() => setParams({})}>
            Clear all filters
          </button>
          <p className="muted">
            Thoughtful choices start with a little curiosity.
          </p>
        </aside>
        <div>
          <div className="results-toolbar">
            <span>
              {query.data
                ? `${query.data.count} finds`
                : "Explore the collection"}
            </span>
            <select
              aria-label="Sort products"
              value={params.get("ordering") || "-created_at"}
              onChange={(e) => update("ordering", e.target.value)}
            >
              <option value="-created_at">Newest first</option>
              <option value="price">Price: low to high</option>
              <option value="-price">Price: high to low</option>
              <option value="name">Name: A to Z</option>
              <option value="-average_rating">Highest rated</option>
            </select>
          </div>
          <QueryState query={query}>
            {(data) => (
              <>
                <ProductGrid products={data.results} />
                <Pagination
                  data={data}
                  page={Number(params.get("page") || 1)}
                  onChange={(page) => update("page", String(page))}
                />
              </>
            )}
          </QueryState>
        </div>
      </div>
    </div>
  );
}
