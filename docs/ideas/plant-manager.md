# Idea: Plant Manager App

## Overview

A small personal app to manage house plants: watering schedules, care notes, and a health log.

Simple, mobile-friendly, offline-first.

---

## Problem

Managing a collection of house plants is surprisingly hard to keep track of:
- Which plant needs water today? Which one did I water yesterday?
- What's the name of that succulent on the shelf?
- When did I last repot the ficus? Did it have those yellow leaves before or after I moved it?

A phone app would help, but most plant apps are heavy (social features, plant databases, premium paywalls).
This one should be minimal — a tool, not a product.

---

## Core Features

### Plants List

- Add a plant: name, species (optional), photo, location (e.g., "living room window").
- Quick overview: which plants need attention today (overdue for water, fertiliser, etc.).

### Watering Schedule

- Per-plant watering frequency (every N days, or specific weekdays).
- Tap **Watered** to log the event and reset the timer.
- Visual indicator: green (fine), yellow (due soon), red (overdue).

### Care Notes & Log

- Free-text notes per plant (repotting date, soil type, last fertiliser, observed issues).
- Simple chronological log: *"2026-10-01 — repotted into 15cm pot"*, *"2026-09-15 — noticed brown tips, reduced watering"*.

### Reminders (optional, v2)

- Push notification on the day a plant is due for watering.
- Requires PWA notification permission or native app.

---

## Technical Direction

This fits naturally as an **Alistigo artifact** or as a small standalone app.

**Option A — Alistigo artifact:**
- Leverage the existing list artifact infrastructure.
- Each plant is a list item with typed properties.
- AI can assist: *"Which of my plants needs water most urgently?"*, *"What's the care routine for a Monstera deliciosa?"*
- Shares storage and PWA export path with the rest of the platform.

**Option B — Standalone app (`apps/plant-manager`):**
- Simpler scope, fully self-contained.
- Can be exported as a PWA via the artifact→PWA tool once that exists.
- No AI dependency — just a useful local tool.

Lean towards **Option A** as it exercises and validates the Alistigo artifact platform with a real-world use case. The AI integration is genuinely useful here (care advice, identification, problem diagnosis).

---

## Data Model

```ts
type Plant = {
  id: string
  name: string
  species?: string
  photoUrl?: string
  location?: string
  wateringFrequencyDays: number
  lastWateredAt?: Date
  notes: string
  log: PlantLogEntry[]
  createdAt: Date
}

type PlantLogEntry = {
  id: string
  date: Date
  type: 'watered' | 'repotted' | 'fertilised' | 'observation' | 'note'
  body: string
}
```

---

## UI Sketches (rough)

**Main screen:** card grid of plants, each card shows name + photo thumbnail + watering status indicator.

**Plant detail:** photo header, next watering date, quick **Watered** button, care notes textarea, log timeline below.

**Add plant:** simple form — name, photo (camera or upload), watering frequency slider.

---

## Open Questions

- Should this integrate with any plant identification API (e.g., Plant.id) to auto-fill species info from a photo?
- Shared / family use: multiple people caring for the same plants. Multi-user scope?
- What's the right watering model for plants with variable schedules (e.g., "water when soil is dry")?
