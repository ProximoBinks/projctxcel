import Link from "next/link";

type BlogCardProps = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  category: string;
};

export default function BlogCard({
  slug,
  title,
  excerpt,
  date,
  readingTime,
  category,
}: BlogCardProps) {
  return (
    <Link
      href={`/guides/${slug}`}
      className="group rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm transition hover:shadow-md"
    >
      <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
        {category}
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-950 group-hover:text-blue-600 transition-colors">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-3">
        {excerpt}
      </p>
      <p className="mt-4 text-xs text-slate-400">
        {date} &middot; {readingTime}
      </p>
    </Link>
  );
}
