import { Highlight, themes } from "prism-react-renderer";
import type { JSX } from "react";
import { useState } from "react";

interface SourceViewProps {
  /** The code to display. Empty renders `emptyMessage` instead of the highlighter. */
  code: string;
  /** Caption in the header strip, e.g. "srcdoc HTML" or "AI bridge". */
  label: string;
  /** Shown in place of the highlighter when `code` is empty. */
  emptyMessage?: string;
}

/**
 * Copies to the clipboard, or does nothing it cannot do.
 *
 * `navigator.clipboard` is absent outside a secure context, so reaching straight
 * for `.writeText` throws a TypeError — and this component now backs four tabs,
 * so that would take the whole panel down rather than just failing to copy.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || navigator.clipboard === undefined) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function SourceView({ code, label, emptyMessage }: SourceViewProps): JSX.Element {
  const [copied, setCopied] = useState(false);

  function handleCopy(): void {
    void copyToClipboard(code).then((ok) => {
      // Only flash "Copied!" when something actually reached the clipboard.
      if (!ok) return;
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#011627]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#010d1a] border-b border-white/10 shrink-0">
        <span className="text-xs text-gray-400 font-mono">{label}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="px-2.5 py-1 text-xs rounded border border-white/20 bg-white/10 text-gray-300 hover:bg-white/20 cursor-pointer"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {code === "" && emptyMessage !== undefined ? (
          <p className="p-4 text-xs text-gray-400 italic">{emptyMessage}</p>
        ) : (
          <Highlight theme={themes.nightOwl} code={code} language="html">
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre className={`${className} p-4 text-xs leading-5 min-h-full`} style={style}>
                {tokens.map((line, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: line index is stable for static content
                  <div key={i} {...getLineProps({ line })}>
                    {line.map((token, key) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: token index is stable for static content
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        )}
      </div>
    </div>
  );
}
