import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const interviewHtml = readFileSync(
  ".next/server/app/interview.html",
  "utf8",
);
const sitemapXml = readFileSync(
  ".next/server/app/sitemap.xml.body",
  "utf8",
);
const robotsTxt = readFileSync(
  ".next/server/app/robots.txt.body",
  "utf8",
);

const count = (pattern) => (interviewHtml.match(pattern) ?? []).length;

assert.equal(
  interviewHtml.includes("BAILOUT_TO_CLIENT_SIDE_RENDERING"),
  false,
  "/interview must not bail out to client-only rendering",
);
assert.equal(count(/<main/g), 1, "/interview must render one main element");
assert.equal(count(/<h1/g), 1, "/interview must render exactly one H1");

for (const text of [
  "Your ATAR and UCAT",
  "Introduction to Multiple Mini Interviews",
  "Mock Interviews",
  "Yousif Shibeeb",
  "$399",
  "Which universities does this course cover?",
]) {
  assert.ok(
    interviewHtml.includes(text),
    `/interview initial HTML is missing: ${text}`,
  );
}

assert.ok(
  interviewHtml.includes(
    '<link rel="canonical" href="https://simpletuition.com.au/interview"',
  ),
  "/interview canonical URL is missing or incorrect",
);
assert.ok(
  interviewHtml.includes("Medicine &amp; Dentistry Interview Prep Adelaide"),
  "/interview title is missing Adelaide search context",
);
assert.equal(
  interviewHtml.includes("opacity:0;transform:translateY(24px)"),
  false,
  "server-rendered content must not start hidden by entrance animation styles",
);
assert.ok(
  interviewHtml.includes('alt="Medicine offer from Adelaide University"'),
  "meaningful offer images need descriptive alt text",
);
assert.ok(
  interviewHtml.includes('href="/programs/medicine"') &&
    interviewHtml.includes('href="/programs/ucat"'),
  "/interview must link to relevant Medicine and UCAT pages",
);

const jsonLd = [
  ...interviewHtml.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  ),
].map((match) => JSON.parse(match[1]));
const schemaTypes = new Set(jsonLd.map((schema) => schema["@type"]));

for (const schemaType of [
  "WebSite",
  "EducationalOrganization",
  "FAQPage",
  "Course",
  "BreadcrumbList",
]) {
  assert.ok(
    schemaTypes.has(schemaType),
    `/interview is missing ${schemaType} structured data`,
  );
}

assert.ok(
  sitemapXml.includes(
    "<loc>https://simpletuition.com.au/interview</loc>",
  ),
  "/interview is missing from sitemap.xml",
);
assert.equal(
  sitemapXml.includes("https://simpletuition.au/"),
  false,
  "sitemap.xml contains the non-canonical .au host",
);
assert.ok(
  robotsTxt.includes(
    "Sitemap: https://simpletuition.com.au/sitemap.xml",
  ),
  "robots.txt must reference the canonical sitemap",
);

console.log(
  `Interview SEO verification passed: ${count(/<h1/g)} H1, ${count(/<h2/g)} H2s, ${jsonLd.length} JSON-LD blocks.`,
);

