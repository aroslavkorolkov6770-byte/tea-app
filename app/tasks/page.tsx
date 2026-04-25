"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../../lib/supabaseClient';

export default function ShiftPage() {
  const [activeTab, setActiveTab] = useState<'checklist' | 'edu'>('checklist');
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

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

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      <Navigation />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        <div style={{ display: 'flex', gap: '12px', background: '#161816', padding: '8px', borderRadius: '18px', marginBottom: '40px' } as any}>
          <div onClick={() => setActiveTab('checklist')} style={{ flex: 1, padding: '15px', borderRadius: '14px', textAlign: 'center', cursor: 'pointer', backgroundColor: activeTab === 'checklist' ? '#4CAF50' : 'transparent', color: activeTab === 'checklist' ? '#000' : '#fff' } as any}>📋 Чек-лист</div>
          <div onClick={() => setActiveTab('edu')} style={{ flex: 1, padding: '15px', borderRadius: '14px', textAlign: 'center', cursor: 'pointer', backgroundColor: activeTab === 'edu' ? '#4CAF50' : 'transparent', color: activeTab === 'edu' ? '#000' : '#fff' } as any}>🎓 Обучение</div>
        </div>

        {activeTab === 'checklist' && (
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' } as any}>
              <input value={newTaskText} onChange={e => setNewTaskText(e.target.value)} style={{ flex: 1, padding: '18px', borderRadius: '15px', background: '#161816', border: '1px solid #333', color: '#fff' }} placeholder="Новая задача..." />
              <div onClick={addTask} style={{ padding: '18px 25px', background: '#4CAF50', borderRadius: '15px', cursor: 'pointer' }}>+</div>
            </div>
            {tasks.map(t => (
              <div key={t.id} onClick={() => toggleTask(t.id, t.done)} style={{ background: '#161816', padding: '20px', borderRadius: '18px', display: 'flex', border: '1px solid', borderColor: t.done ? '#2e7d32' : '#222', marginBottom: '10px' } as any}>
                <div style={{ width: '22px', height: '22px', border: '2px solid #4CAF50', backgroundColor: t.done ? '#4CAF50' : 'transparent', marginRight: '15px' }}></div>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}