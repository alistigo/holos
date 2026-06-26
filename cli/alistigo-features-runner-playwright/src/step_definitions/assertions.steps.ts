import { strict as assert } from "node:assert";
import { type DataTable, Then } from "@cucumber/cucumber";
import type { AlistigoWorld } from "../support/world";

Then("the list should be:", async function (this: AlistigoWorld, table: DataTable) {
  const expected = table.raw().map((row, i) => {
    if (row.length !== 1) {
      throw new Error(
        `\`Then the list should be:\` expects a single-column table, but row ${i + 1} has ${row.length} columns`,
      );
    }
    const cell = (row[0] ?? "").trim();
    if (cell === "") {
      throw new Error(`\`Then the list should be:\` row ${i + 1} is empty after trimming`);
    }
    return cell;
  });
  const actual = await this.applicationPage.getListItems();
  assert.deepEqual([...actual].sort(), [...expected].sort());
});

Then("the list should be empty", async function (this: AlistigoWorld) {
  const actual = await this.applicationPage.getListItems();
  assert.deepEqual(actual, []);
});

Then("an empty-state message should be visible", async function (this: AlistigoWorld) {
  const visible = await this.applicationPage.isEmptyStateVisible();
  assert.equal(visible, true, "expected empty-state message to be visible");
});
