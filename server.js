const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs'); // File System module for logging

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Route to serve the HTML file for the '/ssh' path
app.get('/ssh', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Function to log data to a file
function logToFile(data) {
    const logEntry = `${new Date().toISOString()} - ${data}\n`;
    fs.appendFile('server-log.txt', logEntry, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
}

wss.on('connection', (ws) => {
    let sshConnection;
    let sshStream;

    // Handle incoming WebSocket messages (user input)
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        logToFile(`Received WebSocket message: ${JSON.stringify(data)}`);

        if (data.type === 'start-ssh') {
            const { hostname, username, password, logLevel } = data;

            sshConnection = new Client();
            sshConnection.on('ready', () => {
                ws.send(JSON.stringify({ type: 'connected' })); // Notify client that SSH is ready
                ws.send(JSON.stringify({ type: 'output', data: 'SSH connection established.\r\n' }));
                logToFile('SSH connection established.');

                sshConnection.shell((err, stream) => {
                    if (err) {
                        ws.send(JSON.stringify({ type: 'output', data: `Shell error: ${err.message}\r\n` }));
                        logToFile(`Shell error: ${err.message}`);
                        return;
                    }

                    sshStream = stream;

                    // Listen for data coming from the SSH server
                    stream.on('data', (data) => {
                        ws.send(JSON.stringify({ type: 'output', data: data.toString('utf-8') }));
                        logToFile(`SSH data: ${data.toString('utf-8')}`);
                    });

                    // Listen for stream close event
                    stream.on('close', () => {
                        ws.send(JSON.stringify({ type: 'output', data: 'SSH connection closed.\r\n' }));
                        sshConnection.end();
                        logToFile('SSH connection closed.');
                    });
                });
            }).on('error', (err) => {
                ws.send(JSON.stringify({ type: 'output', data: `Connection error: ${err.message}\r\n` }));
                logToFile(`Connection error: ${err.message}`);
            }).connect({
                host: hostname,
                port: 22,
                username,
                password,
                debug: (info) => {
                    if (logLevel === 'debug') {
                        ws.send(JSON.stringify({ type: 'output', data: `[DEBUG] ${info}\r\n` }));
                        logToFile(`[DEBUG] ${info}`);
                    }
                }
            });
        } else if (data.type === 'input' && sshStream) {
            // Ensure this block is outside of the sshConnection.shell() setup
            sshStream.write(data.data);
            logToFile(`Sent to SSH: ${data.data}`);
        }
    });

    ws.on('close', () => {
        if (sshConnection) sshConnection.end();
        logToFile('WebSocket connection closed');
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
    logToFile('Server started on port 3000');
});
