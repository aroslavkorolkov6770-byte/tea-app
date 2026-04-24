"use client";
import React, { useState } from 'react';
import Navigation from '../components/Navigation';

const CHECKLIST = [
  { id: 1, text: "Проверить фильтры и набрать воду", done: false },
  { id: 2, text: "Протереть витрины и полки", done: false },
  { id: 3, text: "Включить и откалибровать весы", done: false },
  { id: 4, text: "Подготовить чай дня", done: false },
  { id: 5, text: "Актуализировать ценники", done: false },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState(CHECKLIST);
  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0' }}>
      <Navigation />
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '100px 25px' }}>
        <h2 style={{ marginBottom: '20px' }}>Чек-лист открытия 📋</h2>
        {tasks.map(t => (
          <div key={t.id} onClick={() => setTasks(tasks.map(i => i.id === t.id ? {...i, done: !i.done} : i))} style={{ background: '#161816', padding: '18px', borderRadius: '15px', display: 'flex', gap: '15px', marginBottom: '10px', cursor: 'pointer', border: t.done ? '1px solid #2e7d32' : '1px solid #222', opacity: t.done ? 0.6 : 1 }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '5px', border: '2px solid #4CAF50', backgroundColor: t.done ? '#4CAF50' : 'transparent', textAlign: 'center', color: '#fff' }}>{t.done && '✓'}</div>
            <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
          </div>
        ))}
      </main>
    </div>
  );
}