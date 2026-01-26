"use client";

import { useAction, useMutation } from "convex/react";
import { FormEvent, useMemo, useState } from "react";
import { api } from "../convex/_generated/api";

type FormState = {
  name: string;
  email: string;
  phone: string;
  yearLevel: string;
  subjects: string;
  message: string;
  company: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  phone: "",
  yearLevel: "",
  subjects: "",
  message: "",
  company: "",
};

export default function EnquiryForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  const createEnquiry = useMutation(api.enquiries.create);
  const sendNotification = useAction(
    api.enquiryNotifications.sendNotification
  );

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.name || !form.email || !form.yearLevel || !form.message) {
      setError("Please fill in the required fields.");
      return;
    }

    if (form.company) {
      setStatus("success");
      return;
    }

    setStatus("loading");
    try {
      await createEnquiry({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        yearLevel: form.yearLevel,
        subjects: form.subjects,
        message: form.message,
      });

      await sendNotification({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        yearLevel: form.yearLevel,
        subjects: form.subjects,
        message: form.message,
      });

      setStatus("success");
      setForm(initialState);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError("Something went wrong. Please try again shortly.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Name *
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
          Email *
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
          Phone
          <input
            className="input"
            value={form.phone}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, phone: event.target.value }))
            }
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Year level *
          <select
            className="input bg-white"
            value={form.yearLevel}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, yearLevel: event.target.value }))
            }
            required
          >
            <option value="">Select year level</option>
            {yearLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Subjects
        <input
          className="input"
          value={form.subjects}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, subjects: event.target.value }))
          }
          placeholder="e.g. Specialist Maths, Chemistry"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Message *
        <textarea
          className="input min-h-[140px] resize-y"
          value={form.message}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, message: event.target.value }))
          }
          required
        />
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
          Thanks for your enquiry. We will be in touch shortly.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "loading"}
        className="btn btn-lg w-full justify-center rounded-full"
      >
        {status === "loading" ? "Sending..." : "Submit enquiry"}
      </button>
    </form>
  );
}
