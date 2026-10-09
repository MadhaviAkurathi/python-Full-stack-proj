import { api } from "./axiosClient";
import { endpoints, detail, action } from "./endpoints";
const data = (promise) => promise.then((response) => response.data);
export const resourceApi = (resource) => ({
  list: (params) => data(api.get(endpoints[resource], { params })),
  get: (id) => data(api.get(detail(resource, id))),
  create: (body) => data(api.post(endpoints[resource], body)),
  update: (id, body) => data(api.patch(detail(resource, id), body)),
  remove: (id) => data(api.delete(detail(resource, id))),
});
export const productsApi = resourceApi("products");
export const categoriesApi = resourceApi("categories");
export const brandsApi = resourceApi("brands");
export const reviewsApi = resourceApi("reviews");
export const addressesApi = resourceApi("addresses");
export const ordersApi = {
  ...resourceApi("orders"),
  cancel: (id) => data(api.post(action("orders", id, "cancel"), {})),
  pay: (id) =>
    data(api.post(action("orders", id, "pay"), { method: "CARD_SIMULATION" })),
};
export const authApi = {
  login: (body) => data(api.post(endpoints.login, body)),
  register: (body) => data(api.post(endpoints.register, body)),
  me: () => data(api.get(endpoints.me)),
  password: (body) => data(api.post(endpoints.password, body)),
};
export const profileApi = {
  get: () => data(api.get(endpoints.profile)),
  update: (body) => data(api.patch(endpoints.profile, body)),
};
export const cartApi = {
  get: () => data(api.get(endpoints.cart)),
  add: (body) => data(api.post(endpoints.cartItems, body)),
  update: (id, quantity) =>
    data(api.patch(detail("cartItems", id), { quantity })),
  remove: (id) => data(api.delete(detail("cartItems", id))),
};
export const wishlistApi = {
  get: () => data(api.get(endpoints.wishlist)),
  add: (product_id) => data(api.post(endpoints.wishlistItems, { product_id })),
  remove: (id) => data(api.delete(detail("wishlistItems", id))),
};
export const couponsApi = {
  validate: (body) => data(api.post(endpoints.coupons, body)),
};

// Resolve all taxonomy pages for selectors without trusting server-provided next URLs.
export async function listAll(apiResource) {
  const results = [];
  for (let page = 1; ; page++) {
    const data = await apiResource.list({ page });
    results.push(...data.results);
    if (!data.next)
      return { ...data, results, count: results.length, previous: null };
  }
}
