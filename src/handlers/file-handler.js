import fs from "fs";
import path from "path";
import { XML_FILE, LOG_PREFIX, START_DATE } from "../util/cnst.js";

export const appendToFile = (path, data) =>
  new Promise((resolve, reject) => {
    fs.appendFile(path, data, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

export const getBaseDir = () => {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  return process.pkg ? process.cwd() : path.join(__dirname, "../../");
};

export const getXmlPath = () => {
  const dir = getBaseDir();
  const xmlPath = path.join(dir, XML_FILE);
  if (!xmlPath.endsWith(".xml")) {
    console.error("File is not an XML file:", xmlPath);
    process.exit(1);
  }
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
  return xmlPath;
};

export const getLogPath = () => {
  const dir = path.join(getBaseDir(), "logs");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const p = path.resolve(
    dir,
    `${LOG_PREFIX}${START_DATE.toISOString().replace(/:/g, "-")}.log`
  );
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, "");
  }
  return p;
};

export const writeCertAndKey = (cert, key) => {
  const certPath = path.resolve(getBaseDir(), "cert.pem");
  const keyPath = path.resolve(getBaseDir(), "key.pem");
  if (!fs.existsSync(certPath) && !fs.existsSync(keyPath)) {
    fs.writeFileSync(certPath, cert);
    fs.writeFileSync(keyPath, key);
  } else {
    console.log("Cert and key already exist");
  }
};
