export type EmailRecipient = { email: string; name: string; fields: Record<string, string> };
export type GreetingOptions = { greeting: string; nameStyle: "first" | "full"; fallbackName: string };
export const DEFAULT_GREETING: GreetingOptions = { greeting: "Hi", nameStyle: "first", fallbackName: "there" };
export const MAX_RECIPIENTS = 5000;
export const MAX_HTML_BYTES = 90000;
export const isEmail = (value: string) => value.length <= 254 && /^[^\s@<>,;"\r\n]+@[^\s@<>,;"\r\n]+\.[^\s@<>,;"\r\n]+$/.test(value);
export const fieldKey = (value: string) => value.trim().toUpperCase().replace(/[\s-]+/g, "_");
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function recipientFields(recipient: EmailRecipient, options: GreetingOptions) {
  const first = recipient.fields.FIRST_NAME || recipient.name.trim().split(/\s+/)[0] || options.fallbackName;
  const full = recipient.name || first;
  const name = options.nameStyle === "first" ? first : full;
  return { ...recipient.fields, EMAIL: recipient.email, FIRST_NAME: first, LAST_NAME: recipient.fields.LAST_NAME || recipient.name.split(/\s+/).slice(1).join(" "), FULL_NAME: full, NAME: name, GREETING: `${options.greeting.trim()} ${name}`.trim() };
}

export function personalize(source: string, recipient: EmailRecipient, options: GreetingOptions, html = false) {
  const values: Record<string, string> = recipientFields(recipient, options);
  return source.replace(/\{\{\s*([a-zA-Z][a-zA-Z0-9_ -]*)\s*\}\}/g, (token, key: string) => {
    const value = values[fieldKey(key)];
    return value === undefined ? token : html ? escapeHtml(value) : value;
  });
}

export function missingFields(source: string, recipients: EmailRecipient[], options: GreetingOptions) {
  const keys = [...new Set([...source.matchAll(/\{\{\s*([a-zA-Z][a-zA-Z0-9_ -]*)\s*\}\}/g)].map(m => fieldKey(m[1])))];
  return keys.filter(key => recipients.some(r => !(key in recipientFields(r, options))));
}
