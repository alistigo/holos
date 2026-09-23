import { defineCollection, z } from "astro:content";
import { adrsPath } from "@alistigo/architecture/adrs";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { glob } from "astro/loaders";

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  adrs: defineCollection({
    loader: glob({ pattern: "[0-9]*.md", base: adrsPath }),
    schema: z.object({
      status: z.string(),
      date: z.coerce.date(),
      deciders: z.union([z.string(), z.array(z.string())]).optional(),
    }),
  }),
};
