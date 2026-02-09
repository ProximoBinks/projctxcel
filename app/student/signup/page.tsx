"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function StudentSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || "";

  const [code, setCode] = useState(initialCode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"code" | "details">(initialCode ? "details" : "code");

  const verifyCode = useQuery(
    api.studentDashboard.verifyInviteCode,
    step === "details" && code ? { code: code.toUpperCase() } : "skip"
  );
  const signup = useMutation(api.studentDashboard.signupWithCode);

  useEffect(() => {
    if (verifyCode && !verifyCode.valid && step === "details") {
      setError(verifyCode.error || "Invalid invite code");
      setStep("code");
    }
  }, [verifyCode, step]);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter your invite code");
      return;
    }
    setError("");
    setStep("details");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const result = await signup({
        code: code.toUpperCase(),
        email,
        password,
      });

      if (result.success) {
        router.push("/student/login?registered=true");
      } else {
        setError(result.error || "Failed to create account");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <Link href="/">
              <img
                src="/images/simple-text-black.svg"
                alt="Simple Tuition"
                className="mx-auto h-[50px]"
              />
            </Link>
            <h1 className="mt-4 text-2xl font-semibold text-slate-900">
              Create Student Account
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {step === "code"
                ? "Enter your invite code to get started"
                : `Welcome, ${verifyCode?.studentName || "Student"}!`}
            </p>
          </div>

          {step === "code" ? (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Invite Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg font-mono tracking-widest focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="XXXXXXXX"
                  maxLength={8}
                  required
                />
                <p className="mt-2 text-xs text-slate-500">
                  Your tutor or admin will provide you with an invite code
                </p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Continue
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">Invite code</p>
                <p className="font-mono text-sm font-semibold text-slate-900">
                  {code.toUpperCase()}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStep("code");
                    setError("");
                  }}
                  className="mt-1 text-xs text-blue-600 hover:underline"
                >
                  Change code
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-slate-500">
            <p>
              Already have an account?{" "}
              <Link href="/student/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
            <p className="mt-2">
              <Link href="/" className="text-blue-600 hover:underline">
                Back to website
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
