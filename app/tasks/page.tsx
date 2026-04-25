"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';

// --- БАЗА ЗНАНИЙ (БЕЗ ИЗМЕНЕНИЙ) ---
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

const DEFAULT_TASKS = [
  { id: "task_1", text: "Проверить фильтры и набрать воду", done: false },
  { id: "task_2", text: "Протереть витрины и полки", done: false },
  { id: "task_3", text: "Включить и откалибровать весы", done: false },
];

export default function ShiftPage() {
  const [activeTab, setActiveTab] = useState<'checklist' | 'edu'>('checklist');
  const [tasks, setTasks] = useState<{id: string, text: string, done: boolean}[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [activeAnswer, setActiveAnswer] = useState<number | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  // --- ЗАГРУЗКА ДАННЫХ ИЗ LOCALSTORAGE ---
  useEffect(() => {
    const savedProgress = localStorage.getItem('tea_progress');
    const savedTasks = localStorage.getItem('tea_tasks');
    
    if (savedProgress) setCompletedLessons(JSON.parse(savedProgress));
    
    // Если в памяти есть задачи — берем их, если нет — ставим дефолтные
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      setTasks(DEFAULT_TASKS);
    }
  }, []);

  // --- СОХРАНЕНИЕ ДАННЫХ ---
  useEffect(() => {
    localStorage.setItem('tea_progress', JSON.stringify(completedLessons));
  }, [completedLessons]);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('tea_tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  // --- УПРАВЛЕНИЕ ЗАДАЧАМИ ---
  const addTask = () => {
    if (!newTaskText.trim()) return;
    const newTask = {
      id: "task_" + Date.now(),
      text: newTaskText,
      done: false
    };
    setTasks([...tasks, newTask]);
    setNewTaskText("");
  };

  const deleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Чтобы не срабатывал toggleTask
    setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const resetProgress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Сбросить весь прогресс обучения?")) {
      setCompletedLessons([]);
      localStorage.removeItem('tea_progress');
    }
  };

  const progressPercent = Math.round((completedLessons.length / LESSONS_DATABASE.length) * 100);
  const currentLesson = LESSONS_DATABASE.find(l => l.id === selectedLessonId);

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      <Navigation />
      
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        
        {/* ВЫБОР РАЗДЕЛА */}
        <div style={{ display: 'flex', gap: '12px', background: '#161816', padding: '8px', borderRadius: '18px', marginBottom: '40px' } as any}>
          {['checklist', 'edu'].map((tab) => (
            <div 
              key={`tab-key-${tab}-${activeTab === tab}`}
              onClick={() => { setActiveTab(tab as any); setSelectedLessonId(null); setActiveAnswer(null); }}
              style={{
                flex: 1, padding: '15px', borderRadius: '14px', textAlign: 'center', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold',
                backgroundColor: activeTab === tab ? '#4CAF50' : 'transparent',
                color: activeTab === tab ? '#000' : '#555', transition: '0.3s'
              } as any}
            >
              {tab === 'checklist' ? '📋 Чек-лист' : '🎓 Обучение'}
            </div>
          ))}
        </div>

        {/* --- ЧЕК-ЛИСТ (ДИНАМИЧЕСКИЙ) --- */}
        {activeTab === 'checklist' && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <h2 style={{ marginBottom: '25px', fontSize: '28px' }}>Рабочая смена</h2>
            
            {/* ДОБАВЛЕНИЕ НОВОЙ ЗАДАЧИ */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' } as any}>
                <input 
                    type="text" 
                    placeholder="Добавить новую задачу..." 
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                    style={{ flex: 1, padding: '18px', borderRadius: '15px', background: '#161816', border: '1px solid #333', color: '#fff', outline: 'none' } as any}
                />
                <div 
                    onClick={addTask}
                    style={{ padding: '18px 25px', background: '#4CAF50', color: '#000', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' } as any}
                >
                    +
                </div>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {tasks.map(t => (
                <div 
                  key={`task-${t.id}-${t.done}`}
                  onClick={() => toggleTask(t.id)}
                  style={{ 
                    background: '#161816', padding: '20px', borderRadius: '18px', display: 'flex', gap: '20px', 
                    alignItems: 'center', border: '1px solid', borderColor: t.done ? '#2e7d32' : '#222',
                    opacity: t.done ? 0.4 : 1, transition: '0.2s'
                  } as any}
                >
                  <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: '2px solid #4CAF50', backgroundColor: t.done ? '#4CAF50' : 'transparent', color: '#000', textAlign: 'center', fontWeight: 'bold' } as any}>
                    {t.done && '✓'}
                  </div>
                  <span style={{ flex: 1, fontSize: '16px', textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
                  
                  {/* Кнопка удаления */}
                  <div 
                    onClick={(e) => deleteTask(t.id, e)} 
                    style={{ color: '#444', fontSize: '18px', cursor: 'pointer', padding: '5px' } as any}
                    onMouseEnter={(e: any) => e.target.style.color = '#ff5252'}
                    onMouseLeave={(e: any) => e.target.style.color = '#444'}
                  >
                    ✕
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- ОБУЧЕНИЕ (БЕЗ ИЗМЕНЕНИЙ ЛОГИКИ) --- */}
        {activeTab === 'edu' && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            {!selectedLessonId ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' } as any}>
                    <h2 style={{ fontSize: '28px', margin: 0 }}>База знаний</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' } as any}>
                        <span style={{ fontSize: '16px', color: '#4CAF50', fontWeight: 'bold' }}>{progressPercent}%</span>
                        <div onClick={resetProgress} style={{ padding: '8px 15px', background: '#1a1a1a', borderRadius: '10px', fontSize: '12px', color: '#cc4444', cursor: 'pointer', border: '1px solid #331111' } as any}>СБРОС</div>
                    </div>
                </div>
                
                <div style={{ flex: 1, height: '12px', background: '#161816', borderRadius: '20px', overflow: 'hidden', border: '1px solid #222', marginBottom: '30px' } as any}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: '#4CAF50', transition: 'width 0.8s ease' } as any} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' } as any}>
                  {LESSONS_DATABASE.map(lesson => {
                    const isDone = completedLessons.includes(lesson.id);
                    return (
                      <div 
                        key={`l-card-${lesson.id}-${isDone}`} 
                        onClick={() => setSelectedLessonId(lesson.id)}
                        style={{ background: '#161816', padding: '30px', borderRadius: '24px', border: '1px solid', borderColor: isDone ? '#2e7d32' : '#222', cursor: 'pointer' } as any}
                      >
                        <h3 style={{ margin: '0 0 10px 0', color: isDone ? '#4CAF50' : '#fff' }}>{lesson.title}</h3>
                        <div style={{ fontSize: '13px', color: isDone ? '#2e7d32' : '#555' }}>{isDone ? 'Пройдено ✓' : 'Начать изучение →'}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div key={`view-${selectedLessonId}`} style={{ background: '#161816', padding: '40px', borderRadius: '30px', border: '1px solid #222' } as any}>
                <div onClick={() => {setSelectedLessonId(null); setActiveAnswer(null);}} style={{ color: '#4CAF50', cursor: 'pointer', marginBottom: '30px', display: 'inline-flex', alignItems: 'center', gap: '8px' } as any}>← Назад к списку тем</div>
                <h2 style={{ marginBottom: '20px' }}>{currentLesson?.title}</h2>
                <p style={{ lineHeight: '1.8', color: '#ccc', marginBottom: '40px' }}>{currentLesson?.content}</p>
                <div style={{ borderTop: '1px solid #222', paddingTop: '35px' } as any}>
                  <h4 style={{ marginBottom: '25px', color: '#4CAF50' }}>📝 Тест: {currentLesson?.question}</h4>
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
                            padding: '18px 25px', borderRadius: '16px', cursor: 'pointer', border: '1px solid',
                            backgroundColor: isSelected ? (isCorrect ? '#2e7d32' : '#d32f2f') : '#0d0f0d',
                            borderColor: isSelected ? (isCorrect ? '#4CAF50' : '#ff5252') : '#333',
                            color: isSelected ? '#fff' : '#888'
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