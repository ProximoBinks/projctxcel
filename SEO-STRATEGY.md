# Simple Tuition — SEO Strategy & Implementation Plan

> Produced for: Simple Tuition (tutoring lead-gen + matching site)
> Stack: Next.js 16 App Router · Tailwind · Convex · Netlify
> Date: February 2026

---

## Table of Contents

1. [SEO Strategy & Positioning](#1-seo-strategy--positioning)
2. [Keyword Map](#2-keyword-map)
3. [Site Architecture & URL Structure](#3-site-architecture--url-structure)
4. [Page-by-Page Copy Package](#4-page-by-page-copy-package)
5. [Schema (JSON-LD)](#5-schema-json-ld)
6. [Technical SEO for Next.js](#6-technical-seo-for-nextjs)
7. [Content Plan (24 Pieces)](#7-content-plan-24-pieces)
8. [Conversion SEO Extras](#8-conversion-seo-extras)
9. [Clarifying Questions](#9-clarifying-questions)

---

## 1. SEO Strategy & Positioning

### 1.1 Ideal Customer Profiles (ICPs)

| ICP | Who | Pain Point | Decision Driver | Primary Keywords |
|-----|-----|------------|-----------------|------------------|
| **ICP-1: Year 4–10 Parents** | Parents of primary/middle school students in Adelaide | Child falling behind or needs acceleration; no clear path to academic success | Tutor quality, trust (WWCC), personalised matching | "tutoring Adelaide", "year 7 tutor", "maths tutor Adelaide" |
| **ICP-2: SACE Year 11–12 Parents/Students** | Year 11–12 students or parents targeting ATAR maximisation | ATAR pressure, subject-specific struggles, inconsistent support | Top-ATAR tutors, SACE subject expertise, proven results | "SACE tutoring Adelaide", "ATAR tutor", "year 12 maths methods tutor" |
| **ICP-3: UCAT/Med Pathway Candidates** | Year 11–12 students aiming for medicine at Adelaide Uni or interstate | UCAT score anxiety, interview prep uncertainty | Tutors who are current med students, structured UCAT program | "UCAT tutoring Adelaide", "medicine interview prep", "UCAT course Adelaide" |
| **ICP-4: Chinese-Speaking Families** | Mandarin-speaking parents seeking quality English-language tutoring for children | Language barrier when evaluating tutors; desire for high-academic-standard tutoring | Bilingual communication, cultural alignment, premium academic positioning | "阿德莱德补习", "SACE辅导", "UCAT辅导" |

### 1.2 Primary Value Propositions & Proof Points

| Value Proposition | Proof Point | Where to Surface |
|---|---|---|
| **Top 1% ATAR tutors** | Named tutors with 99.40–99.95 ATARs, subject merits, current med/engineering students | Hero, tutor cards, testimonials, schema |
| **Tailored matching** | Match preview feature; matching on subject, learning style, personality, session format | How It Works, hero focus-area selector |
| **Fast response** | Enquiries answered within 1 business day | Enquiry section, FAQ, meta description |
| **WWCC-verified** | All tutors hold Working with Children Check | Tutor section footer, About/Trust section |
| **Medicine pathway specialists** | Tutors with UCAT 90th–99th percentile; first-round med offers | Medicine Pathway page, UCAT page |
| **Real student outcomes** | Named testimonials with ATAR scores (99.80), specific improvement stories | Testimonials section, review schema |

### 1.3 Core Conversion Path & UX Notes

```
[Organic Search / Referral]
    │
    ▼
[Landing Page] ← subject page, program page, blog post, home
    │
    ├─ Internal link → /tutors (social proof)
    ├─ Internal link → /programs/* (relevance)
    ├─ Internal link → /how-it-works (trust)
    │
    ▼
[Enquiry Form] ← /#enquire or /enquire
    │
    ▼
[Confirmation + Email] → match within 1 business day
```

**UX rules that affect SEO:**
- Every page must have at least one "Enquire now" CTA above the fold and one below the fold.
- Every subject/program page must link to 2–3 related tutor profiles and to the main tutors grid.
- Blog posts must link to the relevant program page + enquiry form.
- Breadcrumbs on every sub-page (programs, subjects, blog) for both UX and `BreadcrumbList` schema.
- Mobile sticky CTA bar on long-form pages (blog, program details).

---

## 2. Keyword Map

### 2.1 Core Pages

| Page | Primary Keyword | Secondary Keywords | Intent | Funnel | Internal Links In | Internal Links Out | CTA |
|------|----------------|-------------------|--------|--------|-------------------|-------------------|-----|
| `/` (Home) | adelaide tutoring | private tutor adelaide, tutoring adelaide sa, top atar tutor | Navigational / Commercial | Top | All pages | /programs/*, /tutors, /enquire | Enquire now |
| `/programs/year-4-10` | year 4-10 tutoring adelaide | primary school tutor, year 7 tutor adelaide, maths tutor year 8 | Commercial | Mid | Home, subjects, blog | /subjects/*, /tutors, /enquire | Book a free consult |
| `/programs/sace` | sace tutoring adelaide | year 11 tutor, year 12 atar tutor, sace subjects tutoring | Commercial | Mid | Home, subjects, blog | /subjects/*, /tutors, /enquire | Enquire now |
| `/programs/medicine-pathway` | medicine pathway tutoring | ucat tutor adelaide, medicine interview prep, med school tutoring | Commercial | Mid | Home, /ucat, blog | /ucat, /tutors, /enquire | Start your medicine journey |
| `/ucat` | ucat tutoring adelaide | ucat course adelaide, ucat group program, ucat prep adelaide | Commercial | Mid | Home, /programs/medicine-pathway | /tutors, /enquire, /blog/ucat-* | Enquire about UCAT |
| `/ucat/group-program` | ucat group program adelaide | ucat crash course, ucat class adelaide, ucat preparation course | Commercial | Mid | /ucat, home | /tutors, /enquire | Join the UCAT program |
| `/subjects/maths-methods` | maths methods tutor adelaide | sace maths methods tutoring, year 12 maths tutor | Commercial | Mid | /programs/sace, home | /tutors, /enquire | Find a Maths Methods tutor |
| `/subjects/specialist-maths` | specialist maths tutor adelaide | sace specialist maths tutoring | Commercial | Mid | /programs/sace, home | /tutors, /enquire | Find a Specialist Maths tutor |
| `/subjects/chemistry` | chemistry tutor adelaide | sace chemistry tutoring, year 12 chemistry tutor | Commercial | Mid | /programs/sace, home | /tutors, /enquire | Find a Chemistry tutor |
| `/subjects/physics` | physics tutor adelaide | sace physics tutoring, year 12 physics tutor | Commercial | Mid | /programs/sace, home | /tutors, /enquire | Find a Physics tutor |
| `/subjects/biology` | biology tutor adelaide | sace biology tutoring | Commercial | Mid | /programs/sace, home | /tutors, /enquire | Find a Biology tutor |
| `/subjects/english` | english tutor adelaide | sace english tutoring, year 12 english tutor | Commercial | Mid | /programs/sace, home | /tutors, /enquire | Find an English tutor |
| `/subjects/english-literature` | english literature tutor adelaide | sace english lit tutoring | Commercial | Mid | /programs/sace, home | /tutors, /enquire | Find an English Lit tutor |
| `/subjects/accounting` | accounting tutor adelaide | sace accounting tutoring | Commercial | Mid | /programs/sace, home | /tutors, /enquire | Find an Accounting tutor |
| `/tutors` | top atar tutors adelaide | best tutors adelaide, 99 atar tutor | Commercial | Mid | Home, all program pages | /tutors/[slug], /enquire | Meet your tutor |
| `/tutors/[slug]` | [name] tutor adelaide | (dynamic per tutor) | Navigational | Bottom | /tutors, program pages | /enquire, related tutors | Enquire about [name] |
| `/how-it-works` | how tutoring matching works | find a tutor adelaide, tutoring process | Informational | Mid | Home | /enquire, /tutors | Get matched now |
| `/testimonials` | tutoring results adelaide | student testimonials tutoring | Trust / Social proof | Mid | Home, all program pages | /enquire, /tutors | See how we can help you |
| `/enquire` | enquire tutoring adelaide | book a tutor adelaide, tutoring enquiry | Transactional | Bottom | All pages | /privacy, /terms | Submit enquiry |
| `/blog` | tutoring tips adelaide | study tips sace, ucat preparation guide | Informational | Top | Home | /blog/*, /programs/*, /enquire | Read more |

### 2.2 Chinese-Language Keywords

| English Page | Chinese Keyword Target | Notes |
|---|---|---|
| Home | 阿德莱德补习 (Adelaide tutoring) | High-value for Chinese-speaking families in Adelaide |
| SACE Program | SACE辅导阿德莱德 (SACE tutoring Adelaide) | Niche but low competition |
| UCAT | UCAT补习阿德莱德 (UCAT tutoring Adelaide) | Med pathway is high-intent for Chinese families |
| Subjects | 数学辅导 (maths tutoring), 化学辅导 (chemistry tutoring) | Subject-specific |

---

## 3. Site Architecture & URL Structure

### 3.1 Recommended URL Hierarchy

```
/                                   ← Home (landing page)
├── /programs/
│   ├── /programs/year-4-10         ← Year 4–10 Acceleration
│   ├── /programs/sace              ← SACE Program (Year 11–12)
│   └── /programs/medicine-pathway  ← Medicine Pathway
├── /ucat/                          ← UCAT overview
│   └── /ucat/group-program         ← UCAT group program
├── /subjects/
│   ├── /subjects/maths-methods
│   ├── /subjects/specialist-maths
│   ├── /subjects/general-maths
│   ├── /subjects/chemistry
│   ├── /subjects/physics
│   ├── /subjects/biology
│   ├── /subjects/english
│   ├── /subjects/english-literature
│   ├── /subjects/accounting
│   └── /subjects/research-project
├── /tutors/                        ← Tutor grid
│   └── /tutors/[slug]              ← Individual tutor profile
├── /how-it-works/
├── /testimonials/
├── /enquire/
├── /blog/
│   └── /blog/[slug]                ← Individual blog posts
├── /privacy/
├── /terms/
└── /zh/                            ← Chinese mirror (Phase 2, see §6)
    ├── /zh/programs/sace
    ├── /zh/ucat
    └── ... (mirrors English structure)
```

### 3.2 Location SEO Plan

**Current state:** The layout.tsx title says "Adelaide Tutoring" and a testimonial mentions "Adelaide Med." This is the only location signal.

**Recommendation: Option A (Immediate) + Option B (Phase 2)**

**Phase 1 — NOW (safe, no risk):**
- Add "Adelaide" naturally to title tags, meta descriptions, H1s, and copy on core pages.
- Add `Organization` schema with `areaServed: "Adelaide, South Australia, Australia"`.
- Create a Google Business Profile for "Simple Tuition" with Adelaide address (if you have one).
- Do NOT create suburb-level pages yet — thin location pages with duplicated content will hurt rankings.

**Phase 2 — AFTER confirming coverage areas:**
- Create `/adelaide/[suburb]` pages ONLY for suburbs where you have active tutors.
- Each page must have **unique content**: suburb-specific copy, nearest schools mentioned, tutor availability in that area.
- Minimum 300 words of unique content per suburb page.
- Link suburb pages from the main programs pages and vice versa.

**Risks of premature location pages:**
- Google's Helpful Content system penalises "scaled content" where only the suburb name changes.
- Thin pages dilute crawl budget and can trigger manual reviews.
- Better to rank one strong "Adelaide tutoring" page than 30 thin suburb pages.

---

## 4. Page-by-Page Copy Package

### 4.1 Home Page (`/`)

**Title tag:** `Adelaide Tutoring — Top 1% ATAR Tutors | Simple Tuition`
**Meta description:** `Private tutoring from top 1% ATAR achievers. SACE, UCAT & medicine prep for Year 4–12 students in Adelaide. Enquire today — we respond within 1 business day.`
**H1:** `Exceptional tutoring, tailored to you`

**H2/H3 outline:**
- H2: Our Programs — One-on-one support for every stage
  - H3: Year 4–10 Acceleration Program
  - H3: SACE Program (Year 11–12)
  - H3: Medicine Pathway
- H2: Group Programs
  - H3: Subject Classes + Crash Courses
  - H3: UCAT Program
- H2: Meet Our Tutors — Learn from the best
- H2: What Students & Parents Say
- H2: How It Works — A simple, proven process
- H2: Enquire Now — Tell us what your student needs

**Above-the-fold copy (≈300 words):**

Simple Tuition connects Adelaide students with tutors who've achieved what they're aiming for. Every tutor on our team is a top 1% ATAR achiever — many with subject merits, UCAT scores in the 90th–99th percentile, and current enrolment in medicine or engineering at leading universities.

We don't believe in one-size-fits-all tutoring. When you enquire, we match your student based on their subjects, year level, learning style, goals, and even personality. Whether your child needs foundational support in Year 4–10, targeted SACE preparation to maximise their ATAR, or specialist coaching for the UCAT and medical interviews — we have the right tutor.

Our matching process is straightforward: tell us what your student needs, and we'll recommend a tutor and confirm availability within one business day. Sessions are arranged directly between your family and the tutor, so scheduling stays flexible.

Every tutor holds a current Working with Children Check. We take trust seriously — because the best academic outcomes come from relationships built on confidence and consistency.

**CTAs:**
1. `Enquire now` → scrolls to /#enquire
2. `View our tutors` → links to /tutors
3. `See how it works` → links to /how-it-works

**Internal links:**
- /programs/year-4-10, /programs/sace, /programs/medicine-pathway
- /tutors
- /how-it-works
- /testimonials
- /enquire

---

### 4.2 SACE Program (`/programs/sace`)

**Title tag:** `SACE Tutoring Adelaide — Year 11–12 ATAR Tutors | Simple Tuition`
**Meta description:** `Maximise your ATAR with Adelaide's top-performing SACE tutors. Expert support in Maths Methods, Chemistry, Physics, English & more. Enquire today.`
**H1:** `SACE Tutoring — Maximise Your ATAR`

**H2/H3 outline:**
- H2: Why SACE students choose Simple Tuition
- H2: Subjects we cover
  - H3: Maths Methods · H3: Specialist Maths · H3: Chemistry · H3: Physics · H3: Biology · H3: English · H3: English Literature · H3: Accounting · H3: Research Project
- H2: Our SACE tutors
- H2: How the SACE program works
- H2: Results that speak for themselves (testimonials)
- H2: Frequently asked questions
- H2: Ready to get started?

**Above-the-fold copy (≈350 words):**

Year 11 and 12 are defining years. The difference between a strong ATAR and a great one often comes down to the quality of support around a student — and that's exactly where Simple Tuition fits in.

Our SACE program pairs students with tutors who have already excelled in the same subjects, at the same schools, under the same system. We're not a large tutoring centre with rotating staff. Every session is with the same dedicated tutor, building continuity and understanding that compounds over the year.

We cover all major SACE subjects: Maths Methods, Specialist Maths, General Maths, Chemistry, Physics, Biology, English, English Literature, Accounting, and Research Project. If your subject isn't listed — enquire anyway. We're continuously expanding our team and can often find the right fit.

Our tutors bring more than knowledge. They've navigated the pressure of Year 12 themselves, earned subject merits, and achieved ATARs between 99.40 and 99.95. They understand the assessment structure, the weighting of externals, and the study habits that actually move the needle.

We match based on subject needs, learning style, and schedule — then confirm your tutor within one business day. Parents can check in on progress at any time.

Don't see your subject? Let us know in the enquiry form and we'll sort it out.

**CTAs:**
1. `Enquire about SACE tutoring` → /enquire
2. `Browse our SACE tutors` → /tutors
3. `See how matching works` → /how-it-works

**Internal links:**
- /subjects/* (each subject page)
- /tutors (filtered to SACE-relevant)
- /testimonials
- /enquire

---

### 4.3 Year 4–10 Acceleration (`/programs/year-4-10`)

**Title tag:** `Year 4–10 Tutoring Adelaide — Build Strong Foundations | Simple Tuition`
**Meta description:** `Personalised tutoring for Year 4–10 students in Adelaide. Build confidence in maths, science & english with top-achieving tutors. Enquire today.`
**H1:** `Year 4–10 Acceleration Program`

**H2/H3 outline:**
- H2: Why start tutoring early?
- H2: What this program covers
- H2: Subjects and year levels
- H2: Our approach to younger students
- H2: Meet the tutors
- H2: FAQs for parents
- H2: Get started

**Above-the-fold copy (≈300 words):**

The habits and confidence built in primary and middle school shape everything that comes after. Our Year 4–10 Acceleration Program gives students a structured edge — building genuine understanding in core subjects so they're not just keeping up, but pulling ahead.

Whether your child needs support catching up in maths, wants to be challenged beyond the classroom, or is preparing for the transition into SACE — we match them with a tutor who understands their stage and learning style.

Our tutors aren't just academically strong. They're relatable, patient, and trained to work with younger students. Every tutor holds a current Working with Children Check, and sessions are designed to build both competence and confidence over time.

We cover maths, english, and science foundations across Year 4 through 10, with tailored plans that evolve as your child progresses. Parents receive regular updates on how things are tracking.

**CTAs:**
1. `Enquire about Year 4–10 tutoring` → /enquire
2. `Meet our tutors` → /tutors
3. `Learn how matching works` → /how-it-works

---

### 4.4 Medicine Pathway (`/programs/medicine-pathway`)

**Title tag:** `Medicine Pathway Tutoring — UCAT & Interview Prep | Simple Tuition`
**Meta description:** `Prepare for medicine with tutors who've earned medical offers. UCAT prep, interview coaching & ATAR support in Adelaide. Enquire for a tailored plan.`
**H1:** `Medicine Pathway — From ATAR to Acceptance`

**H2/H3 outline:**
- H2: What the Medicine Pathway includes
  - H3: ATAR & subject support
  - H3: UCAT preparation
  - H3: Interview coaching
- H2: Our medicine pathway tutors
- H2: Results & outcomes
- H2: FAQs
- H2: Start your medicine journey

**Above-the-fold copy (≈350 words):**

Getting into medicine is one of the most competitive academic pathways in Australia. It requires a high ATAR, a strong UCAT score, and a confident interview — and the students who succeed almost always have structured support behind them.

Simple Tuition's Medicine Pathway brings together all three pillars. Our tutors aren't just high-achievers — they're current medical students who have been through the exact process your child is facing. They've sat the UCAT, prepared for interviews, and earned first-round offers at universities including the University of Adelaide.

The pathway starts with targeted subject tutoring to build the ATAR foundation (Chemistry, Biology, Maths Methods, Physics, English). From there, we layer in UCAT preparation — covering all sections with timed practice, strategy development, and performance tracking. Finally, our tutors provide interview coaching based on real experience and structured frameworks.

This isn't a generic test-prep course. Each student is matched with a tutor who fits their subjects, learning style, and goals — and that tutor stays with them through the journey.

**CTAs:**
1. `Enquire about the Medicine Pathway` → /enquire
2. `Learn about our UCAT program` → /ucat
3. `Meet our med-pathway tutors` → /tutors

---

### 4.5 UCAT Overview (`/ucat`)

**Title tag:** `UCAT Tutoring Adelaide — Score Higher with Expert Prep | Simple Tuition`
**Meta description:** `UCAT preparation with tutors who scored in the 90th–99th percentile. Individual & group programs in Adelaide. Strategies that work. Enquire now.`
**H1:** `UCAT Preparation — Strategies That Score`

**Above-the-fold copy (≈300 words):**

The UCAT can make or break a medicine application — and it rewards preparation that's strategic, not just repetitive. At Simple Tuition, our UCAT tutors scored in the 90th to 99th percentile themselves. They know which sections respond best to practice, where timing traps live, and how to build the mental stamina the test demands.

We offer two formats: one-on-one UCAT tutoring matched to your pace and weak areas, and a structured group program that covers all sections with timed mock exams, strategy workshops, and score tracking.

Whether you're just starting UCAT prep or looking to push from a good score to a great one, we match you with a tutor who's been in your position — and come out the other side with a medical offer.

**CTAs:**
1. `Enquire about UCAT tutoring` → /enquire
2. `See the UCAT group program` → /ucat/group-program
3. `Meet our UCAT tutors` → /tutors

---

### 4.6 Subject Page Example (`/subjects/maths-methods`)

**Title tag:** `Maths Methods Tutor Adelaide — SACE Year 11–12 | Simple Tuition`
**Meta description:** `Find a Maths Methods tutor in Adelaide. Our tutors achieved 99+ ATARs and SACE merits. Personalised support for Year 11–12 students. Enquire today.`
**H1:** `Maths Methods Tutoring — Adelaide`

**H2/H3 outline:**
- H2: Why Maths Methods tutoring matters
- H2: What our Maths Methods tutors cover
- H2: Meet our Maths Methods tutors (filtered cards)
- H2: How sessions work
- H2: FAQs about Maths Methods tutoring
- H2: Ready to find your tutor?

**Above-the-fold copy (≈250 words):**

Maths Methods is one of the highest-scaling SACE subjects — and one of the most demanding. The jump from Year 10 to Stage 1, and again into Stage 2, catches many students off guard. A strong tutor makes the difference between struggling through and genuinely understanding the material.

Our Maths Methods tutors achieved ATARs between 99.40 and 99.95, with several earning SACE subject merits in mathematics. They've recently sat the same exams, used the same textbooks, and know exactly where students tend to lose marks.

Sessions are one-on-one and matched to your student's pace, whether they need to solidify fundamentals or push for a top-band result.

**CTAs:**
1. `Find a Maths Methods tutor` → /enquire
2. `See all SACE subjects` → /programs/sace
3. `Meet our tutors` → /tutors

---

### 4.7 How It Works (`/how-it-works`)

**Title tag:** `How Our Tutoring Matching Works | Simple Tuition Adelaide`
**Meta description:** `Tell us what your student needs. We match a top-performing tutor within 1 business day. Here's how the process works at Simple Tuition.`
**H1:** `How It Works — A Simple, Proven Process`

---

### 4.8 Testimonials (`/testimonials`)

**Title tag:** `Student Results & Testimonials | Simple Tuition Adelaide`
**Meta description:** `Real results from Adelaide students. See how Simple Tuition's top ATAR tutors helped students achieve 99+ ATARs and medicine offers.`
**H1:** `Results That Speak for Themselves`

---

### 4.9 Tutors Grid (`/tutors`)

**Title tag:** `Meet Our Tutors — Top 1% ATAR Achievers | Simple Tuition`
**Meta description:** `Browse Adelaide's highest-achieving tutors. Every tutor is a top 1% ATAR achiever with a Working with Children Check. Find your match.`
**H1:** `Our Tutors — Top 1% ATAR Achievers`

---

### 4.10 Enquire (`/enquire`)

**Title tag:** `Enquire — Find Your Tutor | Simple Tuition Adelaide`
**Meta description:** `Tell us your student's year level, subjects, and goals. We'll match a tutor with you within 1 business day. Enquire now.`
**H1:** `Tell Us How We Can Help`

---

## 5. Schema (JSON-LD)

### 5.1 Organization (site-wide, in layout)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Simple Tuition",
  "url": "https://simpletuition.au",
  "logo": "https://simpletuition.au/images/logo.png",
  "description": "Private tutoring from top 1% ATAR achievers for Year 4–12 students in Adelaide. SACE, UCAT, and medicine interview preparation.",
  "email": "admin@simpletuition.com.au",
  "areaServed": {
    "@type": "City",
    "name": "Adelaide",
    "containedInPlace": {
      "@type": "State",
      "name": "South Australia"
    }
  },
  "sameAs": []
}
```

> **Note:** Use `Organization` (not `LocalBusiness`) until a physical address is confirmed. Once you have an address, switch to `LocalBusiness` with `address`, `geo`, `openingHours`.

### 5.2 Service Schema (one per program page)

```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "SACE Tutoring Program",
  "description": "Targeted tutoring for Year 11–12 students across all SACE subjects, focused on maximising ATAR results.",
  "provider": {
    "@type": "Organization",
    "name": "Simple Tuition"
  },
  "areaServed": {
    "@type": "City",
    "name": "Adelaide"
  },
  "serviceType": "Tutoring",
  "audience": {
    "@type": "Audience",
    "audienceType": "Year 11–12 students and parents"
  }
}
```

### 5.3 FAQPage Schema

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does SACE tutoring cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Pricing varies by tutor experience and subject. Enquire for a personalised quote — we respond within 1 business day."
      }
    },
    {
      "@type": "Question",
      "name": "Are your tutors qualified?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "All our tutors are top 1% ATAR achievers with a current Working with Children Check. Many hold SACE subject merits and are current university students in medicine or engineering."
      }
    },
    {
      "@type": "Question",
      "name": "How does tutor matching work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We match based on subject needs, year level, learning style, and goals. After you enquire, we recommend a tutor and confirm availability within 1 business day."
      }
    },
    {
      "@type": "Question",
      "name": "Do you offer online tutoring?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Session format is arranged between families and tutors. Both in-person and online options can be discussed during matching."
      }
    },
    {
      "@type": "Question",
      "name": "What subjects do you cover?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We cover Maths Methods, Specialist Maths, General Maths, Chemistry, Physics, Biology, English, English Literature, Accounting, Research Project, UCAT, and interview preparation. Enquire for additional subjects."
      }
    }
  ]
}
```

### 5.4 BreadcrumbList Pattern

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://simpletuition.au"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Programs",
      "item": "https://simpletuition.au/programs"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "SACE Program",
      "item": "https://simpletuition.au/programs/sace"
    }
  ]
}
```

### 5.5 Review / AggregateRating

**Do NOT add AggregateRating yet.** You have testimonials but no star ratings or structured review counts.

**Recommendation to collect:**
1. Add a star rating field to the testimonial data model (1–5).
2. After collecting 10+ rated reviews, add:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Simple Tuition",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "27",
    "bestRating": "5"
  }
}
```

3. Also consider Google Business Profile reviews, which feed into the local pack.

---

## 6. Technical SEO for Next.js (App Router)

### 6.1 Metadata Base (layout.tsx)

See implementation file: `app/layout.tsx` updates below.

Key additions:
- `metadataBase` for canonical resolution
- Default OpenGraph image + Twitter card
- `alternates` for hreflang (future)
- Site-wide JSON-LD injection

### 6.2 generateMetadata() Pattern for Dynamic Pages

```typescript
// app/subjects/[slug]/page.tsx
import type { Metadata } from "next";

const subjectData: Record<string, { title: string; description: string }> = {
  "maths-methods": {
    title: "Maths Methods Tutor Adelaide — SACE Year 11–12",
    description:
      "Find a Maths Methods tutor in Adelaide. Our tutors achieved 99+ ATARs and SACE merits. Personalised support for Year 11–12 students.",
  },
  // ... more subjects
};

type SubjectPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: SubjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = subjectData[slug];
  if (!data) return {};

  return {
    title: data.title,
    description: data.description,
    alternates: {
      canonical: `/subjects/${slug}`,
    },
    openGraph: {
      title: data.title,
      description: data.description,
      url: `/subjects/${slug}`,
      type: "website",
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(subjectData).map((slug) => ({ slug }));
}
```

### 6.3 Canonical Strategy

- Every page gets `alternates.canonical` pointing to its own URL.
- The `metadataBase` in root layout resolves all relative canonicals.
- For bilingual: `/zh/programs/sace` canonical → itself; `hreflang` links connect the pair.
- Paginated content (e.g. blog list page 2): canonical to page 1 if content is the same, or self-canonical if distinct content.

### 6.4 robots.ts + sitemap.ts

See implementation files below.

### 6.5 OpenGraph / Twitter Cards

Set defaults in root layout `metadata`:

```typescript
openGraph: {
  type: "website",
  locale: "en_AU",
  siteName: "Simple Tuition",
  images: [{ url: "/images/og-default.png", width: 1200, height: 630 }],
},
twitter: {
  card: "summary_large_image",
},
```

Per-page overrides via `generateMetadata()`.

### 6.6 Bilingual Content Strategy (en/zh)

**Current state:** Language is toggled client-side via React context. Google only crawls the English version.

**Recommended approach (phased):**

**Phase 1 (NOW — minimal effort):**
- Keep client-side toggle for UX.
- Add a `<link rel="alternate" hreflang="zh" href="/zh" />` in the `<head>` pointing to future Chinese URLs.
- The current approach is acceptable short-term because the Chinese content is supplementary, not a separate market.

**Phase 2 (when Chinese SEO matters):**
- Create `/zh/` route group with mirrored pages.
- Use Next.js `generateMetadata()` to set `lang="zh"` and Chinese titles/descriptions.
- Add reciprocal `hreflang` tags:
  ```html
  <!-- On /programs/sace -->
  <link rel="alternate" hreflang="en" href="https://simpletuition.au/programs/sace" />
  <link rel="alternate" hreflang="zh" href="https://simpletuition.au/zh/programs/sace" />
  <link rel="alternate" hreflang="x-default" href="https://simpletuition.au/programs/sace" />

  <!-- On /zh/programs/sace -->
  <link rel="alternate" hreflang="en" href="https://simpletuition.au/programs/sace" />
  <link rel="alternate" hreflang="zh" href="https://simpletuition.au/zh/programs/sace" />
  <link rel="alternate" hreflang="x-default" href="https://simpletuition.au/programs/sace" />
  ```
- Each `/zh/` page must have **unique Chinese copy** (not machine-translated boilerplate).
- Include both in `sitemap.xml` with `xhtml:link` alternates.

**Avoiding duplicate content:**
- Do NOT serve the same English content on `/zh/` pages.
- If a Chinese page isn't ready, don't create it — a missing page is better than a thin duplicate.
- Use `x-default` hreflang pointing to the English version.

### 6.7 Core Web Vitals

**Images:**
- Use `next/image` for all images (tutor photos, OG images).
- Set `sizes` prop to prevent oversized downloads.
- Use WebP format (Next.js auto-optimises).
- Add `priority` to above-the-fold hero images.
- Set `loading="lazy"` on below-fold images (default in next/image).

**Fonts:**
- The Pepi font is loaded via `next/font/local` — this is correct and optimal.
- Add `display: "swap"` to the font config if not already present:
  ```typescript
  const pepi = localFont({
    src: "./fonts/Pepi-SemiBold.otf",
    weight: "600",
    style: "normal",
    display: "swap",
  });
  ```

**Caching:**
- Add caching headers in `next.config.js` or Netlify config for static assets.
- Next.js handles `/_next/static/` caching automatically.
- For `/images/tutors/`, add immutable cache headers via Netlify `_headers` file.

### 6.8 JSON-LD Injection Pattern

```typescript
// components/JsonLd.tsx
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Usage in a page:
// <JsonLd data={organizationSchema} />
// <JsonLd data={serviceSchema} />
// <JsonLd data={faqSchema} />
```

---

## 7. Content Plan (24 Pieces)

### SACE & ATAR Cluster (8 posts)

| # | Title | Target Keyword | Intent | Outline | Internal Links | CTA |
|---|-------|---------------|--------|---------|----------------|-----|
| 1 | How to Choose the Right SACE Tutor | how to choose a sace tutor | Informational | What to look for · Qualifications vs results · Questions to ask · Red flags | /programs/sace, /tutors | Enquire now |
| 2 | SACE Study Plan: A Week-by-Week Template for Year 12 | sace study plan year 12 | Informational | Term breakdown · Subject allocation · Exam prep timeline · Download template | /programs/sace, /subjects/* | Download + Enquire |
| 3 | How ATAR Scaling Works in South Australia | atar scaling south australia | Informational | What scaling is · Which subjects scale well · Common myths · Strategic subject choices | /programs/sace, /subjects/* | Enquire |
| 4 | Top 5 Study Strategies for Maths Methods | maths methods study tips | Informational | Active recall · Past papers · Error logs · Conceptual vs procedural · Timing | /subjects/maths-methods | Find a tutor |
| 5 | Year 11 to Year 12: How to Prepare for the Jump | year 11 to year 12 preparation | Informational | Mindset shift · Study habits · Time management · Getting a tutor early | /programs/sace | Enquire |
| 6 | How to Write a Research Project That Scores an A+ | sace research project tips | Informational | Topic selection · Methodology · Structure · Common pitfalls | /subjects/research-project | Find a tutor |
| 7 | Chemistry Study Guide: SACE Stage 2 Key Topics | sace chemistry study guide | Informational | Organic chemistry · Equilibrium · Redox · Exam technique | /subjects/chemistry | Find a tutor |
| 8 | Physics External Exam: What to Expect and How to Prepare | sace physics external exam | Informational | Exam format · High-yield topics · Timing strategy · Past paper analysis | /subjects/physics | Find a tutor |

### UCAT & Medicine Cluster (8 posts)

| # | Title | Target Keyword | Intent | Outline | Internal Links | CTA |
|---|-------|---------------|--------|---------|----------------|-----|
| 9 | UCAT Preparation Timeline: When to Start and What to Cover | ucat preparation timeline | Informational | Ideal start date · Section-by-section breakdown · Practice schedule | /ucat, /ucat/group-program | Enquire about UCAT |
| 10 | UCAT Verbal Reasoning: Strategies That Actually Work | ucat verbal reasoning tips | Informational | Speed reading · Inference vs stated · Elimination technique · Practice drills | /ucat | Enquire |
| 11 | UCAT Decision Making: A Complete Strategy Guide | ucat decision making strategies | Informational | Logical puzzles · Venn diagrams · Probabilistic reasoning · Timing | /ucat | Enquire |
| 12 | How to Prepare for a Medical School Interview in Australia | medical school interview preparation australia | Informational | MMI format · Common scenarios · Ethical reasoning · Practice framework | /programs/medicine-pathway | Enquire |
| 13 | What UCAT Score Do You Need for Adelaide Medicine? | ucat score adelaide medicine | Informational | Cut-off analysis · Offers data · Combined ATAR+UCAT thresholds | /ucat, /programs/medicine-pathway | Enquire |
| 14 | UCAT Abstract Reasoning: Pattern Recognition Tips | ucat abstract reasoning tips | Informational | Common patterns · Speed drills · Avoiding overthinking | /ucat | Enquire |
| 15 | Is a UCAT Course Worth It? What to Look For | is ucat course worth it | Commercial-Info | Group vs solo · What good courses include · ROI analysis | /ucat/group-program | Join UCAT program |
| 16 | Medicine Pathway: Year 10 to Med School — A Complete Roadmap | medicine pathway year 10 to med school | Informational | Subject selection · ATAR requirements · UCAT timeline · Interview prep · Gap year options | /programs/medicine-pathway | Enquire |

### General Tutoring & Parent Education (8 posts)

| # | Title | Target Keyword | Intent | Outline | Internal Links | CTA |
|---|-------|---------------|--------|---------|----------------|-----|
| 17 | How to Know If Your Child Needs a Tutor | does my child need a tutor | Informational | Warning signs · When to start · What to expect · ROI of early tutoring | /programs/year-4-10 | Enquire |
| 18 | Online vs In-Person Tutoring: Which Is Better? | online vs in person tutoring | Informational | Pros/cons · Learning styles · Hybrid options · What research says | /how-it-works | Enquire |
| 19 | What Makes a Great Tutor? 7 Qualities to Look For | qualities of a good tutor | Informational | Subject mastery · Relatability · Patience · Structure · Accountability · Communication · WWCC | /tutors | Enquire |
| 20 | How to Support Your Year 12 Child Without Adding Pressure | supporting year 12 child | Informational | Communication tips · Environment · When to step back · Role of external support | /programs/sace | Enquire |
| 21 | The Benefits of Peer-Age Tutoring (Why Young Tutors Work) | benefits of peer tutoring | Informational | Relatability · Recent experience · Motivation · Evidence | /tutors | Enquire |
| 22 | Year 7–10: Building Study Habits That Last | study habits year 7 | Informational | Spaced repetition · Active recall · Note-taking · Time blocking | /programs/year-4-10 | Enquire |
| 23 | How Tutoring Can Help with Exam Anxiety | tutoring exam anxiety | Informational | Causes · Preparation as confidence · Familiarity · Strategies | /programs/sace | Enquire |
| 24 | Bilingual Families: Navigating Tutoring in Adelaide (EN/中文) | tutoring bilingual families adelaide | Informational / Cultural | Language barriers · Cultural expectations · Finding the right fit · Bilingual support available | Home (zh toggle), /enquire | Enquire |

---

## 8. Conversion SEO Extras

### 8.1 Lead Magnet Ideas

| Lead Magnet | Target Audience | Delivery | Keyword Capture |
|-------------|----------------|----------|-----------------|
| **SACE Study Plan Template (PDF)** | Year 11–12 students | Email gate on blog post #2 | sace study plan |
| **UCAT Weekly Practice Planner** | UCAT candidates | Email gate on /ucat page | ucat practice plan |
| **"Is My Child Ready for Year 12?" Checklist** | Year 10 parents | Email gate on blog post #5 | year 12 preparation |
| **Subject Selection Guide for ATAR Scaling** | Year 10 students | Email gate on blog post #3 | atar scaling subjects |

### 8.2 Trust-Building Sections to Add

1. **"Why Simple Tuition" trust bar** (home page, above fold):
   - "Top 1% ATAR tutors" · "WWCC verified" · "1 day response" · "Personalised matching"
   - Use icons + short labels. Already partially exists in services section.

2. **Tutor vetting process section** (on /tutors or /how-it-works):
   - Application → Academic verification → WWCC check → Trial session → Ongoing review
   - Builds authority and addresses parent concerns.

3. **Match preview feature** (already exists in hero):
   - Consider adding a standalone /how-it-works section that explains the matching algorithm in plain language.

4. **"As seen in" / partner logos** (if applicable):
   - School logos, uni logos, or media mentions. Only add if genuine.

### 8.3 FAQ Sets for Long-Tail Keywords

**SACE FAQ (for /programs/sace and blog):**
- How much does SACE tutoring cost in Adelaide?
- What SACE subjects can I get tutoring for?
- How often should a Year 12 student have tutoring?
- Can tutoring actually improve my ATAR?
- What's the difference between a tutor and a tutoring centre?

**UCAT FAQ (for /ucat and blog):**
- When should I start UCAT preparation?
- How long does UCAT preparation take?
- What UCAT score do I need for Adelaide Uni medicine?
- Is individual or group UCAT prep better?
- How do I improve my UCAT abstract reasoning score?

**General FAQ (for /how-it-works and home):**
- How does Simple Tuition match tutors?
- Are your tutors background-checked?
- Do you offer online tutoring?
- How quickly can I get a tutor?
- What if my subject isn't listed?
- Can I change tutors if it's not the right fit?

---

## 9. Clarifying Questions

1. **Confirmed location:** The layout title says "Adelaide Tutoring." Can we confirm Adelaide, SA as the primary service area and add it to all copy? Are there specific suburbs you serve or plan to serve?

2. **Online availability:** Can we add "in-person and online sessions available" to site copy? This significantly expands keyword targeting (e.g., "online UCAT tutoring Australia").

3. **Domain:** What is the production domain? (simpletuition.au? simpletuition.com.au?) This is needed for canonical URLs, schema, and sitemap.

4. **Chinese locale specificity:** Is the Chinese content targeting Mandarin-speaking families *in Adelaide* specifically, or also families in China researching Australian tutoring? This affects keyword targeting and hreflang locale (`zh-AU` vs `zh-Hans`).

5. **Google Business Profile:** Do you have a GBP listing? If not, creating one is the single highest-ROI action for local SEO and should be done before any technical changes.
