---
title: Timeline component fixture
description: An isolated display fixture. These stages are invented test content.
date: 2026-10-01
---

This page tests the timeline's layout and controls. It uses invented stages.

```robotics-timeline
{
  "id": "display-fixture",
  "heading": "One system. Three ways to choose.",
  "intro": "Follow the changing decision step. The lower part of the stack stays visible in every stage.",
  "caption": "These are display fixtures, not claims about robotics history. The dates and methods are invented.",
  "roles": [
    {"id": "goal", "label": "Task"},
    {"id": "decision", "label": "Decision"},
    {"id": "feedback", "label": "Feedback", "persistent": true},
    {"id": "motor", "label": "Motor control", "persistent": true}
  ],
  "stages": [
    {
      "id": "first", "year": "First", "title": "A written rule", "kicker": "Starting point",
      "summary": "The first stage turns a task into a fixed set of choices. Read the track, then compare the stack beside it.",
      "mechanism": "A written instruction chooses the next step. This sentence is a placeholder for the article's checked explanation.",
      "anchor": "section-first-stage",
      "stack": [
        {"role": "goal", "text": "A task set by a person", "mode": "designed"},
        {"role": "decision", "text": "An explicit rule", "mode": "designed"},
        {"role": "feedback", "text": "Measurements come back", "mode": "persistent"},
        {"role": "motor", "text": "The motor follows a command", "mode": "persistent"}
      ]
    },
    {
      "id": "second", "year": "Later", "title": "A learned choice", "kicker": "A different decision step",
      "summary": "The second stage changes the decision step. Its purple stack row makes that change visible. The two orange rows remain.",
      "mechanism": "Examples guide a choice. The real article supplies the method, dates, evidence, and limits.",
      "anchor": "section-second-stage",
      "stack": [
        {"role": "goal", "text": "A task set by a person", "mode": "designed"},
        {"role": "decision", "text": "A choice learned from examples", "mode": "learned"},
        {"role": "feedback", "text": "Measurements come back", "mode": "persistent"},
        {"role": "motor", "text": "The motor follows a command", "mode": "persistent"}
      ]
    },
    {
      "id": "third", "year": "Alongside", "title": "Compare the alternatives", "kicker": "A branch that can coexist",
      "summary": "The last stage has a longer title to test wrapping. The timeline's order need not claim that a later approach replaces an earlier one.",
      "mechanism": "Several possible choices are compared. The same persistent stack rows stay in view.",
      "anchor": "section-third-stage",
      "stack": [
        {"role": "goal", "text": "A task set by a person", "mode": "designed"},
        {"role": "decision", "text": "A learned comparison between choices", "mode": "learned"},
        {"role": "feedback", "text": "Measurements come back", "mode": "persistent"},
        {"role": "motor", "text": "The motor follows a command", "mode": "persistent"}
      ]
    }
  ]
}
```

## First stage

A section anchor lets the reader move from the overview to the full explanation. This text is part of the fixture.

## Second stage

The component uses native links. They still work with JavaScript disabled.

## Third stage

The print layout shows every stage and every stack. Reduced motion keeps the same reading order and controls.
