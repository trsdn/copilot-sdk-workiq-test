import pino from "pino";

const level = process.env.LOG_LEVEL || "info";
const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level,
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}

export default logger;
