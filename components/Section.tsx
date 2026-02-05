import MotionInView from "./MotionInView";

type SectionProps = {
  id?: string;
  anchorId?: string;
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export default function Section({
  id,
  anchorId,
  eyebrow,
  title,
  subtitle,
  children,
  className,
}: SectionProps) {
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
            <p className="text-xs uppercase tracking-[0.3em] text-blue-500">
              {eyebrow}
            </p>
          )}
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-base text-slate-600 sm:text-lg">
              {subtitle}
            </p>
          )}
        </MotionInView>
        {children ? <div className="mt-10">{children}</div> : null}
      </div>
    </section>
  );
}
