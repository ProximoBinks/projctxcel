"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "../i18n/LanguageContext";
import Confetti from "./Confetti";

type FormState = {
  type: "student" | "tutor" | "general";
  targetAtar: string;
  plannedCourse: string;
  interests: string;
  experience: string;
  expertise: string;
  cvFile: File | null;
  name: string;
  email: string;
  phone: string;
  yearLevel: string;
  subjects: string;
  message: string;
  consent: boolean;
  company: string;
};

const initialState: FormState = {
  type: "student",
  targetAtar: "",
  plannedCourse: "",
  interests: "",
  experience: "",
  expertise: "",
  cvFile: null,
  name: "",
  email: "",
  phone: "",
  yearLevel: "",
  subjects: "",
  message: "",
  consent: false,
  company: "",
};

export default function EnquiryForm() {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const yearLevels = useMemo(
    () => [
      "Reception",
      "Year 1",
      "Year 2",
      "Year 3",
      "Year 4",
      "Year 5",
      "Year 6",
      "Year 7",
      "Year 8",
      "Year 9",
      "Year 10",
      "Year 11",
      "Year 12",
    ],
    []
  );
  const confettiOptions = useMemo(
    () => ({
      particleCount: 160,
      spread: 70,
      origin: { x: 0.5, y: 0.5 },
    }),
    []
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.name || !form.email || !form.phone || !form.consent) {
      setError(t("form.errorRequired"));
      return;
    }

    if (form.type === "student") {
      if (!form.yearLevel || !form.subjects || !form.interests) {
        setError(t("form.errorStudent"));
        return;
      }
    }

    if (form.type === "tutor") {
      if (!form.experience || !form.expertise) {
        setError(t("form.errorTutor"));
        return;
      }
    }

    const utm = {
      source: searchParams.get("utm_source") || undefined,
      medium: searchParams.get("utm_medium") || undefined,
      campaign: searchParams.get("utm_campaign") || undefined,
      term: searchParams.get("utm_term") || undefined,
      content: searchParams.get("utm_content") || undefined,
    };

    const sourcePage =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : undefined;

    if (form.company) {
      setStatus("success");
      return;
    }

    setStatus("loading");
    try {
      const payload = new FormData();
      payload.append("type", form.type);
      payload.append("name", form.name);
      payload.append("email", form.email);
      payload.append("phone", form.phone);
      payload.append("yearLevel", form.yearLevel);
      payload.append("subjects", form.subjects);
      payload.append("message", form.message);
      payload.append("targetAtar", form.targetAtar);
      payload.append("plannedCourse", form.plannedCourse);
      payload.append("interests", form.interests);
      payload.append("experience", form.experience);
      payload.append("expertise", form.expertise);
      payload.append("consent", form.consent ? "true" : "false");
      payload.append("sourcePage", sourcePage ?? "");
      payload.append("utm", JSON.stringify(utm));
      payload.append("company", form.company);
      if (form.cvFile) {
        payload.append("cv", form.cvFile);
      }

      const response = await fetch("/api/enquiry", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        throw new Error("Failed to send enquiry.");
      }

      setStatus("success");
      setForm(initialState);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(t("form.errorGeneric"));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {status === "success" ? <Confetti options={confettiOptions} /> : null}
      <div className="grid gap-3">
        <p className="text-sm font-semibold text-slate-900">
          {t("form.howCanWeHelp")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { value: "student", label: t("form.typeStudent") },
            { value: "tutor", label: t("form.typeTutor") },
            { value: "general", label: t("form.typeGeneral") },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  type: option.value as FormState["type"],
                }))
              }
              className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                form.type === option.value
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 text-slate-700 hover:border-indigo-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {form.type === "student" ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              {t("form.yearLevel")}
              <select
                className="input bg-white"
                value={form.yearLevel}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, yearLevel: event.target.value }))
                }
                required
              >
                <option value="">{t("form.selectYearLevel")}</option>
                {yearLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              {t("form.targetAtar")}
              <select
                className="input bg-white"
                value={form.targetAtar}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    targetAtar: event.target.value,
                  }))
                }
              >
                <option value="">{t("form.selectTargetRange")}</option>
                {[
                  "70-89",
                  "90-98",
                  "99+",
                ].map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
                <option value="As high as possible">{t("form.asHighAsPossible")}</option>
              </select>
            </label>
          </div>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            {t("form.subjectsLabel")}
            <input
              className="input"
              value={form.subjects}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, subjects: event.target.value }))
              }
              placeholder={t("form.subjectsPlaceholder")}
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            {t("form.goalCourse")}
            <input
              className="input"
              value={form.plannedCourse}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  plannedCourse: event.target.value,
                }))
              }
              placeholder={t("form.goalCoursePlaceholder")}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            {t("form.interests")}
            <textarea
              className="input min-h-[120px] resize-y"
              value={form.interests}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, interests: event.target.value }))
              }
              required
            />
          </label>
        </>
      ) : null}

      {form.type === "tutor" ? (
        <>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            {t("form.experience")}
            <textarea
              className="input min-h-[140px] resize-y"
              value={form.experience}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, experience: event.target.value }))
              }
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            {t("form.expertise")}
            <input
              className="input"
              value={form.expertise}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, expertise: event.target.value }))
              }
              placeholder={t("form.expertisePlaceholder")}
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            {t("form.cvUpload")}
            <input
              type="file"
              accept=".pdf,.docx"
              className="input file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  cvFile: event.target.files?.[0] ?? null,
                }))
              }
            />
          </label>
        </>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          {t("form.fullName")}
          <input
            className="input"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          {t("form.email")}
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          {t("form.phone")}
          <input
            className="input"
            value={form.phone}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, phone: event.target.value }))
            }
            required
          />
        </label>
        <div className="hidden sm:block" aria-hidden="true" />
      </div>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        <span className="flex flex-wrap items-center gap-2">
          <span>{t("form.message")}</span>
          {form.type !== "general" ? (
            <span className="font-semibold text-indigo-600">
              {t("form.messageHighlight")}
            </span>
          ) : null}
        </span>
        <textarea
          className="input min-h-[140px] resize-y"
          value={form.message}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, message: event.target.value }))
          }
          required
        />
      </label>

      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, consent: event.target.checked }))
          }
          className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-200"
          required
        />
        <span>
          {t("form.consent")}{" "}
          <a href="/privacy" target="_blank" className="font-semibold text-indigo-600">
            {t("form.privacyPolicy")}
          </a>
        </span>
      </label>

      <label className="hidden">
        Company
        <input
          value={form.company}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, company: event.target.value }))
          }
          tabIndex={-1}
          autoComplete="off"
        />
      </label>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {status === "success" ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {t("form.success")}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "loading"}
        className="btn btn-lg w-full justify-center rounded-full"
      >
        {status === "loading" ? t("form.sending") : t("form.submit")}
      </button>
    </form>
  );
}
