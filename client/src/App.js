import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
let socket; // Declare a single socket instance

const App = () => {
    const [username, setUsername] = useState('');
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [isNameSet, setIsNameSet] = useState(false);

    const connectWebSocket = useCallback(() => {
        if (socket) return; // Prevent duplicate connections

        socket = new WebSocket(`https://global-chatroom.onrender.com`);

        socket.onopen = () => {
            console.log('Connected to WebSocket server');
        };

        socket.onmessage = (event) => {
            const receivedMessage = JSON.parse(event.data);
            setMessages((prevMessages) => [...prevMessages, receivedMessage]);
        };

        socket.onclose = () => {
            console.log('WebSocket disconnected, reconnecting...');
            setTimeout(connectWebSocket, 3000); // Reconnect after 3 seconds
        };

        socket.onerror = (err) => {
            console.log('WebSocket error:', err);
        };
    }, []);

    useEffect(() => {
        connectWebSocket();

        return () => {
            if (socket) {
                socket.close();
                socket = null;
            }
        };
    }, [connectWebSocket]);

    const handleSetUsername = () => {
        if (username.trim()) {
            setIsNameSet(true);
        }
    };

    const sendMessage = () => {
        if (message.trim() && socket.readyState === WebSocket.OPEN) {
            const msgObj = { user: username, text: message };
            socket.send(JSON.stringify(msgObj));
            setMessage('');
        }
    };

    return (
        <div className="chat-container">
            <h2>Global Chatroom</h2>

            {!isNameSet ? (
                <div className="username-container">
                    <input
                        type="text"
                        placeholder="Enter your name..."
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <button onClick={handleSetUsername}>Join Chat</button>
                </div>
            ) : (
                <>
                    <div className="chat-box">
                        {messages.map((msg, index) => (
                            <p key={index}>
                                <strong>{msg.user}:</strong> {msg.text}
                            </p>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                    />
                    <button onClick={sendMessage}>Send</button>
                </>
            )}
        </div>
    );
};

export default App;
