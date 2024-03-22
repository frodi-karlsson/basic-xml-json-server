import path from "path";
import fs from "fs";
import express from "express";
import https from "https";
import { formatJson } from "./handlers/json-handler.js";
import { cleanLogs, logRequest, logResponse } from "./handlers/log-handler.js";
import {
  getXmlPath,
  getLogPath,
  writeCertAndKey,
} from "./handlers/file-handler.js";
import { getCertAndKey } from "./handlers/cert-handler.js";
import pkg from "simple-xml-to-json";
const { convertXML } = pkg;
import zlib from "zlib";

async function main() {
  const { cert, key } = getCertAndKey("www.simbrief.com");
  writeCertAndKey(cert, key);
  const xmlPath = getXmlPath();
  const logPath = getLogPath();

  console.log("Logging to:", logPath);

  await cleanLogs(path.dirname(logPath));

  console.log("Starting the server with xmlPath:", xmlPath);

  const checkForJson = () => {
    const jsonPath = xmlPath.replace(".xml", ".json");
    if (fs.existsSync(jsonPath)) {
      return jsonPath;
    }
  };

  // helper function to serve the JSON file
  const serveJson = (req, res, next) => {
    const xml = fs.readFileSync(xmlPath, "utf8");
    // You can set up your own json file to serve
    const existingJsonPath = checkForJson();
    if (existingJsonPath) {
      const json = fs.readFileSync(existingJsonPath, "utf8");
      return res.status(200).send(json);
    }
    // But it's also possible to convert your XML file to JSON
    let json = convertXML(xml);
    json = formatJson(json, req);
    res.status(200);
    res.body = JSON.stringify(json);
  };

  // helper function to serve the XML file
  const serveXml = (req, res, next) => {
    const xml = fs.readFileSync(xmlPath, "utf8");
    res.status(200);
    res.body = xml;
  };

  const setHeaders = (req, res, next) => {
    console.log("Setting headers...");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Vary", "Accept-Encoding");
    if (req.headers["accept-encoding"]?.includes("gzip")) {
      res.setHeader("Content-Encoding", "gzip");
    }
    if (req.query?.json) {
      res.setHeader("Content-Type", "application/json");
    } else {
      res.setHeader("Content-Type", "application/xml");
    }

    next();
  };

  // main function to serve the file
  const serveFile = async (req, res, next) => {
    try {
      await logRequest(req);
    } catch (e) {
      console.error("Error logging request:", e);
      return res.status(500).end("Error logging request");
    }
    // if the request contains &json=1, serve the JSON file
    if (res.getHeader("Content-Type") === "application/json") {
      try {
        serveJson(req, res);
      } catch (e) {
        console.error("Error serving JSON:", e);
        return res.status(500).end("Error serving JSON");
      }
    } else {
      // otherwise, serve the XML file
      try {
        serveXml(req, res);
      } catch (e) {
        console.error("Error serving XML:", e);
        return res.status(500).end("Error serving XML");
      }
    }

    next();
  };

  const gzip = (req, res, next) => {
    if (!res.body || !req.acceptsEncodings("gzip")) {
      return next();
    }
    console.log("Gzipping response:", res.body);
    zlib.gzip(res.body, (err, buffer) => {
      if (err) {
        console.error("Error gzipping response:", err);
        return res.status(500).send("Error gzipping response");
      }
      res.body = buffer;
      next();
    });
  };

  const sendResponse = async (req, res, next) => {
    res.send(res.body);
    await logResponse(res);
    next();
  };

  // create the express app on port 80 (for the main client)
  const port = 80;
  const app = express();
  app.use(setHeaders);
  app.use("*", serveFile);
  app.use(gzip);
  app.use(sendResponse);
  app.listen(port, () => {
    console.log(
      `Server is running on port ${port}\nPress Ctrl+C to stop the server.`
    );
  });

  // create the express app on port 443 (for the simulated tablet)
  const port2 = 443;
  const app2 = express();
  app2.use(setHeaders);
  app2.use("*", serveFile);
  app2.use(gzip);
  app2.use(sendResponse);
  const server = https.createServer({ cert, key }, app2);
  server.listen(port2, () => {
    console.log(
      `Server is running on port ${port2}\nPress Ctrl+C to stop the server.`
    );
  });
}

main();
