"use client";
import React, { useState } from 'react';
import Navigation from '../components/Navigation';

// --- ДАННЫЕ ДЛЯ ОБУЧЕНИЯ ---
const LESSONS = [
  {
    id: 1,
    title: "🍃 Основы: 6 видов чая",
    content: "Весь чай происходит от одного растения — Camellia Sinensis. Разница только в степени ферментации (окисления). Зеленый чай — почти не окислен, Красный — окислен полностью, Улуны — где-то посередине.",
    question: "Из какого растения делают настоящий чай?",
    options: ["Чайная Роза", "Camellia Sinensis", "Иван-чай"],
    correct: 1
  },
  {
    id: 2,
    title: "🍵 Температуры",
    content: "Светлые чаи (зеленый, белый) не любят кипяток. Их заваривают при 75-80°C. Темные (Шу Пуэр, Красный чай) требуют горячую воду — 95-100°C.",
    question: "Какой водой заварим Шу Пуэр?",
    options: ["Еле теплой", "80°C", "95-100°C"],
    correct: 2
  }
];

const CHECKLIST_DATA = [
  { id: 1, text: "Проверить фильтры и набрать воду", done: false },
  { id: 2, text: "Протереть витрины и полки", done: false },
  { id: 3, text: "Включить и откалибровать весы", done: false },
  { id: 4, text: "Подготовить чай дня", done: false },
  { id: 5, text: "Актуализировать ценники", done: false },
];

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'edu'>('tasks');
  const [tasks, setTasks] = useState(CHECKLIST_DATA);
  
  // Состояния для обучения
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [quizResult, setQuizResult] = useState<string | null>(null);

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0' }}>
      <Navigation />
      
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '100px 25px' }}>
        
        {/* ПЕРЕКЛЮЧАТЕЛЬ ТАБОВ */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', background: '#161816', padding: '5px', borderRadius: '12px' }}>
          <button 
            onClick={() => setActiveTab('tasks')}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'tasks' ? '#4CAF50' : 'transparent', color: activeTab === 'tasks' ? '#000' : '#777', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Чек-лист
          </button>
          <button 
            onClick={() => setActiveTab('edu')}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'edu' ? '#4CAF50' : 'transparent', color: activeTab === 'edu' ? '#000' : '#777', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Обучение
          </button>
        </div>

        {/* --- КОНТЕНТ: ЧЕК-ЛИСТ --- */}
        {activeTab === 'tasks' && (
          <>
            <h2 style={{ marginBottom: '20px' }}>Чек-лист 📋</h2>
            {tasks.map(t => (
              <div 
                key={t.id} 
                onClick={() => setTasks(tasks.map(i => i.id === t.id ? {...i, done: !i.done} : i))} 
                style={{ 
                  background: '#161816', padding: '18px', borderRadius: '15px', display: 'flex', gap: '15px', 
                  marginBottom: '10px', cursor: 'pointer', border: t.done ? '1px solid #2e7d32' : '1px solid #222', 
                  opacity: t.done ? 0.6 : 1 
                }}
              >
                <div style={{ width: '20px', height: '20px', borderRadius: '5px', border: '2px solid #4CAF50', backgroundColor: t.done ? '#4CAF50' : 'transparent', textAlign: 'center', lineHeight: '18px', fontSize: '14px' }}>
                  {t.done && '✓'}
                </div>
                <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
              </div>
            ))}
          </>
        )}

        {/* --- КОНТЕНТ: ОБУЧЕНИЕ --- */}
        {activeTab === 'edu' && (
          <>
            {!selectedLesson ? (
              <>
                <h2 style={{ marginBottom: '20px' }}>База знаний 📚</h2>
                <div style={{ display: 'grid', gap: '15px' }}>
                  {LESSONS.map(lesson => (
                    <div 
                      key={lesson.id} 
                      onClick={() => { setSelectedLesson(lesson); setQuizResult(null); }}
                      style={{ background: '#161816', padding: '20px', borderRadius: '15px', border: '1px solid #222', cursor: 'pointer' }}
                    >
                      <h3 style={{ margin: 0 }}>{lesson.title}</h3>
                      <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Нажми, чтобы изучить</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ background: '#161816', padding: '25px', borderRadius: '20px', border: '1px solid #222' }}>
                <button onClick={() => setSelectedLesson(null)} style={{ background: 'none', border: 'none', color: '#4CAF50', cursor: 'pointer', padding: 0, marginBottom: '15px' }}>← Назад к темам</button>
                <h2 style={{ marginBottom: '15px' }}>{selectedLesson.title}</h2>
                <p style={{ lineHeight: '1.6', color: '#bbb', marginBottom: '25px' }}>{selectedLesson.content}</p>
                
                <div style={{ borderTop: '1px solid #222', paddingTop: '20px' }}>
                  <h4 style={{ marginBottom: '15px', color: '#4CAF50' }}>Тест: {selectedLesson.question}</h4>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {selectedLesson.options.map((opt: string, index: number) => (
                      <button 
                        key={index} 
                        onClick={() => setQuizResult(index === selectedLesson.correct ? 'correct' : 'wrong')}
                        style={{ 
                          padding: '12px', borderRadius: '10px', border: '1px solid #333', textAlign: 'left',
                          background: quizResult === null ? '#0d0f0d' : (index === selectedLesson.correct ? '#2e7d32' : '#161816'),
                          color: '#fff', cursor: 'pointer'
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {quizResult === 'correct' && <p style={{ color: '#4CAF50', marginTop: '15px', fontWeight: 'bold' }}>Правильно! Ты молодец. 🎉</p>}
                  {quizResult === 'wrong' && <p style={{ color: '#ff5252', marginTop: '15px' }}>Не совсем так. Попробуй еще раз!</p>}
                </div>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}