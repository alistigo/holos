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
      <svg
        viewBox="0 0 16 16"
        fill="none"
        className="h-4 w-4 shrink-0 text-gray-500"
        aria-hidden="true"
      >
        <path
          d="M11.013 2.513a1.75 1.75 0 012.475 2.475L5.75 12.726l-3.5.99.99-3.5L11.013 2.513z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Edit user
    </button>
  );
}
