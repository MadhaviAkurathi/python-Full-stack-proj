export const endpoints = {
  register: "/auth/register/",
  login: "/auth/login/",
  refresh: "/auth/token/refresh/",
  me: "/auth/me/",
  password: "/auth/change-password/",
  profile: "/profile/",
  products: "/products/",
  categories: "/categories/",
  brands: "/brands/",
  cart: "/cart/",
  cartItems: "/cart/items/",
  wishlist: "/wishlist/",
  wishlistItems: "/wishlist/items/",
  orders: "/orders/",
  reviews: "/reviews/",
  addresses: "/addresses/",
  coupons: "/coupons/validate/",
};
export const detail = (resource, id) =>
  `${endpoints[resource]}${encodeURIComponent(id)}/`;
export const action = (resource, id, name) => `${detail(resource, id)}${name}/`;
