#!/usr/bin/env node
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const WORKSPACE = process.env.HOME + '/.openclaw/workspace';
const FORM_READER = `${WORKSPACE}/skills/discord-form-reader/scripts/discord-form-reader.mjs`;

// Read input from stdin
const input = readFileSync(0, 'utf-8').trim();
let payload;

try {
  payload = JSON.parse(input);
} catch (e) {
  console.log(JSON.stringify({
    ok: false,
    error: { message: "Invalid JSON input", details: e.message },
    step: "input_parsing"
  }));
  process.exit(1);
}

try {
  // ==========================================
  // STEP 1: Parse the Discord form response
  // ==========================================
  console.error('📋 Step 1: Parsing form...');
  
  const formInput = JSON.stringify({
    content: payload.content,
    channel: payload.channel || 'filled-answers',
    author: payload.author || 'Forms',
    timestamp: payload.timestamp || new Date().toISOString()
  });
  
  const tempFile = '/tmp/discord-form-input.json';
  const fs = await import('fs');
  fs.writeFileSync(tempFile, formInput);
  const formResult = JSON.parse(
    execSync(`node ${FORM_READER} < ${tempFile}`, {
      encoding: 'utf-8',
      timeout: 10000
    })
  );
  
  if (!formResult.ok) {
    console.log(JSON.stringify({
      ok: false,
      error: {
        message: "Failed to parse form",
        details: formResult.error
      },
      step: "form_parsing"
    }));
    process.exit(1);
  }
  
  const d = formResult.data;
  console.error(`✅ Parsed: ${d.businessName} | ${d.industry}`);

  // ==========================================
  // STEP 2: Validate
  // ==========================================
  if (!d.businessName || d.businessName.length < 2) {
    console.log(JSON.stringify({
      ok: false,
      error: { message: "Business name too short or missing" },
      step: "validation"
    }));
    process.exit(1);
  }

  // ==========================================
  // STEP 3: Build Reddit search strategy
  // ==========================================
  console.error('🔍 Step 2: Building Reddit strategy...');
  
  const redditQueries = [
    `r/${d.industry} OR r/${d.industry.replace(/\s+/g, '')}`,
    `"${d.businessName}" review`,
    `best ${d.industry} tools`,
    `${d.industry} software recommendations`,
    `"${d.businessName}" vs`
  ];
  
  const recommendedSubreddits = [
    `r/${d.industry.replace(/\s+/g, '')}`,
    'r/startups',
    'r/SaaS',
    'r/software',
    'r/Entrepreneur'
  ];

  // ==========================================
  // STEP 4: Output complete pipeline result
  // ==========================================
  console.log(JSON.stringify({
    ok: true,
    data: {
      business: {
        name: d.businessName,
        industry: d.industry,
        description: d.businessDescription || d.industry,
        confidence: d.confidence
      },
      redditStrategy: {
        searchQueries: redditQueries,
        recommendedSubreddits: recommendedSubreddits,
        searchTips: [
          `Start with r/${d.industry.replace(/\s+/g, '')} for targeted audience`,
          `Search "${d.businessName}" for existing mentions`,
          `Check r/startups for competitor discussions`
        ]
      },
      nextSteps: [
        "Run reddit-readonly skill with these queries",
        "Analyze top posts for engagement patterns",
        "Draft a Reddit post following subreddit rules"
      ]
    },
    pipeline: "complete",
    raw: payload.content
  }));

} catch (error) {
  console.log(JSON.stringify({
    ok: false,
    error: {
      message: error.message,
      stack: error.stack
    },
    step: "pipeline_execution"
  }));
  process.exit(1);
}