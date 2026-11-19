# Specification Quality Checklist: Playground State Persistence & Source Tabs

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-11-18
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Validation Notes

Iteration 1 findings, all resolved in the spec before it was first saved:

- **Implementation leakage**: the user's own wording names local storage, URL query
  parameters and specific tab titles. Requirements were restated in user-facing terms
  ("the browser's local storage" as the persistence medium the user asked for,
  "parameter in its address", "views"), and no component, hook or file name appears in
  any requirement. The Dependencies section names repository paths deliberately — it
  describes existing systems the feature touches, not how to build it.
- **Testability**: FR-017 (Source = the other views merged) started as "Source is the
  merge of the other tabs", which is not checkable without saying what merge means. It
  now states the two checkable properties: nothing missing from all views, nothing
  present in two.
- **Measurability**: SC-001 and SC-002 replaced an earlier qualitative
  "the developer does not lose their place".
- **Scope boundary**: whether the Claude Simulator controls are part of "the form" was
  the one genuinely ambiguous point. The user enumerated the three Config sections
  ("playground, global artifact and artifact config"), so the simulator panel is
  excluded and that reading is recorded in Assumptions rather than left open.

The `Key Entities` section is retained (the feature introduces persisted state and
address parameters); the template's optional placeholder stories beyond User Story 4
were removed rather than left as stubs.

## Post-Analysis Revision (2026-11-19)

`/speckit-analyze` surfaced a behaviour the spec did not cover: the preview iframe is same-origin,
so the Clear Data control's `localStorage.clear()` reaches the playground's own saved setup. Added
**FR-022** (clearing artifact data must not discard the form setup), **SC-007**, and the matching
edge case. Both were re-checked against the checklist above: FR-022 is testable (the key survives
the clear; the form is unchanged after the next load), and SC-007 is measurable and
technology-agnostic. All items remain passing.

### Second revision (same pass)

- **FR-017** previously required the *Source view's content* to be accounted for by the other
  *views*. Taken literally that was false: the Config view renders pretty-printed configuration and
  the AI Input view bare markdown, neither of which is the markup the page carries. FR-017 now states
  the partition over the page's five named parts, and new **FR-023** states which views show their
  part verbatim and which show it in readable form. SC-004 and User Story 3's scenario 5 were
  reworded to match, and the assumption that carried this quietly was reduced to a pointer.
- Both revised requirements re-checked: FR-017 is testable (an automated partition check over the
  page and its parts) and FR-023 is observable per view.

### Third revision (same pass)

- **FR-012** required the existing four views to keep "their current names, order, and behaviour",
  which forced the three new views to be appended after `AI Input`. The requester chose the grouping
  instead, so FR-012 and User Story 3's scenario 7 now require the three new views to sit directly
  after `Source` — the four code views as one group — and ask only that the existing four keep their
  names, their *relative* order and their behaviour. Research R8 records the reversal and what it
  costs (`Config` and `AI Input` move two places right).
- Terminology: a glossary was added to plan.md mapping each stakeholder term to its name in the code
  ("artifact source" → `Config.mode`, "address parameter" → URL query parameter, "view" → tab, "part"
  → `SrcdocSegment`). The spec's register is unchanged — this closes the drift without flattening it.
- Every FR now carries at least one task citation in tasks.md, so the coverage audit is mechanical
  rather than inferred.

All checklist items above remain passing after the three revisions. Requirement count: 23 FR, 7 SC.
