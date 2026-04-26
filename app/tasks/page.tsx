"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '@/app/components/Navigation';
import { supabase } from '../supabaseClient';

const LESSONS_DATABASE = [
  { id: "lesson_1", title: "🍃 Основы: Ферментация", content: "Ферментация — это окисление листа. Зеленый — 5-10%, Красный — 90-100%.", question: "Какой чай окислен почти полностью?", options: ["Зеленый", "Красный", "Белый"], correct: 1 },
  { id: "lesson_2", title: "🍵 Температуры", content: "Зеленый: 75-80°C. Пуэр: 95-100°C.", question: "Как заварим Шу Пуэр?", options: ["80°C", "100°C", "70°C"], correct: 1 },
  { id: "lesson_3", title: "🧘 Габа: ГАМК", content: "Габа делается без кислорода. Помогает расслабиться.", question: "В чем фишка Габы?", options: ["Кофеин", "ГАМК", "Сахар"], correct: 1 }
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

  const deleteT = async (id: number) => {
    await supabase.from('tasks').delete().eq('id', id);
    fetchData();
  };

  const saveProgress = async (lId: string) => {
    if (!completedLessons.includes(lId)) {
      await supabase.from('lesson_progress').insert([{ lesson_id: lId }]);
      fetchData();
    }
  };

  const resetProgress = async () => {
    if (confirm("Сбросить прогресс?")) {
      await supabase.from('lesson_progress').delete().neq('id', 0);
      fetchData();
    }
  };

  const progressPercent = Math.round((completedLessons.length / LESSONS_DATABASE.length) * 100);
  const currentLesson = LESSONS_DATABASE.find(l => l.id === selectedLessonId);

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      <Navigation />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        <div style={{ display: 'flex', gap: '12px', background: '#161816', padding: '8px', borderRadius: '18px', marginBottom: '40px' } as any}>
          {['checklist', 'edu'].map(tab => (
            <div key={tab} onClick={() => {setActiveTab(tab as any); setSelectedLessonId(null);}} style={{ flex: 1, padding: '15px', borderRadius: '14px', textAlign: 'center', cursor: 'pointer', backgroundColor: activeTab === tab ? '#4CAF50' : 'transparent', color: activeTab === tab ? '#000' : '#555', fontWeight: 'bold' } as any}>
              {tab === 'checklist' ? '📋 Чек-лист' : '🎓 Обучение'}
            </div>
          ))}
        </div>

        {activeTab === 'checklist' ? (
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' } as any}>
              <input value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} style={{ flex: 1, padding: '18px', borderRadius: '15px', background: '#161816', border: '1px solid #333', color: '#fff', outline: 'none' }} placeholder="Новая задача..." />
              <div onClick={addTask} style={{ padding: '18px 25px', background: '#4CAF50', borderRadius: '15px', cursor: 'pointer', color: '#000', fontWeight: 'bold' }}>+</div>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              {tasks.map(t => (
                <div key={`task-${t.id}-${t.done}`} onClick={() => toggleTask(t.id, t.done)} style={{ background: '#161816', padding: '20px', borderRadius: '18px', display: 'flex', border: '1px solid', borderColor: t.done ? '#2e7d32' : '#222', alignItems: 'center' } as any}>
                  <div style={{ width: '22px', height: '22px', border: '2px solid #4CAF50', backgroundColor: t.done ? '#4CAF50' : 'transparent', marginRight: '15px', borderRadius: '6px' }}></div>
                  <span style={{ flex: 1, textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
                  <div onClick={(e) => { e.stopPropagation(); deleteT(t.id); }} style={{color: '#444', cursor: 'pointer'}}>✕</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {!selectedLessonId ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' } as any}>
                  <h2>Твой прогресс</h2>
                  <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                    <span style={{color:'#4CAF50', fontWeight:'bold'}}>{progressPercent}%</span>
                    <div onClick={resetProgress} style={{fontSize:'12px', color:'#cc4444', cursor:'pointer', textDecoration:'underline'}}>сброс</div>
                  </div>
                </div>
                <div style={{ width: '100%', height: '10px', background: '#161816', borderRadius: '10px', overflow: 'hidden', marginBottom: '30px', border:'1px solid #222' }}><div style={{ width: `${progressPercent}%`, height: '100%', background: '#4CAF50', transition: '0.5s' }} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {LESSONS_DATABASE.map(l => (
                    <div key={l.id} onClick={() => {setSelectedLessonId(l.id); setActiveAnswer(null);}} style={{ background: '#161816', padding: '30px', borderRadius: '25px', border: '1px solid', borderColor: completedLessons.includes(l.id) ? '#2e7d32' : '#222', cursor: 'pointer' } as any}>
                      <h3 style={{margin:0, color: completedLessons.includes(l.id) ? '#4CAF50' : '#fff'}}>{l.title}</h3>
                      <p style={{fontSize:'12px', color:'#444', marginTop:'10px'}}>{completedLessons.includes(l.id) ? 'Пройдено ✓' : 'Начать →'}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ background: '#161816', padding: '40px', borderRadius: '30px', border: '1px solid #222' } as any}>
                <div onClick={() => setSelectedLessonId(null)} style={{ color: '#4CAF50', cursor: 'pointer', marginBottom: '30px', fontWeight: 'bold' }}>← Назад</div>
                <h2>{currentLesson?.title}</h2>
                <p style={{ lineHeight: '1.8', color: '#bbb', margin: '20px 0 40px 0' }}>{currentLesson?.content}</p>
                <div style={{ borderTop: '1px solid #222', paddingTop: '30px' }}>
                  <h4 style={{marginBottom: '20px', color: '#4CAF50'}}>ТЕСТ: {currentLesson?.question}</h4>
                  {currentLesson?.options.map((o, i) => {
                    const isCorrect = i === currentLesson.correct;
                    const isSelected = activeAnswer === i;
                    return (
                      <div key={`ans-${i}-${isSelected}`} onClick={() => {setActiveAnswer(i); if(isCorrect) saveProgress(currentLesson.id);}} style={{ padding: '18px', background: isSelected ? (isCorrect ? '#2e7d32' : '#d32f2f') : '#0d0f0d', border: '1px solid #333', borderRadius: '15px', marginTop: '12px', cursor: 'pointer', color: isSelected ? '#fff' : '#888' } as any}>{o}</div>
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