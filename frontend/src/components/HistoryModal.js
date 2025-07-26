import React from 'react';
import '../styles/HistoryModal.css';

export default function HistoryModal({ isOpen, onClose, pollHistory }) {
    if (!isOpen) return null;

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <div className="history-modal-overlay" onClick={onClose}>
            <div className="history-modal" onClick={(e) => e.stopPropagation()}>
                <div className="history-modal-header">
                    <h2>Poll History</h2>
                    <button className="history-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="history-modal-content">
                    {pollHistory.length === 0 ? (
                        <div className="history-empty">
                            <p>No previous polls found.</p>
                        </div>
                    ) : (
                        <div className="history-list">
                            {pollHistory.map((poll, index) => (
                                <div key={index} className="history-item">
                                    <div className="history-item-header">
                                        <h3>Question {pollHistory.length - index}</h3>
                                        <span className="history-timestamp">{formatDate(poll.timestamp)}</span>
                                    </div>

                                    <div className="history-question">
                                        <strong>Question:</strong> {poll.question}
                                    </div>

                                    <div className="history-options">
                                        <strong>Options:</strong>
                                        <ul>
                                            {poll.options.map((option, optIndex) => (
                                                <li key={optIndex} className={option === poll.correctAnswer ? 'correct-option' : ''}>
                                                    {option} {option === poll.correctAnswer && '✅'}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="history-stats">
                                        <div className="history-stat-item">
                                            <span className="stat-label">Total Students:</span>
                                            <span className="stat-value">{poll.totalStudents}</span>
                                        </div>
                                        <div className="history-stat-item correct">
                                            <span className="stat-label">Correct Answers:</span>
                                            <span className="stat-value">{poll.correctAnswers}</span>
                                        </div>
                                        <div className="history-stat-item incorrect">
                                            <span className="stat-label">Incorrect Answers:</span>
                                            <span className="stat-value">{poll.incorrectAnswers}</span>
                                        </div>
                                        <div className="history-stat-item">
                                            <span className="stat-label">Success Rate:</span>
                                            <span className="stat-value">
                                                {poll.totalStudents > 0 ? Math.round((poll.correctAnswers / poll.totalStudents) * 100) : 0}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="history-answers">
                                        <strong>Student Answers:</strong>
                                        <div className="history-answers-list">
                                            {poll.answers.map((answer, ansIndex) => (
                                                <div key={ansIndex} className={`history-answer ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                                                    <span className="student-name">{answer.name}</span>
                                                    <span className="student-answer">{answer.answer}</span>
                                                    <span className="answer-result">
                                                        {answer.isCorrect ? '✅' : '❌'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 