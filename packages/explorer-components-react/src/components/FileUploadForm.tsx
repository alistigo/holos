import type { JSX } from "react";
import { useCallback, useState } from "react";

const MIB = 1024 * 1024;

export interface FileEntry {
  _type: "file";
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  data: string;
}

export interface FileUploadFormProps {
  onUpload: (key: string, fileEntry: FileEntry, shared: boolean) => Promise<void>;
  onCancel: () => void;
  /** Per-key size ceiling in MiB (exclusive). Default: 5 */
  maxPerKeyMib?: number;
  /** Free bytes remaining in the artifact before hitting the 17 MiB total cap. */
  availableBytes?: number;
  /** When provided, the shared checkbox is hidden and this value is used instead. */
  externalShared?: boolean;
  /** When true, the form header bar is not rendered (use when embedding inside another panel). */
  hideHeader?: boolean;
}

function estimateStoredBytes(file: File): number {
  return Math.ceil(file.size / 3) * 4 + 200;
}

function formatMib(bytes: number): string {
  return `${(bytes / MIB).toFixed(2)} MiB`;
}

// fallow-ignore-next-line complexity
export function FileUploadForm({
  onUpload,
  onCancel,
  maxPerKeyMib = 5,
  availableBytes,
  externalShared,
  hideHeader,
}: FileUploadFormProps): JSX.Element {
  const [file, setFile] = useState<File | null>(null);
  const [key, setKey] = useState("");
  const [internalShared, setInternalShared] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const showSharedCheckbox = externalShared === undefined;

  const maxPerKeyBytes = maxPerKeyMib * MIB;
  const estimatedBytes = file !== null ? estimateStoredBytes(file) : 0;

  const isFull = availableBytes !== undefined && availableBytes <= 0;
  const isOverPerKey = file !== null && estimatedBytes >= maxPerKeyBytes;
  const isOverSpace =
    !isFull && file !== null && availableBytes !== undefined && estimatedBytes > availableBytes;

  const canStore =
    file !== null && key.trim() !== "" && !isUploading && !isFull && !isOverPerKey && !isOverSpace;

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    if (selected !== null) {
      setKey((prev) => (prev.trim() === "" ? selected.name : prev));
    }
  }, []);

  const handleStore = useCallback(() => {
    if (file === null || key.trim() === "") return;
    setIsUploading(true);
    const currentShared = externalShared !== undefined ? externalShared : internalShared;
    const reader = new FileReader();
    reader.onload = () => {
      const entry: FileEntry = {
        _type: "file",
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        uploadedAt: new Date().toISOString(),
        data: reader.result as string,
      };
      void onUpload(key.trim(), entry, currentShared).finally(() => {
        setIsUploading(false);
        onCancel();
      });
    };
    reader.readAsDataURL(file);
  }, [file, key, externalShared, internalShared, onUpload, onCancel]);

  const maxSafeFileMib = ((maxPerKeyBytes - 200) * (3 / 4)) / MIB;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {!hideHeader && (
        <div className="shrink-0 flex items-center justify-between px-2 py-1 border-b border-gray-100 bg-gray-50">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Upload file
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-xs px-1 py-0.5 rounded hover:bg-gray-200 transition-colors"
            aria-label="Cancel upload"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 p-3 overflow-auto">
        {isFull && (
          <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
            <p className="font-semibold mb-0.5">Storage full</p>
            <p>
              This artifact has reached its {17} MiB storage limit. Delete existing keys to free
              space before uploading.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="file-upload-input" className="block text-xs text-gray-500 mb-1">
            File
          </label>
          <input
            id="file-upload-input"
            type="file"
            onChange={handleFileChange}
            disabled={isFull}
            className="block w-full text-xs text-gray-700 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {file !== null && (
            <>
              <p className="mt-1 text-[10px] text-gray-400 font-mono truncate">
                {file.type || "application/octet-stream"} · {(file.size / 1024).toFixed(1)} KiB
              </p>
              <p className="mt-0.5 text-[10px] text-gray-400 font-mono">
                ~{formatMib(estimatedBytes)} stored (base64 encoded)
              </p>
            </>
          )}
          <p className="mt-1 text-[10px] text-gray-400">
            {maxPerKeyMib} MiB/key limit &middot; max safe file ≈ {maxSafeFileMib.toFixed(2)} MiB
          </p>
        </div>

        {isOverPerKey && (
          <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
            <p className="font-semibold mb-0.5">File too large</p>
            <p>
              Estimated stored size ~{formatMib(estimatedBytes)} exceeds the {maxPerKeyMib} MiB
              per-key limit. Choose a smaller file.
            </p>
          </div>
        )}

        {isOverSpace && availableBytes !== undefined && (
          <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <p className="font-semibold mb-0.5">Not enough space</p>
            <p>
              ~{formatMib(estimatedBytes)} needed, only {formatMib(availableBytes)} available.
              Delete some keys to free space.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="file-upload-key" className="block text-xs text-gray-500 mb-1">
            Storage key
            <span className="ml-1 text-gray-400 font-normal">(defaults to filename)</span>
          </label>
          <input
            id="file-upload-key"
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="e.g. my-photo.png"
            className="w-full text-xs font-mono border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>

        {showSharedCheckbox && (
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={internalShared}
              onChange={(e) => setInternalShared(e.target.checked)}
              className="accent-purple-500"
            />
            Shared (accessible by all users on this artifact URL)
          </label>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleStore}
            disabled={!canStore}
            className="flex-1 text-xs py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isUploading ? "Storing…" : "Store"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
