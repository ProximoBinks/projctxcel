"use node";

import { SignJWT, importPKCS8 } from "jose";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

// Keeps Course Enrollments visible to the team without touching the admin
// dashboard — a Google Sheet in the Simple Tuition Drive, kept in sync via a
// service account (Sheets API), independent of anyone's personal Google login.
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEET_NAME = "Sheet1";
const HEADER = [
  "Enrollment ID",
  "Name",
  "Email",
  "Phone",
  "Program",
  "Status",
  "Amount (AUD)",
  "Created At",
  "Updated At",
];

const PROGRAM_LABELS: Record<string, string> = {
  medicine: "Medicine",
  dentistry: "Dentistry",
  both: "Medicine + Dentistry",
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending payment",
  paid: "Paid",
  failed: "Failed",
};

function formatAdelaideTime(ms: number): string {
  return new Date(ms).toLocaleString("en-AU", {
    timeZone: "Australia/Adelaide",
  });
}

async function getAccessToken(): Promise<string> {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  if (!clientEmail || !privateKeyRaw) {
    throw new Error("Google Sheets service account is not configured.");
  }

  const privateKey = await importPKCS8(
    privateKeyRaw.replace(/\\n/g, "\n"),
    "RS256",
  );
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({ scope: SHEETS_SCOPE })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(clientEmail)
    .setSubject(clientEmail)
    .setAudience(TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to get Google access token: ${response.status} ${await response.text()}`,
    );
  }
  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!id) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not set.");
  return id;
}

async function sheetsFetch(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<any> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${getSpreadsheetId()}${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    },
  );
  if (!response.ok) {
    throw new Error(
      `Sheets API error ${response.status}: ${await response.text()}`,
    );
  }
  return response.json();
}

async function ensureHeader(accessToken: string): Promise<void> {
  const data = await sheetsFetch(accessToken, `/values/${SHEET_NAME}!A1:I1`);
  const values = data.values as string[][] | undefined;
  if (values && values.length > 0) return;
  await sheetsFetch(
    accessToken,
    `/values/${SHEET_NAME}!A1:I1?valueInputOption=RAW`,
    { method: "PUT", body: JSON.stringify({ values: [HEADER] }) },
  );
}

/** Appends a new row the moment an enrollment is created (before payment). */
export const appendEnrollment = internalAction({
  args: {
    enrollmentId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    program: v.string(),
    status: v.string(),
    amountCents: v.number(),
    createdAt: v.number(),
  },
  returns: v.null(),
  handler: async (_ctx, args) => {
    try {
      const accessToken = await getAccessToken();
      await ensureHeader(accessToken);
      const row = [
        args.enrollmentId,
        args.name,
        args.email,
        args.phone,
        PROGRAM_LABELS[args.program] ?? args.program,
        STATUS_LABELS[args.status] ?? args.status,
        (args.amountCents / 100).toFixed(2),
        formatAdelaideTime(args.createdAt),
        formatAdelaideTime(Date.now()),
      ];
      await sheetsFetch(
        accessToken,
        `/values/${SHEET_NAME}!A:I:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        { method: "POST", body: JSON.stringify({ values: [row] }) },
      );
    } catch (error) {
      // A sheet-sync failure must never break the enrollment/checkout flow.
      console.error("Failed to append enrollment to Google Sheet", error);
    }
    return null;
  },
});

/** Updates an existing row's status/amount once payment settles (or fails). */
export const updateEnrollmentStatus = internalAction({
  args: {
    enrollmentId: v.string(),
    status: v.string(),
    amountCents: v.number(),
  },
  returns: v.null(),
  handler: async (_ctx, args) => {
    try {
      const accessToken = await getAccessToken();
      const data = await sheetsFetch(accessToken, `/values/${SHEET_NAME}!A:A`);
      const idColumn = (data.values as string[][] | undefined) ?? [];
      const rowIndex = idColumn.findIndex(
        (row) => row[0] === args.enrollmentId,
      );
      if (rowIndex === -1) {
        console.error(
          `Enrollment ${args.enrollmentId} not found in sheet; skipping status update`,
        );
        return null;
      }

      const rowNumber = rowIndex + 1; // Sheets rows are 1-indexed.
      await sheetsFetch(accessToken, `/values:batchUpdate`, {
        method: "POST",
        body: JSON.stringify({
          valueInputOption: "RAW",
          data: [
            {
              range: `${SHEET_NAME}!F${rowNumber}:G${rowNumber}`,
              values: [
                [
                  STATUS_LABELS[args.status] ?? args.status,
                  (args.amountCents / 100).toFixed(2),
                ],
              ],
            },
            {
              range: `${SHEET_NAME}!I${rowNumber}`,
              values: [[formatAdelaideTime(Date.now())]],
            },
          ],
        }),
      });
    } catch (error) {
      console.error("Failed to update enrollment status in Google Sheet", error);
    }
    return null;
  },
});
