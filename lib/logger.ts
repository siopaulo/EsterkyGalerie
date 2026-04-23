type Level = "info" | "warn" | "error";

export function log(level: Level, message: string, meta?: Record<string, unknown>) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...(meta ?? {}),
  };
  console[level === "info" ? "log" : level](JSON.stringify(payload));
}
