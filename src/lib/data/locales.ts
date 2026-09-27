"use server"

export type Locale = { code: string; name: string }

export const listLocales = async (): Promise<Locale[]> => [
  { code: "tr", name: "Türkçe" },
]
