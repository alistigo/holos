import { When } from "@cucumber/cucumber";
import type { AlistigoWorld } from "../support/world";

When("I open the list", async function (this: AlistigoWorld) {
  await this.applicationPage.open();
});

When("I add {string}", async function (this: AlistigoWorld, text: string) {
  await this.applicationPage.addElement(text);
});

When("I delete {string}", async function (this: AlistigoWorld, text: string) {
  await this.applicationPage.deleteElement(text);
});

When("I delete row {int}", async function (this: AlistigoWorld, rowNumber: number) {
  if (rowNumber < 1) {
    throw new Error(`Row number must be 1-based, got ${rowNumber}.`);
  }
  await this.applicationPage.deleteRow(rowNumber);
});

When("I reload the list", async function (this: AlistigoWorld) {
  await this.applicationPage.reload();
});
