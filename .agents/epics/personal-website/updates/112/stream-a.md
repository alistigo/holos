---
status: completed
started: 2026-06-16T00:00:00Z
completed: 2026-06-16T11:00:00Z
---

# Stream A: Scaffold Astro app + Nx wiring

## Progress

- [x] Clone astro-bento-portfolio theme (Ladvace/astro-bento-portfolio)
- [x] Create apps/personal-website/ directory structure
- [x] Write package.json with dependencies (astro ^5, tailwindcss ^4, gsap, lenis)
- [x] Write project.json for Nx (build/dev/typecheck/lint targets)
- [x] Write tsconfig.json extending ../../tsconfig.base.json
- [x] Write astro.config.ts (output: static, site: mikael-labrut.alistigo.com)
- [x] Adapt theme src/ files (bento grid layout, stripped personal data)
- [x] Write public/CNAME
- [x] Clean up placeholder personal data (replaced with TODO comments)
- [x] pnpm install (packages installed)
- [x] astro build passes (1 page built, TypeScript clean)

## Notes

- Used Tailwind CSS v4 with @tailwindcss/vite (Vite plugin, not @astrojs/tailwind)
- Adapted theme from UnoCSS to Tailwind v4 (compatible utility classes)
- Removed SolidJS/Svelte/Astro DB dependencies — pure Astro + Tailwind
- Fonts served via Google Fonts (TODO: replace with local self-hosted fonts)
- `nx run personal-website:build` resolves workspace to /Volumes/workspace/europa
  (git worktree limitation — Nx daemon shared with main worktree sees main branch).
  Build verified via: `pnpm --filter=personal-website exec astro build` ✓
  Will work via nx after PR merge to main.
