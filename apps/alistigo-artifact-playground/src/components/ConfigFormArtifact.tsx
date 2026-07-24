import type { JSX } from "react";

export interface ConfigFormArtifactProps {
  lang: string;
  readonly: boolean;
  onLangChange: (lang: string) => void;
  onReadonlyChange: (readonly: boolean) => void;
}

export function ConfigFormArtifact({
  lang,
  readonly,
  onLangChange,
  onReadonlyChange,
}: ConfigFormArtifactProps): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1">
        <span className="font-medium text-gray-600 text-xs">Language</span>
        <input
          type="text"
          className="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
          value={lang}
          onChange={(e) => onLangChange(e.target.value)}
          placeholder="en"
        />
      </label>

      <label className="flex flex-row items-center gap-2">
        <input
          type="checkbox"
          checked={readonly}
          onChange={(e) => onReadonlyChange(e.target.checked)}
        />
        <span className="font-medium text-gray-600 text-xs">Read-only</span>
      </label>
    </div>
  );
}
