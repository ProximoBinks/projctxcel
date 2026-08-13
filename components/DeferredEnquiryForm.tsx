"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";

const EnquiryForm = lazy(() => import("./EnquiryForm"));

export default function DeferredEnquiryForm() {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) {
      setReady(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setReady(true);
        observer.disconnect();
      },
      { rootMargin: "700px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="min-h-48">
      {ready ? (
        <Suspense fallback={<FormSkeleton />}>
          <EnquiryForm />
        </Suspense>
      ) : (
        <FormSkeleton />
      )}
    </div>
  );
}

function FormSkeleton() {
  return (
    <div
      className="min-h-48 rounded-3xl border border-slate-200 bg-white shadow-sm"
      aria-hidden="true"
    />
  );
}
