import type { JSX } from "react";

const MIB = 1024 * 1024;

export type FileStorageFormat = "base64" | "blob" | "arraybuffer";

interface FileEntryBase {
  _type: "file";
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface FileEntryBase64 extends FileEntryBase {
  storageFormat?: "base64";
  data: string;
}

export interface FileEntryBinary extends FileEntryBase {
  storageFormat: "blob" | "arraybuffer";
  data: Blob | ArrayBuffer;
}

export type FileEntry = FileEntryBase64 | FileEntryBinary;

export interface FileUploadFormProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  storageFormat: FileStorageFormat;
  onStorageFormatChange: (fmt: FileStorageFormat) => void;
  maxPerKeyMib?: number;
  availableBytes?: number;
  estimatedBytes: number;
  isFull: boolean;
  isOverPerKey: boolean;
  isOverSpace: boolean;
}

function formatMib(bytes: number): string {
  return `${(bytes / MIB).toFixed(2)} MiB`;
}

// fallow-ignore-next-line complexity
export function FileUploadForm({
  file,
  onFileChange,
  storageFormat,
  onStorageFormatChange,
  maxPerKeyMib = 5,
  availableBytes,
  estimatedBytes,
  isFull,
  isOverPerKey,
  isOverSpace,
}: FileUploadFormProps): JSX.Element {
  const maxSafeFileMib = ((maxPerKeyMib * MIB - 200) * (3 / 4)) / MIB;

  return (
    <div className="flex flex-col gap-3">
      {isFull && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
          <p className="font-semibold mb-0.5">Storage full</p>
          <p>
            This artifact has reached its 17 MiB storage limit. Delete existing keys to free space
            before uploading.
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
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          disabled={isFull}
          className="block w-full text-xs text-gray-700 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {file !== null && (
          <>
            <p className="mt-1 text-[10px] text-gray-400 font-mono truncate">
              {file.type || "application/octet-stream"} · {(file.size / 1024).toFixed(1)} KiB
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400 font-mono">
              ~{formatMib(estimatedBytes)} stored
              {storageFormat === "base64" ? " (base64 encoded)" : " (binary, no overhead)"}
            </p>
          </>
        )}
        {storageFormat === "base64" ? (
          <p className="mt-1 text-[10px] text-gray-400">
            {maxPerKeyMib} MiB/key limit &middot; max safe file ≈ {maxSafeFileMib.toFixed(2)} MiB
          </p>
        ) : (
          <p className="mt-1 text-[10px] text-amber-600">
            {maxPerKeyMib} MiB/key limit &middot; experimental &mdash; window.storage may not
            support binary values
          </p>
        )}
      </div>

      <div>
        <label htmlFor="file-storage-format" className="block text-xs text-gray-500 mb-1">
          Storage format
        </label>
        <select
          id="file-storage-format"
          value={storageFormat}
          onChange={(e) => onStorageFormatChange(e.target.value as FileStorageFormat)}
          className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
        >
          <option value="base64">Base64 (default, +33% size overhead)</option>
          <option value="blob">Blob (experimental, no overhead)</option>
          <option value="arraybuffer">ArrayBuffer (experimental, no overhead)</option>
        </select>
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
            ~{formatMib(estimatedBytes)} needed, only {formatMib(availableBytes)} available. Delete
            some keys to free space.
          </p>
        </div>
      )}
    </div>
  );
}
