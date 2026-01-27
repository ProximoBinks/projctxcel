import Link from "next/link";
import EnquiryForm from "../../components/EnquiryForm";

export default function EnquirePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5 sm:px-10">
          <Link href="/" className="text-lg font-semibold text-slate-950">
            projctxcel
          </Link>
          <Link href="/#tutors" className="text-sm font-semibold text-slate-600">
            Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-16 sm:px-10">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">
            Enquire
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Tell us how we can help
          </h1>
          <p className="mt-4 text-sm text-slate-600 sm:text-base">
            Complete the form below and we will be in touch shortly.
          </p>
        </div>
        <EnquiryForm />
      </main>
    </div>
  );
}
