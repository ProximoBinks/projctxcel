/**
 * Joins a paragraph's last two words with a non-breaking space so it can never
 * end on a lone word, in any browser (`text-wrap: pretty` is best-effort and
 * missing in some). Copy under four words is left alone: there the joined pair
 * could be most of a line and overflow a narrow column.
 */
export function keepLastWordsTogether(text: string): string {
  if (text.trim().split(/\s+/).length < 4) return text;
  return text.replace(/\s+(\S+)\s*$/, " $1");
}
