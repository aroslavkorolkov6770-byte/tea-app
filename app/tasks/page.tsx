"use client";
import React, { useState } from 'react';
import Navigation from '../components/Navigation';

// --- БАЗА ЗНАНИЙ (ЭТАПЫ А и В) ---
const LESSONS_DATABASE = [
  {
    id: "lesson_1",
    title: "🍃 Основы: Ферментация",
    content: "Ферментация — это процесс окисления чайного листа. Чем выше уровень ферментации, тем темнее чай. Зеленый чай почти не окислен, поэтому он сохраняет свежесть и цвет травы. Шу Пуэр же проходит процесс ускоренной ферментации в кучах.",
    question: "Какой чай проходит процесс окисления почти на 100%?",
    options: ["Зеленый чай", "Красный чай", "Белый чай"],
    correct: 1 // Красный чай
  },
  {
    id: "lesson_2",
    title: "🍵 Температурные режимы",
    content: "Для каждого вида чая нужен свой подход. Нежные почки белого чая сгорают в кипятке (нужно 70-75°C). Улуны любят 85-90°C, а вот старые пуэры и черные чаи раскрываются только при температуре 95-100°C.",
    question: "Какая температура идеальна для белого чая?",
    options: ["100°C", "85°C", "70-75°C"],
    correct: 2
  }
];

const INITIAL_TASKS = [
  { id: "task_1", text: "Проверить фильтры и набрать воду", done: false },
  { id: "task_2", text: "Протереть витрины и полки", done: false },
  { id: "task_3", text: "Включить и откалибровать весы", done: false },
  { id: "task_4", text: "Подготовить чай дня", done: false },
  { id: "task_5", text: "Актуализировать ценники", done: false },
];

export default function ShiftPage() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'checklist' | 'edu'>('checklist');
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [activeAnswer, setActiveAnswer] = useState<number | null>(null);

  // --- HANDLERS ---
  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleTabChange = (tab: 'checklist' | 'edu') => {
    setActiveTab(tab);
    setSelectedLessonId(null); // Сброс при переключении
    setActiveAnswer(null);
  };

  const currentLesson = LESSONS_DATABASE.find(l => l.id === selectedLessonId);

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      <Navigation />
      
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '100px 25px' } as any}>
        
        {/* 1. ПЕРЕКЛЮЧАТЕЛЬ ТАБОВ (ИЗОЛИРОВАННЫЙ) */}
        <div style={{ display: 'flex', gap: '8px', background: '#161816', padding: '6px', borderRadius: '14px', marginBottom: '30px' } as any}>
          {['checklist', 'edu'].map((tab) => (
            <div 
              key={`tab-key-${tab}-${activeTab === tab}`}
              onClick={() => handleTabChange(tab as any)}
              style={{
                flex: 1, padding: '12px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
                backgroundColor: activeTab === tab ? '#4CAF50' : 'transparent',
                color: activeTab === tab ? '#000' : '#555',
                transition: '0.2s'
              } as any}
            >
              {tab === 'checklist' ? 'Чек-лист' : 'Обучение'}
            </div>
          ))}
        </div>

        {/* --- КОНТЕНТ: ЧЕК-ЛИСТ --- */}
        {activeTab === 'checklist' && (
          <div key="checklist-section">
            <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>Список задач 📋</h2>
            {tasks.map(t => (
              <div 
                key={`task-${t.id}-${t.done}`}
                onClick={() => toggleTask(t.id)}
                style={{ 
                  background: '#161816', padding: '20px', borderRadius: '18px', display: 'flex', gap: '15px', 
                  marginBottom: '12px', cursor: 'pointer', border: '1px solid',
                  borderColor: t.done ? '#2e7d32' : '#222', 
                  opacity: t.done ? 0.5 : 1, transition: '0.2s'
                } as any}
              >
                <div style={{ 
                  width: '22px', height: '22px', borderRadius: '6px', border: '2px solid #4CAF50', 
                  backgroundColor: t.done ? '#4CAF50' : 'transparent', textAlign: 'center', color: '#000', fontWeight: 'bold'
                } as any}>
                  {t.done && '✓'}
                </div>
                <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* --- КОНТЕНТ: ОБУЧЕНИЕ --- */}
        {activeTab === 'edu' && (
          <div key="education-section">
            {!selectedLessonId ? (
              <>
                <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>Обучение 📚</h2>
                <div style={{ display: 'grid', gap: '15px' } as any}>
                  {LESSONS_DATABASE.map(lesson => (
                    <div 
                      key={`lesson-card-${lesson.id}`} 
                      onClick={() => setSelectedLessonId(lesson.id)}
                      style={{ background: '#161816', padding: '25px', borderRadius: '20px', border: '1px solid #222', cursor: 'pointer', transition: '0.2s' } as any}
                    >
                      <h3 style={{ margin: 0, color: '#4CAF50' }}>{lesson.title}</h3>
                      <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#666' }}>Нажми, чтобы начать изучение</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div key={`view-${selectedLessonId}`} style={{ background: '#161816', padding: '30px', borderRadius: '25px', border: '1px solid #222' } as any}>
                <div 
                  onClick={() => {setSelectedLessonId(null); setActiveAnswer(null);}} 
                  style={{ color: '#4CAF50', cursor: 'pointer', marginBottom: '20px', display: 'inline-block', fontWeight: 'bold' } as any}
                >
                  ← Назад к темам
                </div>
                
                <h2 style={{ marginBottom: '15px', color: '#fff' }}>{currentLesson?.title}</h2>
                <p style={{ lineHeight: '1.7', color: '#bbb', marginBottom: '30px', fontSize: '15px' }}>{currentLesson?.content}</p>
                
                {/* БЛОК ТЕСТА */}
                <div style={{ borderTop: '1px solid #222', paddingTop: '25px' } as any}>
                  <h4 style={{ marginBottom: '20px', color: '#4CAF50', fontSize: '16px' }}>📝 ТЕСТ: {currentLesson?.question}</h4>
                  <div style={{ display: 'grid', gap: '12px' } as any}>
                    {currentLesson?.options.map((opt, idx) => {
                      const isCorrect = idx === currentLesson.correct;
                      const isSelected = activeAnswer === idx;
                      
                      return (
                        <div 
                          key={`ans-${selectedLessonId}-${idx}-${isSelected}`}
                          onClick={(e) => { e.stopPropagation(); setActiveAnswer(idx); }}
                          style={{ 
                            padding: '15px', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', border: '1px solid',
                            // ЖЕСТКАЯ ЛОГИКА ЦВЕТА
                            backgroundColor: isSelected ? (isCorrect ? '#2e7d32' : '#d32f2f') : '#0d0f0d',
                            borderColor: isSelected ? (isCorrect ? '#4CAF50' : '#ff5252') : '#333',
                            color: isSelected ? '#fff' : '#888',
                            transition: '0.1s'
                          } as any}
                        >
                          {opt}
                        </div>
                      );
                    })}
                  </div>
                  
                  {activeAnswer !== null && (
                    <div style={{ marginTop: '20px', textAlign: 'center', fontWeight: 'bold', color: activeAnswer === currentLesson?.correct ? '#4CAF50' : '#ff5252' } as any}>
                      {activeAnswer === currentLesson?.correct ? '🎉 Верно! Ты усвоил материал.' : '❌ Ошибка. Перечитай текст выше.'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}