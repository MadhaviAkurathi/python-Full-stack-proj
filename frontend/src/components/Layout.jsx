import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { useStore } from "../context/Store";
export default function Layout() {
  const { user, logout, cart } = useStore(),
    navigate = useNavigate();
  const [search, setSearch] = useState(""),
    [menu, setMenu] = useState(false);
  return (
    <>
      <div className="announcement">
        Good things. Thoughtfully chosen.{" "}
        <span>
          Discover your everyday essentials <ArrowUpRight size={12} />
        </span>
      </div>
      <header>
        <div className="navbar wrap">
          <Link to="/" className="wordmark">
            form<span>&</span>field<span className="brand-dot">®</span>
          </Link>
          <form
            className="search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/search?search=${encodeURIComponent(search)}`);
            }}
          >
            <Search size={18} />
            <input
              aria-label="Search products"
              placeholder="Find something you’ll love"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <kbd>↵</kbd>
          </form>
          <div className="nav-actions">
            <Link to={user ? "/profile" : "/login"} aria-label="Your account">
              <User size={21} />
            </Link>
            <Link to="/wishlist" aria-label="Wishlist">
              <Heart size={21} />
            </Link>
            <Link to="/cart" className="bag" aria-label="Shopping bag">
              <ShoppingBag size={21} />
              {cart?.items?.length > 0 && <small>{cart.items.length}</small>}
            </Link>
            <button
              className="mobile-menu icon-button"
              aria-label="Toggle menu"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        <nav
          className={`navlinks wrap ${menu ? "open" : ""}`}
          onClick={() => setMenu(false)}
        >
          <NavLink to="/products">Shop all</NavLink>
          <Link to="/products?ordering=-created_at">
            New arrivals <span className="tiny-dot" />
          </Link>
          <Link to="/products?is_featured=true">The considered edit</Link>
          <Link to="/products?on_sale=true" className="sale-link">
            Good finds
          </Link>
          <div className="nav-spacer" />
          <Link to="/orders">My orders</Link>
          {user?.is_staff && <Link to="/admin/products">Manage store</Link>}
          {user && (
            <button className="text-button" onClick={logout}>
              Sign out
            </button>
          )}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        <div className="wrap footer-main">
          <div>
            <Link className="wordmark" to="/">
              form<span>&</span>field
            </Link>
            <p>
              Less searching. More finding.
              <br />
              Good things for the way you live.
            </p>
          </div>
          <div>
            <h4>Make yourself at home</h4>
            <Link to="/products">Explore the collection</Link>
            <Link to="/products?is_featured=true">The considered edit</Link>
            <Link to="/products?on_sale=true">Good finds</Link>
          </div>
          <div>
            <h4>Your corner</h4>
            <Link to="/profile">My account</Link>
            <Link to="/orders">Orders & tracking</Link>
            <Link to="/profile/addresses">Saved addresses</Link>
          </div>
          <div className="footer-note">
            <span className="eyebrow">A LITTLE MORE INTENTION</span>
            <p>
              Everyday objects.
              <br />
              Extraordinary possibilities.
            </p>
            <ArrowUpRight />
          </div>
        </div>
        <div className="wrap footer-bottom">
          <span>© {new Date().getFullYear()} Form & Field</span>
          <span>Educational storefront · Simulated payments only</span>
          <span>Everyday, considered.</span>
        </div>
      </footer>
    </>
  );
}
