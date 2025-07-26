import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import '../styles/ChatWidget.css';

export default function ChatWidget({ userType, userName, userId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        // Register user type
        if (userType === 'teacher') {
            socket.emit('register-teacher');
        }

        // Listen for chat history
        socket.on('chat-history', (chatHistory) => {
            setMessages(chatHistory);
        });

        // Listen for new messages
        socket.on('new-message', (message) => {
            setMessages(prev => [...prev, message]);
        });

        return () => {
            socket.off('chat-history');
            socket.off('new-message');
        };
    }, [userType]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageData = {
            sender: userId,
            senderName: userName,
            message: newMessage.trim(),
            senderType: userType
        };

        socket.emit('send-message', messageData);
        setNewMessage('');
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="chat-widget">
            {/* Chat Toggle Button */}
            <button
                className="chat-toggle-btn"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? '✕' : '💬'}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <h3>Chat Room</h3>
                        <span className="chat-user-info">
                            {userType === 'teacher' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
                        </span>
                    </div>

                    <div className="chat-messages">
                        {messages.length === 0 ? (
                            <div className="chat-empty">
                                <p>No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`chat-message ${msg.senderType === userType ? 'own-message' : 'other-message'}`}
                                >
                                    <div className="message-header">
                                        <span className="message-sender">
                                            {msg.senderType === 'teacher' ? '👨‍🏫' : '👨‍🎓'} {msg.senderName}
                                        </span>
                                        <span className="message-time">{formatTime(msg.timestamp)}</span>
                                    </div>
                                    <div className="message-content">{msg.message}</div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chat-input-form" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="chat-input"
                            maxLength={200}
                        />
                        <button type="submit" className="chat-send-btn" disabled={!newMessage.trim()}>
                            ➤
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
} 