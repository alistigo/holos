import { createContext, type ReactNode, useCallback, useContext, useState } from "react";

export interface AsyncProgressContextValue {
  startOp: () => () => void;
  pending: boolean;
}

const AsyncProgressContext = createContext<AsyncProgressContextValue | null>(null);

export function AsyncProgressProvider({ children }: { children: ReactNode }): ReactNode {
  const [count, setCount] = useState(0);

  const startOp = useCallback((): (() => void) => {
    setCount((c) => c + 1);
    return () => setCount((c) => c - 1);
  }, []);

  return (
    <AsyncProgressContext.Provider value={{ startOp, pending: count > 0 }}>
      {children}
    </AsyncProgressContext.Provider>
  );
}

export function useAsyncProgress(): AsyncProgressContextValue {
  const ctx = useContext(AsyncProgressContext);
  if (ctx === null) {
    return { startOp: () => () => {}, pending: false };
  }
  return ctx;
}
