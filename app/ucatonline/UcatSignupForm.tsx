"use client";

import { FormEvent, useState } from "react";
import Confetti from "../../components/Confetti";

type ClassType = "group" | "1on1" | "both";

type FormState = {
  yearLevel: "Year 11" | "Year 12" | "Year 13" | "";
  classType: ClassType | "";
  withFriend: boolean;
  friendName: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
  company: string;
};

const initialState: FormState = {
  yearLevel: "",
  classType: "",
  withFriend: false,
  friendName: "",
  name: "",
  email: "",
  phone: "",
  message: "",
  consent: false,
  company: "",
};

const CLASS_TYPE_OPTIONS: { value: ClassType; label: string; sub: string }[] = [
  { value: "group", label: "Group class", sub: "Small cohort · Sunday sessions" },
  { value: "1on1", label: "1-on-1 tutoring", sub: "Personalised · Flexible scheduling" },
  { value: "both", label: "Both", sub: "Group class & 1-on-1 support" },
];

export default function UcatSignupForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.yearLevel || !form.classType) {
      setError("Please select your year level and preferred class type.");
      return;
    }
    if (!form.name || !form.email || !form.phone || !form.consent) {
      setError("Please fill in all required fields and accept the privacy policy.");
      return;
    }
    if (form.withFriend && !form.friendName.trim()) {
      setError("Please enter your friend's name.");
      return;
    }

    if (form.company) {
      setStatus("success");
      return;
    }

    const classTypeLabel =
      form.classType === "group"
        ? "Group class"
        : form.classType === "1on1"
        ? "1-on-1 tutoring"
        : "Both (group class & 1-on-1)";

    const interests = [
      `Class type: ${classTypeLabel}`,
      form.withFriend
        ? `Signing up with a friend: Yes (${form.friendName.trim()})`
        : "Signing up with a friend: No",
    ].join("\n");

    setStatus("loading");
    try {
      const payload = new FormData();
      payload.append("type", "student");
      payload.append("name", form.name);
      payload.append("email", form.email);
      payload.append("phone", form.phone);
      payload.append("yearLevel", form.yearLevel);
      payload.append("subjects", "UCAT");
      payload.append("interests", interests);
      payload.append("message", form.message);
      payload.append("targetAtar", "");
      payload.append("plannedCourse", "Medicine");
      payload.append("consent", "true");
      payload.append(
        "sourcePage",
        typeof window !== "undefined" ? window.location.pathname : "/programs/ucat/signup"
      );
      payload.append("utm", JSON.stringify({}));
      payload.append("company", form.company);

      const response = await fetch("/api/enquiry", { method: "POST", body: payload });
      if (!response.ok) throw new Error("Failed to submit.");
      setStatus("success");
      setForm(initialState);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError("Something went wrong. Please try again or contact us directly.");
    }
  };

  if (status === "success") {
    return (
      <>
        <Confetti options={{ particleCount: 160, spread: 70, origin: { x: 0.5, y: 0.5 } }} />
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <p className="text-2xl font-semibold text-emerald-800">You&apos;re signed up!</p>
          <p className="mt-3 text-sm text-emerald-700">
            Thanks for registering for the Meducate UCAT Program. We&apos;ll be in touch within
            1 business day to confirm your spot and share next steps.
          </p>
        </div>
      </>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {/* Year Level */}
      <div className="grid gap-3">
        <p className="text-sm font-semibold text-slate-900">What year are you in?</p>
        <div className="grid grid-cols-3 gap-3">
          {(["Year 11", "Year 12", "Year 13"] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, yearLevel: level }))}
              className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                form.yearLevel === level
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-700 hover:border-blue-200"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Class Type */}
      <div className="grid gap-3">
        <p className="text-sm font-semibold text-slate-900">What are you interested in?</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {CLASS_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, classType: opt.value }))}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                form.classType === opt.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 hover:border-blue-200"
              }`}
            >
              <span
                className={`block text-sm font-semibold ${
                  form.classType === opt.value ? "text-blue-700" : "text-slate-800"
                }`}
              >
                {opt.label}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">{opt.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Signing up with a friend */}
      <div className="grid gap-3">
        <p className="text-sm font-semibold text-slate-900">Signing up with a friend?</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: true, label: "Yes" },
            { value: false, label: "No" },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, withFriend: opt.value, friendName: "" }))
              }
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                form.withFriend === opt.value
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-700 hover:border-blue-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {form.withFriend && (
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Your friend&apos;s name
            <input
              className="input"
              placeholder="e.g. John Smith"
              value={form.friendName}
              onChange={(e) => setForm((prev) => ({ ...prev, friendName: e.target.value }))}
            />
          </label>
        )}
      </div>

      {/* Contact details */}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Full name
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Email address
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Phone number
          <input
            className="input"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            required
          />
        </label>
      </div>

      {/* Optional message */}
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        <span>Anything else you&apos;d like us to know? <span className="font-normal text-slate-400">(optional)</span></span>
        <textarea
          className="input min-h-[100px] resize-y"
          value={form.message}
          onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
        />
      </label>

      {/* Consent */}
      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => setForm((prev) => ({ ...prev, consent: e.target.checked }))}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
          required
        />
        <span>
        I agree to be contacted about tutoring services and occasional updates and promotions.
         {" "}
          <a href="/privacy" target="_blank" className="font-semibold text-blue-600">
            Privacy Policy
          </a>
          .
        </span>
      </label>

      {/* Honeypot */}
      <label className="hidden">
        Company
        <input
          value={form.company}
          onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
          tabIndex={-1}
          autoComplete="off"
        />
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="btn btn-lg w-full justify-center rounded-full"
      >
        {status === "loading" ? "Submitting…" : "Sign me up"}
      </button>
    </form>
  );
}
