import type { AlistigoProjection } from "@alistigo/document-format";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { ListView } from "./ListView.js";

const meta: Meta<typeof ListView> = {
  title: "Alistigo/ListView",
  component: ListView,
  args: {
    onDelete: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof ListView>;

const empty: AlistigoProjection = {
  "@type": "ItemList",
  itemListElement: [],
  numberOfItems: 0,
};

const populated: AlistigoProjection = {
  "@type": "ItemList",
  numberOfItems: 3,
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
    {
      "@type": "ListItem",
      position: 3,
      item: {
        "@type": "Thing",
        "@id": "urn:uuid:00000000-0000-4000-8000-000000000003",
        name: "Email Alice",
      },
    },
  ],
};

export const Empty: Story = {
  args: { projection: empty },
};

export const Populated: Story = {
  args: { projection: populated },
};
