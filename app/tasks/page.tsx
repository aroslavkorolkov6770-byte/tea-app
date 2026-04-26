"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '@/app/components/Navigation';
import { supabase } from '../supabaseClient';

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

export default function ShiftPage() {
  const [activeTab, setActiveTab] = useState<'checklist' | 'edu'>('checklist');
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [activeAnswer, setActiveAnswer] = useState<number | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  // Загрузка данных
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: tasksData } = await supabase.from('tasks').select('*').order('id', { ascending: true });
      if (tasksData) setTasks(tasksData);

      const { data: progressData } = await supabase.from('lesson_progress').select('lesson_id');
      if (progressData) setCompletedLessons(progressData.map(p => p.lesson_id));
    } catch (err) {
      console.error("Ошибка загрузки данных:", err);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTaskText.trim()) return;
    const { error } = await supabase.from('tasks').insert([{ text: newTaskText, done: false }]);
    if (!error) {
      setNewTaskText("");
      fetchData();
    }
  };

  const deleteTask = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) fetchData();
  };

  const toggleTask = async (id: number, currentDone: boolean) => {
    const { error } = await supabase.from('tasks').update({ done: !currentDone }).eq('id', id);
    if (!error) fetchData();
  };

  const resetProgress = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Сбросить весь прогресс обучения в облаке?")) {
      await supabase.from('lesson_progress').delete().neq('lesson_id', 'null');
      fetchData();
    }
  };

  const saveLessonProgress = async (lessonId: string) => {
    if (!completedLessons.includes(lessonId)) {
        await supabase.from('lesson_progress').insert([{ lesson_id: lessonId }]);
        fetchData();
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
              key={`tab-btn-${tab}-${activeTab === tab}`}
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

        {/* --- ЧЕК-ЛИСТ --- */}
        {activeTab === 'checklist' && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <h2 style={{ marginBottom: '25px', fontSize: '28px' }}>Рабочая смена</h2>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' } as any}>
                <input 
                    type="text" 
                    placeholder="Добавить задачу..." 
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                    style={{ flex: 1, padding: '18px', borderRadius: '15px', background: '#161816', border: '1px solid #333', color: '#fff', outline: 'none' } as any}
                />
                <div onClick={addTask} style={{ padding: '18px 25px', background: '#4CAF50', color: '#000', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' } as any}>+</div>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {tasks.map(t => (
                <div 
                  key={`task-row-${t.id}-${t.done}`}
                  onClick={() => toggleTask(t.id, t.done)}
                  style={{ 
                    background: '#161816', padding: '20px', borderRadius: '18px', display: 'flex', gap: '20px', 
                    alignItems: 'center', border: '1px solid', borderColor: t.done ? '#2e7d32' : '#222',
                    opacity: t.done ? 0.4 : 1, transition: '0.2s'
                  } as any}
                >
                  <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: '2px solid #4CAF50', backgroundColor: t.done ? '#4CAF50' : 'transparent', textAlign: 'center', color: '#000', fontWeight: 'bold' } as any}>
                    {t.done && '✓'}
                  </div>
                  <span style={{ flex: 1, fontSize: '16px', textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
                  <div onClick={(e) => deleteTask(t.id, e)} style={{ color: '#444', fontSize: '18px', cursor: 'pointer', padding: '5px' } as any}>✕</div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' } as any}>
                        <span style={{ fontSize: '16px', color: '#4CAF50', fontWeight: 'bold' }}>{progressPercent}%</span>
                        <div onClick={resetProgress} style={{ fontSize: '12px', color: '#cc4444', cursor: 'pointer', textDecoration: 'underline' } as any}>СБРОС</div>
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
                        key={`lesson-card-${lesson.id}-${isDone}`} 
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
                <div onClick={() => {setSelectedLessonId(null); setActiveAnswer(null);}} style={{ color: '#4CAF50', cursor: 'pointer', marginBottom: '30px', display: 'inline-flex', alignItems: 'center', gap: '8px' } as any}>← Назад</div>
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
                          key={`ans-choice-${selectedLessonId}-${idx}-${isSelected}`}
                          onClick={(e) => { 
                             e.stopPropagation(); 
                             setActiveAnswer(idx);
                             if (isCorrect) saveLessonProgress(currentLesson.id);
                          }}
                          style={{ 
                            padding: '18px 25px', borderRadius: '16px', cursor: 'pointer', border: '1px solid',
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