import { Modal } from "@alistigo/artifact-core-components-react";
import type React from "react";
import { useRef, useState } from "react";
import { generateAvatar } from "../generate.js";
import { useSetUser, useUser } from "../hooks.js";

interface UserEditModalProps {
  onClose: () => void;
}

export function UserEditModal({ onClose }: UserEditModalProps): React.JSX.Element {
  const user = useUser();
  const setUser = useSetUser();
  const [pseudo, setPseudo] = useState(user.pseudo);
  const [avatar, setAvatar] = useState(user.avatar);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleGenerate(): void {
    setError(null);
    setAvatar(generateAvatar(crypto.randomUUID()));
  }

  function handleSave(): void {
    setUser({ ...user, pseudo: pseudo.trim() || user.pseudo, avatar });
    onClose();
  }

  return (
    <Modal title="Edit user" onClose={onClose}>
      <div className="flex flex-col gap-4">
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

        {/* Pseudo input */}
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

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 px-4 py-1.5 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
