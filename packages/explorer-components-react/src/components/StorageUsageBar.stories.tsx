import type { Meta, StoryObj } from "@storybook/react";
import { StorageUsageBar } from "./StorageUsageBar.js";

const meta: Meta<typeof StorageUsageBar> = {
  title: "Components/StorageUsageBar",
  component: StorageUsageBar,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof StorageUsageBar>;

const mib = (n: number): string => "x".repeat(Math.floor(n * 1024 * 1024));

export const Empty: Story = {
  args: { entries: [], maxPerKeyMib: 5, maxTotalMib: 17 },
};

export const LowUsage: Story = {
  args: {
    entries: [{ value: { theme: "dark", lang: "en" } }, { value: { text: mib(0.1) } }],
    maxPerKeyMib: 5,
    maxTotalMib: 17,
  },
};

export const MediumUsage: Story = {
  args: {
    entries: [{ value: { data: mib(5) } }, { value: { data2: mib(3) } }, { value: { x: 1 } }],
    maxPerKeyMib: 5,
    maxTotalMib: 17,
  },
};

export const NearLimit: Story = {
  args: {
    entries: [
      { value: { data: mib(5) } },
      { value: { data2: mib(4.9) } },
      { value: { data3: mib(4.6) } },
    ],
    maxPerKeyMib: 5,
    maxTotalMib: 17,
  },
};

export const Full: Story = {
  args: {
    entries: [
      { value: { data: mib(5) } },
      { value: { data2: mib(5) } },
      { value: { data3: mib(4.9) } },
      { value: { data4: mib(2.1) } },
    ],
    maxPerKeyMib: 5,
    maxTotalMib: 17,
  },
};
