
export function parseDurationToSeconds(duration: string): number {
  const match = /^(\d+)\s*(s|m|h|d)$/i.exec(duration.trim());
  if (!match) {
    throw new Error(
      `Invalid duration "${duration}". Expected a number followed by s, m, h, or d (e.g. "15m", "1h", "30d").`
    );
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const secondsPerUnit: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };

  return value * secondsPerUnit[unit];
}
