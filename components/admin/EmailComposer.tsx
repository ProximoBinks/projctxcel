"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import Papa from "papaparse";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { parseRecipients } from "../../lib/emailRecipients";
import { DEFAULT_GREETING, EmailRecipient, GreetingOptions, isEmail, missingFields, personalize } from "../../lib/emailPersonalization";

type Template = { id: string; label: string; subject: string; html: string };
type Preview = { html: string; text: string; subject: string; bytes: number };
const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";
const buttonClass = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";
const primaryClass = "rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50";

function csvFor(recipients: EmailRecipient[]) {
  return Papa.unparse(recipients.map(r => ({ ...r.fields, EMAIL: r.email, NAME: r.name })));
}

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function EmailComposer() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState("workshop");
  const [from, setFrom] = useState("");
  const [senderName, setSenderName] = useState("Simple Tuition");
  const [replyTo, setReplyTo] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [recipientInput, setRecipientInput] = useState("");
  const [greeting, setGreeting] = useState<GreetingOptions>(DEFAULT_GREETING);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewName, setPreviewName] = useState("Alex Taylor");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile" | "text">("desktop");
  const [showHtml, setShowHtml] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [review, setReview] = useState(false);
  const [queuedContent, setQueuedContent] = useState("");
  const [retryAttempt, setRetryAttempt] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<Id<"emailCampaigns"> | null>(null);
  const htmlFile = useRef<HTMLInputElement>(null);
  const csvFile = useRef<HTMLInputElement>(null);
  const campaigns = useQuery(api.emailCampaigns.list, {});
  const deliveries = useQuery(api.emailCampaigns.results, selectedCampaign ? { campaignId: selectedCampaign } : "skip");
  const cancel = useMutation(api.emailCampaigns.cancel);
  const parsed = useMemo(() => parseRecipients(recipientInput), [recipientInput]);
  const sample = parsed.recipients[Math.min(previewIndex, Math.max(0, parsed.recipients.length - 1))] || { email: "alex@example.com", name: previewName, fields: {} };
  const sampleCsv = csvFor([sample]);
  const missing = missingFields(subject + html, parsed.recipients.length ? parsed.recipients : [sample], greeting);
  const contentKey = JSON.stringify({ html, subject, greeting, recipientInput, senderName, replyTo });

  useEffect(() => {
    let active = true;
    fetch("/api/admin/email").then(async r => {
      const data = await r.json(); if (!r.ok) throw new Error(data.message);
      if (!active) return;
      setTemplates(data.templates); setFrom(data.from); setReplyTo(data.from);
      setHtml(data.templates[0].html); setSubject(data.templates[0].subject);
    }).catch(e => { if (active) setError(e.message || "Could not load email templates."); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!html || !subject) return;
    const controller = new AbortController();
    setPreviewing(true); setPreviewError("");
    const timer = setTimeout(async () => {
      try {
        const r = await fetch("/api/admin/email", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "preview", html, subject, greeting, recipientInput: sampleCsv }) });
        const data = await r.json(); if (!r.ok) throw new Error(data.message);
        setPreview(data);
      } catch (e) {
        if (!controller.signal.aborted) { setPreview(null); setPreviewError(e instanceof Error ? e.message : "Preview failed."); }
      } finally { if (!controller.signal.aborted) setPreviewing(false); }
    }, 450);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [html, subject, greeting, sampleCsv]);

  async function importFile(file: File | undefined, kind: "html" | "csv") {
    if (!file) return;
    setError(""); setNotice("");
    try {
      if (file.size > (kind === "html" ? 250000 : 1000000)) throw new Error(kind === "html" ? "HTML files must be under 250 KB." : "CSV files must be under 1 MB.");
      const text = await file.text();
      if (kind === "html") { setHtml(text); setTemplateId("custom"); setShowHtml(true); setNotice(`Imported ${file.name}. Review the formatted preview before sending.`); }
      else { setRecipientInput(text); setPreviewIndex(0); setNotice(`Imported ${file.name}. Review recipient counts below.`); }
    } catch (e) { setError(e instanceof Error ? e.message : "Could not read that file."); }
  }

  async function send(isTest: boolean) {
    setBusy(true); setError(""); setNotice("");
    try {
      const payload = { action: isTest ? "test" : "send", html, subject, greeting, senderName, replyTo, recipientInput: isTest ? csvFor([{ ...sample, email: testEmail.trim() }]) : recipientInput };
      // A lost HTTP response can be retried safely, including after a refresh.
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify({ ...payload, retryAttempt }))))).map(x => x.toString(16).padStart(2, "0")).join("");
      const storageKey = `email-request-${hash}`;
      let requestId = sessionStorage.getItem(storageKey);
      if (!requestId) { requestId = crypto.randomUUID(); sessionStorage.setItem(storageKey, requestId); }
      const r = await fetch("/api/admin/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, requestId }) });
      const data = await r.json(); if (!r.ok) throw new Error(data.message);
      setNotice(data.message); setSelectedCampaign(data.campaignId); setReview(false);
      if (!isTest) setQueuedContent(contentKey);
      else sessionStorage.removeItem(storageKey);
    } catch (e) { setError(e instanceof Error ? e.message : "The response was interrupted. Check history; retrying the same content will not create a duplicate campaign."); }
    finally { setBusy(false); }
  }

  const canSend = !!preview && !previewing && !previewError && !parsed.errors.length && !missing.length && !!subject.trim() && !!html.trim() && !!senderName.trim() && isEmail(replyTo) && !busy;

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-xl font-semibold text-slate-900">Email studio</h2><p className="mt-1 text-sm text-slate-500">Create a formatted email, personalise it, and send through Postmark.</p></div>
      <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">From {from || "your verified Simple Tuition address"}</span>
    </div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{notice}</p>}
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <fieldset disabled={busy} className="min-w-0 space-y-5">
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900">1. Compose your email</h3>
          <label className="block text-sm font-medium text-slate-700">Template<select className={`${inputClass} mt-1.5`} value={templateId} onChange={e => {
            setTemplateId(e.target.value); const t = templates.find(t => t.id === e.target.value);
            if (t) { setHtml(t.html); setSubject(t.subject); } else setShowHtml(true);
          }}><option value="workshop">Interview workshop</option><option value="welcome">Welcome to Simple Tuition</option><option value="custom">Custom HTML</option></select></label>
          <div className="flex flex-wrap gap-2">
            <button className={buttonClass} onClick={() => htmlFile.current?.click()}>Import HTML file</button>
            <button className={buttonClass} onClick={() => setShowHtml(!showHtml)}>{showHtml ? "Hide HTML editor" : "Edit / paste HTML"}</button>
            <input ref={htmlFile} type="file" accept=".html,.htm,text/html" aria-label="Import HTML file" className="hidden" onChange={e => { void importFile(e.target.files?.[0], "html"); e.target.value = ""; }} />
          </div>
          <label className="block text-sm font-medium text-slate-700">Subject<input className={`${inputClass} mt-1.5`} value={subject} maxLength={200} onChange={e => setSubject(e.target.value)} /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Sender name<input className={`${inputClass} mt-1.5`} value={senderName} maxLength={100} onChange={e => setSenderName(e.target.value)} /></label>
            <label className="text-sm font-medium text-slate-700">Reply-to email<input type="email" className={`${inputClass} mt-1.5`} value={replyTo} onChange={e => setReplyTo(e.target.value)} /></label>
          </div>
          {showHtml && <label className="block text-sm font-medium text-slate-700">Email HTML<textarea spellCheck={false} className={`${inputClass} mt-1.5 font-mono text-xs`} rows={16} value={html} onChange={e => { setHtml(e.target.value); setTemplateId("custom"); }} /><span className="mt-1 block text-xs font-normal text-slate-500">CSS is inlined before sending. Use public HTTPS image URLs. Scripts and forms are removed.</span></label>}
        </section>
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900">2. Personalise the greeting</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">Greeting<input className={`${inputClass} mt-1.5`} value={greeting.greeting} maxLength={60} placeholder="Dear" onChange={e => setGreeting({ ...greeting, greeting: e.target.value })} /></label>
            <label className="text-sm font-medium text-slate-700">Use name<select className={`${inputClass} mt-1.5`} value={greeting.nameStyle} onChange={e => setGreeting({ ...greeting, nameStyle: e.target.value as "first" | "full" })}><option value="first">First name</option><option value="full">Full name</option></select></label>
            <label className="text-sm font-medium text-slate-700">If name is missing<input className={`${inputClass} mt-1.5`} value={greeting.fallbackName} maxLength={100} onChange={e => setGreeting({ ...greeting, fallbackName: e.target.value })} /></label>
          </div>
          <p className="text-sm text-slate-600">Use <code className="text-xs">{"{{GREETING}}"}</code> for “Dear Alex”, or <code className="text-xs">{"{{NAME}}, {{FIRST_NAME}}, {{FULL_NAME}}, {{EMAIL}}"}</code> in the subject or body. CSV columns also become fields, such as <code className="text-xs">{"{{COURSE}}"}</code>.</p>
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-800">{personalize("{{GREETING}},", sample, greeting)}</p>
        </section>
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900">3. Add recipients</h3>
          <div className="flex flex-wrap gap-2"><button className={buttonClass} onClick={() => csvFile.current?.click()}>Import CSV / TXT</button><button className={buttonClass} onClick={() => download("email-recipients-example.csv", "email,name,course\nalex@example.com,Alex Taylor,Interview workshop\njane@example.com,Jane Smith,Interview workshop\n", "text/csv")}>Example CSV</button></div>
          <input ref={csvFile} type="file" accept=".csv,.txt,.tsv,text/csv,text/plain" aria-label="Import recipient list" className="hidden" onChange={e => { void importFile(e.target.files?.[0], "csv"); e.target.value = ""; }} />
          <label className="block text-sm font-medium text-slate-700">Paste emails or spreadsheet rows<textarea rows={7} className={`${inputClass} mt-1.5`} value={recipientInput} onChange={e => { setRecipientInput(e.target.value); setPreviewIndex(0); }} placeholder={"alex@example.com, Alex Taylor\njane@example.com, Jane Smith\n\nOr paste a CSV with email,name headers"} /></label>
          <p className="text-xs text-slate-500">Up to 5,000 contacts. One email per line, email/name pairs, comma-separated emails, or CSV/TSV with headers. Import replaces the list. Names keep their original spelling.</p>
          <div className="flex flex-wrap gap-3 text-sm"><span className="font-medium text-slate-900">{parsed.recipients.length.toLocaleString()} unique recipients</span>{parsed.duplicates > 0 && <span className="text-amber-700">{parsed.duplicates} duplicates removed</span>}<span className="text-slate-500">{parsed.recipients.filter(r => !r.name && !r.fields.FIRST_NAME).length} using fallback name</span></div>
          {!!parsed.errors.length && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700"><p className="font-medium">Fix these rows before sending:</p>{parsed.errors.slice(0, 5).map((e, i) => <p key={i}>{e}</p>)}{parsed.errors.length > 5 && <p>And {parsed.errors.length - 5} more.</p>}</div>}
          {!!missing.length && <p role="alert" className="text-sm text-red-700">Missing CSV fields: {missing.join(", ")}</p>}
        </section>
      </fieldset>
      <div className="min-w-0 space-y-5 lg:sticky lg:top-5">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="space-y-3 border-b border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-slate-900">Personalised preview</h3><div className="flex gap-1">{(["desktop", "mobile", "text"] as const).map(mode => <button key={mode} aria-pressed={previewMode === mode} className={`rounded px-2 py-1 text-xs ${previewMode === mode ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`} onClick={() => setPreviewMode(mode)}>{mode === "text" ? "Plain text" : mode === "mobile" ? "Mobile" : "Desktop"}</button>)}</div></div>
            {parsed.recipients.length ? <label className="block text-xs text-slate-500">Preview recipient<select aria-label="Preview recipient" className={`${inputClass} mt-1`} value={Math.min(previewIndex, parsed.recipients.length - 1)} onChange={e => setPreviewIndex(Number(e.target.value))}>{parsed.recipients.map((r, i) => <option key={r.email} value={i}>{r.name ? `${r.name} — ` : ""}{r.email}</option>)}</select></label> : <label className="block text-xs text-slate-500">Sample name<input className={`${inputClass} mt-1`} value={previewName} onChange={e => setPreviewName(e.target.value)} /></label>}
            <p className="break-words text-sm text-slate-700"><span className="text-slate-400">Subject:</span> {preview?.subject || subject}</p>
            <p className="text-xs text-slate-500" role="status">{previewing ? "Updating preview…" : preview ? `Prepared HTML · ${(preview.bytes / 1024).toFixed(1)} KB · plain-text alternative included` : "Loading template…"}</p>
          </div>
          {previewError && <p role="alert" className="p-4 text-sm text-red-700">{previewError}</p>}
          {preview && <div className="overflow-x-auto bg-slate-100 p-2">
            {previewMode === "text" ? <pre className="max-h-[660px] whitespace-pre-wrap break-words overflow-y-auto p-4 text-sm text-slate-700">{preview.text}</pre> : <iframe title="Formatted email preview" sandbox="" referrerPolicy="no-referrer" srcDoc={preview.html} className="mx-auto block h-[660px] border-0 bg-white" style={{ width: previewMode === "mobile" ? 375 : "100%", maxWidth: "100%" }} />}
          </div>}
          <div className="space-y-2 p-4"><p className="text-xs text-slate-500">Gmail, Apple Mail and Outlook may vary fonts, dark mode and image loading. Use a test email to check your inbox. Postmark adds unsubscribe handling to broadcasts.</p><button disabled={!preview || previewing} className={buttonClass} onClick={() => preview && download("formatted-email.html", preview.html, "text/html")}>Download formatted preview</button></div>
        </section>
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900">4. Test, then send</h3>
          <label className="block text-sm font-medium text-slate-700">Send one test to<input className={`${inputClass} mt-1.5`} type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="Your inbox email address" /></label>
          <p className="text-xs text-slate-500">Uses the preview recipient’s name and fields, delivered only to the test address.</p>
          <button className={buttonClass} disabled={!canSend || !isEmail(testEmail.trim())} onClick={() => void send(true)}>{busy ? "Queueing…" : "Send test email"}</button>
          <div className="border-t border-slate-100 pt-3"><button className={`${primaryClass} w-full`} disabled={!canSend || !parsed.recipients.length || queuedContent === contentKey} onClick={() => setReview(true)}>{queuedContent === contentKey ? "Campaign queued — see history" : `Review & send to ${parsed.recipients.length.toLocaleString()} recipients`}</button><p className="mt-2 text-xs text-slate-500">Each person receives a separate email. Sending continues in the background after you leave this page.</p></div>
        </section>
      </div>
    </div>
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900">Campaign history</h3>
      <p className="text-xs text-slate-500">“Accepted” means Postmark accepted the message. Delivery, bounces and spam placement are separate; check Postmark for those details.</p>
      {!campaigns?.length && <p className="text-sm text-slate-500">{campaigns ? "No campaigns yet. Start with a test email." : "Loading campaigns…"}</p>}
      {campaigns?.map(c => <div key={c._id} className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="min-w-0"><p className="break-words text-sm font-medium text-slate-900">{c.subject}</p><p className="mt-1 text-xs text-slate-500">{new Date(c.createdAt).toLocaleString()} · {c.status} · {c.accepted}/{c.total} accepted · {c.failed} failed · {c.uncertain} unconfirmed</p></div>
        <div className="flex gap-2"><button className={buttonClass} onClick={() => setSelectedCampaign(selectedCampaign === c._id ? null : c._id)}>Results</button>{c.status === "sending" && <button className={buttonClass} onClick={() => void cancel({ campaignId: c._id }).catch(() => setError("Could not stop the campaign."))}>Stop remaining</button>}</div>
      </div>)}
      {selectedCampaign && deliveries && <div className="space-y-3 border-t border-slate-200 pt-4">
        <div className="flex flex-wrap gap-2"><button className={buttonClass} onClick={() => download("email-results.csv", Papa.unparse(deliveries.map(d => ({ email: d.email, name: d.name, status: d.status, messageId: d.messageId || "", error: d.error || "" })), { escapeFormulae: true }), "text/csv")}>Export all results</button><button className={buttonClass} disabled={!deliveries.some(d => d.status === "failed")} onClick={() => { setRetryAttempt(crypto.randomUUID()); setQueuedContent(""); setRecipientInput(csvFor(deliveries.filter(d => d.status === "failed"))); setPreviewIndex(0); setNotice("Loaded only confirmed failures. Review the message and recipients before sending again."); }}>Load failed recipients</button></div>
        {deliveries.some(d => d.status === "uncertain") && <p className="text-sm text-amber-700">Some results are unconfirmed. Check their campaign IDs in Postmark before resending to avoid duplicates.</p>}
        <div className="max-h-72 overflow-auto"><table className="w-full text-left text-xs"><thead><tr className="text-slate-500"><th className="p-2">Recipient</th><th className="p-2">Status</th><th className="p-2">Details</th></tr></thead><tbody>{deliveries.slice(0, 100).map(d => <tr key={d._id} className="border-t border-slate-100"><td className="p-2">{d.email}</td><td className="p-2">{d.status}</td><td className="p-2">{d.error || d.messageId || "—"}</td></tr>)}</tbody></table></div>{deliveries.length > 100 && <p className="text-xs text-slate-500">Showing the first 100 results. Export for the complete list.</p>}
      </div>}
    </section>
    {review && <div role="dialog" aria-modal="true" aria-labelledby="email-review-title" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 id="email-review-title" className="text-lg font-semibold text-slate-900">Send to {parsed.recipients.length.toLocaleString()} recipients?</h3>
        <p className="text-sm text-slate-600">From {senderName} &lt;{from}&gt;<br />Reply to {replyTo}</p>
        <p className="break-words text-sm font-medium text-slate-900">{subject}</p>
        <div className="space-y-2 rounded-lg bg-slate-50 p-3">{parsed.recipients.slice(0, 4).map(r => <p key={r.email} className="break-words text-xs text-slate-600">{r.email} → {personalize("{{GREETING}},", r, greeting)}</p>)}{parsed.recipients.length > 4 && <p className="text-xs text-slate-500">And {parsed.recipients.length - 4} more.</p>}</div>
        <p className="text-sm text-slate-600">This starts a live Postmark broadcast. You can stop recipients that have not yet been picked up for sending.</p>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2"><button disabled={busy} className={buttonClass} onClick={() => setReview(false)}>Back to editing</button><button disabled={!canSend} className={primaryClass} onClick={() => void send(false)}>{busy ? "Queueing…" : "Send campaign"}</button></div>
      </div>
    </div>}
  </div>;
}
