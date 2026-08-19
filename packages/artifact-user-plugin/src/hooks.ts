import { useCallback } from "react";
import { useUserContext } from "./context.js";
import { generateAvatar } from "./generate.js";
import type { User } from "./user.js";

export function useUser(): User {
  return useUserContext().user;
}

export function useSetUser(): (user: User) => void {
  return useUserContext().setUser;
}

// fallow-ignore-next-line unused-export
export function useRegenerateAvatar(): () => void {
  const { user, setUser } = useUserContext();
  return useCallback(() => {
    const newId = crypto.randomUUID();
    setUser({ ...user, id: newId, avatar: generateAvatar(newId) });
  }, [user, setUser]);
}

// fallow-ignore-next-line unused-export
export function useEditOpen(): [boolean, (v: boolean) => void] {
  const { editOpen, setEditOpen } = useUserContext();
  return [editOpen, setEditOpen];
}
