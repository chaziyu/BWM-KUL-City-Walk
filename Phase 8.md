## Phase 8 — Route Composer

**Goal:** Turn the app from a map into a guided journey.

### Input

Ask the visitor:

* Available time
* Interest theme
* Starting point
* Walking preference
* Accessibility requirement

### Output

Generate routes such as:

```text
60-minute Merdeka Story
90-minute Faith and Culture Walk
Architecture Photo Trail
Family Heritage Quest
```

### Technical design

Start rules-based, not AI-generated.

```text
route = selectSites({
  duration,
  theme,
  startPoint,
  walkingDifficulty
});
```

Use AI only later for narrative wording, not route safety or factual routing.

### Done when

* A visitor can choose a route in under one minute.
* The map gives a clear “next stop.”
* The visitor can continue a route after closing the app.