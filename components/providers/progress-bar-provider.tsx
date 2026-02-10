"use client";
import { ProgressProvider } from "@bprogress/next/app";
import type React from "react";

export function ProgressBarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProgressProvider
      color="oklch(0.56 0.2263 259.87)"
      height="4px"
      options={{ showSpinner: false }}
    >
      {children}
    </ProgressProvider>
  );
}
