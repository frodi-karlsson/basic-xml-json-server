import fs from "fs";
import path from "path";
import { LOG_PREFIX } from "../util/cnst.js";

export const cleanLogs = async (logPath) => {
  const logs = await new Promise((resolve, reject) => {
    fs.readdir(logPath, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
  const logsToDelete = logs
    .filter((log) => log.startsWith(LOG_PREFIX))
    .sort()
    .slice(0, -5);
  logsToDelete.forEach(async (log) => {
    await new Promise((resolve, reject) => {
      fs.unlink(path.join(logPath, log), (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};
