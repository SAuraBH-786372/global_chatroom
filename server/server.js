const WebSocket = require('ws');

const PORT = process.env.PORT || 5000;
const wss = new WebSocket.Server({ port: PORT });

let onlineUsers = 0; // Track the number of online users

console.log(`WebSocket server running on ws://localhost:${PORT}`);

// Function to broadcast online user count to all connected clients
const broadcastUserCount = () => {
    const userCountMessage = JSON.stringify({ type: "userCount", count: onlineUsers });
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(userCountMessage);
        }
    });
};

wss.on('connection', (ws) => {
    onlineUsers++; // Increase count when a new client connects
    console.log(`New client connected. Online Users: ${onlineUsers}`);

    broadcastUserCount(); // Send updated online users count

    ws.send(JSON.stringify({ user: "Server", text: "Welcome to the chatroom!" }));

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        
        // Broadcast the received message to all clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(parsedMessage));
            }
        });
    });

    ws.on('close', () => {
        onlineUsers = Math.max(0, onlineUsers - 1); // Decrease count when a client disconnects
        console.log(`Client disconnected. Online Users: ${onlineUsers}`);
        broadcastUserCount();
    });

    ws.on('error', (err) => {
        console.log('WebSocket error:', err);
    });
});
