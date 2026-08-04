import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { StorageExplorerApp } from "./StorageExplorerApp.js";

const MOCK_PRIVATE: Record<string, unknown> = {
  "alistigo:list:abc123": {
    id: "list:abc123",
    items: [
      { id: "item:1", text: "Buy milk", done: false },
      { id: "item:2", text: "Walk the dog", done: true },
    ],
    createdAt: "2026-07-30T10:00:00Z",
  },
  "alistigo:list:def456": { id: "list:def456", items: [], createdAt: "2026-07-30T11:00:00Z" },
  "alistigo:prefs:user": { locale: "en", theme: "light", version: 1 },
};

const MOCK_SHARED: Record<string, unknown> = {
  "alistigo:shared:session": { userId: "user_abc", expiresAt: "2026-08-30T00:00:00Z" },
};

function makeStorageStub(
  initialPrivate: Record<string, unknown>,
  initialShared: Record<string, unknown>,
): NonNullable<typeof window.storage> {
  // Store values as JSON strings — matches the real Claude storage API contract
  const priv = new Map(Object.entries(initialPrivate).map(([k, v]) => [k, JSON.stringify(v)]));
  const shared = new Map(Object.entries(initialShared).map(([k, v]) => [k, JSON.stringify(v)]));

  return {
    get: async (key, isShared = false) => {
      const v = (isShared ? shared : priv).get(key);
      if (v === undefined) throw new Error("Key not found");
      return { value: v };
    },
    set: async (key, value, isShared = false) => {
      (isShared ? shared : priv).set(key, value);
    },
    delete: async (key, isShared = false) => {
      (isShared ? shared : priv).delete(key);
    },
    list: async (prefix, isShared = false) => {
      const source = isShared ? shared : priv;
      return { keys: Array.from(source.keys()).filter((k) => k.startsWith(prefix)) };
    },
  };
}

const withStorageStub: (priv: Record<string, unknown>, sh: Record<string, unknown>) => Decorator =
  (priv, sh) => (Story) => {
    window.storage = makeStorageStub(priv, sh);
    return (
      <div className="h-screen w-screen">
        <Story />
      </div>
    );
  };

const meta: Meta<typeof StorageExplorerApp> = {
  title: "Explorer/StorageExplorerApp",
  component: StorageExplorerApp,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof StorageExplorerApp>;

export const Default: Story = {
  decorators: [withStorageStub(MOCK_PRIVATE, MOCK_SHARED)],
  args: { prefix: "" },
};

export const WithPrefix: Story = {
  decorators: [withStorageStub(MOCK_PRIVATE, MOCK_SHARED)],
  args: { prefix: "alistigo:list:" },
};

export const EmptyStorage: Story = {
  decorators: [withStorageStub({}, {})],
  args: { prefix: "" },
};

export const NoStorageApi: Story = {
  decorators: [
    (Story) => {
      delete (window as { storage?: unknown }).storage;
      return (
        <div className="h-screen w-screen">
          <Story />
        </div>
      );
    },
  ],
  args: { prefix: "" },
};
