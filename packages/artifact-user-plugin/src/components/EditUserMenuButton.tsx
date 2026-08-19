import type React from "react";
import { useUserContext } from "../context.js";

export function EditUserMenuButton(): React.JSX.Element {
  const { setEditOpen } = useUserContext();
  return (
    <button
      type="button"
      onClick={() => setEditOpen(true)}
      className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none"
    >
      Edit user
    </button>
  );
}
