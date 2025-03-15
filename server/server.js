require('dotenv').config();
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Basic route for health check
app.get('/', (req, res) => {
    res.send('WebSocket Server is running');
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ 
    server,
    // Enable client tracking
    clientTracking: true,
});

let onlineUsers = 0;
const connectedClients = new Map(); // Track clients with their usernames

console.log(`WebSocket server running on port ${PORT}`);

// Function to broadcast message to all connected clients
const broadcast = (message, excludeClient = null) => {
    const messageString = JSON.stringify(message);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client !== excludeClient) {
            try {
                client.send(messageString);
            } catch (error) {
                console.error('Error broadcasting message:', error);
            }
        }
    });
};

// Function to broadcast online user count
const broadcastUserCount = () => {
    const message = { type: "userCount", count: onlineUsers };
    broadcast(message);
};

// Function to broadcast typing indicator
const broadcastTyping = (username) => {
    const message = {
        type: "typing",
        user: username,
        timestamp: new Date().toISOString()
    };
    broadcast(message);
};

// Function to validate message
const validateMessage = (message) => {
    if (!message || typeof message !== 'object') return false;
    
    // Join message validation
    if (message.type === 'join') {
        return typeof message.user === 'string' && message.user.trim().length > 0;
    }
    
    // Typing message validation
    if (message.type === 'typing') {
        return true; // No additional validation needed for typing
    }
    
    // Regular message validation
    if (!message.type) {
        return typeof message.text === 'string' && message.text.trim().length > 0;
    }
    
    return true;
};

wss.on('connection', (ws) => {
    onlineUsers++;
    console.log(`New client connected. Online Users: ${onlineUsers}`);
    broadcastUserCount();
    
    // Send welcome message
    ws.send(JSON.stringify({ 
        type: "message",
        user: "Server", 
        text: "Welcome to the chatroom! Please be respectful and enjoy your chat.", 
        timestamp: new Date().toISOString() 
    }));

    let messageTimeout;
    let lastTypingTime = 0;

    ws.on('message', (data) => {
        try {
            const parsedMessage = JSON.parse(data.toString());
            console.log('Received message:', parsedMessage);

            // Handle join message
            if (parsedMessage.type === 'join') {
                const username = parsedMessage.user.trim();
                if (username) {
                    connectedClients.set(ws, username);
                    console.log(`User ${username} joined`);
                    
                    // Broadcast join message
                    broadcast({
                        type: "message",
                        user: "Server",
                        text: `${username} joined the chat`,
                        timestamp: new Date().toISOString()
                    });
                }
                return;
            }

            const username = connectedClients.get(ws);
            
            // Handle typing message
            if (parsedMessage.type === 'typing' && username) {
                const now = Date.now();
                // Only broadcast typing if it's been more than 2 seconds since last broadcast
                if (now - lastTypingTime > 2000) {
                    lastTypingTime = now;
                    if (messageTimeout) {
                        clearTimeout(messageTimeout);
                    }
                    messageTimeout = setTimeout(() => {
                        broadcastTyping('');
                    }, 2000);
                    broadcastTyping(username);
                }
                return;
            }

            // Handle chat message
            if (username && parsedMessage.text) {
                const chatMessage = {
                    type: "message",
                    user: username,
                    text: parsedMessage.text.trim().slice(0, 500),
                    timestamp: new Date().toISOString()
                };
                console.log('Broadcasting message:', chatMessage);
                broadcast(chatMessage);
            } else if (!username) {
                ws.send(JSON.stringify({
                    type: "message",
                    user: "Server",
                    text: "Please join the chat first to send messages.",
                    timestamp: new Date().toISOString()
                }));
            }
        } catch (error) {
            console.error('Error processing message:', error);
            ws.send(JSON.stringify({
                type: "message",
                user: "Server",
                text: "Error processing your message. Please try again.",
                timestamp: new Date().toISOString()
            }));
        }
    });

    ws.on('close', () => {
        const username = connectedClients.get(ws);
        if (username) {
            broadcast({
                type: "message",
                user: "Server",
                text: `${username} left the chat`,
                timestamp: new Date().toISOString()
            });
            connectedClients.delete(ws);
            console.log(`User ${username} left`);
        }
        
        onlineUsers = Math.max(0, onlineUsers - 1);
        console.log(`Client disconnected. Online Users: ${onlineUsers}`);
        broadcastUserCount();
        
        if (messageTimeout) {
            clearTimeout(messageTimeout);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        try {
            ws.send(JSON.stringify({
                user: "Server",
                text: "An error occurred with your connection. Please try reconnecting.",
                timestamp: new Date().toISOString()
            }));
        } catch (e) {
            console.error('Error sending error message:', e);
        }
    });
});

// Handle server errors
wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
});

// Cleanup on server shutdown
const cleanup = () => {
    console.log('Cleaning up before shutdown...');
    wss.clients.forEach((client) => {
        try {
            client.send(JSON.stringify({
                user: "Server",
                text: "Server is shutting down. Please try reconnecting in a few moments.",
                timestamp: new Date().toISOString()
            }));
            client.close();
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    });
    wss.close(() => {
        console.log('WebSocket server closed');
        process.exit(0);
    });
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// Start the server
server.listen(PORT, () => {
    console.log(`HTTP/WebSocket server is running on port ${PORT}`);
});
