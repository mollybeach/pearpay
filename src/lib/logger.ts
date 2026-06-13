type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function activeLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ?? "info").toLowerCase();
  if (raw in LEVEL_WEIGHT) return raw as LogLevel;
  return "info";
}

/**
 * Minimal structured logger. Emits single-line JSON so logs stay grep-able in
 * Vercel and any downstream log drain.
 */
function emit(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[activeLevel()]) return;

  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) =>
    emit("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) =>
    emit("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    emit("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    emit("error", message, meta),

  /** Create a child logger that tags every entry with a scope. */
  scoped(scope: string) {
    return {
      debug: (m: string, meta?: Record<string, unknown>) =>
        emit("debug", m, { scope, ...meta }),
      info: (m: string, meta?: Record<string, unknown>) =>
        emit("info", m, { scope, ...meta }),
      warn: (m: string, meta?: Record<string, unknown>) =>
        emit("warn", m, { scope, ...meta }),
      error: (m: string, meta?: Record<string, unknown>) =>
        emit("error", m, { scope, ...meta }),
    };
  },
};
