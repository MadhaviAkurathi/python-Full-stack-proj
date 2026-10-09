import { Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Layout from "./components/Layout";
import { EmptyState, ProtectedRoute } from "./components/UI";
import { HomePage, ProductListPage } from "./pages/Catalog";
import ProductDetailPage from "./pages/ProductDetail";
import {
  AddressEditPage,
  AddressesPage,
  AuthPage,
  EditProfilePage,
  PasswordPage,
  ProfilePage,
} from "./pages/Account";
import { CartPage, CheckoutPage, WishlistPage } from "./pages/Shopping";
import { OrderDetailPage, OrdersPage } from "./pages/Orders";
import AdminPage from "./pages/Admin";
const protect = (page) => <ProtectedRoute>{page}</ProtectedRoute>;
export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductListPage />} />
        <Route path="search" element={<ProductListPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="login" element={<AuthPage key="login" />} />
        <Route path="register" element={<AuthPage key="register" register />} />
        <Route path="cart" element={protect(<CartPage />)} />
        <Route path="wishlist" element={protect(<WishlistPage />)} />
        <Route path="checkout" element={protect(<CheckoutPage />)} />
        <Route path="orders" element={protect(<OrdersPage />)} />
        <Route path="orders/:id" element={protect(<OrderDetailPage />)} />
        <Route
          path="orders/:id/success"
          element={protect(<OrderDetailPage success />)}
        />
        <Route path="profile" element={protect(<ProfilePage />)} />
        <Route path="profile/edit" element={protect(<EditProfilePage />)} />
        <Route path="profile/password" element={protect(<PasswordPage />)} />
        <Route path="profile/addresses" element={protect(<AddressesPage />)} />
        <Route
          path="profile/addresses/new"
          element={protect(<AddressEditPage />)}
        />
        <Route
          path="profile/addresses/:id/edit"
          element={protect(<AddressEditPage />)}
        />
        <Route
          path="admin/:resource"
          element={
            <ProtectedRoute admin>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <div className="wrap page">
              <EmptyState
                title="A little off the beaten path."
                text="We couldn’t find that page. Let’s get you back to something good."
                to="/"
                action="Back to home"
              />
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
