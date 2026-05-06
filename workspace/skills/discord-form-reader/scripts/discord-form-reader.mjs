#!/usr/bin/env node
import { readFileSync } from 'fs';

/**
 * Discord Form Reader Skill
 * Parses form responses from #filled-answers channel
 * and extracts structured business data
 */

// Read input from stdin
const input = readFileSync(0, 'utf-8').trim();
let payload;

try {
  payload = JSON.parse(input);
} catch (e) {
  console.log(JSON.stringify({
    ok: false,
    error: {
      message: "Invalid JSON input",
      details: e.message
    }
  }));
  process.exit(1);
}

// Extract message content and metadata
const { content, channel, author, timestamp } = payload;
const raw = content;

// Parse form fields from the message
// Forms APP bot sends messages with "What is..." patterns followed by answers
function parseFormResponse(content) {
  const fields = {};
  const lines = content.split('\n').filter(line => line.trim());
  
  // Pattern matching for Forms APP responses
  const patterns = {
    businessName: /What\s+is\s+the\s+name\s+of\s+your\s+business\?\s*\n\s*(.+)/i,
    businessDescription: /What\s+does\s+your\s+business\s+do\s+exactly\?\s*\n\s*(.+)/i,
    field: /Which\s+field\s+does\s+your\s+business\s+apply\s+to\?\s*\n\s*(.+)/i,
  };

  for (const [field, pattern] of Object.entries(patterns)) {
    const match = content.match(pattern);
    if (match && match[1]) {
      fields[field] = match[1].trim();
    }
  }

  return fields;
}

// Extract data
const extractedFields = parseFormResponse(content);

// Validate required fields
const requiredFields = ['businessName', 'businessDescription', 'field'];
const missingFields = requiredFields.filter(f => !extractedFields[f]);

if (missingFields.length > 0) {
  console.log(JSON.stringify({
    ok: false,
    error: {
      message: "Missing required fields in form response",
      details: `Missing: ${missingFields.join(', ')}`,
      raw: raw
    }
  }));
  process.exit(1);
}

// Calculate confidence scores
const confidence = {
  overall: calculateOverallConfidence(extractedFields),
  perField: calculatePerFieldConfidence(extractedFields)
};

function calculateOverallConfidence(fields) {
  const filledCount = Object.values(fields).filter(v => v && v.trim()).length;
  const totalFields = requiredFields.length;
  return filledCount / totalFields;
}

function calculatePerFieldConfidence(fields) {
  const confidence = {};
  for (const [field, value] of Object.entries(fields)) {
    // Simple heuristic: shorter generic answers have lower confidence
    if (!value || value.trim().length < 3) {
      confidence[field] = 0.0;
    } else if (value.trim().length < 10) {
      confidence[field] = 0.5;
    } else {
      confidence[field] = 0.8;
    }
  }
  return confidence;
}

// Map fields to standard schema
const data = {
  businessName: extractedFields.businessName,
  businessDescription: extractedFields.businessDescription,
  industry: extractedFields.field, // Maps "field" to "industry" per your schema
  targetAudience: extractedFields.targetAudience || "Not specified",
  productsServices: extractedFields.productsServices || "Not specified",
  usp: extractedFields.usp || "Not specified",
  contactInfo: extractedFields.contactInfo || "Not specified",
  timestamp: timestamp || new Date().toISOString(),
  confidence: confidence
};

// Output successful result
console.log(JSON.stringify({
  ok: true,
  data: data,
  raw: raw,
  metadata: {
    channel: channel,
    author: author,
    timestamp: timestamp
  }
}));