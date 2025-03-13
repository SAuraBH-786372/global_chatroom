import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

let socket;

const App = () => {
    const [username, setUsername] = useState('');
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [isNameSet, setIsNameSet] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(0);

    // Wrap connectWebSocket inside useCallback
    const connectWebSocket = useCallback(() => {
        if (socket) return;

        socket = new WebSocket(`wss://global-chatroom.onrender.com`);


        socket.onopen = () => {
            console.log('Connected to WebSocket server');
        };

        socket.onmessage = (event) => {
            const receivedMessage = JSON.parse(event.data);
            if (receivedMessage.type === "userCount") {
                setOnlineUsers(receivedMessage.count);
            } else {
                setMessages((prevMessages) => [...prevMessages, receivedMessage]);
            }
        };

        socket.onclose = () => {
            console.log('WebSocket disconnected, reconnecting in 3 seconds...');
            setTimeout(connectWebSocket, 3000);
        };

        socket.onerror = (err) => {
            console.log('WebSocket error:', err);
        };
    }, []); // Empty dependency array ensures it's only created once

    // useEffect with correct dependency
    useEffect(() => {
        connectWebSocket();

        return () => {
            if (socket) {
                socket.close();
                socket = null;
            }
        };
    }, [connectWebSocket]); // ✅ Add connectWebSocket as a dependency

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
            <p>🟢 {onlineUsers} masterminds online… and somehow, YOU made the list 🫵🤔</p>

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
