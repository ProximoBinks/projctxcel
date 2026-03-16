# Todo

- [ ] add profit calculation based on the payouts
- [ ] setup discord webhoook notifications for student sign up (when student confirms their email), when an enquiry form is sent, when a student request to pause their billing

## Blockers
- [x] Confirm business name + domain
- [x] Collect tutor bios/photos/stats
- [x] Decide accent color
- [x] Business email (for Postmark)

## Build — Website
- [x] Repo scaffold (Next.js + Tailwind + Framer Motion)
- [x] Landing sections
- [x] Tutor grid (3x3) linking to `/tutors/[slug]` (no slug for now)
- [x] `/tutors` redirect → `/`
- [x] Enquiry form (section `/#enquire` or `/enquire` page)
- [x] Harden auth flow (server-side auth checks, secure password hashing)
- [x] Conditional enquiry form:
  - [x] First question: "How can we help you today?" → (Tutor enquiry / Join team)
  - [x] Student path fields: year level, target ATAR, struggling subjects, planned uni, interests/hobbies, then name/email/phone
  - [x] Tutor path fields: experience, expertise, CV upload, then name/email/phone
  - [ ] Add consent copy for promos/ads follow-up (privacy-friendly)
- [x] Store form submissions (DB + admin view) OR email forward (Postmark) + backup storage
- [ ] Generate brochure QR code linking directly to the form URL
- [ ] Signup page (basic, define what signup means)
- [x] Postmark integration
- [x] Deploy (Netlify)

## Build — Student Database / Platform
- [x] **Student profiles** — name, phone, email, parent/guardian details, year level, subjects
  - [ ] Add UCAT/ATAR goals fields to student profile
- [x] **Tutor access controls** — tutors see only their assigned students, admin sees everything
- [x] **Session tracking** — log each session with date, duration, attending tutor, notes
  - [x] Class-based session logging (select class → students → duration prefilled)
  - [x] Multi-student session logging (select multiple students at once)
- [ ] **Attendance tracking** — mark sessions as completed, cancelled, or rescheduled with history per student
- [ ] **Progress tracking** — record student progress over time (mock UCAT scores, practice exam results, tutor observations)
- [x] **Recurring billing via Stripe** — card-on-file, automatic daily charges at 9am Adelaide time
  - [x] Stripe SetupIntent for card collection
  - [x] Daily cron billing per-class
  - [x] Cash payment option
  - [x] Per-class pause requests (student requests, admin approves)
  - [x] Credit system (admin can add credits, auto-applied at billing time)
  - [x] Admin billing management (add/edit/delete profiles, switch card/cash, unpause)
  - [x] Weekly rate breakdown (grouped by day, linked to enrolled classes)
- [ ] **Automated invoices/receipts** — generate and email automatically after each charge
- [ ] **SMS + email reminders** — automated session reminders sent to student and/or parent ahead of each booking
- [x] **Tutor-to-student matching** — class-based assignment system (tutors assigned to classes, students enrolled in classes)

## SEO — Done
- [x] Add sitewide meta tags (title/description/Open Graph/Twitter)
- [x] Create sitemap.xml + robots.txt
- [x] Add canonical URLs
- [x] Add JSON-LD (Organization + FAQ + Service + BreadcrumbList)
- [x] OG image using banner.webp for link previews (Discord, Twitter, etc.)
- [x] Per-page metadata for privacy, terms, enquire, programs/sace
- [x] SEO strategy document (`SEO-STRATEGY.md`)

## SEO — Next Steps (in priority order)

### Phase 1: Foundation pages (high impact, do first)
- [x] Set `NEXT_PUBLIC_SITE_URL` env var in Netlify with production domain
- [x] Submit sitemap to Google Search Console (`/sitemap.xml`)
- [ ] Create `/programs/year-4-10` page (copy + metadata in SEO-STRATEGY.md §4.3)
- [ ] Create `/programs/medicine-pathway` page (copy in SEO-STRATEGY.md §4.4)
- [ ] Create `/ucat` page (copy in SEO-STRATEGY.md §4.5)
- [ ] Create `/ucat/group-program` page
- [ ] Create `/how-it-works` standalone page (reuse existing section content)
- [ ] Create `/testimonials` standalone page
- [ ] Add each new page to `app/sitemap.ts` as you build it

### Phase 2: Subject pages (builds topical authority)
- [ ] Create subject page template (reusable layout, see `/programs/sace` as reference)
- [ ] `/subjects/maths-methods`
- [ ] `/subjects/specialist-maths`
- [ ] `/subjects/general-maths`
- [ ] `/subjects/chemistry`
- [ ] `/subjects/physics`
- [ ] `/subjects/biology`
- [ ] `/subjects/english`
- [ ] `/subjects/english-literature`
- [ ] `/subjects/accounting`
- [ ] `/subjects/research-project`
- [ ] Add all subject pages to sitemap

### Phase 3: Blog + content marketing (topical authority + long-tail traffic)
- [ ] Set up `/blog` list page + `/blog/[slug]` dynamic route
- [ ] Write first 4 high-priority posts (see SEO-STRATEGY.md §7):
  - [ ] "How to Choose the Right SACE Tutor"
  - [ ] "UCAT Preparation Timeline: When to Start and What to Cover"
  - [ ] "How ATAR Scaling Works in South Australia"
  - [ ] "What UCAT Score Do You Need for Adelaide Medicine?"
- [ ] Write next 4 posts:
  - [ ] "Top 5 Study Strategies for Maths Methods"
  - [ ] "How to Know If Your Child Needs a Tutor"
  - [ ] "Medicine Pathway: Year 10 to Med School — A Complete Roadmap"
  - [ ] "Is a UCAT Course Worth It? What to Look For"
- [ ] Continue with remaining 16 posts from content plan

### Phase 4: Conversion optimisation
- [ ] Create lead magnets (see SEO-STRATEGY.md §8.1):
  - [ ] SACE Study Plan Template (PDF download, email-gated)
  - [ ] UCAT Weekly Practice Planner (PDF download)
- [ ] Add FAQ sections to program pages (captures long-tail search)
- [ ] Add "Why Simple Tuition" trust bar to home hero (WWCC, top 1%, 1-day response)
- [ ] Add tutor vetting process section to /how-it-works

### Phase 5: Local SEO
- [ ] Create Google Business Profile for Simple Tuition (Adelaide)
- [ ] Confirm exact suburbs served
- [ ] Only after confirming: create `/adelaide/[suburb]` pages with unique content
- [ ] Collect Google reviews from students/parents

### Phase 6: Tutor profile pages (when ready)
- [ ] Decide on tutor detail page scope (full bio, calendar, etc.)
- [ ] Build `/tutors/[slug]` pages with proper content
- [ ] Add tutor pages to sitemap
- [ ] Interlink from subject + program pages

### Ongoing
- [ ] Monitor Google Search Console for indexing issues
- [ ] Track keyword rankings for core terms
- [ ] Publish 2–4 blog posts per month
- [ ] Collect and display real reviews (then add AggregateRating schema)

## Discarded
- [ ] Tutor detail page `/tutors/[slug]` (deferred to Phase 6)

## Nice-to-have
- [ ] Framer Motion pass:
  - [ ] Subtle section reveal (fade + 12-20px slide-in)
  - [ ] Hero headline underline sweep / gradient accent
  - [ ] CTA button hover + tap micro-interactions
  - [ ] Tutor cards hover lift + shadow soften
  - [ ] Testimonial cards staggered entrance
  - [ ] Enquiry form success message fade-in
  - [ ] Mobile nav menu slide-down
- [ ] Animation polish:
  - [ ] Respect reduced-motion setting
  - [ ] Keep durations 0.35–0.6s, easeOut
  - [ ] Avoid scroll-jank / heavy parallax
- [x] Simple admin later (full admin dashboard built)
