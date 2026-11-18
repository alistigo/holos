/**
 * The DOM/ARIA contract the draw-comments widget must honour for these
 * behaviour specs to drive it.
 *
 * Accessibility-first: roles plus accessible names wherever the widget's own
 * controls provide them, which is almost everywhere — every button and input
 * carries an `aria-label` from a Lingui `t` macro.
 *
 * Test ids appear only where ARIA deliberately cannot reach:
 *  - the selection overlay and its drag indicator are `role="presentation"`,
 *    i.e. removed from the accessibility tree on purpose;
 *  - the drawing panel and region wrapper are layout containers with no role.
 */

export const ROLES = {
  drawCommentButton: { role: "button", name: "Draw Comment" },
  cancelSelection: { role: "button", name: "Cancel selection" },
  cancelAnnotation: { role: "button", name: "Cancel annotation" },
  commentInput: { role: "textbox", name: "Annotation comment" },
  sendButton: { role: "button", name: "Send" },
  rectangleTool: { role: "button", name: "Rectangle" },
  lineTool: { role: "button", name: "Line" },
  annotationImage: { role: "img", name: "Annotated region" },
  dismissError: { role: "button", name: "Dismiss error" },
} as const;

export const TEST_IDS = {
  /** Full-screen drag-select overlay (role="presentation"). */
  selectionOverlay: "selection-overlay",
  /** The rectangle drawn while dragging a region. */
  selectionIndicator: "selection-indicator",
  /** Wrapper positioned over the selected region; holds the canvas. */
  drawRegion: "draw-region",
  /** Bottom panel holding the toolbar, comment input and Send. */
  drawPanel: "draw-panel",
  /** Static stand-in host content injected by the playground's iframe srcdoc. */
  hostSurface: "draw-comments-host-surface",
} as const;

/** The widget's own canvas element; Konva renders the shapes into it. */
export const CANVAS_SELECTOR = "canvas";

/** Claude's response paragraph inside an annotation thread. */
export const RESPONSE_SELECTOR = "p.whitespace-pre-wrap";
