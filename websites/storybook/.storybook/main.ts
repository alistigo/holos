import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { lingui } from "@lingui/vite-plugin";
import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import { globSync } from "glob";
import os from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(__dirname, "../../..");

interface PkgJson {
  name: string;
}

function buildStoriesEntries() {
  const pkgJsonPaths = globSync("{apps,packages}/*/package.json", {
    cwd: workspaceRoot,
    absolute: true,
  });

  return pkgJsonPaths.flatMap((pkgJsonPath: string) => {
    const pkgDir = dirname(pkgJsonPath);
    const srcDir = join(pkgDir, "src");

    if (!existsSync(srcDir)) return [];

    const storyFiles = globSync("**/*.stories.@(ts|tsx)", { cwd: srcDir });
    if (storyFiles.length === 0) return [];

    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8")) as PkgJson;
    const rawName = pkgJson.name;
    const pkgName = rawName.split("/").at(-1) ?? rawName;

    return [{ directory: srcDir, files: "**/*.stories.@(ts|tsx)", titlePrefix: pkgName }];
  });
}

const config: StorybookConfig = {
  stories: buildStoriesEntries(),
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  typescript: {
    check: false,
  },
  async viteFinal(viteConfig) {
    return {
      ...viteConfig,
      ...(process.env.STORYBOOK_BASE_PATH !== undefined
        ? { base: process.env.STORYBOOK_BASE_PATH }
        : {}),
      server: {
        ...viteConfig.server,
        allowedHosts: [os.hostname(), `${os.hostname()}.local`],
      },
      plugins: [...(viteConfig.plugins ?? []), tailwindcss(), lingui()],
    };
  },
};

export default config;
