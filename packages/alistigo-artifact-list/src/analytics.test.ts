import { describe, expect, it, mock } from "bun:test";

// Mock posthog-js before importing analytics
await mock.module("posthog-js", () => ({
  default: {
    init: mock(() => {}),
    capture: mock(() => {}),
  },
}));

// Import after mocking
const { initAnalytics, trackWidgetDisplayed, isAnalyticsEnabled, getAnalyticsHost } = await import(
  "./analytics.js"
);
const posthog = (await import("posthog-js")).default;

describe("analytics", () => {
  describe("initAnalytics()", () => {
    it("does nothing when VITE_POSTHOG_KEY is absent", () => {
      // import.meta.env.VITE_POSTHOG_KEY is undefined in bun test
      initAnalytics("en", "0.1.0");
      expect(posthog.init).not.toHaveBeenCalled();
    });
  });

  describe("isAnalyticsEnabled()", () => {
    it("returns false when not initialized", () => {
      expect(isAnalyticsEnabled()).toBe(false);
    });
  });

  describe("getAnalyticsHost()", () => {
    it("returns undefined when not initialized", () => {
      expect(getAnalyticsHost()).toBeUndefined();
    });
  });

  describe("trackWidgetDisplayed()", () => {
    it("does nothing when not initialized", () => {
      trackWidgetDisplayed({ locale: "en", storageType: "localStorage", version: "0.1.0" });
      expect(posthog.capture).not.toHaveBeenCalled();
    });
  });
});
