import React from "react";
import { Link } from "react-router-dom";
import "./About.css";

const About = () => {
    return (
        <div className="about-container">
            <h2>About This Chatroom</h2>
            <p>
                This real-time chatroom is built using WebSockets and React. 
                It allows instant global communication without storing chat history.
            </p>
            
            {/* Back to Chatroom Button */}
            <Link to="/">
                <button className="back-button">⬅️ Back to Chat</button>
            </Link>
        </div>
    );
};

export default About;
