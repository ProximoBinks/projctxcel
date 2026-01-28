import { mutation } from "./_generated/server";
import { v } from "convex/values";

type TutorSeed = {
  name: string;
  slug: string;
  photoUrl: string;
  headline?: string;
  bioShort: string;
  bioLong?: string;
  subjects: Array<string>;
  yearLevels: Array<string>;
  stats: Array<{ label: string; value: string }>;
  active: boolean;
  sortOrder: number;
};

type TestimonialSeed = {
  quote: string;
  name: string;
  context?: string;
  active: boolean;
  sortOrder: number;
};

const tutorsSeed: Array<TutorSeed> = [
  {
    name: "Ava Chen",
    slug: "ava-chen",
    photoUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&w=800&q=80",
    headline: "Mathematics & UCAT mentor",
    bioShort:
      "Focuses on confidence-first learning and exam stamina for senior students.",
    bioLong:
      "Ava tutors specialist maths, methods, and UCAT prep with a calm, structured approach. She works with students on timing strategies, core skill mastery, and personalised revision plans.",
    subjects: ["Specialist Maths", "Maths Methods", "UCAT"],
    yearLevels: ["Year 9", "Year 10", "Year 11", "Year 12"],
    stats: [
      { label: "UCAT percentile", value: "99%" },
      { label: "Students taught", value: "70+" },
      { label: "Years tutoring", value: "7" },
    ],
    active: true,
    sortOrder: 1,
  },
  {
    name: "Liam Patel",
    slug: "liam-patel",
    photoUrl:
      "https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?auto=format&fit=facearea&w=800&q=80",
    headline: "Chemistry & Biology specialist",
    bioShort:
      "Makes complex science simple with clear visuals and structured notes.",
    bioLong:
      "Liam supports SACE Chemistry and Biology students with concept maps, practical exam technique, and targeted feedback on past papers.",
    subjects: ["Chemistry", "Biology"],
    yearLevels: ["Year 10", "Year 11", "Year 12"],
    stats: [
      { label: "ATAR improvement", value: "+15" },
      { label: "SACE experience", value: "8 yrs" },
      { label: "Tutoring style", value: "Structured" },
    ],
    active: true,
    sortOrder: 2,
  },
  {
    name: "Mia Harper",
    slug: "mia-harper",
    photoUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=facearea&w=800&q=80",
    headline: "English & Humanities coach",
    bioShort:
      "Helps students craft sharp essays and strong analytical arguments.",
    bioLong:
      "Mia focuses on writing fluency, evidence selection, and exam-ready structures for English, Modern History, and Legal Studies.",
    subjects: ["English", "Modern History", "Legal Studies"],
    yearLevels: ["Year 8", "Year 9", "Year 10", "Year 11", "Year 12"],
    stats: [
      { label: "Essays marked", value: "500+" },
      { label: "Students taught", value: "80+" },
      { label: "Focus", value: "Clarity" },
    ],
    active: true,
    sortOrder: 3,
  },
  {
    name: "Noah Wright",
    slug: "noah-wright",
    photoUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&w=800&q=80",
    headline: "Physics & Methods tutor",
    bioShort:
      "Breaks down tricky problems into simple, repeatable steps.",
    bioLong:
      "Noah specialises in physics and maths methods, with a teaching style that blends real-world examples and exam-style practice.",
    subjects: ["Physics", "Maths Methods"],
    yearLevels: ["Year 10", "Year 11", "Year 12"],
    stats: [
      { label: "Physics mentor", value: "6 yrs" },
      { label: "Exam prep", value: "Weekly" },
      { label: "Avg improvement", value: "+12" },
    ],
    active: true,
    sortOrder: 4,
  },
  {
    name: "Zoe Bennett",
    slug: "zoe-bennett",
    photoUrl:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=800&q=80",
    headline: "Junior literacy specialist",
    bioShort:
      "Builds strong reading and writing foundations for early learners.",
    bioLong:
      "Zoe supports Reception to Year 6 students with phonics, comprehension, and confidence in class assessments.",
    subjects: ["Literacy", "Creative Writing"],
    yearLevels: [
      "Reception",
      "Year 1",
      "Year 2",
      "Year 3",
      "Year 4",
      "Year 5",
      "Year 6",
    ],
    stats: [
      { label: "Families supported", value: "45+" },
      { label: "Session style", value: "Warm" },
      { label: "Focus", value: "Foundations" },
    ],
    active: true,
    sortOrder: 5,
  },
  {
    name: "Ethan Rowe",
    slug: "ethan-rowe",
    photoUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&w=800&q=80",
    headline: "UCAT + interview prep",
    bioShort:
      "Delivers high-intensity practice and personalised feedback.",
    bioLong:
      "Ethan runs UCAT preparation and medical interview coaching with a focus on timing, reasoning strategy, and confidence.",
    subjects: ["UCAT", "Interview Prep"],
    yearLevels: ["Year 11", "Year 12"],
    stats: [
      { label: "UCAT strategy", value: "Proven" },
      { label: "Mocks", value: "25+" },
      { label: "Conversion", value: "High" },
    ],
    active: true,
    sortOrder: 6,
  },
  {
    name: "Isla Nguyen",
    slug: "isla-nguyen",
    photoUrl:
      "https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?auto=format&fit=facearea&w=800&q=80",
    headline: "Accounting & Business mentor",
    bioShort:
      "Brings clarity to SACE Accounting and Business Innovation.",
    bioLong:
      "Isla focuses on practical case studies, formula confidence, and application-based learning for senior students.",
    subjects: ["Accounting", "Business Innovation"],
    yearLevels: ["Year 10", "Year 11", "Year 12"],
    stats: [
      { label: "Industry exp.", value: "5 yrs" },
      { label: "SACE focus", value: "Senior" },
      { label: "Approach", value: "Applied" },
    ],
    active: true,
    sortOrder: 7,
  },
  {
    name: "Oliver James",
    slug: "oliver-james",
    photoUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&w=800&q=80",
    headline: "Legal Studies + Research Projects",
    bioShort:
      "Supports analysis-heavy subjects with structure and critical thinking.",
    bioLong:
      "Oliver helps students develop high-scoring responses for Legal Studies, Research Project, and Modern History.",
    subjects: ["Legal Studies", "Research Project", "Modern History"],
    yearLevels: ["Year 11", "Year 12"],
    stats: [
      { label: "SACE focus", value: "Stage 2" },
      { label: "Essay coaching", value: "Focused" },
      { label: "Feedback", value: "Detailed" },
    ],
    active: true,
    sortOrder: 8,
  },
  {
    name: "Ruby Sinclair",
    slug: "ruby-sinclair",
    photoUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=facearea&w=800&q=80",
    headline: "Maths + Science all-rounder",
    bioShort:
      "Flexible tutor covering general maths and science across mid years.",
    bioLong:
      "Ruby works with students to build consistency, positive habits, and exam readiness in maths and science.",
    subjects: ["General Maths", "Science", "Physics"],
    yearLevels: ["Year 7", "Year 8", "Year 9", "Year 10"],
    stats: [
      { label: "Students taught", value: "50+" },
      { label: "Session format", value: "In-person" },
      { label: "Focus", value: "Confidence" },
    ],
    active: true,
    sortOrder: 9,
  },
  {
    name: "Caleb Reid",
    slug: "caleb-reid",
    photoUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&w=800&q=80",
    headline: "Visual Arts & Design tutor",
    bioShort:
      "Guides folio development with strong feedback and clear milestones.",
    bioLong:
      "Caleb helps students refine visual arts concepts, build cohesive folios, and prepare artist statements for SACE assessment.",
    subjects: ["Visual Arts", "Design", "Creative Arts"],
    yearLevels: ["Year 9", "Year 10", "Year 11", "Year 12"],
    stats: [
      { label: "Folios reviewed", value: "120+" },
      { label: "Studio sessions", value: "Weekly" },
      { label: "Focus", value: "Folio quality" },
    ],
    active: true,
    sortOrder: 10,
  },
  {
    name: "Harper Singh",
    slug: "harper-singh",
    photoUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&w=800&q=80",
    headline: "Economics & Business coach",
    bioShort:
      "Sharpens analytical writing and data interpretation for SACE.",
    bioLong:
      "Harper supports Economics and Business Innovation students with exam technique, structured essay frameworks, and case study analysis.",
    subjects: ["Economics", "Business Innovation"],
    yearLevels: ["Year 10", "Year 11", "Year 12"],
    stats: [
      { label: "Case studies", value: "60+" },
      { label: "Focus", value: "Exam ready" },
      { label: "SACE", value: "Stage 2" },
    ],
    active: true,
    sortOrder: 11,
  },
  {
    name: "Sienna Moore",
    slug: "sienna-moore",
    photoUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&w=800&q=80",
    headline: "Primary numeracy specialist",
    bioShort:
      "Builds number confidence and problem-solving for junior years.",
    bioLong:
      "Sienna focuses on foundational numeracy skills, fluency, and confidence for Reception to Year 6 students.",
    subjects: ["Numeracy", "General Maths"],
    yearLevels: [
      "Reception",
      "Year 1",
      "Year 2",
      "Year 3",
      "Year 4",
      "Year 5",
      "Year 6",
    ],
    stats: [
      { label: "Families supported", value: "55+" },
      { label: "Session style", value: "Calm" },
      { label: "Focus", value: "Foundations" },
    ],
    active: true,
    sortOrder: 12,
  },
  {
    name: "Aria Costa",
    slug: "aria-costa",
    photoUrl:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=800&q=80",
    headline: "Languages & literacy coach",
    bioShort:
      "Supports reading comprehension and essay flow with practical frameworks.",
    bioLong:
      "Aria helps students strengthen literacy foundations, language analysis, and structured responses across junior and senior years.",
    subjects: ["English", "Literature", "Literacy"],
    yearLevels: ["Year 7", "Year 8", "Year 9", "Year 10", "Year 11"],
    stats: [
      { label: "Essays coached", value: "400+" },
      { label: "Feedback style", value: "Clear" },
      { label: "Focus", value: "Structure" },
    ],
    active: true,
    sortOrder: 13,
  },
  {
    name: "Leo Hart",
    slug: "leo-hart",
    photoUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&w=800&q=80",
    headline: "Digital Tech & Maths tutor",
    bioShort:
      "Builds coding confidence and logical thinking for senior students.",
    bioLong:
      "Leo supports Digital Technologies and maths students with project guidance, exam preparation, and problem-solving habits.",
    subjects: ["Digital Technologies", "Maths Methods", "General Maths"],
    yearLevels: ["Year 9", "Year 10", "Year 11", "Year 12"],
    stats: [
      { label: "Projects guided", value: "40+" },
      { label: "Focus", value: "Logic" },
      { label: "Sessions", value: "Hands-on" },
    ],
    active: true,
    sortOrder: 14,
  },
  {
    name: "Ella Brooks",
    slug: "ella-brooks",
    photoUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&w=800&q=80",
    headline: "Humanities & Research Projects",
    bioShort:
      "Supports research planning and critical thinking for SACE.",
    bioLong:
      "Ella helps students with Research Project planning, source evaluation, and presentation confidence for Stage 1 and 2.",
    subjects: ["Research Project", "Modern History", "Geography"],
    yearLevels: ["Year 10", "Year 11", "Year 12"],
    stats: [
      { label: "Research plans", value: "90+" },
      { label: "Focus", value: "Clarity" },
      { label: "SACE", value: "Stage 1-2" },
    ],
    active: true,
    sortOrder: 15,
  },
];

const testimonialsSeed: Array<TestimonialSeed> = [
  {
    quote:
      "projctxcel matched us with a tutor who completely changed our son's confidence in maths.",
    name: "Emmanuel L.",
    context: "Class of 24",
    active: true,
    sortOrder: 1,
  },
  {
    quote:
      "The UCAT prep was structured and intense, and the interview coaching was next level.",
    name: "Daniel M.",
    context: "Year 12 student",
    active: true,
    sortOrder: 2,
  },
  {
    quote:
      "We loved the calm, professional approach. Clear progress and regular check-ins.",
    name: "Priya K.",
    context: "Parent, Year 7",
    active: true,
    sortOrder: 3,
  },
];

export const seed = mutation({
  args: {},
  returns: v.object({
    tutors: v.number(),
    testimonials: v.number(),
  }),
  handler: async (ctx) => {
    let tutorInserts = 0;
    let testimonialInserts = 0;

    for (const tutor of tutorsSeed) {
      const existing = await ctx.db
        .query("tutors")
        .withIndex("by_slug", (q) => q.eq("slug", tutor.slug))
        .unique();
      if (!existing) {
        await ctx.db.insert("tutors", tutor);
        tutorInserts += 1;
      }
    }

    for (const testimonial of testimonialsSeed) {
      const existing = await ctx.db
        .query("testimonials")
        .withIndex("by_active_and_sortOrder", (q) =>
          q.eq("active", testimonial.active).eq("sortOrder", testimonial.sortOrder)
        )
        .unique();
      if (!existing) {
        await ctx.db.insert("testimonials", testimonial);
        testimonialInserts += 1;
      }
    }

    return {
      tutors: tutorInserts,
      testimonials: testimonialInserts,
    };
  },
});
