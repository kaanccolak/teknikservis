"use client";

import { ThemeProvider } from "next-themes";

export function AppThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="tamirtakip-theme"
    >
      {children}
    </ThemeProvider>
  );
}
