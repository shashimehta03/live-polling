import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import '../styles/ChatWidget.css';

export default function ChatWidget({ userType, userName, userId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'participants'
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [participants, setParticipants] = useState([]);
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

        // Listen for participants updates
        socket.on('participants-update', (participantsList) => {
            setParticipants(participantsList);
        });

        // Listen for removal notification (students only)
        socket.on('removed-by-teacher', () => {
            alert('You have been removed from the session by the teacher.');
            window.location.href = '/';
        });

        return () => {
            socket.off('chat-history');
            socket.off('new-message');
            socket.off('participants-update');
            socket.off('removed-by-teacher');
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

    const handleRemoveStudent = (studentSocketId, studentName) => {
        socket.emit('remove-student', studentSocketId);
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderChatTab = () => (
        <>
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
        </>
    );

    const renderParticipantsTab = () => (
        <div className="participants-container">
            <div className="participants-header">
                <h4>All Participants ({participants.length})</h4>
                <div className="participants-stats">
                    <span className="connected-count">
                        Online: {participants.filter(p => p.isConnected).length}
                    </span>
                </div>
            </div>
            <div className="participants-list">
                {participants.length === 0 ? (
                    <div className="participants-empty">
                        <p>No participants yet.</p>
                    </div>
                ) : (
                    participants.map((participant) => (
                        <div key={participant.socketId} className={`participant-item ${!participant.isConnected ? 'disconnected' : ''}`}>
                            <div className="participant-info">
                                <span className="participant-icon">
                                    {participant.type === 'teacher' ? '👨‍🏫' : '👨‍🎓'}
                                </span>
                                <span className="participant-name">{participant.name}</span>
                                <span className="participant-type">
                                    {participant.type === 'teacher' ? 'Teacher' : 'Student'}
                                </span>
                                <span className={`connection-status ${participant.isConnected ? 'connected' : 'disconnected'}`}>
                                    {participant.isConnected ? '🟢 Online' : '🔴 Offline'}
                                </span>
                            </div>
                            {userType === 'teacher' && participant.type === 'student' && (
                                <button
                                    className="remove-student-btn"
                                    onClick={() => handleRemoveStudent(participant.socketId, participant.name)}
                                    title={`Remove ${participant.name}`}
                                >
                                    🗑️
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );

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

                    {/* Tab Navigation */}
                    <div className="chat-tabs">
                        <button
                            className={`chat-tab ${activeTab === 'chat' ? 'active' : ''}`}
                            onClick={() => setActiveTab('chat')}
                        >
                            💬 Chat
                        </button>
                        <button
                            className={`chat-tab ${activeTab === 'participants' ? 'active' : ''}`}
                            onClick={() => setActiveTab('participants')}
                        >
                            👥 Participants
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'chat' ? renderChatTab() : renderParticipantsTab()}
                </div>
            )}
        </div>
    );
} 