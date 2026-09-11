import React, { useState } from 'react';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    // Convert username and password into Basic Auth Base64 format
    const token = btoa(`\({username}:\){password}`);
    localStorage.setItem('adminAuthToken', token);
    
    setError('');
    onLoginSuccess();
    onClose();
  };

  return (