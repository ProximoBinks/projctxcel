export const getSubjectStyle = (subject: string) => {
  const s = subject.toLowerCase();
  // Maths
  if (s === "general maths") return "bg-sky-100 text-sky-700 border-sky-200";
  if (s === "maths methods") return "bg-blue-100 text-blue-700 border-blue-200";
  if (s === "specialist maths") return "bg-blue-100 text-blue-800 border-blue-200";
  // Sciences
  if (s === "biology") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (s === "chemistry") return "bg-orange-100 text-orange-700 border-orange-200";
  if (s === "physics") return "bg-violet-100 text-violet-700 border-violet-200";
  // English
  if (s === "english") return "bg-red-100 text-red-700 border-red-200";
  if (s === "english literature") return "bg-rose-100 text-rose-800 border-rose-200";
  if (s === "research project") return "bg-slate-100 text-slate-600 border-slate-200";
  // Business
  if (s === "accounting") return "bg-gray-200 text-gray-800 border-gray-300";
  // Medicine pathway
  if (s === "ucat") return "bg-pink-100 text-pink-700 border-pink-200";
  if (s === "interview prep") return "bg-amber-50 text-amber-700 border-amber-300";
  // Default
  return "border-slate-200 text-slate-600 bg-white";
};
