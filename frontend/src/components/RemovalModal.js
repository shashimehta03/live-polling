import React, { useState, useEffect } from 'react';
import '../styles/RemovalModal.css';

export default function RemovalModal({ isOpen, onClose }) {
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        if (isOpen) {
            setCountdown(10);
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        window.location.href = '/';
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="removal-modal-overlay">
            <div className="removal-modal">
                <div className="removal-modal-content">
                    <div className="removal-icon">🚫</div>
                    <h2>You have been removed</h2>
                    <p>The teacher has removed you from this session.</p>
                    <div className="countdown-timer">
                        Redirecting in <span className="countdown-number">{countdown}</span> seconds...
                    </div>
                    <button className="removal-ok-btn" onClick={onClose}>
                        OK ({countdown}s)
                    </button>
                </div>
            </div>
        </div>
    );
} 