"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { adminError } from "./adminError";

export function SubjectsTab() {
  const subjects = useQuery(api.subjects.listSubjectsGrouped);
  const addSubject = useMutation(api.subjects.addSubject);
  const renameSubject = useMutation(api.subjects.renameSubject);
  const addTag = useMutation(api.subjects.addTag);
  const removeTag = useMutation(api.subjects.removeTag);
  const deleteSubject = useMutation(api.subjects.deleteSubject);

  // Add new subject
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Rename
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState("");

  // Tag input per subject
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
  const [tagErrors, setTagErrors] = useState<Record<string, string>>({});

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const handleAdd = async () => {
    if (adding) return;
    if (!newName.trim()) { setAddError("Enter a subject name."); return; }
    setAdding(true); setAddError("");
    try {
      await addSubject({ name: newName.trim() });
      setNewName("");
    } catch (e: unknown) {
      setAddError(adminError(e, "Failed to add subject."));
    } finally { setAdding(false); }
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) { setRenameError("Name cannot be empty."); return; }
    setRenameError("");
    try {
      await renameSubject({ id: id as Id<"subjects">, name: renameValue.trim() });
      setRenamingId(null);
    } catch (e: unknown) {
      setRenameError(adminError(e, "Failed to rename subject."));
    }
  };

  const handleAddTag = async (id: string, preset?: string) => {
    const tag = (preset ?? tagInputs[id] ?? "").trim();
    if (!tag) return;
    setTagErrors((p) => ({ ...p, [id]: "" }));
    try {
      await addTag({ id: id as Id<"subjects">, tag });
      setTagInputs((p) => ({ ...p, [id]: "" }));
    } catch (e: unknown) {
      setTagErrors((p) => ({ ...p, [id]: adminError(e, "Failed to update tags.") }));
    }
  };

  const handleRemoveTag = async (id: string, tag: string) => {
    setTagErrors(p => ({ ...p, [id]: "" }));
    try { await removeTag({ id: id as Id<"subjects">, tag }); }
    catch (error) { setTagErrors(p => ({ ...p, [id]: adminError(error, "Failed to remove tag.") })); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subject from the catalogue? Existing classes and session records keep their subject labels.")) return;
    setDeletingId(id); setActionError("");
    try { await deleteSubject({ id: id as Id<"subjects"> }); }
    catch (error) { setActionError(adminError(error, "Failed to delete subject.")); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Subjects</h2>
        <p className="mt-1 text-sm text-slate-500">
          {subjects?.length ?? 0} subjects — tags generate dropdown entries e.g.{" "}
          <span className="font-mono text-xs">English (Stage 1)</span>
        </p>
      </div>

      {actionError && <p role="alert" className="mb-4 text-sm text-red-600">{actionError}</p>}
      {/* Add new subject */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-medium text-slate-700">Add subject</p>
        <div className="flex gap-2">
          <input
            aria-label="New subject name"
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setAddError(""); }}
            onKeyDown={(e) => e.key === "Enter" && void handleAdd()}
            placeholder="e.g. English"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
          />
          <button
            onClick={() => void handleAdd()}
            disabled={adding}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {adding ? "Adding…" : "Add"}
          </button>
        </div>
        {addError && <p className="mt-2 text-sm text-red-600">{addError}</p>}
      </div>

      {/* Subject list */}
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
        {subjects === undefined && (
          <p className="px-4 py-8 text-center text-sm text-slate-400">Loading…</p>
        )}
        {subjects?.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-400">No subjects yet.</p>
        )}
        {subjects?.map((s) => (
          <div key={s._id} className="px-4 py-4">
            {/* Name row */}
            <div className="flex items-center gap-2">
              {renamingId === s._id ? (
                <>
                  <input
                    aria-label="Subject name"
                    value={renameValue}
                    onChange={(e) => { setRenameValue(e.target.value); setRenameError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") void handleRename(s._id); if (e.key === "Escape") setRenamingId(null); }}
                    autoFocus
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
                  />
                  <button onClick={() => void handleRename(s._id)} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700">Save</button>
                  <button onClick={() => setRenamingId(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                  {renameError && <p className="text-xs text-red-600">{renameError}</p>}
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-slate-900">{s.name}</span>
                  <button
                    onClick={() => { setRenamingId(s._id); setRenameValue(s.name); setRenameError(""); }}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => void handleDelete(s._id)}
                    disabled={deletingId === s._id}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === s._id ? "Deleting…" : "Delete"}
                  </button>
                </>
              )}
            </div>

            {/* Tags row */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {s.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 rounded-full bg-slate-100 pl-2.5 pr-1 py-0.5 text-xs text-slate-700">
                  {tag}
                  <button
                    onClick={() => void handleRemoveTag(s._id, tag)}
                    className="ml-0.5 rounded-full text-slate-400 hover:text-red-500 transition leading-none"
                    title={`Remove ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {s.tags.length === 0 && (
                <span className="text-xs text-slate-400 italic">No tags — appears as &quot;{s.name}&quot; in dropdown</span>
              )}
              {/* Preset tag buttons */}
              {["Stage 1", "Stage 2"].filter((t) => !s.tags.includes(t)).map((preset) => (
                <button
                  key={preset}
                  onClick={() => void handleAddTag(s._id, preset)}
                  className="rounded-full border border-dashed border-slate-300 px-2.5 py-0.5 text-xs text-slate-500 hover:border-slate-400 hover:text-slate-700 transition"
                >
                  + {preset}
                </button>
              ))}
              {/* Custom tag input */}
              <div className="flex items-center gap-1">
                <input
                  aria-label={`Custom tag for ${s.name}`}
                  value={tagInputs[s._id] ?? ""}
                  onChange={(e) => setTagInputs((p) => ({ ...p, [s._id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && void handleAddTag(s._id)}
                  placeholder="Custom tag…"
                  className="w-24 rounded-full border border-dashed border-slate-300 px-2.5 py-0.5 text-xs focus:border-slate-400 focus:outline-none"
                />
                <button
                  onClick={() => void handleAddTag(s._id)}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200 transition"
                >
                  +
                </button>
              </div>
              {tagErrors[s._id] && <p className="text-xs text-red-600">{tagErrors[s._id]}</p>}
            </div>

            {/* Preview */}
            {s.tags.length > 0 && (
              <p className="mt-2 text-xs text-slate-400">
                Dropdown entries:{" "}
                {s.tags.map((t) => `${s.name} (${t})`).join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
