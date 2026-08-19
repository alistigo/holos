export interface User {
  id: string;
  pseudo: string;
  avatar: string; // data URL (svg or base64 jpg/png/svg)
}

export function serializeUser(user: User): Record<string, string> {
  return { id: user.id, pseudo: user.pseudo, avatar: user.avatar };
}

// fallow-ignore-next-line complexity
export function deserializeUser(raw: unknown): User | null {
  if (
    raw === null ||
    typeof raw !== "object" ||
    !("id" in raw) ||
    !("pseudo" in raw) ||
    !("avatar" in raw)
  ) {
    return null;
  }
  const { id, pseudo, avatar } = raw as Record<string, unknown>;
  if (typeof id !== "string" || typeof pseudo !== "string" || typeof avatar !== "string") {
    return null;
  }
  return { id, pseudo, avatar };
}
