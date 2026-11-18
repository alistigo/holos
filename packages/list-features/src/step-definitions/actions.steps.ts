import { When } from "@cucumber/cucumber";
import type { ListWorld } from "../support/world.js";

When("I open the list", async function (this: ListWorld) {
  await this.applicationPage.waitForArtifactReady();
});

When("I add {string}", async function (this: ListWorld, text: string) {
  await this.applicationPage.addElement(text);
});

When("I delete {string}", async function (this: ListWorld, text: string) {
  await this.applicationPage.deleteElement(text);
});

When("I delete row {int}", async function (this: ListWorld, rowNumber: number) {
  if (rowNumber < 1) {
    throw new Error(`Row number must be 1-based, got ${rowNumber}.`);
  }
  await this.applicationPage.deleteRow(rowNumber);
});

When("I reload the artifact", async function (this: ListWorld) {
  await this.reloadArtifact();
});

When("the artifact is fully loaded", async function (this: ListWorld) {
  await this.applicationPage.waitForArtifactReady();
});

When("I check {string}", async function (this: ListWorld, text: string) {
  await this.applicationPage.checkElement(text);
});

When("I uncheck {string}", async function (this: ListWorld, text: string) {
  await this.applicationPage.uncheckElement(text);
});

When("I open the user editor", async function (this: ListWorld) {
  await this.applicationPage.openUserEditor();
});

When("I set my pseudo to {string}", async function (this: ListWorld, pseudo: string) {
  await this.applicationPage.setPseudo(pseudo);
});

When("the artifact initialize", async function (this: ListWorld) {
  await this.initializeArtifactWithPlugin();
});

When("an uncaught render error occurs", async function (this: ListWorld) {
  await this.applicationPage.triggerDebugRenderError();
});
