const path = require('path');
const fs = require('fs');
const express = require('express');
const xmlPath = path.join(__dirname, 'config.xml');

const xml2json = require('xml2json');



// helper function to serve the JSON file
const serveJson = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const xml = fs.readFileSync(xmlPath, 'utf8');
    const json = xml2json.toJson(xml);
    res.send(json);
}

// helper function to serve the XML file
const serveXml = (req, res) => {
    res.setHeader('Content-Type', 'application/xml');
    res.sendFile(xmlPath);
}

// main function to serve the file
const serveFile = (req, res) => {
    // if the request contains &json=1, serve the JSON file
    if (req.query.json) {
        return serveJson(req, res);
    }
    // otherwise, serve the XML file
    serveXml(req, res);
}

// create the express app on port 3000
const app = express();
app.get('*', serveFile);
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});