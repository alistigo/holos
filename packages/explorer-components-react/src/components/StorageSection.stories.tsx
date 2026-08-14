import type { Meta, StoryObj } from "@storybook/react-vite";
import type { UnifiedEntry } from "./StorageSection.js";
import { StorageSection } from "./StorageSection.js";

const meta: Meta<typeof StorageSection> = {
  title: "Explorer/StorageSection",
  component: StorageSection,
  decorators: [
    (Story) => (
      <div className="h-80 w-2xl border border-gray-200 rounded overflow-hidden flex flex-col">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StorageSection>;

// 1×1 transparent PNG
const PNG_1X1 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const SAMPLE_ENTRIES: UnifiedEntry[] = [
  {
    key: "alistigo:list:abc123",
    value: {
      id: "list:abc123",
      items: [
        { id: "item:1", text: "Buy milk", done: false },
        { id: "item:2", text: "Walk the dog", done: true },
      ],
    },
    shared: false,
  },
  { key: "alistigo:list:def456", value: { id: "list:def456", items: [] }, shared: false },
  { key: "alistigo:prefs:user", value: { locale: "en", theme: "light" }, shared: true },
];

const FILE_ENTRY: UnifiedEntry = {
  key: "avatar.jpg",
  value: {
    _type: "file",
    name: "avatar.jpg",
    mimeType: "image/jpeg",
    size: 68,
    uploadedAt: "2026-08-13T10:00:00.000Z",
    data: PNG_1X1,
  },
  shared: false,
};

const JSON_DOC_ENTRY: UnifiedEntry = {
  key: "config",
  value: {
    _type: "document",
    format: "json",
    content: '{\n  "theme": "light",\n  "locale": "en"\n}',
    createdAt: "2026-08-14T09:00:00.000Z",
  },
  shared: false,
};

const YAML_DOC_ENTRY: UnifiedEntry = {
  key: "manifest",
  value: {
    _type: "document",
    format: "yaml",
    content: "name: my-app\nversion: 1.0.0\nauthor: Alice",
    createdAt: "2026-08-14T09:30:00.000Z",
  },
  shared: true,
};

const mib = (n: number): string => "x".repeat(Math.floor(n * 1024 * 1024));

// ── States ────────────────────────────────────────────────────────────────────

export const WithEntries: Story = {
  args: {
    entries: SAMPLE_ENTRIES,
    isLoading: false,
    onDelete: (key, shared) => alert(`delete: ${key} (shared=${String(shared)})`),
    isDeletingEntry: null,
    onCreate: async () => {},
    onUpdate: async () => {},
    onCreateText: async () => {},
  },
};

export const WithFileEntry: Story = {
  name: "With file entry (JPG badge)",
  args: {
    entries: [...SAMPLE_ENTRIES, FILE_ENTRY],
    isLoading: false,
    onDelete: () => {},
    isDeletingEntry: null,
    onCreate: async () => {},
    onUpdate: async () => {},
    onCreateText: async () => {},
  },
};

export const WithDocumentEntries: Story = {
  name: "With document entries (JSON / YAML badges)",
  args: {
    entries: [...SAMPLE_ENTRIES, JSON_DOC_ENTRY, YAML_DOC_ENTRY],
    isLoading: false,
    onDelete: () => {},
    isDeletingEntry: null,
    onCreate: async () => {},
    onUpdate: async () => {},
    onCreateText: async () => {},
  },
};

export const WithMixedEntries: Story = {
  name: "Mixed — JSON docs, YAML docs, file, and plain JSON",
  args: {
    entries: [...SAMPLE_ENTRIES, FILE_ENTRY, JSON_DOC_ENTRY, YAML_DOC_ENTRY],
    isLoading: false,
    onDelete: () => {},
    isDeletingEntry: null,
    onCreate: async () => {},
    onUpdate: async () => {},
    onCreateText: async () => {},
  },
};

export const NearStorageLimit: Story = {
  name: "Near storage limit (~14 MiB used)",
  args: {
    entries: [
      { key: "big-a", value: { data: mib(5) }, shared: false },
      { key: "big-b", value: { data: mib(4.9) }, shared: false },
      { key: "big-c", value: { data: mib(4.1) }, shared: true },
    ],
    isLoading: false,
    onDelete: () => {},
    isDeletingEntry: null,
    onCreate: async () => {},
    onUpdate: async () => {},
    onCreateText: async () => {},
  },
};

export const Deleting: Story = {
  args: {
    entries: SAMPLE_ENTRIES,
    isLoading: false,
    onDelete: () => {},
    isDeletingEntry: { key: "alistigo:list:abc123", shared: false },
    onCreate: async () => {},
    onUpdate: async () => {},
    onCreateText: async () => {},
  },
};

export const Loading: Story = {
  args: {
    entries: [],
    isLoading: true,
    onDelete: () => {},
    isDeletingEntry: null,
    onCreate: async () => {},
    onUpdate: async () => {},
    onCreateText: async () => {},
  },
};

export const Empty: Story = {
  args: {
    entries: [],
    isLoading: false,
    onDelete: () => {},
    isDeletingEntry: null,
    onCreate: async () => {},
    onUpdate: async () => {},
    onCreateText: async () => {},
  },
};
