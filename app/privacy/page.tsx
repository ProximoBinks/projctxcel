import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5 sm:px-10">
          <Link href="/" className="text-lg font-semibold text-slate-950">
            Simple Tuition
          </Link>
          <Link href="/#enquire" className="text-sm font-semibold text-slate-600">
            Enquire
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-10">
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">
          Privacy
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-slate-600">
          This Privacy Policy explains how Simple Tuition collects, uses, and
          protects personal information provided through our website.
        </p>

        <section className="mt-10 space-y-6 text-sm text-slate-600">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Information we collect
            </h2>
            <p className="mt-2">
              When you submit an enquiry, we collect contact details and any
              information you provide about tutoring needs or tutor
              applications. We may also collect basic analytics data such as
              UTM parameters.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              How we use information
            </h2>
            <p className="mt-2">
              We use this information to respond to enquiries, match students
              with tutors, assess tutor applications, and communicate about our
              services. We only contact you with consent where required.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              CVs and attachments
            </h2>
            <p className="mt-2">
              Tutor applications may include CV attachments. These are sent to
              our inbox and used solely for assessment purposes.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Data storage and sharing
            </h2>
            <p className="mt-2">
              We store enquiry records securely and do not sell or share your
              personal information with third parties, except for service
              providers that help us run the website and deliver emails.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Your rights
            </h2>
            <p className="mt-2">
              You may request access to, correction of, or deletion of your
              personal information. Contact us to make a request.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Contact
            </h2>
            <p className="mt-2">
              For privacy questions, email us at{" "}
              <a
                href="mailto:support@hyperstake.bet"
                className="font-semibold text-indigo-600"
              >
                simpletuitionau@gmail.com
              </a>
              .
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
