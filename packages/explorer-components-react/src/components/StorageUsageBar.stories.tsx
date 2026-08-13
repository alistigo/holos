import type { Meta, StoryObj } from "@storybook/react";
import { StorageUsageBar } from "./StorageUsageBar.js";

const meta: Meta<typeof StorageUsageBar> = {
  title: "Components/StorageUsageBar",
  component: StorageUsageBar,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof StorageUsageBar>;

const repeat = (n: number): string => "x".repeat(Math.floor(n * 1024 * 1024));

export const Empty: Story = {
  args: { entries: [], maxPerKeyMb: 5 },
};

export const LowUsage: Story = {
  args: {
    entries: [{ value: { theme: "dark", lang: "en" } }, { value: { text: repeat(0.1) } }],
    maxPerKeyMb: 5,
  },
};

export const MediumUsage: Story = {
  args: {
    entries: [{ value: { data: repeat(2) } }, { value: { x: 1 } }],
    maxPerKeyMb: 5,
  },
};

export const NearLimit: Story = {
  args: {
    entries: [{ value: { data: repeat(4.2) } }, { value: { ok: true } }],
    maxPerKeyMb: 5,
  },
};

export const AtLimit: Story = {
  args: {
    entries: [{ value: { data: repeat(5) } }],
    maxPerKeyMb: 5,
  },
};
