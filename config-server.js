const path = require("path");
const fs = require("fs");
const express = require("express");
const process = require("process");

const xmlPathPrecursor = process.pkg ? process.cwd() : __dirname;

const appendToFile = (path, data) =>
  new Promise((resolve, reject) => {
    fs.appendFile(path, data, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

const deepCopy = (obj, cache = new WeakMap()) => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (cache.has(obj)) {
    return cache.get(obj);
  }
  const copy = Array.isArray(obj) ? [] : {};
  cache.set(obj, copy);
  Object.keys(obj).forEach((key) => {
    copy[key] = deepCopy(obj[key], cache);
  });
  return copy;
};

const getDuplicateKeys = (arr) => {
  const keys = {};
  const duplicates = {};
  for (let i = 0; i < arr.length; i++) {
    const obj = arr[i];
    for (const key in obj) {
      if (keys[key]) {
        duplicates[key] = true;
      }
      keys[key] = true;
    }
  }
  return Object.keys(duplicates);
};

const formatJson = (oldJson, req) => {
  if (Array.isArray(oldJson)) {
    return oldJson.map((json) => formatJson(json, req));
  } else if (typeof oldJson === "object") {
    let json = deepCopy(oldJson);
    if (json.content) return formatJson(json.content, req);
    if (json.OFP) return formatJson(json.OFP, req);
    if (json.children) {
      const duplicateKeys = getDuplicateKeys(json.children);
      if (duplicateKeys.length) {
        duplicateKeys.forEach((key) => {
          json[key] = json[key] || [];
          json[key].push(...json.children.map((c) => c[key]).filter((c) => c));
        });
        const otherChildren = json.children.filter(
          (c) => !duplicateKeys.some((key) => c[key])
        );
        json.children = otherChildren;
        return formatJson(json, req);
      }
      const children = {
        ...json.children.reduce((acc, child, i) => ({ ...acc, ...child }), {}),
      };
      const { children: _, ...rest } = json;
      json = {
        ...rest,
        ...children,
      };
      return formatJson(json, req);
    }
    Object.keys(json).forEach((key) => {
      json[key] = formatJson(json[key], req);
    });
    return json;
  } else if (typeof oldJson === "string") {
    // do nothing for now
    return oldJson;
  }
};

let xmlPath;

async function main() {
  const start = new Date();
  xmlPath = path.join(xmlPathPrecursor, "config.xml");
  if (!xmlPath.endsWith(".xml")) {
    console.error("File is not an XML file:", xmlPath);
    process.exit(1);
  }

  const logPath = path.resolve(
    path.dirname(xmlPath),
    `config-server-${start.toISOString().replace(/:/g, "-")}.log`
  );
  console.log("Logging to:", logPath);
  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, "");
  }

  const cleanLogs = async (logPath) => {
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
      .filter((log) => log.startsWith("config-server-"))
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

  await cleanLogs(path.dirname(logPath));

  console.log("Starting the server with xmlPath:", xmlPath);

  const { convertXML } = require("simple-xml-to-json");

  if (!fs.existsSync(xmlPath)) {
    fs.writeFileSync(
      xmlPath,
      `
    <config>
        <title>Enter your data in this file</title>
        <description>Enter your data in this file</description>
    </config>
    `
    );
  }

  // helper function to serve the JSON file
  const serveJson = (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const xml = fs.readFileSync(xmlPath, "utf8");
    let json = convertXML(xml);
    json = formatJson(json, req);
    res.send(json);
  };

  // helper function to serve the XML file
  const serveXml = (req, res) => {
    res.setHeader("Content-Type", "application/xml");
    res.sendFile(xmlPath);
  };

  const logRequest = async (req) => {
    await appendToFile(logPath, `Request: ${req.url}\n`);
    await appendToFile(logPath, `Time: ${new Date().toISOString()}\n`);
    await appendToFile(logPath, `Method: ${req.method}\n`);
    await appendToFile(logPath, `Headers: ${JSON.stringify(req.headers)}\n`);
    await appendToFile(logPath, `Body: ${JSON.stringify(req.body)}\n`);
    await appendToFile(
      logPath,
      `---------------------------------------------\n`
    );
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
  app2.listen(port2, () => {
    console.log(
      `Server is running on port ${port2}\nPress Ctrl+C to stop the server.`
    );
  });
}

main();
