"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../supabaseClient';

// --- БАЗОВЫЕ ЗАДАЧИ (ЕСТЬ ВСЕГДА) ---
const DEFAULT_TASKS = [
  { text: "Проверить фильтры и набрать воду", done: false },
  { text: "Протереть витрины и полки", done: false },
  { text: "Включить и откалибровать весы", done: false }
];

// --- РАСШИРЕННОЕ ОБУЧЕНИЕ ---
const LESSONS_DATABASE = [
  {
    id: "lesson_1",
    title: "🍃 Основы: Ферментация",
    content: "Ферментация — это процесс окисления чайного листа. Зеленый чай — 5-10%, Красный — 90-100%.",
    question: "Какой чай окислен на 100%?",
    options: ["Зеленый", "Красный", "Белый"],
    correct: 1 
  },
  {
    id: "lesson_2",
    title: "🍵 Температурные режимы",
    content: "Светлые чаи: 75-80°C. Темные и Пуэры: 95-100°C.",
    question: "Как заварить Шу Пуэр?",
    options: ["80°C", "100°C", "70°C"],
    correct: 1
  },
  {
    id: "lesson_3",
    title: "🧘 Габа: Спокойствие",
    content: "Габа-чай содержит ГАМК, которая помогает мозгу расслабиться.",
    question: "В чем особенность Габа-чая?",
    options: ["Много кофеина", "Содержит ГАМК", "Очень горький"],
    correct: 1
  },
  {
    id: "lesson_4",
    title: "🌑 Пуэры: Шу и Шен",
    content: "Шу Пуэр — темный, землистый. Шен — светлый, с кислинкой.",
    question: "Какой пуэр имеет землистый вкус?",
    options: ["Шен", "Шу", "Оба"],
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

  // ЗАГРУЗКА ДАННЫХ
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Загружаем задачи
      let { data: tasksData } = await supabase.from('tasks').select('*').order('id', { ascending: true });
      
      // Если в облаке совсем пусто, добавляем базовые задачи
      if (!tasksData || tasksData.length === 0) {
        await supabase.from('tasks').insert(DEFAULT_TASKS);
        let { data: updatedTasks } = await supabase.from('tasks').select('*').order('id', { ascending: true });
        setTasks(updatedTasks || []);
      } else {
        setTasks(tasksData);
      }

      // 2. Загружаем прогресс обучения
      const { data: progressData } = await supabase.from('lesson_progress').select('lesson_id');
      if (progressData) {
        setCompletedLessons(progressData.map(p => p.lesson_id));
      }
    } catch (err) {
      console.error("Ошибка Supabase:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- УПРАВЛЕНИЕ ЗАДАЧАМИ ---
  const addTask = async () => {
    if (!newTaskText.trim()) return;
    const { error } = await supabase.from('tasks').insert([{ text: newTaskText, done: false }]);
    if (!error) {
      setNewTaskText("");
      fetchData();
    }
  };

  const toggleTask = async (id: number, currentDone: boolean) => {
    await supabase.from('tasks').update({ done: !currentDone }).eq('id', id);
    fetchData();
  };

  const deleteTask = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('tasks').delete().eq('id', id);
    fetchData();
  };

  // --- УПРАВЛЕНИЕ ОБУЧЕНИЕМ ---
  const saveLessonProgress = async (lessonId: string) => {
    if (!completedLessons.includes(lessonId)) {
        await supabase.from('lesson_progress').insert([{ lesson_id: lessonId }]);
        fetchData();
    }
  };

  const resetProgress = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Сбросить весь прогресс обучения?")) {
      await supabase.from('lesson_progress').delete().neq('lesson_id', 'null');
      setCompletedLessons([]);
      fetchData();
    }
  };

  const progressPercent = Math.round((completedLessons.length / LESSONS_DATABASE.length) * 100);
  const currentLesson = LESSONS_DATABASE.find(l => l.id === selectedLessonId);

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      <Navigation />
      
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        
        {/* ТАБЫ */}
        <div style={{ display: 'flex', gap: '12px', background: '#161816', padding: '8px', borderRadius: '18px', marginBottom: '40px', border: '1px solid #222' } as any}>
          <div 
            onClick={() => setActiveTab('checklist')}
            style={{ flex: 1, padding: '15px', borderRadius: '14px', textAlign: 'center', cursor: 'pointer', backgroundColor: activeTab === 'checklist' ? '#4CAF50' : 'transparent', color: activeTab === 'checklist' ? '#000' : '#555', fontWeight: 'bold' } as any}
          >📋 Чек-лист</div>
          <div 
            onClick={() => setActiveTab('edu')}
            style={{ flex: 1, padding: '15px', borderRadius: '14px', textAlign: 'center', cursor: 'pointer', backgroundColor: activeTab === 'edu' ? '#4CAF50' : 'transparent', color: activeTab === 'edu' ? '#000' : '#555', fontWeight: 'bold' } as any}
          >🎓 Обучение</div>
        </div>

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
                <div onClick={addTask} style={{ padding: '18px 25px', background: '#4CAF50', color: '#000', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '20px' } as any}>+</div>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {tasks.map(t => (
                <div key={`task-${t.id}-${t.done}`} onClick={() => toggleTask(t.id, t.done)} style={{ background: '#161816', padding: '20px', borderRadius: '18px', display: 'flex', border: '1px solid', borderColor: t.done ? '#2e7d32' : '#222', alignItems: 'center', opacity: t.done ? 0.5 : 1, transition: '0.2s' } as any}>
                  <div style={{ width: '22px', height: '22px', border: '2px solid #4CAF50', backgroundColor: t.done ? '#4CAF50' : 'transparent', marginRight: '15px', borderRadius: '6px', textAlign: 'center', color: '#000', fontWeight: 'bold' } as any}>{t.done && '✓'}</div>
                  <span style={{ flex: 1, textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
                  <div onClick={(e) => deleteTask(t.id, e)} style={{ color: '#444', cursor: 'pointer' }}>✕</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'edu' && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            {!selectedLessonId ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px' } as any}>
                    <h2 style={{ fontSize: '28px', margin: 0 }}>База знаний</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' } as any}>
                        <span style={{ fontSize: '16px', color: '#4CAF50', fontWeight: 'bold' }}>{progressPercent}%</span>
                        <div onClick={resetProgress} style={{ fontSize: '12px', color: '#cc4444', cursor: 'pointer', textDecoration: 'underline' } as any}>сброс</div>
                    </div>
                </div>
                
                <div style={{ width: '100%', height: '10px', background: '#161816', borderRadius: '10px', overflow: 'hidden', border: '1px solid #222', marginBottom: '35px' } as any}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: '#4CAF50', transition: 'width 0.5s ease' } as any} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' } as any}>
                  {LESSONS_DATABASE.map(lesson => {
                    const isDone = completedLessons.includes(lesson.id);
                    return (
                      <div key={lesson.id} onClick={() => { setSelectedLessonId(lesson.id); setActiveAnswer(null); }} style={{ background: '#161816', padding: '30px', borderRadius: '24px', border: '1px solid', borderColor: isDone ? '#2e7d32' : '#222', cursor: 'pointer' } as any}>
                        <h3 style={{ margin: '0 0 10px 0', color: isDone ? '#4CAF50' : '#fff' }}>{lesson.title}</h3>
                        <div style={{ fontSize: '12px', color: isDone ? '#2e7d32' : '#555' }}>{isDone ? 'Пройдено ✓' : 'Начать изучение →'}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ background: '#161816', padding: '40px', borderRadius: '30px', border: '1px solid #222' } as any}>
                <div onClick={() => setSelectedLessonId(null)} style={{ color: '#4CAF50', cursor: 'pointer', marginBottom: '30px', fontWeight: 'bold' } as any}>← Назад</div>
                <h2 style={{ marginBottom: '20px' }}>{currentLesson?.title}</h2>
                <p style={{ lineHeight: '1.8', color: '#ccc', marginBottom: '40px' }}>{currentLesson?.content}</p>
                
                <div style={{ borderTop: '1px solid #333', paddingTop: '30px' } as any}>
                  <h4 style={{ marginBottom: '20px', color: '#4CAF50' }}>📝 ТЕСТ: {currentLesson?.question}</h4>
                  {currentLesson?.options.map((opt, idx) => {
                    const isActive = activeAnswer === idx;
                    const isCorrect = idx === currentLesson.correct;
                    return (
                      <div 
                        key={`ans-${idx}-${isActive}`} 
                        onClick={() => { setActiveAnswer(idx); if (isCorrect) saveLessonProgress(currentLesson.id); }} 
                        style={{ padding: '18px', background: isActive ? (isCorrect ? '#2e7d32' : '#d32f2f') : '#0d0f0d', borderRadius: '12px', marginBottom: '10px', cursor: 'pointer', border: '1px solid #333', color: isActive ? '#fff' : '#888' } as any}
                      >
                        {opt}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}