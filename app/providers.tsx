"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  console.warn("NEXT_PUBLIC_CONVEX_URL is not set.");
}

const convex = new ConvexReactClient(convexUrl ?? "");

export default function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
