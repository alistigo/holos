import type { KeyValueStore } from "@alistigo/artifact-plugin-api";
import React, { createContext, type ReactNode, useCallback, useContext, useState } from "react";
import { serializeUser, type User } from "./user.js";

interface UserContextValue {
  user: User;
  setUser: (user: User) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export interface UserProviderProps {
  initialUser: User;
  store?: KeyValueStore;
  onUserChanged?: (user: User) => void;
  children: ReactNode;
}

export function UserProvider({
  initialUser,
  store,
  onUserChanged,
  children,
}: UserProviderProps): React.JSX.Element {
  const [user, setUserState] = useState<User>(initialUser);

  const setUser = useCallback(
    (next: User): void => {
      setUserState(next);
      void store?.set("user", serializeUser(next));
      onUserChanged?.(next);
    },
    [store, onUserChanged],
  );

  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
}

export function useUserContext(): UserContextValue {
  const ctx = useContext(UserContext);
  if (ctx === null) {
    throw new Error("useUserContext must be used inside UserProvider");
  }
  return ctx;
}
