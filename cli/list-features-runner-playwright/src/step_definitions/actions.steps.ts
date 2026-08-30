import { When } from "@cucumber/cucumber";
import type { AlistigoWorld } from "../support/world";

When("I open the list", async function (this: AlistigoWorld) {
  await this.applicationPage.waitForArtifactReady();
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

When("I reload the artifact", async function (this: AlistigoWorld) {
  await this.reloadArtifact();
});

When("the artifact is fully loaded", async function (this: AlistigoWorld) {
  await this.applicationPage.waitForArtifactReady();
});

When("I check {string}", async function (this: AlistigoWorld, text: string) {
  await this.applicationPage.checkElement(text);
});

When("I uncheck {string}", async function (this: AlistigoWorld, text: string) {
  await this.applicationPage.uncheckElement(text);
});

When("I open the user editor", async function (this: AlistigoWorld) {
  await this.applicationPage.openUserEditor();
});

When("I set my pseudo to {string}", async function (this: AlistigoWorld, pseudo: string) {
  await this.applicationPage.setPseudo(pseudo);
});

When("the artifact initialize", async function (this: AlistigoWorld) {
  await this.initializeArtifactWithPlugin();
});

When("an uncaught render error occurs", async function (this: AlistigoWorld) {
  await this.applicationPage.triggerDebugRenderError();
});
