import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { FaUserCircle, FaPaperPlane, FaUsers, FaBell, FaBellSlash, FaMoon, FaSun, FaGlobe, FaLock, FaBolt, FaInfoCircle, FaTimes } from 'react-icons/fa';
import './App.css';

// Hardcoded WebSocket URL
const WS_URL = 'wss://global-chatroom-s8h4.onrender.com';

// About Modal Component
const AboutModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          <FaTimes />
        </button>
        <h2>About the Developer</h2>
        <div className="developer-info">
          <h3>Saurabh Joshi</h3>
          <p>Full Stack Developer</p>
          <p>Passionate about creating modern web applications with focus on user experience and real-time communication.</p>
          <div className="tech-stack">
            <h4>Technologies Used:</h4>
            <ul>
              <li>React.js</li>
              <li>Node.js</li>
              <li>WebSocket</li>
              <li>CSS3</li>
              <li>HTML5</li>
              <li>Javascript</li>
            </ul>
          </div>
          <div className="contact-info">
            <h4>Connect with me:</h4>
            <p>Email: saurabhjoshi1080.com</p>
            <p>GitHub: https://github.com/SAuraBH-786372/</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Generate a random color for users
const getRandomColor = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Memoized Message component for better performance
const Message = memo(({ msg, username, userColors, formatTimestamp }) => (
  <div className={`message ${msg.user === username ? 'sent' : msg.user === 'Server' ? 'server' : 'received'}`}>
    <div className="message-header">
      <FaUserCircle 
        className="user-icon" 
        style={{ color: msg.user === 'Server' ? '#808080' : userColors[msg.user] || '#4A90E2' }}
      />
      <span className="username" style={{ color: msg.user === 'Server' ? '#808080' : userColors[msg.user] || '#4A90E2' }}>
        {msg.user}
      </span>
      <span className="timestamp">{formatTimestamp(msg.timestamp)}</span>
    </div>
    <div className="message-content">{msg.text}</div>
  </div>
));

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [typingUser, setTypingUser] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [userColors, setUserColors] = useState({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const audioRef = useRef(new Audio('/notification.mp3'));
  const typingTimeoutRef = useRef(null);
  const [typingTimeout, setTypingTimeout] = useState(null);

  // Theme toggle handler
  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
    document.body.classList.toggle('dark-mode');
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const playNotification = useCallback(() => {
    if (notificationsEnabled && document.hidden) {
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
      setNotificationCount(prev => prev + 1);
      
      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification('New Message', {
          body: 'You have a new message in Global Chat',
          icon: '/chat-icon.png'
        });
      }
    }
  }, [notificationsEnabled]);

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Reset notification count when window gains focus
  useEffect(() => {
    const handleFocus = () => setNotificationCount(0);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleJoin = useCallback((e) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    if (trimmedUsername) {
      setHasJoined(true);
      setUserColors(prev => ({
        ...prev,
        [trimmedUsername]: getRandomColor()
      }));
      
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Create new WebSocket connection
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket Connected, sending join message');
        setIsConnected(true);
        // Send join message immediately after connection
        const joinMessage = {
          type: 'join',
          user: trimmedUsername
        };
        ws.send(JSON.stringify(joinMessage));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);

          if (data.type === 'userCount') {
            setOnlineUsers(data.count);
            return;
          }

          if (data.type === 'typing') {
            setTypingUser(data.user || '');
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => setTypingUser(''), 2000);
            return;
          }

          // Regular message
          setMessages(prevMessages => [...prevMessages, {
            user: data.user,
            text: data.text,
            timestamp: data.timestamp
          }]);

          // Play notification for new messages from others
          if (data.user !== trimmedUsername && data.user !== 'Server') {
            playNotification();
          }

          // Assign color to new users
          if (!userColors[data.user] && data.user !== 'Server') {
            setUserColors(prev => ({
              ...prev,
              [data.user]: getRandomColor()
            }));
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket Disconnected');
        setIsConnected(false);
        // Attempt to reconnect after a delay
        setTimeout(() => {
          console.log('Attempting to reconnect...');
          handleJoin(e);
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        setIsConnected(false);
      };
    }
  }, [username, userColors, playNotification]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    const trimmedMessage = inputMessage.trim();
    if (trimmedMessage && wsRef.current?.readyState === WebSocket.OPEN && hasJoined) {
      const message = {
        text: trimmedMessage,
        user: username.trim()
      };
      wsRef.current.send(JSON.stringify(message));
      setInputMessage('');
    }
  }, [inputMessage, username, hasJoined]);

  const handleTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && hasJoined) {
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set new timeout
      const newTimeout = setTimeout(() => {
        wsRef.current.send(JSON.stringify({ type: 'typing', user: username.trim() }));
      }, 500); // Wait for 500ms before sending typing indicator
      
      setTypingTimeout(newTimeout);
    }
  }, [username, hasJoined, typingTimeout]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  const formatTimestamp = useCallback((timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const toggleNotifications = useCallback(() => {
    setNotificationsEnabled(prev => !prev);
    setNotificationCount(0);
  }, []);

  if (!hasJoined) {
    return (
      <div className={`app-container ${isDarkMode ? 'dark-mode' : ''}`}>
        <div className="join-container">
          <h1>Join Global Chat</h1>
          <p>Connect with people from around the world in real-time! Experience seamless communication with our modern chat platform.</p>
          <form onSubmit={handleJoin}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              maxLength={20}
              required
            />
            <button type="submit">Start Chatting</button>
          </form>
          <div className="features-list">
            <div className="feature-item">
              <FaGlobe className="feature-icon" />
              <span>Global Access</span>
            </div>
            <div className="feature-item">
              <FaBolt className="feature-icon" />
              <span>Real-time Chat</span>
            </div>
            <div className="feature-item">
              <FaLock className="feature-icon" />
              <span>Secure Connection</span>
            </div>
          </div>
          <button className="about-button" onClick={() => setIsAboutOpen(true)} title="About Developer">
            <FaInfoCircle />
          </button>
        </div>
        <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      </div>
    );
  }

  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="chat-container">
        <div className="chat-header">
          <div className="header-info">
            <h2>Global Chat</h2>
            <div className="header-controls">
              <button 
                className="control-button"
                onClick={() => setShowUserList(!showUserList)}
                title="Show/Hide Online Users"
              >
                <FaUsers /> {onlineUsers}
              </button>
              <button 
                className="control-button notification-button"
                onClick={toggleNotifications}
                title={notificationsEnabled ? "Disable Notifications" : "Enable Notifications"}
              >
                {notificationsEnabled ? <FaBell /> : <FaBellSlash />}
                {notificationCount > 0 && <span className="notification-badge">{notificationCount}</span>}
              </button>
              <button
                className="control-button"
                onClick={toggleTheme}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <FaSun /> : <FaMoon />}
              </button>
              <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        <div className="chat-content">
          {showUserList && (
            <div className="online-users-panel">
              <h3>Online Users ({onlineUsers})</h3>
              <div className="user-list">
                <div className="user-item">
                  <FaUserCircle style={{ color: userColors[username] }} />
                  {username} (You)
                </div>
                {/* Other online users would be listed here */}
              </div>
            </div>
          )}

          <div className="messages-container">
            {messages.map((msg, index) => (
              <Message
                key={index}
                msg={msg}
                username={username}
                userColors={userColors}
                formatTimestamp={formatTimestamp}
              />
            ))}
            {typingUser && typingUser !== username && (
              <div className="typing-indicator">
                {typingUser} is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form className="message-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleTyping}
            placeholder="Type a message..."
            maxLength={500}
          />
          <button type="submit" disabled={!inputMessage.trim() || !isConnected}>
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;

