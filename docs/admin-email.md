# Admin email studio

Open **Admin → Email**. The interview workshop and original welcome message are built in.

1. Select a template, import an HTML file, or paste HTML into the editor. Edit the subject, sender display name and reply-to address. The sending address remains the configured, verified Postmark address.
2. Set a greeting such as `Dear`, choose first/full name, and enter a fallback such as `student`. `{{GREETING}}` becomes `Dear Alex`; `{{NAME}}` contains only the chosen name. `{{FIRST_NAME}}`, `{{LAST_NAME}}`, `{{FULL_NAME}}` and `{{EMAIL}}` also work. Fields work in the subject and body text, not URLs.
3. Paste addresses or import CSV/TSV/TXT. For example:

   ```csv
   email,name,course
   alex@example.com,Alex Taylor,Interview workshop
   jane@example.com,Jane Smith,Interview workshop
   ```

   Use `{{COURSE}}` to insert the custom column. Headers are case insensitive; spaces become underscores. Quoted CSV values are supported. Names retain their spelling. Invalid rows block sending and duplicate addresses are removed, keeping the first occurrence. Each campaign supports up to 5,000 unique recipients.
4. Choose a preview recipient and check desktop, mobile and plain-text views. Send a test to your own inbox. Tests use the preview recipient's fields and only send to the test address.
5. Review the recipient count and click **Send campaign**. Every recipient gets an individual message. The queue continues on the server when the page closes.

## Formatting

The server strips active content and inlines CSS from `<style>` blocks. Use public HTTPS image URLs; external CSS and local image files are rejected. `/images/...` URLs are resolved against the Simple Tuition site. Prepared HTML is capped at 90 KB to leave headroom against Gmail clipping. A plain-text alternative accompanies every email.

The workshop template uses presentation tables, inline styles, standard fonts, a responsive banner, a button plus a readable backup Meet URL, and Postmark's unsubscribe placeholder. Actual inbox appearance can vary with dark mode, blocked images and the mail client. A browser preview is not proof of inbox delivery or an exact Outlook rendering.

## History and retries

Campaign history stores recipient results and Postmark message IDs. **Accepted** means accepted by Postmark, not confirmed delivery. Use Postmark for delivery, bounce and suppression details. **Stop remaining** prevents new batches; the current batch of up to 50 may finish. Pending rows in a cancelled campaign were not sent.

The browser retains an idempotency key for a submission so retrying a lost response does not create another campaign. **Load failed recipients** starts a fresh attempt containing only confirmed failures. Unconfirmed deliveries are never automatically retried: check Postmark first to avoid sending duplicates. Export results as CSV for the full list.

## Operations

The existing Netlify variables `POSTMARK_FROM_EMAIL`, `AUTH_JWT_SECRET`, `CONVEX_SERVER_SECRET` and `NEXT_PUBLIC_CONVEX_URL` are used. The Convex deployment also needs `POSTMARK_SERVER_TOKEN`. Optionally set `POSTMARK_BROADCAST_STREAM`; the default is `default-broadcast-stream`, with Postmark-managed unsubscribes. Never put these secrets into browser code.

The live website uses the Convex deployment `sensible-hornet-978`; publish its functions with `npx convex dev --once` in the linked checkout. Use Node 24 for local Netlify packaging (the local Node 26 environment caused an adapter packaging error).

Validation: `npm run test:email`, `npx tsc --noEmit --incremental false`, and `npm run build`. The queue tests mock Postmark and do not send email. The retired `/api/send-welcome-email` endpoint requires admin authentication and directs old clients to refresh.
