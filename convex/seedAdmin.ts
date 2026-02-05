import { mutation } from "./_generated/server";
import { v } from "convex/values";

// One-time script to create the first admin account
// Run this via the Convex dashboard or CLI

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "simple_tuition_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const createFirstAdmin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { email, password, name }) => {
    // Check if any admin exists
    const existingAdmins = await ctx.db.query("adminAccounts").collect();
    if (existingAdmins.length > 0) {
      throw new Error("Admin account already exists. Use the admin dashboard to create more.");
    }

    const passwordHash = await hashPassword(password);

    const adminId = await ctx.db.insert("adminAccounts", {
      email: email.toLowerCase(),
      passwordHash,
      name,
    });

    return { success: true, adminId, message: "Admin account created successfully!" };
  },
});
