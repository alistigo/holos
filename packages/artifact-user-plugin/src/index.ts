import type { AlistigoPlugin, PluginContext } from "@alistigo/artifact-plugin-api";
import { createLogger } from "@alistigo/logger";
import React, { type ReactNode } from "react";
import pkg from "../package.json" with { type: "json" };
import { UserProvider } from "./context.js";
import { generateDefaultUser } from "./generate.js";
import { deserializeUser, serializeUser, type User } from "./user.js";

const log = createLogger("alistigo:artifact-user-plugin");

let resolvedUser: User | null = null;

async function setup(ctx: PluginContext): Promise<void> {
  const raw = await ctx.store?.get("user");
  const existing = raw !== undefined ? deserializeUser(raw) : null;
  if (existing !== null) {
    resolvedUser = existing;
    log.info({ userId: existing.id }, "restored user from storage");
  } else {
    resolvedUser = generateDefaultUser();
    await ctx.store?.set("user", serializeUser(resolvedUser));
    log.info({ userId: resolvedUser.id }, "created new user");
  }
}

function wrapRoot(tree: ReactNode, ctx: PluginContext): ReactNode {
  const initialUser = resolvedUser ?? generateDefaultUser();
  return React.createElement(UserProvider, {
    initialUser,
    ...(ctx.store !== undefined ? { store: ctx.store } : {}),
    onUserChanged: (u: User) => {
      ctx.emit("user:changed", { userId: u.id, pseudo: u.pseudo });
    },
    children: tree,
  });
}

const userPlugin: AlistigoPlugin = {
  name: "@alistigo/artifact-user-plugin",
  version: pkg.version,
  type: "user",
  requires: ["@alistigo/claude-storage-plugin", "@alistigo/local-storage-plugin"],
  setup,
  wrapRoot,
  renderStatusBadge: (_onToggle) => null,
  renderMenuContent: () => null,
};

export default userPlugin;
