import log4js from "log4js";

log4js.configure({
  appenders: {
    out: { type: "stdout" },
    info: { type: "file", filename: "info.log" },
    status: { type: "file", filename: "status.log" },
  },
  categories: {
    default: { appenders: ["out"], level: "debug" },
    status: { appenders: ["out", "status"], level: "debug" },
  },
});
export const normalLogger = log4js.getLogger();
export const statusLogger = log4js.getLogger("status");
statusLogger.error("status logger init");
normalLogger.level = "debug";
