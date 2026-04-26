"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../supabaseClient';

const LESSONS_DATABASE = [
  { id: "lesson_1", title: "🍃 Основы: Ферментация", content: "Ферментация — это процесс окисления чайного листа.", question: "Зеленый чай сильно окислен?", options: ["Да", "Нет", "На 50%"], correct: 1 },
  { id: "lesson_2", title: "🍵 Температуры", content: "Белый чай: 75°C, Пуэр: 95°C.", question: "Какая вода нужна для белого чая?", options: ["Кипяток", "75°C", "Холодная"], correct: 1 }
];

export default function ShiftPage() {
  const [activeTab, setActiveTab] = useState<'checklist' | 'edu'>('checklist');
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [activeAnswer, setActiveAnswer] = useState<number | null>(null);

  // Загрузка
  const syncWithCloud = async () => {
    const { data } = await supabase.from('tasks').select('*').order('id', { ascending: true });
    if (data) setTasks(data);
    const { data: progress } = await supabase.from('lesson_progress').select('lesson_id');
    if (progress) setCompletedLessons(progress.map(p => p.lesson_id));
  };

  useEffect(() => { syncWithCloud(); }, []);

  // --- УПРАВЛЕНИЕ ЗАДАЧАМИ (ИСПРАВЛЕНО) ---
  const addTask = async () => {
    // console.log для проверки в F12
    console.log("Попытка добавить задачу:", newTaskText);

    if (!newTaskText.trim()) {
      alert("Сначала введи текст задачи!");
      return;
    }

    try {
      // 1. Сразу добавляем в список (чтобы ты видел результат мгновенно)
      const tempId = Date.now();
      const optimisticTask = { id: tempId, text: newTaskText, done: false };
      setTasks(prev => [...prev, optimisticTask]);
      const textToSave = newTaskText;
      setNewTaskText("");

      // 2. Отправляем в Supabase
      const { error } = await supabase
        .from('tasks')
        .insert([{ text: textToSave, done: false }]);

      if (error) throw error;
      
      // 3. Обновляем список, чтобы получить реальный ID
      syncWithCloud();

    } catch (e: any) {
      alert("Ошибка Supabase: " + e.message);
      syncWithCloud(); // Откатываем список в случае ошибки
    }
  };

  const toggleTask = async (id: any, currentDone: boolean) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !currentDone } : t));
    await supabase.from('tasks').update({ done: !currentDone }).eq('id', id);
  };

  const deleteTask = async (id: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(tasks.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  const progressPercent = Math.round((completedLessons.length / LESSONS_DATABASE.length) * 100);
  const currentLesson = LESSONS_DATABASE.find(l => l.id === selectedLessonId);

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0', userSelect: 'none' } as any}>
      <Navigation />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        
        {/* ТАБЫ */}
        <div style={{ display: 'flex', gap: '10px', background: '#161816', padding: '8px', borderRadius: '18px', marginBottom: '40px' } as any}>
          <div onClick={() => setActiveTab('checklist')} style={{ flex: 1, padding: '15px', borderRadius: '14px', textAlign: 'center', cursor: 'pointer', backgroundColor: activeTab === 'checklist' ? '#4CAF50' : 'transparent', color: activeTab === 'checklist' ? '#000' : '#fff', fontWeight: 'bold' } as any}>📋 Чек-лист</div>
          <div onClick={() => setActiveTab('edu')} style={{ flex: 1, padding: '15px', borderRadius: '14px', textAlign: 'center', cursor: 'pointer', backgroundColor: activeTab === 'edu' ? '#4CAF50' : 'transparent', color: activeTab === 'edu' ? '#000' : '#fff', fontWeight: 'bold' } as any}>🎓 Обучение</div>
        </div>

        {activeTab === 'checklist' ? (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <h2 style={{ marginBottom: '25px' }}>Рабочая смена</h2>
            
            {/* ФОРМА ДОБАВЛЕНИЯ */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', position: 'relative', zIndex: 10 } as any}>
                <input 
                  type="text" 
                  placeholder="Добавить задачу..." 
                  value={newTaskText} 
                  onChange={(e) => setNewTaskText(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && addTask()} 
                  style={{ flex: 1, padding: '18px', borderRadius: '15px', background: '#161816', border: '1px solid #333', color: '#fff', outline: 'none' } as any} 
                />
                <button 
                  onClick={addTask} 
                  style={{ padding: '0 30px', background: '#4CAF50', color: '#000', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', border: 'none', fontSize: '24px' } as any}
                >
                  +
                </button>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {tasks.map(t => (
                <div key={t.id} onClick={() => toggleTask(t.id, t.done)} style={{ background: '#161816', padding: '20px', borderRadius: '18px', display: 'flex', border: '1px solid', borderColor: t.done ? '#2e7d32' : '#222', alignItems: 'center', opacity: t.done ? 0.5 : 1 } as any}>
                  <div style={{ width: '24px', height: '24px', border: '2px solid #4CAF50', backgroundColor: t.done ? '#4CAF50' : 'transparent', marginRight: '15px', borderRadius: '6px', textAlign: 'center', color: '#000', fontWeight: 'bold', lineHeight: '22px' } as any}>{t.done && '✓'}</div>
                  <span style={{ flex: 1 }}>{t.text}</span>
                  <div onClick={(e) => deleteTask(t.id, e)} style={{ color: '#444', fontSize: '18px', cursor: 'pointer' }}>✕</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#444' }}>Раздел обучения загружен.</div>
        )}
      </main>
    </div>
  );
}