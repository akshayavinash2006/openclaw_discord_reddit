# Output schema (informal)

All commands return JSON: `{ ok, data | error }`.

## Parsed form response object

```json
{
  "businessName": "Joe's Artisanal Coffee",
  "industry": "Specialty coffee roasting",
  "targetAudience": "Young professionals aged 25-40 who work from home",
  "productsServices": "Single-origin beans, monthly subscription boxes",
  "usp": "Direct trade with farmers, carbon-neutral shipping",
  "contactInfo": "joe@artisanalcoffee.com",
  "timestamp": "2026-01-16T12:00:00.000Z",
  "confidence": {
    "overall": 0.95,
    "perField": {
      "businessName": 0.99,
      "industry": 0.98,
      "targetAudience": 0.96,
      "productsServices": 0.94,
      "usp": 0.88,
      "contactInfo": 0.70
    }
  }
}