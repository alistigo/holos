import { Highlight, themes } from "prism-react-renderer";
import type { JSX } from "react";
import { useState } from "react";

interface SourceViewProps {
  html: string;
}

export function SourceView({ html }: SourceViewProps): JSX.Element {
  const [copied, setCopied] = useState(false);

  function handleCopy(): void {
    void navigator.clipboard.writeText(html).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#011627]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#010d1a] border-b border-white/10 shrink-0">
        <span className="text-xs text-gray-400 font-mono">srcdoc HTML</span>
        <button
          type="button"
          onClick={handleCopy}
          className="px-2.5 py-1 text-xs rounded border border-white/20 bg-white/10 text-gray-300 hover:bg-white/20 cursor-pointer"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <Highlight theme={themes.nightOwl} code={html} language="html">
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
      </div>
    </div>
  );
}
