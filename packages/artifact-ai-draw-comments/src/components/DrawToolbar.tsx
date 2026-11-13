type DrawTool = "rectangle" | "line";

interface DrawToolbarProps {
  activeTool: DrawTool;
  onToolChange: (tool: DrawTool) => void;
}

export function DrawToolbar({ activeTool, onToolChange }: DrawToolbarProps) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-gray-200 bg-white p-1 shadow-sm">
      <ToolButton
        tool="rectangle"
        isActive={activeTool === "rectangle"}
        onSelect={onToolChange}
        label="Rectangle"
        title="Draw rectangle"
      />
      <ToolButton
        tool="line"
        isActive={activeTool === "line"}
        onSelect={onToolChange}
        label="Line"
        title="Draw line"
      />
    </div>
  );
}

interface ToolButtonProps {
  tool: DrawTool;
  isActive: boolean;
  onSelect: (tool: DrawTool) => void;
  label: string;
  title: string;
}

function ToolButton({ tool, isActive, onSelect, label, title }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(tool)}
      title={title}
      aria-pressed={isActive}
      className={`flex items-center justify-center rounded p-1.5 text-xs transition-colors ${
        isActive
          ? "bg-blue-100 text-blue-700 ring-1 ring-blue-400"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {tool === "rectangle" ? <RectIcon /> : <LineIcon />}
      <span className="sr-only">{label}</span>
    </button>
  );
}

function RectIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    </svg>
  );
}

function LineIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="19" x2="19" y2="5" />
    </svg>
  );
}
