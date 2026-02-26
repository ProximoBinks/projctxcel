"use client";

import { useEffect, useRef, useState } from "react";
import ArticleCTA from "../../../../components/ArticleCTA";

const TOC_ITEMS = [
  { id: "introduction", label: "Introduction" },
  { id: "university-of-adelaide", label: "University of Adelaide" },
  { id: "flinders-university", label: "Flinders University" },
  { id: "interstate-options", label: "Interstate Options" },
  { id: "understanding-the-ucat", label: "Understanding the UCAT" },
  { id: "interview-preparation", label: "Interview Preparation" },
  { id: "subject-selection", label: "Subject Selection" },
  { id: "year-by-year-timeline", label: "Year-by-Year Timeline" },
  { id: "common-mistakes", label: "Common Mistakes" },
  { id: "faq", label: "FAQ" },
];

export default function HowToGetIntoMedicine() {
  const [activeId, setActiveId] = useState("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    const headings = document.querySelectorAll("article h2[id]");
    headings.forEach((h) => observerRef.current?.observe(h));

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="flex justify-between gap-12 pb-20">
      {/* Article body */}
      <article className="min-w-0 max-w-none flex-1 text-base leading-relaxed text-slate-600">
        {/* Introduction */}
        <h2
          id="introduction"
          className="text-2xl font-semibold text-slate-950 sm:text-3xl"
        >
          Introduction
        </h2>
        <p className="mt-4">
          Medicine remains one of the most sought-after career paths in
          Australia, attracting thousands of high-achieving students each year.
          Whether you&apos;re a parent helping your child plan ahead or a
          student mapping out your own journey, understanding the pathways,
          requirements, and timelines is essential.
        </p>
        <p className="mt-4">
          This guide covers everything you need to know about getting into
          undergraduate medicine in Australia, with a particular focus on
          Adelaide universities. We&apos;ll walk through ATAR
          requirements, UCAT preparation, interviews, subject selection, and a
          year-by-year timeline to keep you on track.
        </p>
        <p className="mt-4">
          Competition is fierce, with most programs having acceptance rates below 5%.
          But with the right preparation strategy and timeline, you can
          significantly improve your chances.
        </p>

        {/* University of Adelaide */}
        <h2
          id="university-of-adelaide"
          className="mt-16 text-2xl font-semibold text-slate-950 sm:text-3xl"
        >
          University of Adelaide
        </h2>
        <p className="mt-4">
          The University of Adelaide offers a Bachelor of Medical Studies /
          Doctor of Medicine (MBBS/MD), a six-year undergraduate-entry program
          that is one of the most competitive in the country.
        </p>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-6 py-3 font-semibold text-slate-950">
                  Criteria
                </th>
                <th className="px-6 py-3 font-semibold text-slate-950">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-6 py-3 font-medium text-slate-700">
                  Program
                </td>
                <td className="px-6 py-3">
                  Bachelor of Medical Studies / Doctor of Medicine
                </td>
              </tr>
              <tr>
                <td className="px-6 py-3 font-medium text-slate-700">
                  Duration
                </td>
                <td className="px-6 py-3">6 years</td>
              </tr>
              <tr>
                <td className="px-6 py-3 font-medium text-slate-700">
                  ATAR Requirement
                </td>
                <td className="px-6 py-3">99.5+ (to be competitive)</td>
              </tr>
              <tr>
                <td className="px-6 py-3 font-medium text-slate-700">
                  UCAT Requirement
                </td>
                <td className="px-6 py-3">
                  90th percentile or above (to be competitive)
                </td>
              </tr>
              <tr>
                <td className="px-6 py-3 font-medium text-slate-700">
                  Interview
                </td>
                <td className="px-6 py-3">Online MMI (Multiple Mini Interview)</td>
              </tr>
              <tr>
                <td className="px-6 py-3 font-medium text-slate-700">
                  Selection
                </td>
                <td className="px-6 py-3">
                  ATAR (40%) + UCAT (20%) + Interview (40%)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="mt-8 text-lg font-semibold text-slate-950">
          Selection criteria
        </h3>
        <p className="mt-3">
          Adelaide uses a combination of ATAR (or equivalent), UCAT score, and
          MMI performance to rank applicants. Each component carries significant
          weight, so excelling in just one area is not enough. Strong applicants
          typically perform well across all three.
        </p>
        <p className="mt-3">
          The university also considers bonus points for rural background and
          Indigenous applicants through specific sub-quota pathways. Check the
          university&apos;s admissions page for the most current weighting
          information.
        </p>

        {/* Flinders University */}
        <h2
          id="flinders-university"
          className="mt-16 text-2xl font-semibold text-slate-950 sm:text-3xl"
        >
          Flinders University
        </h2>
        <p className="mt-4">
          Flinders University offers the Doctor of Medicine (MD) as a
          graduate-entry program. However, they also accept high-achieving
          school leavers into an accelerated Bachelor of Clinical Sciences /
          Doctor of Medicine pathway.
        </p>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-6 py-3 font-semibold text-slate-950">
                  Criteria
                </th>
                <th className="px-6 py-3 font-semibold text-slate-950">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-6 py-3 font-medium text-slate-700">
                  Program
                </td>
                <td className="px-6 py-3">
                  Bachelor of Clinical Sciences / Doctor of Medicine
                </td>
              </tr>
              <tr>
                <td className="px-6 py-3 font-medium text-slate-700">
                  Duration
                </td>
                <td className="px-6 py-3">6 years</td>
              </tr>
              <tr>
                <td className="px-6 py-3 font-medium text-slate-700">
                 ATAR Requirement
                </td>
                <td className="px-6 py-3">99.0+ (to be competitive)</td>
              </tr>
              <tr>
                <td className="px-6 py-3 font-medium text-slate-700">
                  Selection
                </td>
                <td className="px-6 py-3">ATAR (90%) + UCAT (10%)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-4">
        In recent years, many successful school leavers have also qualified for rural or equity adjustments, which can significantly strengthen their selection rank.
        </p>

        {/* Interstate Options */}
        <h2
          id="interstate-options"
          className="mt-16 text-2xl font-semibold text-slate-950 sm:text-3xl"
        >
          Interstate Options
        </h2>
        <p className="mt-4">
          Many Adelaide students also apply to interstate medical schools to
          maximise their chances. Here are some of the most popular options:
        </p>

        <div className="mt-6 space-y-4">
          {[
            {
              uni: "UNSW Sydney",
              program: "Bachelor of Medical Studies / Doctor of Medicine (6 years)",
              note: "Requires strong ATAR + UCAT. In-person interview. Extremely competitive.",
            },
            {
              uni: "Monash University",
              program: "Bachelor of Medical Science and Doctor of Medicine (5 years)",
              note: "Requires strong ATAR + UCAT. Online interview. Extremely competitive.",
            },
            {
              uni: "Western Sydney University",
              program: "Bachelor of Clinical Science / Doctor of Medicine (5 years)",
              note: "Requires strong ATAR + UCAT. Online interview. Extremely competitive.",
            },
            {
              uni: "University of Newcastle / UNE (JMP)",
              program: "Joint Medical Program — Bachelor of Medical Science / Doctor of Medicine (5 years)",
              note: "Requires ATAR + UCAT + interview. Offers rural placements and a strong community health focus.",
            },
            {
              uni: "Bond University",
              program: "Bachelor of Medical Studies / Doctor of Medicine (4 years 8 months)",
              note: "Private university — accelerated timeline, no UCAT required, uses interview and academic record. Higher fees but faster completion.",
            },
          ].map((item) => (
            <div
              key={item.uni}
              className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-slate-950">
                {item.uni}
              </h3>
              <p className="mt-1 text-sm font-medium text-blue-600">
                {item.program}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {item.note}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-6">
          Applying broadly increases your chances. Many students receive offers
          from interstate universities even when they miss out on Adelaide or
          Flinders spots. Research each university&apos;s specific weightings
          and deadlines carefully.
        </p>

        {/* CTA: UCAT Prep */}
        <ArticleCTA
          variant="ucat"
          title="Need help preparing for the UCAT?"
          description="Our tutors scored in the top percentiles of the UCAT and can help you build the strategies and confidence you need. Start preparing early for the best results."
          buttonText="Get UCAT support"
        />

        {/* Understanding the UCAT */}
        <h2
          id="understanding-the-ucat"
          className="mt-16 text-2xl font-semibold text-slate-950 sm:text-3xl"
        >
          Understanding the UCAT
        </h2>
        <p className="mt-4">
          The University Clinical Aptitude Test (UCAT ANZ) is a key component
          of medical school admissions in Australia and New Zealand. It tests
          cognitive abilities and behaviours that universities have identified
          as important for success in clinical careers.
        </p>

        <h3 className="mt-8 text-lg font-semibold text-slate-950">
          UCAT subtests
        </h3>
        <div className="mt-4 space-y-4">
          {[
            {
              name: "Verbal Reasoning (VR)",
              desc: "Assesses your ability to critically evaluate written information. You'll read passages and answer questions that test comprehension, inference, and logic.",
              tip: "Practice speed-reading techniques and focus on identifying the author's argument quickly.",
            },
            {
              name: "Decision Making (DM)",
              desc: "Tests your ability to make sound judgements using complex information. Includes logic puzzles, Venn diagrams, probability, and syllogisms.",
              tip: "Learn to identify question types quickly. Each type has an optimal strategy — don't try to reason from scratch every time.",
            },
            {
              name: "Quantitative Reasoning (QR)",
              desc: "Evaluates your ability to solve numerical problems. Covers percentages, ratios, rates, and data interpretation.",
              tip: "Use the on-screen calculator efficiently. Practice mental maths for simple calculations to save time.",
            },
            {
              name: "Abstract Reasoning (AR)",
              desc: "Measures your ability to identify patterns in abstract shapes and sequences. Tests spatial and pattern recognition skills.",
              tip: "Develop a systematic checklist for patterns: shape, size, colour, position, rotation, number. Apply it consistently.",
            },
            {
              name: "Situational Judgement (SJ)",
              desc: "Assesses your ability to understand real-world situations and identify appropriate responses. Scored separately as Band 1–4.",
              tip: "Think from a professional and ethical perspective. Patient safety, honesty, and teamwork are key principles.",
            },
          ].map((subtest) => (
            <div
              key={subtest.name}
              className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
            >
              <h4 className="font-semibold text-slate-950">{subtest.name}</h4>
              <p className="mt-2 text-sm leading-relaxed">{subtest.desc}</p>
              <p className="mt-2 text-sm">
                <span className="font-medium text-blue-600">Strategy: </span>
                {subtest.tip}
              </p>
            </div>
          ))}
        </div>

        <h3 className="mt-8 text-lg font-semibold text-slate-950">
          Preparation timeline
        </h3>
        <p className="mt-3">
          Most successful candidates begin UCAT preparation 3–6 months before
          the test (which is usually held in July). Starting in February or
          March of Year 12 gives you enough time to learn strategies, complete
          practice questions, and sit multiple full-length mock exams.
        </p>
        <p className="mt-3">
          Earlier exposure in Year 11 (even just familiarising yourself with
          the format) can be beneficial, but intensive preparation is most
          effective closer to the test date when motivation is highest.
        </p>

        {/* Interview Preparation */}
        <h2
          id="interview-preparation"
          className="mt-16 text-2xl font-semibold text-slate-950 sm:text-3xl"
        >
          Interview Preparation
        </h2>
        <p className="mt-4">
          Most Australian medical schools use the Multiple Mini Interview (MMI)
          format. This consists of a series of short stations (typically 7–10),
          each lasting 5–8 minutes, where you respond to different scenarios.
        </p>

        <h3 className="mt-8 text-lg font-semibold text-slate-950">
          Common MMI scenario types
        </h3>
        <ul className="mt-4 space-y-3">
          {[
            "Ethical dilemmas — balancing competing values (e.g. patient autonomy vs. safety)",
            "Role-plays — communicating difficult news, dealing with a frustrated patient or colleague",
            "Motivation and self-reflection — why medicine, what experiences shaped your decision",
            "Critical thinking — analysing a health policy issue or interpreting data",
            "Teamwork scenarios — collaborative tasks that assess communication and leadership",
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <h3 className="mt-8 text-lg font-semibold text-slate-950">
          How to practise
        </h3>
        <p className="mt-3">
          The most effective interview preparation involves practising with
          someone who has been through the process. Mock interviews with timed
          stations and structured feedback help you develop fluency, manage
          nerves, and learn to structure your responses.
        </p>
        <p className="mt-3">
          Record yourself answering practice questions, review your responses,
          and focus on being structured, genuine, and empathetic. Avoid
          memorising scripted answers — interviewers can tell.
        </p>

        {/* Subject Selection */}
        <h2
          id="subject-selection"
          className="mt-16 text-2xl font-semibold text-slate-950 sm:text-3xl"
        >
          Subject Selection
        </h2>
        <p className="mt-4">
          While most Australian medical schools don&apos;t mandate specific
          Year 12 subjects, your subject choices can significantly impact your
          ATAR and your preparation for the demands of a medical degree.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            {
              subject: "Chemistry",
              advice:
                "Strongly recommended. Fundamental to pharmacology and biochemistry in medical school. Also scales well for ATAR.",
            },
            {
              subject: "Biology",
              advice:
                "Highly useful but not always required. Gives you a head start in anatomy and physiology. Some universities list it as assumed knowledge.",
            },
            {
              subject: "Mathematics (Methods or Specialist)",
              advice:
                "Good ATAR scaling and develops the quantitative reasoning skills tested in UCAT. Specialist Maths scales particularly well.",
            },
            {
              subject: "English",
              advice:
                "Compulsory for SACE. Strong written communication skills are essential for medicine — don't neglect it.",
            },
          ].map((item) => (
            <div
              key={item.subject}
              className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
            >
              <h3 className="font-semibold text-slate-950">{item.subject}</h3>
              <p className="mt-2 text-sm leading-relaxed">{item.advice}</p>
            </div>
          ))}
        </div>

        <p className="mt-6">
          Choose subjects you can excel in. A high ATAR from subjects you enjoy
          will always outperform mediocre results in subjects you think
          &quot;look good&quot; on paper. Scaling matters, but so does your
          engagement with the content.
        </p>

        {/* CTA: Academic Tutoring */}
        <ArticleCTA
          variant="academic"
          title="Want to maximise your ATAR?"
          description="Our tutors are all top 1% ATAR achievers who know exactly what it takes to score highly in SACE. Get matched with a tutor for your specific subjects."
          buttonText="Find a tutor"
        />

        {/* Year-by-Year Timeline */}
        <h2
          id="year-by-year-timeline"
          className="mt-16 text-2xl font-semibold text-slate-950 sm:text-3xl"
        >
          Year-by-Year Timeline
        </h2>

        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">
              Year 10 — Build your foundation
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                <span>
                  Choose strong Year 11 subjects — prioritise Chemistry, Maths
                  Methods or Specialist, and Biology if available
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                <span>
                  Develop strong study habits and time management skills
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                <span>
                  Start volunteering or gaining experiences that demonstrate
                  empathy and community involvement
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                <span>
                  Research medical schools and their entry requirements
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">
              Year 11 — Start preparing strategically
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                <span>
                  Focus on strong academic performance — Year 11 results matter
                  for your ATAR
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                <span>
                  Familiarise yourself with the UCAT format — try a free
                  practice test to understand what&apos;s involved
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                <span>
                  Complete your Research Project early if possible to free up
                  Year 12 capacity
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                <span>
                  Attend university open days and speak to current medical
                  students
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">
              Year 12 — Execute your plan
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                <span>
                  <strong>Feb–Mar:</strong> Begin intensive UCAT preparation
                  (3–5 sessions per week)
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                <span>
                  <strong>Apr–Jun:</strong> Peak UCAT prep — timed mock tests,
                  strategy refinement
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                <span>
                  <strong>July:</strong> Sit the UCAT exam
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                <span>
                  <strong>Aug–Sep:</strong> Submit university preferences via
                  SATAC/UAC. Continue strong academic performance
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                <span>
                  <strong>Oct–Nov:</strong> Final exams + interview preparation
                  if shortlisted
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                <span>
                  <strong>Dec–Jan:</strong> Receive ATAR results and offers
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Common Mistakes */}
        <h2
          id="common-mistakes"
          className="mt-16 text-2xl font-semibold text-slate-950 sm:text-3xl"
        >
          Common Mistakes to Avoid
        </h2>

        <div className="mt-6 space-y-4">
          {[
            {
              mistake: "Starting UCAT preparation too late",
              fix: "Begin at least 3–4 months before the exam. Last-minute cramming doesn't work for the UCAT — it tests aptitude and strategy, not memorisation.",
            },
            {
              mistake: "Neglecting interview preparation",
              fix: "Many students focus entirely on ATAR and UCAT, then underperform at interview. Start practising structured responses and mock interviews well before your interview date.",
            },
            {
              mistake: "Not having a backup plan",
              fix: "Medicine is extremely competitive. Apply to multiple universities and have a Plan B (e.g. Biomedical Science with graduate-entry medicine as a pathway).",
            },
            {
              mistake: "Choosing subjects purely for scaling",
              fix: "High-scaling subjects only help if you can do well in them. Choose subjects where you can realistically achieve top grades.",
            },
            {
              mistake: "Ignoring the Situational Judgement section",
              fix: "SJ doesn't count toward the main UCAT score, but universities use it as a filter. A Band 4 can disqualify you regardless of other scores.",
            },
            {
              mistake: "Not seeking help early enough",
              fix: "If you're struggling in a subject, get support before gaps compound. A tutor can help you course-correct before it impacts your ATAR.",
            },
          ].map((item) => (
            <div
              key={item.mistake}
              className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
            >
              <h3 className="font-semibold text-red-600">{item.mistake}</h3>
              <p className="mt-2 text-sm leading-relaxed">{item.fix}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2
          id="faq"
          className="mt-16 text-2xl font-semibold text-slate-950 sm:text-3xl"
        >
          Frequently Asked Questions
        </h2>

        <div className="mt-6 space-y-4">
          {[
            {
              q: "What ATAR do I need for medicine?",
              a: "There's no fixed cut-off, but successful applicants to Adelaide and Flinders typically have ATARs above 99. Interstate options may accept slightly lower ATARs depending on UCAT performance and interview scores.",
            },
            {
              q: "Can I get into medicine without doing the UCAT?",
              a: "Some universities don't require the UCAT — Western Sydney and Bond are notable examples. However, most Australian medical schools require it, so sitting the UCAT keeps the most options open.",
            },
            {
              q: "Is it better to do medicine as an undergraduate or graduate?",
              a: "Both pathways lead to the same outcome — a qualified doctor. Undergraduate entry lets you start sooner, while graduate entry gives you more time to mature and build a broader academic foundation. Many students who miss undergraduate entry successfully enter via graduate pathways.",
            },
            {
              q: "How important is the interview compared to ATAR and UCAT?",
              a: "Very important. At some universities, the interview carries equal or greater weight than your academic scores. It's the component where you can differentiate yourself most from other high-achieving applicants.",
            },
            {
              q: "Should I do Biology in Year 12?",
              a: "It's helpful but not required. Biology gives you a head start in first-year anatomy and physiology. However, if you perform better in other subjects, prioritise your ATAR over having Biology on your transcript.",
            },
            {
              q: "What if I don't get in the first time?",
              a: "Many successful doctors didn't get in on their first attempt. Gap year options include improving your GPA through a related degree (e.g. Biomedical Science), retaking the UCAT, or applying for graduate-entry programs. Persistence is key.",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-slate-200/70 bg-white shadow-sm"
            >
              <summary className="cursor-pointer px-6 py-5 text-base font-semibold text-slate-950">
                {item.q}
              </summary>
              <p className="px-6 pb-5 text-sm text-slate-600">{item.a}</p>
            </details>
          ))}
        </div>

        {/* Final CTA */}
        <ArticleCTA
          variant="general"
          title="Ready to start your medicine journey?"
          description="Whether you need UCAT preparation, ATAR tutoring, or interview coaching, our team of medical students and top ATAR achievers can help you get there. Tell us your goals and we'll match you with the right tutor."
          buttonText="Get started"
        />
      </article>

      {/* Sticky TOC sidebar */}
      <aside className="hidden w-64 flex-shrink-0 lg:block">
        <nav className="sticky top-24">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            On this page
          </p>
          <ul className="mt-4 space-y-2 border-l border-slate-200">
            {TOC_ITEMS.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={`block border-l-2 py-1 pl-4 text-sm transition-colors ${
                    activeId === item.id
                      ? "border-blue-500 font-medium text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  );
}
