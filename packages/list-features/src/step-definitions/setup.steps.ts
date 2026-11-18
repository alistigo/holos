import { type DataTable, Given } from "@cucumber/cucumber";
import { buildEmptyDocument, buildPopulatedDocument } from "../support/document";
import type { ListWorld } from "../support/world.js";

Given("an empty list", async function (this: ListWorld) {
  await this.setDocument(buildEmptyDocument());
});

Given("a list:", async function (this: ListWorld, table: DataTable) {
  const elementTexts = table.raw().map((row, i) => {
    if (row.length !== 1) {
      throw new Error(
        `\`Given a list:\` expects a single-column table, but row ${i + 1} has ${row.length} columns`,
      );
    }
    const cell = (row[0] ?? "").trim();
    if (cell === "") {
      throw new Error(`\`Given a list:\` row ${i + 1} is empty after trimming`);
    }
    return cell;
  });
  await this.setDocument(buildPopulatedDocument(elementTexts));
});

Given("the {string} plugin", async function (this: ListWorld, packageName: string) {
  await this.setPluginUnderTest(packageName);
});

Given(
  "a non-initialized artifact {string} with plugin configured",
  async function (this: ListWorld, _artifact: string) {
    this.setPluginConfig({ dsn: "https://fake-dsn.example/1" });
  },
);

Given(
  "an non-initialized artifact {string} with plugin not configured",
  async function (this: ListWorld, _artifact: string) {
    this.setPluginConfig({});
  },
);

Given(
  "an initialized artifact {string} with plugin configured",
  async function (this: ListWorld, _artifact: string) {
    this.setPluginConfig({ dsn: "https://fake-dsn.example/1" });
    await this.initializeArtifactWithPlugin();
    await this.applicationPage.waitForPluginInitialized();
  },
);

// The user plugin is deliberately not route-intercepted: it uses React hooks and
// JSX, and serving a pre-built bundle would introduce a second React instance
// that breaks every hook. In dev the playground points it at a Vite /@fs/ URL
// served from the shared module graph, giving plugin and host the same React.
Given("an artifact with the user plugin enabled", async function (this: ListWorld) {
  await this.enablePlugin("@alistigo/artifact-user-plugin");
});

// The checkbox plugin is always active as a DEFAULT_FEATURE_PLUGIN in artifact-list.
// This step documents the precondition without needing additional setup.
Given("the checkbox plugin is active", async function (this: ListWorld) {
  // no-op: @alistigo/artifact-list-checkbox-plugin loads by default
});
