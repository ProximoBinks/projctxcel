import MotionInView from "./MotionInView";

type SectionProps = {
  id?: string;
  anchorId?: string;
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  /** "dark" inverts the heading colours for sections on a dark background. */
  tone?: "light" | "dark";
};

export default function Section({
  id,
  anchorId,
  eyebrow,
  title,
  subtitle,
  children,
  className,
  tone = "light",
}: SectionProps) {
  const dark = tone === "dark";
  return (
    <section
      id={id}
      className={`scroll-mt-24 py-16 sm:py-24 lg:py-28 ${className ?? ""}`}
    >
      <div className="mx-auto w-full max-w-[1200px] px-6 sm:px-10">
        {anchorId ? (
          <span
            id={anchorId}
            className="relative -top-6 block scroll-mt-24"
            aria-hidden="true"
          />
        ) : null}
        <MotionInView>
          {eyebrow && (
            <p
              className={`text-xs font-bold uppercase tracking-[0.3em] ${
                dark ? "text-blue-300" : "text-blue-500"
              }`}
            >
              {eyebrow}
            </p>
          )}
          <h2
            className={`mt-4 text-3xl font-semibold tracking-tight sm:text-4xl ${
              dark ? "text-white" : "text-slate-950"
            }`}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className={`mt-4 text-base sm:text-lg ${
                dark ? "text-blue-100/80" : "text-slate-600"
              }`}
            >
              {subtitle}
            </p>
          )}
        </MotionInView>
        {children ? <div className="mt-10">{children}</div> : null}
      </div>
    </section>
  );
}
