## 0.1.0 (2026-08-21)

### 🚀 Features

- **user-plugin:** auto-save user edits with debounce + global progress bar ([119f606](https://github.com/alistigo/holos/commit/119f606))
- **artifact-list:** add artifact-user-plugin as default plugin ([5ba2976](https://github.com/alistigo/holos/commit/5ba2976))
- **artifact-user-plugin:** add AvatarBadge, EditUserMenuButton, wire renderStatusBadge/renderMenuContent ([7547da0](https://github.com/alistigo/holos/commit/7547da0))
- **artifact-user-plugin:** add UserEditModal with pseudo editing, avatar upload/generation, and Storybook ([06d0d00](https://github.com/alistigo/holos/commit/06d0d00))
- **artifact-user-plugin:** implement plugin object with setup, wrapRoot, placeholder renderStatusBadge ([5752869](https://github.com/alistigo/holos/commit/5752869))
- **artifact-user-plugin:** add UserContext, UserProvider, useUser/useSetUser/useRegenerateAvatar hooks ([3013edc](https://github.com/alistigo/holos/commit/3013edc))
- **artifact-user-plugin:** add User model, avatar generation with jdenticon, pseudo generator ([a8200ae](https://github.com/alistigo/holos/commit/a8200ae))
- **artifact-user-plugin:** scaffold package with Storybook config ([0997461](https://github.com/alistigo/holos/commit/0997461))

### 🩹 Fixes

- **artifact-user-plugin:** add bun type to tsconfig so bun:test resolves ([b9e9ddd](https://github.com/alistigo/holos/commit/b9e9ddd))
- **artifact-user-plugin:** import globals.css in Storybook preview for Tailwind styles ([1728b60](https://github.com/alistigo/holos/commit/1728b60))
- add fallow complexity suppresses and unused var fix to pass pre-push gate ([7a1c57b](https://github.com/alistigo/holos/commit/7a1c57b))
- **artifact-user-plugin:** fix biome-ignore placement for noChildrenProp in wrapRoot ([dc19fa1](https://github.com/alistigo/holos/commit/dc19fa1))

### 🧱 Updated Dependencies

- Updated artifact-core-components-react to 0.4.1
- Updated artifact-plugin-api to 0.4.1
- Updated logger to 0.3.1

### ❤️ Thank You

- Claude Sonnet 4.6
- Mikael Labrut @MLKiiwy