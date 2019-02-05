const http = require('http');
const https = require('https');
const url = require('url');

const server = http.createServer((req, res) => {

    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    res.setHeader('Content-type', 'application/json');
    const response = {
        'response': 'Hello Mr Niceguy!!'
    };


    if (trimmedPath === "hello")
        res.end(JSON.stringify(response));
    else
        res.end("request recieved at: " + trimmedPath);
});

server.listen(3000, () => {
    console.log("server listening in 3000");
});