# Feature Specification: AI Draw Comments

**Feature Branch**: `feat/001-ai-draw-comments`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Develop the artifact ai-draw-comments. This artifact will be an application that your can integrate in other artifacts. Its a kind of meta application or a super-plugin for any artifacts. But it can also run as solo application..."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Annotate and Send a Draw Comment (Priority: P1)

A user is viewing a Claude artifact and wants to point out a specific area and explain their feedback using a visual annotation rather than a purely text-based comment. They click the "Draw Comment" button, draw a selection box around the element they want to annotate, then sketch a rectangle or line on top to highlight what they mean, write a brief comment, and hit "Send". The annotation is captured as a combined image with the underlying content and submitted to Claude.

**Why this priority**: This is the core user journey — the reason the tool exists. Without this end-to-end flow, nothing else has value.

**Independent Test**: Can be tested by loading the tool in a standalone artifact (or the ai-draw-comments demo page), performing the full draw-comment-send cycle, and verifying Claude receives the annotated image.

**Acceptance Scenarios**:

1. **Given** the artifact is loaded with the Draw Comment button visible, **When** the user clicks the button, **Then** the cursor changes to a crosshair selection mode.
2. **Given** selection mode is active, **When** the user click-drags across a region, **Then** a rectangular selection indicator is shown over that region.
3. **Given** a region is selected, **When** the selection is confirmed, **Then** a transparent drawing canvas overlay appears on top of the selected region, and a drawing toolbar becomes visible.
4. **Given** the canvas is active with the rectangle tool selected, **When** the user click-drags on the canvas, **Then** a rectangle shape is drawn on the overlay while the underlying content remains fully visible through the canvas.
5. **Given** the user has drawn shapes and optionally written a comment, **When** they click "Send", **Then** a PNG image is generated combining the underlying area capture and the drawn shapes, and both the PNG and comment are sent to Claude.
6. **Given** "Send" was clicked, **When** the submission is complete, **Then** the drawing canvas switches to read-only mode: shapes are visible but no new drawing or editing is possible.

---

### User Story 2 - View Claude's Response to an Annotation (Priority: P2)

After sending a draw comment, the user wants to see Claude's response without navigating away from the artifact. Claude's reply appears inline, directly below the submitted annotation and comment.

**Why this priority**: Without seeing Claude's response, the feedback loop is broken. This is the second most critical piece of the value proposition.

**Independent Test**: Can be tested by sending a draw comment and verifying that Claude's textual response appears below the annotation view.

**Acceptance Scenarios**:

1. **Given** a draw comment was just sent, **When** Claude responds via the window.claude API, **Then** Claude's response text appears below the annotation display area without a page reload.
2. **Given** Claude's response is displayed, **When** the user reads it, **Then** both the annotated PNG and the original comment are still visible above the response.
3. **Given** Claude's response is displayed, **When** the user looks at the top of the artifact, **Then** the "Draw Comment" button is active again, allowing a new annotation cycle to begin.

---

### User Story 3 - Embed the Tool in Another Artifact (Priority: P3)

A developer building a Claude artifact wants to add draw-comment capability to their artifact without building it from scratch. They include the ai-draw-comments bundle and the "Draw Comment" button appears at the top of their artifact, fully functional.

**Why this priority**: The plugin/embeddable nature is a key differentiator but it depends on the core flow (P1, P2) being solid first. It is independently valuable for artifact developers.

**Independent Test**: Can be tested by creating a minimal host artifact that imports the ai-draw-comments bundle and verifying the button appears and the full draw-comment flow works within the host.

**Acceptance Scenarios**:

1. **Given** a host artifact that has included the ai-draw-comments bundle, **When** the host artifact loads, **Then** the "Draw Comment" button is visible at the top of the host artifact's UI.
2. **Given** the draw comment tool is embedded in a host artifact, **When** the user completes a draw comment cycle, **Then** the annotated image captures the host artifact's content (not just a blank canvas).

---

### Edge Cases

- What happens when the user clicks "Send" without drawing anything? → Send is allowed with comment only; the PNG captures the selected area as-is (no drawn shapes on top).
- What happens when the user clicks "Send" without a comment and without any drawing? → The "Send" button is disabled until at least one shape is drawn OR a non-empty comment is entered.
- What happens if the user clicks outside the canvas after the overlay appears? → Clicking outside the canvas does nothing; the user must explicitly cancel via the "Cancel" / "×" button on the overlay or by pressing Escape.
- What happens if `window.claude` API is unavailable? → The tool displays a non-blocking warning that it is not running inside a Claude artifact, and the "Send" button is disabled.
- What if the selected region is very small (e.g., less than 20×20 pixels)? → A minimum selection size is enforced; the user is nudged to select a larger area.
- What if Claude's response is delayed? → A loading indicator appears below the annotation after sending, replaced by the response when it arrives.
- What if `window.claude.sendMessage()` fails or times out? → An inline error message appears below the canvas; the toolbar and "Send" button are re-enabled so the user can retry without losing their drawing or comment.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The tool MUST display a persistent "Draw Comment" button at the top of the artifact at all times (not hidden by scroll or other UI elements).
- **FR-002**: When the user activates draw-comment mode, the tool MUST switch the cursor to a crosshair and allow the user to drag-select any rectangular region of the visible artifact area.
- **FR-003**: Upon completing a rectangular selection, the tool MUST render a transparent drawing canvas overlay precisely covering the selected region, without hiding the underlying artifact content.
- **FR-004**: A drawing toolbar MUST be displayed adjacent to the canvas (top or side), offering at minimum a rectangle tool and a line tool.
- **FR-005**: The drawing canvas MUST keep the underlying content visible at all times; drawn shapes appear on top but do not obscure the content beneath them.
- **FR-006**: A comment input area (multi-line text field) and a "Send" button MUST be displayed below the canvas overlay.
- **FR-007**: The "Send" button MUST be disabled when neither any shape has been drawn nor any text entered in the comment field.
- **FR-008**: When the user clicks "Send", the tool MUST generate a PNG image that composites the captured snapshot of the underlying selected area with the drawn shapes on top.
- **FR-009**: The tool MUST transmit the annotated PNG and comment to Claude by calling `window.claude.complete()` with a multi-content array containing an image block (the PNG as base64) and a text block (the comment text). This requires extending the `ClaudeApi` type in `@alistigo/claude-artifact-api` to support the vision overload.
- **FR-010**: After a successful send, the tool MUST transition the drawing canvas to read-only mode: shapes remain visible but the toolbar and comment input are removed or disabled.
- **FR-011**: Claude's response MUST be displayed below the submitted annotation and comment, in-place, as it arrives.
- **FR-012**: The tool MUST be operable as a standalone artifact via a minimal demo shell (no full Alistigo Artifact Contract required — no loading screen, error screen, badge, config-doc, or state-doc).
- **FR-013**: The tool MUST be embeddable in another Claude artifact via a single bundle inclusion, with the Draw Comment button appearing in the host's UI.
- **FR-015**: The tool MUST ship an agent skill package that allows Claude to understand and invoke the draw-comment capability in conversation.
- **FR-014**: When `window.claude` is not available, the tool MUST display a clear notice and disable the "Send" button.
- **FR-016**: If `window.claude.sendMessage()` fails or times out, the tool MUST display an inline error message below the canvas and re-enable the toolbar and "Send" button so the user can retry with their drawing and comment preserved.
- **FR-017**: The drawing overlay MUST provide an explicit "Cancel" (or "×") button that dismisses the overlay and discards any in-progress drawing. Pressing the Escape key MUST have the same effect.

### Key Entities

- **DrawCommentSession**: Represents one complete annotation cycle. Multiple sessions may exist per page load (sequential, never concurrent). Attributes: selected region, drawn shapes, comment text, status (idle / selecting / drawing / sent), Claude response.
- **SelectionRegion**: A rectangular area of the artifact chosen by the user. Attributes: position (x, y), dimensions (width, height).
- **DrawShape**: A single shape drawn on the canvas. Attributes: type (rectangle | line), start point, end point, stroke color, stroke width.
- **AnnotatedSnapshot**: The final deliverable sent to Claude. Attributes: PNG image data (base64), comment text, timestamp. Transmitted via `window.claude.complete([imageBlock, textBlock])` using the extended vision overload of `ClaudeApi`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can go from clicking "Draw Comment" to having a shape drawn and ready to send within 30 seconds on their first use, with no prior instructions.
- **SC-002**: The drawing canvas always shows 100% of the underlying artifact content — no opacity or visibility loss of the content below shapes.
- **SC-003**: The annotated PNG is generated and transmitted to Claude within 3 seconds of clicking "Send" on a standard laptop.
- **SC-004**: Claude's response appears in-place (no navigation or reload) within 5 seconds of the API call completing.
- **SC-005**: A developer can embed the draw-comment capability in an existing Claude artifact by including one script tag or import, with no additional configuration needed for the basic flow.

## Assumptions

- The tool runs exclusively inside Claude artifact iframes where the `window.claude` messaging API is available; direct network access is not assumed.
- Annotations are session-scoped and not persisted across Claude conversation turns or browser refreshes.
- Sequential annotations are supported: after Claude responds to a draw comment, the "Draw Comment" button becomes active again and the user may start a new cycle. Only one annotation cycle is active at a time (concurrent/overlapping cycles are not supported).
- The selected region for capture is bounded by the visible viewport of the artifact iframe.
- The comment text is optional; a drawing alone is a valid submission.
- The tool is used by artifact viewers (end users) and artifact developers (integration); both are equally primary.
- The host artifact's content can be captured into a PNG without cross-origin restrictions, as artifacts run in the same iframe context.
- The tool is a lightweight embeddable widget — it does NOT implement the full Alistigo Artifact Contract (no loading screen, error screen, Alistigo badge, config-doc, or state-doc). It DOES ship an agent skill package.
- Color and stroke-weight customization for drawing tools is out of scope for v1 (a default style is applied).
- Undo/redo for drawing actions is out of scope for v1.

## Clarifications

### Session 2026-11-13

- Q: What specific method of the `window.claude` API should be used to submit the annotated PNG and comment text to Claude? → A: `window.claude.sendMessage()` with a multi-content array — an image block (PNG as base64) plus a text block (comment).
- Q: Should ai-draw-comments implement the full Alistigo Artifact Contract or be a lightweight embeddable widget? → A: Lightweight embeddable widget (no full contract), but a skill package MUST be provided.
- Q: After a user sends a draw comment and sees Claude's response, can they start a new annotation cycle? → A: Yes — sequential annotations are allowed; the button re-activates after each Claude response.
- Q: When `window.claude.sendMessage()` fails mid-flight, what should the tool do? → A: Show an inline error below the canvas; re-enable toolbar and "Send" so the user can retry with drawing and comment preserved.
- Q: How should a user cancel the draw-comment overlay without sending? → A: An explicit "Cancel" / "×" button on the overlay plus the Escape key; both dismiss and discard the in-progress drawing.
