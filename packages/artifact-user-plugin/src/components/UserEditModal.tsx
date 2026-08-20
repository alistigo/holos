import { Modal } from "@alistigo/artifact-core-components-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { generateAvatar } from "../generate.js";
import { useSetUser, useUser } from "../hooks.js";
import type { User } from "../user.js";

interface UserEditModalProps {
  onClose: () => void;
}

export function UserEditModal({ onClose }: UserEditModalProps): React.JSX.Element {
  const user = useUser();
  const setUser = useSetUser();
  const userRef = useRef<User>(user);
  userRef.current = user;

  const [pseudo, setPseudo] = useState(user.pseudo);
  const [avatar, setAvatar] = useState(user.avatar);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced auto-save for pseudo — 600 ms after the user stops typing
  useEffect(() => {
    const trimmed = pseudo.trim();
    if (trimmed === "" || trimmed === userRef.current.pseudo) return;
    const timer = setTimeout(() => {
      setUser({ ...userRef.current, pseudo: trimmed });
    }, 600);
    return () => clearTimeout(timer);
  }, [pseudo, setUser]);

  function handleAvatarChange(newAvatar: string): void {
    setAvatar(newAvatar);
    setUser({ ...userRef.current, avatar: newAvatar });
  }

  function handleFile(file: File): void {
    const ALLOWED = ["image/jpeg", "image/png", "image/svg+xml"];
    if (!ALLOWED.includes(file.type)) {
      setError("Only jpg, png, and svg files are accepted.");
      return;
    }
    if (file.size >= 1_000_000) {
      setError("Image must be under 1 MB.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      handleAvatarChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleGenerate(): void {
    setError(null);
    handleAvatarChange(generateAvatar(crypto.randomUUID()));
  }

  return (
    <Modal title="Edit user" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {/* Pseudo input — first */}
        <div className="flex flex-col gap-1">
          <label htmlFor="user-pseudo" className="text-sm font-medium text-gray-700">
            Pseudo
          </label>
          <input
            id="user-pseudo"
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            maxLength={30}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Avatar preview + upload */}
        <div className="flex items-center gap-4">
          <img
            src={avatar}
            alt=""
            className="h-[50px] w-[50px] rounded-full object-cover border border-gray-200"
          />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
            >
              Upload image
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
            >
              Generate new avatar
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        </div>

        {error !== null && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
