const path = require("path");
const fs = require("fs");
const express = require("express");

let xmlPath;

const promptForXmlPath = async () =>
  new Promise((resolve, reject) => {
    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    readline.question(
      "Enter the path to the XML file (Leave blank to attempt to auto resolve it. Seems to be broken): ",
      (p) => {
        xmlPath = path.resolve(p);
        readline.close();
        resolve();
      }
    );
  });

async function main() {
  await promptForXmlPath();
  if (!xmlPath) xmlPath = path.join(__dirname, "config.xml");
  if (fs.lstatSync(xmlPath).isDirectory()) {
    xmlPath = path.join(xmlPath, "config.xml");
  }
  if (!xmlPath.endsWith(".xml")) {
    console.error("File is not an XML file:", xmlPath);
    process.exit(1);
  }

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
    const json = convertXML(xml);
    res.send(json);
  };

  // helper function to serve the XML file
  const serveXml = (req, res) => {
    res.setHeader("Content-Type", "application/xml");
    res.sendFile(xmlPath);
  };

  // main function to serve the file
  const serveFile = (req, res) => {
    // if the request contains &json=1, serve the JSON file
    if (req.query.json) {
      return serveJson(req, res);
    }
    // otherwise, serve the XML file
    serveXml(req, res);
  };

  // create the express app on port 80 (server expects port 80)
  const port = process.env.PORT || 80;
  const app = express();
  app.get("*", serveFile);
  app.listen(port, () => {
    console.log(
      `Server is running on port ${port}\nPress Ctrl+C to stop the server.`
    );
  });
}

main();
