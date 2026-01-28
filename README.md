# Simple Tuition

Modern tutoring marketing site + lead capture app for Reception to Year 12, covering SACE, UCAT, and interview prep.

## Stack

- Next.js 14+ App Router (TypeScript)
- Tailwind CSS
- Framer Motion
- Convex
- Postmark email delivery

## Getting started

1. Install dependencies:
   ```
   npm install
   ```
2. Copy env variables:
   ```
   cp .env.example .env.local
   ```
3. Start Convex dev server:
   ```
   npx convex dev
   ```
4. Run the Next.js dev server:
   ```
   npm run dev
   ```

## Seeding Convex data

After `npx convex dev` is running, run the seed mutation in the Convex dashboard:

- Function: `seed`
- Path: `convex/seed.ts`

This will add sample tutors and testimonials (only once).

## Environment variables

See `.env.example` for required variables. If Postmark variables are missing, enquiries are still stored but emails are skipped.

## Notes & assumptions

- Tutors coordinate in-person session logistics with families.
- Pricing is displayed as enquiry-based and varies by tutor and subject.
- Icons are sourced from Iconmonstr.
- Tutor and testimonial content are stored in `data/tutors.json` and `data/testimonials.json`.
- Tutor headshots should be placed in `public/images/tutors` and referenced by `photoFile`.
- The conditional enquiry form is available at `/enquire` for QR linking.