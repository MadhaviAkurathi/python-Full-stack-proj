import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import axios, { AxiosError } from "axios";

// Isolated adapters verify frontend transport only. No test fixtures are bundled in the app.
let clients;
const response = (config, data, status = 200) => ({
  config,
  data,
  status,
  statusText: "OK",
  headers: {},
});
const unauthorized = (config) =>
  Promise.reject(
    new AxiosError(
      "Unauthorized",
      "ERR_BAD_REQUEST",
      config,
      null,
      response(config, { detail: "Expired" }, 401),
    ),
  );
beforeEach(() => {
  vi.resetModules();
  const storage = new Map();
  vi.stubGlobal("sessionStorage", {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  });
  vi.stubGlobal("window", { dispatchEvent: vi.fn() });
  const create = axios.create.bind(axios);
  clients = [];
  vi.spyOn(axios, "create").mockImplementation((options) => {
    const client = create(options);
    clients.push(client);
    return client;
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("JWT transport", () => {
  it("deduplicates simultaneous refresh and retries each original request with the new token", async () => {
    const { api, tokens } = await import("../axiosClient");
    tokens.set({ access: "expired", refresh: "refresh-one" });
    let refreshCalls = 0;
    clients[1].defaults.adapter = async (config) => {
      refreshCalls++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return response(config, { access: "renewed", refresh: "rotated" });
    };
    api.defaults.adapter = (config) =>
      config.headers.Authorization === "Bearer renewed"
        ? Promise.resolve(response(config, { ok: true }))
        : unauthorized(config);
    const results = await Promise.all([
      api.get("/cart/"),
      api.get("/wishlist/"),
    ]);
    expect(results.every((r) => r.data.ok)).toBe(true);
    expect(refreshCalls).toBe(1);
    expect(tokens.get().refresh).toBe("rotated");
  });
  it("clears credentials and emits expiration when refresh fails", async () => {
    const { api, tokens } = await import("../axiosClient");
    tokens.set({ access: "expired", refresh: "invalid" });
    clients[1].defaults.adapter = unauthorized;
    api.defaults.adapter = unauthorized;
    await expect(api.get("/cart/")).rejects.toThrow("Unauthorized");
    expect(tokens.get()).toBeNull();
    expect(window.dispatchEvent).toHaveBeenCalled();
  });
  it("never refreshes a rejected login or sends an existing access token with credentials", async () => {
    const { api, tokens } = await import("../axiosClient");
    tokens.set({ access: "old", refresh: "old-refresh" });
    clients[1].defaults.adapter = vi.fn();
    api.defaults.adapter = (config) => {
      expect(config.headers.Authorization).toBeUndefined();
      return unauthorized(config);
    };
    await expect(
      api.post("/auth/login/", {
        email: "test@example.com",
        password: "test-only",
      }),
    ).rejects.toThrow();
    expect(clients[1].defaults.adapter).not.toHaveBeenCalled();
  });
  it("limits an expired request to one retry", async () => {
    const { api, tokens } = await import("../axiosClient");
    tokens.set({ access: "expired", refresh: "valid" });
    const refresh = vi.fn(async (config) =>
      response(config, { access: "also-rejected" }),
    );
    clients[1].defaults.adapter = refresh;
    api.defaults.adapter = unauthorized;
    await expect(api.get("/cart/")).rejects.toThrow();
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});

describe("errors and service contract", () => {
  it("preserves nested field validation and distinguishes network outages", async () => {
    const { errorMessage } = await import("../axiosClient");
    expect(
      errorMessage({
        response: {
          data: { quantity: ["Too many."], variants: { sku: ["Duplicate."] } },
        },
      }),
    ).toBe("quantity: Too many. variants: sku: Duplicate.");
    expect(
      errorMessage({ response: { data: { detail: "Not allowed." } } }),
    ).toBe("Not allowed.");
    expect(errorMessage(new Error())).toContain("Backend API is unavailable");
  });
  it("preserves checkout idempotency and uses exact trailing-slash paths", async () => {
    const { api } = await import("../axiosClient");
    const { cartApi, ordersApi, productsApi } = await import("../services");
    const requests = [];
    api.defaults.adapter = async (config) => {
      requests.push(config);
      return response(config, {});
    };
    const body = {
      address_id: 6,
      payment_method: "COD",
      coupon_code: "",
      idempotency_key: "stable-test-key",
    };
    await ordersApi.create(body);
    await cartApi.update(9, 3);
    await ordersApi.pay(21);
    await productsApi.list({ category: 3, ordering: "-price", page: 2 });
    expect(requests.map((r) => [r.method, r.url])).toEqual([
      ["post", "/orders/"],
      ["patch", "/cart/items/9/"],
      ["post", "/orders/21/pay/"],
      ["get", "/products/"],
    ]);
    expect(JSON.parse(requests[0].data)).toEqual(body);
    expect(JSON.parse(requests[1].data)).toEqual({ quantity: 3 });
    expect(requests[3].params).toEqual({
      category: 3,
      ordering: "-price",
      page: 2,
    });
  });
});
