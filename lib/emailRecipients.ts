import Papa from "papaparse";
import { EmailRecipient, fieldKey, isEmail, MAX_RECIPIENTS } from "./emailPersonalization";

export function parseRecipients(input: string) {
  const recipients: EmailRecipient[] = [];
  const errors: string[] = [];
  let duplicates = 0;
  const seen = new Set<string>();
  if (!input.trim()) return { recipients, errors, duplicates };
  if (input.length > 1_000_000) return { recipients, errors: ["Recipient list is too large. Import up to 5,000 contacts at a time."], duplicates };
  const firstLine = input.replace(/^\uFEFF/, "").split(/\r?\n/)[0];
  const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";
  const parsed = Papa.parse<string[]>(input.replace(/^\uFEFF/, ""), { delimiter, skipEmptyLines: "greedy" });
  parsed.errors.forEach(e => errors.push(`CSV row ${(e.row ?? 0) + 1}: ${e.message}`));
  const rows = parsed.data;
  const headers = (rows[0] || []).map(fieldKey);
  const emailColumn = headers.findIndex(h => ["EMAIL", "EMAIL_ADDRESS", "E_MAIL"].includes(h));
  const hasHeader = emailColumn >= 0;
  if (hasHeader && (headers.some(h => !/^[A-Z][A-Z0-9_]*$/.test(h)) || new Set(headers).size !== headers.length)) {
    return { recipients, errors: ["Use unique CSV headers with letters, numbers, spaces or underscores (for example email, name, course)."], duplicates };
  }
  const add = (email: string, name: string, fields: Record<string, string>, row: number) => {
    email = email.trim().toLowerCase();
    if (!isEmail(email)) { errors.push(`Row ${row}: invalid email “${email || "(empty)"}”.`); return; }
    if (name.length > 200 || Object.keys(fields).length > 20 || Object.values(fields).some(v => v.length > 500 || /[\r\n]/.test(v))) {
      errors.push(`Row ${row}: names must be under 200 characters; use up to 20 short, single-line fields.`); return;
    }
    if (seen.has(email)) { duplicates++; return; }
    seen.add(email);
    recipients.push({ email, name: name.trim(), fields });
  };
  rows.slice(hasHeader ? 1 : 0).forEach((row, i) => {
    const rowNumber = i + (hasHeader ? 2 : 1);
    const cells = row.map(c => c.trim());
    if (hasHeader) {
      const fields: Record<string, string> = {};
      headers.forEach((h, j) => { if (h && j !== emailColumn) fields[h] = cells[j] || ""; });
      if (cells.length > headers.length) { errors.push(`Row ${rowNumber}: more values than CSV headers.`); return; }
      const name = fields.NAME || fields.FULL_NAME || [fields.FIRST_NAME, fields.LAST_NAME].filter(Boolean).join(" ");
      add(cells[emailColumn] || "", name, fields, rowNumber);
    } else if (cells.filter(Boolean).every(isEmail)) {
      cells.filter(Boolean).forEach(email => add(email, "", {}, rowNumber));
    } else if (cells.length === 1) {
      const display = cells[0].match(/^(.+?)\s*<([^>]+)>$/);
      if (display) add(display[2], display[1].replace(/^"|"$/g, ""), {}, rowNumber);
      else {
        const addresses = cells[0].split(/[;\s]+/).filter(Boolean);
        addresses.forEach(email => add(email, "", {}, rowNumber));
      }
    } else if (cells.length === 2 && (isEmail(cells[0]) || isEmail(cells[1]))) {
      const emailFirst = isEmail(cells[0]);
      add(cells[emailFirst ? 0 : 1], cells[emailFirst ? 1 : 0], {}, rowNumber);
    } else errors.push(`Row ${rowNumber}: use email, name or a CSV with an email header.`);
  });
  if (recipients.length > MAX_RECIPIENTS) errors.push(`Use up to ${MAX_RECIPIENTS.toLocaleString()} unique recipients per campaign.`);
  return { recipients, errors, duplicates };
}
