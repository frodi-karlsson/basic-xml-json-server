import fs from "fs";
import path from "path";
import zlib from "zlib";
import { LOG_PREFIX } from "../util/cnst.js";
import { getLogPath, appendToFile } from "./file-handler.js";

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

export const logRequest = async (req) => {
  const logPath = getLogPath();
  await appendToFile(logPath, `Request: ${req.url}\n`);
  await appendToFile(logPath, `Time: ${new Date().toISOString()}\n`);
  await appendToFile(logPath, `Method: ${req.method}\n`);
  await appendToFile(logPath, `Headers: ${JSON.stringify(req.headers)}\n`);
  await appendToFile(logPath, `Body: ${JSON.stringify(req.body)}\n`);
  await appendToFile(logPath, "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n");
};

const unGzip = (buffer) =>
  new Promise((resolve, reject) => {
    zlib.gunzip(buffer, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.toString());
      }
    });
  });

export const logResponse = async (res) => {
  const logPath = getLogPath();
  await appendToFile(logPath, "-   Response Generated:  -\n");
  await appendToFile(logPath, `Status: ${res.statusCode}\n`);
  await appendToFile(logPath, `Headers: ${JSON.stringify(res.getHeaders())}\n`);
  await appendToFile(logPath, `Body: ${res.body}\n`);
  if (res.getHeaders()["content-encoding"] === "gzip") {
    await appendToFile(logPath, `Unzipped Body: ${await unGzip(res.body)}\n`);
  }
  await appendToFile(logPath, "------------------------------------------\n");
};
