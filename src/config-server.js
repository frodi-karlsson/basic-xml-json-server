import path from "path";
import fs from "fs";
import express from "express";
import https from "https";
import { formatJson } from "./handlers/json-handler.js";
import { cleanLogs } from "./handlers/log-handler.js";
import {
  logRequest,
  getXmlPath,
  getLogPath,
  writeCertAndKey,
} from "./handlers/file-handler.js";
import { getCertAndKey } from "./handlers/cert-handler.js";
import pkg from "simple-xml-to-json";
const { convertXML } = pkg;

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
  const serveJson = (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const xml = fs.readFileSync(xmlPath, "utf8");
    const existingJsonPath = checkForJson();
    if (existingJsonPath) {
      const json = fs.readFileSync(existingJsonPath, "utf8");
      return res.send(json);
    }
    let json = convertXML(xml);
    json = formatJson(json, req);
    res.send(json);
  };

  // helper function to serve the XML file
  const serveXml = (req, res) => {
    res.setHeader("Content-Type", "application/xml");
    res.sendFile(xmlPath);
  };

  // main function to serve the file
  const serveFile = (req, res) => {
    try {
      logRequest(req);
    } catch (e) {
      console.error("Error logging request:", e);
      return res.status(500).send("Error logging request");
    }
    // if the request contains &json=1, serve the JSON file
    if (req.query.json) {
      try {
        return serveJson(req, res);
      } catch (e) {
        console.error("Error serving JSON:", e);
        return res.status(500).send("Error serving JSON");
      }
    }
    // otherwise, serve the XML file
    try {
      return serveXml(req, res);
    } catch (e) {
      console.error("Error serving XML:", e);
      return res.status(500).send("Error serving XML");
    }
  };

  // create the express app on port 80 (for the main client)
  const port = 80;
  const app = express();
  app.get("*", serveFile);
  app.listen(port, () => {
    console.log(
      `Server is running on port ${port}\nPress Ctrl+C to stop the server.`
    );
  });

  // create the express app on port 443 (for the simulated tablet)
  const port2 = 443;
  const app2 = express();
  app2.get("*", serveFile);
  const server = https.createServer({ cert, key }, app2);
  server.listen(port2, () => {
    console.log(
      `Server is running on port ${port2}\nPress Ctrl+C to stop the server.`
    );
  });
}

main();
