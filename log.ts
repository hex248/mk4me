import { logs } from "./logs";

enum DEBUG_LEVEL {
  NONE,
  ERROR,
  WARN,
  INFO,
  DEBUG,
}

const debugLevelFromENV = (str: string): DEBUG_LEVEL => {
  switch (str.toLowerCase()) {
    case "none":
      return DEBUG_LEVEL.NONE;
    case "error":
      return DEBUG_LEVEL.ERROR;
    case "warn":
      return DEBUG_LEVEL.WARN;
    case "info":
      return DEBUG_LEVEL.INFO;
    case "debug":
      return DEBUG_LEVEL.DEBUG;
    default:
      return DEBUG_LEVEL.INFO;
  }
};

const debugLevel = debugLevelFromENV(process.env.DEBUG_LEVEL ?? "info");

export const log = {
  error: (msg: unknown, save?: boolean) => {
    if (debugLevel >= DEBUG_LEVEL.ERROR) console.error("ERROR:", msg);
    if (typeof msg !== "string" && typeof msg !== "number")
      msg = JSON.stringify(msg);
    if (save) logs.write(`ERROR: ${msg}`);
  },
  warn: (msg: unknown, save?: boolean) => {
    if (debugLevel >= DEBUG_LEVEL.WARN) console.warn("WARN:", msg);
    if (typeof msg !== "string" && typeof msg !== "number")
      msg = JSON.stringify(msg);
    if (save) logs.write(`WARN: ${msg}`);
  },
  info: (msg: unknown, save?: boolean) => {
    if (debugLevel >= DEBUG_LEVEL.INFO) console.info("INFO:", msg);
    if (typeof msg !== "string" && typeof msg !== "number")
      msg = JSON.stringify(msg);
    if (save) logs.write(`INFO: ${msg}`);
  },
  debug: (msg: unknown, save?: boolean) => {
    if (debugLevel >= DEBUG_LEVEL.DEBUG) console.debug("DEBUG:", msg);
    if (typeof msg !== "string" && typeof msg !== "number")
      msg = JSON.stringify(msg);
    if (save) logs.write(`DEBUG: ${msg}`);
  },
};
