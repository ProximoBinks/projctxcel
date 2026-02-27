"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );
  const [errorMessage, setErrorMessage] = useState(
    token ? "" : "Missing verification token.",
  );

  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage(data.error || "Verification failed.");
        }
      } catch {
        setStatus("error");
        setErrorMessage("Something went wrong. Please try again.");
      }
    })();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 sm:px-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 text-center">
            <Link href="/">
              <img
                src="/images/simple-text-black.svg"
                alt="Simple Tuition"
                className="mx-auto h-10 sm:h-[50px]"
              />
            </Link>
          </div>

          {status === "loading" && (
            <div className="space-y-4 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="text-sm text-slate-600">Verifying your email...</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Email verified
              </h1>
              <p className="text-sm text-slate-600">
                Your account is now active. You can sign in to your student portal.
              </p>
              <Link
                href="/student/login"
                className="mt-2 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Sign in
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Verification failed
              </h1>
              <p className="text-sm text-slate-600">{errorMessage}</p>
              <Link
                href="/student/login"
                className="mt-2 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
