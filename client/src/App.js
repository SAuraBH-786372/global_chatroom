import React, { useState, useEffect, useCallback } from 'react';
import { FaInfoCircle } from 'react-icons/fa'; // Import the About icon
import './App.css';

let socket;

const App = () => {
    const [username, setUsername] = useState('');
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [isNameSet, setIsNameSet] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(0);

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
        
                if (receivedMessage.user !== username) {  
                    // Use Web Audio API for better browser support
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    fetch('/notification.mp3')
                        .then(response => response.arrayBuffer())
                        .then(data => audioContext.decodeAudioData(data))
                        .then(buffer => {
                            const source = audioContext.createBufferSource();
                            source.buffer = buffer;
                            source.connect(audioContext.destination);
                            source.start(0);
                        })
                        .catch(error => console.log("Audio play failed:", error));
                }
            }
        };
        

        socket.onclose = () => {
            console.log('WebSocket disconnected, reconnecting in 3 seconds...');
            setTimeout(connectWebSocket, 3000);
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
            const msgObj = {
                user: username,
                text: message,
                timestamp: new Date().toISOString(), // Store timestamp in ISO format
            };
            socket.send(JSON.stringify(msgObj));
            setMessage('');
        }
    };

    const formatTimestamp = (isoString) => {
        if (!isoString) return ""; // If timestamp is missing, return empty
        const date = new Date(isoString);
        const now = new Date();

        // Check if message was sent today
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        } else {
            return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
        }
    };

    const [userColors, setUserColors] = useState({});

    // Function to get or assign a color
    const getUserColor = (user) => {
        if (!userColors[user]) {
            const randomColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
            setUserColors((prevColors) => ({ ...prevColors, [user]: randomColor }));
            return randomColor;
        }
        return userColors[user];
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
                            <div key={index} className={`message ${msg.user === username ? "sent" : "received"}`}
                                style={{ backgroundColor: msg.user === username ? "#4CAF50" : getUserColor(msg.user) }}>
                                <strong>{msg.user}:</strong> {msg.text}
                                <span className="timestamp">{formatTimestamp(msg.timestamp)}</span> 
                            </div>
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

            {/* Fancy About Button below the chat container */}
            <div className="about-button-container">
                <a href="about.html" className="about-button">
                    <FaInfoCircle className="about-icon" />
                    About
                </a>
            </div>
        </div>
    );
};

export default App;
