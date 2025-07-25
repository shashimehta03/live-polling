import React from 'react';
import '../styles/EntryPage.css';

export default function RoleButton({ label, onClick }) {
    return (
        <button className="role-btn" onClick={onClick}>
            {label}
        </button>
    );
} 