# Design QA

## Visual Sources

- Reference: `/var/folders/3q/dwp1jw994wb4zrzsyv3st1b00000gn/T/codex-clipboard-efbcb623-724c-47f9-9182-ed1cae0dc891.png`
- Implementation: `/Users/emmanuellee/Documents/projects/projctxcel/implementation-form-typography.png`
- Combined comparison: `/Users/emmanuellee/Documents/projects/projctxcel/form-typography-comparison.png`
- Reference size: 1187 x 134 px
- Browser viewport: 1189 x 600 CSS px
- Verified state: student enquiry form, including the first step and Subjects & goals step

## Findings

- The step label uses tighter `0.16em` tracking and a bold `700` weight.
- Form step headings use the same responsive typography: 20 px on small screens and 24 px from the `sm` breakpoint.
- Browser measurement confirmed the first “How can we help you today?” heading renders at 24 px, weight 600, with a 30 px line height at the verification viewport.
- The first-step heading-to-buttons gap is 20 px.
- Both type buttons render with transparent backgrounds before a choice is made; the blue selected treatment appears only after an explicit selection.
- The Next and Submit pills now render at a minimum width of 120 px and a fixed height of 44 px.
- The tutoring-experience step includes an explanatory note and permits applicants to leave the textarea blank when the information is in their CV.
- No clipping, overflow, spacing regression, or broken form controls were visible.
- TypeScript validation completed without errors.

## Comparison History

- Pass 1: Increased the Subjects & goals heading and tightened the step label.
- Pass 2: Applied the same heading treatment to the first form question and rechecked the live form.
- Pass 3: Increased the first-step spacing and changed the initial choice-button state from preselected to neutral.
- Pass 4: Widened and shortened the Next and Submit action pills.
- Pass 5: Reduced the action-pill width and increased its height for a more balanced proportion.
- Pass 6: Added the CV guidance beneath the tutoring-experience heading and aligned validation with the optional field.

## Final Result

Passed.

---

# Design QA: Services Section Redesign

## Visual Sources

- Source visual truth: `/Users/emmanuellee/.codex/generated_images/019c3619-a0ba-7090-be68-ef1e6f367cd9/call_QUJxfJ0PqVjhu1z6Z9XdIKBG.png`
- Browser-rendered implementation: `/Users/emmanuellee/Documents/projects/projctxcel/audits/services-option2-section-stitched.png`
- Combined comparison: `/Users/emmanuellee/Documents/projects/projctxcel/audits/services-option2-comparison.png`
- Source pixels: 1435 x 1096
- Implementation pixels: 1202 x 1132, assembled from overlapping browser captures of the same section and state
- Browser viewport: 1280 x 720 CSS px at device density 1
- Normalization: both images were proportionally contained in equal 720 x 620 comparison frames without stretching
- State: homepage services section, English locale, all entrance animations settled

## Full-View Comparison Evidence

- The implementation preserves the selected concept's two overlapping chapter surfaces, three-plus-two card hierarchy, left-aligned headings, generous spacing, and rounded panel treatment.
- The implementation intentionally uses the existing Simple Tuition icons and exact production copy rather than the illustrative icon substitutions in the generated concept.
- The upper panel uses a flat brand cobalt rather than the source's subtle rendered gradient so it remains consistent with the site's existing colour system.
- The five cards remain visually distinct, equally grouped, and fully readable with no section or document overflow at the tested viewport.

## Focused Region Comparison Evidence

- Upper chapter: heading scale, eyebrow spacing, three-column grid, card radii, pale card surfaces, and blue icon tiles align with the selected direction.
- Overlap: the powder-blue group panel overlaps the cobalt panel cleanly without clipping or creating a visible gap.
- Lower chapter: both group cards have matched heights, readable line lengths, and sufficient bottom padding inside the rounded panel.
- Copy: all five card titles and descriptions, both section headings, and both supporting descriptions match the translation source.

## Findings

- No actionable P0, P1, or P2 differences remain.
- P3: the browser captures include the local Next.js development indicator; this is not present in production builds.
- P3: card copy wraps slightly earlier than the generated concept at the 1280 px browser viewport. At the concept's 1435 px width, the responsive grid provides the intended wider card proportions.

## Interaction And Accessibility Checks

- Verified all five cards remain links to their original program routes.
- Verified keyboard focus rings are present on every card link.
- Verified no horizontal document or section overflow at the tested desktop viewport.
- Verified the layout collapses to a single-column card flow below the existing `md` breakpoint.
- Production build and TypeScript validation completed without errors.

## Comparison History

- Pass 1: Implemented the selected two-chapter composition and captured the upper and lower panels in the live browser.
- Pass 2: Normalized and combined the selected concept and stitched implementation evidence. No P0, P1, or P2 corrections were required.

## Final Result

final result: passed

---

# Design QA: Interview Offer Wall

## Visual Sources

- Original section reference: `/var/folders/3q/dwp1jw994wb4zrzsyv3st1b00000gn/T/codex-clipboard-83eb125e-fd52-4f5d-be9d-ae0adf5bab95.png`
- Updated source documents: `adelaide.png`, `dent.png`, `monash.png`, `unsw.jpeg`, `uq.png`, and `utas.png` from the supplied Downloads folder
- Desktop implementation: `/Users/emmanuellee/Documents/projects/projctxcel/audits/interview-offers-desktop.png`
- Mobile implementation: `/Users/emmanuellee/Documents/projects/projctxcel/audits/interview-offers-mobile.jpg`
- Side-by-side comparison: `/Users/emmanuellee/Documents/projects/projctxcel/audits/interview-offers-comparison.png`
- Desktop browser width: 1265 CSS px
- Mobile browser viewport: 390 x 844 CSS px

## Full-View Comparison Evidence

- All six offer letters are visible together on desktop instead of being obscured inside a single-card coverflow.
- Each document retains its original aspect ratio and full contents; no fixed-height crop or large artificial blank card area remains.
- The two landscape Adelaide documents use wider desktop columns than the portrait offers, producing a balanced single-row composition.
- The active offer receives a restrained blue outline, lift, and shadow while every other offer remains clear and readable.
- The section background, typography, spacing, and cobalt accent remain consistent with the existing Simple Tuition visual system.

## Responsive And Interaction Checks

- Mobile uses a two-column document wall with no horizontal overflow.
- All six images loaded successfully at their optimized WebP dimensions.
- Clicking an offer moves the highlight to that document.
- Automatic emphasis advanced from UNSW to UQ after the configured interval.
- Hover and keyboard focus pause automatic advancement.
- Reduced-motion users receive no automatic advancement or transform animation.
- No tabs, pagination dots, or previous/next controls remain below the document wall.
- Browser console check returned no warnings or errors.

## Validation

- `npx tsc --noEmit --incremental false`: passed.
- `npm run build`: passed, including the `/interview` static route.
- `git diff --check`: passed for the edited components.

## Final Result

final result: passed

## Readability Revision

- Re-exported all six offer assets directly from the latest supplied files at their full source dimensions.
- Desktop card width increased from approximately 170 px to approximately 573 px at the normal 1265 px browser width.
- Extra-wide card width measured approximately 507 px in the three-column 1920 px layout.
- Mobile now uses one full-width card per row, measuring approximately 329 px at the 390 px viewport.
- The responsive layout is one column by default, two columns from `md`, and three columns only from `2xl`.
- Source-to-browser comparison: `/Users/emmanuellee/Documents/projects/projctxcel/audits/interview-offers-readable-comparison.jpg`.
- Desktop evidence: `/Users/emmanuellee/Documents/projects/projctxcel/audits/interview-offers-readable-desktop.jpg`.
- Mobile evidence: `/Users/emmanuellee/Documents/projects/projctxcel/audits/interview-offers-readable-mobile.jpg`.
- All images loaded at their expected source dimensions, with no horizontal overflow or browser warnings.
- Production build and TypeScript validation passed after the revision.

## Uniform Card Revision

- Standardised every preview to the UNSW image ratio of `945:1084`.
- All cards now have the same visual width, height, radius, and row alignment.
- All six supplied sources are pre-rendered into `945 x 1084` top-aligned preview assets, matching UNSW before they reach the browser.
- The browser renders each prepared preview at its natural ratio without `object-cover`, preventing the zoomed and horizontally clipped text seen in the earlier pass.
- Normal desktop measurements are approximately 573 x 657 px per inactive card; the highlighted card's slight rotation expands its visual bounding box by approximately 2 px.
- Verified the UNSW/UQ row and Monash/Adelaide row in the live browser.
- Desktop evidence: `/Users/emmanuellee/Documents/projects/projctxcel/audits/interview-offers-uniform-desktop.jpg`.
- Second-row evidence: `/Users/emmanuellee/Documents/projects/projctxcel/audits/interview-offers-uniform-second-row.jpg`.
- Corrected six-card evidence: `/Users/emmanuellee/Documents/projects/projctxcel/audits/interview-offers-corrected-previews.jpg`.
- Generated-asset contact sheet: `/Users/emmanuellee/Documents/projects/projctxcel/audits/interview-offers-generated-previews.jpg`.
- No horizontal overflow or browser warnings were present.
- Production build and TypeScript validation passed after the uniform-card revision.

---

# Design QA: Interview Offer Fan

## Visual Sources

- Source visual truth: `/var/folders/3q/dwp1jw994wb4zrzsyv3st1b00000gn/T/codex-clipboard-f69f9565-feac-4f8e-85d2-1c8bf3bed2f2.png`
- Browser-rendered implementation: `/Users/emmanuellee/Documents/projects/projctxcel/audits/interview-offer-fan-desktop.png`
- Combined comparison: `/Users/emmanuellee/Documents/projects/projctxcel/audits/interview-offer-fan-comparison.png`
- Source pixels: 976 x 622
- Implementation pixels: 1265 x 710 at device density 1
- Comparison crop: 1265 x 520, proportionally contained beside the source without stretching
- Browser viewport: 1265 x 710 CSS px
- State: interview offer section with Monash University offer active

## Full-View Comparison Evidence

- The implementation matches the reference composition: one centred front card, progressively smaller overlapping cards on both sides, shared horizontal centres, and restrained card rotations.
- All six supplied offer documents remain present. Their natural proportions are preserved rather than cropped into equal-height frames.
- The fan is contained inside the section with no page overflow, horizontal scrolling, scrollbar, tabs, pagination dots, or previous/next controls.
- The existing Simple Tuition pale-blue section background is intentionally preserved instead of copying the reference's black presentation background.

## Focused Region Comparison Evidence

- No additional focused crop was required because the combined comparison displays the complete fan at a scale sufficient to judge overlap, card scale, rotation, centre alignment, radii, shadows, and image quality.
- Fonts and typography: the section heading and supporting copy are unchanged from the verified production design; the source reference contains no comparable UI typography.
- Spacing and layout rhythm: the card fan is centred under the heading, with overlap and outer-card spacing following the reference hierarchy.
- Colors and tokens: the existing brand background, cobalt active outline, and slate shadows are retained consistently.
- Image quality and asset fidelity: the exact supplied offer images are used at their natural aspect ratios with no CSS crop or replacement asset.
- Copy and content: section copy and all image alt/selection labels remain unchanged.

## Interaction And Accessibility Checks

- Automatic front-card rotation remains enabled for users who do not prefer reduced motion.
- Hover and keyboard focus continue to pause the rotation.
- Every offer remains a labelled button with a visible keyboard focus treatment and `aria-current` on the front card.
- Six offer buttons rendered, no horizontal document overflow was present, and no runtime error overlay appeared.

## Findings

- No actionable P0, P1, or P2 differences remain.
- P3: six offer documents require one additional outer card compared with the five-card reference, so the fan is slightly wider while preserving the same visual hierarchy.

## Comparison History

- Pass 1: Replaced the horizontal scrolling strip with the overlapping fan and removed the scrollbar.
- Pass 2: Compared the browser implementation against the supplied reference. No blocking corrections were required.
- Pass 3: Increased the active-card width from approximately 370 px to 410 px and increased the fan step from 42% to 46%, bringing the outer offers closer to the section edges.

## Wider Fan Revision

- Browser evidence: `/Users/emmanuellee/Documents/projects/projctxcel/audits/interview-offer-fan-wide-desktop.png`.
- Combined comparison: `/Users/emmanuellee/Documents/projects/projctxcel/audits/interview-offer-fan-wide-comparison.png`.
- The active card measured approximately 418 px including its active scale treatment at the 1265 px viewport.
- The fan's transformed card bounds span approximately 1271 px while remaining clipped inside the component rather than creating document overflow.
- No horizontal scrollbar or page overflow was introduced.

## Validation

- `npx tsc --noEmit --incremental false`: passed.
- `git diff --check`: passed.

## Final Result

final result: passed
