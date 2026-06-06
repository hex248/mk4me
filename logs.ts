import fs from "node:fs";

const LOG_PATH = process.env.LOG_PATH ?? "logs/";
let activeLogFile = "";

export const logs = {
  /** Creates a new log file and returns its filename */
  create: (name?: string): string => {
    if (!name) name = new Date().toISOString();
    if (!fs.existsSync(LOG_PATH)) fs.mkdirSync(LOG_PATH);
    fs.writeFileSync(`${LOG_PATH}/${name}`, "");
    activeLogFile = name;
    return name;
  },
  /** Sets the active log file */
  set: (fileName: string): void => {
    activeLogFile = fileName;
  },
  /** Appends a message to a specified log file, or the last log file created */
  write: (msg: unknown, logFile?: string): void => {
    if (msg === "") return;
    if (activeLogFile === "") logs.create();
    if (typeof msg !== "string" && typeof msg !== "number")
      msg = JSON.stringify(msg);
    fs.appendFileSync(
      `${LOG_PATH}/${logFile || activeLogFile}`,
      `\n[${new Date().toISOString()}]: ${msg}`,
    );
  },
};
activeLogFile;
