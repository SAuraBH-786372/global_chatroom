const WebSocket = require('ws');

const PORT = process.env.PORT || 5000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server running on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.send(JSON.stringify({ user: "Server", text: "Welcome to the chatroom!" }));

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);

        // Broadcast message to all clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(parsedMessage));
            }
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });

    ws.on('error', (err) => {
        console.log('WebSocket error:', err);
    });
});
