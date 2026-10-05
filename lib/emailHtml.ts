import juice from "juice";
import sanitizeHtml from "sanitize-html";
import { convert } from "html-to-text";
import { MAX_HTML_BYTES } from "./emailPersonalization";

// No resource fetching: imported HTML must carry its own CSS and public image URLs.
export function prepareEmailHtml(source: string) {
  if (!source.trim()) throw new Error("Enter or import your email HTML.");
  if (Buffer.byteLength(source, "utf8") > 250000) throw new Error("Import an HTML file smaller than 250 KB.");
  if (/<link\b[^>]*\bstylesheet\b|@import\b/i.test(source)) throw new Error("External stylesheets are not supported. Put the CSS in a <style> block or inline styles first.");
  if (/(?:href|src)\s*=\s*["'][^"']*\{\{(?!\{\s*pm:unsubscribe)/i.test(source.replace(/\{\{\{\s*pm:unsubscribe\s*\}\}\}/g, "POSTMARK_UNSUBSCRIBE"))) throw new Error("Use personalisation fields in the email text, not in link or image URLs.");
  const cleaned = sanitizeHtml(source, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "html", "head", "body", "title", "meta", "style", "img", "center"],
    allowedAttributes: {
      "*": ["style", "class", "id", "role", "lang", "dir", "align", "valign", "width", "height", "bgcolor"],
      a: ["href", "title", "target"], img: ["src", "alt", "width", "height"],
      table: ["cellpadding", "cellspacing", "border", "width", "align", "role", "style", "class", "bgcolor"],
      td: ["colspan", "rowspan", "width", "height", "style", "class", "align", "valign", "bgcolor"],
      meta: ["charset", "name", "content"],
    },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowProtocolRelative: false,
    allowVulnerableTags: true, // style is retained only to inline trusted admin-provided CSS.
    parseStyleAttributes: false,
    transformTags: {
      img: (tagName, attribs) => {
        if (attribs.src?.startsWith("/")) attribs.src = new URL(attribs.src, "https://simpletuition.com.au").href;
        if (!/^https?:\/\//i.test(attribs.src || "")) throw new Error("Every email image needs a public https:// URL. Local files and embedded images cannot be imported.");
        return { tagName, attribs };
      },
      a: (tagName, attribs) => {
        if (attribs.href?.startsWith("/")) attribs.href = new URL(attribs.href, "https://simpletuition.com.au").href;
        if (attribs.href && !/^[a-z][a-z0-9+.-]*:/i.test(attribs.href) && !/^(https?:\/\/|mailto:|tel:|#|\{\{\{\s*pm:unsubscribe\s*\}\}\})/i.test(attribs.href)) throw new Error("Every email link needs an absolute https://, mailto: or tel: URL.");
        return { tagName, attribs };
      },
    },
  });
  let html = juice(cleaned, { preserveMediaQueries: true, preserveFontFaces: false, applyWidthAttributes: true, applyAttributesTableElements: true, removeStyleTags: true });
  if (!/<html[\s>]/i.test(html)) html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${html}</body></html>`;
  // Leave room below Gmail's clipping threshold for personalisation and Postmark's footer.
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) throw new Error("The formatted email is too large. Keep the final HTML under 90 KB to reduce Gmail clipping.");
  const text = convert(html, { wordwrap: 90, selectors: [{ selector: "img", format: "skip" }, { selector: "style", format: "skip" }] });
  if (!text.trim()) throw new Error("Include readable text in your email.");
  return { html, text, bytes: Buffer.byteLength(html, "utf8") };
}
