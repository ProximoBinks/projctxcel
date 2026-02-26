import Link from "next/link";

const VARIANTS = {
  ucat: {
    bg: "bg-pink-50 border-pink-200/70",
    badge: "bg-pink-100 text-pink-700",
    btn: "bg-pink-600 hover:bg-pink-700 text-white",
  },
  academic: {
    bg: "bg-blue-50 border-blue-200/70",
    badge: "bg-blue-100 text-blue-700",
    btn: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  general: {
    bg: "bg-amber-50 border-amber-200/70",
    badge: "bg-amber-100 text-amber-700",
    btn: "bg-amber-600 hover:bg-amber-700 text-white",
  },
} as const;

type ArticleCTAProps = {
  variant: keyof typeof VARIANTS;
  title: string;
  description: string;
  buttonText?: string;
};

export default function ArticleCTA({
  variant,
  title,
  description,
  buttonText = "Enquire now",
}: ArticleCTAProps) {
  const v = VARIANTS[variant];
  return (
    <div className={`my-10 rounded-2xl border p-6 sm:p-8 ${v.bg}`}>
      <p className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${v.badge}`}>
        Simple Tuition
      </p>
      <h3 className="mt-3 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
      <Link
        href="/enquire"
        className={`mt-4 inline-block rounded-full px-5 py-2.5 text-sm font-semibold transition ${v.btn}`}
      >
        {buttonText}
      </Link>
    </div>
  );
}
