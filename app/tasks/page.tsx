"use client";
import React, { useState } from 'react';
import Navigation from '../components/Navigation';

// --- БАЗА ЗНАНИЙ ---
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
  
  // --- НОВОЕ: Прогресс обучения ---
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleTabChange = (tab: 'checklist' | 'edu') => {
    setActiveTab(tab);
    setSelectedLessonId(null);
    setActiveAnswer(null);
  };

  // Расчет прогресса
  const progressPercent = Math.round((completedLessons.length / LESSONS_DATABASE.length) * 100);

  const currentLesson = LESSONS_DATABASE.find(l => l.id === selectedLessonId);

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      <Navigation />
      
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '100px 25px' } as any}>
        
        {/* ПЕРЕКЛЮЧАТЕЛЬ ТАБОВ */}
        <div style={{ display: 'flex', gap: '8px', background: '#161816', padding: '6px', borderRadius: '14px', marginBottom: '30px' } as any}>
          {['checklist', 'edu'].map((tab) => (
            <div 
              key={`tab-key-${tab}-${activeTab === tab}`}
              onClick={() => handleTabChange(tab as any)}
              style={{
                flex: 1, padding: '12px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
                backgroundColor: activeTab === tab ? '#4CAF50' : 'transparent',
                color: activeTab === tab ? '#000' : '#555', transition: '0.2s'
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
                  borderColor: t.done ? '#2e7d32' : '#222', opacity: t.done ? 0.5 : 1, transition: '0.2s'
                } as any}
              >
                <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: '2px solid #4CAF50', backgroundColor: t.done ? '#4CAF50' : 'transparent', textAlign: 'center', color: '#000', fontWeight: 'bold' } as any}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' } as any}>
                    <h2 style={{ fontSize: '24px', margin: 0 }}>Обучение 📚</h2>
                    <span style={{ fontSize: '14px', color: '#4CAF50', fontWeight: 'bold' }}>{progressPercent}%</span>
                </div>
                
                {/* PROGRESS BAR */}
                <div style={{ width: '100%', height: '8px', background: '#161816', borderRadius: '10px', marginBottom: '25px', overflow: 'hidden', border: '1px solid #222' } as any}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: '#4CAF50', transition: 'width 0.5s ease-in-out' } as any} />
                </div>

                <div style={{ display: 'grid', gap: '15px' } as any}>
                  {LESSONS_DATABASE.map(lesson => {
                    const isDone = completedLessons.includes(lesson.id);
                    return (
                      <div 
                        key={`lesson-card-${lesson.id}-${isDone}`} 
                        onClick={() => setSelectedLessonId(lesson.id)}
                        style={{ 
                          background: '#161816', padding: '25px', borderRadius: '20px', border: '1px solid', 
                          borderColor: isDone ? '#2e7d32' : '#222', cursor: 'pointer', position: 'relative' 
                        } as any}
                      >
                        <h3 style={{ margin: 0, color: isDone ? '#4CAF50' : '#fff' }}>{lesson.title}</h3>
                        <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#666' }}>
                            {isDone ? 'Изучено ✓' : 'Нажми, чтобы начать изучение'}
                        </p>
                      </div>
                    );
                  })}
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
                
                <h2 style={{ marginBottom: '15px' }}>{currentLesson?.title}</h2>
                <p style={{ lineHeight: '1.7', color: '#bbb', marginBottom: '30px' }}>{currentLesson?.content}</p>
                
                <div style={{ borderTop: '1px solid #222', paddingTop: '25px' } as any}>
                  <h4 style={{ marginBottom: '20px', color: '#4CAF50' }}>📝 ТЕСТ: {currentLesson?.question}</h4>
                  <div style={{ display: 'grid', gap: '12px' } as any}>
                    {currentLesson?.options.map((opt, idx) => {
                      const isCorrect = idx === currentLesson.correct;
                      const isSelected = activeAnswer === idx;
                      
                      return (
                        <div 
                          key={`ans-${selectedLessonId}-${idx}-${isSelected}`}
                          onClick={(e) => { 
                             e.stopPropagation(); 
                             setActiveAnswer(idx);
                             // Если ответ верный — добавляем в список пройденных
                             if (idx === currentLesson.correct && !completedLessons.includes(currentLesson.id)) {
                                setCompletedLessons([...completedLessons, currentLesson.id]);
                             }
                          }}
                          style={{ 
                            padding: '15px', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', border: '1px solid',
                            backgroundColor: isSelected ? (isCorrect ? '#2e7d32' : '#d32f2f') : '#0d0f0d',
                            borderColor: isSelected ? (isCorrect ? '#4CAF50' : '#ff5252') : '#333',
                            color: isSelected ? '#fff' : '#888', transition: '0.1s'
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