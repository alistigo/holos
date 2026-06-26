import pkg from "../package.json" with { type: "json" };
import { getAnalyticsHost, isAnalyticsEnabled } from "./analytics.js";
import { getMonitoringRelease, isMonitoringEnabled } from "./monitoring.js";
import { getMountedContainers } from "./runtime-state.js";

export interface VersionInfo {
  version: string;
  locale: string;
  buildTime: string;
  dependencies: Record<string, string>;
}

export interface AboutInfo extends VersionInfo {
  runtime: {
    storageType: string;
    mountedContainers: readonly string[];
    logLevel: string;
  };
  monitoring: {
    sentry: { enabled: boolean; release?: string };
  };
  analytics: {
    posthog: { enabled: boolean; host?: string };
  };
}

function detectStorageType(): string {
  if (typeof window !== "undefined" && "storage" in window) return "window.storage";
  if (typeof localStorage !== "undefined") return "localStorage";
  return "none";
}

function buildVersionInfo(): VersionInfo {
  return {
    version: pkg.version,
    locale: (import.meta.env.VITE_LOCALE as string | undefined) ?? "en",
    buildTime: (import.meta.env.VITE_BUILD_TIME as string | undefined) ?? "unknown",
    dependencies: {
      react: pkg.dependencies.react,
      "@lingui/core": pkg.dependencies["@lingui/core"],
    },
  };
}

export function version(): VersionInfo {
  const info = buildVersionInfo();
  console.log(info);
  return info;
}

export function about(): AboutInfo {
  const release = getMonitoringRelease();
  const host = getAnalyticsHost();
  const info: AboutInfo = {
    ...buildVersionInfo(),
    runtime: {
      storageType: detectStorageType(),
      mountedContainers: getMountedContainers(),
      logLevel:
        (import.meta.env.VITE_ALISTIGO_DEBUG as string | undefined) === "true" ? "trace" : "error",
    },
    monitoring: {
      sentry: {
        enabled: isMonitoringEnabled(),
        ...(release !== undefined && { release }),
      },
    },
    analytics: {
      posthog: {
        enabled: isAnalyticsEnabled(),
        ...(host !== undefined && { host }),
      },
    },
  };
  console.log(info);
  return info;
}
