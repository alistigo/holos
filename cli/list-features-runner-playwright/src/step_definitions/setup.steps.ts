import { type DataTable, Given } from "@cucumber/cucumber";
import { buildEmptyDocument, buildPopulatedDocument } from "../support/document";
import type { AlistigoWorld } from "../support/world";

Given("an empty list", async function (this: AlistigoWorld) {
  await this.setDocument(buildEmptyDocument());
});

Given("a list:", async function (this: AlistigoWorld, table: DataTable) {
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

Given("the {string} plugin", async function (this: AlistigoWorld, packageName: string) {
  await this.setPluginUnderTest(packageName);
});

Given(
  "a non-initialized artifact {string} with plugin configured",
  async function (this: AlistigoWorld, _artifact: string) {
    this.setPluginConfig({ dsn: "https://fake-dsn.example/1" });
  },
);

Given(
  "an non-initialized artifact {string} with plugin not configured",
  async function (this: AlistigoWorld, _artifact: string) {
    this.setPluginConfig({});
  },
);

Given(
  "an initialized artifact {string} with plugin configured",
  async function (this: AlistigoWorld, _artifact: string) {
    this.setPluginConfig({ dsn: "https://fake-dsn.example/1" });
    await this.initializeArtifactWithPlugin();
    await this.applicationPage.waitForPluginInitialized();
  },
);
