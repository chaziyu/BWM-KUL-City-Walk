## Phase 7 — Grounded AI Tour Guide 2.0

**Goal:** Make AI faster, cheaper, and verifiably accurate.

The current server sends a broad knowledge prompt with all site context and tries multiple fallback models sequentially.

### 7.1 Contextual site chat

When the visitor is viewing a site, send only:

* Current site facts
* User question
* Recent relevant messages
* Short behaviour instructions

Do not send all sites.

### 7.2 Retrieval for general questions

For broader questions:

```text
User question
→ retrieve 1–3 relevant sites
→ send only matching verified facts to Gemini
→ return answer with source site IDs
```

### 7.3 Structured AI response

Require internal JSON:

```json
{
  "answer": "The building was completed in 1897.",
  "sourceSiteIds": ["1"],
  "confidence": "high",
  "notFound": false
}
```

Then validate `sourceSiteIds` against `sites.json`.

### 7.4 UI changes

Show source chips below answers:

```text
Verified trail source:
Sultan Abdul Samad Building
```

### 7.5 Cost and latency

* Use one primary model and one fallback.
* Lower factual-answer temperature to `0.2`.
* Cache answers by site ID, language, and normalized question.
* Summarize old chat history instead of sending all history.
* Count user quota only after a successful answer.

### Done when

* Every factual answer is traceable to a known site.
* Unsupported questions explicitly state that verified information is unavailable.
* Average prompt size is substantially reduced.