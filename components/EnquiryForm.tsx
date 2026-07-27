"use client";

import { FormEvent, KeyboardEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "../i18n/LanguageContext";
import { getSubjectStyle } from "../lib/subjectStyles";
import Confetti from "./Confetti";

type FormState = {
  type: "student" | "tutor";
  school: string;
  targetAtar: string;
  plannedCourse: string;
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
  school: "",
  targetAtar: "",
  plannedCourse: "",
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

type StepKey =
  | "type"
  | "details"
  | "subjects"
  | "experience"
  | "expertise"
  | "contact";

const stepsByType: Record<FormState["type"], StepKey[]> = {
  student: ["type", "details", "subjects", "contact"],
  tutor: ["type", "experience", "expertise", "contact"],
};

const stepTitleKeys: Record<Exclude<StepKey, "type">, string> = {
  details: "form.steps.studentDetails",
  subjects: "form.steps.studentSubjects",
  experience: "form.steps.tutorExperience",
  expertise: "form.steps.tutorExpertise",
  contact: "form.steps.contact",
};

const commonSubjects = [
  "Maths Methods",
  "Specialist Maths",
  "General Maths",
  "Chemistry",
  "Physics",
  "Biology",
  "English",
  "UCAT",
  "Interview Prep",
  "Accounting",
];

// Pills stay white until picked, then take on the subject's colour from the
// tutor cards. "Other" has no subject colour, so it falls back to the blue accent.
const subjectPillClass = (colorClass: string, selected: boolean) =>
  `inline-flex min-h-[44px] items-center rounded-full border px-4 text-sm font-medium transition ${
    selected
      ? colorClass
      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
  }`;

export default function EnquiryForm() {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selectedType, setSelectedType] = useState<FormState["type"] | null>(
    null
  );
  const [subjectTags, setSubjectTags] = useState<string[]>([]);
  const [otherOn, setOtherOn] = useState(false);
  const [otherSubject, setOtherSubject] = useState("");
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();

  const yearLevels = useMemo(
    () => [
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

  const steps = stepsByType[form.type];
  const stepKey = steps[stepIndex] ?? "type";
  const isLastStep = stepIndex === steps.length - 1;
  const stepLabel = t("form.stepLabel")
    .replace("{current}", String(stepIndex + 1))
    .replace("{total}", String(steps.length));

  const update = (patch: Partial<FormState>) => {
    setError(null);
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const composeSubjects = (tags: string[], other: boolean, otherText: string) =>
    [...tags, other ? otherText.trim() : ""].filter(Boolean).join(", ");

  const toggleSubject = (subject: string) => {
    const next = subjectTags.includes(subject)
      ? subjectTags.filter((item) => item !== subject)
      : [...subjectTags, subject];
    setSubjectTags(next);
    update({ subjects: composeSubjects(next, otherOn, otherSubject) });
  };

  const toggleOther = () => {
    const next = !otherOn;
    setOtherOn(next);
    update({ subjects: composeSubjects(subjectTags, next, otherSubject) });
  };

  const changeOtherSubject = (value: string) => {
    setOtherSubject(value);
    update({ subjects: composeSubjects(subjectTags, otherOn, value) });
  };

  const validateStep = (key: StepKey): string | null => {
    switch (key) {
      case "details":
        return form.yearLevel && form.school ? null : t("form.errorStep");
      case "subjects":
        return form.subjects ? null : t("form.errorStep");
      case "expertise":
        return form.expertise ? null : t("form.errorStep");
      default:
        return null;
    }
  };

  const selectType = (value: FormState["type"]) => {
    setError(null);
    setSelectedType(value);
    setForm((prev) => ({ ...prev, type: value }));
    setDirection(1);
    setStepIndex(1);
  };

  const goNext = () => {
    const stepError = validateStep(stepKey);
    if (stepError) {
      setError(stepError);
      return;
    }
    setError(null);
    setDirection(1);
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  };

  const goBack = () => {
    setError(null);
    setDirection(-1);
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Enter" || isLastStep || status === "success") return;
    const target = event.target as HTMLElement;
    if (target instanceof HTMLTextAreaElement) return;
    if (target instanceof HTMLButtonElement) return;
    if (target instanceof HTMLInputElement && target.type === "file") return;
    event.preventDefault();
    goNext();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.name || !form.email || !form.phone || !form.message || !form.consent) {
      setError(t("form.errorRequired"));
      return;
    }

    if (form.type === "student") {
      if (!form.yearLevel || !form.subjects) {
        setError(t("form.errorStudent"));
        return;
      }
    }

    if (form.type === "tutor") {
      if (!form.expertise) {
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
      payload.append("school", form.school);
      payload.append("targetAtar", form.targetAtar);
      payload.append("plannedCourse", form.plannedCourse);
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
      setSelectedType(null);
      setSubjectTags([]);
      setOtherOn(false);
      setOtherSubject("");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(t("form.errorGeneric"));
    }
  };

  const slideOffset = prefersReducedMotion ? 0 : 40;
  const stepVariants = {
    enter: (dir: number) => ({ x: dir * slideOffset, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -slideOffset, opacity: 0 }),
  };

  const renderStep = (key: StepKey) => {
    switch (key) {
      case "type":
        return (
          <div className="grid gap-5">
            <p className="text-xl font-semibold leading-tight text-slate-900 sm:text-2xl">
              {t("form.howCanWeHelp")}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { value: "student", label: t("form.typeStudent") },
                { value: "tutor", label: t("form.typeTutor") },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectType(option.value as FormState["type"])}
                  className={`min-h-[52px] rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                    selectedType === option.value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-700 hover:border-blue-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );
      case "details":
        return (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                {t("form.yearLevel")}
                <select
                  className="input bg-white"
                  value={form.yearLevel}
                  onChange={(event) => update({ yearLevel: event.target.value })}
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
                    update({ targetAtar: event.target.value })
                  }
                >
                  <option value="">{t("form.selectTargetRange")}</option>
                  {["70-89", "90-98", "99+"].map((range) => (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  ))}
                  <option value="As high as possible">
                    {t("form.asHighAsPossible")}
                  </option>
                </select>
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              {t("form.school")}
              <input
                className="input"
                value={form.school}
                onChange={(event) => update({ school: event.target.value })}
                placeholder={t("form.schoolPlaceholder")}
                required
              />
            </label>
          </>
        );
      case "subjects":
        return (
          <>
            <div className="grid gap-3 text-sm font-medium text-slate-700">
              {t("form.subjectsLabel")}
              <div className="flex flex-wrap gap-2">
                {commonSubjects.map((subject) => {
                  const selected = subjectTags.includes(subject);
                  return (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => toggleSubject(subject)}
                      aria-pressed={selected}
                      className={subjectPillClass(
                        getSubjectStyle(subject),
                        selected
                      )}
                    >
                      {subject}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={toggleOther}
                  aria-pressed={otherOn}
                  className={subjectPillClass(
                    "border-blue-500 bg-blue-50 text-blue-700",
                    otherOn
                  )}
                >
                  {t("form.subjectOther")}
                </button>
              </div>
              <AnimatePresence initial={false}>
                {otherOn ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="-m-1 overflow-hidden"
                  >
                    <label className="grid gap-2 p-1 text-sm font-medium text-slate-700">
                      {t("form.otherSubjectLabel")}
                      <input
                        className="input"
                        value={otherSubject}
                        onChange={(event) =>
                          changeOtherSubject(event.target.value)
                        }
                        placeholder={t("form.otherSubjectPlaceholder")}
                      />
                    </label>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              {t("form.goalCourse")}
              <input
                className="input"
                value={form.plannedCourse}
                onChange={(event) =>
                  update({ plannedCourse: event.target.value })
                }
                placeholder={t("form.goalCoursePlaceholder")}
              />
            </label>
          </>
        );
      case "experience":
        return (
          <textarea
            className="input min-h-[140px] w-full resize-y"
            aria-label={t("form.experience")}
            value={form.experience}
            onChange={(event) => update({ experience: event.target.value })}
          />
        );
      case "expertise":
        return (
          <>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              {t("form.expertise")}
              <input
                className="input"
                value={form.expertise}
                onChange={(event) => update({ expertise: event.target.value })}
                placeholder={t("form.expertisePlaceholder")}
                required
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              {t("form.cvUpload")}
              <input
                type="file"
                accept=".pdf,.docx"
                className="input file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                onChange={(event) =>
                  update({ cvFile: event.target.files?.[0] ?? null })
                }
              />
              {form.cvFile ? (
                <span className="text-xs text-slate-500">
                  {form.cvFile.name}
                </span>
              ) : null}
            </label>
          </>
        );
      case "contact":
        return (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                {t("form.fullName")}
                <input
                  className="input"
                  value={form.name}
                  onChange={(event) => update({ name: event.target.value })}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                {t("form.email")}
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(event) => update({ email: event.target.value })}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                {t("form.phone")}
                <input
                  className="input"
                  value={form.phone}
                  onChange={(event) => update({ phone: event.target.value })}
                  required
                />
              </label>
              <div className="hidden sm:block" aria-hidden="true" />
            </div>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              {t("form.message")}
              <textarea
                className="input min-h-[140px] resize-y"
                value={form.message}
                onChange={(event) => update({ message: event.target.value })}
                required
              />
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(event) => update({ consent: event.target.checked })}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                required
              />
              <span>
                {t("form.consent")}{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  className="font-semibold text-blue-600"
                >
                  {t("form.privacyPolicy")}
                </a>
              </span>
            </label>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {status === "success" ? <Confetti options={confettiOptions} /> : null}

      {status === "success" ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {t("form.success")}
        </p>
      ) : (
        <>
          <div className="grid gap-3">
            <p
              className="text-xs font-bold uppercase tracking-[0.16em] text-blue-500"
              aria-live="polite"
            >
              {stepLabel}
            </p>
            <div className="flex gap-1.5" aria-hidden="true">
              {steps.map((key, index) => (
                <div
                  key={key}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    index <= stepIndex ? "bg-blue-600" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="-m-2 overflow-hidden">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={`${form.type}-${stepKey}`}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="grid gap-5 p-2"
              >
                {stepKey !== "type" ? (
                  <div className="grid gap-2">
                    <p className="text-xl font-semibold leading-tight text-slate-900 sm:text-2xl">
                      {t(stepTitleKeys[stepKey])}
                    </p>
                    {stepKey === "experience" ? (
                      <p className="text-sm leading-relaxed text-slate-500">
                        {t("form.experienceHint")}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {renderStep(stepKey)}
              </motion.div>
            </AnimatePresence>
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          {stepKey !== "type" ? (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={goBack}
                className="btn-ghost rounded-full border border-slate-200 px-6"
              >
                {t("form.back")}
              </button>
              <div className="ml-auto flex items-center gap-3">
                {!isLastStep ? (
                  <span className="hidden text-xs text-slate-400 sm:inline">
                    {t("form.enterHint")}
                  </span>
                ) : null}
                {isLastStep ? (
                  // key forces a fresh DOM node: reusing the "Next" button node
                  // would let its in-flight click submit the form as type=submit
                  <button
                    key="submit"
                    type="submit"
                    disabled={status === "loading"}
                    className="btn h-11 min-w-[120px] rounded-full px-8 py-0 text-base"
                  >
                    {status === "loading" ? t("form.sending") : t("form.submit")}
                  </button>
                ) : (
                  <button
                    key="next"
                    type="button"
                    onClick={goNext}
                    className="btn h-11 min-w-[120px] rounded-full px-8 py-0 text-base"
                  >
                    {t("form.next")}
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </>
      )}

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
    </form>
  );
}
