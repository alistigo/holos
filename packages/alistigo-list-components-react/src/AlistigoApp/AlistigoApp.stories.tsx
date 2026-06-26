import type { AlistigoProjection } from "@alistigo/document-format";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { AddElementInput } from "../AddElementInput/AddElementInput.js";
import { ListView } from "../ListView/ListView.js";
import { AlistigoApp } from "./AlistigoApp.js";

const meta: Meta<typeof AlistigoApp> = {
  title: "Alistigo/AlistigoApp",
  component: AlistigoApp,
};

export default meta;

type Story = StoryObj<typeof AlistigoApp>;

const samplePopulated: AlistigoProjection = {
  "@type": "ItemList",
  numberOfItems: 2,
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      item: {
        "@type": "Thing",
        "@id": "urn:uuid:00000000-0000-4000-8000-000000000001",
        name: "Buy bread",
      },
    },
    {
      "@type": "ListItem",
      position: 2,
      item: {
        "@type": "Thing",
        "@id": "urn:uuid:00000000-0000-4000-8000-000000000002",
        name: "Call mom",
      },
    },
  ],
};

export const Composed: Story = {
  render: () => (
    <AlistigoApp>
      <AddElementInput onAdd={fn()} />
      <ListView projection={samplePopulated} onDelete={fn()} />
    </AlistigoApp>
  ),
};
