"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';

const LESSONS_DATABASE = [
  {
    id: "lesson_1",
    title: "🍃 Основы: Ферментация",
    content: "Ферментация — это процесс окисления чайного листа. Чем выше уровень ферментации, тем темнее чай. Зеленый чай почти не окислен, поэтому он сохраняет свежесть и цвет травы. Шу Пуэр же проходит процесс ускоренной ферментации в кучах.",
    question: "Какой чай проходит процесс окисления почти на 100%?",
    options: ["Зеленый чай", "Красный чай", "Белый чай"],
    correct: 1 
  },
  {
    id: "lesson_2",
    title: "🍵 Температурные режимы",
    content: "Для каждого вида чая нужен свой подход. Нежные почки белого чая сгорают в кипятке (нужно 70-75°C). Улуны любят 85-90°C, а вот старые пуэры и черные чаи раскрываются только при температуре 95-100°C.",
    question: "Какая температура идеальна для белого чая?",
    options: ["100°C", "85°C", "70-75°C"],
    correct: 2
  },
  {
    id: "lesson_3",
    title: "🧘 Габа: Спокойствие",
    content: "Габа-чай проходит ферментацию без доступа кислорода. Благодаря этому в листе вырабатывается ГАМК (гамма-аминомасляная кислота), которая помогает мозгу расслабиться, сохраняя при этом концентрацию.",
    question: "В чем главная особенность Габа-чая?",
    options: ["Много кофеина", "Высокое содержание ГАМК", "Копченый вкус"],
    correct: 1
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
  const [activeTab, setActiveTab] = useState<'checklist' | 'edu'>('checklist');
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [activeAnswer, setActiveAnswer] = useState<number | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  useEffect(() => {
    const savedProgress = localStorage.getItem('tea_progress');
    if (savedProgress) setCompletedLessons(JSON.parse(savedProgress));
  }, []);

  useEffect(() => {
    if (completedLessons.length > 0 || localStorage.getItem('tea_progress')) {
      localStorage.setItem('tea_progress', JSON.stringify(completedLessons));
    }
  }, [completedLessons]);

  const resetProgress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Сбросить весь прогресс обучения?")) {
      setCompletedLessons([]);
      localStorage.removeItem('tea_progress');
    }
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const progressPercent = Math.round((completedLessons.length / LESSONS_DATABASE.length) * 100);
  const currentLesson = LESSONS_DATABASE.find(l => l.id === selectedLessonId);

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none', transition: '0.3s' } as any}>
      <Navigation />
      
      {/* Увеличенный maxWidth до 800px для десктопного вида */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        
        {/* ВЫБОР РАЗДЕЛА */}
        <div style={{ display: 'flex', gap: '12px', background: '#161816', padding: '8px', borderRadius: '18px', marginBottom: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } as any}>
          {['checklist', 'edu'].map((tab) => (
            <div 
              key={`tab-${tab}-${activeTab === tab}`}
              onClick={() => { setActiveTab(tab as any); setSelectedLessonId(null); setActiveAnswer(null); }}
              style={{
                flex: 1, padding: '15px', borderRadius: '14px', textAlign: 'center', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold',
                backgroundColor: activeTab === tab ? '#4CAF50' : 'transparent',
                color: activeTab === tab ? '#000' : '#555', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              } as any}
            >
              {tab === 'checklist' ? '📋 Чек-лист' : '🎓 Обучение'}
            </div>
          ))}
        </div>

        {/* --- ЧЕК-ЛИСТ --- */}
        {activeTab === 'checklist' && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <h2 style={{ marginBottom: '25px', fontSize: '28px', letterSpacing: '-0.5px' }}>Рабочая смена</h2>
            <div style={{ display: 'grid', gap: '15px' }}>
              {tasks.map(t => (
                <div 
                  key={`t-${t.id}-${t.done}`}
                  onClick={() => toggleTask(t.id)}
                  style={{ 
                    background: '#161816', padding: '24px', borderRadius: '20px', display: 'flex', gap: '20px', 
                    cursor: 'pointer', border: '1px solid', borderColor: t.done ? '#2e7d32' : '#222',
                    opacity: t.done ? 0.4 : 1, transition: '0.2s', transform: t.done ? 'scale(0.98)' : 'scale(1)'
                  } as any}
                >
                  <div style={{ width: '24px', height: '24px', borderRadius: '7px', border: '2px solid #4CAF50', backgroundColor: t.done ? '#4CAF50' : 'transparent', color: '#000', textAlign: 'center', lineHeight: '20px', fontWeight: 'bold' } as any}>
                    {t.done && '✓'}
                  </div>
                  <span style={{ fontSize: '16px', textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- ОБУЧЕНИЕ --- */}
        {activeTab === 'edu' && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            {!selectedLessonId ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' } as any}>
                    <h2 style={{ fontSize: '28px', margin: 0 }}>База знаний</h2>
                    <span style={{ fontSize: '16px', color: '#4CAF50', fontWeight: 'bold', background: 'rgba(76, 175, 80, 0.1)', padding: '4px 12px', borderRadius: '10px' }}>{progressPercent}%</span>
                </div>
                
                {/* PROGRESS BAR + RESET BUTTON */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' } as any}>
                    <div style={{ flex: 1, height: '12px', background: '#161816', borderRadius: '20px', overflow: 'hidden', border: '1px solid #222' } as any}>
                        <div style={{ width: `${progressPercent}%`, height: '100%', background: '#4CAF50', boxShadow: '0 0 15px rgba(76, 175, 80, 0.4)', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' } as any} />
                    </div>
                    <div 
                      onClick={resetProgress} 
                      style={{ padding: '8px 15px', background: '#1a1a1a', borderRadius: '10px', fontSize: '12px', color: '#cc4444', cursor: 'pointer', border: '1px solid #331111', fontWeight: 'bold', whiteSpace: 'nowrap' } as any}
                    >
                      СБРОСИТЬ
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' } as any}>
                  {LESSONS_DATABASE.map(lesson => {
                    const isDone = completedLessons.includes(lesson.id);
                    return (
                      <div 
                        key={`l-card-${lesson.id}-${isDone}`} 
                        onClick={() => setSelectedLessonId(lesson.id)}
                        style={{ 
                          background: '#161816', padding: '30px', borderRadius: '24px', border: '1px solid', 
                          borderColor: isDone ? '#2e7d32' : '#222', cursor: 'pointer', transition: '0.3s'
                        } as any}
                        onMouseEnter={(e: any) => e.currentTarget.style.borderColor = '#4CAF50'}
                        onMouseLeave={(e: any) => e.currentTarget.style.borderColor = isDone ? '#2e7d32' : '#222'}
                      >
                        <h3 style={{ margin: '0 0 10px 0', color: isDone ? '#4CAF50' : '#fff', fontSize: '18px' }}>{lesson.title}</h3>
                        <div style={{ fontSize: '13px', color: isDone ? '#2e7d32' : '#555', fontWeight: 'bold' }}>
                            {isDone ? 'Пройдено ✓' : 'Начать изучение →'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div key={`view-${selectedLessonId}`} style={{ background: '#161816', padding: '40px', borderRadius: '30px', border: '1px solid #222', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' } as any}>
                <div onClick={() => {setSelectedLessonId(null); setActiveAnswer(null);}} style={{ color: '#4CAF50', cursor: 'pointer', marginBottom: '30px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px' } as any}>
                  <span>←</span> Назад к списку тем
                </div>
                
                <h2 style={{ marginBottom: '20px', fontSize: '26px' }}>{currentLesson?.title}</h2>
                <p style={{ lineHeight: '1.8', color: '#ccc', marginBottom: '40px', fontSize: '16px' }}>{currentLesson?.content}</p>
                
                <div style={{ borderTop: '1px solid #222', paddingTop: '35px' } as any}>
                  <h4 style={{ marginBottom: '25px', color: '#4CAF50', fontSize: '18px' }}>📝 Проверка знаний: {currentLesson?.question}</h4>
                  <div style={{ display: 'grid', gap: '15px' } as any}>
                    {currentLesson?.options.map((opt, idx) => {
                      const isCorrect = idx === currentLesson.correct;
                      const isSelected = activeAnswer === idx;
                      return (
                        <div 
                          key={`ans-${selectedLessonId}-${idx}-${isSelected}`}
                          onClick={(e) => { 
                             e.stopPropagation(); 
                             setActiveAnswer(idx);
                             if (idx === currentLesson.correct && !completedLessons.includes(currentLesson.id)) {
                                setCompletedLessons(prev => [...prev, currentLesson.id]);
                             }
                          }}
                          style={{ 
                            padding: '18px 25px', borderRadius: '16px', cursor: 'pointer', fontSize: '15px', border: '1px solid',
                            backgroundColor: isSelected ? (isCorrect ? '#2e7d32' : '#d32f2f') : '#0d0f0d',
                            borderColor: isSelected ? (isCorrect ? '#4CAF50' : '#ff5252') : '#333',
                            color: isSelected ? '#fff' : '#888', transition: '0.2s'
                          } as any}
                        >
                          {opt}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}