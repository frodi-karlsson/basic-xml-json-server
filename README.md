# XML/JSON file server

## Installation

Get the latest binary [here](https://github.com/frodi-karlsson/basic-xml-json-server/releases/latest/download/config-server.exe).

## Usage

1. Run the server by double-clicking the binary.
2. Replace/edit the example config.xml file with your own XML file. The server will serve this file when queried.
3. Open a web browser and navigate to `http://localhost:80` to see the XML file.
4. CTRL+C to stop the server.

## Setting the host file (Windows)

If you want to 'spoof' a domain name, you can do this by setting the host file. This is useful if you want to test the server with a domain name.

1. Open Notepad as an administrator
2. Click on "File" and then "Open"
3. Navigate to `C:\Windows\System32\drivers\etc`
4. Change the file type to "All files"
5. Open the file called "hosts"
6. Add a new line at the bottom of the file with the following content: `127.0.0.1 localhost www.example.com` where `www.example.com` is the domain name you want to use.

## Notes

The server will run on port 80 by default, which is the default http port. It's possible that the program that's querying the server will be expecting https. If that's the case, it'll have to be changed to self-certed https and the port to 443. Let me know 🤙
