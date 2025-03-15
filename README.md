# Global Chatroom

A real-time chat application built with React and WebSocket, featuring a modern and responsive UI.

## Features

- Real-time messaging using WebSocket
- User presence indicators
- Sound notifications for new messages
- Responsive design for mobile and desktop
- Message timestamps
- Connection status indicator
- Mutable sound notifications
- Server messages for user join/leave events

## Tech Stack

- Frontend:
  - React
  - WebSocket API
  - React Icons
  - Modern CSS with CSS Variables

- Backend:
  - Node.js
  - ws (WebSocket library)
  - dotenv for environment variables

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/global-chatroom.git
cd global-chatroom
```

2. Install dependencies for both server and client:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Create a `.env` file in the server directory:
```bash
PORT=5000
```

### Running the Application

1. Start the server:
```bash
cd server
npm start
```

2. In a new terminal, start the client:
```bash
cd client
npm start
```

The application will be available at `http://localhost:3000`

## Environment Variables

### Server
- `PORT`: The port number for the WebSocket server (default: 5000)

### Client
- `REACT_APP_WEBSOCKET_URL`: WebSocket server URL (default: wss://global-chatroom.onrender.com)

## Deployment

The application is deployed on:
- Frontend: Vercel/Netlify
- Backend: Render

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- React Icons for the beautiful icons
- ws library for the WebSocket implementation
