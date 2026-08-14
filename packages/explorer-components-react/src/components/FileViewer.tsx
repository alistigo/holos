import type { JSX } from "react";
import type { FileEntry } from "./FileUploadForm.js";

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

export interface FileViewerProps {
  entry: { key: string; value: FileEntry; shared: boolean };
}

// fallow-ignore-next-line complexity
export function FileViewer({ entry }: FileViewerProps): JSX.Element {
  const { name, mimeType, size, uploadedAt } = entry.value;
  const isImage = IMAGE_MIME_TYPES.has(mimeType);

  // Files are always stored as base64 data URIs
  const displaySrc =
    "data" in entry.value && typeof entry.value.data === "string" ? entry.value.data : null;

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
      </div>

      <div className="flex-1 overflow-auto p-3 flex flex-col items-start gap-3">
        {isImage && displaySrc !== null ? (
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
