"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import { ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { authClient } from "@/lib/auth-client";
import { ReactNode } from "react";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud"
);

interface ProvidersProps {
  children: ReactNode;
  locale: string;
  messages: Record<string, unknown>;
  initialToken?: string | null;
}

export function Providers({ children, locale, messages, initialToken }: ProvidersProps) {
  return (
    <ConvexBetterAuthProvider
      client={convex}
      authClient={authClient}
      initialToken={initialToken}
    >
      <NextIntlClientProvider locale={locale} messages={messages}>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </NextThemesProvider>
      </NextIntlClientProvider>
    </ConvexBetterAuthProvider>
  );
}
