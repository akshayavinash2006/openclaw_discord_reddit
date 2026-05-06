---
name: discord-form-reader
description: >-
  Monitors Discord #filled-answers channel for form responses, extracts structured business information,
  and prepares data for downstream skills like Reddit research and post generation.
  Use when the user submits a business form response and needs automated processing for marketing research.
metadata: {"clawdbot":{"emoji":"📋","requires":{"bins":["node"]}}}
Skill: ./scripts/discord-form-reader.mjs
---

# Discord Form Reader

Read and parse Discord form responses for Clawdbot.

## What this skill is for

- Monitoring the `#filled-answers` channel for new form submissions
- Extracting structured business data (name, industry, audience, products, USP)
- Validating form completeness before processing
- Passing clean data to other skills (like reddit-readonly)
- Providing immediate feedback if form data is missing or malformed

## Hard rules

- **Read-only parsing only.** This skill never sends messages, edits form responses, or modifies Discord data.
- **Never auto-reply** with errors unless configured to do so (use `--replyOnError` flag).
- **Preserve original message content** - always keep raw form data for auditing.
- **Validate but don't alter** - your job is extraction, not modification.
- **Respect rate limits** - don't poll Discord; rely on webhook/push events.

## Output format

All commands print JSON to stdout.

- Success: `{ "ok": true, "data": { ... }, "raw": "original message" }`
- Failure: `{ "ok": false, "error": { "message": "...", "details": "..." } }`

## Data extraction schema

The skill extracts these fields from any form response:

```json
{
  "businessName": "string (required)",
  "industry": "string (required)",
  "targetAudience": "string (required)",
  "productsServices": "string (required)",
  "usp": "string (optional)",
  "contactInfo": "string (optional)",
  "timestamp": "ISO timestamp",
  "confidence": {
    "overall": 0.0-1.0,
    "perField": {}
  }
}