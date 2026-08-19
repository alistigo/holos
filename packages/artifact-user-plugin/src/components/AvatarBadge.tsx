import type React from "react";
import { createPortal } from "react-dom";
import { useUserContext } from "../context.js";
import { useUser } from "../hooks.js";
import { UserEditModal } from "./UserEditModal.js";

interface AvatarBadgeProps {
  onToggle: () => void;
}

export function AvatarBadge({ onToggle }: AvatarBadgeProps): React.JSX.Element {
  const user = useUser();
  const { editOpen, setEditOpen } = useUserContext();

  return (
    <>
      <button
        type="button"
        aria-label="User menu"
        onClick={onToggle}
        className="flex items-center gap-2 h-8 cursor-pointer rounded-b-lg border-x border-t border-b border-t-white border-gray-200 bg-white px-2 shadow-md hover:border-gray-400 focus:outline-none"
      >
        <span className="text-xs text-gray-700 max-w-[80px] truncate">{user.pseudo}</span>
        <img src={user.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
      </button>
      {editOpen &&
        createPortal(<UserEditModal onClose={() => setEditOpen(false)} />, document.body)}
    </>
  );
}
