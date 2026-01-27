import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5 sm:px-10">
          <Link href="/" className="text-lg font-semibold text-slate-950">
            projctxcel
          </Link>
          <Link href="/#enquire" className="text-sm font-semibold text-slate-600">
            Enquire
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-10">
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">
          Terms
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-slate-600">
          These Terms of Service outline the conditions for using the
          projctxcel website and services.
        </p>

        <section className="mt-10 space-y-6 text-sm text-slate-600">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Services
            </h2>
            <p className="mt-2">
              projctxcel provides tutoring introductions and coordination.
              Tutors operate independently and manage their own session
              logistics.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Enquiries and matching
            </h2>
            <p className="mt-2">
              We use the details you provide to recommend suitable tutors. We
              do not guarantee availability or outcomes, but we aim to make the
              best match possible.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Payments and pricing
            </h2>
            <p className="mt-2">
              Pricing varies by tutor experience and subject. Fees, scheduling,
              and cancellations are agreed directly between you and the tutor.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Tutor applicants
            </h2>
            <p className="mt-2">
              Applications are assessed on merit and fit. We may request
              additional information during the review process.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Liability
            </h2>
            <p className="mt-2">
              We make reasonable efforts to match families with tutors but are
              not liable for outcomes, availability, or actions taken by
              independent tutors.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Contact
            </h2>
            <p className="mt-2">
              For questions about these terms, contact{" "}
              <a
                href="mailto:support@hyperstake.bet"
                className="font-semibold text-indigo-600"
              >
                support@hyperstake.bet
              </a>
              .
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
