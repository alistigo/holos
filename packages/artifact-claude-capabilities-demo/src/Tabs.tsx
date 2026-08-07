import type { JSX } from "react";

export type TabId =
  | "about"
  | "storage"
  | "ai"
  | "file-generation"
  | "api-calls"
  | "external-navigation"
  | "inject-script";

const TABS: { id: TabId; label: string }[] = [
  { id: "about", label: "About" },
  { id: "storage", label: "Storage" },
  { id: "ai", label: "AI" },
  { id: "file-generation", label: "File Generation" },
  { id: "api-calls", label: "API Calls" },
  { id: "external-navigation", label: "External Navigation" },
  { id: "inject-script", label: "Inject Script" },
];

interface TabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function Tabs({ activeTab, onTabChange }: TabsProps): JSX.Element {
  return (
    <div className="flex shrink-0 overflow-x-auto border-b border-gray-200 bg-white px-3">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTabChange(id)}
          className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors focus:outline-none ${
            activeTab === id
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
