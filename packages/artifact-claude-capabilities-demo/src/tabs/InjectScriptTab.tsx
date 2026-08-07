import type { JSX } from "react";
import injectScriptRaw from "../../../claude-artifact-api/inject-script.html?raw";
import { HighlightedCode } from "../CodeHighlight";

const INJECT_SCRIPT_JS = injectScriptRaw
  .replace(/^<script>/, "")
  .replace(/<\/script>\s*$/, "")
  .trim();

export function InjectScriptTab(): JSX.Element {
  return (
    <div className="flex flex-1 flex-col overflow-hidden gap-3 p-4">
      <div className="shrink-0 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          The Claude inject-script
        </p>
        <p className="text-sm text-gray-600">
          Before rendering your artifact HTML, Claude silently prepends this script to every
          artifact iframe. It executes immediately — before your code — and installs{" "}
          <code className="rounded bg-gray-100 px-1">window.storage</code>,{" "}
          <code className="rounded bg-gray-100 px-1">window.claude.complete</code>,{" "}
          <code className="rounded bg-gray-100 px-1">window.fetch</code>, and{" "}
          <code className="rounded bg-gray-100 px-1">window.open</code> as postMessage bridges to
          the parent Claude frame. It also overrides{" "}
          <code className="rounded bg-gray-100 px-1">URL.createObjectURL</code> to route file
          downloads through the parent, intercepts{" "}
          <code className="rounded bg-gray-100 px-1">{`<a>`}</code> clicks for external links and
          data URIs, and forwards <code className="rounded bg-gray-100 px-1">console</code> output
          upward so Claude can surface errors.
        </p>
        <p className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <strong>Hidden from source view.</strong> If you open the source tab of a Claude artifact
          inside the Claude UI, this script is not shown. Anthropic intentionally hides it — the
          inject-script is infrastructure, not user-visible code. You cannot inspect or override it
          from within the artifact itself.
        </p>
      </div>
      <HighlightedCode code={INJECT_SCRIPT_JS} language="js" />
    </div>
  );
}
