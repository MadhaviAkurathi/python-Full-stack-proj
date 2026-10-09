import { useCallback, useEffect, useState } from "react";
export function useQuery(loader, dependencies = []) {
  const [state, setState] = useState({
    loading: true,
    data: null,
    error: null,
  });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ loading: true, data: null, error: null });
    Promise.resolve()
      .then(loader)
      .then((data) => active && setState({ loading: false, data, error: null }))
      .catch(
        (error) => active && setState({ loading: false, data: null, error }),
      );
    return () => {
      active = false;
    };
  }, [...dependencies, version]);
  return { ...state, reload: useCallback(() => setVersion((v) => v + 1), []) };
}
