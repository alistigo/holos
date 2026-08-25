import checkboxPlugin from "@alistigo/artifact-checkbox-plugin";
import type {
  AlistigoActorRecord,
  AlistigoEventRecord,
  AlistigoProjection,
} from "@alistigo/list-document-format";
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

// ---------------------------------------------------------------------------
// Base fixtures (existing stories)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Actor fixtures (new stories)
// ---------------------------------------------------------------------------

const actorAlice: AlistigoActorRecord = {
  "alistigo:actorId": "act_01alice000000000000000000",
  "alistigo:userId": "user_alice",
  "alistigo:pseudo": "Alice",
  "alistigo:avatar":
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM0MzY0ZjciLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTQiPkE8L3RleHQ+PC9zdmc+",
};

const actorBob: AlistigoActorRecord = {
  "alistigo:actorId": "act_01bob0000000000000000000",
  "alistigo:userId": "user_bob",
  "alistigo:pseudo": "Bob",
  "alistigo:avatar":
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNlNzRjM2MiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTQiPkI8L3RleHQ+PC9zdmc+",
};

const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
const yesterdayDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();

const multiActorProjection: AlistigoProjection = {
  "@type": "ItemList",
  numberOfItems: 3,
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      item: { "@type": "Thing", "@id": "elem_01", name: "Buy bread" },
      "alistigo:attribution": {
        actorId: actorAlice["alistigo:actorId"],
        pseudo: actorAlice["alistigo:pseudo"],
        avatar: actorAlice["alistigo:avatar"],
        addedAt: twoHoursAgo,
      },
    },
    {
      "@type": "ListItem",
      position: 2,
      item: { "@type": "Thing", "@id": "elem_02", name: "Call mom" },
      "alistigo:attribution": {
        actorId: actorBob["alistigo:actorId"],
        pseudo: actorBob["alistigo:pseudo"],
        avatar: actorBob["alistigo:avatar"],
        addedAt: yesterdayDate,
      },
    },
    {
      "@type": "ListItem",
      position: 3,
      item: { "@type": "Thing", "@id": "elem_03", name: "Email Alice" },
      "alistigo:attribution": {
        actorId: actorAlice["alistigo:actorId"],
        pseudo: actorAlice["alistigo:pseudo"],
        avatar: actorAlice["alistigo:avatar"],
        addedAt: twoHoursAgo,
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Event fixtures (checkbox plugin stories)
// ---------------------------------------------------------------------------

const noEvents: AlistigoEventRecord[] = [];

const elem02CheckedEvent: AlistigoEventRecord = {
  "alistigo:listEventId": "lev_01checked000000000000000",
  "alistigo:eventType": "ListElementChecked",
  "alistigo:listId": "lst_01testlist000000000000000",
  "alistigo:listElementId": "elem_02",
  "alistigo:actorId": "act_01alice000000000000000000",
  "alistigo:timestamp": twoHoursAgo,
  checked: true,
} as AlistigoEventRecord;

// ---------------------------------------------------------------------------
// New stories
// ---------------------------------------------------------------------------

export const MultiActorSharedView: Story = {
  args: {
    projection: multiActorProjection,
    actors: [actorAlice, actorBob],
    onDelete: fn(),
  },
};

export const SingleActorNoAttribution: Story = {
  args: {
    projection: multiActorProjection, // has attribution data on elements
    actors: [actorAlice], // only 1 actor → attribution is suppressed
    onDelete: fn(),
  },
};

export const WithCheckboxPlugin: Story = {
  args: {
    projection: populated,
    plugins: [checkboxPlugin],
    events: noEvents,
    onDelete: fn(),
    onPluginCommand: fn(),
  },
};

export const WithCheckboxPluginChecked: Story = {
  args: {
    projection: populated,
    plugins: [checkboxPlugin],
    events: [elem02CheckedEvent],
    onDelete: fn(),
    onPluginCommand: fn(),
  },
};

export const MultiActorWithCheckbox: Story = {
  args: {
    projection: multiActorProjection,
    actors: [actorAlice, actorBob],
    plugins: [checkboxPlugin],
    events: [elem02CheckedEvent],
    onDelete: fn(),
    onPluginCommand: fn(),
  },
};
