# Part C — New and Enhanced Features

## Phase 6 — Improve Current Features Before Adding Major New Ones

**Goal:** Make existing features more useful.

### 6.1 Replace “Explore Demo”

Rename:

```text
Explore Demo → Start Exploring
Visitor Passkey → Join an Event
```

Public users should not feel they are using a demo.

### 6.2 Improve passport logic

Create two progress types:

| Type          | Meaning                                  |
| ------------- | ---------------------------------------- |
| Explorer      | User read and explored a site remotely   |
| On-site stamp | User verified presence through GPS or QR |

This avoids forcing visitors to travel while preserving meaningful real-world achievements.

### 6.3 Improve daily challenge

Instead of only rotating riddles:

* Link each riddle to route themes.
* Reward a bonus stamp or route clue.
* Explain the answer after completion.
* Add difficulty levels.

### 6.4 Improve accessibility information

Add verified optional data fields later:

```json
{
  "walkingDifficulty": "easy",
  "stepFreeAccess": "unknown",
  "nearestTransit": "Pasar Seni LRT",
  "bestVisitTime": "morning",
  "shadeAvailable": true
}
```

Do not publish these until physically checked.