import type { JSX } from "react";
import { useState } from "react";

const CURATED_LINKS = [
  {
    label: "MDN Web Docs",
    href: "https://developer.mozilla.org",
    desc: "Web platform documentation",
  },
  {
    label: "Anthropic docs",
    href: "https://docs.anthropic.com",
    desc: "Claude API and capabilities",
  },
  { label: "GitHub", href: "https://github.com", desc: "Code hosting and collaboration" },
  { label: "npm", href: "https://www.npmjs.com", desc: "JavaScript package registry" },
  { label: "Tailwind CSS", href: "https://tailwindcss.com", desc: "Utility-first CSS framework" },
];

export function ExternalNavigationTab(): JSX.Element {
  const [windowOpenUrl, setWindowOpenUrl] = useState("https://example.com");
  const [lastOpened, setLastOpened] = useState<string | null>(null);

  function handleWindowOpen(): void {
    const trimmed = windowOpenUrl.trim();
    if (!trimmed) return;
    window.open(trimmed, "_blank");
    setLastOpened(trimmed);
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-6">
      <section>
        <p className="mb-3 text-xs font-medium tracking-wide text-gray-500 uppercase">
          &lt;a target="_blank"&gt; — link interception
        </p>
        <p className="mb-3 text-sm text-gray-600">
          The Claude inject-script intercepts clicks on{" "}
          <code className="rounded bg-gray-100 px-1">target="_blank"</code> links and opens them in
          the parent frame, working around the iframe sandbox restriction.
        </p>
        <ul className="space-y-2">
          {CURATED_LINKS.map(({ label, href, desc }) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-blue-600 group-hover:underline">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <svg
                  className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <p className="mb-3 text-xs font-medium tracking-wide text-gray-500 uppercase">
          window.open(url) — programmatic navigation
        </p>
        <p className="mb-3 text-sm text-gray-600">
          <code className="rounded bg-gray-100 px-1">window.open</code> is overridden by the
          inject-script to route through the parent frame — the same mechanism as link interception.
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={windowOpenUrl}
            onChange={(e) => setWindowOpenUrl(e.target.value)}
            placeholder="https://…"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleWindowOpen}
            disabled={!windowOpenUrl.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none"
          >
            Open in new tab
          </button>
        </div>
        {lastOpened && <p className="mt-2 text-xs text-gray-500">Last opened: {lastOpened}</p>}
      </section>
    </div>
  );
}
