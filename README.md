# XML/JSON file server

## Set up

1. [Get nodejs](https://nodejs.org/en/download/current)
2. Download the repository. You can do this by clicking the green "Code" button and then "Download ZIP". Then you'll have to extract the files to a directory of your choice.
3. If you're familiar with git, you can also clone the repository.
4. Open a terminal and navigate to the directory where you extracted the files.
5. Run `npm install` to install the required packages.

## Running the server

Run `npm start` to start the server

## Setting the host file (Windows)

If you want to 'spoof' a domain name, you can do this by setting the host file. This is useful if you want to test the server with a domain name.

1. Open Notepad as an administrator
2. Click on "File" and then "Open"
3. Navigate to `C:\Windows\System32\drivers\etc`
4. Change the file type to "All files"
5. Open the file called "hosts"
6. Add a new line at the bottom of the file with the following content: `127.0.0.1 localhost www.example.com` where `www.example.com` is the domain name you want to use.
