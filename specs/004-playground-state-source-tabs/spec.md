# Feature Specification: Playground State Persistence & Source Tabs

**Feature Branch**: `feat/004-playground-state-source-tabs`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "I want to modify some features on the artifact playground. So first the form part on the left of the playground, should be stored in local storage so if we reload the page the form keep the values. That should be the case for all the part of the form (playground, global artifact and artifcat config). I want also that the 'source' (dev / prod local) and artifact field can be populated from the url using query parameter. On the right side of the playground, on top, I want to add more tabs. Keep the existing one, but add: one tab called 'AI Bridge' that will show the code of the injected by AI chat depending of the AI context (example the code of 'claude API' — that code appears already in the 'source' tab but the idea is to have only that part visible on this tab; use also the same component to show the html/js text in colors, reuse similar component of the source tab). Same idea, a 'Artifact source' tab that show the code to inject the artifact only => without the AI bridge, without the config tag, and without the AI input tag. Add also a tab 'Playgound source' for the rest of source not present in other tabs. As result the 'Source' tab (existing) should be the result of merging all the other tabs. Note: be sure to not break the e2e tests with these changes on the playground."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The playground remembers my setup across a reload (Priority: P1)

A developer configures the playground left-hand form — which artifact, which language, read-only on or off, which plugins and their config, which document fixture, and (in development) whether the artifact comes from the live dev source or the local production build. Today a browser reload throws all of that away and the developer re-picks every field before they can continue. After this change, reloading the page brings the form back exactly as it was left.

**Why this priority**: This is the friction the developer hits on every single reload, many times an hour, and it blocks nothing else. It delivers value on its own even if no other story ships.

**Independent Test**: Set every field of the left form away from its default, reload the browser, and confirm each field still shows the chosen value and the preview boots the chosen artifact — no other story needs to exist.

**Acceptance Scenarios**:

1. **Given** the playground is open with its default selections, **When** the developer changes the artifact, the language, the read-only toggle, the AI context, and the artifact-source selection, and then reloads the page, **Then** every one of those fields shows the value chosen before the reload.
2. **Given** an artifact that offers plugins, **When** the developer enables a plugin, edits that plugin's configuration, picks a document fixture, and reloads the page, **Then** the plugin is still enabled with its edited configuration and the same document fixture is still selected.
3. **Given** the developer selected the raw-markdown document option and typed markdown into it, **When** the page is reloaded, **Then** the raw-markdown option is still selected and the typed markdown is still present.
4. **Given** a reload restored a previous setup, **When** the page finishes loading, **Then** the preview panel boots the restored artifact with the restored configuration, without the developer touching the form.
5. **Given** a saved setup names an artifact, plugin, or document that the playground no longer offers, **When** the page is loaded, **Then** the playground falls back to a valid default for just that field, keeps every still-valid field, and continues to work rather than showing a broken or empty form.

---

### User Story 2 - I can hand someone a link that opens the right artifact (Priority: P1)

A developer, a teammate, or a tool (documentation link, test harness, chat message) wants to open the playground already pointed at a specific artifact and a specific artifact source, without clicking through the form. A link carrying those two values in its address does it.

**Why this priority**: It is the entry point for sharing a reproduction and for any automation that drives the playground, and it is what makes the persisted state overridable instead of sticky.

**Independent Test**: Open the playground with an address naming an artifact and an artifact source, and confirm the form and the preview both honour the address — testable with no other story in place.

**Acceptance Scenarios**:

1. **Given** a playground address that names an artifact, **When** the page is opened, **Then** the artifact field shows that artifact and the preview boots it.
2. **Given** a playground address that names an artifact source (live dev source or local production build), **When** the page is opened in development, **Then** the artifact-source field shows that choice and the preview loads the artifact from it.
3. **Given** a previously saved setup naming artifact A, **When** the playground is opened with an address naming artifact B, **Then** artifact B wins, and every field the address says nothing about keeps its saved value.
4. **Given** the playground was opened with an address naming an artifact, **When** the developer then picks a different artifact in the form, **Then** the form and preview follow the new pick and the address stops forcing the old one for the rest of the session.
5. **Given** a playground address naming an artifact or source that is not valid, **When** the page is opened, **Then** the playground reports nothing broken: it falls back to the saved or default value for that field and remains usable.

---

### User Story 3 - I can read the injected page as four separate, purposeful pieces (Priority: P2)

The preview panel already offers a Source view of the whole page injected into the preview. That page mixes four concerns, and a developer debugging one of them has to find it inside the rest. Three new views each show exactly one piece, and the existing Source view keeps showing the whole thing.

**Why this priority**: It is a comprehension and debugging aid on top of information that is already available, so it ranks below the two stories that remove repeated manual work. It still earns its place: the bridge code in particular is the part developers most often need to inspect in isolation.

**Independent Test**: Open each new view in turn and confirm it shows its own piece, with syntax colouring, and that the pieces together account for everything the Source view shows.

**Acceptance Scenarios**:

1. **Given** the AI context is a Claude-style AI chat, **When** the developer opens the AI Bridge view, **Then** it shows only the bridge code that the AI chat injects, syntax-coloured and copyable, in the same presentation style as the existing Source view.
2. **Given** the AI context is set to no AI chat, **When** the developer opens the AI Bridge view, **Then** it explains that this context injects no bridge code rather than showing an empty or stale panel.
3. **Given** any configuration, **When** the developer opens the Artifact source view, **Then** it shows only the markup that loads the artifact itself, and carries no bridge code, no artifact-configuration block, and no AI-input block.
4. **Given** any configuration, **When** the developer opens the Playground source view, **Then** it shows the remaining host-page markup — the parts that belong to none of the other views.
5. **Given** any configuration, **When** the whole injected page is compared against the five parts behind the views, **Then** every piece of the page belongs to exactly one part — nothing left out, nothing counted twice — and the Source view shows the whole page.
6. **Given** the developer changes a form field, **When** the new views are open, **Then** each view updates to reflect the new configuration.
7. **Given** the existing App, Source, Config, and AI Input views, **When** the new views are added, **Then** the existing four keep their names, their order relative to one another, and their current behaviour, and the three new views sit as a group directly after Source — so the panel reads App, Source, AI Bridge, Artifact source, Playground source, Config, AI Input.

---

### User Story 4 - The existing end-to-end suites keep passing (Priority: P1)

The playground is the host that every Gherkin end-to-end suite drives. Those suites open the playground, select an artifact, tick plugin checkboxes, seed storage, and reload. Persisting the form and reading the address must not change what those suites observe.

**Why this priority**: A regression here silently invalidates the whole test estate, so it is as critical as the features themselves, and it must be demonstrated rather than assumed.

**Independent Test**: Run the existing end-to-end suites unchanged against the modified playground and confirm they pass.

**Acceptance Scenarios**:

1. **Given** the existing end-to-end suites, **When** they run against the modified playground with no changes to the suites themselves, **Then** they all pass.
2. **Given** a scenario that starts by opening the playground, **When** it runs after an earlier scenario left a saved setup behind, **Then** it starts from a clean, predictable configuration and is unaffected by the earlier scenario.
3. **Given** a scenario that clears browser storage and then reloads to seed a known state, **When** it reloads, **Then** the artifact under test is still the artifact selected for the run.
4. **Given** a scenario that enables a plugin and then reloads, **When** the reload completes, **Then** the plugin state the scenario expects is the one in effect.
5. **Given** the playground's storage inspector, which lists the stored entries belonging to artifacts, **When** the playground saves its own form state, **Then** the inspector does not list the playground's own form entry among the artifact entries.

---

### Edge Cases

- A saved setup written by an earlier version of the playground, whose shape no longer matches: the playground must start from defaults rather than fail to load.
- Browser storage unavailable or full (private browsing, quota exceeded): the playground must still open and work, just without remembering anything.
- Two playground tabs open at once: each keeps working; the last one to write is the one whose setup is restored next time.
- The artifact-source field is only offered in development. An address naming a source when the playground is a production build must be ignored without error.
- A scenario that clears all browser storage mid-run also clears the playground's saved setup; the playground must recover to a working state after the reload that follows.
- The Clear Data control clears the whole storage area the artifact shares with the playground, so it reaches the saved form setup too. The form must not quietly lose its setup at the next page load because of it — on screen nothing changed, so nothing would explain the loss.
- An artifact selection restored from storage that has no corresponding local build in the current working tree must behave exactly as the same selection made by hand does today.
- Plugin configuration saved while it was mid-edit and syntactically incomplete must not prevent the next load.

## Requirements *(mandatory)*

### Functional Requirements

**Form persistence**

- **FR-001**: The playground MUST save the left-hand form's configuration to the browser's local storage whenever the developer changes it.
- **FR-002**: The saved configuration MUST cover every field of all three form sections — Playground config (artifact source, AI context), Global artifact config (artifact, language, read-only), and Artifact config (enabled plugins and each plugin's configuration, selected document, raw markdown) — plus the published-artifact toggle.
- **FR-003**: On load, the playground MUST restore the saved configuration into the form and use it to boot the preview, without any developer action.
- **FR-004**: The playground MUST validate each restored field against what it currently offers, and replace only the invalid fields with their defaults, keeping the rest.
- **FR-005**: The playground MUST remain fully usable when the saved configuration is absent, unreadable, or of an unrecognised shape, and when local storage cannot be read or written at all.
- **FR-006**: The playground's saved configuration MUST be stored under a key that the playground's artifact-storage inspector does not present as artifact storage.
- **FR-022**: Clearing the artifact's data MUST NOT discard the developer's saved form setup. The two are separate concerns: clearing data resets what the artifact stored, while the form setup describes how the playground is configured, and a developer who clears data expects to keep working with the same artifact, language and plugins.

**Address parameters**

- **FR-007**: The playground MUST accept the artifact selection as a parameter in its address and apply it on load.
- **FR-008**: The playground MUST accept the artifact-source selection (live dev source or local production build) as a parameter in its address and apply it on load wherever that field is offered.
- **FR-009**: Where an address parameter and a saved value disagree, the address parameter MUST win; fields the address says nothing about MUST keep their saved value.
- **FR-010**: An address parameter naming a value the playground does not offer MUST be ignored in favour of the saved or default value, without blocking the page.
- **FR-011**: After load, a change the developer makes in the form MUST take effect and MUST NOT be reverted by the address parameter that was present on load.

**Preview panel views**

- **FR-012**: The preview panel MUST keep its existing App, Source, Config, and AI Input views, with their current names, their order relative to one another, and their behaviour, and MUST add three further views: AI Bridge, Artifact source, and Playground source. The three new views MUST sit together with the Source view, immediately after it, so that the views showing the injected page's code read as one group; the Config and AI Input views therefore move to the right of them.
- **FR-013**: The AI Bridge view MUST show only the bridge code injected on behalf of the selected AI context, and MUST state plainly when the selected context injects none.
- **FR-014**: The Artifact source view MUST show only the markup that loads the artifact, and MUST exclude the AI bridge code, the artifact-configuration block, and the AI-input block.
- **FR-015**: The Playground source view MUST show the injected page's remaining host markup — everything that belongs to none of the other views.
- **FR-016**: The three new views MUST present their content with the same syntax-coloured, copyable presentation the existing Source view uses.
- **FR-017**: The injected page MUST be divided into five named parts — AI bridge, artifact loader, artifact configuration, AI input, and host remainder — each owned by exactly one view, so that the five together account for the whole page: no part of it belonging to none of them, and no part belonging to two. The Source view MUST show the whole page.
- **FR-023**: The AI Bridge, Artifact source and Playground source views MUST show their part as it appears in the page. The Config and AI Input views MUST show theirs in the readable form they use today — structured configuration and plain markdown — rather than the surrounding markup; they still own their part for the purposes of FR-017.
- **FR-018**: All views MUST reflect the current form configuration and MUST update when it changes.

**Compatibility**

- **FR-019**: The existing end-to-end suites MUST pass unchanged against the modified playground.
- **FR-020**: A fresh browser session MUST start the playground from its documented defaults, so that an automated run is never influenced by a previous one.
- **FR-021**: Reloading the page MUST leave the artifact selection in effect, so that a reload performed mid-run continues to exercise the artifact chosen for that run.

### Key Entities

- **Saved playground setup**: the developer's full left-hand form configuration, held in the browser between visits, versioned so an unrecognised shape can be discarded rather than misread.
- **Address parameters**: the artifact and artifact-source values carried in the playground's address, which seed the setup on load and outrank the saved one.
- **Injected page segment**: one named slice of the page injected into the preview — AI bridge, artifact loader, artifact configuration, AI input, or host remainder — each shown by exactly one view, and together forming the whole page.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After a page reload, a developer resumes work with zero form fields to re-set, down from every field they had changed.
- **SC-002**: 100% of the left form's fields across all three sections survive a reload.
- **SC-003**: A developer can open the playground on a chosen artifact and artifact source in a single step, by following a link, with no clicks in the form.
- **SC-004**: Every piece of the injected page is owned by exactly one view; an automated check over the whole page and its five parts reports nothing left out and nothing duplicated.
- **SC-005**: The existing end-to-end suites pass with a 100% pass rate against the modified playground, with no edits to the suites.
- **SC-006**: A developer inspecting the AI bridge code reads it on its own, with no unrelated markup in view.
- **SC-007**: Clearing the artifact's data costs the developer zero form fields to re-set.

## Assumptions

- "The form part on the left" means the left panel's Config view, i.e. the three sections Playground config, Global artifact config, and Artifact config. The Claude Simulator panel's own controls (response delay, canned response, error and suppression modes, and its log buffers) are session-scoped tooling and are not persisted; the published-artifact toggle is persisted because it is part of the configuration injected into the preview.
- The address parameters are named after the fields the developer sees — one for the artifact, one for the source — and are read on load only. The playground is not required to rewrite its own address as the form changes; a shareable link is produced by hand or by whatever tool opens the playground.
- The artifact-source parameter is only meaningful where the artifact-source field exists, which today is development only.
- The existing Config and AI Input views keep their current readable presentations rather than showing raw markup; FR-023 states this, and FR-017 states how it counts toward completeness. Only the three new views show the page's text as written.
- Persistence is per browser and per origin, is not shared between machines or profiles, and carries no user-identifying data beyond the playground selections themselves.
- No new Gherkin end-to-end coverage is required by this feature; existing suites act as the regression guard, and the new behaviour is verified at the component and unit level. Adding feature-level coverage for the new views remains optional.

## Dependencies

- The playground app `apps/alistigo-artifact-playground` and the artifact registry it reads its artifact list from.
- The shared end-to-end harness in `cli/artifact-features-runner-playwright`, whose playground page object opens the playground, selects the artifact, ticks plugin checkboxes, clears storage, and reloads. Its reload path currently re-selects the artifact after a reload precisely because the selection was not persisted; that path must stay correct once it is.
- The existing Gherkin suites `packages/list-features` and `packages/artifact-ai-draw-comments-features`, which are the regression guard for FR-019.
