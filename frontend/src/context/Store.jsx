import { createContext, useContext, useEffect, useState } from "react";
import { authApi, cartApi, wishlistApi } from "../api/services";
import { tokens } from "../api/axiosClient";
const Store = createContext(null);
export const useStore = () => useContext(Store);
export function StoreProvider({ children }) {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false);
  const [cart, setCart] = useState(null),
    [wishlist, setWishlist] = useState(null);
  const logout = () => {
    tokens.set(null);
    setUser(null);
    setCart(null);
    setWishlist(null);
  };
  useEffect(() => {
    let active = true;
    if (tokens.get())
      authApi
        .me()
        .then((u) => active && setUser(u))
        .catch(() => {
          if (active) logout();
        })
        .finally(() => active && setReady(true));
    else setReady(true);
    window.addEventListener("session-expired", logout);
    return () => {
      active = false;
      window.removeEventListener("session-expired", logout);
    };
  }, []);
  const authenticate = async (mode, body) => {
    const result = await authApi[mode](body);
    tokens.set({ access: result.access, refresh: result.refresh });
    setUser(result.user);
  };
  const refreshCart = async () => {
    const result = await cartApi.get();
    setCart(result);
    return result;
  };
  const refreshWishlist = async () => {
    const result = await wishlistApi.get();
    setWishlist(result);
    return result;
  };
  return (
    <Store.Provider
      value={{
        user,
        setUser,
        ready,
        authenticate,
        logout,
        cart,
        wishlist,
        refreshCart,
        refreshWishlist,
      }}
    >
      {children}
    </Store.Provider>
  );
}
