import type { Metadata } from "next";
import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export const metadata: Metadata = {
  title: "Enrollment confirmed",
  description:
    "Your place in the Simple Tuition Interview Crash Course is confirmed!",
  robots: { index: false, follow: false },
};

export default function InterviewSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <SuccessClient />
    </Suspense>
  );
}
