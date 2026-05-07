export const ds = {
  colors: {
    background: "#0f1115",
    surface: "#151922",
    surfaceSoft: "#1a202c",
    border: "#2a2f3a",
    text: "#f3f4f6",
    textMuted: "#b5bac7",
    primary: "#3b82f6",
    primarySoft: "#1d2a42",
    success: "#18a058",
    successSoft: "#163a2b",
    danger: "#e45858",
    dangerSoft: "#3b1d22",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  radius: {
    md: 10,
    lg: 14,
    pill: 999,
  },
  typography: {
    mono: 12,
    caption: 13,
    body: 15,
    heading: 18,
    title: 28,
  },
} as const;

export type StatusTone = "default" | "loading" | "success" | "error";

export function statusColors(tone: StatusTone) {
  if (tone === "loading") {
    return { bg: ds.colors.surfaceSoft, dot: ds.colors.primary, text: ds.colors.text };
  }
  if (tone === "success") {
    return { bg: ds.colors.successSoft, dot: ds.colors.success, text: ds.colors.success };
  }
  if (tone === "error") {
    return { bg: ds.colors.dangerSoft, dot: ds.colors.danger, text: ds.colors.danger };
  }
  return { bg: ds.colors.surfaceSoft, dot: ds.colors.textMuted, text: ds.colors.textMuted };
}
