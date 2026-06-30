# GitHub Issue Mapping — personal-website

Epic: #111 - https://github.com/MLKiiwy/europa/issues/111

## Tasks

| File | Issue | Title |
|------|-------|-------|
| 112.md | #112 | Scaffold Astro app + Nx wiring |
| 114.md | #114 | LinkedIn to JSON Resume CLI |
| 116.md | #116 | Resume data file + TypeScript types |
| 118.md | #118 | Bento grid layout + Tailwind v4 design system |
| 120.md | #120 | Hero + About + Contact tiles |
| 113.md | #113 | Experience timeline tile |
| 115.md | #115 | Skills tile |
| 117.md | #117 | Projects + GitHub activity tiles |
| 119.md | #119 | GSAP ScrollTrigger + Lenis scroll animations |
| 121.md | #121 | GitHub Actions deploy + custom domain setup |

## Dependency Graph (with real issue numbers)

| Issue | Depends On | Wave |
|-------|------------|------|
| #112 (Scaffold) | — | 1 |
| #114 (LinkedIn CLI) | — | 1 |
| #116 (Resume data) | #114 | 2 |
| #118 (Bento layout) | #112 | 2 |
| #121 (GitHub Actions) | #112 | 2 |
| #120 (Hero/About/Contact) | #112, #118 | 3 |
| #113 (Experience) | #112, #116, #118 | 3 |
| #115 (Skills) | #112, #116, #118 | 3 |
| #117 (Projects/GitHub) | #112, #118 | 3 |
| #119 (GSAP animations) | #120, #113, #115, #117 | 4 |

Synced: 2026-06-16T08:00:00Z
