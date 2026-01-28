# Todo

## Blockers
- [ ] Confirm business name + domain
- [x] Collect tutor bios/photos/stats
- [ ] Decide accent color
- [ ] Business email (for Postmark)

## Build
- [ ] Repo scaffold (Next.js + Tailwind + Framer Motion)
- [ ] Landing sections
- [ ] Tutor grid (3x3) linking to `/tutors/[slug]`
- [ ] `/tutors` redirect → `/`
- [ ] Tutor detail page `/tutors/[slug]`
- [ ] Enquiry form (section `/#enquire` or `/enquire` page)
- [ ] Conditional enquiry form:
  - [ ] First question: “How can we help you today?” → (Tutor enquiry / Join team)
  - [ ] Student path fields: year level, target ATAR, struggling subjects, planned uni, interests/hobbies, then name/email/phone
  - [ ] Tutor path fields: experience, expertise, CV upload, then name/email/phone
  - [ ] Add consent copy for promos/ads follow-up (privacy-friendly)
- [ ] Store form submissions (DB + admin view) OR email forward (Postmark) + backup storage
- [ ] Generate brochure QR code linking directly to the form URL
- [ ] Signup page (basic, define what signup means)
- [ ] Postmark integration
- [ ] Deploy (Netlify)

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
- [ ] Simple admin later
