"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../supabaseClient';

const LESSONS_DATABASE = [
  { id: "lesson_1", title: "🍃 Основы: Ферментация", content: "Ферментация — это процесс окисления чайного листа. Чем выше уровень ферментации, тем темнее чай.", question: "Какой чай проходит процесс окисления почти на 100%?", options: ["Зеленый чай", "Красный чай", "Белый чай"], correct: 1 },
  { id: "lesson_2", title: "🍵 Температурные режимы", content: "Нежные почки белого чая сгорают в кипятке (нужно 70-75°C). Улуны любят 85-90°C.", question: "Какая температура идеальна для белого чая?", options: ["100°C", "85°C", "70-75°C"], correct: 2 }
];

export default function ShiftPage() {
  const [activeTab, setActiveTab] = useState<'checklist' | 'edu'>('checklist');
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [activeAnswer, setActiveAnswer] = useState<number | null>(null);

  const fetchData = async () => {
    const { data: t } = await supabase.from('tasks').select('*').order('id', { ascending: true });
    if (t) setTasks(t);
    const { data: p } = await supabase.from('lesson_progress').select('lesson_id');
    if (p) setCompletedLessons(p.map(i => i.lesson_id));
  };

  useEffect(() => { fetchData(); }, []);

  const addTask = async () => {
    if (!newTaskText.trim()) return;
    await supabase.from('tasks').insert([{ text: newTaskText, done: false }]);
    setNewTaskText(""); fetchData();
  };

  const toggleTask = async (id: number, current: boolean) => {
    await supabase.from('tasks').update({ done: !current }).eq('id', id);
    fetchData();
  };

  const progressPercent = Math.round((completedLessons.length / LESSONS_DATABASE.length) * 100);
  const currentLesson = LESSONS_DATABASE.find(l => l.id === selectedLessonId);

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      <Navigation />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        <div style={{ display: 'flex', gap: '12px', background: '#161816', padding: '8px', borderRadius: '18px', marginBottom: '40px' } as any}>
          {['checklist', 'edu'].map(tab => (
            <div key={tab} onClick={() => { setActiveTab(tab as any); setSelectedLessonId(null); }} style={{ flex: 1, padding: '15px', borderRadius: '14px', textAlign: 'center', cursor: 'pointer', backgroundColor: activeTab === tab ? '#4CAF50' : 'transparent', color: activeTab === tab ? '#000' : '#555', fontWeight: 'bold' } as any}>{tab === 'checklist' ? '📋 Чек-лист' : '🎓 Обучение'}</div>
          ))}
        </div>

        {activeTab === 'checklist' ? (
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' } as any}>
              <input value={newTaskText} onChange={e => setNewTaskText(e.target.value)} style={{ flex: 1, padding: '18px', borderRadius: '15px', background: '#161816', border: '1px solid #333', color: '#fff' }} placeholder="Новая задача..." />
              <div onClick={addTask} style={{ padding: '18px 25px', background: '#4CAF50', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold' }}>+</div>
            </div>
            {tasks.map(t => (
              <div key={t.id} onClick={() => toggleTask(t.id, t.done)} style={{ background: '#161816', padding: '20px', borderRadius: '18px', display: 'flex', border: '1px solid', borderColor: t.done ? '#2e7d32' : '#222', marginBottom: '10px', opacity: t.done ? 0.5 : 1 } as any}>
                <div style={{ width: '22px', height: '22px', border: '2px solid #4CAF50', backgroundColor: t.done ? '#4CAF50' : 'transparent', marginRight: '15px', borderRadius: '6px' }}>{t.done && '✓'}</div>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        ) : (
          /* ОБУЧЕНИЕ */
          <div>
            {!selectedLessonId ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' } as any}><h2>Обучение</h2><span>{progressPercent}%</span></div>
                <div style={{ width: '100%', height: '10px', background: '#161816', borderRadius: '10px', overflow: 'hidden', marginBottom: '30px' }}><div style={{ width: `${progressPercent}%`, height: '100%', background: '#4CAF50', transition: '0.5s' }} /></div>
                <div style={{ display: 'grid', gap: '15px' }}>
                  {LESSONS_DATABASE.map(l => (
                    <div key={l.id} onClick={() => setSelectedLessonId(l.id)} style={{ background: '#161816', padding: '25px', borderRadius: '20px', border: '1px solid', borderColor: completedLessons.includes(l.id) ? '#2e7d32' : '#222' } as any}><h3>{l.title}</h3></div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ background: '#161816', padding: '30px', borderRadius: '25px' } as any}>
                <div onClick={() => setSelectedLessonId(null)} style={{ color: '#4CAF50', cursor: 'pointer', marginBottom: '20px' }}>← Назад</div>
                <h2>{currentLesson?.title}</h2><p style={{ lineHeight: '1.8', color: '#bbb' }}>{currentLesson?.content}</p>
                <div style={{ marginTop: '30px', borderTop: '1px solid #333', paddingTop: '20px' }}>
                  <h4>Тест: {currentLesson?.question}</h4>
                  {currentLesson?.options.map((o, i) => (
                    <div key={i} onClick={async () => { setActiveAnswer(i); if (i === currentLesson.correct) await supabase.from('lesson_progress').insert([{ lesson_id: currentLesson.id }]); fetchData(); }} style={{ padding: '15px', background: '#0d0f0d', border: '1px solid #333', borderRadius: '10px', marginTop: '10px', cursor: 'pointer', backgroundColor: activeAnswer === i ? (i === currentLesson.correct ? '#2e7d32' : '#d32f2f') : '#0d0f0d' } as any}>{o}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}