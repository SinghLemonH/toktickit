/**
 * Date and time formatting utilities for TokTickIT.
 * Standardized on Asia/Bangkok time zone with en-GB format.
 * Prevents locale mismatches (e.g. DD/MM/YYYY vs MM/DD/YYYY).
 */

export function formatBangkokDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return String(isoString);
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return String(isoString);
  }
}

export function formatBangkokDate(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return String(isoString);
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(d);
  } catch {
    return String(isoString);
  }
}

export function formatBangkokTime(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return String(isoString);
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return String(isoString);
  }
}
