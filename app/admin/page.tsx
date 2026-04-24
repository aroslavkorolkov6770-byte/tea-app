"use client";
import React from 'react';
import Navigation from '../components/Navigation';

export default function AdminPage() {
  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0' }}>
      <Navigation />
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '100px 25px' }}>
        <h2>Настройки HUB ⚙️</h2>
        <div style={{ background: '#161816', padding: '20px', borderRadius: '20px', border: '1px solid #222' }}>
          <label style={{display: 'block', marginBottom: '10px'}}>Название заведения:</label>
          <input type="text" defaultValue="Tea Master Store" style={{ width: '100%', padding: '15px', marginBottom: '12px', borderRadius: '12px', background: '#222', border: '1px solid #333', color: '#fff', boxSizing: 'border-box' }} />
          <button style={{ width: '100%', padding: '16px', borderRadius: '15px', background: '#4CAF50', border: 'none', color: '#fff', fontWeight: 'bold' }}>Сохранить</button>
        </div>
      </main>
    </div>
  );
}