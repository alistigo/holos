import type { JSX } from "react";
import { useEffect, useState } from "react";
import type { FileEntry, FileEntryBinary } from "./FileUploadForm.js";

const IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function isBinaryEntry(e: FileEntry): e is FileEntryBinary {
  return e.storageFormat === "blob" || e.storageFormat === "arraybuffer";
}

export interface FileViewerProps {
  entry: { key: string; value: FileEntry; shared: boolean };
}

export function FileViewer({ entry }: FileViewerProps): JSX.Element {
  const { name, mimeType, size, uploadedAt } = entry.value;
  const isImage = IMAGE_MIME_TYPES.has(mimeType);
  const isBinary = isBinaryEntry(entry.value);

  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isBinary) {
      setBlobUrl(null);
      return;
    }
    const rawData = (entry.value as FileEntryBinary).data;
    const blob = rawData instanceof Blob ? rawData : new Blob([rawData], { type: mimeType });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [isBinary, entry.value, mimeType]);

  // For base64 entries, data is a string; for binary, use the object URL
  let displaySrc: string | null;
  if (isBinaryEntry(entry.value)) {
    displaySrc = blobUrl;
  } else {
    displaySrc = entry.value.data;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 flex items-center justify-between px-2 py-1 border-b border-gray-100 bg-gray-50">
        <span className="text-xs font-mono text-gray-700 truncate flex-1">{name}</span>
        {displaySrc !== null ? (
          <a
            href={displaySrc}
            download={name}
            className="shrink-0 ml-2 text-xs px-2 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
          >
            Download
          </a>
        ) : null}
      </div>

      <div className="shrink-0 px-3 py-2 border-b border-gray-100 flex flex-wrap gap-x-4 gap-y-0.5">
        <span className="text-[10px] text-gray-400">
          <span className="font-medium text-gray-500">Type</span> {mimeType}
        </span>
        <span className="text-[10px] text-gray-400">
          <span className="font-medium text-gray-500">Size</span> {formatFileSize(size)}
        </span>
        <span className="text-[10px] text-gray-400">
          <span className="font-medium text-gray-500">Uploaded</span> {formatDate(uploadedAt)}
        </span>
        {isBinary && (
          <span className="text-[10px] text-amber-600">
            <span className="font-medium">Format</span> {entry.value.storageFormat} (experimental)
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto p-3 flex flex-col items-start gap-3">
        {isBinary && displaySrc === null ? (
          <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <p className="font-semibold mb-0.5">Binary data unavailable</p>
            <p>
              window.storage may not have preserved the binary value. The entry might have been
              coerced to a string on storage.
            </p>
          </div>
        ) : isImage && displaySrc !== null ? (
          <img
            src={displaySrc}
            alt={name}
            className="max-w-full max-h-64 object-contain rounded border border-gray-100"
          />
        ) : (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded px-3 py-2 border border-gray-100">
            <span className="text-base">📄</span>
            <span>File type: {mimeType}</span>
          </div>
        )}

        {displaySrc !== null && (
          <a
            href={displaySrc}
            download={name}
            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
          >
            Download {name}
          </a>
        )}
      </div>
    </div>
  );
}
