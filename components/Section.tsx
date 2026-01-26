import MotionInView from "./MotionInView";

type SectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
};

export default function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className,
}: SectionProps) {
  return (
    <section id={id} className={`py-16 sm:py-24 ${className ?? ""}`}>
      <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
        <MotionInView>
          <div className="max-w-3xl">
            {eyebrow && (
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">
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
          </div>
        </MotionInView>
        {children ? <div className="mt-10">{children}</div> : null}
      </div>
    </section>
  );
}
