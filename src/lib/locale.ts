"use server";

import { cookies } from "next/headers";
import { type Locale, locales, defaultLocale } from "@/i18n";

export async function setLocaleCookie(locale: string) {
  const cookieStore = await cookies();
  if (locales.includes(locale as Locale)) {
    cookieStore.set("locale", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
}

export async function getLocaleCookie(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value as Locale;
  return locales.includes(locale) ? locale : defaultLocale;
}
