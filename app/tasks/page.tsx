"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../supabaseClient';

const LESSONS_DATABASE = [
  { id: "lesson_1", title: "🍃 Основы: Ферментация", content: "Ферментация — это процесс окисления чайного листа. Зеленый чай — 5-10%, Красный — 90-100%.", question: "Какой чай окислен почти на 100%?", options: ["Зеленый чай", "Красный чай", "Белый чай"], correct: 1 },
  { id: "lesson_2", title: "🍵 Температурные режимы", content: "Светлые чаи: 75-80°C. Темные и Пуэры: 95-100°C.", question: "Какая температура идеальна для белого чая?", options: ["100°C", "85°C", "70-75°C"], correct: 2 },
  { id: "lesson_3", title: "🧘 Габа: Спокойствие", content: "Габа-чай содержит ГАМК, которая помогает мозгу расслабиться.", question: "В чем особенность Габа-чая?", options: ["Много кофеина", "Содержит ГАМК", "Очень горький"], correct: 1 },
  { id: "lesson_4", title: "🌑 Пуэры: Шу и Шен", content: "Шу Пуэр — темный, землистый. Шен — светлый, с кислинкой.", question: "Какой пуэр имеет землистый вкус?", options: ["Шен", "Шу", "Оба"], correct: 1 }
];

export default function ShiftPage() {
  const [activeTab, setActiveTab] = useState<'checklist' | 'edu'>('checklist');
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [activeAnswer, setActiveAnswer] = useState<number | null>(null);

  // ЗАГРУЗКА
  const fetchData = async () => {
    try {
      const { data: t } = await supabase.from('tasks').select('*').order('id', { ascending: true });
      if (t) setTasks(t);
      const { data: p } = await supabase.from('lesson_progress').select('lesson_id');
      if (p) setCompletedLessons(p.map(i => i.lesson_id));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- УПРАВЛЕНИЕ ЗАДАЧАМИ ---
  const addTask = async () => {
    if (!newTaskText.trim()) return;
    const textToSave = newTaskText;
    setNewTaskText(""); // Сразу очищаем поле

    const { error } = await supabase
      .from('tasks')
      .insert([{ text: textToSave, done: false }]);

    if (error) {
      alert("Ошибка облака: " + error.message);
      setNewTaskText(textToSave); // Возвращаем текст в случае ошибки
    } else {
      fetchData(); // Обновляем список
    }
  };

  const toggleTask = async (id: any, currentDone: boolean) => {
    // Оптимистичное обновление (сразу на экране)
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !currentDone } : t));
    await supabase.from('tasks').update({ done: !currentDone }).eq('id', id);
  };

  const deleteTask = async (id: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(tasks.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  // --- ОБУЧЕНИЕ ---
  const saveEduProgress = async (lId: string) => {
    if (!completedLessons.includes(lId)) {
      setCompletedLessons(prev => [...prev, lId]);
      await supabase.from('lesson_progress').insert([{ lesson_id: lId }]);
    }
  };

  const resetProgress = async () => {
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
        
        <div style={{ display: 'flex', gap: '10px', background: '#161816', padding: '8px', borderRadius: '18px', marginBottom: '40px', border: '1px solid #222' } as any}>
          <div onClick={() => setActiveTab('checklist')} style={{ flex: 1, padding: '15px', borderRadius: '14px', textAlign: 'center', cursor: 'pointer', backgroundColor: activeTab === 'checklist' ? '#4CAF50' : 'transparent', color: activeTab === 'checklist' ? '#000' : '#555', fontWeight: 'bold' } as any}>📋 Чек-лист</div>
          <div onClick={() => setActiveTab('edu')} style={{ flex: 1, padding: '15px', borderRadius: '14px', textAlign: 'center', cursor: 'pointer', backgroundColor: activeTab === 'edu' ? '#4CAF50' : 'transparent', color: activeTab === 'edu' ? '#000' : '#555', fontWeight: 'bold' } as any}>🎓 Обучение</div>
        </div>

        {activeTab === 'checklist' ? (
          <div>
            <h2 style={{ marginBottom: '25px' }}>Рабочая смена</h2>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' } as any}>
                <input type="text" placeholder="Новая задача..." value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} style={{ flex: 1, padding: '18px', borderRadius: '15px', background: '#161816', border: '1px solid #333', color: '#fff', outline: 'none' } as any} />
                <button onClick={addTask} style={{ padding: '0 30px', background: '#4CAF50', color: '#000', borderRadius: '15px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '24px' } as any}>+</button>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              {tasks.map(t => (
                <div key={`task-${t.id}`} onClick={() => toggleTask(t.id, t.done)} style={{ background: '#161816', padding: '20px', borderRadius: '18px', display: 'flex', border: '1px solid', borderColor: t.done ? '#2e7d32' : '#222', alignItems: 'center', opacity: t.done ? 0.5 : 1, transition: '0.2s' } as any}>
                  <div style={{ width: '24px', height: '24px', border: '2px solid #4CAF50', backgroundColor: t.done ? '#4CAF50' : 'transparent', marginRight: '15px', borderRadius: '6px', textAlign: 'center', color: '#000', fontWeight: 'bold', lineHeight: '22px' } as any}>{t.done && '✓'}</div>
                  <span style={{ flex: 1 }}>{t.text}</span>
                  <div onClick={(e) => deleteTask(t.id, e)} style={{ color: '#444', fontSize: '18px', cursor: 'pointer' }}>✕</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ОБУЧЕНИЕ */
          <div>
            {!selectedLessonId ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px' } as any}>
                    <h2 style={{ fontSize: '28px', margin: 0 }}>База знаний</h2>
                    <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                        <span style={{color: '#4CAF50', fontWeight: 'bold'}}>{progressPercent}%</span>
                        <div onClick={resetProgress} style={{fontSize:'12px', color:'#cc4444', cursor:'pointer', textDecoration: 'underline'}}>сбросить</div>
                    </div>
                </div>
                <div style={{ width: '100%', height: '10px', background: '#161816', borderRadius: '10px', overflow: 'hidden', marginBottom: '30px', border:'1px solid #222' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: '#4CAF50', transition: '0.5s' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {LESSONS_DATABASE.map(l => {
                    const isDone = completedLessons.includes(l.id);
                    return (
                      <div key={l.id} onClick={() => { setSelectedLessonId(l.id); setActiveAnswer(null); }} style={{ background: '#161816', padding: '30px', borderRadius: '25px', border: '1px solid', borderColor: isDone ? '#2e7d32' : '#222', cursor: 'pointer' } as any}>
                        <h3 style={{ margin: 0, color: isDone ? '#4CAF50' : '#fff' }}>{l.title}</h3>
                        <p style={{marginTop:'10px', color:'#444', fontSize:'13px'}}>{isDone ? 'Пройдено ✓' : 'Начать →'}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ background: '#161816', padding: '40px', borderRadius: '30px', border: '1px solid #222' } as any}>
                <div onClick={() => setSelectedLessonId(null)} style={{ color: '#4CAF50', cursor: 'pointer', marginBottom: '30px', fontWeight: 'bold' }}>← Назад</div>
                <h2 style={{marginBottom: '20px'}}>{currentLesson?.title}</h2>
                <p style={{lineHeight: '1.8', color: '#bbb', marginBottom: '40px'}}>{currentLesson?.content}</p>
                <div style={{ borderTop: '1px solid #333', paddingTop: '30px' }}>
                    <h4 style={{color:'#4CAF50', marginBottom:'20px'}}>ТЕСТ: {currentLesson?.question}</h4>
                    {currentLesson?.options.map((o, i) => {
                        const isCorrect = i === currentLesson?.correct;
                        const isSelected = activeAnswer === i;
                        return (
                            <div key={`ans-${i}-${isSelected}`} onClick={() => { setActiveAnswer(i); if(isCorrect) saveEduProgress(currentLesson.id); }} style={{ padding: '18px', background: isSelected ? (isCorrect ? '#2e7d32' : '#d32f2f') : '#0d0f0d', borderRadius: '15px', marginTop: '10px', cursor: 'pointer', border: '1px solid #333', color: isSelected ? '#fff' : '#888' } as any}>{o}</div>
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