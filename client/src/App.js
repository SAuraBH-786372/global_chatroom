import React, { useState, useEffect, useCallback } from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import './App.css';

let socket;
let hasJoined = false; // Track if the welcome message has already been sent

const App = () => {
    const [username, setUsername] = useState('');
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [isNameSet, setIsNameSet] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const chatBoxRef = React.useRef(null);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);

    const connectWebSocket = useCallback(() => {
        if (socket) return;

        socket = new WebSocket('wss://global-chatroom.onrender.com');

        socket.onopen = () => {
            console.log('Connected to WebSocket server');
            if (isNameSet && !hasJoined) {
                socket.send(JSON.stringify({ type: 'join', user: username }));
                hasJoined = true; // Ensure welcome message is sent only once
            }
        };

        document.addEventListener(
            'click',
            () => {
                setSoundEnabled(true);
            },
            { once: true }
        );

        socket.onmessage = (event) => {
            const receivedMessage = JSON.parse(event.data);

            if (receivedMessage.type === 'userCount') {
                setOnlineUsers(receivedMessage.count);
            } else if (
                receivedMessage.user === 'Server' &&
                receivedMessage.text === 'Welcome to the chatroom!' &&
                messages.some((msg) => msg.text === 'Welcome to the chatroom!')
            ) {
                return; // Ignore duplicate welcome messages
            } else {
                setMessages((prevMessages) => [...prevMessages, receivedMessage]);

                if (receivedMessage.user !== username && soundEnabled) {
                    playNotificationSound();
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
    }, [username, isNameSet, soundEnabled, messages]);

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
            if (socket && socket.readyState === WebSocket.OPEN) {
                const joinMessage = {
                    user: 'Server',
                    text: `${username} joined the chat`,
                    timestamp: new Date().toISOString(),
                };
                socket.send(JSON.stringify({ type: 'join', user: username }));
                setMessages((prevMessages) => [...prevMessages, joinMessage]); // Display join message
            }
        }
    };

    const sendMessage = () => {
        if (message.trim() && socket && socket.readyState === WebSocket.OPEN) {
            const msgObj = {
                user: username,
                text: message.trim(), // Ensure empty messages are not sent
                timestamp: new Date().toISOString(),
            };
            socket.send(JSON.stringify(msgObj));
            setMessage('');
        }
    };

    useEffect(() => {
        if (isNameSet && socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'join', user: username }));
        }
    }, [isNameSet]);

    const playNotificationSound = () => {
        const audio = new Audio('/notification.mp3');
        audio.play().catch((error) => console.warn('Audio playback prevented:', error));
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
                    <div className="chat-box" ref={chatBoxRef}>
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`message ${msg.user === username ? 'sent' : 'received'}`}
                                style={{
                                    backgroundColor: msg.user === username ? '#4CAF50' : msg.user === 'Server' ? '#f0f0f0' : '#0084ff',
                                    fontStyle: msg.user === 'Server' ? 'italic' : 'normal',
                                    textAlign: msg.user === 'Server' ? 'center' : 'left',
                                    color: msg.user === 'Server' ? '#333' : '#fff',
                                    padding: '8px',
                                    borderRadius: '10px',
                                    margin: '5px 0',
                                }}
                            >
                                <strong>{msg.user !== 'Server' ? `${msg.user}:` : ''}</strong> {msg.text}
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
