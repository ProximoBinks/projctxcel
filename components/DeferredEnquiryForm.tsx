"use client";

import { lazy, Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { whenIdle } from "../lib/whenIdle";

const loadEnquiryForm = () => import("./EnquiryForm");
const EnquiryForm = lazy(loadEnquiryForm);

const subscribeAvailability = () => () => {};
const lacksObserver = () => !("IntersectionObserver" in window);
const serverObserver = () => false;

export default function DeferredEnquiryForm() {
  const noObserver = useSyncExternalStore(subscribeAvailability, lacksObserver, serverObserver);
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Fetch the form's code (~280KB with its dependencies) once the page is idle.
  // Otherwise the first "Enquire now" glide downloads and parses it mid-scroll
  // and stutters. Rendering still waits until the form is near the viewport.
  useEffect(() => whenIdle(() => void loadEnquiryForm()), []);

  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) {
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
      {ready || noObserver ? (
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
