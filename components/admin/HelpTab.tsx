"use client";


export function HelpTab() {
  const faqs: { q: string; a: React.ReactNode }[] = [
    {
      q: "How do I pause auto-charging for a student?",
      a: (
        <>
          Go to <strong>Billing → Profiles</strong>, find the student, and click{" "}
          <strong>Pause</strong> in their row. They won&apos;t be auto-charged until
          you click <strong>Unpause</strong>. You can still charge them manually
          while paused (see below).
        </>
      ),
    },
    {
      q: "A student needs a refund — what should I do?",
      a: (
        <>
          Prefer <strong>account credit</strong> or a <strong>bank transfer</strong>{" "}
          over a Stripe refund — frequent Stripe refunds can get the account
          flagged. In <strong>Billing → Profiles</strong>, click{" "}
          <strong>Credit</strong> on the student&apos;s row and add the amount.
          Credit is automatically applied to their next charges.
        </>
      ),
    },
    {
      q: "How do I bill a student fortnightly (or every few weeks)?",
      a: (
        <>
          Open the student in <strong>Students</strong>, click{" "}
          <strong>Manage Classes</strong>, and for the relevant class set{" "}
          <strong>Billing</strong> to <em>Fortnightly</em> / <em>Every 3 weeks</em> /
          etc. and pick the <strong>start date</strong> (the first week they should
          be charged). They&apos;ll then be auto-charged only on those weeks.
        </>
      ),
    },
    {
      q: "How do I charge a one-off amount (e.g. a single make-up class)?",
      a: (
        <>
          In <strong>Billing → Profiles</strong>, click <strong>Charge</strong> on
          the student&apos;s row (only available if they have a card on file), enter
          the amount and a description, and confirm. This charges their card
          immediately via Stripe.
        </>
      ),
    },
    {
      q: "When exactly are customers charged?",
      a: (
        <>
          After you approve completed lessons in <strong>Billing → Daily review</strong>, at <strong>7pm Adelaide time</strong>.
          Each student is charged only for approved classes <em>that day</em>
          (respecting any pause or fortnightly cadence). Unapproved lessons stay on hold; late approvals require a separate charge action. See the forecast under <strong>Billing → Payment Schedule</strong>.
        </>
      ),
    },
    {
      q: "How can I see what Stripe will charge, and when?",
      a: (
        <>
          <strong>Billing → Payment Schedule</strong> forecasts upcoming charges
          for the next 4 weeks, grouped by date, showing the net amount (after
          credit) and whether it&apos;s a card (Stripe) or cash collection. Forecasts are estimates; daily approval determines what is actually charged.
        </>
      ),
    },
    {
      q: "What's the difference between Pause and a per-class pause request?",
      a: (
        <>
          <strong>Pause</strong> (on the billing row) stops <em>all</em>{" "}
          auto-charging for that student. A <strong>pause request</strong> (under
          Billing → Pause Requests) is for a single class over a date range — e.g.
          a student away for a few weeks — and only that class is skipped.
        </>
      ),
    },
    {
      q: "A student pays cash — how does that work?",
      a: (
        <>
          Switch their payment type to <strong>Cash</strong> in the billing row.
          Their charges are still recorded (so you can track what&apos;s owed) but
          marked as cash to collect manually — no card is charged.
        </>
      ),
    },
    {
      q: "A charge failed — what should I do?",
      a: (
        <>
          Open <strong>Billing → History</strong>, filter by <em>failed</em>, and
          use <strong>Retry</strong> on the student to attempt the card again. If it
          keeps failing, the card may have expired — ask them to re-add it from
          their student dashboard.
        </>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Help &amp; FAQs</h2>
        <p className="mt-1 text-sm text-slate-500">
          Common billing and admin questions. Click a question to expand.
        </p>
      </div>
      {faqs.map((faq, i) => (
        <details
          key={i}
          className="group rounded-2xl border border-slate-200 bg-white px-5 py-4"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-slate-900">
            {faq.q}
            <span className="ml-3 text-slate-400 transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</div>
        </details>
      ))}
    </div>
  );
}
